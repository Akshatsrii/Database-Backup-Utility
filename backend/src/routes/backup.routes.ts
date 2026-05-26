import { Router } from "express";
import { backupController } from "../controllers/backup.controller";

const router = Router();

router.get("/",               backupController.getAll);
router.get("/:id",            backupController.getById);
router.post("/",              backupController.create);
router.delete("/:id",         backupController.remove);
router.get("/:id/download",   backupController.download);

export default router;