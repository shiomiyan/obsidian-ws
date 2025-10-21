import { type App, type Plugin, PluginSettingTab, Setting } from "obsidian";
import type { WebContentPluginSettings } from "./types.ts";

export const DEFAULT_SETTINGS: WebContentPluginSettings = {
  outputDirectory: "",
  notionApiKey: "",
  notionDatabaseId: "",
};

interface WebContentPluginInterface extends Plugin {
  settings: WebContentPluginSettings;
  saveSettings(): Promise<void>;
}

export class WebContentSettingTab extends PluginSettingTab {
  plugin: WebContentPluginInterface;

  constructor(app: App, plugin: WebContentPluginInterface) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName("Output Directory")
      .setDesc("Directory to save Markdown files")
      .addText((text) =>
        text
          .setPlaceholder("Notes")
          .setValue(this.plugin.settings.outputDirectory)
          .onChange(async (value) => {
            this.plugin.settings.outputDirectory = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Notion API Key")
      .setDesc("Enter your Notion API Key")
      .addText((text) =>
        text
          .setPlaceholder("Notion API Key")
          .setValue(this.plugin.settings.notionApiKey || "")
          .onChange(async (value) => {
            this.plugin.settings.notionApiKey = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Notion Database ID")
      .setDesc("Enter the target Notion Database ID")
      .addText((text) =>
        text
          .setPlaceholder("Notion Database ID")
          .setValue(this.plugin.settings.notionDatabaseId || "")
          .onChange(async (value) => {
            this.plugin.settings.notionDatabaseId = value;
            await this.plugin.saveSettings();
          })
      );

    containerEl.createEl("p", {
      text:
        `Usage: Click the ribbon icon or run "Generate Week Digest" from the command palette. A dialog for entering the week number will appear when you execute it.`,
      cls: "setting-item-description",
    });
  }
}
