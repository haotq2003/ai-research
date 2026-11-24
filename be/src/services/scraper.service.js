import * as cheerio from 'cheerio';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

/**
 * Tải và bóc tách nội dung văn bản chính từ một đường dẫn URL
 * @param {string} url - Đường dẫn bài viết
 * @param {number} timeoutMs - Thời gian chờ tối đa (ms)
 * @returns {Promise<string|null>} Nội dung văn bản sạch hoặc null nếu lỗi
 */
export async function scrapePageContent(url, timeoutMs = 4000) {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) {
    return null;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'vi,en-US;q=0.9,en;q=0.8',
      },
      redirect: 'follow',
    });

    clearTimeout(timer);

    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
      return null;
    }

    const html = await response.text();
    if (!html || html.length < 200) {
      return null;
    }

    const $ = cheerio.load(html);

    // 1. Loại bỏ các phần tử thừa, rác, quảng cáo, điều hướng
    $('script, style, noscript, iframe, svg, nav, footer, header, aside, form, .ads, .ad, .advertisement, .cookie-consent, [role="banner"], [role="navigation"]').remove();

    // 2. Tìm vùng chứa nội dung chính ưu tiên
    let mainText = '';
    const candidates = ['article', 'main', '[role="main"]', '.post-content', '.entry-content', '.article-body', '#content', '.content'];
    
    for (const selector of candidates) {
      const el = $(selector);
      if (el.length > 0) {
        const text = el.text().trim();
        if (text.length > 200) {
          mainText = text;
          break;
        }
      }
    }

    // Nếu không khớp vùng ưu tiên, lấy thẻ body
    if (!mainText) {
      mainText = $('body').text().trim();
    }

    // 3. Chuẩn hóa khoảng trắng và xuống dòng
    const cleanedText = mainText
      .replace(/[\r\n\t]+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();

    // Nếu nội dung bóc tách được quá ngắn (< 120 ký tự), coi như thất bại để fallback về snippet
    if (cleanedText.length < 120) {
      return null;
    }

    // Giới hạn độ dài tối đa 3,500 ký tự để tối ưu token RAG mà vẫn đủ chiều sâu chi tiết
    return cleanedText.slice(0, 3500);

  } catch (error) {
    // Không ném lỗi ra ngoài làm sập Worker, chỉ ghi nhận và fallback an toàn
    return null;
  }
}

/**
 * Làm giàu danh sách kết quả tìm kiếm bằng cách cào nội dung chi tiết bài viết thật
 * @param {Array<{title: string, snippet: string, url: string}>} items 
 * @returns {Promise<Array<{title: string, snippet: string, content: string, url: string, isScraped: boolean}>>}
 */
export async function enrichItemsWithScrapedContent(items = []) {
  if (!items || items.length === 0) return [];

  console.log(`[Scraper] Bắt đầu cào nội dung chi tiết cho ${items.length} liên kết...`);

  const scrapePromises = items.map(async (item) => {
    const scrapedText = await scrapePageContent(item.url);
    if (scrapedText) {
      return {
        ...item,
        content: scrapedText,
        isScraped: true,
      };
    }

    // Fallback: Nếu không cào được (bị chặn bot, timeout, tường lửa), dùng snippet từ Google Search
    return {
      ...item,
      content: item.snippet || '',
      isScraped: false,
    };
  });

  const enriched = await Promise.all(scrapePromises);
  const successCount = enriched.filter(e => e.isScraped).length;
  console.log(`[Scraper] Đã cào thành công ${successCount}/${items.length} trang web (các trang còn lại sử dụng Search Snippet fallback).`);

  return enriched;
}
