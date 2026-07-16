export const PROVIDER_IDS = [
  "claude",
  "gemini",
  "chatgpt",
  "openaiRelay",
  "volcengine",
  "kimi",
  "deepseek",
  "minimax",
  "dashscope",
  "xiaomi",
  "tencent"
] as const;

export type ProviderId = (typeof PROVIDER_IDS)[number];

export const IMAGE_RESOLUTIONS = ["2K", "4K"] as const;
export type ImageResolution = (typeof IMAGE_RESOLUTIONS)[number];

export const IMAGE_COUNTS = [1, 2, 3, 4] as const;
export type ImageCount = (typeof IMAGE_COUNTS)[number];

export const IMAGE_ASPECT_RATIOS = [
  "1:1",
  "3:4",
  "4:3",
  "9:16",
  "16:9",
  "1:3",
  "3:1",
  "1:8",
  "8:1",
  "1:21",
  "21:1"
] as const;
export type ImageAspectRatio = (typeof IMAGE_ASPECT_RATIOS)[number];

export type ConnectionStatus = "idle" | "testing" | "success" | "error";

export interface ModelCatalog {
  reasoning: string[];
  vision: string[];
  image: string[];
}

export interface ProviderPreset {
  id: ProviderId;
  label: string;
  protocol: "openai" | "anthropic" | "gemini";
  defaultBaseUrl: string;
  defaultModels: {
    reasoning: string;
    vision: string;
    image: string;
  };
  modelCatalog: ModelCatalog;
  notes?: string;
  baseUrlVerified: boolean;
}

export interface ExtensionSettings {
  provider: ProviderId;
  apiKey: string;
  imageApiKey: string;
  baseUrl: string;
  imageBaseUrl: string;
  reasoningModel: string;
  visionModel: string;
  imageModel: string;
  detectedModelCatalog: ModelCatalog | null;
  lastModelDetectionAt: string | null;
  imageResolution: ImageResolution;
  imageCount: ImageCount;
  imageAspectRatio: ImageAspectRatio;
  connectionStatus: ConnectionStatus;
  lastValidatedAt: string | null;
}
