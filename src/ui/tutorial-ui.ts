import {
  TutorialSession,
  type TutorialCourseId,
  type TutorialRejectionReason,
} from '../core/tutorial';
import { messages, type Lang } from '../i18n';
import { COLUMN_CX, PLATE_LABELS, type DeviceRefs } from './device';

export interface TutorialControllerOptions {
  device: DeviceRefs;
  popupEl: HTMLElement;
  courseListEl: HTMLElement;
  getLang: () => Lang;
  getDeviceValue: () => number;
  onStartCourseModalClose: () => void;
  onForceReset: () => void;
}

export class TutorialController {
  private readonly session = new TutorialSession();
  private feedbackText: string | null = null;

  constructor(private readonly opts: TutorialControllerOptions) {
    window.addEventListener('resize', () => {
      if (this.session.isActive && !this.session.isCompleted) {
        this.updatePointerPosition();
      }
    });
  }

  get isActive(): boolean {
    return this.session.isActive;
  }

  startCourse(courseId: TutorialCourseId, forceResetFirst = false): void {
    if (forceResetFirst && this.opts.getDeviceValue() !== 0) {
      this.opts.onForceReset();
    }
    this.feedbackText = null;
    this.session.start(courseId, this.opts.getDeviceValue());
    document.body.classList.add('tutorial-mode');
    this.opts.device.root.classList.add('tutorial-active');
    this.opts.popupEl.hidden = false;
    this.renderPopup();
    this.applyHighlights();
    this.focusCurrentTarget();
  }

  stop(): void {
    this.session.stop();
    this.feedbackText = null;
    document.body.classList.remove('tutorial-mode');
    this.opts.device.root.classList.remove('tutorial-active');
    this.opts.popupEl.hidden = true;
    this.opts.popupEl.replaceChildren();
    this.clearHighlights();
  }

  /**
   * スライドキーが引かれたときの判定。
   * @returns true なら本体へ加算を反映、false ならキャンセルして元の表示へ戻す
   */
  onPullCommit(col: number, steps: number): boolean {
    if (!this.session.isActive || this.session.isCompleted) {
      return true;
    }
    const outcome = this.session.handleAction({ type: 'pull', col, steps });
    if (outcome.accepted) {
      this.feedbackText = null;
      this.renderPopup();
      this.applyHighlights();
      this.focusCurrentTarget();
      return true;
    }
    this.feedbackText = this.formatRejection(outcome.reason);
    this.renderPopup(true);
    return false;
  }

  /**
   * ゼロ戻しレバーが引かれたときの判定。
   * @returns true ならゼロ戻しを実行、false ならキャンセル
   */
  onResetAttempt(): boolean {
    if (!this.session.isActive || this.session.isCompleted) {
      return true;
    }
    const outcome = this.session.handleAction({ type: 'reset' });
    if (outcome.accepted) {
      this.feedbackText = null;
      this.renderPopup();
      this.applyHighlights();
      this.focusCurrentTarget();
      return true;
    }
    this.feedbackText = this.formatRejection(outcome.reason);
    this.renderPopup(true);
    return false;
  }

  refreshLang(): void {
    this.renderCourseList();
    if (this.session.isActive) {
      this.feedbackText = null;
      this.renderPopup();
    }
  }

  renderCourseList(): void {
    const t = messages(this.opts.getLang()).tutorial;
    const courseIds: TutorialCourseId[] = ['addition', 'subtraction'];
    this.opts.courseListEl.replaceChildren(
      ...courseIds.map((id) => {
        const c = t.courses[id];
        const card = document.createElement('div');
        card.className = 'tutorial-course-card';

        const top = document.createElement('div');
        top.className = 'tutorial-course-top';

        const h3 = document.createElement('h3');
        h3.className = 'tutorial-course-title';
        h3.textContent = c.title;

        const badge = document.createElement('span');
        badge.className = 'tutorial-course-badge';
        badge.textContent = c.badge;

        top.append(h3, badge);

        const formula = document.createElement('div');
        formula.className = 'tutorial-course-formula';
        formula.textContent = c.formula;

        const summary = document.createElement('p');
        summary.className = 'tutorial-course-summary';
        summary.textContent = c.summary;

        const actions = document.createElement('div');
        actions.className = 'tutorial-course-actions';

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn btn-primary';
        btn.textContent = c.startBtn;
        btn.addEventListener('click', () => {
          this.opts.onStartCourseModalClose();
          this.startCourse(id);
        });

        actions.appendChild(btn);
        card.append(top, formula, summary, actions);
        return card;
      }),
    );
  }

