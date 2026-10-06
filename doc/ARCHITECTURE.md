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
│   │   ├── micra.test.ts   # Vitest 単体テスト（足し算、補数引き算、桁上がり、リセット等）
│   │   ├── tutorial.ts     # UI非依存のチュートリアル状態管理クラス TutorialSession とステップ定義
│   │   └── tutorial.test.ts# Vitest 単体テスト（足し算・引き算コース進行、誤操作拒否判定等）
│   ├── i18n/
│   │   ├── types.ts        # 多言語メッセージ型定義 (Messages, GuideSection, TutorialMessages)
│   │   ├── ja.ts           # 日本語文言辞書
│   │   ├── en.ts           # 英語文言辞書
│   │   └── index.ts        # 言語判定 (?lang= > localStorage > navigator.language)・保存
│   ├── ui/
│   │   ├── device.ts       # 本体 DOM と SVG（ラベル板、6本のキー、答え窓、レバー、Nagisaロゴ）の生成
│   │   ├── slider.ts       # スライドキー1本分の Pointer Events ドラッグ・切り捨て・バネ復帰制御
│   │   ├── drum.ts         # 答え窓ドラム1桁分の回転アニメーション制御
│   │   ├── lever.ts        # 右側面ゼロ戻しレバーのドラッグ・クリック制御
│   │   └── tutorial-ui.ts  # チュートリアルの吹き出しポップアップ・コース選択・本体ハイライト制御
│   └── styles/
│       ├── base.css        # CSS変数（カラーテーマ）・基本リセット
│       ├── layout.css      # ヘッダー・フッター・言語切替・埋め込みレイアウト
│       ├── modal.css       # モーダルダイアログ・説明コンテンツのスタイル
│       ├── device.css      # ミックラー加算機本体（cqw 座標系）のスタイル
│       └── tutorial.css    # チュートリアル吹き出しポップアップ・ターゲット強調のスタイル
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

### 3.3 本体座標系とレスポンシブ設計 (`src/ui/device.ts`, `src/styles/device.css`)
- `.device` 要素に `aspect-ratio: 100 / 147` と `container-type: inline-size` を指定しています。
- 本体内部のすべてのパーツ（ラベル板、ネジ、スロット、セル高さ `6cqw`、答え窓、レバー等）のサイズ・座標を **`cqw`（コンテナ幅の 1%）** で統一しています。
- 6本の列の中心 X 座標は `COLUMN_CX = [13.5, 28.1, 42.7, 57.3, 71.9, 86.5]`（単位 `cqw`）で定義され、CSS カスタムプロパティ `--cx` を介してラベル・スロット・答え窓の水平位置が完全に一致するよう配置されています。
- `.stage` の `--dw: min(84vw, 400px, calc((100dvh - 190px) / 1.47))` により、PCでもスマホ縦画面でもスクロールなしで本体全体が画面内に収まります。

### 3.4 スライドキーのピッチ計測と切り捨て判定 (`src/ui/slider.ts`)
- `pointerdown` 時に `[data-n]` 属性から掴んだ黒数字 `grabbed`（`0`〜`9`）を取得し、同時に `.cell` の現在の画面上の高さ（px）を `measurePitch()` で実測します。
- `pointermove` 時の移動量 `dy` を `[0, grabbed * pitch]` にクランプして `translateY` でキーを動かします。
- 現在の段数 `steps` は `Math.min(grabbed, Math.floor(px / pitch + 1e-3))` で算出します。これにより、**途中で離した場合は通過済みの段数（切り捨て）** が `onCommit(index, steps)` に渡されます。

### 3.5 チュートリアル設計 (`src/core/tutorial.ts`, `src/ui/tutorial-ui.ts`)
- **純粋状態管理 (`TutorialSession`)**:
  - 足し算コース（`3456 + 2060 = 5516`）と引き算コース（`12500 - 7890 = 4610`）のステップ列を管理します。開始時に答え窓が `0` でない場合は先頭に `reset` ステップを自動追加します。
  - `handleAction()` でユーザーの操作（桁・段数・リセット）を検証し、誤操作（違う桁・途中離し・引きすぎ等）の場合は `accepted: false` と理由を返します。
  - 引き算の `sub-9`（拾の桁の赤 `9` ＝ 黒 `0`、0段）では、該当セルのタップや「次へ」ボタンでの進行に加え、そのまま次の `sub-10`（円の桁の赤 `0` ＝ 黒 `9`）を引いた場合も2ステップ同時進行として許容します。
- **UI・ハイライト連携 (`TutorialController`)**:
  - 本体上部の `.tutorial-popup` の吹き出しポインタ位置（`--pointer-x`）を対象スロットまたはゼロ戻しレバーの実座標に合わせて追従させます。
  - 対象スロット（`.tutorial-target-slot`）、桁ラベル（`.tutorial-target-plate`）、数字セル（`.tutorial-target-cell`、黒強調または赤強調）、減算マーク（`.tutorial-target-mark`）、ゼロ戻しレバー（`.tutorial-target-lever`）をハイライト表示します。
  - `onPullCommit` が `false` を返した際、`src/main.ts` 側で `micra.pull` をスキップして `renderDrums(null)` を呼ぶことで、ドラッグ中に動いたドラムを元の値へ巻き戻します。

