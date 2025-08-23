import React from "react";
import { createRoot } from "react-dom/client";
import CompleteTrainingUI from "./CompleteTrainingUI";
import "./index.css";

// Mock user for admin access
const mockUser = { email: 'admin@example.com' };

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <CompleteTrainingUI 
      user={mockUser} 
      onLogout={() => console.log('Logout')} 
    />
  </React.StrictMode>
);
