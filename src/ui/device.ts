import { DIGIT_COUNT } from '../core/micra';

/**
 * 本体の DOM を組み立てる。
 * 座標は本体の幅を 100 とした単位（CSS では cqw）で、高さは 147（実機 125x184mm の比率）。
 */

/** 各桁（列）の中心 X 座標 [拾万..円] */
export const COLUMN_CX = [13.5, 28.1, 42.7, 57.3, 71.9, 86.5] as const;

/** 実機の桁ラベル（言語に関係なく実機どおり表示） */
export const PLATE_LABELS = ['拾万', '万', '千', '百', '拾', '円'] as const;

export interface DeviceRefs {
  root: HTMLElement;
  plateLabels: HTMLElement[];
  slots: HTMLElement[];
  strips: HTMLElement[];
  reels: HTMLElement[];
  lever: HTMLElement;
  subtractMark: HTMLElement;
}

const SCREW_SVG = `<svg viewBox="0 0 10 10" aria-hidden="true"><circle cx="5" cy="5" r="4.6" fill="var(--silver)"/><path d="M2.6 5h4.8M5 2.6v4.8" stroke="var(--screw-line)" stroke-width="1.1" stroke-linecap="round"/></svg>`;

const LOGO_SVG = `<svg viewBox="0 0 120 30" aria-hidden="true">
  <path d="M4 24 Q40 20 116 21" stroke="var(--silver)" stroke-width="1.6" fill="none" stroke-linecap="round"/>
  <text x="10" y="19" font-family="'Brush Script MT','Segoe Script',cursive" font-style="italic" font-weight="700" font-size="19" fill="var(--silver)" letter-spacing="1.5">Nagisa</text>
</svg>`;

const SUB_MARK_SVG = `<svg viewBox="0 0 10 14" aria-hidden="true"><path d="M1.5 1.5h7M5 1.5v10M2.2 8.6 5 11.8l2.8-3.2" stroke="currentColor" stroke-width="1.3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
  parent?: HTMLElement,
): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  e.className = className;
  parent?.appendChild(e);
  return e;
}

function place(e: HTMLElement, cx: number): void {
  e.style.setProperty('--cx', String(cx));
}

export function buildDevice(): DeviceRefs {
  const root = el('div', 'device');

  el('div', 'case', root);
  el('div', 'panel', root);

  // 桁ラベル板
  const plate = el('div', 'plate', root);
  plate.setAttribute('aria-hidden', 'true');
  const plateLabels = PLATE_LABELS.map((label, i) => {
    const s = el('span', 'plate-label', plate);
    place(s, COLUMN_CX[i]!);
    s.textContent = label;
    return s;
  });

  // 上側パネルのネジ
  for (const [x, y] of [
    [20.8, 40],
    [79.2, 40],
  ] as const) {
    const s = el('div', 'screw', root);
    s.style.left = `${x}cqw`;
    s.style.top = `${y}cqw`;
    s.innerHTML = SCREW_SVG;
  }

  // スライドキー
  const slots: HTMLElement[] = [];
  const strips: HTMLElement[] = [];
  for (let i = 0; i < DIGIT_COUNT; i++) {
    const slot = el('div', 'slot', root);
    place(slot, COLUMN_CX[i]!);
    slot.tabIndex = 0;
    slot.dataset.index = String(i);
    const strip = el('div', 'strip', slot);
    for (let n = 9; n >= 0; n--) {
      const cell = el('div', 'cell', strip);
      cell.dataset.n = String(n);
      const b = el('span', 'num-black', cell);
      b.textContent = String(n);
      const r = el('span', 'num-red', cell);
      r.textContent = String(9 - n);
    }
    const tab = el('div', 'tab', strip);
    tab.dataset.n = '0';
    slots.push(slot);
    strips.push(strip);
  }

  // 減算用の印（円の桁・黒の1の横）
  const subtractMark = el('div', 'sub-mark', root);
  subtractMark.innerHTML = SUB_MARK_SVG;
  subtractMark.setAttribute('role', 'img');

  // 下部カバーと答え窓
  const cover = el('div', 'cover', root);
  const reels = COLUMN_CX.map((cx) => {
    const win = el('div', 'window', cover);
    place(win, cx);
    const drum = el('div', 'drum', win);
    const reel = el('div', 'reel', drum);
    for (let d = 0; d <= 10; d++) {
      el('span', '', reel).textContent = String(d % 10);
    }
    return reel;
  });
  for (const x of [26, 50, 74]) {
    const s = el('div', 'screw', cover);
    s.style.left = `${x}cqw`;
    s.style.top = `${112 - 77.5}cqw`;
    s.innerHTML = SCREW_SVG;
  }
  const logo = el('div', 'logo', cover);
  logo.innerHTML = LOGO_SVG;

  // ゼロ戻しレバー（右側面）
  el('div', 'lever-track', root);
  const lever = el('div', 'lever', root);
  lever.tabIndex = 0;
  lever.setAttribute('role', 'button');

  return { root, plateLabels, slots, strips, reels, lever, subtractMark };
}
