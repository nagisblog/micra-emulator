# ミックラー加算機エミュレータ ドキュメント（AI引き継ぎ用）

このディレクトリには、ミックラー加算機（Micra Adder）ブラウザエミュレータの要件定義・設計仕様・アーキテクチャ・残タスクをまとめています。別のAIエージェントや開発者が作業を引き継ぐ際は、まずこのファイルから参照してください。

## ドキュメント一覧

1. **[`SPECIFICATION.md`](./SPECIFICATION.md)** — 要件定義・実機仕様・ユーザー合意事項（操作仕様、デザイン方針、多言語、モーダル仕様）
2. **[`ARCHITECTURE.md`](./ARCHITECTURE.md)** — 技術スタック・ファイル構成・内部ロジック・UI座標系・アニメーション設計・チュートリアル実装ガイド

---

## 現在の実装状況（完了済み）

- [x] **プロジェクト基盤**: Vite + TypeScript (strict) + Vitest（ランタイム外部依存ゼロ）
- [x] **コア計算ロジック** (`src/core/micra.ts`, `src/core/micra.test.ts`)
  - 6桁（拾万・万・千・百・拾・円）の加算、自動桁上がり、最上位桁あふれ切り捨て（$\bmod 10^6$）、ゼロ戻し
  - 説明書の足し算例（`3456 + 2060 = 005516`）および補数による引き算例（`12500 - 7890 = 004610`）の単体テスト通過済み
- [x] **本体UI・フラットイラスト調デザイン** (`src/ui/device.ts`, `src/styles/micra.css`)
  - 実機縦横比（$100:147$）を CSS Container Query Units (`cqw`) で完全レスポンシブ描画
  - 上部ラベル板は言語を問わず実機どおり漢字「拾万・万・千・百・拾・円」のみ表示（補助数字なし）
  - 下部カバーの筆記体ロゴは遊び心として実機の `Micra` から **`Nagisa`** に変更済み
- [x] **スライドキー操作** (`src/ui/slider.ts`)
  - Pointer Events によるドラッグ追従、掴んだ黒数字 $n$ の段数でのストッパ制限
  - **途中で手を離した場合は切り捨て**（例：2と3の間で離したら `2` 段分加算）
  - 手を離すとバネアニメーションで元の位置へ復帰
- [x] **答え窓ドラム・桁上がりアニメーション** (`src/ui/drum.ts`)
  - スライドキーのドラッグにリアルタイム連動して回転
  - 桁上がり時は上位桁ほど `60ms` ずつ遅延して回る連鎖アニメーション
- [x] **ゼロ戻しレバー** (`src/ui/lever.ts`)
  - 右側面レバーのドラッグ（可動域の60%以上で発動）またはクリック／`Esc` キーで全桁0へリセット
- [x] **多言語対応（日本語 / 英語）** (`src/i18n/`)
  - `?lang=ja|en` > `localStorage` > `navigator.language` の優先順で初期言語を決定
  - ヘッダー右上のトグルで即時切り替え
- [x] **初回ウェルカムポップアップ & 「説明」モーダル** (`src/main.ts`)
  - 初回ロード時（`?embed=1` 以外）にウェルカムポップアップを表示（ボタンは「閉じる」のみ）
  - ヘッダーの「説明 / How to Use」ボタンから4セクション（1. 概要、2. リセットの仕方、3. 足し算の仕方、4. 引き算の仕方）を表示
- [x] **「チュートリアル / Tutorial」機能** (`src/core/tutorial.ts`, `src/core/tutorial.test.ts`, `src/ui/tutorial-ui.ts`, `src/styles/tutorial.css`)
  - 「足し算コース（`3456 + 2060 = 5516`）」「引き算コース（`12500 - 7890 = 4610`）」の選択式チュートリアル
  - 本体上部の吹き出しポップアップ（対象列を指し示すポインタつき）と対象セル・レバーのハイライト表示
  - 誤操作（違う桁・途中離し・引きすぎ等）の自動キャンセルと案内メッセージ表示
- [x] **GitHub Pages デプロイ準備** (`.github/workflows/deploy.yml`, `vite.config.ts`)
  - `https://nagisblog.github.io/micra-emulator/` 向けに `base: '/micra-emulator/'` 設定済み

---

## 残タスク・今後の拡張予定

### 1. GitHub リポジトリ作成と公開
- ローカルで実装が固まった段階で、`nagisblog` Organization に新規リポジトリ `micra-emulator` を作成し push する
- リポジトリの Settings → Pages → Source を **GitHub Actions** に設定する

---

## 開発コマンド早見表

```sh
npm install          # 依存パッケージのインストール
npx vite --port 5173 # 開発サーバー起動（PowerShellで npm run dev -- --port とすると引数がずれるため npx vite 推奨）
npm test             # Vitest 単体テスト実行
npm run typecheck    # TypeScript 型チェック (tsc --noEmit)
npm run build        # 本番ビルド（dist/ に出力）
```

