import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ChevronDown,
  Copy,
  Download,
  LoaderCircle,
  Save,
  Sparkles,
  X
} from "lucide-react";

import { useChromeStorage } from "../hooks/useChromeStorage";
import { useExtensionSettings } from "../hooks/useExtensionSettings";
import {
  addImageHistoryEntries,
  clearImageHistory,
  defaultImageWorkspaceState,
  getImageHistory,
  IMAGE_STORAGE_KEYS
} from "../lib/image-library";
import { getImageConnectionSettings } from "../lib/provider-presets";
import { toUserFacingError } from "../lib/error-messages";
import { PROMPT_STORAGE_KEYS, savePromptToFavorites, updateFavoritePrompt } from "../lib/prompt-library";
import { storageGet } from "../lib/storage";
import { sendRuntimeMessage, sendRuntimeMessageLong } from "../lib/runtime";
import { clearImageTask, failImageTask, getImageTask, startImageTask, subscribeImageTask } from "../lib/task-broker";
import { showToast } from "../lib/toast";
import type { GeneratedImageAsset, ImageGenerationResult, ImageHistoryEntry, ImageWorkspaceState } from "../types/image";
import type { PromptLinkedImage, SavedPromptRecord } from "../types/prompt";
import type { ExtensionSettings } from "../types/settings";
import { IMAGE_ASPECT_RATIOS, IMAGE_COUNTS, IMAGE_RESOLUTIONS } from "../types/settings";
import { PromptHistoryPanel } from "./PromptHistoryPanel";
import { PromptPreviewModal } from "./PromptPreviewModal";
import { WorkflowConnector } from "./WorkflowConnector";
import { MOTION } from "../lib/motion";

const selectClassName = [
  "form-field appearance-none w-full pl-4 pr-10 py-3",
  "cursor-pointer hover:border-accent/30"
].join(" ");

async function copyImageToClipboard(imageUrl: string) {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    await navigator.clipboard.write([
      new ClipboardItem({ [blob.type]: blob })
    ]);
    showToast("已复制到剪贴板~");
  } catch {
    showToast("复制失败，请重试。");
  }
}

function getGalleryAspectClass(aspectRatio: ExtensionSettings["imageAspectRatio"]) {
  if (aspectRatio === "1:1") return "aspect-square";
  if (aspectRatio === "16:9" || aspectRatio === "3:1" || aspectRatio === "8:1" || aspectRatio === "21:1") {
    return "aspect-video";
  }
  if (aspectRatio === "4:3") return "aspect-[4/3]";
  return "aspect-[3/4]";
}

