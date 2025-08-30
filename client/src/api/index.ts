export const generateProblem = async (difficultyLevel: string) => {
  const res = await fetch("/api/problem", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ difficultyLevel }),
  });
  return res.json();
};

export const evaluateWithClaude = async (data: {
  userAnswer: string;
  japaneseSentence: string;
  modelAnswer: string;
  difficulty: string;
}) => {
  const res = await fetch("/api/evaluate-with-claude-with-claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};
