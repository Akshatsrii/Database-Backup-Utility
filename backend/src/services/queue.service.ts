import { logger } from "../config/logger";

interface Job {
  id: string;
  task: () => Promise<void>;
  priority: number;
}

export class QueueService {
  private queue: Job[] = [];
  private activeCount = 0;
  private readonly MAX_CONCURRENT = 3;

  public addJob(id: string, priority: number, task: () => Promise<void>) {
    this.queue.push({ id, task, priority });
    this.queue.sort((a, b) => b.priority - a.priority); // higher priority first
    logger.info(`Job added to queue: ${id}. Queue length: ${this.queue.length}`);
    this.processQueue();
  }

  private processQueue() {
    if (this.activeCount >= this.MAX_CONCURRENT || this.queue.length === 0) {
      return;
    }

    const job = this.queue.shift();
    if (!job) return;

    this.activeCount++;
    logger.info(`Starting job: ${job.id}. Active: ${this.activeCount}/${this.MAX_CONCURRENT}`);

    job.task()
      .catch((err) => logger.error(`Job ${job.id} failed:`, { err }))
      .finally(() => {
        this.activeCount--;
        logger.info(`Finished job: ${job.id}. Active: ${this.activeCount}/${this.MAX_CONCURRENT}`);
        this.processQueue();
      });
  }
}

export const queueService = new QueueService();
