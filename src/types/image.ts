import type { ImageAspectRatio, ProviderId } from "./settings";

export interface ImageGenerationInput {
  prompt: string;
  count: number;
  resolution: "2K" | "4K";
  aspectRatio: ImageAspectRatio;
}

export interface GeneratedImageAsset {
  id: string;
  url: string;
  mimeType: string;
  revisedPrompt?: string;
}

export interface ImageGenerationSuccess {
  ok: true;
  provider: ProviderId;
  model: string;
  generatedAt: string;
  images: GeneratedImageAsset[];
}

export interface ImageGenerationFailure {
  ok: false;
  provider: ProviderId;
  model: string;
  generatedAt: string;
  message: string;
}

export type ImageGenerationResult =
  | ImageGenerationSuccess
  | ImageGenerationFailure;

export interface ImageWorkspaceState {
  prompt: string;
  lastUpdatedAt: string | null;
}

export interface ImageHistoryEntry {
  id: string;
  url: string;
  prompt: string;
  model: string;
  provider: string;
  resolution: string;
  aspectRatio: string;
  count: number;
  generatedAt: string;
  revisedPrompt?: string;
}
