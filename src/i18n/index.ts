import { en } from './en';
import { ja } from './ja';
import type { Lang, Messages } from './types';

export type { Lang, Messages };

const STORAGE_KEY = 'micra-emulator:lang';
const dictionaries: Record<Lang, Messages> = { ja, en };

function isLang(v: unknown): v is Lang {
  return v === 'ja' || v === 'en';
}

/** ?lang= > localStorage > ブラウザ言語 の順で初期言語を決める */
export function detectLang(): Lang {
  const param = new URLSearchParams(location.search).get('lang');
  if (isLang(param)) return param;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isLang(saved)) return saved;
  } catch {
    // localStorage が使えない環境（埋め込み・プライベートモード等）は無視
  }
  return navigator.language.toLowerCase().startsWith('ja') ? 'ja' : 'en';
}

export function saveLang(lang: Lang): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // ignore
  }
}

export function messages(lang: Lang): Messages {
  return dictionaries[lang];
}
