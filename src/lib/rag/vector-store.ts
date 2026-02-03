import { Pinecone } from "@pinecone-database/pinecone";
import { generateEmbedding, cosineSimilarity } from "./embeddings";
import { Chunk } from "./chunking";

// Vector store configuration
export interface VectorStoreConfig {
  provider: "pinecone" | "memory";
  indexName?: string;
  namespace?: string;
}

export interface SearchResult {
  id: string;
  content: string;
  score: number;
  metadata: Record<string, unknown>;
}

export interface VectorStore {
  upsert(chunks: Chunk[], embeddings: number[][]): Promise<void>;
  search(query: string, topK?: number): Promise<SearchResult[]>;
  delete(ids: string[]): Promise<void>;
  deleteByMetadata(filter: Record<string, unknown>): Promise<void>;
}

// ============================================
// In-Memory Vector Store (for development)
// ============================================

interface MemoryVectorItem {
  id: string;
  content: string;
  embedding: number[];
  metadata: Record<string, unknown>;
}

class MemoryVectorStore implements VectorStore {
  private vectors: Map<string, MemoryVectorItem> = new Map();
  private namespace: string;

  constructor(namespace: string = "default") {
    this.namespace = namespace;
  }

  async upsert(chunks: Chunk[], embeddings: number[][]): Promise<void> {
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const key = `${this.namespace}:${chunk.id}`;

      this.vectors.set(key, {
        id: chunk.id,
        content: chunk.content,
        embedding: embeddings[i],
        metadata: chunk.metadata,
      });
    }
  }

  async search(query: string, topK: number = 5): Promise<SearchResult[]> {
    const queryEmbedding = await generateEmbedding(query);

    const results: SearchResult[] = [];

    for (const [key, item] of this.vectors) {
      if (!key.startsWith(this.namespace)) continue;

      const score = cosineSimilarity(queryEmbedding, item.embedding);
      results.push({
        id: item.id,
        content: item.content,
        score,
        metadata: item.metadata,
      });
    }

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);

    return results.slice(0, topK);
  }

  async delete(ids: string[]): Promise<void> {
    for (const id of ids) {
      const key = `${this.namespace}:${id}`;
      this.vectors.delete(key);
    }
  }

  async deleteByMetadata(filter: Record<string, unknown>): Promise<void> {
    for (const [key, item] of this.vectors) {
      let match = true;
      for (const [filterKey, filterValue] of Object.entries(filter)) {
        if (item.metadata[filterKey] !== filterValue) {
          match = false;
          break;
        }
      }
      if (match) {
        this.vectors.delete(key);
      }
    }
  }

  // Get all items (for debugging)
  getAll(): MemoryVectorItem[] {
    return Array.from(this.vectors.values());
  }
}

// ============================================
// Pinecone Vector Store
// ============================================

class PineconeVectorStore implements VectorStore {
  private client: Pinecone;
  private indexName: string;
  private namespace: string;

  constructor(indexName: string, namespace: string = "default") {
    this.client = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY || "",
    });
    this.indexName = indexName;
    this.namespace = namespace;
  }

  private getIndex() {
    return this.client.index(this.indexName);
  }

  async upsert(chunks: Chunk[], embeddings: number[][]): Promise<void> {
    const index = this.getIndex();

    const records = chunks.map((chunk, i) => ({
      id: chunk.id,
      values: embeddings[i],
      metadata: {
        content: chunk.content,
        ...chunk.metadata,
      },
    }));

    // Upsert in batches of 100
    const batchSize = 100;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      await index.namespace(this.namespace).upsert({ records: batch });
    }
  }

  async search(query: string, topK: number = 5): Promise<SearchResult[]> {
    const queryEmbedding = await generateEmbedding(query);
    const index = this.getIndex();

    const results = await index.namespace(this.namespace).query({
      vector: queryEmbedding,
      topK,
      includeMetadata: true,
    });

    return (results.matches || []).map((match) => ({
      id: match.id,
      content: (match.metadata?.content as string) || "",
      score: match.score || 0,
      metadata: match.metadata || {},
    }));
  }

  async delete(ids: string[]): Promise<void> {
    const index = this.getIndex();
    await index.namespace(this.namespace).deleteMany(ids);
  }

  async deleteByMetadata(filter: Record<string, unknown>): Promise<void> {
    const index = this.getIndex();
    await index.namespace(this.namespace).deleteMany({ filter });
  }
}

// ============================================
// Factory function
// ============================================

// Global memory store instance (singleton for development)
const memoryStores: Map<string, MemoryVectorStore> = new Map();

export function createVectorStore(config: VectorStoreConfig): VectorStore {
  switch (config.provider) {
    case "pinecone":
      if (!config.indexName) {
        throw new Error("Pinecone requires an index name");
      }
      return new PineconeVectorStore(config.indexName, config.namespace);

    case "memory":
    default:
      const key = config.namespace || "default";
      if (!memoryStores.has(key)) {
        memoryStores.set(key, new MemoryVectorStore(key));
      }
      return memoryStores.get(key)!;
  }
}

// Get default vector store based on environment
export function getDefaultVectorStore(namespace?: string): VectorStore {
  if (process.env.PINECONE_API_KEY && process.env.PINECONE_INDEX) {
    return createVectorStore({
      provider: "pinecone",
      indexName: process.env.PINECONE_INDEX,
      namespace,
    });
  }

  return createVectorStore({
    provider: "memory",
    namespace,
  });
}
