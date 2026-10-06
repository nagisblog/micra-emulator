import './styles/base.css';
import './styles/layout.css';
import './styles/modal.css';
import './styles/device.css';
import { DIGIT_COUNT, Micra, formatDigits, placeValue } from './core/micra';
import { detectLang, messages, saveLang, type Lang } from './i18n';
import { buildDevice } from './ui/device';
import { Drum, nextSeq } from './ui/drum';
import { ResetLever } from './ui/lever';
import { SliderKey } from './ui/slider';

const ARTICLE_URL = 'https://www.nagisblog.com/posts/micra-addiator/';
const CARRY_DELAY_MS = 60;

const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const reducedMotion = () => reducedMotionQuery.matches;

const params = new URLSearchParams(location.search);
const isEmbed = params.get('embed') === '1';
if (isEmbed) document.body.classList.add('embed');

const app = document.querySelector<HTMLElement>('#app')!;
app.innerHTML = `
  <header class="site-header">
    <h1 data-i18n="title"></h1>
    <div class="header-actions">
      <button type="button" class="nav-btn" data-open-modal="guide" data-i18n="guideBtn"></button>
      <button type="button" class="nav-btn" data-open-modal="tutorial" data-i18n="tutorialBtn"></button>
      <div class="lang-switch" role="group">
        <button type="button" data-lang="ja">日本語</button>
        <button type="button" data-lang="en">English</button>
      </div>
    </div>
  </header>
  <main class="site-main">
    <p class="hint" data-i18n="hint"></p>
    <div class="stage"></div>
    <p class="kbd-help" data-i18n="keyboardHelp"></p>
    <div class="sr-only" aria-live="polite" id="live"></div>
  </main>
  <footer class="site-footer">
    <p><span data-i18n="footerNote"></span> <a href="${ARTICLE_URL}" target="_blank" rel="noopener" data-i18n="footerArticle"></a></p>
  </footer>
  <dialog class="modal" id="info-modal">
    <div class="modal-card">
      <div class="modal-view" data-modal-view="welcome">
        <h2 class="modal-title" data-i18n="welcomeTitle"></h2>
        <p class="modal-body" data-i18n="welcomeBody"></p>
        <div class="modal-actions">
          <button type="button" class="btn btn-primary" data-close-modal data-i18n="closeBtn"></button>
        </div>
      </div>
      <div class="modal-view" data-modal-view="guide" hidden>
        <h2 class="modal-title" data-i18n="guideBtn"></h2>
        <div class="guide-content" id="guide-content"></div>
        <div class="modal-actions">
          <button type="button" class="btn btn-primary" data-close-modal data-i18n="closeBtn"></button>
        </div>
      </div>
      <div class="modal-view" data-modal-view="tutorial" hidden>
        <h2 class="modal-title" data-i18n="tutorialBtn"></h2>
        <p class="modal-body" data-i18n="tutorialPlaceholder"></p>
        <div class="modal-actions">
          <button type="button" class="btn" data-close-modal data-i18n="closeBtn"></button>
        </div>
      </div>
    </div>
  </dialog>
`;

const device = buildDevice();
app.querySelector('.stage')!.appendChild(device.root);
const live = app.querySelector<HTMLElement>('#live')!;
const modal = app.querySelector<HTMLDialogElement>('#info-modal')!;

type ModalView = 'welcome' | 'guide' | 'tutorial';
function openModal(view: ModalView): void {
  modal.querySelectorAll<HTMLElement>('[data-modal-view]').forEach((el) => {
    el.hidden = el.dataset.modalView !== view;
  });
  if (!modal.open) modal.showModal();
}

app.querySelectorAll<HTMLButtonElement>('[data-open-modal]').forEach((btn) => {
  btn.addEventListener('click', () => {
    openModal(btn.dataset.openModal as ModalView);
  });
});

app.querySelectorAll<HTMLButtonElement>('[data-close-modal]').forEach((btn) => {
  btn.addEventListener('click', () => modal.close());
});

modal.addEventListener('click', (e) => {
  if (e.target === modal) modal.close();
});

// ---- 状態 ----
const micra = new Micra();
/** ドラッグ中（未確定）の段数 */
const pending = new Map<number, number>();
const drums = device.reels.map((reel) => new Drum(reel, reducedMotion));
let lang: Lang = detectLang();

function displayTotal(): number {
  let t = micra.total;
  for (const [i, s] of pending) t += s * placeValue(i);
  return t;
}

