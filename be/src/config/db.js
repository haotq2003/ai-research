import pkg from 'pg';
import pgvector from 'pgvector/pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pkg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Hàm khởi tạo các bảng và extension vector
export async function initDatabase() {
  const client = await pool.connect();
  try {
    console.log('[Database] Đang khởi tạo extension và các bảng...');

    // 1. Kích hoạt extension vector trước khi đăng ký types
    await client.query('CREATE EXTENSION IF NOT EXISTS vector;');

    // 2. Đăng ký types cho pgvector
    await pgvector.registerTypes(client);

    // 2. Bảng người dùng (Users)
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 3. Bảng lưu các phiên nghiên cứu
    await client.query(`
      CREATE TABLE IF NOT EXISTS investigations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        topic TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'COMPLETED',
        report_data JSONB,
        sources JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Bổ sung cột user_id nếu bảng investigations đã tồn tại từ các phiên bản trước
    await client.query(`
      ALTER TABLE investigations 
      ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
    `);

    // 3. Bảng lưu các mẩu dữ liệu (Chunks) và Vector ngữ nghĩa
    // gemini-embedding-001 hoặc text-embedding-004 đều xuất ra vector 768 chiều
    await client.query(`
      CREATE TABLE IF NOT EXISTS research_chunks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        investigation_id UUID REFERENCES investigations(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        source_url TEXT,
        embedding vector(768),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 4. Đánh chỉ mục HNSW để truy vấn vector cực nhanh
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_research_chunks_embedding 
      ON research_chunks USING hnsw (embedding vector_cosine_ops);
    `);

    console.log('[Database] Kết nối PostgreSQL + pgvector thành công!');
  } catch (error) {
    console.error('[Database] Lỗi kết nối hoặc khởi tạo bảng:', error.message);
  } finally {
    client.release();
  }
}