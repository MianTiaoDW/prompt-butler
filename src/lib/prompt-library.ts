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

export const CUSTOM_TABS_KEY = "prompt-butler-custom-tabs";

export async function getCustomTabs(): Promise<string[]> {
  return storageGet<string[]>(CUSTOM_TABS_KEY, []);
}

export async function addCustomTab(name: string) {
  const tabs = await getCustomTabs();
  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new Error("预设名称不能为空。");
  }

  if (DEFAULT_PROMPT_TABS.includes(trimmedName as (typeof DEFAULT_PROMPT_TABS)[number]) || tabs.includes(trimmedName)) {
    throw new Error("同名预设已存在。");
  }

  const next = [...tabs, trimmedName];
  await storageSet(CUSTOM_TABS_KEY, next);
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

export async function deleteCustomTab(name: string) {
  const tabs = await getCustomTabs();
  const next = tabs.filter((t) => t !== name);
  await storageSet(CUSTOM_TABS_KEY, next);
  return next;
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
    tags: recommendPromptTags(input.content)
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
