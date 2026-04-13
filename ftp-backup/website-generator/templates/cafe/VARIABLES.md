# UDS自動LP制作 — カフェ業種テンプレート
# ヒアリング変数一覧

## 使い方
以下の {{変数名}} をヒアリング情報で置換してHTMLを生成します。
スクリプト（website-generator）での自動置換に対応した形式です。

---

## 【基本情報】全ページ共通

| 変数名 | 内容 | 例 |
|---|---|---|
| {{SHOP_NAME}} | 店名 | カフェスタンドフォーシーズン |
| {{CATCHCOPY}} | キャッチコピー | 自然の中で、ゆったりと。 |
| {{META_DESCRIPTION}} | メタ説明文（SEO） | 阿蘇の自然に囲まれた... |
| {{AREA}} | エリア名 | 阿蘇・産山村 |
| {{OPEN_YEAR}} | 開業年 | 2024 |
| {{ADDRESS}} | 住所 | 熊本県阿蘇郡産山村... |
| {{POSTAL_CODE}} | 郵便番号 | 869-2703 |
| {{TEL}} | 電話番号 | 090-0000-0000 |
| {{OPEN_TIME}} | 営業時間 | 10:00〜17:00 |
| {{CLOSE_DAY}} | 定休日 | 火・水曜日 |
| {{SNS_URL}} | InstagramなどSNS URL | https://instagram.com/... |
| {{YEAR}} | 著作権年（自動） | 2026 |
| {{ACCESS_NOTE}} | アクセス補足 | 池山水源から徒歩1分 |
| {{GOOGLE_MAP_EMBED}} | Googleマップ埋め込みiframe | ※制作時に差し込み |

---

## 【index.html — TOP】

| 変数名 | 内容 |
|---|---|
| {{SHOP_DESCRIPTION}} | 店舗紹介文（2〜3文） |
| {{FEATURE_1_TITLE}} | こだわり1タイトル |
| {{FEATURE_1_TEXT}} | こだわり1説明文 |
| {{FEATURE_2_TITLE}} | こだわり2タイトル |
| {{FEATURE_2_TEXT}} | こだわり2説明文 |
| {{FEATURE_3_TITLE}} | こだわり3タイトル |
| {{FEATURE_3_TEXT}} | こだわり3説明文 |

---

## 【menu.html — メニュー】

| 変数名 | 内容 |
|---|---|
| {{MENU_D1_NAME}} 〜 {{MENU_D4_NAME}} | ドリンクメニュー名（4品） |
| {{MENU_D1_DESC}} 〜 {{MENU_D4_DESC}} | ドリンク説明文 |
| {{MENU_D1_PRICE}} 〜 {{MENU_D4_PRICE}} | ドリンク価格（税込） |
| {{MENU_F1_NAME}} 〜 {{MENU_F2_NAME}} | フードメニュー名（2品） |
| {{MENU_F1_DESC}} 〜 {{MENU_F2_DESC}} | フード説明文 |
| {{MENU_F1_PRICE}} 〜 {{MENU_F2_PRICE}} | フード価格 |
| {{MENU_S1_NAME}} 〜 {{MENU_S2_NAME}} | スイーツメニュー名（2品） |
| {{MENU_S1_DESC}} 〜 {{MENU_S2_DESC}} | スイーツ説明文 |
| {{MENU_S1_PRICE}} 〜 {{MENU_S2_PRICE}} | スイーツ価格 |

---

## 【about.html — 店舗情報】

| 変数名 | 内容 |
|---|---|
| {{CONCEPT_TITLE}} | コンセプトタイトル |
| {{CONCEPT_LEAD}} | コンセプトリード文（1〜2文） |
| {{CONCEPT_BODY}} | コンセプト本文 |
| {{SEATS}} | 席数 |
| {{PARKING}} | 駐車場情報 |
| {{STAFF_1_NAME}} | スタッフ名 |
| {{STAFF_1_ROLE}} | 役職・肩書き |
| {{STAFF_1_BIO}} | スタッフ紹介文 |

---

## 【news.html — お知らせ】

| 変数名 | 内容 |
|---|---|
| {{NEWS_1_DATE}} | 記事1日付（例: 2026.04.01） |
| {{NEWS_1_CAT}} | カテゴリ（お知らせ/新メニュー/イベント） |
| {{NEWS_1_TITLE}} | 記事1タイトル |
| {{NEWS_1_EXCERPT}} | 記事1本文抜粋 |
| {{NEWS_2_DATE}} 〜 {{NEWS_3_DATE}} | 記事2〜3 同様 |

---

## 【CSS変数（style.css）】— デザインカスタマイズ

| 変数名 | 内容 | カフェデフォルト |
|---|---|---|
| --color-primary | メインカラー | #3B2F2F（ダークブラウン）|
| --color-accent | アクセントカラー | #C9A87C（ゴールド）|
| --color-bg | 背景色 | #FAF7F2（オフホワイト）|
| --color-bg-dark | フッター背景 | #2A1F1F |

### 業種別カラー変更例
- 飲食・カフェ: ブラウン × ゴールド（デフォルト）
- 宿泊・観光: ネイビー × テラコッタ
- 士業・コンサル: チャコール × アクアブルー
- 小売・EC: スレート × コーラル

---

## 【画像挿入箇所一覧】

| ページ | 箇所 | 推奨サイズ |
|---|---|---|
| index | ヒーローメイン | 1200×900px 以上 |
| index | ギャラリー写真 × 5 | 800×600px 以上 |
| menu | 各メニュー写真 | 200×200px（正方形）|
| about | コンセプト写真 | 800×900px |
| about | スタッフ写真 | 400×400px（正方形）|
| news | 記事サムネイル | 400×280px |

---

## 【フォーム送信先の差し替え】
contact.html の handleSubmit() 関数内を以下に差し替え:
- Formspree: `fetch('https://formspree.io/f/XXXX', {...})`
- Google Apps Script: GAS WebアプリURLへPOST
- メールフォームProなど外部サービスのactionURLに差し替えも可
