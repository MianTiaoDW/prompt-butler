import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Check,
  Copy,
  Database,
  Download,
  Upload,
  LoaderCircle,
  PencilLine,
  Pin,
  Plus,
  Sparkles,
  Trash2,
  X
} from "lucide-react";

import { useChromeStorage } from "../hooks/useChromeStorage";
import { storageGet } from "../lib/storage";
import { saveImageWorkspace } from "../lib/image-library";
import {
  createPromptFolder,
  deletePromptFolder,
  moveFavoriteUp,
  moveFavoriteDown,
  migrateSeedCategories,
  pinFavoriteToTop,
  PROMPT_STORAGE_KEYS,
  recommendPromptTags,
  renamePromptFolder,
  rememberDeletedPrompt,
  reorderPromptFolders,
  searchPromptRecords,
  updateFavoritePrompt,
  importSeedPrompts,
  ensureSeedCategories,
  ensureSeedFolders,
  SEED_CATEGORY_MAP,
  SEED_DEFAULT_FOLDER
} from "../lib/prompt-library";
import { SEED_PROMPTS } from "../lib/seed-prompts";
import { sendRuntimeMessage } from "../lib/runtime";
import { exportPromptsAsJson } from "../lib/backup";
import { showToast } from "../lib/toast";
import { deletePromptExampleImages } from "../lib/example-images";
import type {
  PromptOptimizationResult,
  SavedPromptRecord
} from "../types/prompt";
import type { PromptFolder } from "../types/prompt";
import type { ExtensionSettings } from "../types/settings";
import { PromptCard } from "./PromptCard";
import { PromptPreviewModal } from "./PromptPreviewModal";
import { PromptOptimizePanel } from "./PromptOptimizePanel";

