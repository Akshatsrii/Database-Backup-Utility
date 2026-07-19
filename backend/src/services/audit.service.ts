import { v4 as uuidv4 } from "uuid";

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  resourceType: "backup" | "connection" | "schedule";
  resourceId: string;
  details: string;
  user: string;
}

export class AuditService {
  private logs: AuditLog[] = [];

  logAction(
    action: string,
    resourceType: AuditLog["resourceType"],
    resourceId: string,
    details: string,
    user: string = "system"
  ) {
    const entry: AuditLog = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      action,
      resourceType,
      resourceId,
      details,
      user
    };
    this.logs.unshift(entry); // newest first
  }

  getLogs(): AuditLog[] {
    return this.logs;
  }
}

export const auditService = new AuditService();
