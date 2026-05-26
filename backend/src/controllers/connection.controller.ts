import { Request, Response } from "express";
import { v4 as uuidv4 }      from "uuid";
import { logger }            from "../config/logger";
import { backupService }     from "../services/backup/backup.service";
import { connectionStore }   from "../services/scheduler.service";
import type {
  ApiResponse,
  DbConnection,
  CreateConnectionDto,
} from "../types";

export const connectionController = {

  // GET /api/connections
  getAll(req: Request, res: Response) {
    const safe = connectionStore.map(({ password, ...rest }) => rest);
    const resp: ApiResponse<typeof safe> = { success: true, data: safe };
    res.json(resp);
  },

  // POST /api/connections
  create(req: Request, res: Response) {
    const dto = req.body as CreateConnectionDto;

    const connection: DbConnection = {
      id:        uuidv4(),
      name:      dto.name,
      type:      dto.type,
      host:      dto.host,
      port:      dto.port,
      username:  dto.username,
      password:  dto.password,
      database:  dto.database,
      createdAt: new Date().toISOString(),
    };

    connectionStore.push(connection);
    logger.info(`Connection created: ${connection.id} (${connection.type})`);

    const { password, ...safe } = connection;
    const resp: ApiResponse<typeof safe> = {
      success: true,
      data:    safe,
      message: "Connection created",
    };
    res.status(201).json(resp);
  },

  // DELETE /api/connections/:id
  remove(req: Request, res: Response) {
    const { id } = req.params;
    const idx    = connectionStore.findIndex((c) => c.id === id);

    if (idx === -1) {
      return res.status(404).json({
        success: false,
        error: "Connection not found",
      });
    }

    connectionStore.splice(idx, 1);
    logger.info(`Connection deleted: ${id}`);

    res.json({ success: true, message: "Connection deleted" });
  },

  // POST /api/connections/:id/test
  async test(req: Request, res: Response) {
    const { id }   = req.params;
    const connection = connectionStore.find((c) => c.id === id);

    if (!connection) {
      return res.status(404).json({
        success: false,
        error: "Connection not found",
      });
    }

    try {
      const start   = Date.now();
      const success = await backupService.testConnection(connection);
      const latency = Date.now() - start;

      res.json({
        success: true,
        data: {
          success,
          message:   success ? "Connection successful" : "Connection failed",
          latencyMs: latency,
        },
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: (err as Error).message,
      });
    }
  },
};