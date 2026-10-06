import type { TutorialCourseId } from '../core/tutorial';

export type Lang = 'ja' | 'en';

export interface GuideSection {
  title: string;
  paragraphs: string[];
  stepsTitle?: string;
  steps?: string[];
  note?: string;
}

export interface TutorialCourseText {
  title: string;
  formula: string;
  badge: string;
  summary: string;
  startBtn: string;
  completedTitle: string;
  completedBody: string;
  nextCourseBtn: string;
}

export interface TutorialStepText {
  phase: string;
  instruction: string;
}

export interface TutorialMessages {
  modalIntro: string;
  courses: Record<TutorialCourseId, TutorialCourseText>;
  steps: Record<string, TutorialStepText>;
  stepProgress: (current: number, total: number) => string;
  targetChipPull: (place: string, color: 'black' | 'red', digit: number) => string;
  targetChipReset: string;
  skipZeroStepBtn: string;
  retryBtn: string;
  exitBtn: string;
  doneBtn: string;
  feedback: {
    needReset: string;
    resetDisabled: string;
    wrongColumn: (expectedPlace: string) => string;
    notDragged: string;
    stoppedShort: (pulled: number, expectedDigit: number, color: 'black' | 'red') => string;
    pulledTooMuch: (pulled: number, expectedDigit: number, color: 'black' | 'red') => string;
  };
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
  tutorial: TutorialMessages;
  closeBtn: string;
}
