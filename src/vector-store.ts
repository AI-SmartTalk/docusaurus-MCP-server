import { DocumentInfo, SearchResult } from './types.js';
import { getEmbedding, cosineSimilarity } from './embeddings.js';

/**
 * Simple in-memory vector store for document embeddings
 */
class VectorStore {
  private documents: Map<string, DocumentInfo> = new Map();

  /**
   * Upsert a document with its embedding
   */
  async upsert(path: string, content: string): Promise<void> {
    const embedding = await getEmbedding(content);
    const now = new Date();
    
    const existing = this.documents.get(path);
    const docInfo: DocumentInfo = {
      path,
      content,
      embedding,
      created: existing?.created || now,
      updated: now,
    };
    
    this.documents.set(path, docInfo);
  }

  /**
   * Delete a document from the store
   */
  delete(path: string): boolean {
    return this.documents.delete(path);
  }

  /**
   * Get document content by path
   */
  get(path: string): DocumentInfo | undefined {
    return this.documents.get(path);
  }

  /**
   * List all document paths
   */
  listPaths(): string[] {
    return Array.from(this.documents.keys());
  }

  /**
   * Search for documents using vector similarity
   */
  async search(query: string, topK: number = 5): Promise<SearchResult[]> {
    const queryEmbedding = await getEmbedding(query);
    const results: SearchResult[] = [];

    for (const [path, doc] of this.documents) {
      if (!doc.embedding) continue;
      
      const score = cosineSimilarity(queryEmbedding, doc.embedding);
      const snippet = doc.content.substring(0, 300);
      
      results.push({
        path,
        score,
        snippet,
        content: doc.content,
      });
    }

    // Sort by score descending and take top K
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  /**
   * Get total number of documents
   */
  size(): number {
    return this.documents.size;
  }

  /**
   * Clear all documents
   */
  clear(): void {
    this.documents.clear();
  }
}

// Export singleton instance
export const vectorStore = new VectorStore(); 