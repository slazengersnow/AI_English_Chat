import React from "react";
import { createRoot } from "react-dom/client";
import TestSimpleAPI from "./TestSimpleAPI.tsx";
import "./index.css";

// Test API connection first
createRoot(document.getElementById("root")!).render(<TestSimpleAPI />);
