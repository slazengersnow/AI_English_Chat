// server/routes/chat.ts
import { Router } from "express";
const router = Router();

router.get("/", (req, res) => {
  res.send("This is the chat route");
});

export default router;
