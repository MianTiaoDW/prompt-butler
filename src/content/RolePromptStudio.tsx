import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Copy,
  ImagePlus,
  LoaderCircle,
  Save,
  Sparkles,
  Wand2,
  X
} from "lucide-react";

import { useChromeStorage } from "../hooks/useChromeStorage";
import { saveImageWorkspacePrompt } from "../lib/image-library";
import {
  createPromptFolder,
  ensureDefaultRolePreset,
  PROMPT_STORAGE_KEYS,
  savePromptToFavorites
} from "../lib/prompt-library";
import { storageGet, storageSet } from "../lib/storage";
import type { PromptFolder, SavedPromptRecord } from "../types/prompt";
import { clearPromptTask, getPromptTask, startPromptTask } from "../lib/task-broker";
import type { PromptTaskState } from "../lib/task-broker";
import { showToast } from "../lib/toast";
import { sendRuntimeMessage, sendRuntimeMessageLong } from "../lib/runtime";
import type {
  PromptGenerationResult,
  PromptOutputFormat,
  PromptWorkspaceState
} from "../types/prompt";
import type { ExtensionSettings } from "../types/settings";

const defaultWorkspaceState: PromptWorkspaceState = {
  rolePreset: "",
  rolePresetLocked: false,
  userRequirement: ""
};

function convertFileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("读取参考图失败。"));
    };
    reader.onerror = () => {
      reject(new Error("读取参考图失败。"));
    };
    reader.readAsDataURL(file);
  });
}

function structuredPromptToText(value: PromptGenerationResult & { ok: true }) {
  return JSON.stringify(value.output.structuredPrompt, null, 2);
}

