# アーキテクチャ・実装設計書 (ARCHITECTURE)

---

## 1. 技術スタック

| 分類 | 採用技術 | 備考 |
|---|---|---|
| ビルド / 開発環境 | **Vite** | 高速なHMRと静的アセット出力 (`dist/`) |
| 言語 | **TypeScript** (`strict: true`) | フレームワーク（React/Vue等）不使用の Vanilla TS |
| 単体テスト | **Vitest** | `src/core/micra.test.ts` で計算・補数ロジックを検証 |
| スタイリング | **CSS + インラインSVG** | Container Query Units (`cqw`) による比率固定スケーリング |
| デプロイ | **GitHub Actions → GitHub Pages** | `.github/workflows/deploy.yml` |

ランタイムの外部ライブラリ依存は **ゼロ** であり、ビルド後のバンドルサイズは JS + CSS 合計で gzip 約 8KB と非常に軽量です。

---

## 2. ディレクトリ・ファイル構成

```text
micra-emulator/
├── .github/workflows/
│   └── deploy.yml          # main ブランチ push 時にテスト＆ビルドして GitHub Pages へデプロイ
├── doc/                    # 設計・引き継ぎドキュメント（本ディレクトリ）
│   ├── README.md
│   ├── SPECIFICATION.md
│   └── ARCHITECTURE.md
├── public/
│   └── favicon.svg         # フラット調アイコン
├── src/
│   ├── main.ts             # エントリポイント（全体レイアウト、状態連携、モーダル、キーボード、i18n）
│   ├── core/
│   │   ├── micra.ts        # UI非依存の純粋計算クラス Micra と補助関数
│   │   └── micra.test.ts   # Vitest 単体テスト（足し算、補数引き算、桁上がり、リセット等）
│   ├── i18n/
│   │   ├── types.ts        # 多言語メッセージ型定義 (Messages, GuideSection)
│   │   ├── ja.ts           # 日本語文言辞書
│   │   ├── en.ts           # 英語文言辞書
│   │   └── index.ts        # 言語判定 (?lang= > localStorage > navigator.language)・保存
│   ├── ui/
│   │   ├── device.ts       # 本体 DOM と SVG（ラベル板、6本のキー、答え窓、レバー、Nagisaロゴ）の生成
│   │   ├── slider.ts       # スライドキー1本分の Pointer Events ドラッグ・切り捨て・バネ復帰制御
│   │   ├── drum.ts         # 答え窓ドラム1桁分の回転アニメーション制御
│   │   └── lever.ts        # 右側面ゼロ戻しレバーのドラッグ・クリック制御
│   └── styles/
│       ├── base.css        # CSS変数（カラーテーマ）・基本リセット
│       ├── layout.css      # ヘッダー・フッター・言語切替・埋め込みレイアウト
│       ├── modal.css       # モーダルダイアログ・説明コンテンツのスタイル
│       └── device.css      # ミックラー加算機本体（cqw 座標系）のスタイル
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts          # base: '/micra-emulator/' を設定
```

---

## 3. コア設計の詳細

### 3.1 積算カウント (`total`) による状態表現 (`src/core/micra.ts`)
`Micra` クラスは、現在の表示値 `0〜999999` だけでなく、**上限なしの積算カウント `_total`（単調増加する整数）** を内部保持します。

- `pull(index, steps)`: `_total += steps * placeValue(index)`（`placeValue(index)` は $10^{5 - \text{index}}$）
- `value`: `_total % 1_000_000`（答え窓に表示される6桁の値）
- `reset()`: `_total = Math.ceil(_total / 1_000_000) * 1_000_000`
  - ゼロ戻しの際も `_total` を減らすのではなく**次の $10^6$ の倍数へ切り上げる**ことで、すべての答え窓ドラムが常に前方向（順回転）へ回って `0` に揃うようになっています。

