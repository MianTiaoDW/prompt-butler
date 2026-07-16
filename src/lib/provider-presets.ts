import type {
  ExtensionSettings,
  ModelCatalog,
  ProviderId,
  ProviderPreset
} from "../types/settings";

export const providerPresets: Record<ProviderId, ProviderPreset> = {
  claude: {
    id: "claude",
    label: "Claude",
    protocol: "anthropic",
    defaultBaseUrl: "https://api.anthropic.com",
    defaultModels: {
      reasoning: "claude-3-7-sonnet-latest",
      vision: "claude-3-7-sonnet-latest",
      image: ""
    },
    modelCatalog: {
      reasoning: ["claude-3-7-sonnet-latest", "claude-opus-4-20250514"],
      vision: ["claude-3-7-sonnet-latest", "claude-opus-4-20250514"],
      image: []
    },
    notes: "Anthropic 官方接口不提供原生文生图模型，可留空或接入第三方图像服务。",
    baseUrlVerified: true
  },
  gemini: {
    id: "gemini",
    label: "Gemini",
    protocol: "gemini",
    defaultBaseUrl: "https://generativelanguage.googleapis.com",
    defaultModels: {
      reasoning: "gemini-2.5-pro",
      vision: "gemini-2.5-flash",
      image: "imagen-4.0-generate-001"
    },
    modelCatalog: {
      reasoning: ["gemini-2.5-pro", "gemini-2.5-flash"],
      vision: ["gemini-2.5-flash", "gemini-2.5-pro"],
      image: ["imagen-4.0-generate-001"]
    },
    baseUrlVerified: true
  },
  chatgpt: {
    id: "chatgpt",
    label: "ChatGPT",
    protocol: "openai",
    defaultBaseUrl: "https://api.openai.com/v1",
    defaultModels: {
      reasoning: "gpt-4.1",
      vision: "gpt-4.1-mini",
      image: "gpt-image-1"
    },
    modelCatalog: {
      reasoning: ["gpt-4.1", "gpt-4.1-mini"],
      vision: ["gpt-4.1-mini", "gpt-4.1"],
      image: ["gpt-image-1"]
    },
    baseUrlVerified: true
  },
  openaiRelay: {
    id: "openaiRelay",
    label: "OpenAI兼容中转站",
    protocol: "openai",
    defaultBaseUrl: "",
    defaultModels: {
      reasoning: "",
      vision: "",
      image: ""
    },
    modelCatalog: {
      reasoning: [],
      vision: [],
      image: []
    },
    notes: "适用于大多数 OpenAI 兼容 API 中转站或自建网关。建议先填写 Base URL 和 API Key，再点击“自动识别模型”。",
    baseUrlVerified: false
  },
  volcengine: {
    id: "volcengine",
    label: "火山引擎",
    protocol: "openai",
    defaultBaseUrl: "https://ark.cn-beijing.volces.com/api/v3",
    defaultModels: {
      reasoning: "doubao-seed-1-6-thinking-250715",
      vision: "doubao-1-5-vision-pro-250328",
      image: "doubao-seedream-4-0-250828"
    },
    modelCatalog: {
      reasoning: ["doubao-seed-1-6-thinking-250715", "doubao-1-5-pro-32k-250115"],
      vision: ["doubao-1-5-vision-pro-250328", "doubao-1-5-thinking-vision-pro-250428"],
      image: ["doubao-seedream-4-0-250828", "doubao-seededit-3-0-i2i-250628"]
    },
    baseUrlVerified: true
  },
  kimi: {
    id: "kimi",
    label: "Kimi",
    protocol: "openai",
    defaultBaseUrl: "https://api.moonshot.cn/v1",
    defaultModels: {
      reasoning: "kimi-k2.5",
      vision: "kimi-k2.5",
      image: ""
    },
    modelCatalog: {
      reasoning: ["kimi-k2.5", "kimi-k2.6", "moonshot-v1-128k"],
      vision: ["kimi-k2.5", "moonshot-v1-32k-vision-preview", "moonshot-v1-128k-vision-preview"],
      image: []
    },
    notes: "Kimi 当前预设不含官方文生图模型，可为空或后接其他图像服务。",
    baseUrlVerified: true
  },
  deepseek: {
    id: "deepseek",
    label: "DeepSeek",
    protocol: "openai",
    defaultBaseUrl: "https://api.deepseek.com",
    defaultModels: {
      reasoning: "deepseek-reasoner",
      vision: "deepseek-chat",
      image: ""
    },
    modelCatalog: {
      reasoning: ["deepseek-reasoner", "deepseek-v4-pro"],
      vision: ["deepseek-chat", "deepseek-v4-flash"],
      image: []
    },
    notes: "DeepSeek 官方文档当前以对话与推理模型为主，图像模型保持手动填写。",
    baseUrlVerified: true
  },
  minimax: {
    id: "minimax",
    label: "Minimax",
    protocol: "openai",
    defaultBaseUrl: "https://api.minimaxi.com/v1",
    defaultModels: {
      reasoning: "MiniMax-M2.7",
      vision: "MiniMax-VL-01",
      image: "image-01"
    },
    modelCatalog: {
      reasoning: ["MiniMax-M2.7", "MiniMax-M2.5", "MiniMax-M2.1"],
      vision: ["MiniMax-VL-01"],
      image: ["image-01"]
    },
    notes: "MiniMax Anthropic 兼容地址已验证，OpenAI 兼容主地址按现有平台习惯推断，可按需覆盖。",
    baseUrlVerified: false
  },
  dashscope: {
    id: "dashscope",
    label: "阿里云百炼",
    protocol: "openai",
    defaultBaseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    defaultModels: {
      reasoning: "qwen-plus",
      vision: "qwen-vl-max",
      image: "wanx2.1-t2i-plus"
    },
    modelCatalog: {
      reasoning: ["qwen-plus", "qwen-max", "qwen-turbo"],
      vision: ["qwen-vl-max", "qwen-vl-plus", "qvq-max"],
      image: ["wanx2.1-t2i-plus", "wanx2.1-imageedit"]
    },
    baseUrlVerified: true
  },
  xiaomi: {
    id: "xiaomi",
    label: "小米",
    protocol: "openai",
    defaultBaseUrl: "",
    defaultModels: {
      reasoning: "mimo-latest",
      vision: "mimo-vision-latest",
      image: "mimo-image-latest"
    },
    modelCatalog: {
      reasoning: ["mimo-latest"],
      vision: ["mimo-vision-latest"],
      image: ["mimo-image-latest"]
    },
    notes: "小米大模型开放接口文档公开信息不足，默认保留手动填写 Base URL。",
    baseUrlVerified: false
  },
  tencent: {
    id: "tencent",
    label: "腾讯云",
    protocol: "openai",
    defaultBaseUrl: "https://api.lkeap.cloud.tencent.com/v3",
    defaultModels: {
      reasoning: "hunyuan-2.0-thinking-20251109",
      vision: "hunyuan-vision",
      image: "HY-Image-V3.0"
    },
    modelCatalog: {
      reasoning: ["hunyuan-2.0-thinking-20251109", "deepseek-v3.2", "kimi-k2.5"],
      vision: ["hunyuan-vision"],
      image: ["HY-Image-V3.0", "HY-Image-Lite"]
    },
    baseUrlVerified: true
  }
};

