import { researchQueue } from '../queues/research.queue.js';
import { vectorStore } from '../services/vectorStore.service.js';
import { createRedisSubscriber } from '../config/redis.js';

// POST /api/research - Tiếp nhận yêu cầu, đẩy vào BullMQ và trả về 202 Accepted
export async function handleResearch(req, res) {
  try {
    const { topic } = req.body;
    if (!topic || typeof topic !== 'string' || !topic.trim()) {
      return res.status(400).json({ error: 'Cần cung cấp "topic" hợp lệ để nghiên cứu' });
    }

    const cleanTopic = topic.trim();
    console.log(`\n[API Producer] Tiếp nhận đề tài: "${cleanTopic}"`);

    // 1. Tạo bản ghi phiên điều tra trong Database với trạng thái PENDING (gắn user_id nếu đã đăng nhập)
    const userId = req.user?.id || null;
    const investigationId = await vectorStore.createInvestigation(cleanTopic, userId);
    console.log(`[API Producer] Đã tạo phiên investigationId: ${investigationId} (user: ${userId || 'Guest'}) (PENDING)`);

    // 2. Đẩy tác vụ vào BullMQ queue
    await researchQueue.add('investigate', {
      investigationId,
      topic: cleanTopic,
    });
    console.log(`[API Producer] Đã đẩy job vào research-queue thành công.`);

    // 3. Trả về ngay HTTP 202 Accepted cho client trong tích tắc (~10ms)
    return res.status(202).json({
      success: true,
      message: 'Yêu cầu nghiên cứu đã được tiếp nhận và đưa vào hàng đợi xử lý.',
      investigationId,
      status: 'PENDING',
    });
  } catch (error) {
    console.error('[API Producer] Lỗi tiếp nhận yêu cầu:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Lỗi server nội bộ',
    });
  }
}

// GET /api/research/:id/stream - Truyền phát tiến trình thời gian thực bằng SSE
export async function handleResearchStream(req, res) {
  const { id } = req.params;

  try {
    // 1. Kiểm tra phiên nghiên cứu có tồn tại trong database không
    const investigation = await vectorStore.getInvestigation(id);
    if (!investigation) {
      return res.status(404).json({ error: 'Không tìm thấy phiên nghiên cứu tương ứng' });
    }

    // 2. Thiết lập HTTP Headers đặc thù của Server-Sent Events (SSE)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Ngăn chặn buffering ở reverse proxy
    res.flushHeaders();

    console.log(`[SSE Stream] Client đã kết nối theo dõi tiến trình: ${id}`);

    // Trường hợp 1: Tác vụ đã hoàn tất từ trước khi client kịp mở stream
    if (investigation.status === 'COMPLETED') {
      res.write(`data: ${JSON.stringify({
        type: 'RESULT',
        step: 'DONE',
        message: 'Nghiên cứu đã hoàn tất trước đó.',
        data: {
          investigationId: investigation.id,
          topic: investigation.topic,
          report: investigation.report_data,
          sources: investigation.sources,
        },
      })}\n\n`);
      return res.end();
    }

    // Trường hợp 2: Tác vụ đã thất bại từ trước
    if (investigation.status === 'FAILED') {
      res.write(`data: ${JSON.stringify({
        type: 'ERROR',
        step: 'FAILED',
        message: 'Phiên nghiên cứu này đã thất bại trước đó.',
      })}\n\n`);
      return res.end();
    }

    // 3. Gửi thông báo kết nối thành công ban đầu cho Client
    res.write(`data: ${JSON.stringify({
      type: 'CONNECTED',
      message: `Đã kết nối luồng theo dõi phiên ${id}`,
      status: investigation.status,
    })}\n\n`);

    // Gửi định kỳ heartbeat (mỗi 15s) để chống ngắt kết nối ECONNRESET / timeout ở proxy
    const heartbeatTimer = setInterval(() => {
      if (!res.writableEnded) {
        res.write(': keep-alive\n\n');
      }
    }, 15000);

    // 4. Tạo Redis Subscriber riêng cho kết nối SSE này
    const sub = createRedisSubscriber();
    const channel = `investigation:${id}`;
    let isCleanedUp = false;

    const cleanup = async () => {
      if (isCleanedUp) return;
      isCleanedUp = true;
      clearInterval(heartbeatTimer);
      try {
        await sub.unsubscribe(channel);
        sub.disconnect();
        console.log(`[SSE Stream] Đã dọn dẹp subscriber và giải phóng socket cho phiên: ${id}`);
      } catch (err) {
        // bỏ qua lỗi dọn dẹp
      }
    };

    // Đăng ký kênh Redis
    await sub.subscribe(channel);

    // Lắng nghe sự kiện từ Worker phát vào Redis
    sub.on('message', (chan, message) => {
      if (chan === channel && !res.writableEnded) {
        res.write(`data: ${message}\n\n`);

        try {
          const parsed = JSON.parse(message);
          // Nếu tác vụ đã kết thúc (thành công hoặc lỗi), cho client thời gian nhận trọn vẹn rồi mới đóng stream
          if (parsed.type === 'RESULT' || parsed.type === 'ERROR') {
            setTimeout(async () => {
              await cleanup();
              if (!res.writableEnded) {
                res.end();
              }
            }, 1200);
          }
        } catch (e) {
          // Bỏ qua lỗi parse
        }
      }
    });

    // 5. Quản lý vòng đời kết nối: Khách đóng tab / ngắt mạng
    req.on('close', () => {
      console.log(`[SSE Stream] Client đóng kết nối phiên: ${id}`);
      cleanup();
    });

  } catch (error) {
    console.error(`[SSE Stream] Lỗi thiết lập stream cho phiên ${id}:`, error);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Không thể thiết lập kết nối SSE' });
    }
    res.end();
  }
}

// GET /api/research - Lấy danh sách lịch sử các phiên nghiên cứu (chỉ khi đã đăng nhập)
export async function handleListInvestigations(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      // Khách chưa đăng nhập -> không trả về lịch sử
      return res.json({
        success: true,
        data: [],
        isGuest: true,
      });
    }

    const list = await vectorStore.listInvestigations(userId, 50);
    return res.json({
      success: true,
      data: list,
      isGuest: false,
    });
  } catch (error) {
    console.error('[API History] Lỗi lấy danh sách lịch sử:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

// GET /api/research/:id - Lấy chi tiết phiên nghiên cứu kèm báo cáo
export async function handleGetInvestigation(req, res) {
  try {
    const { id } = req.params;
    const item = await vectorStore.getInvestigation(id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy phiên nghiên cứu' });
    }
    return res.json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error('[API History] Lỗi lấy chi tiết phiên:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

// DELETE /api/research/:id - Xóa một phiên nghiên cứu
export async function handleDeleteInvestigation(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user?.id || null;
    await vectorStore.deleteInvestigation(id, userId);
    return res.json({
      success: true,
      message: 'Đã xóa phiên nghiên cứu thành công',
    });
  } catch (error) {
    console.error('[API History] Lỗi xóa phiên nghiên cứu:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}