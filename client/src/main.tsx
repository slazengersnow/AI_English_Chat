import React from "react";
import { createRoot } from "react-dom/client";
import MinimalUI from "./MinimalUI.tsx";
import "./index.css";

// Show the minimal UI that matches the screenshot
createRoot(document.getElementById("root")!).render(<MinimalUI />);