export const providerOptions = Object.values(providerPresets).map(({ id, label }) => ({
  id,
  label
}));

export const defaultExtensionSettings: ExtensionSettings = {
  provider: "chatgpt",
  apiKey: "",
  imageApiKey: "",
  baseUrl: providerPresets.chatgpt.defaultBaseUrl,
  imageBaseUrl: "",
  reasoningModel: providerPresets.chatgpt.defaultModels.reasoning,
  visionModel: providerPresets.chatgpt.defaultModels.vision,
  imageModel: providerPresets.chatgpt.defaultModels.image,
  detectedModelCatalog: null,
  lastModelDetectionAt: null,
  imageResolution: "2K",
  imageCount: 1,
  imageAspectRatio: "1:1",
  connectionStatus: "idle",
  lastValidatedAt: null
};

export function getProviderPreset(providerId: ProviderId) {
  return providerPresets[providerId];
}

export function buildSettingsFromProvider(
  providerId: ProviderId,
  previous?: ExtensionSettings
): ExtensionSettings {
  const preset = getProviderPreset(providerId);

  return {
    provider: providerId,
    apiKey: previous?.apiKey ?? "",
    imageApiKey: previous?.imageApiKey ?? "",
    baseUrl: preset.defaultBaseUrl,
    imageBaseUrl: previous?.imageBaseUrl ?? "",
    reasoningModel: preset.defaultModels.reasoning,
    visionModel: preset.defaultModels.vision,
    imageModel: preset.defaultModels.image,
    detectedModelCatalog: previous?.provider === providerId ? previous.detectedModelCatalog : null,
    lastModelDetectionAt: previous?.provider === providerId ? previous.lastModelDetectionAt : null,
    imageResolution: previous?.imageResolution ?? "2K",
    imageCount: previous?.imageCount ?? 1,
    imageAspectRatio: previous?.imageAspectRatio ?? "1:1",
    connectionStatus: "idle",
    lastValidatedAt: null
  };
}

