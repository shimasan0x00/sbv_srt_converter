# SBV → SRT Converter

[![CI](https://github.com/shimasan0x00/sbv_srt_converter/actions/workflows/ci.yml/badge.svg)](https://github.com/shimasan0x00/sbv_srt_converter/actions/workflows/ci.yml)
[![Deploy](https://github.com/shimasan0x00/sbv_srt_converter/actions/workflows/deploy.yml/badge.svg)](https://github.com/shimasan0x00/sbv_srt_converter/actions/workflows/deploy.yml)

ブラウザ内で完結する **SBV → SRT** 字幕変換ツール。

ファイルは外部に送信されません（ローカル変換）。

---

## SBV と SRT の違い

両者とも「タイムコード + 字幕本文」を並べるテキスト形式ですが、書式が異なります。

### SBV (SubViewer / YouTube 字幕)

- YouTube 字幕エディタが出力する形式。
- **インデックス番号なし**。
- タイムスタンプ書式: `H:MM:SS.mmm,H:MM:SS.mmm`
  - 時は 1 桁可（ゼロパディングなし）
  - ミリ秒区切りは **ドット `.`**
  - 開始/終了の区切りは **カンマ `,`**
- キュー間は空行で区切る。

```
0:00:01.000,0:00:03.500
こんにちは

0:00:04.000,0:00:06.000
世界
```

### SRT (SubRip)

- 字幕フォーマットのデファクト標準。多数のプレイヤー/編集ツールが対応。
- **1 始まりの連番インデックスが必須**。
- タイムスタンプ書式: `HH:MM:SS,mmm --> HH:MM:SS,mmm`
  - 時は **2 桁ゼロパディング**
  - ミリ秒区切りは **カンマ `,`**
  - 開始/終了の区切りは ` --> `（半角スペース＋矢印＋半角スペース）
- キュー間は **空行必須**。

```
1
00:00:01,000 --> 00:00:03,500
こんにちは

2
00:00:04,000 --> 00:00:06,000
世界
```

### 主な差分まとめ

| 項目 | SBV | SRT |
| --- | --- | --- |
| インデックス | なし | 1 始まり連番（必須） |
| 時の桁 | 1 桁可 | 2 桁ゼロパディング |
| ミリ秒区切り | `.` | `,` |
| 開始/終了区切り | `,` | ` --> ` |
| キュー間空行 | 慣習的 | 必須 |
| スタイルタグ | 基本なし | 一部プレイヤーで `<i>` 等可 |

---

## 使い方（Web UI）

1. ページを開く。
2. 「SBV ファイルを選ぶ」または点線エリアにファイルをドロップ。
3. 画面下のプレビューで変換結果を確認。
4. 「.srt をダウンロード」で保存。

入力が空、またはタイムスタンプ書式が不正な場合は赤いエラー領域に理由が表示されます（黙って失敗しません）。

---

## 開発

### 必要環境

- Node.js 20+ （Vite 5 / Vitest 2 が要求）。CI は Node 24（Active LTS）で実行。

### セットアップ

```bash
npm install
```

### スクリプト

| コマンド | 用途 |
| --- | --- |
| `npm run dev` | ローカル開発サーバ（既定 `http://localhost:5173`） |
| `npm test` | Vitest を 1 回実行 |
| `npm run test:watch` | Vitest をウォッチ実行 |
| `npm run build` | `dist/` に本番ビルド |
| `npm run preview` | ビルド成果物をローカル配信 |

### ディレクトリ構成

```
.
├── index.html
├── src/
│   ├── converter.js   # 純粋関数 sbvToSrt
│   ├── main.js        # UI 結線
│   └── styles.css
└── test/
    ├── converter.test.js
    └── fixtures/
```

### テスト方針

`CLAUDE.md` に従い TDD（Red → Green → Refactor）。変換ロジックは純粋関数 `sbvToSrt(text: string): string` に閉じ込めて単体テストで仕様を担保しています。

---

## CI / CD

`.github/workflows/` に 2 本のワークフローを同梱しています。

### `ci.yml` — PR で常時テスト＆ビルド検証

| トリガ | ジョブ | 内容 |
| --- | --- | --- |
| `pull_request` (base: main) | `test` | `npm ci` → `npm test` → `npm run build` |
| `workflow_dispatch` | `test` | 同上を手動実行 |

PR をマージ可能にする前に Vitest と Vite のビルドが緑であることを保証します。`main` への push 時は `deploy.yml` 側のビルドジョブで同じ検証を行うため、`ci.yml` では `push` トリガを持たせず二重実行を回避しています。

### `deploy.yml` — main への push で GitHub Pages へ自動デプロイ

`main` への push（および手動 `workflow_dispatch`）で以下を実行：

1. `npm ci` → `npm test` → `npm run build`
2. `dist/` を Pages 用アーティファクトにアップロード
3. `actions/deploy-pages@v4` で公開

`vite.config.js` の `base: './'` によりサブパス（`https://<user>.github.io/<repo>/`）配下でもアセット参照が壊れません。

### 有効化手順（リポジトリ初回のみ）

1. GitHub の `Settings → Pages → Build and deployment` で **Source: GitHub Actions** を選択。
2. `main` に push（または `Actions` タブから `Deploy to GitHub Pages` を手動実行）。
3. ワークフロー完了後、`https://<user>.github.io/<repo>/` で公開される。

> ブランチ保護やレビュー必須化を入れる場合は `Settings → Branches → Branch protection rules` で `main` を保護し、上記 `CI / test` をマージ必須チェックに指定してください。

---

## ライセンス

[MIT License](./LICENSE) © 2026 shimasan0x00
