import { describe, expect, it } from 'vitest';
import { Micra, addAtDigit, formatDigits, fromDigits, toDigits } from './micra';

/** 数値を左の桁から黒数字で入力する（0 の桁は動かさない） */
function enterBlack(m: Micra, value: number): void {
  toDigits(value).forEach((d, i) => {
    if (d > 0) m.pull(i, d);
  });
}

/** 数値を左の桁から赤数字で6桁すべて入力する（赤 r = 黒 9 - r） */
function enterRed(m: Micra, value: number): void {
  toDigits(value).forEach((r, i) => m.pull(i, 9 - r));
}

describe('toDigits / fromDigits', () => {
  it('converts both ways', () => {
    expect(toDigits(3456)).toEqual([0, 0, 3, 4, 5, 6]);
    expect(fromDigits([0, 1, 2, 5, 0, 0])).toBe(12500);
  });

  it('normalizes overflow', () => {
    expect(toDigits(1_004_610)).toEqual([0, 0, 4, 6, 1, 0]);
  });
});

describe('Micra', () => {
  it('説明書の足し算: 3456 + 2060 = 5516', () => {
    const m = new Micra();
    enterBlack(m, 3456);
    expect(formatDigits(m.value)).toBe('003456');
    enterBlack(m, 2060);
    expect(formatDigits(m.value)).toBe('005516');
  });

  it('説明書の引き算: 12500 - 7890 = 4610（円の桁で黒1 → 赤で007890）', () => {
    const m = new Micra();
    enterBlack(m, 12500);
    m.pull(5, 1); // 円の桁の減算用の印（黒の1）
    enterRed(m, 7890);
    expect(formatDigits(m.value)).toBe('004610');
  });

  it('連鎖する桁上がり: 9999 + 1 = 10000', () => {
    const m = new Micra();
    enterBlack(m, 9999);
    m.pull(5, 1);
    expect(m.value).toBe(10000);
  });

  it('最上位からの桁あふれは捨てる: 999999 + 1 = 000000', () => {
    const m = new Micra();
    enterBlack(m, 999999);
    m.pull(5, 1);
    expect(formatDigits(m.value)).toBe('000000');
  });

  it('total は単調増加し、ゼロ戻しは次の 10^6 の倍数へ進む', () => {
    const m = new Micra();
    enterBlack(m, 4610);
    m.reset();
    expect(m.value).toBe(0);
    expect(m.total).toBe(1_000_000);
    m.reset(); // すでに 0 なら動かない
    expect(m.total).toBe(1_000_000);
  });

  it('0 段の引きは何も変えない', () => {
    const m = new Micra();
    m.pull(3, 0);
    expect(m.value).toBe(0);
  });

  it('範囲外の入力は拒否する', () => {
    const m = new Micra();
    expect(() => m.pull(6, 1)).toThrow(RangeError);
    expect(() => m.pull(0, 10)).toThrow(RangeError);
    expect(() => m.pull(0, 1.5)).toThrow(RangeError);
  });
});

describe('addAtDigit', () => {
  it('adds with carry', () => {
    expect(addAtDigit([0, 0, 0, 0, 9, 5], 5, 7)).toEqual([0, 0, 0, 1, 0, 2]);
  });
});
