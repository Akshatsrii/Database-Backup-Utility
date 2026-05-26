import { Router } from "express";
import { connectionController } from "../controllers/connection.controller";

const router = Router();

router.get("/",        connectionController.getAll);
router.post("/",       connectionController.create);
router.delete("/:id",  connectionController.remove);
router.post("/:id/test", connectionController.test);

export default router;