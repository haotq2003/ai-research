import { authService } from '../services/auth.service.js';

// POST /api/auth/register
export async function handleRegister(req, res) {
  try {
    const { email, password, fullName } = req.body;
    const result = await authService.register({ email, password, fullName });
    return res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công',
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message || 'Lỗi đăng ký tài khoản',
    });
  }
}

// POST /api/auth/login
export async function handleLogin(req, res) {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });
    return res.json({
      success: true,
      message: 'Đăng nhập thành công',
      data: result,
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: error.message || 'Lỗi đăng nhập',
    });
  }
}

// GET /api/auth/me
export async function handleGetMe(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Chưa đăng nhập' });
    }
    const profile = await authService.getProfile(req.user.id);
    return res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
