import dotenv from 'dotenv';
import { withRetry } from '../utils/retry.js';
dotenv.config();

export async function searchInternet(query) {
  console.log(`[WebSearch] Đang tìm kiếm thông tin về: "${query}" qua SearchApi.io...`);

  const apiKey = process.env.SEARCHAPI_KEY || process.env.SEARCHAPI_API_KEY;
  if (!apiKey) {
    throw new Error('Chưa cấu hình SEARCHAPI_KEY trong file .env');
  }

  // Bổ sung hl=vi và gl=vn để Google ưu tiên tin tức chuẩn xác, chính thống
  const url = `https://www.searchapi.io/api/v1/search?engine=google&q=${encodeURIComponent(query)}&hl=vi&gl=vn&api_key=${apiKey}`;

  const data = await withRetry(async () => {
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) {
      const errData = await response.text();
      throw new Error(`Lỗi gọi SearchApi (${response.status}): ${errData}`);
    }
    return await response.json();
  }, { retries: 2, delayMs: 1500, label: `SearchApi "${query}"` });
  const organicResults = data.organic_results || [];

  // Lọc kỹ kết quả: loại bỏ trang rác, trang lỗi 404, snippet trống hoặc vô nghĩa
  const cleanItems = organicResults.filter(item => {
    if (!item.link || !item.title) return false;
    const title = item.title.trim().toLowerCase();
    const snippet = (item.snippet || '').trim().toLowerCase();
    
    // Loại bỏ các tiêu đề vô nghĩa hoặc link trần
    if (title === 'untitled' || title.startsWith('http://') || title.startsWith('https://')) return false;
    
    // Phải có snippet thực tế tối thiểu 30 ký tự
    if (!snippet || snippet.length < 30) return false;
    
    // Loại bỏ thông báo Google bot không đọc được hoặc trang bị xóa/chặn
    if (snippet.includes('no information is available for this page') || 
        snippet.includes('chúng tôi muốn hiển thị mô tả ở đây nhưng') ||
        snippet.includes('locked or removed') ||
        snippet.includes('page not found') ||
        snippet.includes('404')) {
      return false;
    }
    
    return true;
  });

  // Tổng hợp trích dẫn nội dung từ các kết quả hợp lệ
  const rawText = cleanItems
    .map((item, idx) => `[${idx + 1}] ${item.title}\n${item.snippet || ''}\nLink: ${item.link}`)
    .join('\n\n');

  // Danh sách các nguồn tham chiếu sạch
  const sources = cleanItems.map(item => ({
    title: item.title,
    url: item.link
  }));

  return {
    rawText: rawText || 'Không tìm thấy thông tin trên internet.',
    items: cleanItems.map(item => ({
      title: item.title,
      snippet: item.snippet,
      url: item.link
    })),
    sources
  };
}