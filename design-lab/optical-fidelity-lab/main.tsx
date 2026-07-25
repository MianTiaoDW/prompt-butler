import React from "react";
import { createRoot } from "react-dom/client";
import { OpticalFidelityLab } from "./OpticalFidelityLab";
import "./tokens.css";
import "./styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("Optical Fidelity Lab root was not found.");

createRoot(root).render(
  <React.StrictMode>
    <OpticalFidelityLab />
  </React.StrictMode>,
);
