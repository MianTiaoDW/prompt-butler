import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, ChevronDown, Cpu, DatabaseZap, ShieldCheck, SlidersHorizontal } from "lucide-react";

import {
  applyDetectedModelCatalog,
  buildSettingsFromProvider,
  getEffectiveModelCatalog,
  getProviderPreset,
  hasConnectionCredentials,
  isSettingsConfigured,
  providerOptions
} from "../lib/provider-presets";
import { sendRuntimeMessage } from "../lib/runtime";
import { useExtensionSettings } from "../hooks/useExtensionSettings";
import { IMAGE_ASPECT_RATIOS, IMAGE_COUNTS, IMAGE_RESOLUTIONS } from "../types/settings";
import type { ExtensionSettings } from "../types/settings";
import type { ConnectionTestResult, ModelDetectionResult } from "../types/runtime";

const cards = [
  {
    title: "服务商配置",
    description: "服务商切换会自动带出 Base URL、模型预设和状态复位逻辑。"
  },
  {
    title: "模型参数",
    description: "推理模型、视觉模型、生图模型、分辨率与数量都已接入统一配置状态。"
  },
  {
    title: "状态联动",
    description: "Options 页与 Content Script 会通过 chrome.storage.local 实时共享配置。"
  }
];

const icons = [ShieldCheck, Cpu, SlidersHorizontal] as const;

function formatSavedTime(timestamp: string | null) {
  if (!timestamp) {
    return "尚未写入";
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "尚未写入";
  }

  return `${date.toLocaleDateString("zh-CN")} ${date.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit"
  })}`;
}

