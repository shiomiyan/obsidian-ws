# Notion Content Plugin for Obsidian

Notionデータベースからコンテンツを取得してObsidianノートに保存するプラグインです。

## 機能

- Notionデータベースから週次データを取得
- タグ別にグループ化されたMarkdownダイジェストを生成
- カスタマイズ可能な出力ディレクトリ
- Obsidianのfetch実装を使用した安全なリクエスト

## セットアップ

### 1. Notion API の準備

1. [Notion Developers](https://www.notion.so/my-integrations)でインテグレーションを作成
2. API キーをコピー
3. 対象データベースをインテグレーションに共有

### 2. プラグインの設定

1. Obsidianでプラグインの設定を開く
2. Notion API Keyを入力
3. Notion Database IDを入力
4. 取得する週番号を入力（例: 2025W18）
5. 出力ディレクトリを設定（デフォルト: `web-content`）

## 使用方法

### 基本的な使い方

1. 左サイドバーのデータベースアイコンをクリック
2. 自動的に設定された条件でNotionコンテンツを取得します

### コマンドパレットから

1. `Ctrl/Cmd + P`でコマンドパレットを開く
2. "Notionコンテンツを取得"を選択

## 出力形式

生成されるMarkdownファイルは以下の形式になります：

```markdown
# Week 2025W18

## 技術

### 記事タイトル1
**URL**: [記事タイトル1](記事URL)

記事の内容...

---

### 記事タイトル2
**URL**: [記事タイトル2](記事URL)

記事の内容...

---

## ビジネス

### 記事タイトル3
...
```

## 開発

### 前提条件

- Deno 2.0以降
- Node.js（esbuildのため）

### セットアップ

```bash
# 依存関係をインストール
deno install

# 開発サーバーを起動（Temporal API使用のためunstableフラグが必要）
deno task dev --unstable-temporal

# プロダクションビルド
deno task build

# テストを実行
deno task test
```
