import React from "react";
import { createRoot } from "react-dom/client";

import { OverlayApp } from "./OverlayApp";
import contentStyles from "../styles/tailwind.css?inline";

const CONTAINER_ID = "prompt-butler-root";
const STYLE_ELEMENT_ID = "prompt-butler-style";

function getContainer() {
  return document.getElementById(CONTAINER_ID);
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
  const shadowRoot = container.attachShadow({ mode: "open" });
  const appRoot = document.createElement("div");
  document.body.appendChild(container);
  ensureShadowStyles(shadowRoot);
  shadowRoot.appendChild(appRoot);

  createRoot(appRoot).render(
    <React.StrictMode>
      <OverlayApp />
    </React.StrictMode>
  );

  return container;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "overlay:open") {
    mount();
    sendResponse({ ok: true });
    return true;
  }

  return false;
});
