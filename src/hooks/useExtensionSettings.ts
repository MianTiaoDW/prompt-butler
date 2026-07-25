import { useEffect, useMemo, useState } from "react";

import {
  buildSettingsFromProvider,
  defaultExtensionSettings,
  getProviderPreset,
  isSettingsConfigured
} from "../lib/provider-presets";
import { STORAGE_KEYS } from "../lib/storage";
import type {
  ConnectionStatus,
  ExtensionSettings,
  ImageAspectRatio,
  ImageCount,
  ImageResolution,
  ProviderId
} from "../types/settings";
import { useChromeStorage } from "./useChromeStorage";

export function useExtensionSettings() {
  const storage = useChromeStorage<ExtensionSettings>(
    STORAGE_KEYS.extensionSettings,
    defaultExtensionSettings
  );
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const { value: storedSettings, setValue, isLoading, error } = storage;
  const settings = useMemo<ExtensionSettings>(() => ({
    ...defaultExtensionSettings,
    ...storedSettings
  }), [storedSettings]);
  const providerPreset = getProviderPreset(settings.provider);
  const isConfigured = isSettingsConfigured(settings);
  const isServiceReady = isConfigured;

  useEffect(() => {
    if (isLoading) {
      return;
    }

    setLastSyncedAt(new Date().toISOString());
  }, [isLoading, settings]);

  const updateSettings = async (nextSettings: ExtensionSettings) => {
    await setValue(nextSettings);
  };

  const updatePartialSettings = async (patch: Partial<ExtensionSettings>) => {
    await setValue((current) => ({
      ...defaultExtensionSettings,
      ...current,
      ...patch
    }));
  };

  const setProvider = async (provider: ProviderId) => {
    await setValue((current) => buildSettingsFromProvider(provider, current));
  };

  const setApiKey = async (apiKey: string) => {
    await updatePartialSettings({
      apiKey,
      connectionStatus: "idle",
      lastValidatedAt: null
    });
  };

  const setBaseUrl = async (baseUrl: string) => {
    await updatePartialSettings({
      baseUrl,
      connectionStatus: "idle",
      lastValidatedAt: null
    });
  };

  const setModel = async (
    field: "reasoningModel" | "visionModel" | "imageModel",
    value: string
  ) => {
    await updatePartialSettings({
      [field]: value,
      connectionStatus: "idle",
      lastValidatedAt: null
    });
  };

  const setImageResolution = async (imageResolution: ImageResolution) => {
    await updatePartialSettings({ imageResolution });
  };

  const setImageCount = async (imageCount: ImageCount) => {
    await updatePartialSettings({ imageCount });
  };

  const setImageAspectRatio = async (imageAspectRatio: ImageAspectRatio) => {
    await updatePartialSettings({ imageAspectRatio });
  };

  const setConnectionStatus = async (connectionStatus: ConnectionStatus) => {
    await updatePartialSettings({
      connectionStatus,
      lastValidatedAt:
        connectionStatus === "success" ? new Date().toISOString() : null
    });
  };

  return {
    settings,
    providerPreset,
    isLoading,
    error,
    isConfigured,
    isServiceReady,
    lastSyncedAt,
    updateSettings,
    setProvider,
    setApiKey,
    setBaseUrl,
    setModel,
    setImageResolution,
    setImageCount,
    setImageAspectRatio,
    setConnectionStatus
  };
}
