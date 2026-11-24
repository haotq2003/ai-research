import express from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { 
  handleResearch, 
  handleResearchStream,
  handleListInvestigations,
  handleGetInvestigation,
  handleDeleteInvestigation
} from './controllers/research.controller.js';
import {
  handleRegister,
  handleLogin,
  handleGetMe
} from './controllers/auth.controller.js';
import { optionalAuth, requireAuth } from './middlewares/auth.middleware.js';
import { initDatabase } from './config/db.js';
// Khởi động BullMQ Worker chạy ngầm cùng tiến trình
import './workers/research.worker.js';

dotenv.config();

const app = express();

// 1. Bảo mật HTTP Headers
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

// 2. Chống spam: Giới hạn tần suất tạo phiên nghiên cứu mới (bảo vệ chi phí API)
const createResearchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 30, // Tối đa 30 request / 15 phút per IP
  message: {
    success: false,
    error: 'Bạn đã gửi quá nhiều yêu cầu nghiên cứu. Vui lòng thử lại sau 15 phút.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Giới hạn tần suất đăng ký/đăng nhập
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    error: 'Quá nhiều yêu cầu đăng nhập/đăng ký. Vui lòng thử lại sau ít phút.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Giới hạn tần suất chung cho toàn bộ API
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: {
    success: false,
    error: 'Quá nhiều yêu cầu từ IP của bạn. Vui lòng chậm lại.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 3. Middleware CORS cho phép Frontend gọi API và SSE (bổ sung header Authorization)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: '1mb' }));
app.use('/api', generalLimiter);

// Auth Routes
app.post('/api/auth/register', authLimiter, handleRegister);
app.post('/api/auth/login', authLimiter, handleLogin);
app.get('/api/auth/me', requireAuth, handleGetMe);

// Research Routes (optionalAuth nhận diện user đăng nhập hoặc khách vãng lai)
app.get('/api/research', optionalAuth, handleListInvestigations);
app.post('/api/research', optionalAuth, createResearchLimiter, handleResearch);
app.get('/api/research/:id', handleGetInvestigation);
app.delete('/api/research/:id', optionalAuth, handleDeleteInvestigation);
app.get('/api/research/:id/stream', handleResearchStream);

// Middleware xử lý lỗi tập trung
app.use((err, req, res, next) => {
  console.error('[Express Global Error]:', err);
  res.status(500).json({
    success: false,
    error: 'Đã xảy ra lỗi máy chủ nội bộ',
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
  // Tự động khởi tạo database và tạo bảng nếu chưa có
  await initDatabase();
});