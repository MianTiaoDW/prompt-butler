import React, { useCallback, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

import { OverlayApp } from "../content/OverlayApp";
import { OptionsApp } from "./OptionsApp";
import "../styles/tailwind.css";

interface DocumentPictureInPictureController {
  requestWindow(options?: {
    width?: number;
    height?: number;
    disallowReturnToOpener?: boolean;
  }): Promise<Window>;
}

declare global {
  interface Window {
    documentPictureInPicture?: DocumentPictureInPictureController;
  }
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Options root element was not found.");
}
const appRootElement = rootElement;

const isAppWindow = new URLSearchParams(window.location.search).get("view") === "app";

function AppWindow() {
  const [isPinned, setIsPinned] = useState(false);
  const pictureInPictureWindowRef = useRef<Window | null>(null);
  const restoreParentRef = useRef<ParentNode | null>(null);
  const restoreSiblingRef = useRef<ChildNode | null>(null);

  const restoreAppRoot = useCallback(() => {
    if (appRootElement.ownerDocument === document) return;
    const restoreParent = restoreParentRef.current ?? document.body;
    const restoreSibling = restoreSiblingRef.current;
    if (restoreSibling?.parentNode === restoreParent) {
      restoreParent.insertBefore(appRootElement, restoreSibling);
    } else {
      restoreParent.appendChild(appRootElement);
    }
  }, []);

  const handlePinnedChange = useCallback(async (nextPinned: boolean) => {
    if (!nextPinned) {
      restoreAppRoot();
      pictureInPictureWindowRef.current?.close();
      pictureInPictureWindowRef.current = null;
      setIsPinned(false);
      return true;
    }

    const controller = window.documentPictureInPicture;
    if (!controller) return false;

    try {
      const pictureInPictureWindow = await controller.requestWindow({
        width: Math.max(420, window.innerWidth),
        height: Math.max(620, window.innerHeight),
        disallowReturnToOpener: true
      });

      restoreParentRef.current = appRootElement.parentNode;
      restoreSiblingRef.current = appRootElement.nextSibling;

      for (const styleNode of document.head.querySelectorAll('link[rel="stylesheet"], style')) {
        pictureInPictureWindow.document.head.appendChild(styleNode.cloneNode(true));
      }

      pictureInPictureWindow.document.documentElement.style.width = "100%";
      pictureInPictureWindow.document.documentElement.style.height = "100%";
      pictureInPictureWindow.document.body.style.width = "100%";
      pictureInPictureWindow.document.body.style.height = "100%";
      pictureInPictureWindow.document.body.style.margin = "0";
      pictureInPictureWindow.document.body.style.overflow = "hidden";
      pictureInPictureWindow.document.body.appendChild(appRootElement);

      pictureInPictureWindowRef.current = pictureInPictureWindow;
      pictureInPictureWindow.addEventListener("pagehide", () => {
        restoreAppRoot();
        pictureInPictureWindowRef.current = null;
        setIsPinned(false);
      }, { once: true });
      setIsPinned(true);
      return true;
    } catch (error) {
      console.error("[Prompt Butler] 无法置顶工作台窗口：", error);
      return false;
    }
  }, [restoreAppRoot]);

  const closeAppWindow = useCallback(() => {
    pictureInPictureWindowRef.current?.close();
    window.close();
  }, []);

  return (
    <main className="h-screen w-screen overflow-hidden bg-canvas p-3 text-white">
      <OverlayApp
        embedded
        appWindow
        pinned={isPinned}
        onPinnedChange={handlePinnedChange}
        onClose={closeAppWindow}
      />
    </main>
  );
}

createRoot(appRootElement).render(
  <React.StrictMode>
    {isAppWindow ? <AppWindow /> : <OptionsApp />}
  </React.StrictMode>
);
