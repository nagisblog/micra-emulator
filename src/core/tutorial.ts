export type TutorialCourseId = 'addition' | 'subtraction';

export type TutorialStepTarget =
  | {
      kind: 'reset';
    }
  | {
      kind: 'pull';
      /** 対象列インデックス (0=拾万 .. 5=円) */
      col: number;
      /** 引き切る黒数字の段数 (0〜9)。赤数字 r を引く場合は 9 - r */
      steps: number;
      /** 注目すべき数字の色 */
      color: 'black' | 'red';
      /** 表示上の対象数字（黒なら steps、赤なら 9 - steps） */
      displayDigit: number;
      /** 減算用の印 (↧) も強調するか */
      highlightSubMark?: boolean;
    };

export interface TutorialStepSpec {
  id: string;
  target: TutorialStepTarget;
  /** このステップ完了後の答え窓の期待値（6桁文字列） */
  expectedAfter: string;
}

const RESET_STEP: TutorialStepSpec = {
  id: 'reset',
  target: { kind: 'reset' },
  expectedAfter: '000000',
};

/** 足し算コース: 3456 + 2060 = 5516 */
const ADDITION_STEPS: readonly TutorialStepSpec[] = [
  {
    id: 'add-1',
    target: { kind: 'pull', col: 2, steps: 3, color: 'black', displayDigit: 3 },
    expectedAfter: '003000',
  },
  {
    id: 'add-2',
    target: { kind: 'pull', col: 3, steps: 4, color: 'black', displayDigit: 4 },
    expectedAfter: '003400',
  },
  {
    id: 'add-3',
    target: { kind: 'pull', col: 4, steps: 5, color: 'black', displayDigit: 5 },
    expectedAfter: '003450',
  },
  {
    id: 'add-4',
    target: { kind: 'pull', col: 5, steps: 6, color: 'black', displayDigit: 6 },
    expectedAfter: '003456',
  },
  {
    id: 'add-5',
    target: { kind: 'pull', col: 2, steps: 2, color: 'black', displayDigit: 2 },
    expectedAfter: '005456',
  },
  {
    id: 'add-6',
    target: { kind: 'pull', col: 4, steps: 6, color: 'black', displayDigit: 6 },
    expectedAfter: '005516',
  },
];

/**
 * 引き算コース: 12500 - 7890 = 4610
 * ゼロ戻し直後に円の桁の減算マーク ↧（黒の1）を引いて +1 してから、
 * 黒数字で 12500 を入れ、赤数字で 007890 を引く。
 */
const SUBTRACTION_STEPS: readonly TutorialStepSpec[] = [
  RESET_STEP,
  {
    id: 'sub-1',
    target: {
      kind: 'pull',
      col: 5,
      steps: 1,
      color: 'black',
      displayDigit: 1,
      highlightSubMark: true,
    },
    expectedAfter: '000001',
  },
  {
    id: 'sub-2',
    target: { kind: 'pull', col: 1, steps: 1, color: 'black', displayDigit: 1 },
    expectedAfter: '010001',
  },
  {
    id: 'sub-3',
    target: { kind: 'pull', col: 2, steps: 2, color: 'black', displayDigit: 2 },
    expectedAfter: '012001',
  },
  {
    id: 'sub-4',
    target: { kind: 'pull', col: 3, steps: 5, color: 'black', displayDigit: 5 },
    expectedAfter: '012501',
  },
  {
    id: 'sub-5',
    target: { kind: 'pull', col: 0, steps: 9, color: 'red', displayDigit: 0 },
    expectedAfter: '912501',
  },
  {
    id: 'sub-6',
    target: { kind: 'pull', col: 1, steps: 9, color: 'red', displayDigit: 0 },
    expectedAfter: '002501',
  },
  {
    id: 'sub-7',
    target: { kind: 'pull', col: 2, steps: 2, color: 'red', displayDigit: 7 },
    expectedAfter: '004501',
  },
  {
    id: 'sub-8',
    target: { kind: 'pull', col: 3, steps: 1, color: 'red', displayDigit: 8 },
    expectedAfter: '004601',
  },
  {
    id: 'sub-9',
    target: { kind: 'pull', col: 4, steps: 0, color: 'red', displayDigit: 9 },
    expectedAfter: '004601',
  },
  {
    id: 'sub-10',
    target: { kind: 'pull', col: 5, steps: 9, color: 'red', displayDigit: 0 },
    expectedAfter: '004610',
  },
];

