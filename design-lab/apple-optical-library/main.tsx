import React from "react";
import { createRoot } from "react-dom/client";
import { OpticalLibraryPrototype } from "./OpticalLibraryPrototype";
import "./tokens.css";
import "./styles.css";

const root = document.getElementById("root");

if (!root) throw new Error("Design lab root was not found.");

createRoot(root).render(
  <React.StrictMode>
    <OpticalLibraryPrototype />
  </React.StrictMode>
);
