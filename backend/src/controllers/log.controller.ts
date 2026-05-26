import { Request, Response } from "express";
import fs   from "fs";
import path from "path";

export const logController = {

  // GET /api/logs
  getLogs(req: Request, res: Response) {
    const limit   = parseInt(req.query.limit as string) || 200;
    const logFile = path.join(process.cwd(), "logs", "combined.log");

    try {
      if (!fs.existsSync(logFile)) {
        return res.json({ success: true, data: [] });
      }

      const content = fs.readFileSync(logFile, "utf-8");
      const lines   = content
        .trim()
        .split("\n")
        .filter(Boolean)
        .slice(-limit);

      const logs = lines.map((line, i) => {
        // Parse winston log format
        const match = line.match(
          /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) \[(\w+)\] (.+)$/
        );

        if (match) {
          return {
            id:        `log_${i}`,
            timestamp: new Date(match[1]).toISOString(),
            level:     match[2].toLowerCase(),
            message:   match[3],
          };
        }

        return {
          id:        `log_${i}`,
          timestamp: new Date().toISOString(),
          level:     "info",
          message:   line,
        };
      });

      res.json({ success: true, data: logs.reverse() });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: "Failed to read logs",
      });
    }
  },

  // DELETE /api/logs
  clearLogs(req: Request, res: Response) {
    const logFile = path.join(process.cwd(), "logs", "combined.log");
    try {
      fs.writeFileSync(logFile, "");
      res.json({ success: true, message: "Logs cleared" });
    } catch {
      res.status(500).json({ success: false, error: "Failed to clear logs" });
    }
  },
};