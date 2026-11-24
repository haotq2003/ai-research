import { Redis } from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();

export const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  maxRetriesPerRequest: null, // Bắt buộc cho BullMQ
};

// Redis Client chuyên dùng để Publish sự kiện
export const redisPublisher = new Redis(redisConfig);

redisPublisher.on('connect', () => {
  console.log('[Redis Publisher] Kết nối thành công!');
});

redisPublisher.on('error', (err) => {
  console.error('[Redis Publisher] Lỗi kết nối:', err.message);
});

// Hàm tạo Redis Subscriber cho từng kết nối SSE riêng biệt
export function createRedisSubscriber() {
  const sub = new Redis(redisConfig);
  sub.on('error', (err) => {
    console.error('[Redis Subscriber] Lỗi kết nối:', err.message);
  });
  return sub;
}

// Helper gửi event tiến trình qua kênh investigation:<id>
export async function publishInvestigationEvent(investigationId, eventData) {
  try {
    const channel = `investigation:${investigationId}`;
    await redisPublisher.publish(channel, JSON.stringify(eventData));
  } catch (err) {
    console.error(`[Redis Pub/Sub] Lỗi publish vào kênh investigation:${investigationId}:`, err.message);
  }
}
