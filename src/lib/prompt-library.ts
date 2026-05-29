import { storageGet, storageSet } from "./storage";
import { SEED_PROMPTS } from "./seed-prompts";
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

/** 种子提示词默认文件夹名称 */
export const SEED_DEFAULT_FOLDER = "默认内置提示词";

/** 种子提示词原始分类 → 顶层分类映射（角色设定归入收藏） */
export const SEED_CATEGORY_MAP: Record<string, string> = {
  "角色设定": "收藏",
  "产品精修": "产品精修",
  "品牌设计": "品牌设计",
  "视频生成": "视频生成"
};

export async function ensureSeedFolders() {
  const existingFolders = await storageGet<PromptFolder[]>(PROMPT_STORAGE_KEYS.folders, []);
  let changed = false;

  const scopes = [...new Set(Object.values(SEED_CATEGORY_MAP))];

  for (const scope of scopes) {
    const exists = existingFolders.some(
      (f) => f.scope === scope && f.name === SEED_DEFAULT_FOLDER
    );
    if (!exists) {
      const scopeFolders = existingFolders.filter((f) => f.scope === scope);
      const nextOrder = scopeFolders.length === 0
        ? 0
        : Math.max(...scopeFolders.map((f) => f.order ?? 0)) + 1;
      existingFolders.push({
        id: `seed-default-${scope}-${Date.now()}`,
        name: SEED_DEFAULT_FOLDER,
        scope,
        createdAt: new Date().toISOString(),
        order: nextOrder
      });
      changed = true;
    }
  }

  if (changed) {
    await storageSet(PROMPT_STORAGE_KEYS.folders, existingFolders);
  }
}

/** 清理之前版本误创建的错误标签 */
const INVALID_LEGACY_TABS = ["收藏/产品精修", "收藏/品牌设计", "收藏/视频生成"];

export async function cleanupInvalidTabs() {
  const tabs = await getCustomTabs();
  const cleaned = tabs.filter((t) => !INVALID_LEGACY_TABS.includes(t));
  if (cleaned.length === tabs.length) return;

  await storageSet(CUSTOM_TABS_KEY, cleaned);

  const tabOrder = await storageGet<string[]>(TAB_ORDER_KEY, []);
  await storageSet(TAB_ORDER_KEY, tabOrder.filter((t) => !INVALID_LEGACY_TABS.includes(t)));

  const deletedTabs = await storageGet<string[]>(DELETED_TABS_KEY, []);
  await storageSet(DELETED_TABS_KEY, deletedTabs.filter((t) => !INVALID_LEGACY_TABS.includes(t)));
}

export async function migrateSeedCategories() {
  const existing = await storageGet<SavedPromptRecord[]>(PROMPT_STORAGE_KEYS.favorites, []);
  const seedTargetCategory = new Map<string, string>();
  for (const seed of SEED_PROMPTS) {
    const baseCategory = SEED_CATEGORY_MAP[seed.category] || seed.category;
    seedTargetCategory.set(seed.id, `${baseCategory}/${SEED_DEFAULT_FOLDER}`);
  }

  let changed = false;
  const migrated = existing.map((r) => {
    const target = seedTargetCategory.get(r.id);
    if (!target || r.category === target) return r;
    changed = true;
    return { ...r, category: target, updatedAt: new Date().toISOString() };
  });

  if (changed) {
    await storageSet(PROMPT_STORAGE_KEYS.favorites, migrated);
  }

  return { records: migrated, changed };
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

// --- 默认角色预设 ---

export const SEED_ROLE_PRESET = `{
  "# 角色": "全能AI绘画提示词创意专家",
  "## 简介": "你是一个专业的AI图像生成提示词（Prompt）大师。你擅长精准捕捉用户的简单需求，将其迅速转化为结构严谨、细节丰富、高质量的专业画面描述。无论是人物、风景、建筑、二次元、产品摄影还是抽象艺术，你都能游刃有余。",
  "## 工作流": [
    "1. 意图分析：理解用户输入的简单描述，提取核心关键词（主体、风格、情绪等）。",
    "2. 细节扩写：使用专业视觉语言，自动补充缺失的画面细节。",
    "3. 结构化组装：严格按照【提示词公式】将细节组装成流畅的描述。",
    "4. 多样输出：基于用户需求，提供2-3个不同视角或微调风格的提示词选项。"
  ],
  "## 提示词公式": "主体描述（外貌/动作/服饰） + 环境背景 + 光影氛围（如：丁达尔光/赛博朋克光/自然光） + 摄影/镜头语言（如：特写/广角/微距/电影质感） + 艺术风格（如：写实/插画/3D/水彩） + 画质与渲染参数（如：8k, masterpiece, best quality, unreal engine 5, highly detailed）",
  "## 限制条件": [
    "不要解释过程，拒绝回答与AI图像生成无关的内容",
    "直接输出最终的提示词结果，方便用户复制",
    "必须包含【中文画面解析】和【纯英文提示词】（因为主流AI绘画工具对英文识别更好）",
    "英文提示词之间统一用英文半角逗号 ',' 分隔",
    "避免在提示词中使用否定词（如不要xx、没有xx），只描述画面中应该存在的事物"
  ],
  "## 示例格式": {
    "说明": "当用户输入简单需求（如：帮我画一个赛博朋克风格的女孩），严格按照以下格式直接输出：",
    "输出模板": {
      "选项1：【侧重人物特写】": {
        "中文画面": "赛博朋克风格，特写镜头。一个年轻女孩的精致面部特写，霓虹灯光映照在她的脸上，眼睛里有机械发光的瞳孔，背景是模糊的未来城市夜景。电影级光影，极高画质。",
        "英文Prompt": "Cyberpunk style, close-up shot, delicate facial portrait of a young girl, glowing mechanical pupils, neon lights reflecting on her face, blurred futuristic city night background, cinematic lighting, masterpiece, 8k resolution, highly detailed, photorealistic."
      },
      "选项2：【侧重全身与环境】": {
        "中文画面": "赛博朋克风格，全身广角镜头。一个酷炫的女孩站在下雨的未来城市街道上，穿着高科技发光夹克，手中拿着一把发光的透明伞。地面积水反射着绚丽的霓虹灯，赛博朋克氛围，超高分辨率。",
        "英文Prompt": "Cyberpunk style, full body shot, wide angle, a cool girl standing on a rainy futuristic city street, wearing a high-tech glowing jacket, holding a glowing transparent umbrella, ground puddles reflecting brilliant neon lights, cyberpunk atmosphere, unreal engine 5 render, ray tracing, masterpiece, best quality."
      }
    }
  }
}`;

export async function ensureDefaultRolePreset() {
  const workspace = await storageGet<{ rolePreset: string; rolePresetLocked: boolean; userRequirement: string }>(
    PROMPT_STORAGE_KEYS.workspace,
    { rolePreset: "", rolePresetLocked: false, userRequirement: "" }
  );
  if (!workspace.rolePreset.trim()) {
    await storageSet(PROMPT_STORAGE_KEYS.workspace, {
      ...workspace,
      rolePreset: SEED_ROLE_PRESET
    });
  }
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
