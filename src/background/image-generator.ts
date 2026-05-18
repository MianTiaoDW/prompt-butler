import type { GeneratedImageAsset, ImageGenerationInput, ImageGenerationResult } from "../types/image";
import type { ExtensionSettings } from "../types/settings";

let currentGenerationAbort: AbortController | null = null;

export function cancelImageGeneration() {
  if (currentGenerationAbort) {
    currentGenerationAbort.abort();
    currentGenerationAbort = null;
  }
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function buildUrl(baseUrl: string, path: string) {
  const normalizedBaseUrl = trimTrailingSlash(baseUrl.trim());
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${normalizedBaseUrl}${normalizedPath}`;
}

// 智创聚合API（GPT-Image）仅支持以下尺寸
// gpt-image-2: 1024x1024, 1536x1024, 1024x1536
// gpt-image-2-pro: 额外支持 2048x2048, 2048x1152, 3840x2160, 2160x3840
const SIZE_LOOKUP: Record<string, { "2K": string; "4K": string }> = {
  "1:1":  { "2K": "1024x1024",  "4K": "2048x2048" },
  "4:3":  { "2K": "1536x1024",  "4K": "3840x2160" },
  "3:4":  { "2K": "1024x1536",  "4K": "2160x3840" },
  "16:9": { "2K": "1536x1024",  "4K": "3840x2160" },
  "9:16": { "2K": "1024x1536",  "4K": "2160x3840" },
  "3:1":  { "2K": "1536x1024",  "4K": "3840x2160" },
  "1:3":  { "2K": "1024x1536",  "4K": "2160x3840" },
  "8:1":  { "2K": "1536x1024",  "4K": "3840x2160" },
  "1:8":  { "2K": "1024x1536",  "4K": "2160x3840" },
  "21:1": { "2K": "1536x1024",  "4K": "3840x2160" },
  "1:21": { "2K": "1024x1536",  "4K": "2160x3840" },
};

function mapSize(aspectRatio: string, resolution: "2K" | "4K"): string {
  return SIZE_LOOKUP[aspectRatio]?.[resolution] ?? (resolution === "4K" ? "2048x2048" : "1024x1024");
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

function resolveImageEndpoints(baseUrl: string): string[] {
  const trimmed = trimTrailingSlash(baseUrl.trim());
  const paths: string[] = [];

  if (/\/v\d+(beta)?$/.test(trimmed)) {
    paths.push(`${trimmed}/images/generations`);
  } else if (/\/v\d+$/.test(trimmed)) {
    paths.push(`${trimmed}/images/generations`);
    paths.push(`${trimmed.replace(/\/v\d+$/, "")}/v1/images/generations`);
  } else {
    paths.push(`${trimmed}/v1/images/generations`);
    paths.push(`${trimmed}/images/generations`);
  }

  return [...new Set(paths)];
}

async function fetchWithRetry(
  url: string,
  options: RequestInit & { cancelSignal?: AbortSignal },
  maxRetries = 2
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    // 检查外部取消信号
    if (options.cancelSignal?.aborted) {
      throw new DOMException("已取消生图请求。", "AbortError");
    }

    try {
      const timeoutController = new AbortController();
      const timeoutId = setTimeout(() => timeoutController.abort(), 300000);

      // 合并外部取消信号和内部超时信号
      const onExternalAbort = () => timeoutController.abort();
      options.cancelSignal?.addEventListener("abort", onExternalAbort, { once: true });

      const mergedOptions: RequestInit = {
        ...options,
        signal: timeoutController.signal,
      };

      try {
        const response = await fetch(url, mergedOptions);
        return response;
      } finally {
        clearTimeout(timeoutId);
        options.cancelSignal?.removeEventListener("abort", onExternalAbort);
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const isAbort = lastError.message.includes("abort") || lastError.message.includes("AbortError")
        || (error instanceof DOMException && error.name === "AbortError");

      // 外部取消不重试
      if (isAbort) throw lastError;

      const isNetworkError =
        lastError.message.includes("Failed to fetch") ||
        lastError.message.includes("NetworkError") ||
        (lastError.name === "TypeError");

      if (isNetworkError && attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 4000);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw lastError;
    }
  }

  throw lastError ?? new Error("请求失败");
}

async function requestSingleImage(
  settings: ExtensionSettings,
  input: ImageGenerationInput,
  endpoint: string
): Promise<GeneratedImageAsset[]> {
  // 每次请求创建新的 AbortController（如果还没有外部取消的）
  if (!currentGenerationAbort || currentGenerationAbort.signal.aborted) {
    currentGenerationAbort = new AbortController();
  }

  try {
    const response = await fetchWithRetry(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${settings.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: settings.imageModel,
        prompt: input.prompt,
        n: 1,
        size: mapSize(input.aspectRatio, input.resolution),
        response_format: "url"
      }),
      cancelSignal: currentGenerationAbort.signal
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
    const message = error instanceof Error ? error.message : "生图失败。";
    const isAbort =
      message.includes("abort") ||
      message.includes("AbortError") ||
      (error instanceof DOMException && error.name === "AbortError");
    if (isAbort) {
      throw new Error("生图请求超时（300 秒），请检查网络或换一个更轻量的模型重试。");
    }
    throw error;
  }
}

async function generateWithOpenAiCompatible(
  settings: ExtensionSettings,
  input: ImageGenerationInput
) {
  const endpoints = resolveImageEndpoints(settings.baseUrl);

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

  if (input.count <= 1) {
    return { model: settings.imageModel, images: probeImages };
  }

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
    currentGenerationAbort = new AbortController();
    const { model, images } = await generateWithOpenAiCompatible(settings, input);
    currentGenerationAbort = null;

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
    currentGenerationAbort = null;
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
