# fs-sumiyaki-manager

## 概要
フォーシーズン炭火焼プロジェクトの支出管理PWAアプリ

## スタック
- **ランタイム**: Node.js 20
- **フレームワーク**: Express.js
- **フロントエンド**: バニラJS / HTML / CSS（PWA対応）
- **データ保存**: JSONファイル（`data/expenses.json`）
- **ポート**: 5000

## 画面構成
1. **支出登録** — 金額・区分・品目を入力して支出を登録
2. **支出一覧** — 登録した支出の一覧・フィルター・月別合計
3. **在庫表** — 設備投資・原材料費のみ表示（消耗品費は除外）

## 区分
- 設備投資
- 原材料費
- 消耗品費

## ファイル構成
```
.
├── index.js              # Expressサーバー（APIエンドポイント）
├── package.json          # プロジェクト設定
├── data/
│   └── expenses.json     # データ保存ファイル
└── public/
    ├── index.html        # SPA HTMLエントリーポイント
    ├── style.css         # スタイル（スマホファースト）
    ├── app.js            # フロントエンドJS
    ├── manifest.json     # PWAマニフェスト
    └── sw.js             # Service Worker
```

## APIエンドポイント
- `GET /api/expenses` — 支出一覧取得
- `POST /api/expenses` — 支出登録
- `DELETE /api/expenses/:id` — 支出削除