function formatTimestamp(timestamp: string) {
  return new Date(timestamp).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function FavoritesStudio(props: {
  settings: ExtensionSettings;
  isServiceReady: boolean;
  activeCategory?: string;
  searchQuery?: string;
  onOpenImageStudio: () => void;
  assetFilter?: "all" | "favorite" | "folders";
  openPromptRequest?: { id: string; token: number } | null;
  onPreviewChange?: (promptId: string | null) => void;
}) {
  const { settings, isServiceReady, activeCategory = "收藏", searchQuery = "", onOpenImageStudio, assetFilter = "all", openPromptRequest, onPreviewChange } = props;
  const isCollectionCategory = activeCategory === "收藏";
  const favoritesStorage = useChromeStorage<SavedPromptRecord[]>(
    PROMPT_STORAGE_KEYS.favorites,
    []
  );
  const foldersStorage = useChromeStorage<PromptFolder[]>(PROMPT_STORAGE_KEYS.folders, []);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [draftContent, setDraftContent] = useState("");
  const [autoSavedId, setAutoSavedId] = useState<string | null>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [panelMessage, setPanelMessage] = useState("");
  const [draftCategory, setDraftCategory] = useState(activeCategory);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [folderNameDraft, setFolderNameDraft] = useState("");
  const [draggingFolderId, setDraggingFolderId] = useState<string | null>(null);
  const [isCreatingPrompt, setIsCreatingPrompt] = useState(false);
  const [promptDraft, setPromptDraft] = useState("");
  const [promptTitleDraft, setPromptTitleDraft] = useState("");
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState("");
  const [isImportingSeed, setIsImportingSeed] = useState(false);
  const [previewRecord, setPreviewRecord] = useState<SavedPromptRecord | null>(null);
  const [optimizationRecord, setOptimizationRecord] = useState<SavedPromptRecord | null>(null);

  const handleImportSeeds = async () => {
    setIsImportingSeed(true);
    try {
      // 将种子提示词归入各分类下的"默认内置提示词"文件夹
      const remapped = SEED_PROMPTS.map((p) => {
        const baseCategory = SEED_CATEGORY_MAP[p.category] || p.category;
        return { ...p, source: "system-template" as const, category: `${baseCategory}/${SEED_DEFAULT_FOLDER}` };
      });
      const cats = [...new Set(remapped.map((p) => p.category.split("/")[0]))];
      await ensureSeedCategories(cats);
      await ensureSeedFolders();
      const { records: migratedRecords, changed: migratedChanged } = await migrateSeedCategories();
      const count = await importSeedPrompts(remapped);
      const latest = migratedChanged ? migratedRecords : await storageGet<SavedPromptRecord[]>(PROMPT_STORAGE_KEYS.favorites, []);
      await setFavorites(latest);
      setPanelMessage(`已加载 ${latest.length} 条提示词（含内置库）`);
    } finally {
      setIsImportingSeed(false);
    }
  };

  useEffect(() => {
    void handleImportSeeds();
  }, []);

  const { value: favorites, setValue: setFavorites, isLoading } = favoritesStorage;
  const { value: folders, setValue: setFolders } = foldersStorage;
  const scopedFolders = useMemo(
    () =>
      folders
        .filter((folder) => assetFilter === "folders" || activeCategory === "收藏" ? true : (folder.scope || "收藏") === activeCategory)
        .sort((left, right) => (left.order ?? 0) - (right.order ?? 0)),
    [activeCategory, assetFilter, folders]
  );
  const activeFolder = scopedFolders.find((folder) => folder.id === selectedFolderId) ?? null;
  const scopedCategoryName = activeFolder ? `${activeFolder.scope || "收藏"}/${activeFolder.name}` : activeCategory;
  const categoryPromptCount = useMemo(
    () =>
      favorites.filter(
        (record) =>
          record.category === activeCategory || record.category.startsWith(`${activeCategory}/`)
      ).length,
    [activeCategory, favorites]
  );

  const filteredFavorites = searchPromptRecords(
    favorites.filter((record) => record.category === scopedCategoryName),
    searchQuery
  );

  const sortedFavorites = [...filteredFavorites].sort((a, b) => {
    const orderDiff = (a.order ?? 0) - (b.order ?? 0);
    if (orderDiff !== 0) return orderDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  const seedIds = useMemo(() => new Set(SEED_PROMPTS.map((prompt) => prompt.id)), []);
  const categoryAssetRecords = useMemo(() => {
    const categoryRecords = activeCategory === "收藏"
      ? favorites
      : favorites.filter((record) => record.category === activeCategory || record.category.startsWith(`${activeCategory}/`));
    const filteredRecords = assetFilter === "favorite"
      ? categoryRecords.filter((record) => record.isFavorite ?? !seedIds.has(record.id))
      : categoryRecords;
    return searchPromptRecords(filteredRecords, searchQuery).sort(
      (left, right) =>
        new Date(right.updatedAt ?? right.createdAt).getTime() -
        new Date(left.updatedAt ?? left.createdAt).getTime()
    );
  }, [activeCategory, assetFilter, favorites, searchQuery, seedIds]);

  useEffect(() => {
    if (!copiedId) {
      return;
    }

    const timer = window.setTimeout(() => {
      setCopiedId(null);
    }, 1500);

    return () => window.clearTimeout(timer);
  }, [copiedId]);

  useEffect(() => {
    setDraftCategory(scopedCategoryName);
  }, [scopedCategoryName]);

  const handleCopy = async (record: SavedPromptRecord) => {
    try {
      await navigator.clipboard.writeText(record.content);
      setCopiedId(record.id);
      showToast("提示词已复制");
      void markRecordUsed(record);
    } catch {
      setPanelMessage("当前页面不允许直接写入剪贴板，请手动复制。");
    }
  };

  const markRecordUsed = async (record: SavedPromptRecord) => {
    const lastUsedAt = new Date().toISOString();
    const updated = await updateFavoritePrompt(record.id, {
      lastUsedAt,
      lastUsed: lastUsedAt,
      usedCount: (record.usedCount ?? record.usageCount ?? 0) + 1,
      usageCount: (record.usageCount ?? record.usedCount ?? 0) + 1
    });
    if (updated) {
      await setFavorites((current) =>
        current.map((item) => (item.id === record.id ? updated : item))
      );
    }
  };

  useEffect(() => {
    if (!openPromptRequest) return;
    if (favoritesStorage.isLoading) return;
    const record = favorites.find((item) => item.id === openPromptRequest.id);
    if (!record) return;
    setPreviewRecord(record);
    void markRecordUsed(record);
  }, [favoritesStorage.isLoading, openPromptRequest?.token]);

  useEffect(() => {
    onPreviewChange?.(previewRecord?.id ?? null);
  }, [onPreviewChange, previewRecord?.id]);

  const toggleRecordFavorite = async (record: SavedPromptRecord) => {
    const currentFavoriteState = record.isFavorite ?? !seedIds.has(record.id);
    const updated = await updateFavoritePrompt(record.id, { isFavorite: !currentFavoriteState });
    if (updated) {
      await setFavorites((current) =>
        current.map((item) => (item.id === record.id ? updated : item))
      );
      setPreviewRecord((current) => current?.id === record.id ? updated : current);
      showToast(currentFavoriteState ? "已取消收藏" : "已加入收藏");
    }
  };

  const usePromptInImageStudio = async (record: SavedPromptRecord) => {
    await saveImageWorkspace({
      prompt: record.content,
      lastUpdatedAt: null,
      source: {
        promptId: record.id,
        title: record.title || record.content.slice(0, 28),
        type: record.source ?? (record.id.startsWith("seed-") ? "system-template" : "user-created"),
        format: record.format,
        provider: record.provider,
        model: record.model
      }
    });
    await markRecordUsed(record);
    setPreviewRecord(null);
    onOpenImageStudio();
  };

  const savePreviewContent = async (record: SavedPromptRecord, content: string) => {
    const currentVersion = record.version ?? "1.0";
    const [major, minor] = currentVersion.split(".").map((value) => Number(value) || 0);
    const updated = await updateFavoritePrompt(record.id, {
      content,
      tags: recommendPromptTags(content),
      contentVariants: { ...record.contentVariants, [record.format]: content },
      version: `${major}.${minor + 1}`,
      versions: [...(record.versions ?? []), { id: `${record.id}-${Date.now()}`, version: currentVersion, content: record.content, createdAt: new Date().toISOString(), note: "手动编辑" }]
    });
    if (!updated) return;
    await setFavorites((current) =>
      current.map((item) => (item.id === record.id ? updated : item))
    );
    setPreviewRecord(updated);
    showToast("提示词已更新");
  };

  const flushPendingSave = async (recordId: string, content: string) => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    if (!content.trim()) return;
    const tags = recommendPromptTags(content);
    const updated = await updateFavoritePrompt(recordId, { content, tags });
    if (updated) {
      await setFavorites((current) =>
        current.map((item) => (item.id === recordId ? updated : item))
      );
    }
  };

  const debouncedSave = (recordId: string, content: string) => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    autoSaveTimerRef.current = setTimeout(async () => {
      const tags = recommendPromptTags(content);
      const updated = await updateFavoritePrompt(recordId, { content, tags });
      if (updated) {
        await setFavorites((current) =>
          current.map((item) => (item.id === recordId ? updated : item))
        );
        setAutoSavedId(recordId);
        setTimeout(() => setAutoSavedId(null), 2000);
      }
      autoSaveTimerRef.current = null;
    }, 1500);
  };

  const handleSortAction = async (recordId: string, action: "pin" | "up" | "down") => {
    let updated: SavedPromptRecord[];
    if (action === "pin") updated = await pinFavoriteToTop(recordId, scopedCategoryName);
    else if (action === "up") updated = await moveFavoriteUp(recordId, scopedCategoryName);
    else updated = await moveFavoriteDown(recordId, scopedCategoryName);
    await setFavorites(updated);
  };

  const handleCreateFolder = async () => {
    try {
      const folder = await createPromptFolder(folderNameDraft, activeCategory);
      setSelectedFolderId(null);
      setIsCreatingFolder(false);
      setFolderNameDraft("");
      setPanelMessage(`已在"${activeCategory}"下新建文件夹：${folder.name}`);
    } catch (error) {
      setPanelMessage(error instanceof Error ? error.message : "新建文件夹失败。");
    }
  };

  const handleRenameFolder = async (folder: PromptFolder) => {
    try {
      const renamedFolder = await renamePromptFolder(folder.id, folderNameDraft);

      if (!renamedFolder) {
        setPanelMessage("重命名失败，未找到文件夹。");
        return;
      }

      await setFolders((current) =>
        current.map((item) => (item.id === folder.id ? renamedFolder : item))
      );
      setRenamingFolderId(null);
      setFolderNameDraft("");
      setPanelMessage(`文件夹已重命名为：${renamedFolder.name}`);
    } catch (error) {
      setPanelMessage(error instanceof Error ? error.message : "重命名失败。");
    }
  };

  const handleDeleteFolder = async (folder: PromptFolder) => {
    const deleted = await deletePromptFolder(folder.id);

    if (!deleted) {
      setPanelMessage("删除失败，未找到文件夹。");
      return;
    }

    await setFolders((current) => current.filter((item) => item.id !== folder.id));
    setSelectedFolderId((current) => (current === folder.id ? null : current));
    setRenamingFolderId(null);
    setFolderNameDraft("");
    setPanelMessage(`已删除文件夹：${folder.name}`);
  };

  const moveFolder = async (sourceId: string, targetId: string) => {
    if (sourceId === targetId) {
      return;
    }

    const orderedIds = scopedFolders.map((folder) => folder.id);
    const sourceIndex = orderedIds.indexOf(sourceId);
    const targetIndex = orderedIds.indexOf(targetId);

    if (sourceIndex === -1 || targetIndex === -1) {
      return;
    }

    const nextOrderedIds = [...orderedIds];
    const [movedId] = nextOrderedIds.splice(sourceIndex, 1);
    nextOrderedIds.splice(targetIndex, 0, movedId);
    await reorderPromptFolders(activeCategory, nextOrderedIds);
    await setFolders((current) => {
      const orderMap = new Map(nextOrderedIds.map((id, index) => [id, index]));
      return current.map((folder) => {
        if (folder.scope !== activeCategory || !orderMap.has(folder.id)) {
          return folder;
        }

        return {
          ...folder,
          order: orderMap.get(folder.id) ?? folder.order
        };
      });
    });
  };

  const handleCreatePrompt = async () => {
    const trimmedPrompt = promptDraft.trim();

    if (!trimmedPrompt || !activeFolder) {
      return;
    }

    const record: SavedPromptRecord = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: promptTitleDraft.trim(),
      createdAt: new Date().toISOString(),
      provider: settings.provider,
      model: settings.reasoningModel || settings.visionModel || "未设置模型",
      format: "cnPrompt",
      content: trimmedPrompt,
      category: `${activeCategory}/${activeFolder.name}`,
      tags: recommendPromptTags(trimmedPrompt)
    };

    await setFavorites((current) => [record, ...current]);
    setPromptDraft("");
    setPromptTitleDraft("");
    setIsCreatingPrompt(false);
    setPanelMessage(`已添加提示词到"${activeFolder.name}"。`);
  };

  const handleDeletePrompt = async (record: SavedPromptRecord) => {
    await deletePromptExampleImages(record.id);
    await rememberDeletedPrompt(record.id);
    await setFavorites((current) => current.filter((item) => item.id !== record.id));
    setPanelMessage("提示词已删除。");
    showToast("提示词已删除");
  };

  const handleExport = async () => {
    try {
      await exportPromptsAsJson();
      showToast("提示词已导出~");
    } catch {
      showToast("导出失败，请重试。");
    }
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);

        if (!data.version || !Array.isArray(data.favorites)) {
          throw new Error("备份文件结构不完整，缺少必要字段。");
        }

        const backupFavorites = data.favorites as SavedPromptRecord[];
        const backupFolders = (data.folders as PromptFolder[]) ?? [];

        // 直接使用当前 React 状态做去重，避免 storage 读写竞争
        const existingIds = new Set(favorites.map((r) => r.id));
        const newFavorites = backupFavorites.filter((r) => !existingIds.has(r.id));
        const mergedFavorites = [...newFavorites, ...favorites];

        const existingFolderIds = new Set(folders.map((f) => f.id));
        const newFolders = backupFolders.filter((f) => !existingFolderIds.has(f.id));
        const mergedFolders = [...newFolders, ...folders];

        // 通过 setState 统一写入 React 状态和 storage
        await Promise.all([setFavorites(mergedFavorites), setFolders(mergedFolders)]);

        if (newFavorites.length > 0 || newFolders.length > 0) {
          showToast(`已导入 ${newFavorites.length} 条提示词~`);
        } else {
          showToast("导入完成，没有新增内容。");
        }
      } catch (error) {
        showToast(error instanceof Error ? error.message : "导入失败。");
      }
    };
    input.click();
  };

  const saveTitleEdit = async (record: SavedPromptRecord) => {
    const updated = await updateFavoritePrompt(record.id, { title: titleDraft.trim() });
    if (updated) {
      await setFavorites((current) =>
        current.map((item) => (item.id === record.id ? updated : item))
      );
    }
    setEditingTitleId(null);
    setTitleDraft("");
  };

  const cancelTitleEdit = () => {
    setEditingTitleId(null);
    setTitleDraft("");
  };

  const optimizePrompt = async (record: SavedPromptRecord, direction?: string) => {
    if (!isServiceReady) {
      setPanelMessage("服务未就绪，请先完成配置并测试连接。");
      return;
    }

    setBusyId(record.id);
    setPanelMessage("正在调用模型优化该条提示词...");

    try {
      const result = await sendRuntimeMessage<PromptOptimizationResult>({
        type: "prompt:optimize",
        payload: {
          settings,
          content: record.content,
          direction
        }
      });

      if (!result.ok) {
        setPanelMessage(`优化失败：${result.message}`);
        return;
      }

      const tags = recommendPromptTags(result.output);
      const currentVersion = record.version ?? "1.0";
      const [major, minor] = currentVersion.split(".").map((value) => Number(value) || 0);
      const updatedRecord = await updateFavoritePrompt(record.id, {
        content: result.output,
        tags,
        contentVariants: { ...record.contentVariants, [record.format]: result.output },
        version: `${major}.${minor + 1}`,
        versions: [
          ...(record.versions ?? []),
          {
            id: `${record.id}-${Date.now()}`,
            version: currentVersion,
            content: record.content,
            createdAt: new Date().toISOString(),
            note: direction || "AI 优化"
          }
        ]
      });

      if (!updatedRecord) {
        setPanelMessage("优化完成，但本地提示词更新失败。");
        return;
      }

      await setFavorites((current) =>
        current.map((item) => (item.id === record.id ? updatedRecord : item))
      );
      setExpandedId(record.id);
      setDraftContent(updatedRecord.content);
      setPreviewRecord((current) => current?.id === record.id ? updatedRecord : current);
      setOptimizationRecord(null);
      setPanelMessage(`AI 优化完成，当前使用模型：${result.model}`);
      showToast(`已生成 ${updatedRecord.version} 版本`);
    } catch (error) {
      setPanelMessage(
        error instanceof Error ? `优化失败：${error.message}` : "优化失败。"
      );
    } finally {
      setBusyId(null);
    }
  };

  const renderAssetSection = (title: string, records: SavedPromptRecord[], emptyMessage: string) => (
    <section className="prompt-asset-section">
      <div className="prompt-asset-section-heading">
        <h2>{title}</h2>
        <span>{records.length}</span>
      </div>
      {records.length > 0 ? (
        <div className="prompt-asset-grid">
          {records.map((record) => (
            <PromptCard
              key={record.id}
              record={record}
              isCopied={copiedId === record.id}
              isFavorite={record.isFavorite ?? !seedIds.has(record.id)}
              isOptimizing={busyId === record.id}
              onCopy={() => void handleCopy(record)}
              onOpen={() => {
                setPreviewRecord(record);
                void markRecordUsed(record);
              }}
              onToggleFavorite={() => void toggleRecordFavorite(record)}
              onOptimize={() => setOptimizationRecord(record)}
              onDelete={() => void handleDeletePrompt(record)}
            />
          ))}
        </div>
      ) : (
        <div className="prompt-asset-empty">{emptyMessage}</div>
      )}
    </section>
  );

  if (activeFolder) {
    return (
      <div className="space-y-4">
        <section className="glass-card p-4">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                setSelectedFolderId(null);
                setIsCreatingPrompt(false);
                setPromptDraft("");
                setPromptTitleDraft("");
              }}
              className="ghost-button px-3 py-2 text-xs"
            >
              <ArrowLeft className="h-4 w-4" />
              返回文件夹
            </button>
            <div className="text-sm font-medium text-white/88">{activeFolder.name}</div>
            <button
              type="button"
              onClick={() => {
                setIsCreatingPrompt(true);
                setPromptDraft("");
                setPromptTitleDraft("");
              }}
              className="ghost-button px-3 py-2 text-xs"
            >
              <Plus className="h-4 w-4" />
              添加
            </button>
          </div>
        </section>

        <section className="space-y-1.5">
          {sortedFavorites.map((record, index) => {
            const isExpanded = expandedId === record.id;
            const isBusy = busyId === record.id;
            const isEditingTitle = editingTitleId === record.id;
            const displayTitle = record.title || record.content.slice(0, 28);
            const isFirst = index === 0;
            const isLast = index === sortedFavorites.length - 1;

            return (
              <article
                key={record.id}
                className="media-card transition"
              >
                <div className="flex items-center gap-2 px-3 py-2">
                  {isEditingTitle ? (
                    <>
                      <input
                        value={titleDraft}
                        onChange={(event) => {
                          setTitleDraft(event.target.value);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            void saveTitleEdit(record);
                          }
                          if (event.key === "Escape") {
                            cancelTitleEdit();
                          }
                        }}
                        className="min-w-0 flex-1 rounded-lg border border-accent/35 bg-black/25 px-2 py-1 text-xs text-white outline-none"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => {
                          void saveTitleEdit(record);
                        }}
                        className="shrink-0 rounded-md p-0.5 text-white/55 transition hover:text-accent"
                        title="确认"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={cancelTitleEdit}
                        className="shrink-0 rounded-md p-0.5 text-white/55 transition hover:text-rose-300"
                        title="取消"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="min-w-0 flex-1 truncate text-xs text-white/70">
                        {displayTitle}
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          void handleSortAction(record.id, "pin");
                        }}
                        disabled={isFirst}
                        className="shrink-0 rounded-lg p-1 text-white/35 transition hover:text-accent disabled:cursor-not-allowed disabled:opacity-20"
                        title="置顶"
                      >
                        <Pin className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          void handleSortAction(record.id, "up");
                        }}
                        disabled={isFirst}
                        className="shrink-0 rounded-lg p-1 text-white/35 transition hover:text-accent disabled:cursor-not-allowed disabled:opacity-20"
                        title="上移"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          void handleSortAction(record.id, "down");
                        }}
                        disabled={isLast}
                        className="shrink-0 rounded-lg p-1 text-white/35 transition hover:text-accent disabled:cursor-not-allowed disabled:opacity-20"
                        title="下移"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingTitleId(record.id);
                          setTitleDraft(record.title || "");
                        }}
                        className="shrink-0 rounded-lg p-1 text-white/35 transition hover:text-accent"
                        title="重命名"
                      >
                        <PencilLine className="h-3.5 w-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          void handleDeletePrompt(record);
                        }}
                        className="shrink-0 rounded-lg p-1 text-white/35 transition hover:text-rose-300"
                        title="删除"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={async () => {
                      if (isExpanded) {
                        await flushPendingSave(record.id, draftContent);
                        setExpandedId(null);
                        setDraftContent("");
                      } else {
                        setExpandedId(record.id);
                        setDraftContent(record.content);
                        setDraftCategory(record.category);
                      }
                    }}
                    className="shrink-0 rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[11px] text-white/58 transition hover:border-accent/30 hover:text-white"
                  >
                    {isExpanded ? "收起" : "展开"}
                  </button>
                </div>

                {isExpanded ? (
                  <div className="border-t border-white/5 px-3 py-3 space-y-3">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-white/35">
                      <span>{record.provider}</span>
                      <span>·</span>
                      <span>{record.model}</span>
                      <span>·</span>
                      <span>{formatTimestamp(record.updatedAt ?? record.createdAt)}</span>
                    </div>

                    <textarea
                      value={draftContent}
                      onChange={(event) => {
                        const newContent = event.target.value;
                        setDraftContent(newContent);
                        debouncedSave(record.id, newContent);
                      }}
                      className="form-field min-h-[150px] w-full resize-y leading-6"
                    />

                    {autoSavedId === record.id ? (
                      <div className="inline-flex items-center gap-1 text-[11px] text-accent/75">
                        <Check className="h-3 w-3" />
                        已自动保存
                      </div>
                    ) : null}

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          void handleCopy(record);
                        }}
                        className="ghost-button rounded-xl px-3 py-2 text-xs"
                      >
                        {copiedId === record.id ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                        {copiedId === record.id ? "已复制" : "一键复制"}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          void optimizePrompt(record);
                        }}
                        disabled={isBusy}
                        className="gradient-button rounded-xl px-3 py-2 text-xs"
                      >
                        {isBusy ? (
                          <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="h-3.5 w-3.5" />
                        )}
                        {isBusy ? "优化中..." : "AI一键优化"}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          void handleDeletePrompt(record);
                        }}
                        className="ghost-button rounded-xl px-3 py-2 text-xs text-rose-300 hover:text-rose-200"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        删除
                      </button>
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}

          {isCreatingPrompt ? (
            <div
              className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-black/70 backdrop-blur-sm"
              onClick={() => {
                setIsCreatingPrompt(false);
                setPromptDraft("");
                setPromptTitleDraft("");
              }}
            >
              <div
                className="aurora-shell mx-4 w-full max-w-lg rounded-[1.35rem] p-6"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <div className="section-label mb-3">
                  添加提示词到「{activeFolder.name}」
                </div>
                <input
                  value={promptTitleDraft}
                  onChange={(e) => {
                    setPromptTitleDraft(e.target.value);
                  }}
                  placeholder="提示词标题（可选）"
                  className="form-field mb-3 w-full rounded-xl px-4 py-2.5 text-sm"
                />
                <textarea
                  value={promptDraft}
                  onChange={(event) => {
                    setPromptDraft(event.target.value);
                  }}
                  className="form-field min-h-[160px] w-full resize-y rounded-xl px-4 py-3 text-sm leading-6"
                  placeholder="输入新的提示词内容"
                  autoFocus
                />
                <div className="mt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingPrompt(false);
                      setPromptDraft("");
                      setPromptTitleDraft("");
                    }}
                    className="ghost-button px-5 py-2.5 text-sm"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void handleCreatePrompt();
                    }}
                    disabled={!promptDraft.trim()}
                    className="gradient-button px-5 py-2.5 text-sm disabled:opacity-40"
                  >
                    确认
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    );
  }

  return (
    <div className="prompt-asset-library">
      {assetFilter === "folders" ? (
        <section className="prompt-folder-browser">
          <header>
            <div><h2>我的收藏夹</h2><span>{scopedFolders.length}</span></div>
            <div>
              <button type="button" onClick={() => void handleImport()} title="导入"><Upload className="h-4 w-4" /></button>
              <button type="button" onClick={() => void handleExport()} title="导出"><Download className="h-4 w-4" /></button>
              <button type="button" onClick={() => { setIsCreatingFolder(true); setFolderNameDraft(""); }} title="新建收藏夹"><Plus className="h-4 w-4" /></button>
            </div>
          </header>
          {isCreatingFolder ? (
            <div className="prompt-folder-create-row">
              <input className="form-field" value={folderNameDraft} onChange={(event) => setFolderNameDraft(event.target.value)} placeholder="收藏夹名称" autoFocus onKeyDown={(event) => { if (event.key === "Enter") void handleCreateFolder(); }} />
              <button type="button" onClick={() => void handleCreateFolder()} disabled={!folderNameDraft.trim()}><Check className="h-4 w-4" /></button>
              <button type="button" onClick={() => { setIsCreatingFolder(false); setFolderNameDraft(""); }}><X className="h-4 w-4" /></button>
            </div>
          ) : null}
          <div className="prompt-folder-grid">
            {scopedFolders.map((folder) => {
              const folderCategory = `${folder.scope || "收藏"}/${folder.name}`;
              const folderCount = favorites.filter((record) => record.category === folderCategory).length;
              const isRenaming = renamingFolderId === folder.id;
              return (
                <article key={folder.id}>
                  {isRenaming ? (
                    <div className="prompt-folder-create-row"><input className="form-field" value={folderNameDraft} onChange={(event) => setFolderNameDraft(event.target.value)} autoFocus /><button type="button" onClick={() => void handleRenameFolder(folder)}><Check className="h-4 w-4" /></button><button type="button" onClick={() => { setRenamingFolderId(null); setFolderNameDraft(""); }}><X className="h-4 w-4" /></button></div>
                  ) : (
                    <><button type="button" className="prompt-folder-open" onClick={() => setSelectedFolderId(folder.id)}><strong>{folder.name}</strong><span>{folder.scope || "收藏"} · {folderCount} 条</span></button><div><button type="button" onClick={() => { setRenamingFolderId(folder.id); setFolderNameDraft(folder.name); }} title="重命名"><PencilLine className="h-3.5 w-3.5" /></button><button type="button" onClick={() => void handleDeleteFolder(folder)} title="删除"><Trash2 className="h-3.5 w-3.5" /></button></div></>
                  )}
                </article>
              );
            })}
          </div>
          {scopedFolders.length === 0 ? <div className="prompt-asset-empty">还没有收藏夹，可以从右上角新建。</div> : null}
        </section>
      ) : searchQuery.trim() ? (
        renderAssetSection("搜索结果", categoryAssetRecords, "没有找到匹配的提示词，换一个关键词试试。")
      ) : (
        renderAssetSection(assetFilter === "favorite" ? "收藏" : activeCategory === "收藏" ? "全部提示词" : activeCategory, categoryAssetRecords, assetFilter === "favorite" ? "还没有收藏 Prompt" : "当前筛选下还没有提示词")
      )}

      {panelMessage ? <p className="library-status-message">{panelMessage}</p> : null}

      <details className="prompt-library-management">
        <summary>
          <span>收藏夹</span>
          <small>{scopedFolders.length}</small>
        </summary>
      <section className="glass-card p-4">
        <div className="flex items-center gap-3">
          <div className="text-sm font-medium text-white/88">{activeCategory}文件夹</div>
          <div className="rounded-2xl border border-accent/35 bg-transparent px-2.5 py-1 text-xs font-semibold text-accent">
            {categoryPromptCount} 条
          </div>
          <div className="ml-auto flex items-center gap-2">
            {isCollectionCategory ? (
              <>
                <button
                  type="button"
                  onClick={() => { void handleExport(); }}
                  className="rounded-xl border border-white/10 bg-white/[0.06] p-2 text-white/50 transition hover:border-accent/30 hover:text-accent"
                  title="导出全部提示词"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleImport}
                  className="rounded-xl border border-white/10 bg-white/[0.06] p-2 text-white/50 transition hover:border-accent/30 hover:text-accent"
                  title="导入提示词"
                >
                  <Upload className="h-3.5 w-3.5" />
                </button>
                <span className="w-px h-5 bg-white/10" />
              </>
            ) : null}
            <button
              type="button"
              onClick={handleImportSeeds}
              disabled={isImportingSeed}
              className="rounded-xl border border-white/10 bg-white/[0.06] p-2 text-white/50 transition hover:border-accent/30 hover:text-accent disabled:opacity-40"
              title="导入内置提示词库"
            >
              <Database className={`h-3.5 w-3.5 ${isImportingSeed ? "animate-pulse" : ""}`} />
            </button>
          </div>
        </div>


        <div className="mt-4 flex flex-wrap gap-3">
          {scopedFolders.map((folder) => {
            const isRenaming = renamingFolderId === folder.id;
            const isDragging = draggingFolderId === folder.id;

            if (isRenaming) {
              return (
                <div
                  key={folder.id}
                  className="flex h-24 w-24 flex-col justify-between rounded-[1.35rem] border border-accent/35 bg-black/25 p-3"
                >
                  <input
                    value={folderNameDraft}
                    onChange={(event) => {
                      setFolderNameDraft(event.target.value);
                    }}
                    className="w-full bg-transparent text-center text-sm text-white outline-none"
                    placeholder="文件夹名"
                  />
                  <div className="flex items-center justify-between text-[11px]">
                    <button
                      type="button"
                      onClick={() => {
                        void handleRenameFolder(folder);
                      }}
                      className="text-accent"
                    >
                      保存
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRenamingFolderId(null);
                        setFolderNameDraft("");
                      }}
                      className="text-white/55"
                    >
                      取消
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div key={folder.id} className="relative">
                <button
                  type="button"
                  draggable
                  onDragStart={() => {
                    setDraggingFolderId(folder.id);
                  }}
                  onDragEnd={() => {
                    setDraggingFolderId(null);
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    if (!draggingFolderId) {
                      return;
                    }
                    void moveFolder(draggingFolderId, folder.id);
                    setDraggingFolderId(null);
                  }}
                  onClick={() => {
                    setSelectedFolderId(folder.id);
                  }}
                  onDoubleClick={() => {
                    setRenamingFolderId(folder.id);
                    setFolderNameDraft(folder.name);
                  }}
                  className={[
                    "glass-card flex h-24 w-24 flex-col items-center justify-center rounded-[1.35rem] border text-center transition",
                    "border-white/10 bg-white/[0.06] text-white/70 hover:border-accent/30 hover:text-white",
                    isDragging ? "opacity-60" : ""
                  ].join(" ")}
                >
                  <div className="max-w-full truncate px-2 text-sm font-medium">{folder.name}</div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void handleDeleteFolder(folder);
                  }}
                  className="absolute -right-2 -top-2 rounded-full border border-white/10 bg-slate-950/90 p-1.5 text-white/55 transition hover:text-rose-300"
                  aria-label={`删除${folder.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}

          {isCreatingFolder ? (
            <div className="glass-card flex h-24 w-24 flex-col justify-between rounded-[1.35rem] border border-dashed border-accent/35 p-3">
              <input
                value={folderNameDraft}
                onChange={(event) => {
                  setFolderNameDraft(event.target.value);
                }}
                className="w-full bg-transparent text-center text-sm text-white outline-none"
                placeholder="文件夹名"
              />
              <div className="flex items-center justify-between text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    void handleCreateFolder();
                  }}
                  className="text-accent"
                >
                  保存
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingFolder(false);
                    setFolderNameDraft("");
                  }}
                  className="text-white/55"
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setIsCreatingFolder(true);
                setFolderNameDraft("");
              }}
              className="glass-card flex h-24 w-24 items-center justify-center rounded-[1.35rem] border border-dashed border-white/10 text-white/60 transition hover:border-accent/35 hover:text-accent"
              aria-label="新建文件夹"
            >
              <Plus className="h-8 w-8" />
            </button>
          )}
        </div>
      </section>

      {panelMessage ? (
        <p className="library-status-message">{panelMessage}</p>
      ) : null}

      {!isLoading && sortedFavorites.length > 0 ? (
        <section className="space-y-1.5">
          <div className="px-1 mb-2 text-xs text-accent/70">
            {scopedFolders.length > 0 ? `未分类提示词 · ${sortedFavorites.length} 条` : `${activeCategory} · ${sortedFavorites.length} 条`}
          </div>
          {sortedFavorites.map((record, index) => {
            const isExpanded = expandedId === record.id;
            const isBusy = busyId === record.id;
            const isEditingTitle = editingTitleId === record.id;
            const displayTitle = record.title || record.content.slice(0, 28);
            const isFirst = index === 0;
            const isLast = index === sortedFavorites.length - 1;

            return (
              <article key={record.id} className="media-card transition">
                <div className="flex items-center gap-2 px-3 py-2">
                  {isEditingTitle ? (
                    <>
                      <input
                        value={titleDraft}
                        onChange={(e) => setTitleDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") { e.preventDefault(); void saveTitleEdit(record); }
                          if (e.key === "Escape") cancelTitleEdit();
                        }}
                        className="min-w-0 flex-1 rounded-lg border border-accent/35 bg-black/25 px-2 py-1 text-xs text-white outline-none"
                        autoFocus
                      />
                      <button type="button" onClick={() => { void saveTitleEdit(record); }} className="shrink-0 rounded-md p-0.5 text-white/55 transition hover:text-accent"><Check className="h-3.5 w-3.5" /></button>
                      <button type="button" onClick={cancelTitleEdit} className="shrink-0 rounded-md p-0.5 text-white/55 transition hover:text-rose-300"><X className="h-3.5 w-3.5" /></button>
                    </>
                  ) : (
                    <>
                      <span className="min-w-0 flex-1 truncate text-xs text-white/70">{displayTitle}</span>
                      <button type="button" onClick={() => { void handleSortAction(record.id, "pin"); }} disabled={isFirst} className="shrink-0 rounded-lg p-1 text-white/35 transition hover:text-accent disabled:cursor-not-allowed disabled:opacity-20"><Pin className="h-3.5 w-3.5" /></button>
                      <button type="button" onClick={() => { void handleSortAction(record.id, "up"); }} disabled={isFirst} className="shrink-0 rounded-lg p-1 text-white/35 transition hover:text-accent disabled:cursor-not-allowed disabled:opacity-20"><ArrowUp className="h-3.5 w-3.5" /></button>
                      <button type="button" onClick={() => { void handleSortAction(record.id, "down"); }} disabled={isLast} className="shrink-0 rounded-lg p-1 text-white/35 transition hover:text-accent disabled:cursor-not-allowed disabled:opacity-20"><ArrowDown className="h-3.5 w-3.5" /></button>
                      <button type="button" onClick={() => { setEditingTitleId(record.id); setTitleDraft(record.title || ""); }} className="shrink-0 rounded-lg p-1 text-white/35 transition hover:text-accent"><PencilLine className="h-3.5 w-3.5" /></button>
                      <button type="button" onClick={() => { void handleDeletePrompt(record); }} className="shrink-0 rounded-lg p-1 text-white/35 transition hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" /></button>
                    </>
                  )}
                  <button type="button" onClick={async () => {
                    if (isExpanded) { await flushPendingSave(record.id, draftContent); setExpandedId(null); setDraftContent(""); }
                    else { setExpandedId(record.id); setDraftContent(record.content); }
                  }} className="shrink-0 rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[11px] text-white/58 transition hover:border-accent/30 hover:text-white">
                    {isExpanded ? "收起" : "展开"}
                  </button>
                </div>
                {isExpanded ? (
                  <div className="border-t border-white/5 px-3 py-3 space-y-3">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-white/35">
                      <span>{record.provider}</span><span>·</span><span>{record.model}</span><span>·</span><span>{formatTimestamp(record.updatedAt ?? record.createdAt)}</span>
                    </div>
                    <textarea value={draftContent} onChange={(e) => { setDraftContent(e.target.value); debouncedSave(record.id, e.target.value); }} className="form-field min-h-[150px] w-full resize-y leading-6" />
                    {autoSavedId === record.id ? <div className="inline-flex items-center gap-1 text-[11px] text-accent/75"><Check className="h-3 w-3" />已自动保存</div> : null}
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => { void handleCopy(record); }} className="ghost-button rounded-xl px-3 py-2 text-xs">
                        {copiedId === record.id ? <><Check className="h-3.5 w-3.5" />已复制</> : <><Copy className="h-3.5 w-3.5" />一键复制</>}
                      </button>
                      <button type="button" onClick={() => { void optimizePrompt(record); }} disabled={isBusy} className="gradient-button rounded-xl px-3 py-2 text-xs">
                        {isBusy ? <><LoaderCircle className="h-3.5 w-3.5 animate-spin" />优化中...</> : <><Sparkles className="h-3.5 w-3.5" />AI一键优化</>}
                      </button>
                      <button type="button" onClick={() => { void handleDeletePrompt(record); }} className="ghost-button rounded-xl px-3 py-2 text-xs text-rose-300 hover:text-rose-200">
                        <Trash2 className="h-3.5 w-3.5" />删除
                      </button>
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </section>
      ) : null}
      </details>

      <PromptPreviewModal
        record={previewRecord}
        isCopied={Boolean(previewRecord && copiedId === previewRecord.id)}
        isFavorite={Boolean(previewRecord && (previewRecord.isFavorite ?? !seedIds.has(previewRecord.id)))}
        onClose={() => setPreviewRecord(null)}
        onCopy={() => { if (previewRecord) void handleCopy(previewRecord); }}
        onSave={(content) => { if (previewRecord) void savePreviewContent(previewRecord, content); }}
        onToggleFavorite={() => { if (previewRecord) void toggleRecordFavorite(previewRecord); }}
        onUsePrompt={() => { if (previewRecord) void usePromptInImageStudio(previewRecord); }}
        onOptimize={() => { if (previewRecord) setOptimizationRecord(previewRecord); }}
      />
      <PromptOptimizePanel
        record={optimizationRecord}
        busy={Boolean(optimizationRecord && busyId === optimizationRecord.id)}
        onClose={() => { if (!busyId) setOptimizationRecord(null); }}
        onOptimize={(direction) => { if (optimizationRecord) void optimizePrompt(optimizationRecord, direction); }}
      />
    </div>
  );
}
