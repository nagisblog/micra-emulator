# Micra Adder Emulator

[日本語](./README.md) | **English**

**[Try it in your browser (GitHub Pages)](https://nagisblog.github.io/micra-emulator/?lang=en)**

An unofficial browser emulator that recreates the operation of the Micra Adder, a compact six-digit mechanical adding and subtracting machine made by Micra Seiki around 1960.
Article about the original machine (in Japanese): https://www.nagisblog.com/posts/micra-addiator/

## How to Use

- **Addition**: Place your finger (or mouse pointer) on a black number on a digit's slider and pull it down until it stops. If you release it partway, only the completed steps are added (for example, releasing between steps 2 and 3 adds 2).
- **Subtraction**: Enter the starting number using the black numbers → pull the black `1` next to the `↧` mark in the rightmost (units) column → enter the number to subtract using the red numbers across all six columns, starting from the left (for example, enter `007890` in red for `12500 - 7890`).
- **Reset to zero**: Pull down the lever on the right side, or click it.
- **Keyboard**: `← →` select a digit / `0-9` pull a black number / `Shift + number` pull a red number / `Esc` reset to zero
- URL parameters: `?lang=ja|en` selects the interface language; `?embed=1` hides the header and other surrounding elements for iframe embedding.

## Development

```sh
npm install
npm run dev       # Start the development server
npm test          # Run logic unit tests (Vitest)
npm run build     # Output static files to dist/
npm run preview   # Preview the build at http://localhost:4173/micra-emulator/
```

## Project Structure

| Path | Description |
|---|---|
| `src/core/micra.ts` | Pure logic for addition, carrying, overflow, and resetting to zero |
| `src/ui/device.ts` | Device DOM assembly (coordinates based on a device width of 100; CSS uses `cqw`) |
| `src/ui/slider.ts` | Slider dragging |
| `src/ui/drum.ts` | Result-window drums and carry animations |
| `src/ui/lever.ts` | Reset lever |
| `src/i18n/` | Japanese and English interface text |

## Publishing to GitHub Pages

1. Create a repository named `micra-emulator` in the `nagisblog` organization and push the code.
2. Set Settings → Pages → Source to **GitHub Actions**.
3. A push to `main` runs `.github/workflows/deploy.yml` and publishes the app at `https://nagisblog.github.io/micra-emulator/`.

If you rename the repository, update `base` in `vite.config.ts` accordingly.
