const TRAVEL_CQW = 10; // レバーの可動量（本体幅に対する割合）
const TRIGGER_RATIO = 0.6;

/**
 * ゼロ戻しレバー。下へ引き切って離す（6割以上）とゼロ戻し。
 * クリック / Enter / Space でも自動で引く。
 */
export class ResetLever {
  private pointerId: number | null = null;
  private startY = 0;
  private offset = 0;
  private max = 1;
  private moved = false;
  private busy = false;

  constructor(
    private readonly lever: HTMLElement,
    private readonly device: HTMLElement,
    private readonly onReset: () => void,
    private readonly reducedMotion: () => boolean,
  ) {
    lever.addEventListener('pointerdown', this.onDown);
    lever.addEventListener('pointermove', this.onMove);
    lever.addEventListener('pointerup', this.onUp);
    lever.addEventListener('pointercancel', this.onUp);
    lever.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.pull();
      }
    });
  }

  /** 自動でレバーを引いてゼロ戻し */
  pull(): void {
    if (this.busy || this.pointerId !== null) return;
    if (this.reducedMotion()) {
      this.onReset();
      return;
    }
    this.busy = true;
    this.max = this.measureMax();
    this.lever.classList.add('returning');
    this.setOffset(this.max);
    window.setTimeout(() => {
      this.onReset();
      this.setOffset(0);
      window.setTimeout(() => {
        this.lever.classList.remove('returning');
        this.busy = false;
      }, 200);
    }, 180);
  }

  private measureMax(): number {
    return (this.device.getBoundingClientRect().width * TRAVEL_CQW) / 100;
  }

  private setOffset(px: number): void {
    this.offset = px;
    this.lever.style.transform = `translateY(${px}px)`;
  }

  private onDown = (e: PointerEvent): void => {
    if (this.busy || this.pointerId !== null) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    this.pointerId = e.pointerId;
    try {
      this.lever.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    this.startY = e.clientY;
    this.max = this.measureMax();
    this.moved = false;
    this.lever.classList.add('dragging');
  };

  private onMove = (e: PointerEvent): void => {
    if (e.pointerId !== this.pointerId) return;
    const dy = e.clientY - this.startY;
    if (Math.abs(dy) > 3) this.moved = true;
    this.setOffset(Math.max(0, Math.min(dy, this.max)));
  };

  private onUp = (e: PointerEvent): void => {
    if (e.pointerId !== this.pointerId) return;
    this.pointerId = null;
    this.lever.classList.remove('dragging');
    if (!this.moved) {
      this.setOffset(0);
      this.pull();
      return;
    }
    if (this.offset >= this.max * TRIGGER_RATIO) this.onReset();
    this.lever.classList.add('returning');
    this.setOffset(0);
    window.setTimeout(() => this.lever.classList.remove('returning'), 200);
  };
}
