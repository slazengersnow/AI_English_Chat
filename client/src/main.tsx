console.log("🔥 MAIN.TSX LOADED - ファイル読み込み開始");
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

console.log("🔥 MAIN.TSX - App imported successfully");

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

console.log("🔥 MAIN.TSX - React root created");
