import React from "react";
import { createRoot } from "react-dom/client";
import App from "./MinimalApp.tsx";
import "./index.css";

// Temporarily disable React Strict Mode to prevent double execution in development
createRoot(document.getElementById("root")!).render(<App />);
