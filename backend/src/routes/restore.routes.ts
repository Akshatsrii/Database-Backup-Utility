import { Router } from "express";
import { restoreController } from "../controllers/restore.controller";

const router = Router();

router.get("/jobs",  restoreController.getJobs);
router.post("/",     restoreController.start);

export default router;