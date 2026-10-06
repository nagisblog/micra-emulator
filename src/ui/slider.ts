export interface SliderCallbacks {
  /** ドラッグ中に引いている段数が変わったとき */
  onChange(index: number, steps: number): void;
  /** 手を離したとき（確定した段数） */
  onCommit(index: number, steps: number): void;
}

const RETURN_MS = 220;

/**
 * スライドキー1本分。
 * - 掴んだ黒数字 n の段数までしか下がらない
 * - 途中で離したら切り捨て（2と3の間なら2）
 * - 離すとバネで元の位置へ戻る
 */
export class SliderKey {
  private pointerId: number | null = null;
  private grabbed = 0;
  private startY = 0;
  private steps = 0;
  private pitch = 1;
  private busy = false;

  constructor(
    private readonly index: number,
    private readonly strip: HTMLElement,
    private readonly cb: SliderCallbacks,
    private readonly reducedMotion: () => boolean,
  ) {
    strip.addEventListener('pointerdown', this.onDown);
    strip.addEventListener('pointermove', this.onMove);
    strip.addEventListener('pointerup', this.onUp);
    strip.addEventListener('pointercancel', this.onUp);
    strip.addEventListener('lostpointercapture', this.onUp);
  }

  get isActive(): boolean {
    return this.busy || this.pointerId !== null;
  }

  /** キーボード操作用: 黒数字 n を止まるところまで引いて離す */
  pull(n: number): void {
    if (this.isActive) return;
    this.pitch = this.measurePitch();
    this.grabbed = n;
    this.steps = 0;
    const target = n * this.pitch;
    if (this.reducedMotion() || n === 0) {
      this.setOffset(target);
      this.release();
      return;
    }
    this.busy = true;
    this.strip.classList.add('dragging');
    const duration = 80 + n * 40;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.max(0, Math.min(1, (now - start) / duration));
      this.setOffset(target * t * t);
      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        this.busy = false;
        this.strip.classList.remove('dragging');
        this.release();
      }
    };
    requestAnimationFrame(step);
  }

  private measurePitch(): number {
    const cell = this.strip.querySelector('.cell');
    return cell?.getBoundingClientRect().height || 1;
  }

  private onDown = (e: PointerEvent): void => {
    if (this.isActive) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const target = (e.target as Element).closest<HTMLElement>('[data-n]');
    this.grabbed = target ? Number(target.dataset.n) : 0;
    e.preventDefault();
    this.pointerId = e.pointerId;
    try {
      this.strip.setPointerCapture(e.pointerId);
    } catch {
      // キャプチャできなくても strip 上の移動は拾えるので続行
    }
    this.startY = e.clientY;
    this.pitch = this.measurePitch();
    this.steps = 0;
    this.strip.classList.add('dragging');
    (this.strip.parentElement as HTMLElement | null)?.focus({ preventScroll: true });
  };

  private onMove = (e: PointerEvent): void => {
    if (e.pointerId !== this.pointerId) return;
    const dy = e.clientY - this.startY;
    this.setOffset(Math.max(0, Math.min(dy, this.grabbed * this.pitch)));
  };

  private onUp = (e: PointerEvent): void => {
    if (e.pointerId !== this.pointerId) return;
    this.pointerId = null;
    this.strip.classList.remove('dragging');
    if (this.strip.hasPointerCapture(e.pointerId)) this.strip.releasePointerCapture(e.pointerId);
    this.release();
  };

  private setOffset(px: number): void {
    this.strip.style.transform = `translateY(${px}px)`;
    // 途中で離した場合は切り捨て（微小な誤差で段を落とさないよう余裕を持たせる）
    const s = Math.min(this.grabbed, Math.floor(px / this.pitch + 1e-3));
    if (s !== this.steps) {
      this.steps = s;
      this.cb.onChange(this.index, s);
    }
  }

  private release(): void {
    const s = this.steps;
    this.steps = 0;
    this.cb.onCommit(this.index, s);
    this.springBack();
  }

  private springBack(): void {
    if (this.reducedMotion()) {
      this.strip.style.transform = '';
      return;
    }
    this.busy = true;
    this.strip.classList.add('returning');
    this.strip.style.transform = 'translateY(0px)';
    window.setTimeout(() => {
      this.strip.classList.remove('returning');
      this.strip.style.transform = '';
      this.busy = false;
    }, RETURN_MS);
  }
}
