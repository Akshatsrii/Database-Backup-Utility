import { Request, Response } from "express";
import path                  from "path";
import { backupService }     from "../services/backup/backup.service";
import { notificationService } from "../services/notification.service";
import { connectionStore }   from "../services/scheduler.service";
import { localStorageService } from "../services/storage/local.storage";
import { logger }            from "../config/logger";
import type { ApiResponse, CreateBackupDto } from "../types";

export const backupController = {

  // GET /api/backups
  getAll(req: Request, res: Response) {
    const backups = backupService.getAllBackups();
    const resp: ApiResponse<typeof backups> = {
      success: true,
      data:    backups,
    };
    res.json(resp);
  },

  // GET /api/backups/:id
  getById(req: Request, res: Response) {
    const backup = backupService.getBackupById(req.params.id);
    if (!backup) {
      return res.status(404).json({
        success: false,
        error: "Backup not found",
      });
    }
    res.json({ success: true, data: backup });
  },

  // POST /api/backups
  async create(req: Request, res: Response) {
    const dto        = req.body as CreateBackupDto;
    const connection = connectionStore.find((c) => c.id === dto.connectionId);

    if (!connection) {
      return res.status(404).json({
        success: false,
        error: "Connection not found",
      });
    }

    // Get socket.io from app
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
      const backup = await backupService.createBackup(
        connection,
        dto,
        emitLog
      );

      // Send Slack notification
      await notificationService.sendSlackNotification(backup);

      res.status(201).json({
        success: true,
        data:    backup,
        message: `Backup ${backup.status}`,
      });
    } catch (err) {
      logger.error("Backup creation failed", { err });
      res.status(500).json({
        success: false,
        error: (err as Error).message,
      });
    }
  },

  // DELETE /api/backups/:id
  async remove(req: Request, res: Response) {
    try {
      await backupService.deleteBackup(req.params.id);
      res.json({ success: true, message: "Backup deleted" });
    } catch (err) {
      res.status(404).json({
        success: false,
        error: (err as Error).message,
      });
    }
  },

  // GET /api/backups/:id/download
  download(req: Request, res: Response) {
    const backup = backupService.getBackupById(req.params.id);

    if (!backup) {
      return res.status(404).json({
        success: false,
        error: "Backup not found",
      });
    }

    const filename = path.basename(backup.storagePath);

    if (!localStorageService.exists(filename)) {
      return res.status(404).json({
        success: false,
        error: "Backup file not found on disk",
      });
    }

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"`
    );
    res.setHeader("Content-Type", "application/octet-stream");

    const stream = localStorageService.getReadStream(filename);
    stream.pipe(res);
  },
};