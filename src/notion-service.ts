import type {
	GroupedEntries,
	NotionContentAdapter,
	NotionFetchParams,
	NotionFetchResult,
	NotionPage,
} from "./types.ts";

export async function fetchNotionContent(
	adapter: NotionContentAdapter,
	params: NotionFetchParams,
): Promise<NotionFetchResult> {
	try {
		const databaseResult = await adapter.fetchDatabase(params);

		if (databaseResult.results.length === 0) {
			return {
				success: false,
				content: "",
				errorMessage: "💤 No entries found for this week.",
			};
		}

		const groupedEntries = groupEntriesByTag(databaseResult.results);

		const markdownContent = await generateMarkdownContent(
			groupedEntries,
			adapter,
			params.apiKey,
		);

		return {
			success: true,
			content: markdownContent,
		};
	} catch (error) {
		console.error("Notion content fetch failed:", error);
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error occurred";
		return {
			success: false,
			content: "",
			errorMessage,
		};
	}
}

export function groupEntriesByTag(pages: NotionPage[]): GroupedEntries {
	const groupedEntries: GroupedEntries = {};

	for (const page of pages) {
		const tags = page.properties.Tags.multi_select;
		const firstTag = tags.length > 0 ? tags[0].name : "Others";

		if (!groupedEntries[firstTag]) {
			groupedEntries[firstTag] = [];
		}
		groupedEntries[firstTag].push(page);
	}

	return groupedEntries;
}

export async function generateMarkdownContent(
	groupedEntries: GroupedEntries,
	adapter: NotionContentAdapter,
	apiKey: string,
): Promise<string> {
	let markdownOutput = "";

	for (const [tag, entries] of Object.entries(groupedEntries)) {
		markdownOutput += `## ${tag}\n\n`;

		for (const entry of entries) {
			const title = entry.properties.Title.title[0]?.plain_text || "Untitled";
			const url = entry.properties.URL.url;

			markdownOutput += `### ${title}\n\n`;
			markdownOutput += `[${title}](${url})\n\n`;

			const pageContent = await adapter.pageToMarkdown(entry.id, apiKey);
			if (pageContent.trim()) {
				markdownOutput += `${pageContent}\n\n`;
			}
		}
	}

	return markdownOutput.trim();
}

export function generateNotionFileName(weekNumber: string): string {
	return `${weekNumber}.md`;
}
