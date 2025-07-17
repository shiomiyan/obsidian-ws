import { type App, Modal, Notice, Plugin, TFile } from "obsidian";
import { RealNotionContentAdapter } from "./notion-adapter.ts";
import {
	fetchNotionContent,
	generateNotionFileName,
} from "./notion-service.ts";
import type { WebContentPluginSettings } from "./types.ts";
import { DEFAULT_SETTINGS, WebContentSettingTab } from "./settings.ts";

export default class WebContentPlugin extends Plugin {
	settings: WebContentPluginSettings = DEFAULT_SETTINGS;
	private notionContentAdapter: RealNotionContentAdapter =
		new RealNotionContentAdapter();

	override async onload() {
		await this.loadSettings();
		this.notionContentAdapter.setObsidianContext(this.app);

		const notionRibbonIconEl = this.addRibbonIcon(
			"wand-sparkles",
			"Generate weekly summary from Notion",
			(_: MouseEvent) => {
				this.fetchNotionContent();
			},
		);
		notionRibbonIconEl.addClass("notion-content-plugin-ribbon-class");

		this.addCommand({
			id: "fetch-notion-content",
			name: "Generate weekly digest from Notion",
			callback: () => {
				this.fetchNotionContent();
			},
		});

		// 設定タブを追加
		this.addSettingTab(new WebContentSettingTab(this.app, this));
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	fetchNotionContent(): void {
		if (!this.settings.notionApiKey || !this.settings.notionDatabaseId) {
			new Notice("Notion settings are incomplete. Please check the settings.");
			return;
		}

		new WeekNumberInputModal(this.app, (weekNumber: string) => {
			this.executeNotionFetch(weekNumber);
		}).open();
	}

	async executeNotionFetch(weekNumber: string): Promise<void> {
		new Notice(`⏳ Fetching content from Notion Week ${weekNumber}...`);

		try {
			const params = {
				databaseId: this.settings.notionDatabaseId,
				weekNumber: weekNumber,
				apiKey: this.settings.notionApiKey,
			};

			const result = await fetchNotionContent(
				this.notionContentAdapter,
				params,
			);

			if (!result.success) {
				new Notice(`Failed to fetch Notion content: ${result.errorMessage}`);
				return;
			}

			const fileName = generateNotionFileName(weekNumber);
			const filePath = `${this.settings.outputDirectory}/${fileName}`;

			const folder = this.settings.outputDirectory;
			if (!(await this.app.vault.adapter.exists(folder))) {
				await this.app.vault.createFolder(folder);
			}

			const file = this.app.vault.getAbstractFileByPath(filePath);
			if (file instanceof TFile) {
				await this.app.vault.modify(file, result.content);
				new Notice(`${fileName} updated`);
			} else {
				await this.app.vault.create(filePath, result.content);
				new Notice(`${fileName} created`);
			}
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error occurred";
			new Notice(`Failed to fetch Notion content: ${errorMessage}`);
		}
	}
}

class WeekNumberInputModal extends Modal {
	private onSubmit: (weekNumber: string) => void;

	constructor(app: App, onSubmit: (weekNumber: string) => void) {
		super(app);
		this.onSubmit = onSubmit;
	}

	override onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl("h2", { text: "Please enter the week number" });

		const inputContainer = contentEl.createDiv({ cls: "week-input-container" });

		const input = inputContainer.createEl("input", {
			type: "text",
			placeholder: "Example: 2025-W21",
			value: "",
			cls: "week-number-input",
		});

		const buttonContainer = contentEl.createDiv({ cls: "button-container" });

		const submitButton = buttonContainer.createEl("button", {
			text: "Generate",
			cls: "mod-cta",
		});

		const cancelButton = buttonContainer.createEl("button", {
			text: "Cancel",
		});

		input.addEventListener("keydown", (event) => {
			if (event.key === "Enter") {
				this.submit(input.value);
			}
		});

		submitButton.addEventListener("click", () => {
			this.submit(input.value);
		});

		cancelButton.addEventListener("click", () => {
			this.close();
		});

		input.focus();
		input.select();
	}

	override onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}

	private submit(weekNumber: string) {
		if (!weekNumber.trim()) {
			new Notice("Please enter a week number");
			return;
		}

		const isoWeekFormat = /^\d{4}-W([0-4]?\d|5[0-3])$/;
		if (!isoWeekFormat.test(weekNumber.trim())) {
			new Notice("Invalid week number format (e.g., 2025-W21)");
			return;
		}

		this.close();
		this.onSubmit(weekNumber.trim());
	}
}
