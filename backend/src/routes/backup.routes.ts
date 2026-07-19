import { Router } from "express";
import { backupController } from "../controllers/backup.controller";
import { compareController } from "../controllers/compare.controller";

const router = Router();

router.get("/",               backupController.getAll);
router.get("/preview-cleanup", backupController.previewCleanup);
router.get("/compare",        compareController.compareBackups);
router.get("/:id",            backupController.getById);
router.post("/",              backupController.create);
router.delete("/:id",         backupController.remove);
router.get("/:id/download",   backupController.download);

export default router;