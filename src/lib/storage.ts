type StorageArea = Pick<
  chrome.storage.StorageArea,
  "get" | "set"
>;

type StorageChangeHandler<T> = (value: T) => void;

export const STORAGE_KEYS = {
  extensionSettings: "prompt-butler-extension-settings"
} as const;

function getStorageArea(): StorageArea | null {
  if (typeof chrome === "undefined" || !chrome.storage?.local) {
    return null;
  }

  return chrome.storage.local;
}

export async function storageGet<T>(key: string, fallbackValue: T): Promise<T> {
  const storageArea = getStorageArea();

  if (!storageArea) {
    return fallbackValue;
  }

  const result = await storageArea.get(key);
  return (result[key] as T | undefined) ?? fallbackValue;
}

export async function storageSet<T>(key: string, value: T) {
  const storageArea = getStorageArea();

  if (!storageArea) {
    return;
  }

  await storageArea.set({ [key]: value });
}

export function subscribeStorage<T>(
  key: string,
  fallbackValue: T,
  handler: StorageChangeHandler<T>
) {
  if (typeof chrome === "undefined" || !chrome.storage?.onChanged) {
    return () => undefined;
  }

  const listener = (
    changes: Record<string, chrome.storage.StorageChange>,
    areaName: string
  ) => {
    if (areaName !== "local" || !(key in changes)) {
      return;
    }

    const nextValue = (changes[key]?.newValue as T | undefined) ?? fallbackValue;
    handler(nextValue);
  };

  chrome.storage.onChanged.addListener(listener);

  return () => {
    chrome.storage.onChanged.removeListener(listener);
  };
}
