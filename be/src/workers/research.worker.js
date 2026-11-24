import { Worker } from 'bullmq';
import { redisConfig, publishInvestigationEvent } from '../config/redis.js';
import { RESEARCH_QUEUE_NAME } from '../queues/research.queue.js';
import { generateResearchPlan } from '../services/planner.service.js';
import { searchInternet } from '../services/search.service.js';
import { enrichItemsWithScrapedContent } from '../services/scraper.service.js';
import { synthesizeReport } from '../services/gemini.service.js';
import { chunkText } from '../services/chunk.service.js';
import { vectorStore } from '../services/vectorStore.service.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const researchWorker = new Worker(
  RESEARCH_QUEUE_NAME,
  async (job) => {
    const { investigationId, topic } = job.data;
    console.log(`\n================ [Worker] BẮT ĐẦU XỬ LÝ JOB ${job.id} ================\nĐề tài: "${topic}"\nInvestigation ID: ${investigationId}`);

    try {
      // 1. Cập nhật trạng thái bắt đầu
      await vectorStore.updateStatus(investigationId, 'IN_PROGRESS');
      await publishInvestigationEvent(investigationId, {
        type: 'PROGRESS',
        step: 'START',
        message: `Bắt đầu phiên nghiên cứu: "${topic}"`,
      });

      // 2. Planning: Lập kế hoạch
      await publishInvestigationEvent(investigationId, {
        type: 'PROGRESS',
        step: 'PLANNING',
        message: 'Đang phân tích đề tài và lập kế hoạch nghiên cứu...',
      });

      const subQueries = await generateResearchPlan(topic);
      console.log('[Worker] Kế hoạch chốt:', subQueries);

      await publishInvestigationEvent(investigationId, {
        type: 'PROGRESS',
        step: 'PLANNING_DONE',
        message: `Đã lập kế hoạch gồm ${subQueries.length} câu hỏi phụ`,
        data: { subQueries },
      });

      // 3. Vòng lặp thu thập thông tin và lưu vào pgvector
      const allSources = [];
      for (let i = 0; i < subQueries.length; i++) {
        const subQuery = subQueries[i];
        const stepNum = i + 1;
        const totalSteps = subQueries.length;

        console.log(`\n[Worker] [Bước ${stepNum}/${totalSteps}] Tìm kiếm: "${subQuery}"`);
        await publishInvestigationEvent(investigationId, {
          type: 'PROGRESS',
          step: 'SEARCHING',
          message: `[Bước ${stepNum}/${totalSteps}] Đang tìm kiếm thông tin: "${subQuery}"`,
          data: { step: stepNum, totalSteps, query: subQuery },
        });

        const searchResult = await searchInternet(subQuery);
        allSources.push(...searchResult.sources);

        // Bóc tách nội dung chi tiết từ các trang web  nguồn
        await publishInvestigationEvent(investigationId, {
          type: 'PROGRESS',
          step: 'SCRAPING',
          message: `[Bước ${stepNum}/${totalSteps}] Đang đọc hiểu và trích xuất nội dung từ ${searchResult.items?.length || 0} trang web nguồn...`,
          data: { step: stepNum, totalSteps, itemsCount: searchResult.items?.length || 0 },
        });

        const enrichedItems = await enrichItemsWithScrapedContent(searchResult.items || []);

        // Cắt chunk theo từng bài viết chi tiết kèm đúng URL của bài đó
        const chunksWithMeta = [];
        for (const item of enrichedItems) {
          const itemText = `Tiêu đề: ${item.title}\nNội dung: ${item.content || item.snippet}\nNguồn: ${item.url}`;
          const subChunks = chunkText(itemText, 600, 100);
          for (const c of subChunks) {
            chunksWithMeta.push({
              content: c,
              sourceUrl: item.url,
            });
          }
        }

        await publishInvestigationEvent(investigationId, {
          type: 'PROGRESS',
          step: 'EMBEDDING',
          message: `[Bước ${stepNum}/${totalSteps}] Đang tạo vector và lưu ${chunksWithMeta.length} đoạn văn bản vào pgvector...`,
          data: { step: stepNum, totalSteps, chunksCount: chunksWithMeta.length },
        });

        await vectorStore.addChunks(investigationId, chunksWithMeta);
        await sleep(1000);
      }

      // 4. Truy vấn RAG bằng pgvector: Lấy 8 dẫn chứng tiêu biểu nhất
      await publishInvestigationEvent(investigationId, {
        type: 'PROGRESS',
        step: 'RETRIEVAL',
        message: 'Đang truy vấn các dẫn chứng có độ tương đồng ngữ nghĩa cao nhất...',
      });

      const relevantChunks = await vectorStore.similaritySearch(investigationId, topic, 8);
      const ragContext = relevantChunks
        .map((item, idx) => `[Dẫn chứng ${idx + 1} - Độ tương đồng: ${item.similarity.toFixed(3)} - Nguồn: ${item.sourceUrl}]\n${item.content}`)
        .join('\n\n');

      // 5. Synthesis: Tổng hợp báo cáo qua Gemini
      await publishInvestigationEvent(investigationId, {
        type: 'PROGRESS',
        step: 'SYNTHESIS',
        message: 'Đang tổng hợp báo cáo chuyên sâu hoàn chỉnh từ các dẫn chứng...',
      });

      const structuredReport = await synthesizeReport(topic, ragContext);

      // 6. CHỈ CHỌN CÁC NGUỒN CỦA NHỮNG DẪN CHỨNG THỰC SỰ ĐƯỢC RAG ĐƯA VÀO BÁO CÁO
      const verifiedSourcesMap = new Map();
      for (const chunk of relevantChunks) {
        if (chunk.sourceUrl) {
          const found = allSources.find(s => s.url === chunk.sourceUrl);
          const title = found?.title || chunk.sourceUrl;
          verifiedSourcesMap.set(chunk.sourceUrl, {
            title,
            url: chunk.sourceUrl
          });
        }
      }
      if (verifiedSourcesMap.size === 0) {
        allSources.slice(0, 5).forEach(s => verifiedSourcesMap.set(s.url, s));
      }
      const verifiedSources = Array.from(verifiedSourcesMap.values());

      // Lưu kết quả cuối cùng vào DB
      await vectorStore.saveFinalReport(investigationId, structuredReport, verifiedSources);

      // 7. Bắn event kết quả cuối cùng qua Pub/Sub
      await publishInvestigationEvent(investigationId, {
        type: 'RESULT',
        step: 'DONE',
        message: 'Nghiên cứu hoàn tất thành công!',
        data: {
          investigationId,
          topic,
          report: structuredReport,
          sources: verifiedSources,
        },
      });

      console.log(`[Worker] Đã hoàn thành Job ${job.id} thành công!`);
    } catch (err) {
      console.error(`[Worker] Lỗi xử lý Job ${job.id}:`, err.message);
      await vectorStore.updateStatus(investigationId, 'FAILED');
      await publishInvestigationEvent(investigationId, {
        type: 'ERROR',
        step: 'FAILED',
        message: 'Đã xảy ra lỗi trong quá trình nghiên cứu',
        error: err.message,
      });
      throw err;
    }
  },
  {
    connection: redisConfig,
    concurrency: 2, // Cho phép xử lý đồng thời 2 job
  }
);

researchWorker.on('completed', (job) => {
  console.log(`[Worker Event] Job ${job.id} đã hoàn tất.`);
});

researchWorker.on('failed', (job, err) => {
  console.error(`[Worker Event] Job ${job?.id} thất bại:`, err.message);
});
