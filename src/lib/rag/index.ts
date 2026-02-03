export * from "./embeddings";
export * from "./chunking";
export * from "./vector-store";
export * from "./hybrid-search";

import { parseDocument } from "../documents/parsers";
import { chunkDocument, Chunk, ChunkingOptions } from "./chunking";
import { generateEmbeddings } from "./embeddings";
import { HybridRAG, getKnowledgeBase } from "./hybrid-search";

// ============================================
// High-level RAG Operations
// ============================================

export interface IngestOptions extends ChunkingOptions {
  knowledgeBaseId: string;
}

export interface IngestResult {
  documentId: string;
  filename: string;
  chunkCount: number;
  success: boolean;
  error?: string;
}

// Ingest a document into a knowledge base
export async function ingestDocument(
  buffer: Buffer,
  filename: string,
  options: IngestOptions
): Promise<IngestResult> {
  const documentId = Math.random().toString(36).substring(2) + Date.now().toString(36);

  try {
    // Parse document
    const parsed = await parseDocument(buffer, filename);

    // Create chunks
    const chunks = chunkDocument(
      parsed.content,
      {
        filename,
        documentId,
        ...parsed.metadata,
      },
      options
    );

    if (chunks.length === 0) {
      return {
        documentId,
        filename,
        chunkCount: 0,
        success: false,
        error: "No content to index",
      };
    }

    // Generate embeddings
    const embeddings = await generateEmbeddings(
      chunks.map((c) => c.content)
    );

    // Get knowledge base and index
    const kb = getKnowledgeBase(options.knowledgeBaseId);
    await kb.indexDocuments(chunks, embeddings);

    return {
      documentId,
      filename,
      chunkCount: chunks.length,
      success: true,
    };
  } catch (error) {
    return {
      documentId,
      filename,
      chunkCount: 0,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Query a knowledge base with RAG
export interface RAGQueryOptions {
  topK?: number;
  vectorWeight?: number;
  keywordWeight?: number;
  includeMetadata?: boolean;
}

export interface RAGQueryResult {
  contexts: Array<{
    content: string;
    score: number;
    source: string;
    metadata?: Record<string, unknown>;
  }>;
  formattedContext: string;
}

export async function queryKnowledgeBase(
  knowledgeBaseId: string,
  query: string,
  options: RAGQueryOptions = {}
): Promise<RAGQueryResult> {
  const kb = getKnowledgeBase(knowledgeBaseId);

  const results = await kb.search(query, {
    topK: options.topK || 5,
    vectorWeight: options.vectorWeight,
    keywordWeight: options.keywordWeight,
  });

  const contexts = results.map((r) => ({
    content: r.content,
    score: r.score,
    source: (r.metadata.source as string) || "unknown",
    metadata: options.includeMetadata ? r.metadata : undefined,
  }));

  // Format context for LLM
  const formattedContext = contexts
    .map(
      (ctx, i) =>
        `[Source ${i + 1}: ${ctx.source}]\n${ctx.content}`
    )
    .join("\n\n---\n\n");

  return {
    contexts,
    formattedContext,
  };
}

// Delete a document from knowledge base
export async function deleteDocumentFromKnowledgeBase(
  knowledgeBaseId: string,
  documentId: string
): Promise<void> {
  const kb = getKnowledgeBase(knowledgeBaseId);
  await kb.deleteBySource(documentId);
}

// ============================================
// RAG-enhanced Chat
// ============================================

export function buildRAGPrompt(
  userQuery: string,
  ragContext: string,
  systemPrompt?: string
): string {
  const defaultSystemPrompt = `You are a helpful assistant with access to a knowledge base.
Answer the user's question based on the provided context.
If the context doesn't contain relevant information, say so and provide a general response.
Always cite your sources when using information from the context.`;

  return `${systemPrompt || defaultSystemPrompt}

## Context from Knowledge Base:
${ragContext}

## User Question:
${userQuery}

## Instructions:
- Answer based on the context provided above
- If the context is relevant, use it to inform your answer
- Cite sources using [Source N] format
- If the context isn't helpful, acknowledge this and provide a general response`;
}
