// Minimal Express server for testing API endpoints
import express from "express";
import cors from "cors";

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Test endpoint
app.get("/", (req, res) => {
  res.send("Express Server Running!");
});

// API endpoints
app.post("/api/problem", (req, res) => {
  console.log("🔥 Problem endpoint hit:", req.body);
  res.json({
    japaneseSentence: "チームメンバーと連携を取ってください。",
    hints: ["問題1"],
    dailyLimitReached: false,
    currentCount: 1,
    dailyLimit: 100
  });
});

app.post("/api/evaluate", (req, res) => {
  console.log("🔥 Evaluate endpoint hit:", req.body);
  res.json({
    rating: 4,
    modelAnswer: "Please coordinate with your team members.",
    feedback: "良い回答です。文法的に正確で、意味も適切に伝わります。",
    similarPhrases: [
      "Please work closely with your team members.",
      "Please collaborate with your teammates.",
      "Please cooperate with your team."
    ]
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
});