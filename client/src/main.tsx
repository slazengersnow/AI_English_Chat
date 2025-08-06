import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

// Simple test component to verify the server is working
function SimpleApp() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
          AI瞬間英作文チャット
        </h1>
        <p className="text-center text-gray-600 mb-6">
          サーバーが正常に動作しています！
        </p>
        <div className="text-center">
          <div className="inline-block bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
            ✓ サーバー接続成功
          </div>
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<SimpleApp />);
