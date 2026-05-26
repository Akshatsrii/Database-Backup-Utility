import { Request, Response } from "express";
import { restoreService }    from "../services/restore/restore.service";
import { connectionStore }   from "../services/scheduler.service";
import { logger }            from "../config/logger";
import type { RestoreDto }   from "../types";

export const restoreController = {

  // GET /api/restore/jobs
  getJobs(req: Request, res: Response) {
    const jobs = restoreService.getAllJobs();
    res.json({ success: true, data: jobs });
  },

  // POST /api/restore
  async start(req: Request, res: Response) {
    const dto        = req.body as RestoreDto;
    const connection = connectionStore.find((c) => c.id === dto.connectionId);

    if (!connection) {
      return res.status(404).json({
        success: false,
        error: "Connection not found",
      });
    }

    const io = req.app.get("io");

    const emitLog = (msg: string) => {
      logger.info(msg);
      if (io) {
        io.emit("log", {
          id:        Date.now().toString(),
          level:     "info",
          message:   msg,
          timestamp: new Date().toISOString(),
        });
      }
    };

    try {
      const job = await restoreService.restore(connection, dto, emitLog);
      res.status(201).json({
        success: true,
        data:    job,
        message: `Restore ${job.status}`,
      });
    } catch (err) {
      logger.error("Restore failed", { err });
      res.status(500).json({
        success: false,
        error: (err as Error).message,
      });
    }
  },
};