export function buildCourseSteps(
  courseId: TutorialCourseId,
  currentDeviceValue: number,
): TutorialStepSpec[] {
  if (courseId === 'subtraction') {
    return [...SUBTRACTION_STEPS];
  }
  return currentDeviceValue !== 0 ? [RESET_STEP, ...ADDITION_STEPS] : [...ADDITION_STEPS];
}

export type TutorialAction =
  | { type: 'reset' }
  | { type: 'pull'; col: number; steps: number };

export type TutorialRejectionReason =
  | { kind: 'need_reset' }
  | { kind: 'reset_disabled' }
  | { kind: 'wrong_column'; expectedCol: number }
  | { kind: 'not_dragged' }
  | {
      kind: 'stopped_short';
      pulled: number;
      expectedDigit: number;
      color: 'black' | 'red';
    }
  | {
      kind: 'pulled_too_much';
      pulled: number;
      expectedDigit: number;
      color: 'black' | 'red';
    };

export type TutorialActionOutcome =
  | { accepted: true; advancedBy: number }
  | { accepted: false; reason: TutorialRejectionReason };

/**
 * チュートリアルの状態管理クラス（UI非依存）
 */
export class TutorialSession {
  private _courseId: TutorialCourseId | null = null;
  private _steps: TutorialStepSpec[] = [];
  private _index = 0;

  get isActive(): boolean {
    return this._courseId !== null;
  }

  get courseId(): TutorialCourseId | null {
    return this._courseId;
  }

  get isCompleted(): boolean {
    return this._courseId !== null && this._index >= this._steps.length;
  }

  get stepIndex(): number {
    return this._index;
  }

  get totalSteps(): number {
    return this._steps.length;
  }

  get currentStep(): TutorialStepSpec | null {
    if (!this._courseId || this._index >= this._steps.length) return null;
    return this._steps[this._index] ?? null;
  }

  start(courseId: TutorialCourseId, currentDeviceValue: number): void {
    this._courseId = courseId;
    this._steps = buildCourseSteps(courseId, currentDeviceValue);
    this._index = 0;
  }

  stop(): void {
    this._courseId = null;
    this._steps = [];
    this._index = 0;
  }

  /** 0段のステップ（赤の9＝黒の0）をボタンでスキップ進行する */
  skipZeroStep(): boolean {
    const step = this.currentStep;
    if (!step || step.target.kind !== 'pull' || step.target.steps !== 0) {
      return false;
    }
    this._index += 1;
    return true;
  }

  /**
   * ユーザーの操作を検証し、正しければステップを進める。
   * 誤操作の場合は accepted: false と理由を返す（呼び出し側で加算/リセットをキャンセルする）。
   */
  handleAction(action: TutorialAction): TutorialActionOutcome {
    const step = this.currentStep;
    if (!step) {
      return { accepted: true, advancedBy: 0 };
    }

    const target = step.target;

    if (target.kind === 'reset') {
      if (action.type === 'reset') {
        this._index += 1;
        return { accepted: true, advancedBy: 1 };
      }
      return { accepted: false, reason: { kind: 'need_reset' } };
    }

    // target.kind === 'pull'
    if (action.type === 'reset') {
      return { accepted: false, reason: { kind: 'reset_disabled' } };
    }

    // 特例: 現在のステップが 0 段（赤の9＝黒の0）で、ユーザーがそのまま次のステップの正しい操作を行った場合は2ステップ同時に進める
    if (target.steps === 0 && this._index + 1 < this._steps.length) {
      const nextStep = this._steps[this._index + 1]!;
      if (
        nextStep.target.kind === 'pull' &&
        action.col === nextStep.target.col &&
        action.steps === nextStep.target.steps
      ) {
        this._index += 2;
        return { accepted: true, advancedBy: 2 };
      }
    }

    if (action.col !== target.col) {
      return {
        accepted: false,
        reason: { kind: 'wrong_column', expectedCol: target.col },
      };
    }

    if (action.steps === target.steps) {
      this._index += 1;
      return { accepted: true, advancedBy: 1 };
    }

    if (action.steps === 0) {
      return { accepted: false, reason: { kind: 'not_dragged' } };
    }

    if (action.steps < target.steps) {
      return {
        accepted: false,
        reason: {
          kind: 'stopped_short',
          pulled: action.steps,
          expectedDigit: target.displayDigit,
          color: target.color,
        },
      };
    }

    return {
      accepted: false,
      reason: {
        kind: 'pulled_too_much',
        pulled: action.steps,
        expectedDigit: target.displayDigit,
        color: target.color,
      },
    };
  }
}
