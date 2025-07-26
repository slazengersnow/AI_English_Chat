// server/routes/user.ts
import { Router } from "express";
const router = Router();

router.get("/", (req, res) => {
  res.send("This is the user route");
});

export default router;