export function RolePromptStudio(props: {
  settings: ExtensionSettings;
  isServiceReady: boolean;
}) {
  const { settings, isServiceReady } = props;
  const workspace = useChromeStorage<PromptWorkspaceState>(
    PROMPT_STORAGE_KEYS.workspace,
    defaultWorkspaceState
  );
  const [isExpanded, setIsExpanded] = useState(true);
  const [referenceImages, setReferenceImages] = useState<Array<{ dataUrl: string; name: string }>>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<PromptGenerationResult | null>(null);
  const [panelMessage, setPanelMessage] = useState("填写角色设定和需求后点击生成");
  const [copiedFormat, setCopiedFormat] = useState<PromptOutputFormat | null>(null);
  const [savedFormat, setSavedFormat] = useState<PromptOutputFormat | null>(null);
  const [folderPickerOpen, setFolderPickerOpen] = useState(false);
  const [pendingSave, setPendingSave] = useState<{ format: PromptOutputFormat; text: string } | null>(null);
  const [pickerFolders, setPickerFolders] = useState<PromptFolder[]>([]);
  const [newFolderName, setNewFolderName] = useState("");
  const [editingFormat, setEditingFormat] = useState<PromptOutputFormat | null>(null);
  const [editingText, setEditingText] = useState("");

  const { value: workspaceState, setValue: setWorkspaceState, isLoading } = workspace;

  useEffect(() => {
    if (!copiedFormat) {
      return;
    }

    const timer = window.setTimeout(() => {
      setCopiedFormat(null);
    }, 1500);

    return () => window.clearTimeout(timer);
  }, [copiedFormat]);

  useEffect(() => {
    if (!savedFormat) {
      return;
    }

    const timer = window.setTimeout(() => {
      setSavedFormat(null);
    }, 1800);

    return () => window.clearTimeout(timer);
  }, [savedFormat]);

  useEffect(() => {
    void ensureDefaultRolePreset().then(() => {
      // 刷新 workspace state 以显示默认角色
      void storageGet<PromptWorkspaceState>(
        PROMPT_STORAGE_KEYS.workspace,
        defaultWorkspaceState
      ).then((ws) => {
        if (ws.rolePreset && !workspaceState.rolePreset) {
          void setWorkspaceState(() => ws);
        }
      });
    });
  }, []);

  useEffect(() => {
    void getPromptTask().then((task) => {
      if (task.status === "running") {
        setIsGenerating(true);
        setPanelMessage("正在通过 Background 调用模型扩写角色提示词...");
      } else if (task.status === "done" && task.result) {
        setGenerationResult(task.result);
        setIsGenerating(false);
        if (task.result.ok) {
          void saveImageWorkspacePrompt(task.result.output.cnPrompt);
          setPanelMessage(
            `已完成生成，当前使用模型：${task.result.model}，提示词已同步到生图区。`
          );
        } else {
          setPanelMessage(`生成失败：${task.result.message}`);
        }
      }
    });
  }, []);

  const canGenerate = useMemo(() => {
    return Boolean(
      isServiceReady &&
        workspaceState.rolePreset.trim() &&
        workspaceState.userRequirement.trim()
    );
  }, [isServiceReady, workspaceState.rolePreset, workspaceState.userRequirement]);

  const updateWorkspace = async (patch: Partial<PromptWorkspaceState>) => {
    await setWorkspaceState((current) => ({
      ...current,
      ...patch
    }));
  };

  const handleGenerate = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setPanelMessage("正在通过 Background 调用模型扩写角色提示词...");
    setGenerationResult(null);
    await startPromptTask();

    try {
      const result = await sendRuntimeMessageLong<PromptGenerationResult>(
        {
          type: "prompt:generate",
          payload: {
            settings,
            input: {
              rolePreset: workspaceState.rolePreset,
              userRequirement: workspaceState.userRequirement,
              referenceImages: referenceImages.length > 0 ? referenceImages : undefined
            }
          }
        },
        async () => {
          const task = await getPromptTask();
          if (task.status === "done" && task.result) {
            void clearPromptTask();
            return task.result;
          }
          return null;
        }
      );

      setGenerationResult(result);
      if (result.ok) {
        await saveImageWorkspacePrompt(result.output.cnPrompt);
        setPanelMessage(
          `已完成生成，当前使用模型：${result.model}，提示词已同步到生图区。`
        );
      } else {
        setPanelMessage(`生成失败：${result.message}`);
      }
    } catch (error) {
      setGenerationResult(null);
      setPanelMessage(
        error instanceof Error ? `生成失败：${error.message}` : "生成失败。"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async (format: PromptOutputFormat, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedFormat(format);
    } catch {
      setPanelMessage("当前页面不允许直接写入剪贴板，请手动复制。");
    }
  };

  const startEditing = (format: PromptOutputFormat, text: string) => {
    setEditingFormat(format);
    setEditingText(text);
  };

  const saveEditing = (format: PromptOutputFormat) => {
    if (!generationResult?.ok) return;
    const updatedOutput = { ...generationResult.output };
    if (format === "cnPrompt") updatedOutput.cnPrompt = editingText;
    else if (format === "enPrompt") updatedOutput.enPrompt = editingText;
    else {
      try {
        const parsed = JSON.parse(editingText) as typeof updatedOutput.structuredPrompt;
        updatedOutput.structuredPrompt = parsed;
      } catch {
        showToast("JSON 格式不正确，请修正后保存。");
        return;
      }
    }
    setGenerationResult({ ...generationResult, output: updatedOutput });
    setEditingFormat(null);
    showToast("已保存修改~");
  };

  const openFolderPicker = async (format: PromptOutputFormat, text: string) => {
    const folders = await storageGet<PromptFolder[]>(PROMPT_STORAGE_KEYS.folders, []);
    const scopeFolders = folders.filter((f) => (f.scope || "收藏") === "收藏");
    setPickerFolders(scopeFolders);
    setPendingSave({ format, text });
    setNewFolderName("");
    setFolderPickerOpen(true);
  };

  const confirmSaveToFolder = async (folderName: string | null) => {
    if (!generationResult?.ok || !pendingSave) return;

    const category = folderName ? `收藏/${folderName}` : "收藏";
    await savePromptToFavorites({
      provider: generationResult.provider,
      model: generationResult.model,
      format: pendingSave.format,
      content: pendingSave.text,
      title: pendingSave.text.slice(0, 28)
    });
    // 更新分类
    const allRecords = await storageGet<SavedPromptRecord[]>(PROMPT_STORAGE_KEYS.favorites, []);
    const target = allRecords.find((r) => r.content === pendingSave.text && r.category === "收藏");
    if (target) {
      const updated = allRecords.map((r) =>
        r.id === target.id ? { ...r, category, updatedAt: new Date().toISOString() } : r
      );
      await storageSet(PROMPT_STORAGE_KEYS.favorites, updated);
    }

    setSavedFormat(pendingSave.format);
    setFolderPickerOpen(false);
    setPendingSave(null);
    showToast(folderName ? `已保存到「${folderName}」~` : "已保存到收藏~");
  };

  const handleCreateAndSave = async () => {
    const name = newFolderName.trim();
    if (!name) return;
    try {
      await createPromptFolder(name, "收藏");
      const folders = await storageGet<PromptFolder[]>(PROMPT_STORAGE_KEYS.folders, []);
      setPickerFolders(folders.filter((f) => (f.scope || "收藏") === "收藏"));
      setNewFolderName("");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "创建失败");
    }
  };

  const outputs = generationResult?.ok
    ? [
        {
          title: "中文段落",
          format: "cnPrompt" as const,
          text: generationResult.output.cnPrompt
        },
        {
          title: "English Prompt",
          format: "enPrompt" as const,
          text: generationResult.output.enPrompt
        },
        {
          title: "高结构化 JSON",
          format: "structuredPrompt" as const,
          text: structuredPromptToText(generationResult)
        }
      ]
    : [];

  return (
    <div className="space-y-4">
      <section className="glass-card p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="section-label">角色预设区</div>
            <div className="section-hint">
              设定一个角色，支持JSON或大白话
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {isExpanded ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    void updateWorkspace({
                      rolePresetLocked: true
                    });
                    setPanelMessage("角色已锁定，可输入需求生成");
                  }}
                  disabled={workspaceState.rolePresetLocked || !workspaceState.rolePreset.trim()}
                  className="gradient-button rounded-xl px-3 py-2 text-xs"
                >
                  保存
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void updateWorkspace({
                      rolePresetLocked: false
                    });
                    setPanelMessage("角色已恢复可编辑");
                  }}
                  className="ghost-button rounded-xl px-2.5 py-2 text-xs"
                >
                  修改
                </button>
              </>
            ) : null}
            <button
              type="button"
              onClick={() => {
                setIsExpanded((current) => !current);
              }}
              className="rounded-xl border border-white/10 bg-white/[0.06] px-2.5 py-2 text-xs text-white/58 transition hover:border-accent/30 hover:text-white"
            >
              {isExpanded ? "收起" : "展开"}
            </button>
          </div>
        </div>

        {isExpanded ? (
          <div className="mt-3">
            <textarea
              value={workspaceState.rolePreset}
              onChange={(event) => {
                void updateWorkspace({
                  rolePreset: event.target.value
                });
              }}
              disabled={workspaceState.rolePresetLocked || isLoading}
              placeholder="例如：你是一个资深 AI 绘画提示词专家，擅长把用户的简单想法扩写成完整、可执行、画面感强的提示词。"
              className="form-field min-h-[150px] w-full resize-y rounded-[1.15rem] px-4 py-3 text-[15px] leading-7 disabled:bg-white/5 disabled:text-white/45"
            />
          </div>
        ) : null}
      </section>

      <section className="glass-card p-3">
        <div className="section-label">用户需求区</div>
        <div className="section-hint">
          描述希望呈现的场景、风格或镜头语言
        </div>
        <textarea
          value={workspaceState.userRequirement}
          onChange={(event) => {
            void updateWorkspace({
              userRequirement: event.target.value
            });
          }}
          placeholder="例如：做成电影海报风，暴雨夜站在霓虹街头，强烈逆光和慢门动势。"
          className="form-field mt-3 min-h-[112px] w-full resize-y rounded-[1.15rem] px-4 py-3 text-[15px] leading-7"
        />

        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            {referenceImages.length < 8 ? (
              <label className="ghost-button cursor-pointer px-4 py-3 text-[13px]">
                <ImagePlus className="h-4 w-4" />
                添加参考图
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(event) => {
                    const files = Array.from(event.target.files ?? []);
                    if (files.length === 0) return;
                    const remaining = 8 - referenceImages.length;
                    const toAdd = files.slice(0, remaining);
                    void Promise.all(
                      toAdd.map((file) =>
                        convertFileToDataUrl(file).then((dataUrl) => ({
                          dataUrl,
                          name: file.name
                        }))
                      )
                    )
                      .then((newImages) => {
                        setReferenceImages((prev) => [...prev, ...newImages]);
                        setPanelMessage(`已附加 ${newImages.length} 张参考图`);
                      })
                      .catch((error: unknown) => {
                        setPanelMessage(
                          error instanceof Error ? error.message : "读取参考图失败。"
                        );
                      });
                  }}
                />
              </label>
            ) : null}
            <span className="text-xs text-white/35">最多上传 8 张参考图</span>
          </div>
          {referenceImages.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {referenceImages.map((img, index) => (
                <div key={index} className="group relative">
                  <img
                    src={img.dataUrl}
                    alt={img.name}
                    className="h-16 w-16 rounded-2xl border border-white/10 object-cover shadow-[0_10px_26px_rgba(0,0,0,0.24)]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setReferenceImages((prev) => prev.filter((_, i) => i !== index));
                      setPanelMessage("已移除参考图");
                    }}
                    className="absolute -right-1.5 -top-1.5 rounded-full border border-white/10 bg-slate-950/90 p-0.5 text-white/55 transition hover:text-rose-300"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="glass-card p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="section-label">生成提示词</div>
            <div className="section-hint">
              参考图走视觉模型，否则走推理模型
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              void handleGenerate();
            }}
            disabled={!canGenerate || isGenerating}
            className="gradient-button px-3 py-2 text-[13px]"
          >
            {isGenerating ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {isGenerating ? "生成中..." : "生成提示词"}
          </button>
        </div>

        <div className="mt-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-[11px] leading-5 text-white/48">
          {isServiceReady
            ? panelMessage
            : "请先在配置中心完成连接配置"}
        </div>
      </section>

      <section className="glass-card p-4">
        <div className="section-label">输出结果区</div>
        <div className="section-hint">
          输出中文、英文及结构化 JSON
        </div>

        <div className="mt-4 space-y-3">
          {generationResult && !generationResult.ok ? (
            <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-4 text-[14px] leading-6 text-rose-200">
              {generationResult.message}
            </div>
          ) : null}

          {outputs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-black/10 px-4 py-8 text-[14px] leading-6 text-white/38">
              生成完成后在此展示、复制或收藏
            </div>
          ) : null}

          {outputs.map((item) => (
            <article
              key={item.format}
              className="media-card px-4 py-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-[13px] font-semibold text-white/85">{item.title}</div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      void handleCopy(item.format, item.text);
                    }}
                    className="ghost-button rounded-xl px-3 py-2 text-[11px]"
                  >
                    {copiedFormat === item.format ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    {copiedFormat === item.format ? "已复制" : "一键复制"}
                  </button>
                  {editingFormat === item.format ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          saveEditing(item.format);
                        }}
                        className="gradient-button rounded-xl px-3 py-2 text-[11px]"
                      >
                        <Check className="h-3.5 w-3.5" />
                        保存修改
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingFormat(null);
                        }}
                        className="ghost-button rounded-xl px-3 py-2 text-[11px]"
                      >
                        取消
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          startEditing(item.format, item.text);
                        }}
                        className="ghost-button rounded-xl px-3 py-2 text-[11px]"
                      >
                        <Wand2 className="h-3.5 w-3.5" />
                        重新编辑
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          void openFolderPicker(item.format, item.text);
                        }}
                        className="ghost-button rounded-xl px-3 py-2 text-[11px]"
                      >
                        <Save className="h-3.5 w-3.5" />
                        {savedFormat === item.format ? "已收藏" : "保存到收藏"}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {editingFormat === item.format ? (
                <textarea
                  value={editingText}
                  onChange={(e) => { setEditingText(e.target.value); }}
                  className="form-field mt-3 min-h-[120px] w-full resize-y text-[14px] leading-7"
                />
              ) : (
                <pre className="mt-3 whitespace-pre-wrap break-words text-[14px] leading-7 text-white/68">
                  {item.text}
                </pre>
              )}
            </article>
          ))}
        </div>
      </section>

      {folderPickerOpen ? (
        <div
          className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => {
            setFolderPickerOpen(false);
          }}
        >
          <div
            className="aurora-shell w-72 rounded-[1.35rem] p-5"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <div className="section-label mb-3">保存到收藏夹</div>

            {pickerFolders.length > 0 ? (
              <div className="space-y-1 mb-3 max-h-40 overflow-y-auto no-scrollbar">
                {pickerFolders.map((folder) => (
                  <button
                    key={folder.id}
                    type="button"
                    onClick={() => {
                      void confirmSaveToFolder(folder.name);
                    }}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2.5 text-left text-[13px] text-white/68 transition hover:border-accent/30 hover:text-white"
                  >
                    {folder.name}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-[11px] text-white/35 mb-3">暂无收藏夹</div>
            )}

            <div className="flex items-center gap-2 mb-3">
              <input
                value={newFolderName}
                onChange={(e) => { setNewFolderName(e.target.value); }}
                placeholder="新建收藏夹名称"
                className="form-field flex-1 rounded-xl px-3 py-2 text-[13px]"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    void handleCreateAndSave();
                  }
                }}
              />
              <button
                type="button"
                onClick={() => { void handleCreateAndSave(); }}
                disabled={!newFolderName.trim()}
                className="gradient-button shrink-0 rounded-xl px-3 py-2 text-[13px] disabled:opacity-30"
              >
                新建
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                void confirmSaveToFolder(null);
              }}
              className="ghost-button w-full rounded-xl px-3 py-2.5 text-[13px]"
            >
              直接保存到收藏根目录
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
