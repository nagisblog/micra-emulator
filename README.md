# ミックラー加算機 エミュレータ / Micra Adder Emulator

ミクラ精機の小型機械式加減算機「ミックラー加算機」（1960年ごろ、6桁）の動きをブラウザで再現した非公式エミュレータです。
実機の紹介記事: https://www.nagisblog.com/posts/micra-addiator/

## 使い方

- **足し算**: 各桁のスライドキーの黒数字に指（マウス）を置き、手前（下）へ止まるところまで引く。途中で離すと、通過した段数だけ加算されます（2と3の間なら2）。
- **引き算**: 被減数を黒数字で入れる → 円の桁の `↧` の位置（黒の1）を引く → 減数を赤数字で左端から6桁すべて入れる（例: `12500 - 7890` は赤で `007890`）。
- **ゼロ戻し**: 右側面のレバーを下へ引く（クリックでも可）。
- **キーボード**: `← →` 桁選択 / `0-9` 黒数字を引く / `Shift + 数字` 赤数字を引く / `Esc` ゼロ戻し
- URL パラメータ: `?lang=ja|en`（表示言語）、`?embed=1`（iframe 埋め込み用にヘッダ等を非表示）

## 開発

```sh
npm install
npm run dev       # 開発サーバー
npm test          # ロジックの単体テスト (Vitest)
npm run build     # dist/ に静的ファイルを出力
npm run preview   # ビルド結果を http://localhost:4173/micra-emulator/ で確認
```

## 構成

| パス | 内容 |
|---|---|
| `src/core/micra.ts` | 加算・桁上がり・桁あふれ・ゼロ戻しの純粋ロジック |
| `src/ui/device.ts` | 本体 DOM の組み立て（本体幅=100 の座標系、CSS は `cqw`） |
| `src/ui/slider.ts` | スライドキーのドラッグ |
| `src/ui/drum.ts` | 答え窓のドラム（桁上がりアニメーション） |
| `src/ui/lever.ts` | ゼロ戻しレバー |
| `src/i18n/` | 日本語 / 英語の文言 |

## GitHub Pages への公開

1. `nagisblog` Organization にリポジトリ `micra-emulator` を作成して push
2. Settings → Pages → Source を **GitHub Actions** にする
3. `main` への push で `.github/workflows/deploy.yml` が走り、`https://nagisblog.github.io/micra-emulator/` に公開

リポジトリ名を変える場合は `vite.config.ts` の `base` も合わせて変更してください。
