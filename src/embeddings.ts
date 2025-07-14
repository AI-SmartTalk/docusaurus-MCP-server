import OpenAI from 'openai';

let openai: OpenAI | null = null;

// Initialize OpenAI client if API key is available
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

/**
 * Get text embedding using OpenAI or fallback to simple text features
 */
export async function getEmbedding(text: string): Promise<number[]> {
  if (openai) {
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text,
      });
      return response.data[0].embedding;
    } catch (error) {
      console.warn('OpenAI embedding failed, falling back to simple features:', error);
    }
  }
  
  // Fallback to simple text features for demo purposes
  return getSimpleTextFeatures(text);
}

/**
 * Simple text feature extraction for fallback when OpenAI is not available
 */
function getSimpleTextFeatures(text: string): number[] {
  const words = text.toLowerCase().split(/\s+/);
  const features: number[] = new Array(128).fill(0);
  
  // Basic word frequency and position features
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const hash = simpleHash(word) % 128;
    features[hash] += 1 / (i + 1); // Position-weighted frequency
  }
  
  // Length features
  features[126] = Math.min(words.length / 100, 1); // Normalized length
  features[127] = text.length / 1000; // Character length
  
  // Normalize vector
  const magnitude = Math.sqrt(features.reduce((sum, val) => sum + val * val, 0));
  return magnitude > 0 ? features.map(val => val / magnitude) : features;
}

/**
 * Simple hash function for words
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
} 