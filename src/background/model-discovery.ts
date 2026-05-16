import { getProviderPreset } from "../lib/provider-presets";
import type { ExtensionSettings, ModelCatalog } from "../types/settings";
import type { ModelDetectionResult } from "../types/runtime";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function buildUrl(baseUrl: string, path: string) {
  const normalizedBaseUrl = trimTrailingSlash(baseUrl.trim());
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${normalizedBaseUrl}${normalizedPath}`;
}

function dedupe(values: string[]) {
  return values
    .map((value) => value.trim())
    .filter(Boolean)
    .filter((value, index, array) => array.indexOf(value) === index);
}

function sortCatalog(catalog: ModelCatalog): ModelCatalog {
  return {
    reasoning: dedupe(catalog.reasoning),
    vision: dedupe(catalog.vision),
    image: dedupe(catalog.image)
  };
}

function detectCategoriesFromId(id: string) {
  const normalized = id.toLowerCase();
  const imageKeywords = ["image", "imagen", "seedream", "wanx", "flux", "sd", "sdxl", "dall-e", "recraft", "paint"];
  const visionKeywords = ["vision", "vl", "omni", "gpt-4o", "gpt-4.1", "qvq", "gemini", "minicpm-v", "hunyuan-vision", "see"];
  const reasoningKeywords = ["reason", "thinking", "r1", "o1", "o3", "o4", "gpt", "claude", "gemini", "qwen", "deepseek", "doubao", "kimi", "hunyuan", "minimax", "chat"];

  const isImage = imageKeywords.some((keyword) => normalized.includes(keyword));
  const isVision = visionKeywords.some((keyword) => normalized.includes(keyword)) || isImage;
  const isReasoning = reasoningKeywords.some((keyword) => normalized.includes(keyword)) || !isImage;

  return { isReasoning, isVision, isImage };
}

function buildCatalogFromIds(ids: string[]) {
  const catalog: ModelCatalog = {
    reasoning: [],
    vision: [],
    image: []
  };

  ids.forEach((id) => {
    const categories = detectCategoriesFromId(id);

    if (categories.isReasoning) {
      catalog.reasoning.push(id);
    }

    if (categories.isVision) {
      catalog.vision.push(id);
    }

    if (categories.isImage) {
      catalog.image.push(id);
    }
  });

  return sortCatalog(catalog);
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
      return `接口返回了网页页面（HTTP ${response.status}），此中转站可能不支持 /models 端点自动识别。请取消自动识别，在下方手动填写模型 ID 后即可正常使用。`;
    }
    const preview = text.slice(0, 300).trim();
    if (preview) {
      return `接口返回了非 JSON 响应（HTTP ${response.status}）：${preview}${text.length > 300 ? "..." : ""}`;
    }
    return `接口返回了非 JSON 响应（HTTP ${response.status}），可能是 Base URL 指向了非 API 地址。`;
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
    return response.statusText || "模型识别失败。";
  }

  return response.statusText || "模型识别失败。";
}

function extractModelIds(data: unknown): string[] {
  if (!data || typeof data !== "object") {
    return [];
  }

  const record = data as Record<string, unknown>;

  // OpenAI 标准格式: { object: "list", data: [{ id: "model-name" }] }
  if (Array.isArray(record.data)) {
    const ids: string[] = [];
    for (const item of record.data) {
      if (item && typeof item === "object") {
        const itemRecord = item as Record<string, unknown>;
        const id = typeof itemRecord.id === "string" ? itemRecord.id : "";
        if (id) ids.push(id);
      }
    }
    if (ids.length > 0) return ids;
  }

  // 部分中转站格式: { models: [{ id: "model-name", name: "..." }] }
  if (Array.isArray(record.models)) {
    const ids: string[] = [];
    for (const item of record.models) {
      if (item && typeof item === "object") {
        const itemRecord = item as Record<string, unknown>;
        const id =
          typeof itemRecord.id === "string"
            ? itemRecord.id
            : typeof itemRecord.name === "string"
              ? itemRecord.name.replace(/^models\//, "")
              : "";
        if (id) ids.push(id);
      }
    }
    if (ids.length > 0) return ids;
  }

  // Gemini 格式: { models: [{ name: "models/gemini-2.0-flash" }] }
  // (handled separately, but also caught here for relay stations that proxy Gemini)

  // 有些中转站直接返回字符串数组: ["model-a", "model-b"]
  if (Array.isArray(data)) {
    const ids: string[] = [];
    for (const item of data) {
      if (typeof item === "string") {
        ids.push(item);
      } else if (item && typeof item === "object") {
        const itemRecord = item as Record<string, unknown>;
        const id = typeof itemRecord.id === "string" ? itemRecord.id : "";
        if (id) ids.push(id);
      }
    }
    if (ids.length > 0) return ids;
  }

  // 最后尝试：遍历顶层键，看有没有任何数组包含模型 ID
  for (const [, value] of Object.entries(record)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item && typeof item === "object") {
          const itemRecord = item as Record<string, unknown>;
          const id = typeof itemRecord.id === "string" ? itemRecord.id : "";
          if (id) return [];  // 发现数据但格式不明确，回退到通用解析
        }
      }
    }
  }

  return [];
}

async function detectOpenAiCompatibleModels(settings: ExtensionSettings) {
  const baseUrl = trimTrailingSlash(settings.baseUrl.trim());

  // 尝试多个可能的 /models 端点路径
  const pathsToTry = /\/v\d+(beta)?$/.test(baseUrl)
    ? ["/models"]
    : ["/v1/models", "/models"];

  let lastError: Error | null = null;

  for (const path of pathsToTry) {
    const endpoint = `${baseUrl}${path}`;

    try {
      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${settings.apiKey}`,
          Accept: "application/json"
        }
      });

      if (response.redirected && response.url !== endpoint) {
        lastError = new Error(
          `接口请求被重定向到 ${response.url}，可能 Base URL 不正确或缺少路径前缀（如 /v1）。`
        );
        continue;
      }

      if (!response.ok) {
        lastError = new Error(await parseErrorMessage(response));
        continue;
      }

      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        lastError = new Error(await parseErrorMessage(response));
        continue;
      }

      const data: unknown = await response.json();
      const ids = extractModelIds(data);

      if (ids.length === 0) {
        lastError = new Error(
          "接口可访问，但返回的模型列表格式与预期不符。您可以在配置中心手动填写模型 ID。"
        );
        continue;
      }

      return { checkedUrl: endpoint, catalog: buildCatalogFromIds(ids) };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("模型识别失败。");
    }
  }

  throw lastError ?? new Error("无法连接到模型列表接口，请检查 Base URL 是否正确。");
}

