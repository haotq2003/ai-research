import { Queue } from 'bullmq';
import { redisConfig } from '../config/redis.js';

export const RESEARCH_QUEUE_NAME = 'research-queue';

export const researchQueue = new Queue(RESEARCH_QUEUE_NAME, {
  connection: redisConfig,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 500,
    attempts: 1, // Không tự động retry nhiều lần để tránh tốn API token Gemini/SearchApi
  },
});