export function hasConnectionCredentials(settings: ExtensionSettings) {
  return Boolean(settings.apiKey.trim() && settings.baseUrl.trim());
}

export function getImageConnectionSettings(settings: ExtensionSettings) {
  const imageApiKey = settings.imageApiKey?.trim() ?? "";
  const imageBaseUrl = settings.imageBaseUrl?.trim() ?? "";

  return {
    apiKey: imageApiKey || settings.apiKey.trim(),
    baseUrl: imageBaseUrl || settings.baseUrl.trim(),
    channel: imageApiKey ? "dedicated" as const : "shared" as const
  };
}

export function hasImageConnectionCredentials(settings: ExtensionSettings) {
  const imageConnection = getImageConnectionSettings(settings);
  return Boolean(imageConnection.apiKey && imageConnection.baseUrl);
}

export function isSettingsConfigured(settings: ExtensionSettings) {
  return Boolean(
    hasConnectionCredentials(settings) &&
      hasImageConnectionCredentials(settings) &&
      settings.reasoningModel.trim() &&
      settings.visionModel.trim() &&
      settings.imageModel.trim()
  );
}

function dedupeCatalogValues(values: string[]) {
  return values
    .map((value) => value.trim())
    .filter(Boolean)
    .filter((value, index, array) => array.indexOf(value) === index);
}

export function normalizeModelCatalog(catalog: ModelCatalog): ModelCatalog {
  return {
    reasoning: dedupeCatalogValues(catalog.reasoning),
    vision: dedupeCatalogValues(catalog.vision),
    image: dedupeCatalogValues(catalog.image)
  };
}

export function mergeModelCatalog(baseCatalog: ModelCatalog, nextCatalog?: ModelCatalog | null) {
  if (!nextCatalog) {
    return normalizeModelCatalog(baseCatalog);
  }

  return normalizeModelCatalog({
    reasoning: [...baseCatalog.reasoning, ...nextCatalog.reasoning],
    vision: [...baseCatalog.vision, ...nextCatalog.vision],
    image: [...baseCatalog.image, ...nextCatalog.image]
  });
}

export function getEffectiveModelCatalog(settings: ExtensionSettings) {
  const preset = getProviderPreset(settings.provider);
  return mergeModelCatalog(preset.modelCatalog, settings.detectedModelCatalog);
}

function pickFirstValue(values: string[], fallback: string) {
  return values.find(Boolean) ?? fallback;
}

export function applyDetectedModelCatalog(
  settings: ExtensionSettings,
  detectedModelCatalog: ModelCatalog
): ExtensionSettings {
  const mergedCatalog = getEffectiveModelCatalog({
    ...settings,
    detectedModelCatalog
  });

  const reasoningModel = mergedCatalog.reasoning.includes(settings.reasoningModel)
    ? settings.reasoningModel
    : pickFirstValue(mergedCatalog.reasoning, settings.reasoningModel);
  const visionModel = mergedCatalog.vision.includes(settings.visionModel)
    ? settings.visionModel
    : pickFirstValue(mergedCatalog.vision, reasoningModel || settings.visionModel);
  const imageModel = mergedCatalog.image.includes(settings.imageModel)
    ? settings.imageModel
    : pickFirstValue(mergedCatalog.image, settings.imageModel);

  return {
    ...settings,
    detectedModelCatalog: normalizeModelCatalog(detectedModelCatalog),
    lastModelDetectionAt: new Date().toISOString(),
    reasoningModel,
    visionModel,
    imageModel
  };
}
