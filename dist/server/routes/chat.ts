import { Router } from "express";
const router = Router();

router.get("/", (req, res) => {
  res.json({ message: "Chat route OK" });
});

export default router;
