import React from "react";
import { createRoot } from "react-dom/client";

import { VisualIntegrationLab } from "./VisualIntegrationLab";
import "./tokens.css";
import "./styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("Visual Integration Lab root was not found.");

createRoot(root).render(
  <React.StrictMode>
    <VisualIntegrationLab />
  </React.StrictMode>,
);
