/**
 * Thực thi một hàm bất đồng bộ với cơ chế Retry và Exponential Backoff
 * @param {Function} fn - Hàm async cần thực thi
 * @param {Object} options - Cấu hình retry
 * @param {number} options.retries - Số lần thử lại tối đa (mặc định 2)
 * @param {number} options.delayMs - Độ trễ ban đầu tính bằng ms (mặc định 1000)
 * @param {number} options.backoff - Hệ số nhân thời gian chờ (mặc định 2)
 * @param {string} options.label - Nhãn để ghi log
 */
export async function withRetry(fn, { retries = 2, delayMs = 1000, backoff = 2, label = 'Tác vụ' } = {}) {
  let attempt = 0;
  let currentDelay = delayMs;

  while (true) {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      if (attempt > retries) {
        console.error(`[Retry] ${label} thất bại sau ${retries} lần thử lại:`, error.message);
        throw error;
      }

      console.warn(`[Retry] ${label} gặp sự cố (lần ${attempt}/${retries}): "${error.message}". Thử lại sau ${currentDelay}ms...`);
      await new Promise(res => setTimeout(res, currentDelay));
      currentDelay *= backoff;
    }
  }
}
