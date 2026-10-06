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
        "Use the small red numbers to subtract via 10's complement. Because each red number is the 9's complement of the black number next to it, you must first add 1 on the ones column after clearing to zero, enter the minuend in black, and then input all 6 digits in red from left to right (including leading zeros).",
      ],
      stepsTitle: 'Example: 12500 - 7890',
      steps: [
        'After clearing the windows to 000000 with the reset lever, immediately pull down the black 1 next to the subtraction mark (↧) on the rightmost column (円 / ones) (Result: 000001).',
        'Next, enter 12500 using the black numbers (Result: 012501).',
        'Using the red numbers, pull all 6 columns from left to right: 0, 0, 7, 8, 9, 0. Make sure to pull red 0 (at the top, next to black 9) for the leading zero columns as well.',
        'The result window shows 004610.',
      ],
    },
  ],
  tutorial: {
    modalIntro:
      'Learn how to add and subtract step-by-step by pulling the highlighted keys on the machine. Choose a course to start.',
    courses: {
      addition: {
        title: 'Addition Course',
        formula: '3456 + 2060 = 5516',
        badge: 'Basics & Auto Carry',
        summary: 'Add 2060 to 3456 using the black numbers and see automatic carry-over in action.',
        startBtn: 'Start Addition',
        completedTitle: '🎉 Addition Complete! (3456 + 2060 = 5516)',
        completedBody:
          'When 5 + 6 reached 11 on the tens column (拾), the hundreds column (百) automatically carried +1, giving 005516! Next, try subtraction using the red numbers.',
        nextCourseBtn: 'Try Subtraction Course →',
      },
      subtraction: {
        title: 'Subtraction Course',
        formula: '12500 - 7890 = 4610',
        badge: "10's Complement (Red)",
        summary:
          "Clear to zero, immediately add +1 at the subtraction mark (↧), enter 12500 in black, and subtract 007890 using the small red numbers.",
        startBtn: 'Start Subtraction',
        completedTitle: '🎉 Subtraction Complete! (12500 - 7890 = 4610)',
        completedBody:
          "Adding +1, 12500, and 992109 (the 9's complement of 007890) produced 1,004,610. Dropping the overflow 1,000,000 leaves the exact difference: 004610!",
        nextCourseBtn: 'Try Addition Course →',
      },
    },
    steps: {
      reset: {
        phase: 'Prep: Reset to Zero',
        instruction:
          'First, pull down (or click) the silver reset lever on the right side of the machine to clear all result windows to 000000.',
      },
      'add-1': {
        phase: '① Enter 3456 (Thousands / 千)',
        instruction:
          'First, enter 3456 using the black numbers. On the 3rd column from the left (千 / thousands), place your finger on [Black 3] and pull all the way down until it stops.',
      },
      'add-2': {
        phase: '① Enter 3456 (Hundreds / 百)',
        instruction:
          'The windows now show 003000! Next, on the 百 (hundreds) column, pull [Black 4] all the way down.',
      },
      'add-3': {
        phase: '① Enter 3456 (Tens / 拾)',
        instruction: 'Next, on the 拾 (tens) column, pull [Black 5] all the way down.',
      },
      'add-4': {
        phase: '① Enter 3456 (Ones / 円)',
        instruction:
          'On the rightmost column (円 / ones), pull [Black 6] all the way down to complete entering 003456.',
      },
      'add-5': {
        phase: '② Add 2060 (Thousands / 千)',
        instruction:
          'Now add 2060 to 003456. On the 千 (thousands) column, pull [Black 2] all the way down.',
      },
      'add-6': {
        phase: '② Add 2060 (Tens / 拾 — Carry)',
        instruction:
          'Skip hundreds (百) because its digit is 0. On the 拾 (tens) column, pull [Black 6] all the way down (watch the automatic carry to 百!). Ones is 0, so this finishes the sum.',
      },
      'sub-1': {
        phase: '① Add +1 at Subtraction Mark (↧)',
        instruction:
          "Right after clearing to zero, prepare for 10's complement subtraction: on the rightmost column (円 / ones), pull [Black 1] next to the subtraction mark (↧) so the windows show 000001.",
      },
      'sub-2': {
        phase: '② Enter 12500 (Ten-thousands / 万)',
        instruction:
          'The windows show 000001. Next, enter 12500 using the black numbers. On the 2nd column from the left (万 / 10,000), pull [Black 1] all the way down.',
      },
      'sub-3': {
        phase: '② Enter 12500 (Thousands / 千)',
        instruction: 'Next, on the 千 (thousands) column, pull [Black 2] all the way down.',
      },
      'sub-4': {
        phase: '② Enter 12500 (Hundreds / 百)',
        instruction:
          'On the 百 (hundreds) column, pull [Black 5] all the way down (tens and ones are 0, so the windows now show 012501).',
      },
      'sub-5': {
        phase: '③ Pull 007890 in Red (100,000 / 拾万)',
        instruction:
          'Now look at the small [Red Numbers]. Enter 7890 as 6 digits (007890) from left to right. Never skip leading zeros! On the leftmost column (拾万), pull [Red 0] (top cell, next to Black 9) all the way down.',
      },
      'sub-6': {
        phase: '③ Pull 007890 in Red (10,000 / 万)',
        instruction:
          'The 2nd digit is also 0. On the 万 (10,000) column, pull [Red 0] (next to Black 9) all the way down.',
      },
      'sub-7': {
        phase: '③ Pull 007890 in Red (Thousands / 千)',
        instruction:
          'Now for 7890: on the 千 (thousands) column, pull [Red 7] (next to Black 2) all the way down.',
      },
      'sub-8': {
        phase: '③ Pull 007890 in Red (Hundreds / 百)',
        instruction:
          'Next, on the 百 (hundreds) column, pull [Red 8] (next to Black 1) all the way down.',
      },
      'sub-9': {
        phase: '③ Pull 007890 in Red (Tens / 拾)',
        instruction:
          'On the 拾 (tens) column, [Red 9] is next to Black 0, so it moves 0 steps. Tap the highlighted Red 9 cell or click the button below to continue.',
      },
      'sub-10': {
        phase: '③ Pull 007890 in Red (Ones / 円)',
        instruction:
          'Finally, on the rightmost column (円 / ones), pull [Red 0] (top cell, next to Black 9) all the way down. Trailing zeros must also be pulled in red!',
      },
    },
    stepProgress: (current, total) => `STEP ${current} / ${total}`,
    targetChipPull: (place, color, digit) =>
      color === 'red'
        ? `${place}: Red ${digit} (next to Black ${9 - digit})`
        : `${place}: Black ${digit}`,
    targetChipReset: 'Right side: Reset lever',
    skipZeroStepBtn: '0 steps — Continue →',
    retryBtn: 'Retry',
    exitBtn: 'Exit',
    doneBtn: 'Close Tutorial',
    feedback: {
      needReset:
        'Please pull down (or click) the silver reset lever on the right side first.',
      resetDisabled:
        'Reset is disabled during a calculation step. Please pull the highlighted number (or click "Exit" to quit).',
      wrongColumn: (expectedPlace) =>
        `Wrong column! Please pull on the highlighted "${expectedPlace}" column.`,
      notDragged:
        'Instead of clicking, press and drag the highlighted number all the way down.',
      stoppedShort: (pulled, expectedDigit, color) =>
        `Only ${pulled} step(s) pulled (canceled). Place your finger on ${color === 'red' ? `Red ${expectedDigit}` : `Black ${expectedDigit}`} and pull all the way down until it stops.`,
      pulledTooMuch: (pulled, expectedDigit, color) =>
        `Pulled ${pulled} steps (canceled). Please grab the highlighted ${color === 'red' ? `Red ${expectedDigit} (next to Black ${9 - expectedDigit})` : `Black ${expectedDigit}`} cell and pull down.`,
    },
  },
  closeBtn: 'Close',
};
