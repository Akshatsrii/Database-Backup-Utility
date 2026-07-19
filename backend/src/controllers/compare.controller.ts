import { Request, Response } from "express";
import { backupService } from "../services/backup/backup.service";

export const compareController = {
  compareBackups(req: Request, res: Response) {
    const { a, b } = req.query;

    if (!a || !b || typeof a !== "string" || typeof b !== "string") {
      return res.status(400).json({ success: false, error: "Provide both 'a' and 'b' query parameters (Backup IDs)" });
    }

    const backupA = backupService.getBackupById(a);
    const backupB = backupService.getBackupById(b);

    if (!backupA || !backupB) {
      return res.status(404).json({ success: false, error: "One or both backups not found" });
    }

    const sizeDiff = (backupB.sizeAfter || 0) - (backupA.sizeAfter || 0);
    const durationDiff = (backupB.durationMs || 0) - (backupA.durationMs || 0);

    const comparison = {
      backupA,
      backupB,
      diff: {
        sizeBytes: sizeDiff,
        durationMs: durationDiff,
        sameDatabase: backupA.connectionId === backupB.connectionId,
        timeGapMs: new Date(backupB.startedAt).getTime() - new Date(backupA.startedAt).getTime()
      }
    };

    res.json({ success: true, data: comparison });
  }
};
