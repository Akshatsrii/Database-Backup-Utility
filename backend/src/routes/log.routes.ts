import { Router } from "express";
import { logController } from "../controllers/log.controller";

const router = Router();

router.get("/",    logController.getLogs);
router.delete("/", logController.clearLogs);

export default router;