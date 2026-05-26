import { Router } from "express";
import { scheduleController } from "../controllers/schedule.controller";

const router = Router();

router.get("/",         scheduleController.getAll);
router.post("/",        scheduleController.create);
router.patch("/:id",    scheduleController.toggle);
router.delete("/:id",   scheduleController.remove);

export default router;