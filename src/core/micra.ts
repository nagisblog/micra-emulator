/**
 * ミックラー加算機のコアロジック（UI非依存の純粋ロジック）
 *
 * 桁の並びは実機の左→右: [拾万, 万, 千, 百, 拾, 円]
 * 内部では「積算カウント total」を上限なしの整数で保持する。
 * 表示は total mod 1,000,000（最上位からの桁あふれは捨てる）。
 * total を上限なしにしておくと、各ドラムの回転量を floor(total / 位) で
 * 単調に求められ、桁上がりのアニメーションが自然に表現できる。
 */

export const DIGIT_COUNT = 6;
export const MODULUS = 10 ** DIGIT_COUNT;

export type Digits = number[];

/** index 番目の桁の位（円 = 1, 拾 = 10, ..., 拾万 = 100000） */
export function placeValue(index: number): number {
  assertIndex(index);
  return 10 ** (DIGIT_COUNT - 1 - index);
}

/** 数値を6桁の配列に変換（桁あふれ・負数は mod 10^6 で正規化） */
export function toDigits(value: number): Digits {
  const v = ((value % MODULUS) + MODULUS) % MODULUS;
  return Array.from({ length: DIGIT_COUNT }, (_, i) => Math.floor(v / placeValue(i)) % 10);
}

/** 6桁の配列を数値に変換 */
export function fromDigits(digits: Digits): number {
  if (digits.length !== DIGIT_COUNT) throw new RangeError(`digits must have ${DIGIT_COUNT} items`);
  return digits.reduce((acc, d) => {
    assertDigit(d);
    return acc * 10 + d;
  }, 0);
}

/** index の桁に n を加算した結果（桁上がり・桁あふれ込み） */
export function addAtDigit(digits: Digits, index: number, n: number): Digits {
  assertDigit(n);
  return toDigits(fromDigits(digits) + n * placeValue(index));
}

/** 6桁表示用の文字列（例: "004610"） */
export function formatDigits(value: number): string {
  return toDigits(value).join('');
}

export class Micra {
  private _total = 0;

  /** 上限なしの積算カウント（ドラム回転量の算出用） */
  get total(): number {
    return this._total;
  }

  /** 答え窓に表示される値（0〜999999） */
  get value(): number {
    return this._total % MODULUS;
  }

  get digits(): Digits {
    return toDigits(this._total);
  }

  /** index の桁のスライドキーを steps 段引く（0〜9） */
  pull(index: number, steps: number): void {
    assertDigit(steps);
    this._total += steps * placeValue(index);
  }

  /** ゼロ戻し。ドラムが前方向に回って 0 に揃うよう、次の 10^6 の倍数へ進める */
  reset(): void {
    this._total = Math.ceil(this._total / MODULUS) * MODULUS;
  }
}

function assertIndex(index: number): void {
  if (!Number.isInteger(index) || index < 0 || index >= DIGIT_COUNT) {
    throw new RangeError(`digit index out of range: ${index}`);
  }
}

function assertDigit(n: number): void {
  if (!Number.isInteger(n) || n < 0 || n > 9) {
    throw new RangeError(`digit out of range: ${n}`);
  }
}
