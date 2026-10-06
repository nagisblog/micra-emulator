export type Lang = 'ja' | 'en';

export interface GuideSection {
  title: string;
  paragraphs: string[];
  stepsTitle?: string;
  steps?: string[];
  note?: string;
}

export interface Messages {
  htmlTitle: string;
  title: string;
  description: string;
  hint: string;
  keyboardHelp: string;
  /** 各桁の名前（aria-label 用）[拾万..円] */
  placeNames: string[];
  sliderLabel: (place: string) => string;
  resetLever: string;
  subtractMark: string;
  answer: (value: string) => string;
  footerArticle: string;
  footerNote: string;
  langGroup: string;
  guideBtn: string;
  tutorialBtn: string;
  welcomeTitle: string;
  welcomeBody: string;
  guideSections: GuideSection[];
  tutorialPlaceholder: string;
  closeBtn: string;
}
