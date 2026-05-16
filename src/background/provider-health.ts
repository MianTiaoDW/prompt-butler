import { getProviderPreset } from "../lib/provider-presets";
import type { ExtensionSettings } from "../types/settings";
import type { ConnectionTestResult } from "../types/runtime";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function buildUrl(baseUrl: string, path: string) {
  const normalizedBaseUrl = trimTrailingSlash(baseUrl.trim());
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${normalizedBaseUrl}${normalizedPath}`;
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
    return response.statusText || "请求失败";
  }

  return response.statusText || "请求失败";
}

async function testOpenAiCompatibleProvider(settings: ExtensionSettings) {
  const baseUrl = trimTrailingSlash(settings.baseUrl.trim());

  // 尝试多个可能的 /models 端点路径
  const pathsToTry = /\/v\d+(beta)?$/.test(baseUrl)
    ? ["/models"]
    : ["/v1/models", "/models"];

  let lastEndpoint = "";
  let lastResponse: Response | null = null;

  for (const path of pathsToTry) {
    const endpoint = `${baseUrl}${path}`;
    lastEndpoint = endpoint;

    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${settings.apiKey}`,
        Accept: "application/json"
      }
    });

    if (response.ok) {
      return { endpoint, response };
    }

    lastResponse = response;
  }

  return { endpoint: lastEndpoint, response: lastResponse! };
}

async function testAnthropicProvider(settings: ExtensionSettings) {
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

  return { endpoint, response };
}

async function testGeminiProvider(settings: ExtensionSettings) {
  const baseUrl = trimTrailingSlash(settings.baseUrl);
  const endpointRoot = baseUrl.endsWith("/v1beta") ? baseUrl : `${baseUrl}/v1beta`;
  const endpoint = `${endpointRoot}/models?key=${encodeURIComponent(settings.apiKey)}`;
  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      Accept: "application/json"
    }
  });

  return { endpoint, response };
}

async function executeProviderHealthCheck(settings: ExtensionSettings) {
  const preset = getProviderPreset(settings.provider);

  if (preset.protocol === "anthropic") {
    return testAnthropicProvider(settings);
  }

  if (preset.protocol === "gemini") {
    return testGeminiProvider(settings);
  }

  return testOpenAiCompatibleProvider(settings);
}

export async function testProviderConnection(
  settings: ExtensionSettings
): Promise<ConnectionTestResult> {
  const checkedAt = new Date().toISOString();

  if (!settings.apiKey.trim()) {
    return {
      ok: false,
      provider: settings.provider,
      checkedUrl: settings.baseUrl,
      checkedAt,
      status: 0,
      message: "API Key 为空，无法发起测试。"
    };
  }

  if (!settings.baseUrl.trim()) {
    return {
      ok: false,
      provider: settings.provider,
      checkedUrl: settings.baseUrl,
      checkedAt,
      status: 0,
      message: "Base URL 为空，无法发起测试。"
    };
  }

  try {
    const { endpoint, response } = await executeProviderHealthCheck(settings);

    if (response.redirected && response.url !== endpoint) {
      return {
        ok: false,
        provider: settings.provider,
        checkedUrl: endpoint,
        checkedAt,
        status: response.status,
        message: `请求被重定向到 ${response.url}，可能 Base URL 不正确或缺少路径前缀（如 /v1）。`
      };
    }

    if (!response.ok) {
      const errorMessage = await parseErrorMessage(response);

      return {
        ok: false,
        provider: settings.provider,
        checkedUrl: endpoint,
        checkedAt,
        status: response.status,
        message: errorMessage
      };
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      const errorMessage = await parseErrorMessage(response);
      return {
        ok: false,
        provider: settings.provider,
        checkedUrl: endpoint,
        checkedAt,
        status: response.status,
        message: errorMessage
      };
    }

    return {
      ok: true,
      provider: settings.provider,
      checkedUrl: endpoint,
      checkedAt,
      status: response.status,
      message: "连接测试通过。"
    };
  } catch (error) {
    return {
      ok: false,
      provider: settings.provider,
      checkedUrl: settings.baseUrl,
      checkedAt,
      status: 0,
      message: error instanceof Error ? error.message : "连接测试失败。"
    };
  }
}
