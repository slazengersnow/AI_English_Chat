import React from "react";
import { createRoot } from "react-dom/client";
import AppWithLogin from "./AppWithLogin.tsx";
import "./index.css";

// Show login screen first, then the complete training UI
createRoot(document.getElementById("root")!).render(<AppWithLogin />);
