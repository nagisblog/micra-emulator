let seqCounter = 0;

/** 目標値の更新順を保証するための通し番号 */
export function nextSeq(): number {
  return ++seqCounter;
}

/**
 * 答え窓の数字ドラム。
 * 目標値は上限なしの回転カウント（floor(total / 位)）で受け取り、
 * pos mod 10 を表示する。リールは 0..9,0 の11コマなので 9→0 も前方向に回る。
 */
export class Drum {
  private pos = 0;
  private target = 0;
  private lastSeq = 0;
  private raf = 0;
  private lastTime = 0;

  constructor(
    private readonly reel: HTMLElement,
    private readonly reducedMotion: () => boolean,
  ) {
    this.render();
  }

  setTarget(target: number, seq: number, delayMs = 0): void {
    const apply = () => {
      if (seq < this.lastSeq) return;
      this.lastSeq = seq;
      this.target = target;
      // 10コマ以上離れている場合（ゼロ戻しなど）は見た目が同じ位置まで飛ばす
      const diff = this.target - this.pos;
      if (diff >= 10) this.pos += 10 * Math.floor(diff / 10);
      else if (diff <= -10) this.pos -= 10 * Math.floor(-diff / 10);
      if (this.reducedMotion()) {
        this.pos = this.target;
        this.render();
        return;
      }
      this.start();
    };
    if (delayMs > 0 && !this.reducedMotion()) window.setTimeout(apply, delayMs);
    else apply();
  }

  private start(): void {
    if (this.raf) return;
    this.lastTime = performance.now();
    this.raf = requestAnimationFrame(this.tick);
  }

  private tick = (now: number): void => {
    // rAF のタイムスタンプは performance.now() より前になることがあるので負の dt を防ぐ
    const dt = Math.max(0, Math.min(0.05, (now - this.lastTime) / 1000));
    this.lastTime = Math.max(this.lastTime, now);
    const diff = this.target - this.pos;
    const step = Math.sign(diff) * Math.max(Math.abs(diff) * Math.min(1, dt * 18), 8 * dt);
    if (Math.abs(step) >= Math.abs(diff)) {
      this.pos = this.target;
      this.raf = 0;
      this.render();
      return;
    }
    this.pos += step;
    this.render();
    this.raf = requestAnimationFrame(this.tick);
  };

  private render(): void {
    const m = ((this.pos % 10) + 10) % 10;
    this.reel.style.transform = `translateY(${(-m / 11) * 100}%)`;
  }
}
