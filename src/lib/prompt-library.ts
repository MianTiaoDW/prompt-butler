import { storageGet, storageSet } from "./storage";
import type {
  PromptFolder,
  PromptOutputFormat,
  SavedPromptRecord
} from "../types/prompt";
import type { ProviderId } from "../types/settings";

export const PROMPT_STORAGE_KEYS = {
  favorites: "prompt-butler-favorites",
  workspace: "prompt-butler-workspace",
  folders: "prompt-butler-folders"
} as const;

export const DEFAULT_PROMPT_TABS = [
  "角色设定",
  "图像生成",
  "收藏",
  "Nano精修",
  "AI视频运镜",
  "3D建模",
  "电商详情页"
] as const;

export const CORE_TABS: readonly string[] = ["角色设定", "图像生成", "收藏"];

export const CUSTOM_TABS_KEY = "prompt-butler-custom-tabs";
const DELETED_TABS_KEY = "prompt-butler-deleted-tabs";
const TAB_ORDER_KEY = "prompt-butler-tab-order";

export async function getCustomTabs(): Promise<string[]> {
  return storageGet<string[]>(CUSTOM_TABS_KEY, []);
}

export async function getVisibleTabs(): Promise<string[]> {
  const customTabs = await getCustomTabs();
  const deletedTabs = await storageGet<string[]>(DELETED_TABS_KEY, []);
  const tabOrder = await storageGet<string[]>(TAB_ORDER_KEY, []);
  const deletedSet = new Set(deletedTabs);

  const allTabs = [...DEFAULT_PROMPT_TABS, ...customTabs];
  const visible = allTabs.filter((t) => !deletedSet.has(t));

  if (tabOrder.length === 0) return visible;

  const ordered = tabOrder.filter((t) => visible.includes(t));
  const newTabs = visible.filter((t) => !ordered.includes(t));
  return [...ordered, ...newTabs];
}

export async function saveTabOrder(orderedTabs: string[]) {
  await storageSet(TAB_ORDER_KEY, orderedTabs);
}

export async function addCustomTab(name: string) {
  const tabs = await getCustomTabs();
  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new Error("预设名称不能为空。");
  }

  const deletedTabs = await storageGet<string[]>(DELETED_TABS_KEY, []);
  const allExisting = [...DEFAULT_PROMPT_TABS, ...tabs].filter((t) => !deletedTabs.includes(t));
  if (allExisting.includes(trimmedName)) {
    throw new Error("同名预设已存在。");
  }

  const next = [...tabs, trimmedName];
  await storageSet(CUSTOM_TABS_KEY, next);

  // Add to tab order
  const tabOrder = await storageGet<string[]>(TAB_ORDER_KEY, []);
  await storageSet(TAB_ORDER_KEY, [...tabOrder, trimmedName]);

  return next;
}

export async function renameCustomTab(oldName: string, newName: string) {
  const tabs = await getCustomTabs();
  const trimmedName = newName.trim();
  const idx = tabs.indexOf(oldName);

  if (idx === -1) {
    throw new Error("预设不存在。");
  }

  if (!trimmedName) {
    throw new Error("预设名称不能为空。");
  }

  if (
    DEFAULT_PROMPT_TABS.includes(trimmedName as (typeof DEFAULT_PROMPT_TABS)[number]) ||
    tabs.some((t, i) => i !== idx && t === trimmedName)
  ) {
    throw new Error("同名预设已存在。");
  }

  const next = [...tabs];
  next[idx] = trimmedName;
  await storageSet(CUSTOM_TABS_KEY, next);

  // Update prompt categories referencing the old name
  const favorites = await storageGet<SavedPromptRecord[]>(PROMPT_STORAGE_KEYS.favorites, []);
  const nextFavorites = favorites.map((r) =>
    r.category === oldName || r.category.startsWith(`${oldName}/`)
      ? { ...r, category: r.category.replace(oldName, trimmedName), updatedAt: new Date().toISOString() }
      : r
  );
  await storageSet(PROMPT_STORAGE_KEYS.favorites, nextFavorites);

  // Update folders referencing the old scope
  const folders = await storageGet<PromptFolder[]>(PROMPT_STORAGE_KEYS.folders, []);
  const nextFolders = folders.map((f) =>
    f.scope === oldName ? { ...f, scope: trimmedName } : f
  );
  await storageSet(PROMPT_STORAGE_KEYS.folders, nextFolders);

  return next;
}

