import { Request, Response } from "express";
import { auditService } from "../services/audit.service";
import { parse } from "json2csv";

export const auditController = {
  getLogs(req: Request, res: Response) {
    res.json({ success: true, data: auditService.getLogs() });
  },

  exportCsv(req: Request, res: Response) {
    const logs = auditService.getLogs();
    if (logs.length === 0) {
      return res.status(404).json({ success: false, error: "No audit logs to export" });
    }

    try {
      const csv = parse(logs, { fields: ["timestamp", "user", "action", "resourceType", "resourceId", "details"] });
      res.header('Content-Type', 'text/csv');
      res.attachment('audit_trail.csv');
      return res.send(csv);
    } catch (err) {
      return res.status(500).json({ success: false, error: "Failed to generate CSV" });
    }
  }
};