export function ImageStudio(props: {
  settings: ExtensionSettings;
  isServiceReady: boolean;
}) {
  const shouldReduceMotion = useReducedMotion();
  const { settings } = props;
  const { setImageResolution, setImageCount, setImageAspectRatio, updateSettings } = useExtensionSettings();
  const workspaceStorage = useChromeStorage<ImageWorkspaceState>(
    IMAGE_STORAGE_KEYS.workspace,
    defaultImageWorkspaceState
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [generationResult, setGenerationResult] = useState<ImageGenerationResult | null>(null);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [previewImage, setPreviewImage] = useState<GeneratedImageAsset | null>(null);
  const [imageHistory, setImageHistory] = useState<ImageHistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [previewPromptRecord, setPreviewPromptRecord] = useState<SavedPromptRecord | null>(null);
  const generationLockRef = useRef(false);

  useEffect(() => {
    void getImageHistory().then(setImageHistory);
  }, []);

  const { value: workspace, setValue: setWorkspace } = workspaceStorage;
  const sourcePromptRecord: SavedPromptRecord | null = workspace.source ? {
    id: workspace.source.promptId ?? "temporary-image-workspace-prompt",
    title: workspace.source.title,
    createdAt: workspace.lastUpdatedAt ?? new Date().toISOString(),
    provider: workspace.source.provider ?? settings.provider,
    model: workspace.source.model ?? settings.imageModel,
    format: workspace.source.format,
    content: workspace.prompt,
    category: "收藏",
    tags: [],
    source: workspace.source.type === "temporary" ? "ai-generated" : workspace.source.type
  } : null;

  const imageConnection = getImageConnectionSettings(settings);
  const imageConfigurationMessage = !imageConnection.apiKey
    ? "未配置生图 API Key，请前往设置页补充"
    : !imageConnection.baseUrl
      ? "未配置生图 Base URL，请前往设置页补充"
      : !settings.imageModel.trim()
        ? "未配置生图模型，请前往设置页补充"
        : "";
  const canGenerate = Boolean(!imageConfigurationMessage && workspace.prompt.trim());

  useEffect(() => {
    const applyTaskState = (task: Awaited<ReturnType<typeof getImageTask>>) => {
      if (task.status === "submitting" || task.status === "generating") {
        setIsGenerating(true);
        return;
      }
      if ((task.status === "success" || task.status === "error") && task.result) {
        setGenerationResult(task.result);
        setIsGenerating(false);
        return;
      }
      if (task.status === "error" && task.errorMessage) {
        const friendly = toUserFacingError(task.errorMessage);
        setGenerationResult({
          ok: false,
          provider: settings.provider,
          model: settings.imageModel,
          generatedAt: task.finishedAt ?? new Date().toISOString(),
          message: friendly.message
        });
      }
      setIsGenerating(false);
    };

    void getImageTask().then(applyTaskState);
    return subscribeImageTask(applyTaskState);
  }, [settings.imageModel, settings.provider]);

  const handleGenerate = async () => {
    if (generationLockRef.current || isGenerating) return;
    generationLockRef.current = true;
    setIsGenerating(true);

    try {
      await startImageTask();
      const result = await sendRuntimeMessageLong<ImageGenerationResult>(
        {
          type: "image:generate",
          payload: {
            settings,
            input: {
              prompt: workspace.prompt,
              count: settings.imageCount,
              resolution: settings.imageResolution,
              aspectRatio: settings.imageAspectRatio
            }
          }
        },
        async () => {
          const task = await getImageTask();
          if ((task.status === "success" || task.status === "error") && task.result) {
            return task.result;
          }
          return null;
        }
      );

      setGenerationResult(result);

      if (result.ok) {
        let linkedRecord: SavedPromptRecord | null = null;
        let resolvedSource = workspace.source;
        if (workspace.source?.promptId) {
          const records = await storageGet<SavedPromptRecord[]>(PROMPT_STORAGE_KEYS.favorites, []);
          linkedRecord = records.find((record) => record.id === workspace.source?.promptId) ?? null;
        } else if (workspace.source?.type === "temporary") {
          linkedRecord = await savePromptToFavorites({
            provider: workspace.source.provider ?? result.provider,
            model: workspace.source.model ?? result.model,
            format: workspace.source.format,
            content: workspace.prompt,
            title: workspace.source.title,
            category: "收藏/其他",
            source: "ai-generated",
            isFavorite: false
          });
          resolvedSource = { ...workspace.source, promptId: linkedRecord.id, type: "ai-generated" };
          await setWorkspace({ ...workspace, source: resolvedSource, lastUpdatedAt: new Date().toISOString() });
        }

        if (linkedRecord) {
          const newLinks: PromptLinkedImage[] = result.images.map((image) => ({
            imageId: image.id,
            imageUrl: image.url,
            model: result.model,
            ratio: settings.imageAspectRatio,
            resolution: settings.imageResolution,
            createdAt: result.generatedAt
          }));
          const mergedLinks = [...(linkedRecord.linkedImages ?? []), ...newLinks].filter((item, index, all) => {
            const key = typeof item === "string" ? item : item.imageId ?? item.imageUrl;
            return all.findIndex((candidate) => (typeof candidate === "string" ? candidate : candidate.imageId ?? candidate.imageUrl) === key) === index;
          });
          linkedRecord = await updateFavoritePrompt(linkedRecord.id, { linkedImages: mergedLinks });
          if (linkedRecord) setPreviewPromptRecord((current) => current?.id === linkedRecord?.id ? linkedRecord : current);
        }

        const historyEntries: ImageHistoryEntry[] = result.images.map((image) => ({
          id: image.id,
          url: image.url,
          prompt: workspace.prompt,
          model: result.model,
          provider: result.provider,
          resolution: settings.imageResolution,
          aspectRatio: settings.imageAspectRatio,
          count: settings.imageCount,
          generatedAt: result.generatedAt,
          revisedPrompt: image.revisedPrompt,
          promptId: linkedRecord?.id ?? resolvedSource?.promptId,
          promptTitle: linkedRecord?.title ?? resolvedSource?.title,
          promptSource: resolvedSource
        }));
        const updatedHistory = await addImageHistoryEntries(historyEntries);
        setImageHistory(updatedHistory);
      }
    } catch (error) {
      const friendly = toUserFacingError(error);
      await failImageTask(friendly.technicalDetails);
      setGenerationResult({
        ok: false,
        provider: settings.provider,
        model: settings.imageModel,
        generatedAt: new Date().toISOString(),
        message: friendly.message
      });
    } finally {
      generationLockRef.current = false;
      setIsGenerating(false);
    }
  };

  const handleCancel = async () => {
    try {
      await sendRuntimeMessage({ type: "image:cancel" });
    } catch {
      // 取消消息本身失败不影响 UI 重置
    }
    setIsGenerating(false);
    await clearImageTask();
  };

  const handleDownload = async (urls: string[], imageId?: string) => {
    if (imageId) {
      setDownloadingId(imageId);
    } else {
      setIsDownloadingAll(true);
    }

    try {
      await sendRuntimeMessage<number[]>({
        type: "image:download",
        payload: {
          urls
        }
      });
      showToast("已开始下载~");
    } catch (error) {
      showToast("下载失败，请重试。");
    } finally {
      setDownloadingId(null);
      setIsDownloadingAll(false);
    }
  };

  const openPromptAsset = async (promptId?: string) => {
    if (!promptId) {
      setPreviewPromptRecord(sourcePromptRecord);
      return;
    }
    const records = await storageGet<SavedPromptRecord[]>(PROMPT_STORAGE_KEYS.favorites, []);
    const record = records.find((item) => item.id === promptId);
    if (record) setPreviewPromptRecord(record);
    else showToast("对应 Prompt 资产已不存在");
  };

  const saveCurrentPrompt = async () => {
    if (!workspace.prompt.trim()) return;
    if (workspace.source?.promptId) {
      showToast("该 Prompt 已在提示词库中");
      return;
    }
    const record = await savePromptToFavorites({
      provider: workspace.source?.provider ?? settings.provider,
      model: workspace.source?.model ?? settings.imageModel,
      format: workspace.source?.format ?? "cnPrompt",
      content: workspace.prompt,
      title: workspace.source?.title || workspace.prompt.slice(0, 28),
      category: "收藏/其他",
      source: workspace.source?.type === "temporary" ? "ai-generated" : workspace.source?.type === "ai-generated" || workspace.source?.type === "system-template" ? workspace.source.type : "user-created",
      isFavorite: true
    });
    await setWorkspace({
      ...workspace,
      source: {
        promptId: record.id,
        title: record.title,
        type: record.source ?? "user-created",
        format: record.format,
        provider: record.provider,
        model: record.model
      },
      lastUpdatedAt: new Date().toISOString()
    });
    showToast("已保存到提示词库");
  };

  const restoreHistoryEntry = async (entry: ImageHistoryEntry) => {
    await setWorkspace({ prompt: entry.prompt, lastUpdatedAt: new Date().toISOString(), source: entry.promptSource });
    await updateSettings({
      ...settings,
      imageModel: entry.model || settings.imageModel,
      imageResolution: entry.resolution as ExtensionSettings["imageResolution"],
      imageAspectRatio: entry.aspectRatio as ExtensionSettings["imageAspectRatio"],
      imageCount: entry.count as ExtensionSettings["imageCount"]
    });
    showToast("已恢复此次创作环境");
  };

  return (
    <div className="image-workbench">
      <section className="image-compose-card">
        <div className="image-workbench-heading">
          <div className="section-label">AI 图像生成</div>
          <div className="section-hint">
            调整生成参数，完善提示词，然后开始创作。
          </div>
        </div>

        {workspace.source ? (
          <WorkflowConnector
            title={workspace.source.title}
            sourceLabel={workspace.source.type === "temporary" ? "临时 Prompt" : workspace.source.type === "ai-generated" ? "AI 生成" : workspace.source.type === "system-template" ? "系统模板" : "用户创建"}
            onView={() => { void openPromptAsset(workspace.source?.promptId); }}
          />
        ) : null}

        <div className="image-parameter-bar">
          <label className="block">
            <span className="mb-1.5 block text-xs text-white/50">图像比例</span>
            <div className="relative">
              <select
                value={settings.imageAspectRatio}
                onChange={(event) => {
                  void setImageAspectRatio(event.target.value as typeof settings.imageAspectRatio);
                }}
                className={selectClassName}
              >
                {IMAGE_ASPECT_RATIOS.map((ratio) => (
                  <option key={ratio} value={ratio} className="bg-slate-950 text-white">
                    {ratio}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
            </div>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs text-white/50">分辨率</span>
            <div className="relative">
              <select
                value={settings.imageResolution}
                onChange={(event) => {
                  void setImageResolution(event.target.value as typeof settings.imageResolution);
                }}
                className={selectClassName}
              >
                {IMAGE_RESOLUTIONS.map((resolution) => (
                  <option key={resolution} value={resolution} className="bg-slate-950 text-white">
                    {resolution}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
            </div>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs text-white/50">生成数量</span>
            <div className="relative">
              <select
                value={settings.imageCount}
                onChange={(event) => {
                  void setImageCount(Number(event.target.value) as typeof settings.imageCount);
                }}
                className={selectClassName}
              >
                {IMAGE_COUNTS.map((count) => (
                  <option key={count} value={count} className="bg-slate-950 text-white">
                    {count} 张
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
            </div>
          </label>
        </div>

        <textarea
          value={workspace.prompt}
          onChange={(event) => {
            void setWorkspace({
              ...workspace,
              prompt: event.target.value,
              lastUpdatedAt: new Date().toISOString()
            });
          }}
          placeholder="输入用于生图的最终提示词，或先在角色设定页生成后自动带入。"
          className="form-field image-prompt-input"
        />

        <div className="image-generate-actions">
          <button
            type="button"
            onClick={() => {
              void handleGenerate();
            }}
            disabled={!canGenerate || isGenerating}
            className="gradient-button image-generate-button"
          >
            {isGenerating ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {isGenerating ? "生成中..." : "生成图片"}
          </button>

          {isGenerating ? (
            <button
              type="button"
              onClick={() => {
                void handleCancel();
              }}
              className="ghost-button image-cancel-button border-rose-400/30 bg-rose-400/10 text-rose-300 hover:text-rose-200"
            >
              <X className="h-4 w-4" />
              取消生图
            </button>
          ) : null}

        </div>

        {imageConfigurationMessage ? (
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 px-4 py-4 text-sm leading-6 text-white/58">
            {imageConfigurationMessage}
          </div>
        ) : null}
      </section>

      <section className="image-results-panel">
        <div className="image-results-heading">
          <div>
            <div className="section-label">生成结果</div>
            <div className="section-hint">点击图片预览，支持单张或批量下载</div>
          </div>
          {generationResult?.ok ? <div className="image-asset-actions"><button type="button" disabled={isDownloadingAll} onClick={() => void handleDownload(generationResult.images.map((image) => image.url))}><Download className="h-4 w-4" />{isDownloadingAll ? "保存中" : "保存作品"}</button><button type="button" onClick={() => void saveCurrentPrompt()}><Save className="h-4 w-4" />保存 Prompt</button></div> : null}
        </div>

        {isGenerating ? (
          <div className="image-generation-status" role="status" aria-live="polite">
            {generationResult ? "正在生成，将在当前结果区域更新" : "正在生成图片"}
          </div>
        ) : null}

        {isGenerating && !generationResult ? (
          <div className="image-results-grid">
            {Array.from({ length: settings.imageCount }).map((_, index) => (
              <div
                key={`skeleton-${index + 1}`}
                className={`${getGalleryAspectClass(settings.imageAspectRatio)} animate-pulse rounded-[var(--radius-large)] border border-white/10 bg-white/[0.07]`}
              />
            ))}
          </div>
        ) : null}

        {generationResult && !generationResult.ok ? (
          <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-4 text-sm text-rose-200">
            <p>{generationResult.message}</p>
            <button type="button" className="ghost-button mt-3 px-3 py-2 text-xs" onClick={() => { void handleGenerate(); }}>
              重试生成
            </button>
            {generationResult.technicalDetails && generationResult.technicalDetails !== generationResult.message ? (
              <div className="mt-3 text-xs text-white/55">
                <button type="button" className="inline-flex items-center gap-1" aria-expanded={showTechnicalDetails} onClick={() => setShowTechnicalDetails((current) => !current)}>
                  查看技术详情 <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showTechnicalDetails ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence initial={false}>
                  {showTechnicalDetails ? (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: shouldReduceMotion ? 0 : MOTION.fastMs / 1000, ease: MOTION.easeOut }} className="overflow-hidden">
                      <pre className="mt-2 whitespace-pre-wrap break-words">{generationResult.technicalDetails}</pre>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            ) : null}
          </div>
        ) : null}

        {generationResult?.ok ? (
          <div className="image-results-grid">
            {generationResult.images.map((image) => (
              <article
                key={image.id}
                className="media-card"
              >
                <div className="group relative cursor-pointer">
                  <img
                    src={image.url}
                    alt="Generated prompt art"
                    loading="lazy"
                    decoding="async"
                    className={`${getGalleryAspectClass(settings.imageAspectRatio)} generated-image-reveal w-full object-cover transition duration-300 group-hover:scale-[1.015]`}
                    onClick={() => {
                      setPreviewImage(image);
                    }}
                  />
                  {workspace.source?.promptId ? (
                    <button
                      type="button"
                      className="image-prompt-source-badge"
                      onClick={(event) => { event.stopPropagation(); void openPromptAsset(workspace.source?.promptId); }}
                    >
                      来自 Prompt
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleDownload([image.url], image.id);
                    }}
                    disabled={downloadingId === image.id}
                    className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-xl border border-white/10 bg-black/55 px-3 py-2 text-xs text-white/85 shadow-[0_10px_26px_rgba(0,0,0,0.32)] backdrop-blur transition hover:border-accent/35 hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <Download className="h-3.5 w-3.5" />
                    {downloadingId === image.id ? "下载中" : "下载"}
                  </button>
                </div>
                {image.revisedPrompt ? (
                  <div className="border-t border-white/10 px-3 py-3 text-xs leading-5 text-white/45">
                    {image.revisedPrompt}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        ) : null}

        {!isGenerating && !generationResult ? (
          <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-black/10 px-4 py-8 text-sm leading-6 text-white/45">
            生成完成后在此展示图片网格
          </div>
        ) : null}
      </section>

      <PromptHistoryPanel
        entries={imageHistory}
        open={showHistory}
        onToggle={() => setShowHistory((current) => !current)}
        onClear={() => { void clearImageHistory().then(() => setImageHistory([])); }}
        onRestore={(entry) => { void restoreHistoryEntry(entry); }}
        onDownload={(entry) => { void handleDownload([entry.url], entry.id); }}
        onViewPrompt={(entry) => { void openPromptAsset(entry.promptId); }}
      />

      <PromptPreviewModal
        record={previewPromptRecord}
        isCopied={false}
        isFavorite={Boolean(previewPromptRecord?.isFavorite)}
        sourceLabel={previewPromptRecord?.id === "temporary-image-workspace-prompt" ? "临时 Prompt" : undefined}
        showLibraryActions={false}
        allowEditing={false}
        onClose={() => setPreviewPromptRecord(null)}
        onCopy={() => { if (previewPromptRecord) void navigator.clipboard.writeText(previewPromptRecord.content).then(() => showToast("提示词已复制")); }}
        onSave={() => undefined}
        onToggleFavorite={() => { void saveCurrentPrompt(); }}
      />

      {previewImage ? (
        <div
          className="fixed inset-0 z-[2147483648] flex items-center justify-center bg-black/85 backdrop-blur-md"
          onClick={() => {
            setPreviewImage(null);
          }}
        >
          <div
            className="relative max-h-[90vh] max-w-[90vw]"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <img
              src={previewImage.url}
              alt="Preview"
              className="max-h-[85vh] max-w-[85vw] rounded-[1.35rem] object-contain shadow-[0_28px_80px_rgba(0,0,0,0.55)]"
            />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  void copyImageToClipboard(previewImage.url);
                }}
                className="ghost-button border-white/20 bg-black/60 px-5 py-3 text-sm text-white/85 backdrop-blur hover:bg-black/80"
              >
                <Copy className="h-4 w-4" />
                复制
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleDownload([previewImage.url], previewImage.id);
                }}
                className="gradient-button px-5 py-3 text-sm"
              >
                <Download className="h-4 w-4" />
                下载
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                setPreviewImage(null);
              }}
              className="absolute right-4 top-4 rounded-full border border-white/20 bg-black/60 p-2 text-white/70 backdrop-blur transition hover:border-accent/35 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
