import type { Messages } from './types';

export const en: Messages = {
  htmlTitle: 'Micra Adder Emulator',
  title: 'Micra Adder Emulator',
  description:
    'A browser emulator of the Micra adder, a compact mechanical adding machine made in Japan around 1960.',
  hint: 'Put your finger (or mouse) on a number and pull the slide key down.',
  keyboardHelp:
    'Keyboard: ← → select column / 0–9 pull by black number / Shift + digit pull by red number / Esc reset',
  placeNames: ['hundred-thousands', 'ten-thousands', 'thousands', 'hundreds', 'tens', 'ones'],
  sliderLabel: (place) => `Slide key (${place})`,
  resetLever: 'Reset lever',
  subtractMark: 'Subtraction mark (black 1 on the ones column)',
  answer: (value) => `Result ${value}`,
  footerArticle: 'Article about the real machine (Japanese)',
  footerNote: 'An unofficial emulator reproducing the behavior of the real machine.',
  langGroup: 'Language',
  guideBtn: 'How to Use',
  tutorialBtn: 'Tutorial',
  welcomeTitle: 'Try Out the Micra Adder!',
  welcomeBody:
    'A mechanical adding machine with a unique feel. Check out "How to Use" or "Tutorial" first to learn how to operate it!',
  guideSections: [
    {
      title: '1. Overview of the Micra Adder',
      paragraphs: [
        'The Micra Adder is a compact 6-digit mechanical adding and subtracting machine made in Japan by Micra Seiki around 1960. It operates entirely without electricity.',
        'At the top are 6 columns labeled in kanji from left to right: 拾万 (100,000), 万 (10,000), 千 (1,000), 百 (100), 拾 (10), and 円 (1). Each column has a vertical slide key with large black numbers (0–9) for addition and small red numbers (9–0) for subtraction. The 6 windows below display the result.',
      ],
    },
    {
      title: '2. How to Reset',
      paragraphs: [
        'Pull down (or click) the silver reset lever on the right side of the machine to return all result windows to 0.',
      ],
      note: 'Tip: You can also press the Esc key on your keyboard to reset.',
    },
    {
      title: '3. How to Add',
      paragraphs: [
        'Use the large black numbers on the slide keys. Place your finger (or mouse) on a number and pull the key all the way down until it stops. Releasing the key lets it spring back while the value is added to the result window, with automatic carry-over.',
      ],
      stepsTitle: 'Example: 3456 + 2060',
      steps: [
        'Using the black numbers, pull down 3 (千 / thousands), 4 (百 / hundreds), 5 (拾 / tens), and 6 (円 / ones) (Result: 003456).',
        'Next, using the black numbers, pull down 2 (千 / thousands) and 6 (拾 / tens). Columns with 0 do not need to be moved.',
        'Carry-over is handled automatically, and the result window shows 005516.',
      ],
    },
    {
      title: '4. How to Subtract',
      paragraphs: [
        "Use the small red numbers to subtract via 10's complement. Because each red number is the 9's complement of the black number next to it, you must first add 1 on the ones column and then input all 6 digits in red from left to right (including leading zeros).",
      ],
      stepsTitle: 'Example: 12500 - 7890',
      steps: [
        'First, enter 12500 using the black numbers (Result: 012500).',
        'On the rightmost column (円 / ones), pull down the black 1 next to the subtraction mark (↧).',
        'Using the red numbers, pull all 6 columns from left to right: 0, 0, 7, 8, 9, 0. Make sure to pull red 0 (at the top, next to black 9) for the leading zero columns as well.',
        'The result window shows 004610.',
      ],
    },
  ],
  tutorialPlaceholder: 'Tutorial is coming soon.',
  closeBtn: 'Close',
};
