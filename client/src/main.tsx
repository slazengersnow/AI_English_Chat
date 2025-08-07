import React from "react";
import { createRoot } from "react-dom/client";
import ChatStyleTraining from "./ChatStyleTraining";
import "./index.css";

createRoot(document.getElementById("root")!).render(<ChatStyleTraining difficulty="middle_school" onBackToMenu={() => console.log('Back to menu')} />);
