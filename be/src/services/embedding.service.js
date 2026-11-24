import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { withRetry } from '../utils/retry.js';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// 1. Tạo vector đại diện ngữ nghĩa (768 chiều)
export async function generateEmbedding(text) {
  return await withRetry(async () => {
    const response = await ai.models.embedContent({
      model: 'gemini-embedding-001',
      contents: text,
      config: {
        outputDimensionality: 768,
      },
    });
    return response.embeddings[0].values;
  }, { retries: 2, delayMs: 1000, label: 'Gemini Embedding' });
}

// 2. Tính Cosine Similarity giữa 2 vector số
export function calculateCosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// 3. Tìm Top K đoạn văn bản có ý nghĩa gần nhất
export function findTopKMatches(queryVector, docVectors, topK = 3) {
  const scored = docVectors.map(doc => ({
    ...doc,
    similarity: calculateCosineSimilarity(queryVector, doc.vector)
  }));

  // Sắp xếp giảm dần theo điểm số
  scored.sort((a, b) => b.similarity - a.similarity);
  return scored.slice(0, topK);
}