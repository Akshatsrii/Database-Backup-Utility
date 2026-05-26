import { Request, Response } from "express";
import { statsService }      from "../services/stats.service";

export const statsController = {

  // GET /api/stats/dashboard
  getDashboard(req: Request, res: Response) {
    try {
      const stats = statsService.getDashboardStats();
      res.json({ success: true, data: stats });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: (err as Error).message,
      });
    }
  },
};