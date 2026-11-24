import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateResearchPlan(topic) {
  console.log(`[Planner] Đang lập kế hoạch nghiên cứu cho đề tài: "${topic}"...`);

  const prompt = `
Bạn là chuyên gia lập kế hoạch điều tra thông tin (Senior Research Planner).

Nhiệm vụ: Phân tích đề tài "${topic}" và lập từ 2 đến 3 câu truy vấn tìm kiếm Google độc lập (sub-queries).
Mục tiêu là thu thập thông tin toàn diện, sâu sắc, bao quát mọi khía cạnh quan trọng của đề tài.

HƯỚNG DẪN TẠO TRUY VẤN:
- Mỗi câu truy vấn PHẢI gắn liền với từ khóa chính của đề tài "${topic}", TUYỆT ĐỐI KHÔNG tạo câu hỏi chung chung hoặc lạc đề.
- Khía cạnh 1: Bối cảnh, nguyên nhân nguồn cơn, sự kiện châm ngòi hoặc bản chất vấn đề.
- Khía cạnh 2: Số liệu thực tế, diễn biến, thiệt hại hoặc phân tích tác động/ưu nhược điểm đa chiều.
- Khía cạnh 3: Phản ứng của các bên liên quan, giải pháp chính sách, góc nhìn chuyên gia hoặc bài học tương lai.
- Sử dụng ngôn từ tìm kiếm tự nhiên, chính xác, chuẩn từ khóa như chuyên gia tra cứu Google.
- Chỉ tạo từ 2 đến 3 câu truy vấn. Không tạo quá 3 câu.
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subQueries: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Danh sách 2-3 câu hỏi tìm kiếm chi tiết'
            }
          },
          required: ['subQueries']
        }
      }
    });

    const parsed = JSON.parse(response.text);
    let queries = parsed.subQueries;

    // 1. Kiểm tra tính hợp lệ (Defensive Validation)
    if (!Array.isArray(queries)) {
      queries = [];
    }

    // 2. Làm sạch: bỏ chuỗi rỗng, khoảng trắng thừa
    queries = queries
      .map(q => (typeof q === 'string' ? q.trim() : ''))
      .filter(q => q.length > 0);

    // 3. Fallback an toàn nếu LLM không sinh được query nào
    if (queries.length === 0) {
      console.warn('[Planner] LLM không sinh được sub-queries, fallback về topic gốc.');
      return [topic];
    }

    // 4. Khống chế tối đa 3 queries để bảo vệ quota & chi phí API
    if (queries.length > 3) {
      queries = queries.slice(0, 3);
    }

    console.log('[Planner] Kế hoạch chốt:', queries);
    return queries;

  } catch (error) {
    console.error('[Planner] Lỗi khi tạo kế hoạch, fallback về topic gốc:', error.message);
    // Khi có lỗi mạng/API, không làm sập flow mà vẫn cho Agent chạy tiếp với topic gốc
    return [topic];
  }
}