async function detectAnthropicModels(settings: ExtensionSettings) {
  const baseUrl = trimTrailingSlash(settings.baseUrl);
  const endpoint = baseUrl.endsWith("/v1")
    ? `${baseUrl}/models`
    : buildUrl(baseUrl, "/v1/models");
  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      "x-api-key": settings.apiKey,
      "anthropic-version": "2023-06-01",
      Accept: "application/json"
    }
  });

  if (response.redirected && response.url !== endpoint) {
    throw new Error(
      `接口请求被重定向到 ${response.url}，可能 Base URL 不正确。`
    );
  }

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error(await parseErrorMessage(response));
  }

  const data = (await response.json()) as {
    data?: Array<{ id?: string; display_name?: string }>;
  };
  const ids = (data.data ?? [])
    .map((item) => item.id ?? item.display_name ?? "")
    .filter(Boolean);

  return { checkedUrl: endpoint, catalog: buildCatalogFromIds(ids) };
}

async function detectGeminiModels(settings: ExtensionSettings) {
  const baseUrl = trimTrailingSlash(settings.baseUrl);
  const endpointRoot = baseUrl.endsWith("/v1beta") ? baseUrl : `${baseUrl}/v1beta`;
  const endpoint = `${endpointRoot}/models?key=${encodeURIComponent(settings.apiKey)}`;
  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      Accept: "application/json"
    }
  });

  if (response.redirected && response.url !== endpoint) {
    throw new Error(
      `接口请求被重定向到 ${response.url}，可能 Base URL 不正确。`
    );
  }

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error(await parseErrorMessage(response));
  }

  const data = (await response.json()) as {
    models?: Array<{ name?: string; displayName?: string }>;
  };
  const ids = (data.models ?? [])
    .map((item) => item.name?.replace(/^models\//, "") ?? item.displayName ?? "")
    .filter(Boolean);

  return { checkedUrl: endpoint, catalog: buildCatalogFromIds(ids) };
}

async function executeModelDetection(settings: ExtensionSettings) {
  const preset = getProviderPreset(settings.provider);

  if (preset.protocol === "anthropic") {
    return detectAnthropicModels(settings);
  }

  if (preset.protocol === "gemini") {
    return detectGeminiModels(settings);
  }

  return detectOpenAiCompatibleModels(settings);
}

function countCatalog(catalog: ModelCatalog) {
  return catalog.reasoning.length + catalog.vision.length + catalog.image.length;
}

export async function detectProviderModels(settings: ExtensionSettings): Promise<ModelDetectionResult> {
  const checkedAt = new Date().toISOString();

  if (!settings.apiKey.trim()) {
    return {
      ok: false,
      provider: settings.provider,
      checkedAt,
      checkedUrl: settings.baseUrl,
      catalog: null,
      message: "API Key 为空，无法自动识别模型。"
    };
  }

  if (!settings.baseUrl.trim()) {
    return {
      ok: false,
      provider: settings.provider,
      checkedAt,
      checkedUrl: settings.baseUrl,
      catalog: null,
      message: "Base URL 为空，无法自动识别模型。"
    };
  }

  try {
    const { checkedUrl, catalog } = await executeModelDetection(settings);

    if (countCatalog(catalog) === 0) {
      return {
        ok: false,
        provider: settings.provider,
        checkedAt,
        checkedUrl,
        catalog: null,
        message: "接口可访问，但没有识别到可用模型。"
      };
    }

    return {
      ok: true,
      provider: settings.provider,
      checkedAt,
      checkedUrl,
      catalog,
      message: `已识别 ${catalog.reasoning.length} 个推理模型、${catalog.vision.length} 个视觉模型、${catalog.image.length} 个生图模型。`
    };
  } catch (error) {
    return {
      ok: false,
      provider: settings.provider,
      checkedAt,
      checkedUrl: settings.baseUrl,
      catalog: null,
      message: error instanceof Error ? error.message : "模型识别失败。"
    };
  }
}
