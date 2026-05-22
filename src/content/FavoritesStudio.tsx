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
import {
  createPromptFolder,
  deletePromptFolder,
  moveFavoriteUp,
  moveFavoriteDown,
  pinFavoriteToTop,
  PROMPT_STORAGE_KEYS,
  recommendPromptTags,
  renamePromptFolder,
  reorderPromptFolders,
  searchPromptRecords,
  updateFavoritePrompt,
  importSeedPrompts,
  ensureSeedCategories
} from "../lib/prompt-library";
import { SEED_PROMPTS } from "../lib/seed-prompts";
import { sendRuntimeMessage } from "../lib/runtime";
import { exportPromptsAsJson } from "../lib/backup";
import { showToast } from "../lib/toast";
import type {
  PromptOptimizationResult,
  SavedPromptRecord
} from "../types/prompt";
import type { PromptFolder } from "../types/prompt";
import type { ExtensionSettings } from "../types/settings";

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
}) {
  const { settings, isServiceReady, activeCategory = "收藏", searchQuery = "" } = props;
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
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState("");
  const [isImportingSeed, setIsImportingSeed] = useState(false);

  const handleImportSeeds = async () => {
    setIsImportingSeed(true);
    try {
      const remapped = SEED_PROMPTS.map((p) =>
        p.category === "角色设定" ? { ...p, category: "收藏" } : p
      );
      const cats = [...new Set(remapped.map((p) => p.category))];
      await ensureSeedCategories(cats);
      const count = await importSeedPrompts(remapped);
      // 无论有无新增，都强制刷新 React 状态和 storage 同步
      const latest = await storageGet<SavedPromptRecord[]>(PROMPT_STORAGE_KEYS.favorites, []);
      await setFavorites(latest);
      if (count > 0) {
        showToast(`已导入 ${count} 条内置提示词`);
      } else {
        showToast(`已加载 ${latest.length} 条提示词（含内置库）`);
      }
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
        .filter((folder) => (folder.scope || "收藏") === activeCategory)
        .sort((left, right) => (left.order ?? 0) - (right.order ?? 0)),
    [activeCategory, folders]
  );
  const activeFolder = scopedFolders.find((folder) => folder.id === selectedFolderId) ?? null;
  const scopedCategoryName = activeFolder ? `${activeCategory}/${activeFolder.name}` : activeCategory;

  const filteredFavorites = searchPromptRecords(
    favorites.filter((record) => record.category === scopedCategoryName),
    searchQuery
  );

  const sortedFavorites = [...filteredFavorites].sort((a, b) => {
    const orderDiff = (a.order ?? 0) - (b.order ?? 0);
    if (orderDiff !== 0) return orderDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

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
    } catch {
      setPanelMessage("当前页面不允许直接写入剪贴板，请手动复制。");
    }
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
      setPanelMessage(`已在“${activeCategory}”下新建文件夹：${folder.name}`);
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
      title: "",
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
    setIsCreatingPrompt(false);
    setPanelMessage(`已添加提示词到“${activeFolder.name}”。`);
  };

  const handleDeletePrompt = async (record: SavedPromptRecord) => {
    await setFavorites((current) => current.filter((item) => item.id !== record.id));
    setPanelMessage("提示词已删除。");
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

  const optimizePrompt = async (record: SavedPromptRecord) => {
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
          content: record.content
        }
      });

      if (!result.ok) {
        setPanelMessage(`优化失败：${result.message}`);
        return;
      }

      const tags = recommendPromptTags(result.output);
      const updatedRecord = await updateFavoritePrompt(record.id, {
        content: result.output,
        tags
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
      setPanelMessage(`AI 优化完成，当前使用模型：${result.model}`);
    } catch (error) {
      setPanelMessage(
        error instanceof Error ? `优化失败：${error.message}` : "优化失败。"
      );
    } finally {
      setBusyId(null);
    }
  };

  if (activeFolder) {
    return (
      <div className="space-y-4">
        <section className="glass-panel rounded-3xl border border-white/10 p-4">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                setSelectedFolderId(null);
                setIsCreatingPrompt(false);
                setPromptDraft("");
              }}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 transition hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              返回文件夹
            </button>
            <div className="text-sm font-medium text-white/88">{activeFolder.name}</div>
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
                className="glass-panel rounded-2xl border border-white/10 transition"
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
                        className="shrink-0 rounded-lg p-1 text-white/35 transition hover:text-accent disabled:opacity-20 disabled:cursor-not-allowed"
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
                        className="shrink-0 rounded-lg p-1 text-white/35 transition hover:text-accent disabled:opacity-20 disabled:cursor-not-allowed"
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
                        className="shrink-0 rounded-lg p-1 text-white/35 transition hover:text-accent disabled:opacity-20 disabled:cursor-not-allowed"
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
                    className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-white/55 transition hover:text-white"
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
                      className="min-h-[150px] w-full rounded-3xl border border-white/10 bg-black/25 px-4 py-4 text-sm leading-6 text-white outline-none transition focus:border-accent/40"
                    />

                    {autoSavedId === record.id ? (
                      <div className="inline-flex items-center gap-1 text-[11px] text-accent/70">
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
                        className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 transition hover:text-white"
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
                        className="inline-flex items-center gap-1 rounded-xl border border-accent/35 bg-accent/12 px-3 py-2 text-xs text-accent transition hover:bg-accent/18 disabled:cursor-not-allowed disabled:opacity-45"
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
                        className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-rose-300 transition hover:text-rose-200"
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
            <section className="glass-panel rounded-3xl border border-white/10 p-4">
              <textarea
                value={promptDraft}
                onChange={(event) => {
                  setPromptDraft(event.target.value);
                }}
                className="min-h-[140px] w-full rounded-3xl border border-white/10 bg-black/25 px-4 py-4 text-sm leading-6 text-white outline-none transition"
                placeholder="输入新的提示词内容"
              />
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    void handleCreatePrompt();
                  }}
                  className="rounded-2xl border border-accent/35 bg-accent/12 px-4 py-2 text-xs text-accent"
                >
                  保存
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingPrompt(false);
                    setPromptDraft("");
                  }}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/70"
                >
                  取消
                </button>
              </div>
            </section>
          ) : null}

          <button
            type="button"
            onClick={() => {
              setIsCreatingPrompt(true);
            }}
            className="w-full rounded-3xl border border-dashed border-white/10 px-4 py-4 text-sm text-white/70 transition hover:border-accent/35 hover:text-accent"
          >
            + 添加提示词
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="glass-panel rounded-3xl border border-white/10 p-4">
        <div className="flex items-center gap-3">
          <div className="text-sm font-medium text-white/88">{activeCategory}文件夹</div>
          {isCollectionCategory ? (
            <div className="rounded-2xl border border-accent/25 bg-accent/10 px-2.5 py-1 text-xs text-accent">
              {scopedFolders.length}
            </div>
          ) : null}
          <div className="ml-auto flex items-center gap-2">
            {isCollectionCategory ? (
              <>
                <button
                  type="button"
                  onClick={() => { void handleExport(); }}
                  className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/50 transition hover:text-accent"
                  title="导出全部提示词"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleImport}
                  className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/50 transition hover:text-accent"
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
              className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/50 transition hover:text-accent disabled:opacity-40"
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
                  className="flex h-24 w-24 flex-col justify-between rounded-3xl border border-accent/35 bg-black/20 p-3"
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
                    "glass-panel flex h-24 w-24 flex-col items-center justify-center rounded-3xl border text-center transition",
                    "border-white/10 bg-white/5 text-white/70",
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
            <div className="glass-panel flex h-24 w-24 flex-col justify-between rounded-3xl border border-dashed border-accent/35 p-3">
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
              className="glass-panel flex h-24 w-24 items-center justify-center rounded-3xl border border-dashed border-white/10 text-white/60 transition hover:border-accent/35 hover:text-accent"
              aria-label="新建文件夹"
            >
              <Plus className="h-8 w-8" />
            </button>
          )}
        </div>
      </section>

      {!isLoading && sortedFavorites.length > 0 ? (
        <section className="space-y-1.5">
          <div className="text-xs text-white/40 px-1 mb-2">
            {scopedFolders.length > 0 ? "未分类提示词" : `${activeCategory} · ${sortedFavorites.length} 条`}
          </div>
          {sortedFavorites.map((record, index) => {
            const isExpanded = expandedId === record.id;
            const isBusy = busyId === record.id;
            const isEditingTitle = editingTitleId === record.id;
            const displayTitle = record.title || record.content.slice(0, 28);
            const isFirst = index === 0;
            const isLast = index === sortedFavorites.length - 1;

            return (
              <article key={record.id} className="glass-panel rounded-2xl border border-white/10 transition">
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
                      <button type="button" onClick={() => { void handleSortAction(record.id, "pin"); }} disabled={isFirst} className="shrink-0 rounded-lg p-1 text-white/35 transition hover:text-accent disabled:opacity-20 disabled:cursor-not-allowed"><Pin className="h-3.5 w-3.5" /></button>
                      <button type="button" onClick={() => { void handleSortAction(record.id, "up"); }} disabled={isFirst} className="shrink-0 rounded-lg p-1 text-white/35 transition hover:text-accent disabled:opacity-20 disabled:cursor-not-allowed"><ArrowUp className="h-3.5 w-3.5" /></button>
                      <button type="button" onClick={() => { void handleSortAction(record.id, "down"); }} disabled={isLast} className="shrink-0 rounded-lg p-1 text-white/35 transition hover:text-accent disabled:opacity-20 disabled:cursor-not-allowed"><ArrowDown className="h-3.5 w-3.5" /></button>
                      <button type="button" onClick={() => { setEditingTitleId(record.id); setTitleDraft(record.title || ""); }} className="shrink-0 rounded-lg p-1 text-white/35 transition hover:text-accent"><PencilLine className="h-3.5 w-3.5" /></button>
                      <button type="button" onClick={() => { void handleDeletePrompt(record); }} className="shrink-0 rounded-lg p-1 text-white/35 transition hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" /></button>
                    </>
                  )}
                  <button type="button" onClick={async () => {
                    if (isExpanded) { await flushPendingSave(record.id, draftContent); setExpandedId(null); setDraftContent(""); }
                    else { setExpandedId(record.id); setDraftContent(record.content); }
                  }} className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-white/55 transition hover:text-white">
                    {isExpanded ? "收起" : "展开"}
                  </button>
                </div>
                {isExpanded ? (
                  <div className="border-t border-white/5 px-3 py-3 space-y-3">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-white/35">
                      <span>{record.provider}</span><span>·</span><span>{record.model}</span><span>·</span><span>{formatTimestamp(record.updatedAt ?? record.createdAt)}</span>
                    </div>
                    <textarea value={draftContent} onChange={(e) => { setDraftContent(e.target.value); debouncedSave(record.id, e.target.value); }} className="min-h-[150px] w-full rounded-3xl border border-white/10 bg-black/25 px-4 py-4 text-sm leading-6 text-white outline-none transition focus:border-accent/40" />
                    {autoSavedId === record.id ? <div className="inline-flex items-center gap-1 text-[11px] text-accent/70"><Check className="h-3 w-3" />已自动保存</div> : null}
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => { void handleCopy(record); }} className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 transition hover:text-white">
                        {copiedId === record.id ? <><Check className="h-3.5 w-3.5" />已复制</> : <><Copy className="h-3.5 w-3.5" />一键复制</>}
                      </button>
                      <button type="button" onClick={() => { void optimizePrompt(record); }} disabled={isBusy} className="inline-flex items-center gap-1 rounded-xl border border-accent/35 bg-accent/12 px-3 py-2 text-xs text-accent transition hover:bg-accent/18 disabled:cursor-not-allowed disabled:opacity-45">
                        {isBusy ? <><LoaderCircle className="h-3.5 w-3.5 animate-spin" />优化中...</> : <><Sparkles className="h-3.5 w-3.5" />AI一键优化</>}
                      </button>
                      <button type="button" onClick={() => { void handleDeletePrompt(record); }} className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-rose-300 transition hover:text-rose-200">
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
    </div>
  );
}
