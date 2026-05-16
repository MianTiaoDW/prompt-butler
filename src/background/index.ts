import { downloadImages, generateImagesWithProvider } from "./image-generator";
import { detectProviderModels } from "./model-discovery";
import { generatePromptFromProvider } from "./prompt-generator";
import { optimizePromptWithProvider } from "./prompt-generator";
import { testProviderConnection } from "./provider-health";
import { finishImageTask, finishPromptTask } from "../lib/task-broker";
import type { RuntimeRequestMessage } from "../types/runtime";

const APP_WINDOW_PATH = "options.html?view=app";
const APP_WINDOW_URL_PATTERN = `${chrome.runtime.getURL("options.html")}*`;

async function getExistingAppWindowId() {
  const tabs = await chrome.tabs.query({
    url: APP_WINDOW_URL_PATTERN
  });

  const tabWithWindow = tabs.find((tab) => typeof tab.windowId === "number");
  return tabWithWindow?.windowId ?? null;
}

async function openOrFocusAppWindow() {
  const existingWindowId = await getExistingAppWindowId();

  if (existingWindowId !== null) {
    await chrome.windows.update(existingWindowId, {
      focused: true
    });
    return;
  }

  await chrome.windows.create({
    url: APP_WINDOW_PATH,
    type: "popup",
    width: 460,
    height: 760
  });
}

chrome.runtime.onInstalled.addListener(() => {
  console.log("Prompt Butler extension installed.");
});

chrome.action.onClicked.addListener(() => {
  void openOrFocusAppWindow();
});

chrome.runtime.onMessage.addListener((message: RuntimeRequestMessage, _sender, sendResponse) => {
  void (async () => {
    if (message.type === "provider:test-connection") {
      const result = await testProviderConnection(message.payload.settings);
      sendResponse(result);
      return;
    }

    if (message.type === "provider:detect-models") {
      const result = await detectProviderModels(message.payload.settings);
      sendResponse(result);
      return;
    }

    if (message.type === "prompt:generate") {
      const result = await generatePromptFromProvider(
        message.payload.settings,
        message.payload.input
      );
      await finishPromptTask(result);
      sendResponse(result);
      return;
    }

    if (message.type === "prompt:optimize") {
      const result = await optimizePromptWithProvider(
        message.payload.settings,
        message.payload.content
      );
      sendResponse(result);
      return;
    }

    if (message.type === "image:generate") {
      const result = await generateImagesWithProvider(
        message.payload.settings,
        message.payload.input
      );
      await finishImageTask(result);
      sendResponse(result);
      return;
    }

    if (message.type === "image:download") {
      const result = await downloadImages(message.payload.urls);
      sendResponse(result);
      return;
    }

    sendResponse(null);
  })();

  return true;
});
