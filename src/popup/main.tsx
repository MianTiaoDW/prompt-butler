import React from "react";
import { createRoot } from "react-dom/client";

import { PopupApp } from "./PopupApp";
import "../styles/tailwind.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Popup root element was not found.");
}

createRoot(rootElement).render(
  <React.StrictMode>
    <PopupApp />
  </React.StrictMode>
);
