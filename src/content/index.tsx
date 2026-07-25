import React from "react";
import { createRoot, type Root } from "react-dom/client";

import { OverlayApp } from "./OverlayApp";
import contentStyles from "../styles/tailwind.css?inline";

const CONTAINER_ID = "prompt-butler-root";
const STYLE_ELEMENT_ID = "prompt-butler-style";
const OVERLAY_Z_INDEX = "2147480000";
const PINNED_OVERLAY_Z_INDEX = "2147483647";
let mountedContainer: HTMLDivElement | null = null;
let mountedRoot: Root | null = null;

function getContainer() {
  return mountedContainer?.isConnected ? mountedContainer : null;
}

function setOverlayPinned(isPinned: boolean) {
  const container = getContainer();
  if (!container) return;
  container.style.zIndex = isPinned ? PINNED_OVERLAY_Z_INDEX : OVERLAY_Z_INDEX;
  container.dataset.pinned = String(isPinned);
}

function ensureShadowStyles(shadowRoot: ShadowRoot) {
  if (shadowRoot.getElementById(STYLE_ELEMENT_ID)) {
    return;
  }

  const style = document.createElement("style");
  style.id = STYLE_ELEMENT_ID;
  style.textContent = contentStyles;
  shadowRoot.appendChild(style);
}

function mount() {
  const existingContainer = getContainer();

  if (existingContainer) {
    existingContainer.style.display = "block";
    return existingContainer;
  }

  const container = document.createElement("div");
  container.id = CONTAINER_ID;
  container.style.all = "initial";
  container.style.position = "fixed";
  container.style.inset = "0";
  container.style.zIndex = OVERLAY_Z_INDEX;
  container.style.pointerEvents = "none";
  const shadowRoot = container.attachShadow({ mode: "closed" });
  const appRoot = document.createElement("div");
  appRoot.className = "prompt-butler-shadow-root";
  document.body.appendChild(container);
  ensureShadowStyles(shadowRoot);
  shadowRoot.appendChild(appRoot);

  mountedContainer = container;
  mountedRoot = createRoot(appRoot);
  mountedRoot.render(
    <React.StrictMode>
      <OverlayApp onClose={unmount} onPinnedChange={setOverlayPinned} />
    </React.StrictMode>
  );

  return container;
}

function unmount() {
  mountedRoot?.unmount();
  mountedRoot = null;
  mountedContainer?.remove();
  mountedContainer = null;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "overlay:ping") {
    sendResponse({ ok: true, open: Boolean(getContainer()) });
    return true;
  }

  if (message?.type === "overlay:open") {
    mount();
    sendResponse({ ok: true });
    return true;
  }

  if (message?.type === "overlay:toggle") {
    if (getContainer()) unmount();
    else mount();
    sendResponse({ ok: true, open: Boolean(getContainer()) });
    return true;
  }

  if (message?.type === "overlay:close") {
    unmount();
    sendResponse({ ok: true });
    return true;
  }

  return false;
});

window.addEventListener("pagehide", unmount, { once: true });
