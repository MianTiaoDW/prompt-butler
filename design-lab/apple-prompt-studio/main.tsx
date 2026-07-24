import React from "react";
import { createRoot } from "react-dom/client";
import { ApplePromptStudio } from "./ApplePromptStudio";
import "./styles.css";

const root = document.getElementById("root");

if (!root) throw new Error("Apple Prompt Studio root was not found.");

createRoot(root).render(
  <React.StrictMode>
    <ApplePromptStudio />
  </React.StrictMode>
);