  private formatRejection(reason: TutorialRejectionReason): string {
    const msg = messages(this.opts.getLang());
    const fb = msg.tutorial.feedback;
    switch (reason.kind) {
      case 'need_reset':
        return fb.needReset;
      case 'reset_disabled':
        return fb.resetDisabled;
      case 'wrong_column': {
        const kanji = PLATE_LABELS[reason.expectedCol]!;
        const place =
          this.opts.getLang() === 'ja'
            ? kanji
            : `${kanji} (${msg.placeNames[reason.expectedCol]!})`;
        return fb.wrongColumn(place);
      }
      case 'not_dragged':
        return fb.notDragged;
      case 'stopped_short':
        return fb.stoppedShort(reason.pulled, reason.expectedDigit, reason.color);
      case 'pulled_too_much':
        return fb.pulledTooMuch(reason.pulled, reason.expectedDigit, reason.color);
    }
  }

  private renderPopup(shakeFeedback = false): void {
    const courseId = this.session.courseId;
    if (!courseId) return;

    const lang = this.opts.getLang();
    const msg = messages(lang);
    const t = msg.tutorial;
    const course = t.courses[courseId];
    const popup = this.opts.popupEl;

    popup.dataset.completed = String(this.session.isCompleted);

    // Header
    const header = document.createElement('div');
    header.className = 'tutorial-popup-header';

    const meta = document.createElement('div');
    meta.className = 'tutorial-popup-meta';

    const pill = document.createElement('span');
    pill.className = 'tutorial-formula-pill';
    pill.textContent = `${course.title}: ${course.formula}`;
    meta.appendChild(pill);

    if (!this.session.isCompleted) {
      const stepCount = document.createElement('span');
      stepCount.className = 'tutorial-step-count';
      stepCount.textContent = t.stepProgress(this.session.stepIndex + 1, this.session.totalSteps);
      meta.appendChild(stepCount);
    }

    const exitBtn = document.createElement('button');
    exitBtn.type = 'button';
    exitBtn.className = 'tutorial-exit-btn';
    exitBtn.textContent = `× ${t.exitBtn}`;
    exitBtn.addEventListener('click', () => this.stop());

    header.append(meta, exitBtn);

    // Progress bar
    const progress = document.createElement('div');
    progress.className = 'tutorial-progress';
    const progressBar = document.createElement('div');
    progressBar.className = 'tutorial-progress-bar';
    const pct = this.session.isCompleted
      ? 100
      : Math.round((this.session.stepIndex / Math.max(1, this.session.totalSteps)) * 100);
    progressBar.style.width = `${pct}%`;
    progress.appendChild(progressBar);

    if (this.session.isCompleted) {
      const phaseRow = document.createElement('div');
      phaseRow.className = 'tutorial-phase-row';
      const phase = document.createElement('div');
      phase.className = 'tutorial-phase';
      phase.textContent = course.completedTitle;
      phaseRow.appendChild(phase);

      const body = document.createElement('p');
      body.className = 'tutorial-instruction';
      body.textContent = course.completedBody;

      const actions = document.createElement('div');
      actions.className = 'tutorial-popup-actions';

      const nextCourseId: TutorialCourseId =
        courseId === 'addition' ? 'subtraction' : 'addition';

      const nextBtn = document.createElement('button');
      nextBtn.type = 'button';
      nextBtn.className = 'btn btn-primary';
      nextBtn.textContent = course.nextCourseBtn;
      nextBtn.addEventListener('click', () => this.startCourse(nextCourseId));

      const retryBtn = document.createElement('button');
      retryBtn.type = 'button';
      retryBtn.className = 'btn';
      retryBtn.textContent = t.retryBtn;
      retryBtn.addEventListener('click', () => this.startCourse(courseId, true));

      const doneBtn = document.createElement('button');
      doneBtn.type = 'button';
      doneBtn.className = 'btn';
      doneBtn.textContent = t.doneBtn;
      doneBtn.addEventListener('click', () => this.stop());

      actions.append(nextBtn, retryBtn, doneBtn);
      popup.replaceChildren(header, progress, phaseRow, body, actions);
      return;
    }

    const step = this.session.currentStep!;
    const stepText = t.steps[step.id] ?? { phase: '', instruction: '' };

    const phaseRow = document.createElement('div');
    phaseRow.className = 'tutorial-phase-row';

    const phase = document.createElement('div');
    phase.className = 'tutorial-phase';
    phase.textContent = stepText.phase;

    const chip = document.createElement('span');
    chip.className = 'tutorial-target-chip';
    if (step.target.kind === 'reset') {
      chip.textContent = `${t.targetChipReset} ↓`;
    } else {
      const kanji = PLATE_LABELS[step.target.col]!;
      const placeLabel =
        lang === 'ja' ? kanji : `${kanji} (${msg.placeNames[step.target.col]!})`;
      chip.dataset.color = step.target.color;
      const arrow = step.target.steps === 0 ? '●' : '↓';
      chip.textContent = `${t.targetChipPull(
        placeLabel,
        step.target.color,
        step.target.displayDigit,
      )} ${arrow}`;
    }

    phaseRow.append(phase, chip);

    const instruction = document.createElement('p');
    instruction.className = 'tutorial-instruction';
    instruction.textContent = stepText.instruction;

    const nodes: HTMLElement[] = [header, progress, phaseRow, instruction];

    if (this.feedbackText) {
      const fb = document.createElement('div');
      fb.className = 'tutorial-feedback';
      fb.setAttribute('role', 'alert');
      fb.textContent = this.feedbackText;
      if (shakeFeedback) {
        // アニメーション再発火用
        fb.style.animation = 'none';
        requestAnimationFrame(() => {
          fb.style.animation = '';
        });
      }
      nodes.push(fb);
    }

    if (step.target.kind === 'pull' && step.target.steps === 0) {
      const actions = document.createElement('div');
      actions.className = 'tutorial-popup-actions';
      const skipBtn = document.createElement('button');
      skipBtn.type = 'button';
      skipBtn.className = 'btn btn-primary';
      skipBtn.textContent = t.skipZeroStepBtn;
      skipBtn.addEventListener('click', () => {
        if (this.session.skipZeroStep()) {
          this.feedbackText = null;
          this.renderPopup();
          this.applyHighlights();
          this.focusCurrentTarget();
        }
      });
      actions.appendChild(skipBtn);
      nodes.push(actions);
    }

    popup.replaceChildren(...nodes);
    requestAnimationFrame(() => this.updatePointerPosition());
  }

