import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { withRetry } from '../utils/retry.js';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Định nghĩa cấu trúc báo cáo nghiên cứu chuyên sâu đa tầng
const researchReportSchema = {
  type: Type.OBJECT,
  properties: {
    topic: { type: Type.STRING, description: 'Chủ đề nghiên cứu chuẩn mực, chính xác' },
    executiveSummary: { 
      type: Type.STRING, 
      description: 'Tóm lược điều hành chuyên sâu (2-3 đoạn văn dài). Phân tích bối cảnh, mốc thời gian, nguyên nhân gốc rễ và bức tranh toàn cảnh.' 
    },
    keyFindings: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Danh sách 5-7 luận điểm cốt lõi. Mỗi mục là một đoạn phân tích cụ thể, có số liệu, dẫn chứng thực tế hoặc trích dẫn sự kiện.'
    },
    detailedAnalysis: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          pillar: { type: Type.STRING, description: 'Tên khía cạnh/trụ cột phân tích (Ví dụ: "Nguyên nhân kinh tế - xã hội", "Diễn biến & Thiệt hại thực tế", "Phản ứng chính sách & Giải pháp")' },
          content: { type: Type.STRING, description: 'Phân tích chuyên sâu chi tiết (từ 1-2 đoạn văn phân tích thấu đáo, chỉ rõ nguyên nhân và hệ quả)' }
        },
        required: ['pillar', 'content']
      },
      description: 'Phân tích đa chiều theo từng trụ cột quan trọng nhất của đề tài'
    },
    prosAndCons: {
      type: Type.OBJECT,
      properties: {
        advantages: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING },
          description: 'Góc nhìn tích cực, tiềm năng, bài học rút ra hoặc những chuyển biến có lợi'
        },
        challenges: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING },
          description: 'Rủi ro nghiêm trọng, thách thức, thiệt hại hoặc điểm nghẽn chưa được giải quyết'
        }
      },
      required: ['advantages', 'challenges']
    },
    recommendations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Danh sách 3-5 khuyến nghị hành động hoặc bài học chiến lược'
    },
    conclusion: { 
      type: Type.STRING, 
      description: 'Kết luận chiến lược và dự báo xu hướng tiếp theo trong trung và dài hạn.' 
    }
  },
  required: ['topic', 'executiveSummary', 'keyFindings', 'detailedAnalysis', 'prosAndCons', 'recommendations', 'conclusion']
};

export async function synthesizeReport(topic, rawContent) {
  const prompt = `
Bạn là chuyên gia phân tích điều tra độc lập cao cấp (Senior Research Analyst).
Nhiệm vụ của bạn là tổng hợp các bằng chứng thu thập được từ Internet thành một bản Báo Cáo Nghiên Cứu Chuyên Sâu, Toàn Diện và Thấu Đáo về đề tài: "${topic}".

DƯỚI ĐÂY LÀ CÁC DẪN CHỨNG ĐÃ THU THẬP TỪ THỰC TẾ:
--------------------------------------------------
${rawContent}
--------------------------------------------------

YÊU CẦU BIÊN SOẠN BÁO CÁO (TUYỆT ĐỐI TUÂN THỦ):
1. ĐỘ SÂU & CHI TIẾT: Báo cáo KHÔNG ĐƯỢC sơ sài hay chung chung. Mỗi phần cần có phân tích có chiều sâu, chỉ rõ nguyên nhân - hệ quả, dẫn chứng số liệu, mốc thời gian, tổ chức/nhân vật liên quan nếu có trong dữ liệu.
2. TÓM LƯỢC ĐIỀU HÀNH (executiveSummary): Viết mạch lạc, đa chiều, bối cảnh rõ ràng (ít nhất 2 đoạn văn dài).
3. LUẬN ĐIỂM CỐT LÕI (keyFindings): Cung cấp từ 5 - 7 phát hiện then chốt. Mỗi mục giải thích rõ ràng và có dẫn chứng đi kèm, không viết cộc lốc một câu.
4. PHÂN TÍCH CHUYÊN SÂU (detailedAnalysis): Chia làm 2 - 4 trụ cột quan trọng (ví dụ: khía cạnh bối cảnh, khía cạnh kinh tế/xã hội, khía cạnh chính sách/hạ tầng). Mỗi trụ cột phải có đoạn văn phân tích lập luận thấu đáo.
5. ĐÁNH GIÁ ĐA CHIỀU (prosAndCons): Nhìn nhận khách quan cả mặt tác động tích cực/bài học lẫn tiêu cực/thách thức.
6. KHUYẾN NGHỊ CHIẾN LƯỢC (recommendations): 3 - 5 bài học hoặc giải pháp thực tiễn.
7. KẾT LUẬN (conclusion): Nhận định đúc kết và dự báo xu hướng tương lai.
`;

  const response = await withRetry(async () => {
    return await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        systemInstruction: 'Bạn là chuyên viên nghiên cứu và phân tích điều tra cao cấp. Hãy phản ánh trung thực số liệu, lập luận sắc bén và phân tích đa chiều với độ sâu tương đương một bài nghiên cứu chiến lược.',
        responseMimeType: 'application/json',
        responseSchema: researchReportSchema,
      }
    });
  }, { retries: 2, delayMs: 2000, label: 'Gemini Synthesis' });

  return JSON.parse(response.text);
}