export async function deleteTab(name: string): Promise<{ customTabs: string[]; visibleTabs: string[] }> {
  if (CORE_TABS.includes(name)) {
    throw new Error("核心标签不能删除。");
  }

  // Remove from custom tabs if applicable
  let customTabs = await getCustomTabs();
  if (customTabs.includes(name)) {
    customTabs = customTabs.filter((t) => t !== name);
    await storageSet(CUSTOM_TABS_KEY, customTabs);
  }

  // Add to deleted set
  const deletedTabs = await storageGet<string[]>(DELETED_TABS_KEY, []);
  if (!deletedTabs.includes(name)) {
    await storageSet(DELETED_TABS_KEY, [...deletedTabs, name]);
  }

  // Remove from tab order
  const tabOrder = await storageGet<string[]>(TAB_ORDER_KEY, []);
  await storageSet(TAB_ORDER_KEY, tabOrder.filter((t) => t !== name));

  const visibleTabs = await getVisibleTabs();
  return { customTabs, visibleTabs };
}

const tagRules = [
  { tag: "角色设定", keywords: ["角色", "设定", "人设", "character"] },
  { tag: "光影", keywords: ["光", "光影", "lighting", "rim light", "glow"] },
  { tag: "运镜", keywords: ["镜头", "camera", "dolly", "tracking", "推镜"] },
  { tag: "打斗", keywords: ["战斗", "打斗", "combat", "fight", "action"] },
  { tag: "写实", keywords: ["realistic", "photoreal", "写实", "纪实"] },
  { tag: "插画", keywords: ["illustration", "anime", "插画", "漫画"] },
  { tag: "3D建模", keywords: ["3d", "建模", "render", "octane"] },
  { tag: "电商详情页", keywords: ["电商", "产品", "商品", "详情页", "product"] }
];

export function recommendPromptTags(content: string) {
  const normalized = content.toLowerCase();
  const matches = tagRules
    .filter((rule) => rule.keywords.some((keyword) => normalized.includes(keyword.toLowerCase())))
    .map((rule) => rule.tag);

  return matches.length > 0 ? matches.slice(0, 4) : ["收藏", "待整理"];
}

export async function savePromptToFavorites(input: {
  provider: ProviderId;
  model: string;
  format: PromptOutputFormat;
  content: string;
  title?: string;
}) {
  const existing = await storageGet<SavedPromptRecord[]>(
    PROMPT_STORAGE_KEYS.favorites,
    []
  );
  const record: SavedPromptRecord = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: input.title?.trim() || "",
    createdAt: new Date().toISOString(),
    provider: input.provider,
    model: input.model,
    format: input.format,
    content: input.content,
    category: "收藏",
    tags: recommendPromptTags(input.content),
    order: 0
  };

  await storageSet(PROMPT_STORAGE_KEYS.favorites, [record, ...existing]);

  return record;
}

export async function updateFavoritePrompt(
  promptId: string,
  patch: Partial<Pick<SavedPromptRecord, "title" | "content" | "category" | "tags">>
) {
  const existing = await storageGet<SavedPromptRecord[]>(
    PROMPT_STORAGE_KEYS.favorites,
    []
  );
  const nextRecords = existing.map((record) =>
    record.id === promptId
      ? {
          ...record,
          ...patch,
          updatedAt: new Date().toISOString()
        }
      : record
  );

  await storageSet(PROMPT_STORAGE_KEYS.favorites, nextRecords);

  return nextRecords.find((record) => record.id === promptId) ?? null;
}

