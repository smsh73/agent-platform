import mammoth from "mammoth";
import * as XLSX from "exceljs";

// Dynamic import for pdf-parse to handle ESM compatibility
async function getPdfParser(): Promise<(buffer: Buffer) => Promise<{ text: string; numpages: number; info?: { Title?: string; Author?: string } }>> {
  const pdfParse = await import("pdf-parse");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (pdfParse as any).default || pdfParse;
}

export interface ParsedDocument {
  content: string;
  metadata: {
    title?: string;
    author?: string;
    pageCount?: number;
    wordCount?: number;
    type: string;
    sheets?: string[];
  };
  sections?: Array<{
    title?: string;
    content: string;
    pageNumber?: number;
  }>;
}

// DOCX Parser
export async function parseDocx(buffer: Buffer): Promise<ParsedDocument> {
  const result = await mammoth.extractRawText({ buffer });
  const text = result.value;

  return {
    content: text,
    metadata: {
      wordCount: text.split(/\s+/).length,
      type: "docx",
    },
  };
}

// XLSX Parser
export async function parseXlsx(buffer: Buffer): Promise<ParsedDocument> {
  const workbook = new XLSX.Workbook();
  // Convert to ArrayBuffer for exceljs compatibility
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer);

  const sheets: string[] = [];
  let fullContent = "";

  workbook.eachSheet((worksheet, sheetId) => {
    sheets.push(worksheet.name);
    fullContent += `\n## Sheet: ${worksheet.name}\n\n`;

    worksheet.eachRow((row, rowNumber) => {
      const values = row.values as (string | number | null | undefined)[];
      const rowContent = values
        .slice(1) // Skip first element (undefined in exceljs)
        .map((v) => (v !== null && v !== undefined ? String(v) : ""))
        .join("\t");
      fullContent += rowContent + "\n";
    });
  });

  return {
    content: fullContent.trim(),
    metadata: {
      type: "xlsx",
      sheets,
    },
  };
}

// PDF Parser
export async function parsePdf(buffer: Buffer): Promise<ParsedDocument> {
  const pdf = await getPdfParser();
  const data = await pdf(buffer);

  return {
    content: data.text,
    metadata: {
      pageCount: data.numpages,
      title: data.info?.Title,
      author: data.info?.Author,
      wordCount: data.text.split(/\s+/).length,
      type: "pdf",
    },
  };
}

// TXT Parser
export function parseTxt(buffer: Buffer): ParsedDocument {
  const text = buffer.toString("utf-8");

  return {
    content: text,
    metadata: {
      wordCount: text.split(/\s+/).length,
      type: "txt",
    },
  };
}

// CSV Parser
export function parseCsv(buffer: Buffer): ParsedDocument {
  const text = buffer.toString("utf-8");
  const lines = text.split("\n");
  const headers = lines[0]?.split(",") || [];

  let markdownContent = "| " + headers.join(" | ") + " |\n";
  markdownContent += "| " + headers.map(() => "---").join(" | ") + " |\n";

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim()) {
      const values = lines[i].split(",");
      markdownContent += "| " + values.join(" | ") + " |\n";
    }
  }

  return {
    content: markdownContent,
    metadata: {
      type: "csv",
      wordCount: text.split(/\s+/).length,
    },
  };
}

// Main parser function
export async function parseDocument(
  buffer: Buffer,
  filename: string
): Promise<ParsedDocument> {
  const extension = filename.split(".").pop()?.toLowerCase();

  switch (extension) {
    case "docx":
    case "doc":
      return parseDocx(buffer);
    case "xlsx":
    case "xls":
      return parseXlsx(buffer);
    case "pdf":
      return parsePdf(buffer);
    case "txt":
    case "md":
      return parseTxt(buffer);
    case "csv":
      return parseCsv(buffer);
    default:
      throw new Error(`Unsupported file type: ${extension}`);
  }
}

// Supported file types
export const SUPPORTED_FILE_TYPES = [
  "docx",
  "doc",
  "xlsx",
  "xls",
  "pdf",
  "txt",
  "md",
  "csv",
];

export function isSupportedFileType(filename: string): boolean {
  const extension = filename.split(".").pop()?.toLowerCase();
  return SUPPORTED_FILE_TYPES.includes(extension || "");
}
