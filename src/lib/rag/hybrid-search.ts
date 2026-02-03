import { SearchResult, VectorStore, getDefaultVectorStore } from "./vector-store";
import { generateEmbedding } from "./embeddings";
import { Chunk } from "./chunking";

// BM25 implementation for keyword search
class BM25 {
  private documents: Map<string, { content: string; metadata: Record<string, unknown> }>;
  private avgDocLength: number;
  private docLengths: Map<string, number>;
  private termFrequencies: Map<string, Map<string, number>>;
  private documentFrequencies: Map<string, number>;
  private k1: number = 1.5;
  private b: number = 0.75;

  constructor() {
    this.documents = new Map();
    this.docLengths = new Map();
    this.termFrequencies = new Map();
    this.documentFrequencies = new Map();
    this.avgDocLength = 0;
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 2);
  }

  addDocuments(chunks: Chunk[]): void {
    for (const chunk of chunks) {
      const tokens = this.tokenize(chunk.content);
      this.documents.set(chunk.id, {
        content: chunk.content,
        metadata: chunk.metadata,
      });
      this.docLengths.set(chunk.id, tokens.length);

      // Calculate term frequencies
      const tf = new Map<string, number>();
      for (const token of tokens) {
        tf.set(token, (tf.get(token) || 0) + 1);
      }
      this.termFrequencies.set(chunk.id, tf);

      // Update document frequencies
      const uniqueTokens = new Set(tokens);
      for (const token of uniqueTokens) {
        this.documentFrequencies.set(
          token,
          (this.documentFrequencies.get(token) || 0) + 1
        );
      }
    }

    // Calculate average document length
    let totalLength = 0;
    for (const length of this.docLengths.values()) {
      totalLength += length;
    }
    this.avgDocLength = totalLength / this.documents.size || 1;
  }

  search(query: string, topK: number = 10): SearchResult[] {
    const queryTokens = this.tokenize(query);
    const scores: Map<string, number> = new Map();
    const N = this.documents.size;

    for (const [docId, tf] of this.termFrequencies) {
      let score = 0;
      const docLength = this.docLengths.get(docId) || 0;

      for (const token of queryTokens) {
        const termFreq = tf.get(token) || 0;
        const docFreq = this.documentFrequencies.get(token) || 0;

        if (termFreq > 0 && docFreq > 0) {
          // IDF
          const idf = Math.log((N - docFreq + 0.5) / (docFreq + 0.5) + 1);

          // TF with saturation
          const tfNorm =
            (termFreq * (this.k1 + 1)) /
            (termFreq +
              this.k1 * (1 - this.b + (this.b * docLength) / this.avgDocLength));

          score += idf * tfNorm;
        }
      }

      if (score > 0) {
        scores.set(docId, score);
      }
    }

    // Sort and return top K
    const sortedResults = Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, topK);

    return sortedResults.map(([id, score]) => ({
      id,
      content: this.documents.get(id)?.content || "",
      score,
      metadata: this.documents.get(id)?.metadata || {},
    }));
  }

  clear(): void {
    this.documents.clear();
    this.docLengths.clear();
    this.termFrequencies.clear();
    this.documentFrequencies.clear();
    this.avgDocLength = 0;
  }
}

// ============================================
// Hybrid Search (Vector + BM25)
// ============================================

export interface HybridSearchOptions {
  vectorWeight?: number; // 0-1, weight for vector search
  keywordWeight?: number; // 0-1, weight for keyword search
  topK?: number;
  rerank?: boolean;
}

const DEFAULT_OPTIONS: HybridSearchOptions = {
  vectorWeight: 0.7,
  keywordWeight: 0.3,
  topK: 10,
  rerank: true,
};

export class HybridRAG {
  private vectorStore: VectorStore;
  private bm25: BM25;
  private chunks: Map<string, Chunk>;
  private namespace: string;

  constructor(namespace: string = "default") {
    this.namespace = namespace;
    this.vectorStore = getDefaultVectorStore(namespace);
    this.bm25 = new BM25();
    this.chunks = new Map();
  }