/** ドラムの目標値を更新。sourceIndex より上位の桁は桁上がりとして少し遅らせる */
function renderDrums(sourceIndex: number | null): void {
  const total = displayTotal();
  const seq = nextSeq();
  drums.forEach((drum, i) => {
    const delay = sourceIndex !== null && i < sourceIndex ? (sourceIndex - i) * CARRY_DELAY_MS : 0;
    drum.setTarget(Math.floor(total / placeValue(i)), seq, delay);
  });
}

let liveTimer = 0;
function announce(): void {
  window.clearTimeout(liveTimer);
  liveTimer = window.setTimeout(() => {
    live.textContent = messages(lang).answer(formatDigits(micra.value));
  }, 300);
}

// ---- スライドキー ----
const sliders = device.strips.map(
  (strip, i) =>
    new SliderKey(
      i,
      strip,
      {
        onChange(index, steps) {
          pending.set(index, steps);
          renderDrums(index);
        },
        onCommit(index, steps) {
          pending.delete(index);
          micra.pull(index, steps);
          renderDrums(index);
          if (steps > 0) announce();
        },
      },
      reducedMotion,
    ),
);

function reset(): void {
  micra.reset();
  renderDrums(null);
  announce();
}

const lever = new ResetLever(device.lever, device.root, reset, reducedMotion);

// ---- キーボード ----
device.slots.forEach((slot, i) => {
  slot.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const next = (i + (e.key === 'ArrowLeft' ? -1 : 1) + DIGIT_COUNT) % DIGIT_COUNT;
      device.slots[next]!.focus();
      return;
    }
    const m = /^(?:Digit|Numpad)(\d)$/.exec(e.code);
    if (m && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      const d = Number(m[1]);
      sliders[i]!.pull(e.shiftKey ? 9 - d : d);
    }
  });
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !modal.open) lever.pull();
});

// ---- 言語 ----
function applyLang(next: Lang): void {
  lang = next;
  const t = messages(lang);
  document.documentElement.lang = lang;
  document.title = t.htmlTitle;
  document.querySelector('meta[name="description"]')?.setAttribute('content', t.description);
  app.querySelectorAll<HTMLElement>('[data-i18n]').forEach((node) => {
    const key = node.dataset.i18n as keyof typeof t;
    const v = t[key];
    if (typeof v === 'string') node.textContent = v;
  });
  const guideContent = app.querySelector<HTMLElement>('#guide-content')!;
  guideContent.replaceChildren(
    ...t.guideSections.map((sec) => {
      const section = document.createElement('section');
      section.className = 'guide-section';
      const h3 = document.createElement('h3');
      h3.textContent = sec.title;
      section.appendChild(h3);
      for (const pText of sec.paragraphs) {
        const p = document.createElement('p');
        p.textContent = pText;
        section.appendChild(p);
      }
      if (sec.steps && sec.steps.length > 0) {
        const box = document.createElement('div');
        box.className = 'guide-example';
        if (sec.stepsTitle) {
          const st = document.createElement('div');
          st.className = 'guide-example-title';
          st.textContent = sec.stepsTitle;
          box.appendChild(st);
        }
        const ol = document.createElement('ol');
        for (const stepText of sec.steps) {
          const li = document.createElement('li');
          li.textContent = stepText;
          ol.appendChild(li);
        }
        box.appendChild(ol);
        section.appendChild(box);
      }
      if (sec.note) {
        const note = document.createElement('p');
        note.className = 'guide-note';
        note.textContent = sec.note;
        section.appendChild(note);
      }
      return section;
    }),
  );

  app.querySelector('.lang-switch')!.setAttribute('aria-label', t.langGroup);
  app.querySelectorAll<HTMLButtonElement>('[data-lang]').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.lang === lang));
  });
  device.slots.forEach((slot, i) => slot.setAttribute('aria-label', t.sliderLabel(t.placeNames[i]!)));
  device.lever.setAttribute('aria-label', t.resetLever);
  device.subtractMark.setAttribute('aria-label', t.subtractMark);
  live.textContent = t.answer(formatDigits(micra.value));
}

app.querySelectorAll<HTMLButtonElement>('[data-lang]').forEach((b) => {
  b.addEventListener('click', () => {
    const next = b.dataset.lang as Lang;
    saveLang(next);
    applyLang(next);
  });
});

applyLang(lang);
if (!isEmbed) openModal('welcome');
