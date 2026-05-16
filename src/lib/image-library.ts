import { storageGet, storageSet } from "./storage";
import type { ImageHistoryEntry, ImageWorkspaceState } from "../types/image";

export const IMAGE_STORAGE_KEYS = {
  workspace: "prompt-butler-image-workspace",
  history: "prompt-butler-image-history"
} as const;

export const defaultImageWorkspaceState: ImageWorkspaceState = {
  prompt: "",
  lastUpdatedAt: null
};

export async function saveImageWorkspacePrompt(prompt: string) {
  const nextState: ImageWorkspaceState = {
    prompt,
    lastUpdatedAt: new Date().toISOString()
  };

  await storageSet(IMAGE_STORAGE_KEYS.workspace, nextState);
  return nextState;
}

export async function getImageWorkspaceState() {
  return storageGet<ImageWorkspaceState>(
    IMAGE_STORAGE_KEYS.workspace,
    defaultImageWorkspaceState
  );
}

const MAX_HISTORY_ENTRIES = 50;

export async function getImageHistory(): Promise<ImageHistoryEntry[]> {
  return storageGet<ImageHistoryEntry[]>(IMAGE_STORAGE_KEYS.history, []);
}

export async function addImageHistoryEntries(entries: ImageHistoryEntry[]) {
  const existing = await getImageHistory();
  const next = [...entries, ...existing].slice(0, MAX_HISTORY_ENTRIES);
  await storageSet(IMAGE_STORAGE_KEYS.history, next);
  return next;
}

export async function clearImageHistory() {
  await storageSet(IMAGE_STORAGE_KEYS.history, []);
}
