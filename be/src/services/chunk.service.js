/**
 * Cắt một đoạn văn bản dài thành các chunk nhỏ có gối đầu (overlap)
 * @param {string} text - Văn bản gốc
 * @param {number} chunkSize - Số ký tự tối đa mỗi chunk (mặc định 600)
 * @param {number} overlap - Số ký tự gối đầu giữa các chunk (mặc định 100)
 */
export function chunkText(text, chunkSize = 600, overlap = 100) {
  if (!text || text.length <= chunkSize) {
    return [text.trim()];
  }

  const chunks = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    let endIndex = startIndex + chunkSize;

    // Tìm dấu chấm hoặc xuống dòng gần nhất để tránh cắt ngang giữa một câu
    if (endIndex < text.length) {
      const nearestPunctuation = text.lastIndexOf('.', endIndex);
      if (nearestPunctuation > startIndex + (chunkSize / 2)) {
        endIndex = nearestPunctuation + 1;
      }
    }

    const chunk = text.slice(startIndex, endIndex).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }

    startIndex = endIndex - overlap;
    if (startIndex >= text.length - overlap) break;
  }

  return chunks;
}