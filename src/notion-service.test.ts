import { expect } from "@std/expect";
import { test } from "@std/testing/bdd";
import { InMemoryNotionContentAdapter } from "./notion-adapter.ts";
import {
  fetchNotionContent,
  generateMarkdownContent,
  generateNotionFileName,
  groupEntriesByTag,
} from "./notion-service.ts";
import type { NotionFetchParams, NotionPage } from "./types.ts";

test("groupEntriesByTag はページをタグでグループ化する", () => {
  const mockPages: NotionPage[] = [
    {
      id: "page1",
      properties: {
        Title: { title: [{ plain_text: "記事1" }] },
        URL: { url: "https://example.com/1" },
        Tags: { multi_select: [{ name: "技術" }] },
      },
    },
    {
      id: "page2",
      properties: {
        Title: { title: [{ plain_text: "記事2" }] },
        URL: { url: "https://example.com/2" },
        Tags: { multi_select: [{ name: "技術" }] },
      },
    },
    {
      id: "page3",
      properties: {
        Title: { title: [{ plain_text: "記事3" }] },
        URL: { url: "https://example.com/3" },
        Tags: { multi_select: [{ name: "ビジネス" }] },
      },
    },
  ];

  const grouped = groupEntriesByTag(mockPages);

  expect(Object.keys(grouped)).toEqual(["技術", "ビジネス"]);
  expect(grouped.技術).toHaveLength(2);
  expect(grouped.ビジネス).toHaveLength(1);
});

test("groupEntriesByTag はタグがない場合「未分類」にする", () => {
  const mockPages: NotionPage[] = [
    {
      id: "page1",
      properties: {
        Title: { title: [{ plain_text: "記事1" }] },
        URL: { url: "https://example.com/1" },
        Tags: { multi_select: [] },
      },
    },
  ];

  const grouped = groupEntriesByTag(mockPages);

  expect(Object.keys(grouped)).toEqual(["未分類"]);
  expect(grouped.未分類).toHaveLength(1);
});

test("generateMarkdownContent はMarkdownを正しく生成する", async () => {
  const adapter = new InMemoryNotionContentAdapter();
  adapter.setMockPageContent("page1", "テストコンテンツ1");
  adapter.setMockPageContent("page2", "テストコンテンツ2");

  const groupedEntries = {
    技術: [
      {
        id: "page1",
        properties: {
          Title: { title: [{ plain_text: "記事1" }] },
          URL: { url: "https://example.com/1" },
          Tags: { multi_select: [{ name: "技術" }] },
        },
      },
    ],
    ビジネス: [
      {
        id: "page2",
        properties: {
          Title: { title: [{ plain_text: "記事2" }] },
          URL: { url: "https://example.com/2" },
          Tags: { multi_select: [{ name: "ビジネス" }] },
        },
      },
    ],
  };

  const markdown = await generateMarkdownContent(
    groupedEntries,
    adapter,
    "test-key",
  );

  expect(markdown).toContain("## 技術");
  expect(markdown).toContain("### 記事1");
  expect(markdown).toContain("[記事1](https://example.com/1)");
  expect(markdown).toContain("テストコンテンツ1");
  expect(markdown).toContain("## ビジネス");
  expect(markdown).toContain("### 記事2");
  expect(markdown).toContain("[記事2](https://example.com/2)");
  expect(markdown).toContain("テストコンテンツ2");
});

test("generateNotionFileName は正しいファイル名を生成する", () => {
  const fileName = generateNotionFileName("2025W18");
  expect(fileName).toBe("2025W18.md");
});

test("fetchNotionContent はエントリがない場合にエラーを返す", async () => {
  const adapter = new InMemoryNotionContentAdapter({ results: [] }, new Map());

  const params: NotionFetchParams = {
    databaseId: "test-db",
    weekNumber: "2025W18",
    apiKey: "test-key",
  };

  const result = await fetchNotionContent(adapter, params);

  expect(result.success).toBe(false);
  expect(result.errorMessage).toBe(
    "ブックマークされた記事が見つかりませんでした",
  );
  expect(result.content).toBe("");
});

test("fetchNotionContent は正常にコンテンツを取得する", async () => {
  const mockPages: NotionPage[] = [
    {
      id: "page1",
      properties: {
        Title: { title: [{ plain_text: "記事1" }] },
        URL: { url: "https://example.com/1" },
        Tags: { multi_select: [{ name: "技術" }] },
      },
    },
  ];

  const adapter = new InMemoryNotionContentAdapter(
    { results: mockPages },
    new Map([["page1", "テストコンテンツ"]]),
  );

  const params: NotionFetchParams = {
    databaseId: "test-db",
    weekNumber: "2025W18",
    apiKey: "test-key",
  };

  const result = await fetchNotionContent(adapter, params);

  expect(result.success).toBe(true);
  expect(result.content).toContain("## 技術");
  expect(result.content).toContain("### 記事1");
  expect(result.content).toContain("テストコンテンツ");
});