  private clearHighlights(): void {
    const { plateLabels, slots, strips, lever, subtractMark } = this.opts.device;
    plateLabels.forEach((el) => el.classList.remove('tutorial-target-plate'));
    slots.forEach((el) => el.classList.remove('tutorial-target-slot', 'tutorial-dim-slot'));
    strips.forEach((strip) => {
      strip
        .querySelectorAll('.cell')
        .forEach((cell) =>
          cell.classList.remove(
            'tutorial-target-cell',
            'tutorial-target-black',
            'tutorial-target-red',
            'tutorial-target-zero',
          ),
        );
    });
    lever.classList.remove('tutorial-target-lever');
    subtractMark.classList.remove('tutorial-target-mark');
  }

  private applyHighlights(): void {
    this.clearHighlights();
    const step = this.session.currentStep;
    if (!step) return;

    const { plateLabels, slots, strips, lever, subtractMark } = this.opts.device;

    if (step.target.kind === 'reset') {
      slots.forEach((s) => s.classList.add('tutorial-dim-slot'));
      lever.classList.add('tutorial-target-lever');
      return;
    }

    const { col, steps, color, highlightSubMark } = step.target;
    slots.forEach((s, i) => {
      s.classList.add(i === col ? 'tutorial-target-slot' : 'tutorial-dim-slot');
    });
    plateLabels[col]?.classList.add('tutorial-target-plate');

    const cell = strips[col]?.querySelector<HTMLElement>(`.cell[data-n="${steps}"]`);
    if (cell) {
      cell.classList.add(
        'tutorial-target-cell',
        color === 'red' ? 'tutorial-target-red' : 'tutorial-target-black',
      );
      if (steps === 0) {
        cell.classList.add('tutorial-target-zero');
      }
    }

    if (highlightSubMark) {
      subtractMark.classList.add('tutorial-target-mark');
    }
  }

  private focusCurrentTarget(): void {
    const step = this.session.currentStep;
    if (!step) return;
    if (step.target.kind === 'reset') {
      this.opts.device.lever.focus({ preventScroll: true });
    } else {
      this.opts.device.slots[step.target.col]?.focus({ preventScroll: true });
    }
  }

  private updatePointerPosition(): void {
    const step = this.session.currentStep;
    if (!step) return;

    const popupRect = this.opts.popupEl.getBoundingClientRect();
    if (popupRect.width <= 0) return;

    const targetEl =
      step.target.kind === 'reset'
        ? this.opts.device.lever
        : this.opts.device.slots[step.target.col];

    if (!targetEl) {
      const fallback = step.target.kind === 'reset' ? 92 : COLUMN_CX[step.target.col]!;
      this.opts.popupEl.style.setProperty('--pointer-x', `${fallback}%`);
      return;
    }

    const targetRect = targetEl.getBoundingClientRect();
    const centerX = targetRect.left + targetRect.width / 2 - popupRect.left;
    const clamped = Math.max(20, Math.min(popupRect.width - 20, centerX));
    this.opts.popupEl.style.setProperty('--pointer-x', `${clamped}px`);
  }
}