  // Index documents
  async indexDocuments(
    chunks: Chunk[],
    embeddings: number[][]
  ): Promise<void> {
    // Add to vector store
    await this.vectorStore.upsert(chunks, embeddings);

    // Add to BM25 index
    this.bm25.addDocuments(chunks);

    // Store chunks locally for retrieval
    for (const chunk of chunks) {
      this.chunks.set(chunk.id, chunk);
    }
  }

  // Hybrid search
  async search(
    query: string,
    options: HybridSearchOptions = {}
  ): Promise<SearchResult[]> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const topK = opts.topK || 10;

    // Vector search
    const vectorResults = await this.vectorStore.search(query, topK * 2);

    // BM25 search
    const keywordResults = this.bm25.search(query, topK * 2);

    // Combine results using Reciprocal Rank Fusion (RRF)
    const combinedScores = new Map<string, number>();
    const contentMap = new Map<string, { content: string; metadata: Record<string, unknown> }>();

    // Add vector results with RRF
    const k = 60; // RRF constant
    vectorResults.forEach((result, rank) => {
      const rrf = opts.vectorWeight! / (k + rank + 1);
      combinedScores.set(
        result.id,
        (combinedScores.get(result.id) || 0) + rrf
      );
      contentMap.set(result.id, {
        content: result.content,
        metadata: result.metadata,
      });
    });

    // Add keyword results with RRF
    keywordResults.forEach((result, rank) => {
      const rrf = opts.keywordWeight! / (k + rank + 1);
      combinedScores.set(
        result.id,
        (combinedScores.get(result.id) || 0) + rrf
      );
      if (!contentMap.has(result.id)) {
        contentMap.set(result.id, {
          content: result.content,
          metadata: result.metadata,
        });
      }
    });

    // Sort by combined score
    const sortedResults = Array.from(combinedScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, topK)
      .map(([id, score]) => ({
        id,
        content: contentMap.get(id)?.content || "",
        score,
        metadata: contentMap.get(id)?.metadata || {},
      }));

    return sortedResults;
  }

  // Delete documents
  async deleteDocuments(ids: string[]): Promise<void> {
    await this.vectorStore.delete(ids);
    // Note: BM25 index needs to be rebuilt for proper deletion
    for (const id of ids) {
      this.chunks.delete(id);
    }
  }

  // Delete by source
  async deleteBySource(source: string): Promise<void> {
    await this.vectorStore.deleteByMetadata({ source });

    // Remove from local storage
    for (const [id, chunk] of this.chunks) {
      if (chunk.metadata.source === source) {
        this.chunks.delete(id);
      }
    }

    // Rebuild BM25 index
    this.bm25.clear();
    this.bm25.addDocuments(Array.from(this.chunks.values()));
  }

  // Get chunk by ID
  getChunk(id: string): Chunk | undefined {
    return this.chunks.get(id);
  }
}

// ============================================
// Knowledge Base Manager
// ============================================

export interface KnowledgeBase {
  id: string;
  name: string;
  description?: string;
  userId: string;
  documentCount: number;
  chunkCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Global knowledge bases (in production, this would be in the database)
const knowledgeBases = new Map<string, HybridRAG>();

export function getKnowledgeBase(id: string): HybridRAG {
  if (!knowledgeBases.has(id)) {
    knowledgeBases.set(id, new HybridRAG(id));
  }
  return knowledgeBases.get(id)!;
}

export function createKnowledgeBase(id: string): HybridRAG {
  const kb = new HybridRAG(id);
  knowledgeBases.set(id, kb);
  return kb;
}

export function deleteKnowledgeBase(id: string): void {
  knowledgeBases.delete(id);
}

export function listKnowledgeBases(): string[] {
  return Array.from(knowledgeBases.keys());
}

export function hasKnowledgeBase(id: string): boolean {
  return knowledgeBases.has(id);
}
