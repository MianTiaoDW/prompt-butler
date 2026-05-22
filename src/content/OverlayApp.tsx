import { useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { AnimatePresence, motion, Reorder } from "framer-motion";
import { Check, Plus, Search, Settings, Sparkles, X } from "lucide-react";
import { Rnd } from "react-rnd";

import { FavoritesStudio } from "./FavoritesStudio";
import { ImageStudio } from "./ImageStudio";
import { RolePromptStudio } from "./RolePromptStudio";
import {
  addCustomTab,
  CORE_TABS,
  DEFAULT_PROMPT_TABS,
  deleteTab,
  getCustomTabs,
  getVisibleTabs,
  renameCustomTab,
  saveTabOrder
} from "../lib/prompt-library";
import { useExtensionSettings } from "../hooks/useExtensionSettings";
import { subscribeToast } from "../lib/toast";

interface OverlayAppProps {
  embedded?: boolean;
}

export function OverlayApp({ embedded = false }: OverlayAppProps) {
  const { isLoading, isServiceReady, providerPreset, settings } = useExtensionSettings();
  const [activeTab, setActiveTab] = useState<string>(DEFAULT_PROMPT_TABS[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [customTabs, setCustomTabs] = useState<string[]>([]);
  const [visibleTabs, setVisibleTabs] = useState<string[]>(DEFAULT_PROMPT_TABS.slice());
  const [isCreatingTab, setIsCreatingTab] = useState(false);
  const [tabNameDraft, setTabNameDraft] = useState("");
  const [editingTabName, setEditingTabName] = useState<string | null>(null);
  const [panelErrorMessage, setPanelErrorMessage] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navRef = useRef<HTMLElement | null>(null);
  const dragStateRef = useRef<{
    isDragging: boolean;
    startX: number;
    startScrollLeft: number;
  }>({
    isDragging: false,
    startX: 0,
    startScrollLeft: 0
  });
  const isReorderingRef = useRef(false);

  useEffect(() => {
    void getCustomTabs().then(setCustomTabs);
    void getVisibleTabs().then(setVisibleTabs);
  }, []);

  useEffect(() => {
    return subscribeToast((message) => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
      setToastMessage(message);
      toastTimerRef.current = setTimeout(() => {
        setToastMessage(null);
      }, 2000);
    });
  }, []);

  const libraryTabs = visibleTabs.filter(
    (tab) => tab !== "角色设定" && tab !== "图像生成"
  );
  const availableCategories: string[] = [...libraryTabs];

  const handleCreateTab = async () => {
    try {
      setPanelErrorMessage("");
      const next = await addCustomTab(tabNameDraft);
      setCustomTabs(next);
      setIsCreatingTab(false);
      setTabNameDraft("");
      setActiveTab(tabNameDraft.trim());
    } catch (error) {
      setPanelErrorMessage(error instanceof Error ? error.message : "创建失败。");
    }
  };

  const handleRenameTab = async (oldName: string) => {
    try {
      setPanelErrorMessage("");
      const next = await renameCustomTab(oldName, tabNameDraft);
      setCustomTabs(next);
      const newName = tabNameDraft.trim();
      if (activeTab === oldName) {
        setActiveTab(newName);
      }
      setEditingTabName(null);
      setTabNameDraft("");
    } catch (error) {
      setPanelErrorMessage(error instanceof Error ? error.message : "重命名失败。");
    }
  };

  const handleDeleteTab = async (name: string) => {
    const { customTabs: nextCustom, visibleTabs: nextVisible } = await deleteTab(name);
    setCustomTabs(nextCustom);
    setVisibleTabs(nextVisible);
    if (activeTab === name) {
      setActiveTab(DEFAULT_PROMPT_TABS[0]);
    }
    setEditingTabName(null);
    setTabNameDraft("");
  };

  const openOptions = () => {
    chrome.runtime.sendMessage({ type: "open-options-page" }, () => {
      if (chrome.runtime.lastError) {
        window.open(chrome.runtime.getURL("options.html"));
      }
    });
  };

  const startHorizontalDrag = (event: ReactMouseEvent<HTMLElement>) => {
    if (isReorderingRef.current || !navRef.current) return;

    dragStateRef.current = {
      isDragging: true,
      startX: event.clientX,
      startScrollLeft: navRef.current.scrollLeft
    };
  };

  const moveHorizontalDrag = (event: ReactMouseEvent<HTMLElement>) => {
    if (isReorderingRef.current || !navRef.current || !dragStateRef.current.isDragging) return;

    const distance = event.clientX - dragStateRef.current.startX;
    navRef.current.scrollLeft = dragStateRef.current.startScrollLeft - distance;
  };

  const endHorizontalDrag = () => {
    dragStateRef.current.isDragging = false;
  };

  const statusText = isLoading
    ? "正在同步配置"
    : settings.connectionStatus === "testing"
      ? "正在测试连接"
      : isServiceReady
        ? "服务已就绪"
        : settings.connectionStatus === "error"
          ? "连接测试失败"
          : "配置未就绪";

  const statusDotClassName = isServiceReady
    ? "bg-accent shadow-[0_0_14px_rgba(0,255,132,0.9)]"
    : settings.connectionStatus === "testing"
      ? "bg-amber-300 shadow-[0_0_10px_rgba(252,211,77,0.8)]"
      : settings.connectionStatus === "error"
        ? "bg-rose-400 shadow-[0_0_10px_rgba(251,113,133,0.7)]"
        : "bg-white/20";

  const statusBadgeText = isServiceReady
    ? "在线"
    : settings.connectionStatus === "testing"
      ? "检测中"
      : settings.connectionStatus === "error"
        ? "失败"
        : "未验证";

  const panel = (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel accent-ring flex h-full flex-col overflow-hidden rounded-4xl border border-white/10 bg-panel-900/85 text-white"
    >
        <header className="drag-handle flex cursor-move items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/14 text-accent">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-[0.18em] text-accent/80">
                提示词生成管家
              </div>
              <div className="text-xs text-white/55">
                {statusText}
                {!isLoading ? ` · ${providerPreset.label}` : ""}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">
              <span
                className={["h-2.5 w-2.5 rounded-full", statusDotClassName].join(" ")}
              />
              {statusBadgeText}
            </div>
            <button
              type="button"
              onClick={openOptions}
              className="rounded-2xl border border-white/10 bg-white/5 p-3 text-white/70 transition hover:border-accent/40 hover:text-accent"
              aria-label="打开配置中心"
              title="配置中心"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-5">
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.24em] text-white/45">
              搜索
            </span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              <input
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                }}
                placeholder="搜索 nano、运镜、打斗、光影... 等关键字"
                className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-accent/40"
              />
            </div>
          </label>

          <nav
            ref={navRef}
            className="no-scrollbar mt-4 overflow-x-auto pb-2"
            style={{ touchAction: "pan-x", overscrollBehaviorX: "contain" }}
            onMouseDown={startHorizontalDrag}
            onMouseMove={moveHorizontalDrag}
            onMouseUp={endHorizontalDrag}
            onMouseLeave={endHorizontalDrag}
          >
          <Reorder.Group
            axis="x"
            values={visibleTabs}
            onReorder={async (newOrder: string[]) => {
              setVisibleTabs(newOrder);
              await saveTabOrder(newOrder);
            }}
            className="flex gap-2"
          >
            {visibleTabs.map((tab) => {
              const isCustom = customTabs.includes(tab);
              const isDeletable = !CORE_TABS.includes(tab);
              const isEditing = editingTabName === tab;

              if (isEditing) {
                return (
                  <Reorder.Item
                    key={tab}
                    value={tab}
                    as="span"
                    onDragStart={() => { isReorderingRef.current = true; }}
                    onDragEnd={() => { isReorderingRef.current = false; }}
                    className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-accent/45 bg-black/25 px-3 py-1.5"
                  >
                    <input
                      value={tabNameDraft}
                      onChange={(event) => {
                        setTabNameDraft(event.target.value);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          void handleRenameTab(tab);
                        }
                        if (event.key === "Escape") {
                          setEditingTabName(null);
                          setTabNameDraft("");
                        }
                      }}
                      className="w-20 bg-transparent text-xs text-white outline-none"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => {
                        void handleRenameTab(tab);
                      }}
                      className="rounded p-0.5 text-white/55 transition hover:text-accent"
                    >
                      <Check className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTabName(null);
                        setTabNameDraft("");
                      }}
                      className="rounded p-0.5 text-white/55 transition hover:text-rose-300"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Reorder.Item>
                );
              }

              return (
                <Reorder.Item
                  key={tab}
                  value={tab}
                  as="span"
                  className="inline-flex items-center gap-1"
                  whileDrag={{
                    scale: 1.08,
                    zIndex: 50,
                    boxShadow: "0 0 20px rgba(0,255,132,0.25)"
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  onDragStart={() => { isReorderingRef.current = true; }}
                  onDragEnd={() => { isReorderingRef.current = false; }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab(tab);
                    }}
                    onDoubleClick={
                      isCustom
                        ? () => {
                            setEditingTabName(tab);
                            setTabNameDraft(tab);
                          }
                        : undefined
                    }
                    title={isCustom ? "双击重命名" : undefined}
                    className={[
                      "whitespace-nowrap rounded-full border px-4 py-2 text-sm transition",
                      activeTab === tab
                        ? "border-accent/45 bg-accent/14 text-accent"
                        : "border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:text-white"
                    ].join(" ")}
                  >
                    {tab}
                  </button>
                  {isDeletable ? (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        void handleDeleteTab(tab);
                      }}
                      className="rounded-full p-1 text-white/30 transition hover:bg-rose-400/20 hover:text-rose-300"
                      title="删除标签"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </Reorder.Item>
              );
            })}

            {isCreatingTab ? (
              <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-dashed border-accent/45 bg-black/25 px-3 py-1.5">
                <input
                  value={tabNameDraft}
                  onChange={(event) => {
                    setTabNameDraft(event.target.value);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      void handleCreateTab();
                    }
                    if (event.key === "Escape") {
                      setIsCreatingTab(false);
                      setTabNameDraft("");
                      setPanelErrorMessage("");
                    }
                  }}
                  placeholder="预设名称"
                  className="w-20 bg-transparent text-xs text-white outline-none placeholder:text-white/25"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    void handleCreateTab();
                  }}
                  className="rounded p-0.5 text-white/55 transition hover:text-accent"
                >
                  <Check className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingTab(false);
                    setTabNameDraft("");
                    setPanelErrorMessage("");
                  }}
                  className="rounded p-0.5 text-white/55 transition hover:text-rose-300"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsCreatingTab(true);
                  setTabNameDraft("");
                  setPanelErrorMessage("");
                }}
                className="whitespace-nowrap rounded-full border border-dashed border-white/15 bg-transparent px-3 py-2 text-sm text-white/40 transition hover:border-accent/40 hover:text-accent"
              >
                <Plus className="h-4 w-4" />
              </button>
            )}
          </Reorder.Group>
          </nav>

          {panelErrorMessage ? (
            <div className="mt-2 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-xs text-rose-200">
              {panelErrorMessage}
            </div>
          ) : null}

          <div className="mt-4 space-y-4">
            {searchQuery.trim() ? (
              <FavoritesStudio
                settings={settings}
                isServiceReady={isServiceReady}
                activeCategory="收藏"
                searchQuery={searchQuery}
              />
            ) : activeTab === "角色设定" ? (
              <RolePromptStudio settings={settings} isServiceReady={isServiceReady} />
            ) : activeTab === "收藏" ? (
              <FavoritesStudio
                settings={settings}
                isServiceReady={isServiceReady}
                activeCategory="收藏"
              />
            ) : activeTab === "图像生成" ? (
              <ImageStudio settings={settings} isServiceReady={isServiceReady} />
            ) : availableCategories.includes(activeTab) ? (
              <FavoritesStudio
                settings={settings}
                isServiceReady={isServiceReady}
                activeCategory={activeTab}
              />
            ) : (
              <div className="glass-panel rounded-3xl border border-dashed border-white/10 px-4 py-6">
                <div className="text-sm font-medium text-white/85">{activeTab} 模块稍后接入</div>
                <p className="mt-2 text-sm leading-6 text-white/55">
                  当前重点已经切到“角色设定”主工作流。收藏夹、Nano 精修、AI 视频运镜等模块会在后续阶段继续补全。
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-white/55">
                  <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3">
                    <div className="text-white/35">推理模型</div>
                    <div className="mt-1 break-all text-white/78">{settings.reasoningModel || "未设置"}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3">
                    <div className="text-white/35">视觉模型</div>
                    <div className="mt-1 break-all text-white/78">{settings.visionModel || "未设置"}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <AnimatePresence>
          {toastMessage ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }}
              className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center"
            >
              <span className="text-sm text-white/85">{toastMessage}</span>
            </motion.div>
          ) : null}
        </AnimatePresence>
    </motion.section>
  );

  if (embedded) {
    return (
      <div className="h-full w-full">
        {panel}
      </div>
    );
  }

  return (
    <Rnd
      default={{ x: 24, y: 24, width: 440, height: 760 }}
      minWidth={390}
      minHeight={520}
      bounds="window"
      dragHandleClassName="drag-handle"
      className="z-[2147483647]"
    >
      {panel}
    </Rnd>
  );
}