### 3.2 ドラッグ中のリアルタイム連動と桁上がり遅延 (`src/main.ts`, `src/ui/drum.ts`)
- 各スライドキーのドラッグ中（未確定状態）の段数は `pending: Map<number, number>` に保持されます。
- 表示用の総カウント `displayTotal()` は `micra.total + Σ(pending[i] * placeValue(i))` で計算されます。
- $i$ 番目の桁のドラムの目標回転位置（累積コマ数）は `Math.floor(displayTotal() / placeValue(i))` です。
- **桁上がりの連鎖表現**:
  - 操作中の桁を `sourceIndex` としたとき、それより左（上位）の桁 $i < \text{sourceIndex}$ には `(\text{sourceIndex} - i) * 60ms` の遅延（`delayMs`）を与えて `drum.setTarget()` を呼び出します。
  - これにより、`009999 + 1` のような計算で下位桁から上位桁へパタパタと順番に桁上がりしていく様子が視覚的に追えます。
  - 遅延タイマーの追い越しを防ぐため、`nextSeq()` による単調増加シーケンス番号 `seq` を渡し、古い更新を無視しています。
- **ドラムの描画 (`Drum`)**:
  - 各ドラムの `.reel` には `0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0` の **11個** の `<span>` が縦に並んでおり、`pos mod 10` を `translateY((-m / 11) * 100%)` で表示することで、`9 → 0` の境界でも逆戻りせず滑らかに順回転します。

### 3.3 本体座標系とレスポンシブ設計 (`src/ui/device.ts`, `src/styles/micra.css`)
- `.device` 要素に `aspect-ratio: 100 / 147` と `container-type: inline-size` を指定しています。
- 本体内部のすべてのパーツ（ラベル板、ネジ、スロット、セル高さ `6cqw`、答え窓、レバー等）のサイズ・座標を **`cqw`（コンテナ幅の 1%）** で統一しています。
- 6本の列の中心 X 座標は `COLUMN_CX = [13.5, 28.1, 42.7, 57.3, 71.9, 86.5]`（単位 `cqw`）で定義され、CSS カスタムプロパティ `--cx` を介してラベル・スロット・答え窓の水平位置が完全に一致するよう配置されています。
- `.stage` の `--dw: min(84vw, 400px, calc((100dvh - 190px) / 1.47))` により、PCでもスマホ縦画面でもスクロールなしで本体全体が画面内に収まります。

### 3.4 スライドキーのピッチ計測と切り捨て判定 (`src/ui/slider.ts`)
- `pointerdown` 時に `[data-n]` 属性から掴んだ黒数字 `grabbed`（`0`〜`9`）を取得し、同時に `.cell` の現在の画面上の高さ（px）を `measurePitch()` で実測します。
- `pointermove` 時の移動量 `dy` を `[0, grabbed * pitch]` にクランプして `translateY` でキーを動かします。
- 現在の段数 `steps` は `Math.min(grabbed, Math.floor(px / pitch + 1e-3))` で算出します。これにより、**途中で離した場合は通過済みの段数（切り捨て）** が `onCommit(index, steps)` に渡されます。

---

## 4. 次の機能（チュートリアル）の実装ガイド

引き継ぎ後に「チュートリアル / Tutorial」機能を実装する際は、以下のフックポイントを利用すると既存の構造を壊さずに実装できます。

1. **DOM 要素の取得 (`DeviceRefs`)**:
   - `device.slots[colIndex]` で各桁のスロット、`device.strips[colIndex].querySelector('.cell[data-n="..."]')` で特定の数字セル、`device.lever` でゼロ戻しレバーの DOM 要素を取得できます。
   - ※ 赤数字 $r$ を案内したい場合のセルは `data-n="${9 - r}"` である点に注意してください（例：赤の `7` は黒の `2` のセル `data-n="2"`）。
2. **イベントフック (`src/main.ts`)**:
   - スライドキー操作完了時は `SliderKey` の `onCommit(index, steps)` が呼ばれます。
   - ゼロ戻し完了時は `reset()` 関数が呼ばれます。
   - ここにチュートリアルのステップ進行判定（例：`tutorial.onAction({ type: 'pull', index, steps })` / `tutorial.onAction({ type: 'reset' })`）を差し込むだけで連動できます。
3. **文言の追加 (`src/i18n/`)**:
   - `src/i18n/types.ts` の `tutorialPlaceholder` をチュートリアル用のデータ構造に置き換え、`ja.ts` / `en.ts` に日英テキストを追加してください。

