import type { App } from "obsidian";

/**
 * Notionコンテンツ取得プラグインの型定義
 *
 * このファイルは以下の型を定義します：
 * - プラグイン設定の型
 * - Notion関連の型
 */

// プラグイン設定の型定義
export interface WebContentPluginSettings {
  outputDirectory: string;
  notionApiKey: string;
  notionDatabaseId: string;
}

// Notion関連の型定義

// Notionページのプロパティ型
export interface NotionPageProperties {
  Title: {
    title: { plain_text: string }[];
  };
  URL: {
    url: string;
  };
  Tags: {
    multi_select: { name: string }[];
  };
}

// Notionページ型
export interface NotionPage {
  properties: NotionPageProperties;
  id: string;
}

// Notionデータベース取得結果型
export interface NotionDatabaseResult {
  results: NotionPage[];
}

// タグでグループ化されたエントリ型
export interface GroupedEntries {
  [tag: string]: NotionPage[];
}

// Notion取得パラメータ型
export interface NotionFetchParams {
  databaseId: string;
  weekNumber: string;
  apiKey: string;
}

// Notion取得結果型
export interface NotionFetchResult {
  content: string;
  success: boolean;
  errorMessage?: string;
}

// Notionコンテンツアダプタのインターフェース
export interface NotionContentAdapter {
  fetchDatabase(params: NotionFetchParams): Promise<NotionDatabaseResult>;
  pageToMarkdown(pageId: string, apiKey: string): Promise<string>;
  setObsidianContext?(app: App): void;
}

// Notion APIブロック関連の型定義

// リッチテキストのアノテーション型
export interface NotionTextAnnotations {
  bold: boolean;
  italic: boolean;
  strikethrough: boolean;
  underline: boolean;
  code: boolean;
  color: string;
}

// リッチテキスト型
export interface NotionRichText {
  type: string;
  text?: {
    content: string;
    link?: string | null;
  };
  annotations: NotionTextAnnotations;
  plain_text: string;
  href?: string | null;
}

// Notionブロック型
export interface NotionBlock {
  object: "block";
  id: string;
  type: string;
  paragraph?: {
    rich_text: NotionRichText[];
    color: string;
  };
  heading_1?: {
    rich_text: NotionRichText[];
    color: string;
  };
  heading_2?: {
    rich_text: NotionRichText[];
    color: string;
  };
  heading_3?: {
    rich_text: NotionRichText[];
    color: string;
  };
  bulleted_list_item?: {
    rich_text: NotionRichText[];
    color: string;
  };
  numbered_list_item?: {
    rich_text: NotionRichText[];
    color: string;
  };
}
