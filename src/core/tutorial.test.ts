import { describe, expect, it } from 'vitest';
import { Micra, formatDigits } from './micra';
import { TutorialSession } from './tutorial';

describe('TutorialSession', () => {
  it('足し算コース (3456 + 2060 = 5516) を全ステップ順番にクリアできる', () => {
    const micra = new Micra();
    const session = new TutorialSession();
    session.start('addition', micra.value);
    expect(session.totalSteps).toBe(6);

    while (!session.isCompleted) {
      const step = session.currentStep!;
      expect(step.target.kind).toBe('pull');
      if (step.target.kind === 'pull') {
        const res = session.handleAction({
          type: 'pull',
          col: step.target.col,
          steps: step.target.steps,
        });
        expect(res.accepted).toBe(true);
        micra.pull(step.target.col, step.target.steps);
        expect(formatDigits(micra.value)).toBe(step.expectedAfter);
      }
    }

    expect(formatDigits(micra.value)).toBe('005516');
  });

  it('答え窓が 0 でない状態から足し算を開始すると先頭にゼロ戻しステップが入る', () => {
    const micra = new Micra();
    micra.pull(5, 6);
    const session = new TutorialSession();
    session.start('addition', micra.value);
    expect(session.currentStep?.id).toBe('reset');

    // リセット前にスライドキーを引こうとすると拒否される
    const wrong = session.handleAction({ type: 'pull', col: 2, steps: 3 });
    expect(wrong).toEqual({ accepted: false, reason: { kind: 'need_reset' } });

    // リセットを実行すると次のステップへ進む
    const ok = session.handleAction({ type: 'reset' });
    expect(ok).toEqual({ accepted: true, advancedBy: 1 });
    micra.reset();
    expect(session.currentStep?.id).toBe('add-1');
  });

  it('引き算コース (ゼロクリア → ↧の黒1 → 12500 → 赤で007890 = 4610) を全ステップ順番にクリアできる', () => {
    const micra = new Micra();
    const session = new TutorialSession();
    session.start('subtraction', micra.value);
    expect(session.totalSteps).toBe(11);
    expect(session.currentStep?.id).toBe('reset');

    while (!session.isCompleted) {
      const step = session.currentStep!;
      if (step.target.kind === 'reset') {
        const res = session.handleAction({ type: 'reset' });
        expect(res.accepted).toBe(true);
        micra.reset();
        expect(formatDigits(micra.value)).toBe(step.expectedAfter);
      } else {
        const res = session.handleAction({
          type: 'pull',
          col: step.target.col,
          steps: step.target.steps,
        });
        expect(res.accepted).toBe(true);
        micra.pull(step.target.col, step.target.steps);
        expect(formatDigits(micra.value)).toBe(step.expectedAfter);
      }
    }

    expect(formatDigits(micra.value)).toBe('004610');
  });

  it('引き算の sub-9（赤9＝黒0）でそのまま次の円の桁（赤0＝黒9）を引いてもクリアできる', () => {
    const micra = new Micra();
    const session = new TutorialSession();
    session.start('subtraction', micra.value);

    // reset + sub-1 .. sub-8 まで進める（計9ステップ）
    for (let i = 0; i < 9; i++) {
      const step = session.currentStep!;
      if (step.target.kind === 'reset') {
        session.handleAction({ type: 'reset' });
        micra.reset();
      } else {
        session.handleAction({ type: 'pull', col: step.target.col, steps: step.target.steps });
        micra.pull(step.target.col, step.target.steps);
      }
    }

    expect(session.currentStep?.id).toBe('sub-9');
    // sub-9 を飛ばして sub-10 (col: 5, steps: 9) を引く
    const res = session.handleAction({ type: 'pull', col: 5, steps: 9 });
    expect(res).toEqual({ accepted: true, advancedBy: 2 });
    micra.pull(5, 9);
    expect(session.isCompleted).toBe(true);
    expect(formatDigits(micra.value)).toBe('004610');
  });

  it('誤操作（違う桁・途中離し・引きすぎ・途中リセット）を判定して拒否する', () => {
    const session = new TutorialSession();
    session.start('addition', 0);

    // add-1 は col: 2 (千), steps: 3
    expect(session.handleAction({ type: 'pull', col: 5, steps: 3 })).toEqual({
      accepted: false,
      reason: { kind: 'wrong_column', expectedCol: 2 },
    });

    expect(session.handleAction({ type: 'pull', col: 2, steps: 0 })).toEqual({
      accepted: false,
      reason: { kind: 'not_dragged' },
    });

    expect(session.handleAction({ type: 'pull', col: 2, steps: 2 })).toEqual({
      accepted: false,
      reason: { kind: 'stopped_short', pulled: 2, expectedDigit: 3, color: 'black' },
    });

    expect(session.handleAction({ type: 'pull', col: 2, steps: 5 })).toEqual({
      accepted: false,
      reason: { kind: 'pulled_too_much', pulled: 5, expectedDigit: 3, color: 'black' },
    });

    expect(session.handleAction({ type: 'reset' })).toEqual({
      accepted: false,
      reason: { kind: 'reset_disabled' },
    });
  });
});
