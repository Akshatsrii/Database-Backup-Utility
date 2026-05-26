import cron  from "node-cron";
import { v4 as uuidv4 } from "uuid";
import { logger }        from "../config/logger";
import { backupService } from "./backup/backup.service";
import { frequencyToCron, getNextRunTime } from "../utils/cronHelper";
import type {
  Schedule,
  CreateScheduleDto,
  DbConnection,
} from "../types";

export const scheduleStore: Schedule[]     = [];
export const connectionStore: DbConnection[] = [];

// Active cron tasks map
const activeTasks = new Map<string, cron.ScheduledTask>();

export class SchedulerService {

  getAllSchedules(): Schedule[] {
    return scheduleStore;
  }

  createSchedule(
    dto: CreateScheduleDto,
    connection: DbConnection
  ): Schedule {
    const cronExpr = frequencyToCron(dto.frequency);
    const nextRun  = getNextRunTime(cronExpr);

    const schedule: Schedule = {
      id:             uuidv4(),
      connectionId:   dto.connectionId,
      connectionName: connection.name,
      frequency:      dto.frequency,
      cronExpression: cronExpr,
      backupType:     dto.backupType,
      enabled:        true,
      nextRun:        nextRun.toISOString(),
      createdAt:      new Date().toISOString(),
    };

    scheduleStore.push(schedule);
    this.startTask(schedule, connection);

    logger.info(`Schedule created: ${schedule.id} (${dto.frequency})`);
    return schedule;
  }

  toggleSchedule(id: string, enabled: boolean): Schedule {
    const schedule = scheduleStore.find((s) => s.id === id);
    if (!schedule) throw new Error("Schedule not found");

    schedule.enabled = enabled;

    if (!enabled) {
      this.stopTask(id);
      logger.info(`Schedule paused: ${id}`);
    } else {
      const connection = connectionStore.find(
        (c) => c.id === schedule.connectionId
      );
      if (connection) {
        this.startTask(schedule, connection);
        logger.info(`Schedule resumed: ${id}`);
      }
    }

    return schedule;
  }

  deleteSchedule(id: string): void {
    const idx = scheduleStore.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error("Schedule not found");

    this.stopTask(id);
    scheduleStore.splice(idx, 1);
    logger.info(`Schedule deleted: ${id}`);
  }

  private startTask(schedule: Schedule, connection: DbConnection): void {
    if (!cron.validate(schedule.cronExpression)) {
      logger.error(`Invalid cron: ${schedule.cronExpression}`);
      return;
    }

    const task = cron.schedule(schedule.cronExpression, async () => {
      logger.info(`Running scheduled backup: ${schedule.id}`);

      schedule.lastRun = new Date().toISOString();
      schedule.nextRun = getNextRunTime(schedule.cronExpression).toISOString();

      await backupService.createBackup(
        connection,
        {
          connectionId: connection.id,
          backupType:   schedule.backupType,
          storageType:  "local",
        },
        (msg) => logger.info(msg)
      );
    });

    activeTasks.set(schedule.id, task);
  }

  private stopTask(id: string): void {
    const task = activeTasks.get(id);
    if (task) {
      task.stop();
      activeTasks.delete(id);
    }
  }
}

export const schedulerService = new SchedulerService();