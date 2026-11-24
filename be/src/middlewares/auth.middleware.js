import { authService } from '../services/auth.service.js';

/**
 * Middleware tùy chọn: Nếu client gửi Token (Bearer <token>) thì giải mã gán vào req.user,
 * nếu không gửi thì vẫn cho phép tiếp tục với req.user = null (khách vãng lai).
 */
export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];
  const decoded = authService.verifyToken(token);
  req.user = decoded || null;
  next();
}

/**
 * Middleware bắt buộc: Yêu cầu người dùng phải đăng nhập
 */
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Vui lòng đăng nhập để truy cập tài nguyên này',
    });
  }

  const token = authHeader.split(' ')[1];
  const decoded = authService.verifyToken(token);
  if (!decoded) {
    return res.status(401).json({
      success: false,
      error: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn',
    });
  }

  req.user = decoded;
  next();
}
