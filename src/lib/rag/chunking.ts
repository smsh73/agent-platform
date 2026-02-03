export interface Chunk {
  id: string;
  content: string;
  metadata: {
    source: string;
    chunkIndex: number;
    totalChunks: number;
    startChar: number;
    endChar: number;
    wordCount: number;
    [key: string]: unknown;
  };
}

export interface ChunkingOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  separator?: string;
  strategy?: "fixed" | "sentence" | "paragraph" | "semantic";
}

const DEFAULT_OPTIONS: ChunkingOptions = {
  chunkSize: 1000,
  chunkOverlap: 200,
  separator: "\n\n",
  strategy: "paragraph",
};

// Generate unique ID
function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Fixed-size chunking
function fixedSizeChunk(
  text: string,
  source: string,
  options: ChunkingOptions
): Chunk[] {
  const { chunkSize = 1000, chunkOverlap = 200 } = options;
  const chunks: Chunk[] = [];

  let startIndex = 0;
  let chunkIndex = 0;

  while (startIndex < text.length) {
    const endIndex = Math.min(startIndex + chunkSize, text.length);
    const content = text.slice(startIndex, endIndex);

    chunks.push({
      id: generateId(),
      content,
      metadata: {
        source,
        chunkIndex,
        totalChunks: 0, // Will be updated later
        startChar: startIndex,
        endChar: endIndex,
        wordCount: content.split(/\s+/).length,
      },
    });

    startIndex = endIndex - chunkOverlap;
    if (startIndex >= text.length - chunkOverlap) break;
    chunkIndex++;
  }

  // Update total chunks
  chunks.forEach((chunk) => {
    chunk.metadata.totalChunks = chunks.length;
  });

  return chunks;
}

// Sentence-based chunking
function sentenceChunk(
  text: string,
  source: string,
  options: ChunkingOptions
): Chunk[] {
  const { chunkSize = 1000, chunkOverlap = 200 } = options;

  // Split by sentence endings
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks: Chunk[] = [];

  let currentChunk = "";
  let currentStart = 0;
  let chunkIndex = 0;

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > chunkSize && currentChunk.length > 0) {
      chunks.push({
        id: generateId(),
        content: currentChunk.trim(),
        metadata: {
          source,
          chunkIndex,
          totalChunks: 0,
          startChar: currentStart,
          endChar: currentStart + currentChunk.length,
          wordCount: currentChunk.split(/\s+/).length,
        },
      });

      // Keep overlap
      const overlapSentences = currentChunk.split(/[.!?]+/).slice(-2).join(". ");
      currentChunk = overlapSentences + sentence;
      currentStart = currentStart + currentChunk.length - overlapSentences.length - sentence.length;
      chunkIndex++;
    } else {
      currentChunk += sentence;
    }
  }

  // Add remaining content
  if (currentChunk.trim().length > 0) {
    chunks.push({
      id: generateId(),
      content: currentChunk.trim(),
      metadata: {
        source,
        chunkIndex,
        totalChunks: 0,
        startChar: currentStart,
        endChar: text.length,
        wordCount: currentChunk.split(/\s+/).length,
      },
    });
  }

  // Update total chunks
  chunks.forEach((chunk) => {
    chunk.metadata.totalChunks = chunks.length;
  });

  return chunks;
}

// Paragraph-based chunking
function paragraphChunk(
  text: string,
  source: string,
  options: ChunkingOptions
): Chunk[] {
  const { chunkSize = 1000 } = options;

  const paragraphs = text.split(/\n\s*\n/);
  const chunks: Chunk[] = [];

  let currentChunk = "";
  let currentStart = 0;
  let charOffset = 0;
  let chunkIndex = 0;

  for (const paragraph of paragraphs) {
    const trimmedParagraph = paragraph.trim();
    if (!trimmedParagraph) {
      charOffset += paragraph.length + 2; // +2 for \n\n
      continue;
    }

    if (currentChunk.length + trimmedParagraph.length > chunkSize && currentChunk.length > 0) {
      chunks.push({
        id: generateId(),
        content: currentChunk.trim(),
        metadata: {
          source,
          chunkIndex,
          totalChunks: 0,
          startChar: currentStart,
          endChar: charOffset,
          wordCount: currentChunk.split(/\s+/).length,
        },
      });

      currentChunk = trimmedParagraph;
      currentStart = charOffset;
      chunkIndex++;
    } else {
      currentChunk += (currentChunk ? "\n\n" : "") + trimmedParagraph;
    }

    charOffset += paragraph.length + 2;
  }

  // Add remaining content
  if (currentChunk.trim().length > 0) {
    chunks.push({
      id: generateId(),
      content: currentChunk.trim(),
      metadata: {
        source,
        chunkIndex,
        totalChunks: 0,
        startChar: currentStart,
        endChar: text.length,
        wordCount: currentChunk.split(/\s+/).length,
      },
    });
  }

  // Update total chunks
  chunks.forEach((chunk) => {
    chunk.metadata.totalChunks = chunks.length;
  });

  return chunks;
}

// Main chunking function
export function chunkText(
  text: string,
  source: string,
  options: ChunkingOptions = {}
): Chunk[] {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

  switch (mergedOptions.strategy) {
    case "fixed":
      return fixedSizeChunk(text, source, mergedOptions);
    case "sentence":
      return sentenceChunk(text, source, mergedOptions);
    case "paragraph":
    default:
      return paragraphChunk(text, source, mergedOptions);
  }
}

// Chunk document with metadata
export function chunkDocument(
  content: string,
  documentMetadata: Record<string, unknown>,
  options: ChunkingOptions = {}
): Chunk[] {
  const source = (documentMetadata.filename as string) || "unknown";
  const chunks = chunkText(content, source, options);

  // Add document metadata to each chunk
  return chunks.map((chunk) => ({
    ...chunk,
    metadata: {
      ...chunk.metadata,
      ...documentMetadata,
    },
  }));
}
