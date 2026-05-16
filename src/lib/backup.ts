import { storageGet, storageSet } from "./storage";
import { getCustomTabs, CUSTOM_TABS_KEY, PROMPT_STORAGE_KEYS } from "./prompt-library";
import type { PromptFolder, SavedPromptRecord } from "../types/prompt";

interface PromptBackup {
  version: 1;
  exportedAt: string;
  favorites: SavedPromptRecord[];
  folders: PromptFolder[];
  customTabs: string[];
}

async function buildBackup(): Promise<PromptBackup> {
  const [favorites, folders, customTabs] = await Promise.all([
    storageGet<SavedPromptRecord[]>(PROMPT_STORAGE_KEYS.favorites, []),
    storageGet<PromptFolder[]>(PROMPT_STORAGE_KEYS.folders, []),
    getCustomTabs()
  ]);

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    favorites,
    folders,
    customTabs
  };
}

export async function exportPromptsAsJson() {
  const backup = await buildBackup();
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const timestamp = new Date().toISOString().slice(0, 10);

  await chrome.downloads.download({
    url,
    filename: `prompt-butler-backup-${timestamp}.json`,
    saveAs: true
  });

  URL.revokeObjectURL(url);
}

export async function importPromptsFromJson(file: File): Promise<{
  favorites: number;
  folders: number;
  tabs: number;
}> {
  const text = await file.text();
  let data: unknown;

  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("文件格式不正确，无法解析 JSON。");
  }

  const backup = data as PromptBackup;

  if (!backup.version || !Array.isArray(backup.favorites)) {
    throw new Error("备份文件结构不完整，缺少必要字段。");
  }

  const [existingFavorites, existingFolders, existingTabs] = await Promise.all([
    storageGet<SavedPromptRecord[]>(PROMPT_STORAGE_KEYS.favorites, []),
    storageGet<PromptFolder[]>(PROMPT_STORAGE_KEYS.folders, []),
    getCustomTabs()
  ]);

  // 合并：保留已有 + 新增导入（按 id 去重）
  const existingIds = new Set(existingFavorites.map((r) => r.id));
  const newFavorites = backup.favorites.filter((r) => !existingIds.has(r.id));
  const mergedFavorites = [...newFavorites, ...existingFavorites];

  const existingFolderIds = new Set(existingFolders.map((f) => f.id));
  const newFolders = backup.folders.filter((f) => !existingFolderIds.has(f.id));
  const mergedFolders = [...newFolders, ...existingFolders];

  const mergedTabs = [...new Set([...backup.customTabs, ...existingTabs])];

  await Promise.all([
    storageSet(PROMPT_STORAGE_KEYS.favorites, mergedFavorites),
    storageSet(PROMPT_STORAGE_KEYS.folders, mergedFolders),
    storageSet(CUSTOM_TABS_KEY, mergedTabs)
  ]);

  return {
    favorites: newFavorites.length,
    folders: newFolders.length,
    tabs: mergedTabs.length - existingTabs.length
  };
}
