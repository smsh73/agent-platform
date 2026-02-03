import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
} from "docx";
import * as XLSX from "exceljs";
import PptxGenJS from "pptxgenjs";

// ============================================
// DOCX Generator
// ============================================

export interface DocxSection {
  type: "heading" | "paragraph" | "list" | "table";
  level?: 1 | 2 | 3;
  content: string;
  items?: string[];
  rows?: string[][];
}

export async function generateDocx(
  title: string,
  sections: DocxSection[]
): Promise<Buffer> {
  const children: (Paragraph | Table)[] = [];

  // Title
  children.push(
    new Paragraph({
      text: title,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
    })
  );

  // Process sections
  for (const section of sections) {
    switch (section.type) {
      case "heading":
        const headingLevel =
          section.level === 1
            ? HeadingLevel.HEADING_1
            : section.level === 2
            ? HeadingLevel.HEADING_2
            : HeadingLevel.HEADING_3;

        children.push(
          new Paragraph({
            text: section.content,
            heading: headingLevel,
          })
        );
        break;

      case "paragraph":
        children.push(
          new Paragraph({
            children: [new TextRun(section.content)],
          })
        );
        break;

      case "list":
        if (section.items) {
          for (const item of section.items) {
            children.push(
              new Paragraph({
                text: item,
                bullet: { level: 0 },
              })
            );
          }
        }
        break;

      case "table":
        if (section.rows && section.rows.length > 0) {
          const tableRows = section.rows.map(
            (row, index) =>
              new TableRow({
                children: row.map(
                  (cell) =>
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: cell,
                              bold: index === 0,
                            }),
                          ],
                        }),
                      ],
                      width: {
                        size: 100 / row.length,
                        type: WidthType.PERCENTAGE,
                      },
                    })
                ),
              })
          );

          children.push(
            new Table({
              rows: tableRows,
              width: { size: 100, type: WidthType.PERCENTAGE },
            })
          );
        }
        break;
    }
  }

  const doc = new Document({
    sections: [
      {
        children,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}

// ============================================
// XLSX Generator
// ============================================

export interface XlsxSheet {
  name: string;
  headers: string[];
  rows: (string | number)[][];
}

export async function generateXlsx(sheets: XlsxSheet[]): Promise<Buffer> {
  const workbook = new XLSX.Workbook();

  for (const sheetData of sheets) {
    const worksheet = workbook.addWorksheet(sheetData.name);

    // Add headers
    worksheet.addRow(sheetData.headers);

    // Style headers
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    // Add data rows
    for (const row of sheetData.rows) {
      worksheet.addRow(row);
    }

    // Auto-fit columns
    worksheet.columns.forEach((column) => {
      column.width = 15;
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

// ============================================
// PPTX Generator
// ============================================

export interface PptxSlide {
  type: "title" | "content" | "bullets" | "image" | "table" | "twoColumn";
  title?: string;
  subtitle?: string;
  content?: string;
  bullets?: string[];
  imageUrl?: string;
  leftContent?: string[];
  rightContent?: string[];
  tableData?: string[][];
}

export async function generatePptx(
  presentationTitle: string,
  slides: PptxSlide[]
): Promise<Buffer> {
  const pptx = new PptxGenJS();

  pptx.title = presentationTitle;
  pptx.author = "Agent Platform";

  for (const slideData of slides) {
    const slide = pptx.addSlide();

    switch (slideData.type) {
      case "title":
        slide.addText(slideData.title || "", {
          x: 0.5,
          y: 2,
          w: 9,
          h: 1.5,
          fontSize: 44,
          bold: true,
          align: "center",
        });
        if (slideData.subtitle) {
          slide.addText(slideData.subtitle, {
            x: 0.5,
            y: 3.5,
            w: 9,
            h: 1,
            fontSize: 24,
            align: "center",
            color: "666666",
          });
        }
        break;

      case "content":
        if (slideData.title) {
          slide.addText(slideData.title, {
            x: 0.5,
            y: 0.5,
            w: 9,
            h: 0.8,
            fontSize: 32,
            bold: true,
          });
        }
        if (slideData.content) {
          slide.addText(slideData.content, {
            x: 0.5,
            y: 1.5,
            w: 9,
            h: 4,
            fontSize: 18,
            valign: "top",
          });
        }
        break;

      case "bullets":
        if (slideData.title) {
          slide.addText(slideData.title, {
            x: 0.5,
            y: 0.5,
            w: 9,
            h: 0.8,
            fontSize: 32,
            bold: true,
          });
        }
        if (slideData.bullets) {
          slide.addText(
            slideData.bullets.map((text) => ({
              text,
              options: { bullet: true, fontSize: 20 },
            })),
            { x: 0.5, y: 1.5, w: 9, h: 4 }
          );
        }
        break;

      case "twoColumn":
        if (slideData.title) {
          slide.addText(slideData.title, {
            x: 0.5,
            y: 0.5,
            w: 9,
            h: 0.8,
            fontSize: 32,
            bold: true,
          });
        }
        if (slideData.leftContent) {
          slide.addText(
            slideData.leftContent.map((text) => ({
              text,
              options: { bullet: true, fontSize: 18 },
            })),
            { x: 0.5, y: 1.5, w: 4.2, h: 4 }
          );
        }
        if (slideData.rightContent) {
          slide.addText(
            slideData.rightContent.map((text) => ({
              text,
              options: { bullet: true, fontSize: 18 },
            })),
            { x: 5.3, y: 1.5, w: 4.2, h: 4 }
          );
        }
        break;

      case "table":
        if (slideData.title) {
          slide.addText(slideData.title, {
            x: 0.5,
            y: 0.5,
            w: 9,
            h: 0.8,
            fontSize: 32,
            bold: true,
          });
        }
        if (slideData.tableData) {
          // Convert string[][] to the format pptxgenjs expects
          const tableRows = slideData.tableData.map((row) =>
            row.map((cell) => ({ text: cell }))
          );
          slide.addTable(tableRows, {
            x: 0.5,
            y: 1.5,
            w: 9,
            colW: slideData.tableData[0]?.map(() => 9 / slideData.tableData![0].length),
            fontSize: 14,
            border: { pt: 1, color: "CCCCCC" },
          });
        }
        break;
    }
  }

  const data = await pptx.write({ outputType: "nodebuffer" });
  return data as Buffer;
}

// ============================================
// Markdown to Document Converter
// ============================================

export function markdownToDocxSections(markdown: string): DocxSection[] {
  const sections: DocxSection[] = [];
  const lines = markdown.split("\n");

  let currentList: string[] = [];
  let inList = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Check for headings
    if (trimmed.startsWith("# ")) {
      if (inList && currentList.length > 0) {
        sections.push({ type: "list", content: "", items: [...currentList] });
        currentList = [];
        inList = false;
      }
      sections.push({
        type: "heading",
        level: 1,
        content: trimmed.substring(2),
      });
    } else if (trimmed.startsWith("## ")) {
      if (inList && currentList.length > 0) {
        sections.push({ type: "list", content: "", items: [...currentList] });
        currentList = [];
        inList = false;
      }
      sections.push({
        type: "heading",
        level: 2,
        content: trimmed.substring(3),
      });
    } else if (trimmed.startsWith("### ")) {
      if (inList && currentList.length > 0) {
        sections.push({ type: "list", content: "", items: [...currentList] });
        currentList = [];
        inList = false;
      }
      sections.push({
        type: "heading",
        level: 3,
        content: trimmed.substring(4),
      });
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      inList = true;
      currentList.push(trimmed.substring(2));
    } else if (trimmed.length > 0) {
      if (inList && currentList.length > 0) {
        sections.push({ type: "list", content: "", items: [...currentList] });
        currentList = [];
        inList = false;
      }
      sections.push({ type: "paragraph", content: trimmed });
    }
  }

  // Don't forget remaining list
  if (inList && currentList.length > 0) {
    sections.push({ type: "list", content: "", items: [...currentList] });
  }

  return sections;
}
