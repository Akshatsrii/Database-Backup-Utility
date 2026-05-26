import { Router } from "express";
import { statsController } from "../controllers/stats.controller";

const router = Router();

router.get("/dashboard", statsController.getDashboard);

export default router;