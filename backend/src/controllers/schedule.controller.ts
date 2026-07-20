import { Request, Response } from "express";
import { schedulerService }  from "../services/scheduler.service";
import { connectionStore }   from "../services/scheduler.service";
import type { CreateScheduleDto } from "../types";

export const scheduleController = {

  // GET /api/schedules
  getAll(req: Request, res: Response) {
    const schedules = schedulerService.getAllSchedules();
    res.json({ success: true, data: schedules });
  },

  // POST /api/schedules
  create(req: Request, res: Response) {
    const dto        = req.body as CreateScheduleDto;
    const connection = connectionStore.find((c) => c.id === dto.connectionId);

    if (!connection) {
      return res.status(404).json({
        success: false,
        error: "Connection not found",
      });
    }

    try {
      const schedule = schedulerService.createSchedule(dto, connection);
      res.status(201).json({
        success: true,
        data:    schedule,
        message: "Schedule created",
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: (err as Error).message,
      });
    }
  },

  // PATCH /api/schedules/:id
  toggle(req: Request, res: Response) {
    const { id }      = req.params;
    const { enabled } = req.body as { enabled: boolean };

    try {
      const schedule = schedulerService.toggleSchedule(id as string, enabled);
      res.json({
        success: true,
        data:    schedule,
        message: `Schedule ${enabled ? "enabled" : "paused"}`,
      });
    } catch (err) {
      res.status(404).json({
        success: false,
        error: (err as Error).message,
      });
    }
  },

  // DELETE /api/schedules/:id
  remove(req: Request, res: Response) {
    try {
      schedulerService.deleteSchedule(req.params.id as string);
      res.json({ success: true, message: "Schedule deleted" });
    } catch (err) {
      res.status(404).json({
        success: false,
        error: (err as Error).message,
      });
    }
  },
};