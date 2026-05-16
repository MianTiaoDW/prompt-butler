import React from "react";
import { createRoot } from "react-dom/client";

import { OverlayApp } from "../content/OverlayApp";
import { OptionsApp } from "./OptionsApp";
import "../styles/tailwind.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Options root element was not found.");
}

const searchParams = new URLSearchParams(window.location.search);
const isAppWindow = searchParams.get("view") === "app";

createRoot(rootElement).render(
  <React.StrictMode>
    {isAppWindow ? (
      <main className="h-screen w-screen overflow-hidden bg-accent-radial p-3 text-white">
        <OverlayApp embedded />
      </main>
    ) : (
      <OptionsApp />
    )}
  </React.StrictMode>
);
