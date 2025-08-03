import { createRoot } from "react-dom/client";
import App from "./App.js";
import "./index.css";

// Temporarily disable React Strict Mode to prevent double execution in development
createRoot(document.getElementById("root")!).render(<App />);
