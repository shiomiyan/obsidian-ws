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
      const errorMessage = error instanceof Error
        ? error.message
        : "Unknown error occurred";
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

    contentEl.createEl("h2", { text: "Please select a date" });

    const inputContainer = contentEl.createDiv({ cls: "week-input-container" });

    const input = inputContainer.createEl("input", {
      type: "date",
      value: this.getTodayInputValue(),
      cls: "week-number-input",
    });

    const weekInfo = contentEl.createDiv({ cls: "week-number-display" });
    this.updateWeekInfo(input.value, weekInfo);

    const buttonContainer = contentEl.createDiv({ cls: "button-container" });

    const submitButton = buttonContainer.createEl("button", {
      text: "Generate",
      cls: "mod-cta",
    });

    const cancelButton = buttonContainer.createEl("button", {
      text: "Cancel",
    });

    input.addEventListener("change", () => {
      this.updateWeekInfo(input.value, weekInfo);
    });

    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
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

  private submit(selectedDate: string) {
    if (!selectedDate) {
      new Notice("Please select a date");
      return;
    }

    const weekNumber = this.formatISOWeek(selectedDate);
    if (!weekNumber) {
      new Notice("Invalid date. Please select a valid date.");
      return;
    }

    this.close();
    this.onSubmit(weekNumber);
  }

  private updateWeekInfo(dateInput: string, containerEl: HTMLElement) {
    const weekNumber = this.formatISOWeek(dateInput);
    if (weekNumber) {
      containerEl.setText(`Calculated ISO week: ${weekNumber}`);
    } else {
      containerEl.setText("");
    }
  }

  private getTodayInputValue(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  private formatISOWeek(dateString: string): string | null {
    if (!dateString) {
      return null;
    }

    const [year, month, day] = dateString.split("-").map(Number);
    if (
      [year, month, day].some(
        (value) => Number.isNaN(value) || value === undefined,
      )
    ) {
      return null;
    }

    const date = new Date(Date.UTC(year, month - 1, day));

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    const { isoYear, isoWeek } = this.calculateISOWeek(date);
    return `${isoYear}-W${String(isoWeek).padStart(2, "0")}`;
  }

  private calculateISOWeek(date: Date): { isoYear: number; isoWeek: number } {
    const tmp = new Date(date);
    tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
    const isoWeek = Math.ceil(
      ((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
    );
    return {
      isoYear: tmp.getUTCFullYear(),
      isoWeek,
    };
  }
}
