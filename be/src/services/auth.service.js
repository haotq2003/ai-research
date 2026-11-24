import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'ai_research_super_secret_jwt_key_2026';
const JWT_EXPIRES_IN = '7d';

export class AuthService {
  // 1. Đăng ký tài khoản mới
  async register({ email, password, fullName }) {
    if (!email || !password) {
      throw new Error('Email và mật khẩu không được để trống');
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (cleanPassword.length < 6) {
      throw new Error('Mật khẩu phải có độ dài tối thiểu 6 ký tự');
    }

    // Kiểm tra email đã tồn tại hay chưa
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [cleanEmail]);
    if (existing.rows.length > 0) {
      throw new Error('Email này đã được đăng ký trong hệ thống');
    }

    // Mã hóa mật khẩu an toàn
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(cleanPassword, salt);

    // Tạo bản ghi người dùng
    const res = await pool.query(
      `INSERT INTO users (email, password_hash, full_name)
       VALUES ($1, $2, $3)
       RETURNING id, email, full_name, created_at`,
      [cleanEmail, passwordHash, fullName?.trim() || cleanEmail.split('@')[0]]
    );

    const user = res.rows[0];
    const token = this.generateToken(user);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        createdAt: user.created_at,
      },
    };
  }

  // 2. Đăng nhập tài khoản
  async login({ email, password }) {
    if (!email || !password) {
      throw new Error('Cần cung cấp đầy đủ email và mật khẩu');
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // Tìm kiếm user theo email
    const res = await pool.query(
      `SELECT id, email, password_hash, full_name, created_at FROM users WHERE email = $1`,
      [cleanEmail]
    );

    if (res.rows.length === 0) {
      throw new Error('Email hoặc mật khẩu không chính xác');
    }

    const user = res.rows[0];

    // So khớp mật khẩu đã băm
    const isMatch = await bcrypt.compare(cleanPassword, user.password_hash);
    if (!isMatch) {
      throw new Error('Email hoặc mật khẩu không chính xác');
    }

    const token = this.generateToken(user);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        createdAt: user.created_at,
      },
    };
  }

  // 3. Lấy thông tin user hiện tại
  async getProfile(userId) {
    const res = await pool.query(
      `SELECT id, email, full_name, created_at FROM users WHERE id = $1`,
      [userId]
    );
    if (res.rows.length === 0) {
      throw new Error('Không tìm thấy người dùng');
    }
    const user = res.rows[0];
    return {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      createdAt: user.created_at,
    };
  }

  // Helper sinh JWT
  generateToken(user) {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  }

  // Helper giải mã & xác thực JWT
  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return null;
    }
  }
}

export const authService = new AuthService();
