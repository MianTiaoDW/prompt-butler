import { useEffect, useState } from "react";
import {
  ChevronDown,
  Copy,
  Download,
  LoaderCircle,
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
import { sendRuntimeMessage, sendRuntimeMessageLong } from "../lib/runtime";
import type { ImageTaskState } from "../lib/task-broker";
import { clearImageTask, getImageTask, startImageTask } from "../lib/task-broker";
import { showToast } from "../lib/toast";
import type { GeneratedImageAsset, ImageGenerationResult, ImageHistoryEntry, ImageWorkspaceState } from "../types/image";
import type { ExtensionSettings } from "../types/settings";
import { IMAGE_ASPECT_RATIOS, IMAGE_COUNTS, IMAGE_RESOLUTIONS } from "../types/settings";

const selectClassName = [
  "appearance-none w-full rounded-2xl border border-white/10 bg-black/25 pl-4 pr-10 py-3",
  "text-sm text-white outline-none transition cursor-pointer",
  "focus:border-accent/40 hover:border-white/20"
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

export function ImageStudio(props: {
  settings: ExtensionSettings;
  isServiceReady: boolean;
}) {
  const { settings, isServiceReady } = props;
  const { setImageResolution, setImageCount, setImageAspectRatio } = useExtensionSettings();
  const workspaceStorage = useChromeStorage<ImageWorkspaceState>(
    IMAGE_STORAGE_KEYS.workspace,
    defaultImageWorkspaceState
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [panelMessage, setPanelMessage] = useState("编辑提示词或从角色设定页自动带入");
  const [generationResult, setGenerationResult] = useState<ImageGenerationResult | null>(null);
  const [previewImage, setPreviewImage] = useState<GeneratedImageAsset | null>(null);
  const [imageHistory, setImageHistory] = useState<ImageHistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    void getImageHistory().then(setImageHistory);
  }, []);

  const { value: workspace, setValue: setWorkspace } = workspaceStorage;

  const canGenerate = Boolean(
    isServiceReady && settings.imageModel.trim() && workspace.prompt.trim()
  );

  useEffect(() => {
    void getImageTask().then((task) => {
      if (task.status === "running") {
        setIsGenerating(true);
        setPanelMessage("正在调用生图模型生成图片...");
      } else if (task.status === "done" && task.result) {
        setGenerationResult(task.result);
        setIsGenerating(false);
        setPanelMessage(
          task.result.ok
            ? `已生成 ${task.result.images.length} 张图片，当前使用模型：${task.result.model}`
            : `生图失败：${task.result.message}`
        );
        void clearImageTask();
      }
    });
  }, []);

  const handleGenerate = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setPanelMessage("正在调用生图模型生成图片...");
    setGenerationResult(null);
    await startImageTask();

    try {
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
          if (task.status === "done" && task.result) {
            void clearImageTask();
            return task.result;
          }
          return null;
        }
      );

      setGenerationResult(result);
      await clearImageTask();

      if (result.ok) {
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
          revisedPrompt: image.revisedPrompt
        }));
        const updatedHistory = await addImageHistoryEntries(historyEntries);
        setImageHistory(updatedHistory);
        setPanelMessage(
          `已生成 ${result.images.length} 张图片，当前使用模型：${result.model}`
        );
      } else {
        setPanelMessage(`生图失败：${result.message}`);
      }
    } catch (error) {
      await clearImageTask();
      setPanelMessage(
        error instanceof Error ? `生图失败：${error.message}` : "生图失败。"
      );
    } finally {
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
    setPanelMessage("已取消生图。");
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

  return (
    <div className="space-y-4">
      <section className="glass-panel rounded-3xl border border-white/5 p-4">
        <div>
          <div className="text-sm font-medium text-white/88">图像生成区</div>
          <div className="mt-1 text-xs text-white/45">
            可接收角色设定页自动带入的提示词
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
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
              prompt: event.target.value,
              lastUpdatedAt: new Date().toISOString()
            });
          }}
          placeholder="输入用于生图的最终提示词，或先在角色设定页生成后自动带入。"
          className="mt-4 min-h-[120px] w-full rounded-3xl border border-white/10 bg-black/25 px-4 py-4 text-sm leading-6 text-white outline-none transition placeholder:text-white/25"
        />

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              void handleGenerate();
            }}
            disabled={!canGenerate || isGenerating}
            className="inline-flex items-center gap-2 rounded-2xl border border-accent/35 bg-accent/12 px-4 py-3 text-sm text-accent transition hover:bg-accent/18 disabled:cursor-not-allowed disabled:opacity-45"
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
              className="inline-flex items-center gap-2 rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-300 transition hover:bg-rose-400/20"
            >
              <X className="h-4 w-4" />
              取消生图
            </button>
          ) : null}

          {generationResult?.ok ? (
            <button
              type="button"
              onClick={() => {
                void handleDownload(
                  generationResult.images.map((image) => image.url)
                );
              }}
              disabled={isDownloadingAll}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/72 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Download className="h-4 w-4" />
              {isDownloadingAll ? "下载中..." : "一键下载所有图片"}
            </button>
          ) : null}
        </div>

        <div className="mt-4 rounded-3xl border border-white/10 bg-black/20 px-4 py-4 text-sm leading-6 text-white/58">
          {isServiceReady
            ? panelMessage
            : "请先在配置中心完成连接配置"}
        </div>
      </section>

      <section className="glass-panel rounded-3xl border border-white/5 p-4">
        <div className="text-sm font-medium text-white/88">生成结果</div>
        <div className="mt-1 text-xs text-white/45">
          点击图片预览，支持单张或批量下载
        </div>

        {isGenerating ? (
          <div className="mt-4 grid grid-cols-2 gap-3">
            {Array.from({ length: Math.max(2, settings.imageCount) }).map((_, index) => (
              <div
                key={`skeleton-${index + 1}`}
                className="aspect-square animate-pulse rounded-3xl border border-white/10 bg-white/5"
              />
            ))}
          </div>
        ) : null}

        {generationResult && !generationResult.ok ? (
          <div className="mt-4 rounded-3xl border border-rose-400/20 bg-rose-400/10 px-4 py-4 text-sm text-rose-200">
            {generationResult.message}
          </div>
        ) : null}

        {generationResult?.ok ? (
          <div className="mt-4 grid grid-cols-2 gap-3">
            {generationResult.images.map((image) => (
              <article
                key={image.id}
                className="overflow-hidden rounded-3xl border border-white/10 bg-black/20"
              >
                <div className="group relative cursor-pointer">
                  <img
                    src={image.url}
                    alt="Generated prompt art"
                    className="aspect-square w-full object-cover"
                    onClick={() => {
                      setPreviewImage(image);
                    }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleDownload([image.url], image.id);
                    }}
                    disabled={downloadingId === image.id}
                    className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-xl border border-white/10 bg-black/55 px-3 py-2 text-xs text-white/80 backdrop-blur transition hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
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
          <div className="mt-4 rounded-3xl border border-dashed border-white/10 px-4 py-8 text-sm leading-6 text-white/45">
            生成完成后在此展示图片网格
          </div>
        ) : null}
      </section>

      <section className="glass-panel rounded-3xl border border-white/5 p-4">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              setShowHistory((v) => !v);
            }}
            className="flex items-center gap-2 text-sm font-medium text-white/88 transition hover:text-white"
          >
            历史记录
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-white/45">
              {imageHistory.length}
            </span>
            <ChevronDown
              className={[
                "h-4 w-4 text-white/40 transition-transform",
                showHistory ? "rotate-180" : ""
              ].join(" ")}
            />
          </button>
          {imageHistory.length > 0 ? (
            <button
              type="button"
              onClick={async () => {
                await clearImageHistory();
                setImageHistory([]);
              }}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/50 transition hover:text-rose-300"
            >
              清空记录
            </button>
          ) : null}
        </div>

        {showHistory ? (
          imageHistory.length === 0 ? (
            <div className="mt-3 rounded-2xl border border-dashed border-white/10 px-4 py-6 text-xs leading-5 text-white/40">
              暂无历史记录，生成图片后会自动保存在这里。
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              {imageHistory.slice(0, 20).map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-2"
                >
                  <img
                    src={entry.url}
                    alt=""
                    className="h-12 w-12 shrink-0 rounded-xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs text-white/70">
                      {entry.prompt.slice(0, 40)}{entry.prompt.length > 40 ? "..." : ""}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[10px] text-white/35">
                      <span>{entry.aspectRatio}</span>
                      <span>·</span>
                      <span>{entry.resolution}</span>
                      <span>·</span>
                      <span>{new Date(entry.generatedAt).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      void handleDownload([entry.url], entry.id);
                    }}
                    className="shrink-0 rounded-xl border border-white/10 bg-white/5 p-2 text-white/50 transition hover:text-white"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {imageHistory.length > 20 ? (
                <div className="text-center text-xs text-white/35">
                  仅展示最近 20 条，共 {imageHistory.length} 条记录
                </div>
              ) : null}
            </div>
          )
        ) : null}
      </section>

      {previewImage ? (
        <div
          className="fixed inset-0 z-[2147483648] flex items-center justify-center bg-black/85 backdrop-blur-sm"
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
              className="max-h-[85vh] max-w-[85vw] rounded-3xl object-contain"
            />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  void copyImageToClipboard(previewImage.url);
                }}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-black/60 px-5 py-3 text-sm text-white/85 backdrop-blur transition hover:bg-black/80 hover:text-white"
              >
                <Copy className="h-4 w-4" />
                复制
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleDownload([previewImage.url], previewImage.id);
                }}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-black/60 px-5 py-3 text-sm text-white/85 backdrop-blur transition hover:bg-black/80 hover:text-white"
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
              className="absolute right-4 top-4 rounded-full border border-white/20 bg-black/60 p-2 text-white/70 backdrop-blur transition hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
