import React from "react";
import { createRoot } from "react-dom/client";
import SimpleTest from "./SimpleTest.tsx";
import "./index.css";

// Test component to verify React is working
createRoot(document.getElementById("root")!).render(<SimpleTest />);