export async function createPromptFolder(name: string, scope: string) {
  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new Error("文件夹名称不能为空。");
  }

  const existing = await storageGet<PromptFolder[]>(PROMPT_STORAGE_KEYS.folders, []);

  if (existing.some((folder) => folder.scope === scope && folder.name === trimmedName)) {
    throw new Error("同名文件夹已存在。");
  }

  const scopeFolders = existing.filter((folder) => folder.scope === scope);
  const nextOrder = scopeFolders.length === 0 ? 0 : Math.max(...scopeFolders.map((folder) => folder.order ?? 0)) + 1;
  const folder: PromptFolder = {
    id: `folder-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: trimmedName,
    scope,
    createdAt: new Date().toISOString(),
    order: nextOrder
  };

  await storageSet(PROMPT_STORAGE_KEYS.folders, [...existing, folder]);
  return folder;
}

export async function renamePromptFolder(folderId: string, name: string) {
  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new Error("文件夹名称不能为空。");
  }

  const existing = await storageGet<PromptFolder[]>(PROMPT_STORAGE_KEYS.folders, []);

  const currentFolder = existing.find((folder) => folder.id === folderId);
  const scope = currentFolder?.scope;

  if (!scope) {
    throw new Error("未找到要修改的文件夹。");
  }

  if (
    existing.some(
      (folder) => folder.id !== folderId && folder.scope === scope && folder.name === trimmedName
    )
  ) {
    throw new Error("同名文件夹已存在。");
  }

  const nextFolders = existing.map((folder) =>
    folder.id === folderId
      ? {
          ...folder,
          name: trimmedName
        }
      : folder
  );

  await storageSet(PROMPT_STORAGE_KEYS.folders, nextFolders);
  return nextFolders.find((folder) => folder.id === folderId) ?? null;
}

export async function deletePromptFolder(folderId: string) {
  const existing = await storageGet<PromptFolder[]>(PROMPT_STORAGE_KEYS.folders, []);
  const targetFolder = existing.find((folder) => folder.id === folderId);

  if (!targetFolder) {
    return false;
  }

  const nextFolders = existing
    .filter((folder) => folder.id !== folderId)
    .map((folder) => {
      if (folder.scope !== targetFolder.scope) {
        return folder;
      }

      return {
        ...folder,
        order: folder.order > targetFolder.order ? folder.order - 1 : folder.order
      };
    });

  const favorites = await storageGet<SavedPromptRecord[]>(PROMPT_STORAGE_KEYS.favorites, []);
  const folderCategory = `${targetFolder.scope}/${targetFolder.name}`;
  const nextFavorites = favorites.map((record) =>
    record.category === folderCategory
      ? {
          ...record,
          category: targetFolder.scope,
          updatedAt: new Date().toISOString()
        }
      : record
  );

  await storageSet(PROMPT_STORAGE_KEYS.folders, nextFolders);
  await storageSet(PROMPT_STORAGE_KEYS.favorites, nextFavorites);
  return true;
}

export async function reorderPromptFolders(scope: string, orderedIds: string[]) {
  const existing = await storageGet<PromptFolder[]>(PROMPT_STORAGE_KEYS.folders, []);
  const orderMap = new Map(orderedIds.map((id, index) => [id, index]));
  const nextFolders = existing.map((folder) => {
    if (folder.scope !== scope || !orderMap.has(folder.id)) {
      return folder;
    }

    return {
      ...folder,
      order: orderMap.get(folder.id) ?? folder.order
    };
  });

  await storageSet(PROMPT_STORAGE_KEYS.folders, nextFolders);
  return nextFolders.filter((folder) => folder.scope === scope);
}

export function searchPromptRecords(records: SavedPromptRecord[], searchQuery: string) {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  if (!normalizedQuery) {
    return records;
  }

  return records.filter((record) => {
    const haystacks = [
      record.title,
      record.content,
      record.category,
      record.provider,
      record.model,
      ...record.tags
    ];

    return haystacks.some((value) => value.toLowerCase().includes(normalizedQuery));
  });
}

// --- 种子数据导入 ---

export async function importSeedPrompts(seeds: SavedPromptRecord[]): Promise<number> {
  const existing = await storageGet<SavedPromptRecord[]>(PROMPT_STORAGE_KEYS.favorites, []);
  const existingIds = new Set(existing.map((r) => r.id));
  const newRecords = seeds.filter((r) => !existingIds.has(r.id));

  if (newRecords.length === 0) return 0;

  await storageSet(PROMPT_STORAGE_KEYS.favorites, [...newRecords, ...existing]);
  return newRecords.length;
}

export async function ensureSeedCategories(categories: string[]) {
  const tabs = await getCustomTabs();
  const deletedTabs = await storageGet<string[]>(DELETED_TABS_KEY, []);
  let changed = false;

  for (const cat of categories) {
    const isDefault = DEFAULT_PROMPT_TABS.includes(cat as (typeof DEFAULT_PROMPT_TABS)[number]);
    const isCustom = tabs.includes(cat);
    const isDeleted = deletedTabs.includes(cat);
    if (!isDefault && !isCustom && !isDeleted) {
      tabs.push(cat);
      changed = true;
    }
  }

  if (changed) {
    await storageSet(CUSTOM_TABS_KEY, tabs);
  }
}

// --- 提示词排序 ---

async function reorderFavorites(scope: string, orderedIds: string[]) {
  const existing = await storageGet<SavedPromptRecord[]>(PROMPT_STORAGE_KEYS.favorites, []);
  const orderMap = new Map(orderedIds.map((id, index) => [id, index]));
  const nextRecords = existing.map((record) => {
    if (record.category !== scope || !orderMap.has(record.id)) return record;
    return { ...record, order: orderMap.get(record.id) ?? record.order };
  });
  await storageSet(PROMPT_STORAGE_KEYS.favorites, nextRecords);
  return nextRecords;
}

export async function moveFavoriteUp(recordId: string, scope: string) {
  const records = await storageGet<SavedPromptRecord[]>(PROMPT_STORAGE_KEYS.favorites, []);
  const scopeRecords = records
    .filter((r) => r.category === scope)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const idx = scopeRecords.findIndex((r) => r.id === recordId);
  if (idx <= 0) return records;
  const orderedIds = scopeRecords.map((r) => r.id);
  [orderedIds[idx - 1], orderedIds[idx]] = [orderedIds[idx], orderedIds[idx - 1]];
  return reorderFavorites(scope, orderedIds);
}

export async function moveFavoriteDown(recordId: string, scope: string) {
  const records = await storageGet<SavedPromptRecord[]>(PROMPT_STORAGE_KEYS.favorites, []);
  const scopeRecords = records
    .filter((r) => r.category === scope)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const idx = scopeRecords.findIndex((r) => r.id === recordId);
  if (idx < 0 || idx >= scopeRecords.length - 1) return records;
  const orderedIds = scopeRecords.map((r) => r.id);
  [orderedIds[idx], orderedIds[idx + 1]] = [orderedIds[idx + 1], orderedIds[idx]];
  return reorderFavorites(scope, orderedIds);
}

export async function pinFavoriteToTop(recordId: string, scope: string) {
  const records = await storageGet<SavedPromptRecord[]>(PROMPT_STORAGE_KEYS.favorites, []);
  const scopeRecords = records
    .filter((r) => r.category === scope)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const idx = scopeRecords.findIndex((r) => r.id === recordId);
  if (idx <= 0) return records;
  const orderedIds = scopeRecords.map((r) => r.id);
  const [moved] = orderedIds.splice(idx, 1);
  orderedIds.unshift(moved);
  return reorderFavorites(scope, orderedIds);
}
