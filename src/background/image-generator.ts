import type { GeneratedImageAsset, ImageGenerationInput, ImageGenerationResult } from "../types/image";
import type { ExtensionSettings } from "../types/settings";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function buildUrl(baseUrl: string, path: string) {
  const normalizedBaseUrl = trimTrailingSlash(baseUrl.trim());
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${normalizedBaseUrl}${normalizedPath}`;
}

function mapSize(aspectRatio: string, resolution: "2K" | "4K"): string {
  const [w, h] = aspectRatio.split(":").map(Number);
  if (!w || !h) return resolution === "4K" ? "4096x4096" : "2048x2048";

  const baseSize = resolution === "4K" ? 4096 : 2048;
  const longSide = Math.max(w, h);
  const scale = baseSize / longSide;
  const width = Math.max(512, Math.round(w * scale));
  const height = Math.max(512, Math.round(h * scale));

  return `${width}x${height}`;
}

function isHtmlBody(text: string) {
  const lower = text.trim().toLowerCase();
  return lower.startsWith("<!doctype") || lower.startsWith("<html") || lower.startsWith("<head") || lower.startsWith("<body");
}

async function parseErrorMessage(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    const text = await response.text().catch(() => "");
    if (isHtmlBody(text)) {
      return `接口返回了网页页面（HTTP ${response.status}），请检查 Base URL 和模型配置是否正确。`;
    }
    const preview = text.slice(0, 300).trim();
    if (preview) {
      return `接口返回了非 JSON 响应（HTTP ${response.status}）：${preview}${text.length > 300 ? "..." : ""}`;
    }
    return `接口返回了非 JSON 响应（HTTP ${response.status}），可能是 Base URL 指向了非 API 地址或端点路径不正确。`;
  }

  try {
    const data = (await response.json()) as Record<string, unknown>;
    const directMessage =
      typeof data.message === "string"
        ? data.message
        : typeof data.error === "string"
          ? data.error
          : null;

    if (directMessage) {
      return directMessage;
    }

    if (data.error && typeof data.error === "object" && data.error !== null) {
      const nestedMessage = (data.error as Record<string, unknown>).message;

      if (typeof nestedMessage === "string") {
        return nestedMessage;
      }
    }
  } catch {
    return response.statusText || "生图请求失败。";
  }

  return response.statusText || "生图请求失败。";
}

function normalizeImageAssets(
  responseData: Array<{
    url?: string;
    b64_json?: string;
    revised_prompt?: string;
  }>
) {
  const assets: GeneratedImageAsset[] = [];

  responseData.forEach((item, index) => {
    if (item.url) {
      assets.push({
        id: `image-${Date.now()}-${index}`,
        url: item.url,
        mimeType: "image/png",
        revisedPrompt: item.revised_prompt
      });
      return;
    }

    if (item.b64_json) {
      assets.push({
        id: `image-${Date.now()}-${index}`,
        url: `data:image/png;base64,${item.b64_json}`,
        mimeType: "image/png",
        revisedPrompt: item.revised_prompt
      });
    }
  });

  return assets;
}

function resolveImageEndpoint(baseUrl: string) {
  const trimmed = trimTrailingSlash(baseUrl.trim());
  if (/\/v\d+(beta)?$/.test(trimmed)) {
    return [`${trimmed}/images/generations`];
  }
  return [`${trimmed}/v1/images/generations`, `${trimmed}/images/generations`];
}

async function requestSingleImage(
  settings: ExtensionSettings,
  input: ImageGenerationInput,
  endpoint: string
): Promise<GeneratedImageAsset[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => { controller.abort(); }, 120000);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${settings.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: settings.imageModel,
        prompt: input.prompt,
        n: 1,
        size: mapSize(input.aspectRatio, input.resolution)
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response));
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      throw new Error(await parseErrorMessage(response));
    }

    const data = (await response.json()) as {
      data?: Array<{
        url?: string;
        b64_json?: string;
        revised_prompt?: string;
      }>;
    };

    const images = normalizeImageAssets(data.data ?? []);
    if (images.length === 0) {
      throw new Error("接口返回成功但未包含图片数据。");
    }

    return images;
  } catch (error) {
    const isAbort = (() => {
      if (error instanceof DOMException && error.name === "AbortError") return true;
      if (error instanceof Error && (error.name === "AbortError" || /abort/i.test(error.message ?? ""))) return true;
      try {
        const err = error as { name?: unknown; message?: unknown } | null | undefined;
        if (err?.name === "AbortError") return true;
        if (typeof err?.message === "string" && /abort/i.test(err.message)) return true;
      } catch {
        /* 跨 realm 对象属性访问也可能抛异常 */
      }
      return false;
    })();
    if (isAbort) {
      throw new Error("生图请求超时（120 秒），请检查网络或换一个更轻量的模型重试。");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function generateWithOpenAiCompatible(
  settings: ExtensionSettings,
  input: ImageGenerationInput
) {
  const endpoints = resolveImageEndpoint(settings.baseUrl);

  // 用第一张请求同时探测可用端点
  let workingEndpoint = "";
  let probeImages: GeneratedImageAsset[] = [];
  let lastError: Error | null = null;

  for (const endpoint of endpoints) {
    try {
      const images = await requestSingleImage(settings, input, endpoint);
      workingEndpoint = endpoint;
      probeImages = images;
      break;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("生图请求失败。");
    }
  }

  if (!workingEndpoint) {
    throw lastError ?? new Error("无法连接到生图接口，请检查 Base URL 和模型配置。");
  }

  // 1 张图直接用探测结果，避免重复请求
  if (input.count <= 1) {
    return { model: settings.imageModel, images: probeImages };
  }

  // 并行请求剩余数量，每张图独立请求确保可靠
  const remaining = input.count - 1;
  const results = await Promise.allSettled(
    Array.from({ length: remaining }, () =>
      requestSingleImage(settings, input, workingEndpoint)
    )
  );

  const allImages = [...probeImages];
  for (const result of results) {
    if (result.status === "fulfilled") {
      allImages.push(...result.value);
    }
  }

  if (allImages.length === 0) {
    throw new Error("所有并行生图请求均失败。");
  }

  return { model: settings.imageModel, images: allImages };
}

export async function generateImagesWithProvider(
  settings: ExtensionSettings,
  input: ImageGenerationInput
): Promise<ImageGenerationResult> {
  const generatedAt = new Date().toISOString();

  if (!settings.apiKey.trim()) {
    return {
      ok: false,
      provider: settings.provider,
      model: settings.imageModel,
      generatedAt,
      message: "API Key 为空，无法发起生图。"
    };
  }

  if (!settings.imageModel.trim()) {
    return {
      ok: false,
      provider: settings.provider,
      model: settings.imageModel,
      generatedAt,
      message: "当前服务商还没有配置可用的生图模型。"
    };
  }

  if (settings.provider === "claude" || settings.provider === "kimi" || settings.provider === "deepseek") {
    return {
      ok: false,
      provider: settings.provider,
      model: settings.imageModel,
      generatedAt,
      message: "当前服务商在这版插件里还未接入稳定的官方生图端点。"
    };
  }

  try {
    const { model, images } = await generateWithOpenAiCompatible(settings, input);

    if (images.length === 0) {
      return {
        ok: false,
        provider: settings.provider,
        model,
        generatedAt,
        message: "接口已返回，但没有拿到可展示的图片结果。"
      };
    }

    return {
      ok: true,
      provider: settings.provider,
      model,
      generatedAt,
      images
    };
  } catch (error) {
    return {
      ok: false,
      provider: settings.provider,
      model: settings.imageModel,
      generatedAt,
      message: error instanceof Error ? error.message : "生图失败。"
    };
  }
}

export async function downloadImages(urls: string[]) {
  const downloadResults: number[] = [];

  for (let index = 0; index < urls.length; index += 1) {
    const url = urls[index];
    const downloadId = await chrome.downloads.download({
      url,
      filename: `prompt-butler/generated-${Date.now()}-${index + 1}.png`,
      saveAs: false
    });

    if (typeof downloadId === "number") {
      downloadResults.push(downloadId);
    }
  }

  return downloadResults;
}
