import { Router }      from "express";
import connectionRoutes from "./connection.routes";
import backupRoutes     from "./backup.routes";
import restoreRoutes    from "./restore.routes";
import scheduleRoutes   from "./schedule.routes";
import logRoutes        from "./log.routes";
import statsRoutes      from "./stats.routes";

const router = Router();

router.use("/connections", connectionRoutes);
router.use("/backups",     backupRoutes);
router.use("/restore",     restoreRoutes);
router.use("/schedules",   scheduleRoutes);
router.use("/logs",        logRoutes);
router.use("/stats",       statsRoutes);

// Health check
router.get("/health", (req, res) => {
  res.json({
    success:   true,
    status:    "ok",
    timestamp: new Date().toISOString(),
    uptime:    process.uptime(),
  });
});

export default router;