export function OptionsApp() {
  const {
    settings,
    providerPreset,
    isLoading,
    error,
    isServiceReady,
    lastSyncedAt,
    updateSettings,
    setConnectionStatus
  } = useExtensionSettings();
  const [draftSettings, setDraftSettings] = useState<ExtensionSettings>(settings);
  const [panelMessage, setPanelMessage] = useState("请先完成服务商、API Key、Base URL 和模型配置，再保存并测试连接。");
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isDetectingModels, setIsDetectingModels] = useState(false);
  const draftProviderPreset = getProviderPreset(draftSettings.provider);
  const effectiveDraftCatalog = getEffectiveModelCatalog(draftSettings);

  useEffect(() => {
    setDraftSettings(settings);
  }, [settings]);

  const isDraftConfigured = isSettingsConfigured(draftSettings);
  const hasDraftConnectionCredentials = hasConnectionCredentials(draftSettings);
  const isDirty = JSON.stringify(draftSettings) !== JSON.stringify(settings);

  const statusText = isLoading
    ? "正在同步本地配置"
    : isTestingConnection || settings.connectionStatus === "testing"
      ? "正在测试连接"
    : isServiceReady
      ? "服务已就绪"
      : isDraftConfigured
        ? "等待连通测试"
        : "配置未就绪";

  const handleSave = async () => {
    await updateSettings({
      ...draftSettings,
      connectionStatus: "idle",
      lastValidatedAt: null
    });
    setPanelMessage("配置已保存到 chrome.storage.local，悬浮窗会立即收到更新。");
  };

  const handleReset = () => {
    setDraftSettings(settings);
    setPanelMessage("表单已恢复为最近一次保存的配置。");
  };

  const handleProviderChange = (provider: ExtensionSettings["provider"]) => {
    const nextDraftSettings = buildSettingsFromProvider(provider, draftSettings);
    setDraftSettings(nextDraftSettings);
    setPanelMessage("已切换服务商预设。");

    if (hasConnectionCredentials(nextDraftSettings)) {
      void handleDetectModels(nextDraftSettings);
    }
  };

  const handleDetectModels = async (settingsToDetect: ExtensionSettings = draftSettings) => {
    setIsDetectingModels(true);
    setPanelMessage("正在自动识别当前 API / Base URL 可用的模型列表...");

    try {
      const result = await sendRuntimeMessage<ModelDetectionResult>({
        type: "provider:detect-models",
        payload: {
          settings: settingsToDetect
        }
      });

      if (!result.ok || !result.catalog) {
        setPanelMessage(`模型识别失败：${result.message}`);
        return;
      }

      const nextDraftSettings = applyDetectedModelCatalog(settingsToDetect, result.catalog);
      setDraftSettings(nextDraftSettings);
      setPanelMessage(`${result.message} 已同步回当前表单。`);
    } catch (error) {
      setPanelMessage(
        error instanceof Error ? `模型识别失败：${error.message}` : "模型识别失败。"
      );
    } finally {
      setIsDetectingModels(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setPanelMessage("正在通过 Background Service Worker 发起连接测试...");

    const testingSettings: ExtensionSettings = {
      ...draftSettings,
      connectionStatus: "testing",
      lastValidatedAt: null
    };

    await updateSettings(testingSettings);

    try {
      const result = await sendRuntimeMessage<ConnectionTestResult>({
        type: "provider:test-connection",
        payload: {
          settings: testingSettings
        }
      });

      const nextSettings: ExtensionSettings = {
        ...testingSettings,
        connectionStatus: result.ok ? "success" : "error",
        lastValidatedAt: result.ok ? result.checkedAt : null
      };

      await updateSettings(nextSettings);
      setDraftSettings(nextSettings);
      setPanelMessage(
        result.ok
          ? `连接测试通过，已验证端点：${result.checkedUrl}`
          : `连接测试失败（${result.status || "网络错误"}）：${result.message}`
      );
    } catch (error) {
      await updateSettings({
        ...testingSettings,
        connectionStatus: "error",
        lastValidatedAt: null
      });
      setPanelMessage(
        error instanceof Error ? `连接测试失败：${error.message}` : "连接测试失败。"
      );
    } finally {
      setIsTestingConnection(false);
    }
  };

  return (
    <main className="min-h-screen bg-accent-radial px-6 py-10 text-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto flex w-full max-w-6xl flex-col gap-6"
      >
        <section className="glass-panel accent-ring rounded-[2rem] px-8 py-10">
          <div className="max-w-3xl">
            <div className="text-5xl font-extrabold uppercase tracking-[0.08em] text-accent/80">
              CYGJ模型配置中心
            </div>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/65">
              这里进行模型配置，输入模型服务商的API Key,然后依次输入/选择要配置的推理模型，视觉模型，生图模型
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-sm">
              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-white/70">
                状态：{statusText}
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-white/70">
                最近同步：{formatSavedTime(lastSyncedAt)}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {cards.map((card, index) => {
            const Icon = icons[index];

            return (
              <article
                key={card.title}
                className="glass-panel rounded-[1.75rem] p-6"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/14 text-accent">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-5 text-xl font-medium text-white">{card.title}</h2>
                <p className="mt-3 text-sm leading-6 text-white/60">{card.description}</p>
              </article>
            );
          })}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
          <article className="glass-panel rounded-[2rem] p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.26em] text-white/40">
                  Storage Workbench
                </div>
                <h2 className="mt-2 text-2xl font-semibold text-white">服务商与模型预设</h2>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-right text-xs text-white/55">
                <div>Provider</div>
                <div className="mt-1 text-sm text-accent">{draftProviderPreset.label}</div>
              </div>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm text-white/70">服务商</span>
                <div className="relative">
                  <select
                    value={draftSettings.provider}
                    onChange={(event) => {
                      handleProviderChange(event.target.value as ExtensionSettings["provider"]);
                    }}
                    className="w-full appearance-none rounded-2xl border border-white/10 bg-black/25 py-3 pl-4 pr-10 text-sm text-white outline-none transition focus:border-accent/40 cursor-pointer"
                  >
                    {providerOptions.map((option) => (
                      <option key={option.id} value={option.id} className="bg-slate-950 text-white">
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm text-white/70">API Key</span>
                <input
                  type="password"
                  value={draftSettings.apiKey}
                  onChange={(event) => {
                    setDraftSettings((current) => ({
                      ...current,
                      apiKey: event.target.value
                    }));
                  }}
                  placeholder="输入当前服务商的 API Key"
                  className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-accent/40"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm text-white/70">Base URL</span>
                <input
                  type="text"
                  value={draftSettings.baseUrl}
                  onChange={(event) => {
                    setDraftSettings((current) => ({
                      ...current,
                      baseUrl: event.target.value
                    }));
                  }}
                  placeholder="输入或覆盖默认 Base URL"
                  className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-accent/40"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm text-white/70">推理模型</span>
                <div className="relative">
                  <select
                    value={draftSettings.reasoningModel}
                    onChange={(event) => {
                      setDraftSettings((current) => ({
                        ...current,
                        reasoningModel: event.target.value
                      }));
                    }}
                    className="w-full appearance-none rounded-2xl border border-white/10 bg-black/25 py-3 pl-4 pr-10 text-sm text-white outline-none transition focus:border-accent/40 cursor-pointer"
                  >
                    <option value="" className="bg-slate-950 text-white">
                      请选择推理模型
                    </option>
                    {!effectiveDraftCatalog.reasoning.includes(draftSettings.reasoningModel) &&
                    draftSettings.reasoningModel ? (
                      <option value={draftSettings.reasoningModel} className="bg-slate-950 text-white">
                        {draftSettings.reasoningModel}（当前）
                      </option>
                    ) : null}
                    {effectiveDraftCatalog.reasoning.map((model) => (
                      <option key={model} value={model} className="bg-slate-950 text-white">
                        {model}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                </div>
                <input
                  type="text"
                  value={draftSettings.reasoningModel}
                  onChange={(event) => {
                    setDraftSettings((current) => ({
                      ...current,
                      reasoningModel: event.target.value
                    }));
                  }}
                  placeholder="也可手动输入推理模型 ID"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/15 px-4 py-2.5 text-xs text-white outline-none transition placeholder:text-white/25 focus:border-accent/40"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm text-white/70">视觉模型</span>
                <div className="relative">
                  <select
                    value={draftSettings.visionModel}
                    onChange={(event) => {
                      setDraftSettings((current) => ({
                        ...current,
                        visionModel: event.target.value
                      }));
                    }}
                    className="w-full appearance-none rounded-2xl border border-white/10 bg-black/25 py-3 pl-4 pr-10 text-sm text-white outline-none transition focus:border-accent/40 cursor-pointer"
                  >
                    <option value="" className="bg-slate-950 text-white">
                      请选择视觉模型
                    </option>
                    {!effectiveDraftCatalog.vision.includes(draftSettings.visionModel) &&
                    draftSettings.visionModel ? (
                      <option value={draftSettings.visionModel} className="bg-slate-950 text-white">
                        {draftSettings.visionModel}（当前）
                      </option>
                    ) : null}
                    {effectiveDraftCatalog.vision.map((model) => (
                      <option key={model} value={model} className="bg-slate-950 text-white">
                        {model}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                </div>
                <input
                  type="text"
                  value={draftSettings.visionModel}
                  onChange={(event) => {
                    setDraftSettings((current) => ({
                      ...current,
                      visionModel: event.target.value
                    }));
                  }}
                  placeholder="也可手动输入视觉模型 ID"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/15 px-4 py-2.5 text-xs text-white outline-none transition placeholder:text-white/25 focus:border-accent/40"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm text-white/70">生图模型</span>
                <div className="relative">
                  <select
                    value={draftSettings.imageModel}
                    onChange={(event) => {
                      setDraftSettings((current) => ({
                        ...current,
                        imageModel: event.target.value
                      }));
                    }}
                    className="w-full appearance-none rounded-2xl border border-white/10 bg-black/25 py-3 pl-4 pr-10 text-sm text-white outline-none transition focus:border-accent/40 cursor-pointer"
                  >
                    <option value="" className="bg-slate-950 text-white">
                      请选择生图模型
                    </option>
                    {!effectiveDraftCatalog.image.includes(draftSettings.imageModel) &&
                    draftSettings.imageModel ? (
                      <option value={draftSettings.imageModel} className="bg-slate-950 text-white">
                        {draftSettings.imageModel}（当前）
                      </option>
                    ) : null}
                    {effectiveDraftCatalog.image.map((model) => (
                      <option key={model} value={model} className="bg-slate-950 text-white">
                        {model}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                </div>
                <input
                  type="text"
                  value={draftSettings.imageModel}
                  onChange={(event) => {
                    setDraftSettings((current) => ({
                      ...current,
                      imageModel: event.target.value
                    }));
                  }}
                  placeholder="也可手动输入生图模型 ID"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/15 px-4 py-2.5 text-xs text-white outline-none transition placeholder:text-white/25 focus:border-accent/40"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm text-white/70">图像比例</span>
                <div className="relative">
                  <select
                    value={draftSettings.imageAspectRatio}
                    onChange={(event) => {
                      setDraftSettings((current) => ({
                        ...current,
                        imageAspectRatio: event.target.value as ExtensionSettings["imageAspectRatio"]
                      }));
                    }}
                    className="w-full appearance-none rounded-2xl border border-white/10 bg-black/25 py-3 pl-4 pr-10 text-sm text-white outline-none transition focus:border-accent/40 cursor-pointer"
                  >
                    {IMAGE_ASPECT_RATIOS.map((ratio) => (
                      <option key={ratio} value={ratio} className="bg-slate-950 text-white">
                        {ratio}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm text-white/70">分辨率</span>
                <div className="relative">
                  <select
                    value={draftSettings.imageResolution}
                    onChange={(event) => {
                      setDraftSettings((current) => ({
                        ...current,
                        imageResolution: event.target.value as ExtensionSettings["imageResolution"]
                      }));
                    }}
                    className="w-full appearance-none rounded-2xl border border-white/10 bg-black/25 py-3 pl-4 pr-10 text-sm text-white outline-none transition focus:border-accent/40 cursor-pointer"
                  >
                    {IMAGE_RESOLUTIONS.map((resolution) => (
                      <option key={resolution} value={resolution} className="bg-slate-950 text-white">
                        {resolution}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm text-white/70">生成数量</span>
                <div className="relative">
                  <select
                    value={draftSettings.imageCount}
                    onChange={(event) => {
                      setDraftSettings((current) => ({
                        ...current,
                        imageCount: Number(event.target.value) as ExtensionSettings["imageCount"]
                      }));
                    }}
                    className="w-full appearance-none rounded-2xl border border-white/10 bg-black/25 py-3 pl-4 pr-10 text-sm text-white outline-none transition focus:border-accent/40 cursor-pointer"
                  >
                    {IMAGE_COUNTS.map((count) => (
                      <option key={count} value={count} className="bg-slate-950 text-white">
                        {count} 张
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                </div>
              </label>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  void handleSave();
                }}
                className="rounded-2xl border border-accent/35 bg-accent/12 px-4 py-3 text-sm text-accent transition hover:bg-accent/18 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!isDirty}
              >
                保存配置
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70 transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!isDirty}
              >
                恢复已保存
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleTestConnection();
                }}
                className="rounded-2xl border border-accent/35 bg-accent/12 px-4 py-3 text-sm text-accent transition hover:bg-accent/18 disabled:cursor-not-allowed disabled:opacity-45"
                disabled={isTestingConnection || !hasDraftConnectionCredentials}
              >
                {isTestingConnection ? "测试中..." : "测试连接"}
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleDetectModels();
                }}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70 transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
                disabled={isDetectingModels || !hasDraftConnectionCredentials}
              >
                {isDetectingModels ? "识别中..." : "自动识别模型"}
              </button>
              <button
                type="button"
                onClick={() => {
                  void setConnectionStatus("error");
                  setPanelMessage("已将已保存配置标记为测试失败，悬浮窗状态会同步熄灭。");
                }}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70 transition hover:border-white/20 hover:text-white"
              >
                标记为测试失败
              </button>
            </div>

            <div className="mt-5 rounded-3xl border border-white/10 bg-black/20 px-4 py-4 text-sm leading-6 text-white/58">
              {panelMessage}
            </div>
            {draftProviderPreset.notes ? (
              <p className="mt-4 text-sm leading-6 text-white/50">{draftProviderPreset.notes}</p>
            ) : null}
            {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
          </article>

          <aside className="space-y-6">
            <article className="glass-panel rounded-[2rem] p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/14 text-accent">
                  <DatabaseZap className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white">状态快照</h3>
                  <p className="text-sm text-white/50">来自 chrome.storage.local 的实时数据</p>
                </div>
              </div>

              <div className="mt-5 space-y-3 text-sm text-white/65">
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                  当前服务商：<span className="text-white">{providerPreset.label}</span>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                  Base URL 已验证：
                  <span className={isServiceReady ? "text-accent" : "text-amber-300"}>
                    {isServiceReady ? " 是" : " 否"}
                  </span>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                  配置完整度：
                  <span className={isDraftConfigured ? "text-accent" : "text-white"}>
                    {isDraftConfigured ? " 已满足基础字段" : " 仍缺少必要字段"}
                  </span>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                  已识别模型：
                  <span className={draftSettings.lastModelDetectionAt ? "text-accent" : "text-white"}>
                    {draftSettings.lastModelDetectionAt
                      ? ` 推理 ${effectiveDraftCatalog.reasoning.length} / 视觉 ${effectiveDraftCatalog.vision.length} / 生图 ${effectiveDraftCatalog.image.length}`
                      : " 尚未识别"}
                  </span>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                  最近验证：
                  <span className={settings.lastValidatedAt ? "text-accent" : "text-white"}>
                    {settings.lastValidatedAt
                      ? ` ${new Date(settings.lastValidatedAt).toLocaleString("zh-CN")}`
                      : " 尚未验证"}
                  </span>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                  草稿变更：
                  <span className={isDirty ? "text-amber-300" : "text-accent"}>
                    {isDirty ? " 尚未保存" : " 已与本地存储同步"}
                  </span>
                </div>
              </div>
            </article>

            <article className="glass-panel rounded-[2rem] p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/14 text-accent">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white">配置说明</h3>
                  <p className="text-sm text-white/50">按你的业务流程进行模型与连接配置</p>
                </div>
              </div>

              <div className="mt-5 space-y-3 text-sm leading-6 text-white/60">
                <p>切换服务商后会自动带出预设模型，并在有 API Key 和 Base URL 时自动识别可用模型列表。</p>
                <p>推理、视觉、生图模型分栏展示，既可下拉选择，也可手动填写模型 ID。</p>
                <div className="mt-4 space-y-2 text-white/55">
                  <p>1. 选择服务商 → 填入 API Key 和 Base URL → 点击「测试连接」验证连通性。</p>
                  <p>2. 点击「自动识别模型」拉取当前端点支持的模型列表，自动填入下拉选项。</p>
                  <p>3. 分别选定推理模型、视觉模型、生图模型（无生图模型可留空）。</p>
                  <p>4. 设置图像比例、分辨率和生成数量，点击「保存配置」同步到悬浮窗。</p>
                  <p>5. 打开任意网页，悬浮窗中即可使用角色设定扩写、提示词优化与图像生成。</p>
                </div>
              </div>
            </article>
          </aside>
        </section>
      </motion.div>
    </main>
  );
}
