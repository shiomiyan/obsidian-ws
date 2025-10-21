// @ts-ignore: Obsidian プラグイン環境での型定義
import { type App, requestUrl } from "obsidian";
import type {
  NotionBlock,
  NotionContentAdapter,
  NotionDatabaseResult,
  NotionFetchParams,
  NotionRichText,
} from "./types.ts";

/**
 * 実際のNotionAPIを使用するアダプタ
 * ObsidianのrequestUrl APIを使用してNotionAPIにアクセスします
 */
export class RealNotionContentAdapter implements NotionContentAdapter {
  private obsidianApp?: App;

  setObsidianContext(app: App): void {
    this.obsidianApp = app;
  }

  async fetchDatabase(
    params: NotionFetchParams,
  ): Promise<NotionDatabaseResult> {
    const { databaseId, weekNumber, apiKey } = params;

    try {
      const response = await requestUrl({
        url: `https://api.notion.com/v1/databases/${databaseId}/query`,
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Notion-Version": "2022-06-28",
        },
        body: JSON.stringify({
          filter: {
            property: "Week number",
            formula: {
              string: {
                equals: weekNumber,
              },
            },
          },
        }),
      });

      return response.json as NotionDatabaseResult;
    } catch (error) {
      console.error(`Failed to fetch Notion database ${databaseId}:`, error);
      throw error;
    }
  }

  async pageToMarkdown(pageId: string, apiKey: string): Promise<string> {
    try {
      const response = await requestUrl({
        url: `https://api.notion.com/v1/blocks/${pageId}/children`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Notion-Version": "2022-06-28",
        },
      });

      const blocks = response.json;
      return this.convertBlocksToMarkdown(blocks.results);
    } catch (error) {
      console.error(`Failed to fetch page content ${pageId}:`, error);
      return "";
    }
  }

  private convertBlocksToMarkdown(blocks: NotionBlock[]): string {
    return blocks
      .map((block) => {
        switch (block.type) {
          case "paragraph":
            return this.extractRichText(block.paragraph?.rich_text || []);
          case "heading_1":
            return `# ${
              this.extractRichText(block.heading_1?.rich_text || [])
            }`;
          case "heading_2":
            return `## ${
              this.extractRichText(block.heading_2?.rich_text || [])
            }`;
          case "heading_3":
            return `### ${
              this.extractRichText(block.heading_3?.rich_text || [])
            }`;
          case "bulleted_list_item":
            return `- ${
              this.extractRichText(block.bulleted_list_item?.rich_text || [])
            }`;
          case "numbered_list_item":
            return `1. ${
              this.extractRichText(block.numbered_list_item?.rich_text || [])
            }`;
          default:
            return "";
        }
      })
      .filter((text) => text.length > 0)
      .join("\n\n");
  }

  private extractRichText(richText: NotionRichText[]): string {
    return richText
      .map((text) => {
        let content = text.plain_text;
        if (text.annotations.bold) content = `**${content}**`;
        if (text.annotations.italic) content = `*${content}*`;
        if (text.annotations.code) content = `\`${content}\``;
        return content;
      })
      .join("");
  }
}

/**
 * テスト用のインメモリNotionアダプタ
 * モックデータを使用してテストを実行できます
 */
export class InMemoryNotionContentAdapter implements NotionContentAdapter {
  private mockDatabaseResult: NotionDatabaseResult;
  private mockPageContent: Map<string, string>;

  constructor(
    mockDatabaseResult: NotionDatabaseResult = { results: [] },
    mockPageContent: Map<string, string> = new Map(),
  ) {
    this.mockDatabaseResult = mockDatabaseResult;
    this.mockPageContent = mockPageContent;
  }

  fetchDatabase(params: NotionFetchParams): Promise<NotionDatabaseResult> {
    return Promise.resolve(this.mockDatabaseResult);
  }

  pageToMarkdown(pageId: string, apiKey: string): Promise<string> {
    const content = this.mockPageContent.get(pageId);
    return Promise.resolve(content || `Mock content for page ${pageId}`);
  }

  setMockDatabaseResult(result: NotionDatabaseResult): void {
    this.mockDatabaseResult = result;
  }

  setMockPageContent(pageId: string, content: string): void {
    this.mockPageContent.set(pageId, content);
  }
}
