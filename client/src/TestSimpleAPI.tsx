import React, { useState, useEffect } from "react";

export default function TestSimpleAPI() {
  const [apiStatus, setApiStatus] = useState("初期化中...");
  const [problemData, setProblemData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const testAPI = async () => {
      try {
        setApiStatus("APIテスト中...");
        
        // Test the problem endpoint
        const response = await fetch("/api/problem", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({ difficultyLevel: "toeic" }),
        });
        
        console.log("Response status:", response.status);
        console.log("Response headers:", response.headers);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log("Response data:", data);
        
        setProblemData(data);
        setApiStatus("✅ API接続成功！");
        
      } catch (err) {
        console.error("API test error:", err);
        setError(err.message);
        setApiStatus("❌ API接続失敗");
      }
    };
    
    testAPI();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto pt-8">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-4">
          <h1 className="text-xl font-bold text-gray-900 mb-4">API接続テスト</h1>
          
          <div className="space-y-3">
            <div>
              <span className="font-medium">ステータス:</span> {apiStatus}
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <span className="font-medium text-red-800">エラー:</span> {error}
              </div>
            )}
            
            {problemData && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="text-sm text-green-800">
                  <div><strong>問題:</strong> {problemData.japaneseSentence}</div>
                  <div><strong>ヒント:</strong> {problemData.hints?.[0]}</div>
                </div>
              </div>
            )}
            
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              再テスト
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}