"use client";

import { useState, useRef } from "react";
import {
  Table,
  Download,
  Plus,
  Trash2,
  BarChart3,
  PieChart,
  LineChart,
  Loader2,
  Copy,
  Check,
  FileSpreadsheet,
  RefreshCw,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  Spreadsheet,
  Sheet,
  Column,
  Row,
  CellValue,
  ChartType,
  ChartConfig,
  SHEET_TEMPLATES,
  CHART_COLORS,
} from "@/types/sheets";

export default function SheetsPage() {
  const [prompt, setPrompt] = useState("");
  const [rowCount, setRowCount] = useState("10");
  const [spreadsheet, setSpreadsheet] = useState<Spreadsheet | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: string } | null>(null);
  const [chartConfig, setChartConfig] = useState<ChartConfig | null>(null);
  const [showChart, setShowChart] = useState(false);

  // 현재 시트
  const currentSheet = spreadsheet?.sheets[0];

  // AI로 시트 생성
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("생성할 데이터에 대해 설명해주세요");
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch("/api/sheets/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          rowCount: parseInt(rowCount),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "시트 생성 실패");
      }

      setSpreadsheet(data);
      toast.success("스프레드시트가 생성되었습니다!");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  // 셀 값 업데이트
  const updateCell = (rowIndex: number, columnId: string, value: string) => {
    if (!spreadsheet || !currentSheet) return;

    const newRows = [...currentSheet.rows];
    const row = newRows[rowIndex];
    const column = currentSheet.columns.find(c => c.id === columnId);

    if (!row || !column) return;

    const cellValue: CellValue = {
      type: column.type,
      value: column.type === "number" ? parseFloat(value) || 0 : value,
    };

    row.cells[columnId] = cellValue;

    const newSheet = { ...currentSheet, rows: newRows };
    const newSpreadsheet = {
      ...spreadsheet,
      sheets: [newSheet],
      updatedAt: new Date().toISOString(),
    };

    setSpreadsheet(newSpreadsheet);
  };

  // 행 추가
  const addRow = () => {
    if (!spreadsheet || !currentSheet) return;

    const newRow: Row = {
      id: `row-${Date.now()}`,
      cells: {},
    };

    currentSheet.columns.forEach((col) => {
      newRow.cells[col.id] = { type: col.type, value: "" };
    });

    const newSheet = {
      ...currentSheet,
      rows: [...currentSheet.rows, newRow],
    };

    setSpreadsheet({
      ...spreadsheet,
      sheets: [newSheet],
    });
  };

  // 행 삭제
  const deleteRow = (rowIndex: number) => {
    if (!spreadsheet || !currentSheet) return;

    const newRows = currentSheet.rows.filter((_, i) => i !== rowIndex);
    const newSheet = { ...currentSheet, rows: newRows };

    setSpreadsheet({
      ...spreadsheet,
      sheets: [newSheet],
    });

    toast.success("행이 삭제되었습니다");
  };

  // CSV 내보내기
  const exportCSV = () => {
    if (!currentSheet) return;

    const headers = currentSheet.columns.map(c => c.name).join(",");
    const rows = currentSheet.rows.map(row =>
      currentSheet.columns.map(col => {
        const cell = row.cells[col.id];
        const value = cell?.value ?? "";
        // 쉼표가 포함된 경우 따옴표로 감싸기
        return typeof value === "string" && value.includes(",")
          ? `"${value}"`
          : value;
      }).join(",")
    ).join("\n");

    const csv = `${headers}\n${rows}`;
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${spreadsheet?.title || "spreadsheet"}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success("CSV 파일이 다운로드되었습니다");
  };

  // 클립보드 복사
  const copyToClipboard = async () => {
    if (!currentSheet) return;

    const headers = currentSheet.columns.map(c => c.name).join("\t");
    const rows = currentSheet.rows.map(row =>
      currentSheet.columns.map(col => row.cells[col.id]?.value ?? "").join("\t")
    ).join("\n");

    await navigator.clipboard.writeText(`${headers}\n${rows}`);
    setCopied(true);
    toast.success("클립보드에 복사되었습니다");
    setTimeout(() => setCopied(false), 2000);
  };

  // 차트 데이터 계산
  const getChartData = () => {
    if (!currentSheet || !chartConfig) return [];

    return currentSheet.rows.map((row) => {
      const dataPoint: Record<string, string | number> = {
        name: String(row.cells[chartConfig.xAxis]?.value || ""),
      };
      chartConfig.yAxis.forEach((colId) => {
        const value = row.cells[colId]?.value;
        dataPoint[colId] = typeof value === "number" ? value : parseFloat(String(value)) || 0;
      });
      return dataPoint;
    });
  };

  // 셀 값 렌더링
  const renderCellValue = (cell: CellValue | undefined) => {
    if (!cell || cell.value === null || cell.value === undefined) return "";

    if (cell.type === "number" && typeof cell.value === "number") {
      return cell.value.toLocaleString("ko-KR");
    }
    if (cell.type === "boolean") {
      return cell.value ? "예" : "아니오";
    }
    if (cell.type === "link" && typeof cell.value === "string") {
      return (
        <a
          href={cell.value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          {cell.value}
        </a>
      );
    }
    return String(cell.value);
  };

  // 간단한 차트 렌더링 (막대 차트)
  const renderSimpleChart = () => {
    if (!currentSheet) return null;

    const numericColumns = currentSheet.columns.filter(c => c.type === "number");
    if (numericColumns.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          숫자 데이터가 없어 차트를 생성할 수 없습니다
        </div>
      );
    }

    const firstNumericCol = numericColumns[0];
    const maxValue = Math.max(
      ...currentSheet.rows.map(r => {
        const val = r.cells[firstNumericCol.id]?.value;
        return typeof val === "number" ? val : parseFloat(String(val)) || 0;
      })
    );

    return (
      <div className="space-y-3 p-4">
        <h3 className="font-medium text-sm">{firstNumericCol.name} 차트</h3>
        {currentSheet.rows.slice(0, 10).map((row, idx) => {
          const labelCol = currentSheet.columns.find(c => c.type === "text");
          const label = labelCol ? String(row.cells[labelCol.id]?.value || `항목 ${idx + 1}`) : `항목 ${idx + 1}`;
          const val = row.cells[firstNumericCol.id]?.value;
          const numVal = typeof val === "number" ? val : parseFloat(String(val)) || 0;
          const percentage = maxValue > 0 ? (numVal / maxValue) * 100 : 0;

          return (
            <div key={row.id} className="flex items-center gap-3">
              <span className="w-24 text-xs truncate">{label}</span>
              <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: CHART_COLORS[idx % CHART_COLORS.length],
                  }}
                />
              </div>
              <span className="w-20 text-xs text-right">
                {typeof numVal === "number" ? numVal.toLocaleString() : numVal}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      {/* 상단 툴바 */}
      <div className="border-b px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-primary" />
          <span className="font-semibold">AI 시트</span>
          {spreadsheet && (
            <Badge variant="secondary">{currentSheet?.rows.length}행</Badge>
          )}
        </div>
        {spreadsheet && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              aria-label="클립보드에 복사"
            >
              {copied ? (
                <Check className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Copy className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportCSV}
              aria-label="CSV 파일로 내보내기"
            >
              <Download className="h-4 w-4 mr-1" aria-hidden="true" />
              CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={addRow}
              aria-label="행 추가"
            >
              <Plus className="h-4 w-4 mr-1" aria-hidden="true" />
              행 추가
            </Button>
          </div>
        )}
      </div>

      {/* 메인 영역 */}
      {!spreadsheet ? (
        // 생성 폼
        <div className="flex-1 flex items-center justify-center p-8">
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <FileSpreadsheet className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">AI 시트 생성</CardTitle>
              <CardDescription>
                주제를 입력하면 AI가 웹 리서치를 수행하고 데이터를 스프레드시트로 정리합니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">데이터 주제</label>
                <Textarea
                  placeholder="예: 2025년 전기차 판매량 순위, 한국 IT 대기업 매출 비교, 글로벌 AI 스타트업 투자 현황..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">데이터 행 수</label>
                <Select value={rowCount} onValueChange={setRowCount}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["5", "10", "15", "20", "30", "50"].map((num) => (
                      <SelectItem key={num} value={num}>
                        {num}행
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 템플릿 */}
              <div className="space-y-2">
                <label className="text-sm font-medium">템플릿 (선택사항)</label>
                <div className="grid grid-cols-2 gap-2">
                  {SHEET_TEMPLATES.slice(0, 6).map((template) => (
                    <button
                      key={template.id}
                      className="p-3 rounded-lg border text-left hover:border-primary transition-colors"
                      onClick={() => setPrompt(template.samplePrompt)}
                    >
                      <p className="font-medium text-sm">{template.name}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {template.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    데이터 수집 중...
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    AI로 시트 생성
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        // 스프레드시트 뷰
        <div className="flex-1 flex">
          {/* 시트 영역 */}
          <div className="flex-1 flex flex-col">
            {/* 제목 */}
            <div className="px-4 py-2 border-b">
              <Input
                value={spreadsheet.title}
                onChange={(e) =>
                  setSpreadsheet({ ...spreadsheet, title: e.target.value })
                }
                className="text-lg font-semibold border-none shadow-none px-0 focus-visible:ring-0"
              />
              {spreadsheet.description && (
                <p className="text-sm text-muted-foreground">{spreadsheet.description}</p>
              )}
            </div>

            {/* 테이블 */}
            <ScrollArea className="flex-1">
              <div className="min-w-max">
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 bg-muted z-10">
                    <tr>
                      <th className="w-10 px-2 py-2 text-center text-xs font-medium text-muted-foreground border-b border-r">
                        #
                      </th>
                      {currentSheet?.columns.map((column) => (
                        <th
                          key={column.id}
                          className="px-3 py-2 text-left text-sm font-medium border-b border-r min-w-[120px]"
                          style={{ width: column.width }}
                        >
                          <div className="flex items-center gap-2">
                            {column.name}
                            <Badge variant="outline" className="text-[10px] px-1">
                              {column.type}
                            </Badge>
                          </div>
                        </th>
                      ))}
                      <th className="w-10 border-b" />
                    </tr>
                  </thead>
                  <tbody>
                    {currentSheet?.rows.map((row, rowIndex) => (
                      <tr key={row.id} className="group hover:bg-muted/50">
                        <td className="px-2 py-1 text-center text-xs text-muted-foreground border-b border-r">
                          {rowIndex + 1}
                        </td>
                        {currentSheet.columns.map((column) => (
                          <td
                            key={`${row.id}-${column.id}`}
                            className={`px-2 py-1 border-b border-r text-sm ${
                              selectedCell?.row === rowIndex && selectedCell?.col === column.id
                                ? "bg-primary/10 ring-1 ring-primary"
                                : ""
                            }`}
                            onClick={() => setSelectedCell({ row: rowIndex, col: column.id })}
                          >
                            {selectedCell?.row === rowIndex && selectedCell?.col === column.id ? (
                              <Input
                                value={String(row.cells[column.id]?.value ?? "")}
                                onChange={(e) => updateCell(rowIndex, column.id, e.target.value)}
                                onBlur={() => setSelectedCell(null)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === "Escape") {
                                    setSelectedCell(null);
                                  }
                                }}
                                autoFocus
                                className="h-7 px-1 text-sm border-none shadow-none focus-visible:ring-0"
                              />
                            ) : (
                              <span className="block truncate">
                                {renderCellValue(row.cells[column.id])}
                              </span>
                            )}
                          </td>
                        ))}
                        <td className="border-b">
                          <ConfirmDialog
                            title="행 삭제"
                            description="이 행을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
                            confirmText="삭제"
                            variant="destructive"
                            onConfirm={async () => {
                              deleteRow(rowIndex);
                            }}
                            trigger={
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                                aria-label={`${rowIndex + 1}번째 행 삭제`}
                              >
                                <Trash2 className="h-3 w-3" aria-hidden="true" />
                              </Button>
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>

            {/* 하단 요약 */}
            <div className="border-t px-4 py-2 text-sm text-muted-foreground flex items-center justify-between">
              <span>
                {currentSheet?.rows.length}행 × {currentSheet?.columns.length}열
              </span>
              <span>
                마지막 수정: {new Date(spreadsheet.updatedAt).toLocaleString("ko-KR")}
              </span>
            </div>
          </div>

          {/* 오른쪽 패널 - 차트 */}
          <div className="w-80 border-l bg-muted/30">
            <Tabs defaultValue="chart" className="h-full flex flex-col">
              <TabsList className="mx-4 mt-4">
                <TabsTrigger value="chart" className="flex-1">
                  <BarChart3 className="h-4 w-4 mr-1" />
                  차트
                </TabsTrigger>
                <TabsTrigger value="info" className="flex-1">
                  <Settings className="h-4 w-4 mr-1" />
                  정보
                </TabsTrigger>
              </TabsList>

              <TabsContent value="chart" className="flex-1 p-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">데이터 시각화</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {renderSimpleChart()}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="info" className="flex-1 p-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">스프레드시트 정보</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-xs text-muted-foreground">제목</p>
                      <p className="font-medium">{spreadsheet.title}</p>
                    </div>
                    {spreadsheet.description && (
                      <div>
                        <p className="text-xs text-muted-foreground">설명</p>
                        <p className="text-sm">{spreadsheet.description}</p>
                      </div>
                    )}
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">행 수</p>
                        <p className="text-2xl font-bold">{currentSheet?.rows.length}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">열 수</p>
                        <p className="text-2xl font-bold">{currentSheet?.columns.length}</p>
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">열 구성</p>
                      <div className="space-y-1">
                        {currentSheet?.columns.map((col) => (
                          <div key={col.id} className="flex items-center justify-between text-sm">
                            <span>{col.name}</span>
                            <Badge variant="outline" className="text-xs">{col.type}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}
    </div>
  );
}
