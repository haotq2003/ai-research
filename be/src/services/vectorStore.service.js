import { pool } from '../config/db.js';
import { generateEmbedding } from './embedding.service.js';
import pgvector from 'pgvector/pg';

class PostgresVectorStore {
  // 1. Tạo bản ghi phiên nghiên cứu mới trong bảng investigations (Trạng thái PENDING)
  async createInvestigation(topic, userId = null) {
    const res = await pool.query(
      `INSERT INTO investigations (topic, user_id, status) VALUES ($1, $2, 'PENDING') RETURNING id`,
      [topic, userId]
    );
    return res.rows[0].id;
  }

  // Cập nhật trạng thái phiên nghiên cứu (IN_PROGRESS, FAILED, ...)
  async updateStatus(investigationId, status) {
    await pool.query(
      `UPDATE investigations SET status = $1 WHERE id = $2`,
      [status, investigationId]
    );
  }

  // Lấy chi tiết phiên nghiên cứu
  async getInvestigation(investigationId) {
    const res = await pool.query(
      `SELECT id, user_id, topic, status, report_data, sources, created_at FROM investigations WHERE id = $1`,
      [investigationId]
    );
    return res.rows[0];
  }

  // 2. Nạp các chunk vào database và gán nhãn vector
  async addChunks(investigationId, chunksWithMetadata) {
    console.log(`[PostgresVectorStore] Đang tạo vector và lưu ${chunksWithMetadata.length} chunks vào DB...`);
    const client = await pool.connect();

    try {
      await pgvector.registerTypes(client);

      for (const item of chunksWithMetadata) {
        const vector = await generateEmbedding(item.content);
        if (vector) {
          await client.query(
            `INSERT INTO research_chunks (investigation_id, content, source_url, embedding)
             VALUES ($1, $2, $3, $4)`,
            [investigationId, item.content, item.sourceUrl || '', pgvector.toSql(vector)]
          );
        }
      }
    } finally {
      client.release();
    }
  }

  // 3. Tìm kiếm ngữ nghĩa bằng toán tử Cosine (<=>) của pgvector
  async similaritySearch(investigationId, query, topK = 4) {
    console.log(`[PostgresVectorStore] Đang truy vấn vector SQL cho: "${query}"...`);
    const queryVector = await generateEmbedding(query);

    const client = await pool.connect();
    try {
      await pgvector.registerTypes(client);

      // Công thức Cosine Similarity: 1 - (embedding <=> queryVector)
      const res = await client.query(
        `SELECT content, source_url, 1 - (embedding <=> $1) AS similarity
         FROM research_chunks
         WHERE investigation_id = $2
         ORDER BY embedding <=> $1 ASC
         LIMIT $3`,
        [pgvector.toSql(queryVector), investigationId, topK]
      );

      return res.rows.map(row => ({
        content: row.content,
        sourceUrl: row.source_url,
        similarity: parseFloat(row.similarity)
      }));
    } finally {
      client.release();
    }
  }

  // 4. Lưu kết quả báo cáo hoàn chỉnh và danh sách nguồn uy tín
  async saveFinalReport(investigationId, reportData, sources) {
    await pool.query(
      `UPDATE investigations 
       SET report_data = $1, sources = $2, status = 'COMPLETED' 
       WHERE id = $3`,
      [
        typeof reportData === 'string' ? reportData : JSON.stringify(reportData),
        typeof sources === 'string' ? sources : JSON.stringify(sources || []),
        investigationId
      ]
    );
  }

  // 5. Lấy danh sách lịch sử các phiên nghiên cứu (chỉ của riêng user đăng nhập)
  async listInvestigations(userId, limit = 50) {
    if (!userId) {
      // Nếu chưa đăng nhập, không trả về lịch sử chung
      return [];
    }

    const res = await pool.query(
      `SELECT id, topic, status, created_at, 
              (report_data IS NOT NULL) AS has_report
       FROM investigations 
       WHERE user_id = $1
       ORDER BY created_at DESC 
       LIMIT $2`,
      [userId, limit]
    );
    return res.rows;
  }

  // 6. Xóa một phiên nghiên cứu (đảm bảo đúng chủ sở hữu)
  async deleteInvestigation(investigationId, userId = null) {
    if (userId) {
      await pool.query(
        `DELETE FROM investigations WHERE id = $1 AND user_id = $2`,
        [investigationId, userId]
      );
    } else {
      await pool.query(
        `DELETE FROM investigations WHERE id = $1`,
        [investigationId]
      );
    }
  }
}

export const vectorStore = new PostgresVectorStore();