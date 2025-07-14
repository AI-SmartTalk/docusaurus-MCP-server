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
    console.log(`[VectorStore] Upserting document at path: ${path}`);
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
    console.log(`[VectorStore] Document upserted. Total documents: ${this.documents.size}`);
  }

  /**
   * Delete a document from the store
   */
  delete(path: string): boolean {
    const existed = this.documents.has(path);
    const result = this.documents.delete(path);
    console.log(`[VectorStore] Delete document at path: ${path}. Existed: ${existed}, Deleted: ${result}. Total documents: ${this.documents.size}`);
    return result;
  }

  /**
   * Get document content by path
   */
  get(path: string): DocumentInfo | undefined {
    const found = this.documents.has(path);
    console.log(`[VectorStore] Get document at path: ${path}. Found: ${found}`);
    return this.documents.get(path);
  }

  /**
   * List all document paths
   */
  listPaths(): string[] {
    const paths = Array.from(this.documents.keys());
    console.log(`[VectorStore] Listing all document paths. Count: ${paths.length}`);
    return paths;
  }

  /**
   * Search for documents using vector similarity
   */
  async search(query: string, topK: number = 5): Promise<SearchResult[]> {
    console.log(`[VectorStore] Searching for query: "${query}" with topK: ${topK}`);
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
    const sorted = results
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    console.log(`[VectorStore] Search complete. Results found: ${sorted.length}`);
    if (sorted.length > 0) {
      console.log(`[VectorStore] Top result:`, sorted[0]);
    }
    return sorted;
  }

  /**
   * Get total number of documents
   */
  size(): number {
    console.log(`[VectorStore] Size requested. Total documents: ${this.documents.size}`);
    return this.documents.size;
  }

  /**
   * Clear all documents
   */
  clear(): void {
    this.documents.clear();
    console.log(`[VectorStore] All documents cleared.`);
  }
}

// Export singleton instance
export const vectorStore = new VectorStore(); 