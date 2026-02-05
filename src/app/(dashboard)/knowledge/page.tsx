"use client";

import { useState, useCallback } from "react";
import {
  Database,
  Upload,
  Search,
  Trash2,
  Plus,
  FileText,
  File,
  FileSpreadsheet,
  FolderOpen,
  RefreshCw,
  Settings2,
} from "lucide-react";

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
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface KnowledgeBaseInfo {
  id: string;
  name: string;
  description: string;
  documentCount: number;
  createdAt: Date;
}

interface QueryResult {
  content: string;
  score: number;
  source: string;
}

export default function KnowledgePage() {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBaseInfo[]>([
    {
      id: "default",
      name: "기본 지식 베이스",
      description: "범용 지식 베이스",
      documentCount: 0,
      createdAt: new Date(),
    },
  ]);
  const [selectedKB, setSelectedKB] = useState<string>("default");
  const [isCreating, setIsCreating] = useState(false);
  const [newKBName, setNewKBName] = useState("");
  const [newKBDescription, setNewKBDescription] = useState("");

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  // Query state
  const [query, setQuery] = useState("");
  const [isQuerying, setIsQuerying] = useState(false);
  const [queryResults, setQueryResults] = useState<QueryResult[]>([]);

  // Create knowledge base
  const handleCreateKB = async () => {
    if (!newKBName.trim()) {
      toast.error("지식 베이스 이름을 입력해주세요");
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch("/api/knowledge-base", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: newKBName.toLowerCase().replace(/\s+/g, "-"),
          name: newKBName,
          description: newKBDescription,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setKnowledgeBases((prev) => [
          ...prev,
          {
            id: result.knowledgeBase.id,
            name: result.knowledgeBase.name,
            description: result.knowledgeBase.description,
            documentCount: 0,
            createdAt: new Date(),
          },
        ]);
        setNewKBName("");
        setNewKBDescription("");
        toast.success("지식 베이스가 생성되었습니다");
      } else {
        toast.error("지식 베이스 생성 실패");
      }
    } catch (error) {
      toast.error("지식 베이스 생성 중 오류 발생");
    } finally {
      setIsCreating(false);
    }
  };

  // File upload handler
  const handleFileUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      setIsUploading(true);
      setUploadProgress(0);

      const totalFiles = files.length;
      let completedFiles = 0;

      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("knowledgeBaseId", selectedKB);
        formData.append("chunkSize", "500");
        formData.append("chunkOverlap", "50");

        try {
          const response = await fetch("/api/knowledge-base", {
            method: "POST",
            body: formData,
          });

          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              toast.success(`${file.name}: ${result.chunkCount}개 청크 인덱싱됨`);
            } else {
              toast.error(`${file.name}: ${result.error}`);
            }
          } else {
            toast.error(`${file.name} 업로드 실패`);
          }
        } catch (error) {
          toast.error(`${file.name} 업로드 중 오류 발생`);
        }

        completedFiles++;
        setUploadProgress((completedFiles / totalFiles) * 100);
      }

      setIsUploading(false);
      setUploadProgress(0);

      // Update document count
      setKnowledgeBases((prev) =>
        prev.map((kb) =>
          kb.id === selectedKB
            ? { ...kb, documentCount: kb.documentCount + files.length }
            : kb
        )
      );
    },
    [selectedKB]
  );

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      handleFileUpload(e.dataTransfer.files);
    },
    [handleFileUpload]
  );

  // Query knowledge base
  const handleQuery = async () => {
    if (!query.trim()) return;

    setIsQuerying(true);
    try {
      const response = await fetch("/api/knowledge-base/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          knowledgeBaseId: selectedKB,
          query,
          options: { topK: 5, includeMetadata: true },
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setQueryResults(result.contexts || []);
      } else {
        toast.error("지식 베이스 쿼리 실패");
      }
    } catch (error) {
      toast.error("지식 베이스 쿼리 중 오류 발생");
    } finally {
      setIsQuerying(false);
    }
  };

  // Delete knowledge base
  const handleDeleteKB = async (id: string) => {
    if (id === "default") {
      toast.error("기본 지식 베이스는 삭제할 수 없습니다");
      return;
    }

    try {
      const response = await fetch(`/api/knowledge-base?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setKnowledgeBases((prev) => prev.filter((kb) => kb.id !== id));
        if (selectedKB === id) {
          setSelectedKB("default");
        }
        toast.success("지식 베이스가 삭제되었습니다");
      } else {
        toast.error("지식 베이스 삭제 실패");
      }
    } catch (error) {
      toast.error("지식 베이스 삭제 중 오류 발생");
    }
  };

  const selectedKBInfo = knowledgeBases.find((kb) => kb.id === selectedKB);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Database className="h-8 w-8" />
            지식 베이스
          </h1>
          <p className="text-muted-foreground">
            RAG 기반 AI를 위한 문서와 지식을 관리하세요
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              새 지식 베이스
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>지식 베이스 만들기</DialogTitle>
              <DialogDescription>
                문서를 정리할 새 지식 베이스를 만드세요
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>이름</Label>
                <Input
                  placeholder="내 지식 베이스"
                  value={newKBName}
                  onChange={(e) => setNewKBName(e.target.value)}
                />
              </div>
              <div>
                <Label>설명</Label>
                <Textarea
                  placeholder="이 지식 베이스에 대한 설명..."
                  value={newKBDescription}
                  onChange={(e) => setNewKBDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateKB} disabled={isCreating}>
                {isCreating ? "생성 중..." : "만들기"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Knowledge Base List */}
        <div className="col-span-3 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">지식 베이스 목록</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {knowledgeBases.map((kb) => (
                  <div
                    key={kb.id}
                    className={cn(
                      "flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors",
                      selectedKB === kb.id && "bg-muted"
                    )}
                    onClick={() => setSelectedKB(kb.id)}
                  >
                    <div className="flex items-center gap-3">
                      <FolderOpen className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{kb.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {kb.documentCount}개 문서
                        </p>
                      </div>
                    </div>
                    {kb.id !== "default" && (
                      <ConfirmDialog
                        title="지식 베이스 삭제"
                        description={`"${kb.name}"을(를) 삭제하시겠습니까? 이 작업은 되돌릴 수 없으며, 모든 문서가 삭제됩니다.`}
                        confirmText="삭제"
                        variant="destructive"
                        onConfirm={async () => {
                          await handleDeleteKB(kb.id);
                        }}
                        trigger={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`${kb.name} 삭제`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
                          </Button>
                        }
                      />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="col-span-9 space-y-6">
          {/* Selected KB Info */}
          {selectedKBInfo && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{selectedKBInfo.name}</CardTitle>
                    <CardDescription>
                      {selectedKBInfo.description || "설명 없음"}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">
                    {selectedKBInfo.documentCount}개 문서
                  </Badge>
                </div>
              </CardHeader>
            </Card>
          )}

          <Tabs defaultValue="upload" className="space-y-4">
            <TabsList>
              <TabsTrigger value="upload">문서 업로드</TabsTrigger>
              <TabsTrigger value="query">쿼리</TabsTrigger>
              <TabsTrigger value="settings">설정</TabsTrigger>
            </TabsList>

            {/* Upload Tab */}
            <TabsContent value="upload">
              <Card>
                <CardHeader>
                  <CardTitle>문서 업로드</CardTitle>
                  <CardDescription>
                    지식 베이스에 추가할 문서를 업로드하세요
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Drop Zone */}
                  <div
                    className={cn(
                      "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                      dragActive
                        ? "border-primary bg-primary/5"
                        : "border-muted-foreground/25"
                    )}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-medium mb-2">
                      파일을 여기에 드롭하거나 클릭하여 업로드
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      지원 형식: PDF, DOCX, XLSX, TXT, CSV
                    </p>
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      multiple
                      accept=".pdf,.docx,.xlsx,.txt,.csv"
                      onChange={(e) => handleFileUpload(e.target.files)}
                    />
                    <Button asChild disabled={isUploading}>
                      <label htmlFor="file-upload" className="cursor-pointer">
                        {isUploading ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            업로드 중... {uploadProgress.toFixed(0)}%
                          </>
                        ) : (
                          "파일 선택"
                        )}
                      </label>
                    </Button>
                  </div>

                  {/* File type icons */}
                  <div className="flex justify-center gap-8 mt-6 pt-6 border-t">
                    <div className="text-center">
                      <File className="h-8 w-8 mx-auto text-red-500 mb-1" />
                      <span className="text-xs text-muted-foreground">PDF</span>
                    </div>
                    <div className="text-center">
                      <FileText className="h-8 w-8 mx-auto text-blue-500 mb-1" />
                      <span className="text-xs text-muted-foreground">DOCX</span>
                    </div>
                    <div className="text-center">
                      <FileSpreadsheet className="h-8 w-8 mx-auto text-green-500 mb-1" />
                      <span className="text-xs text-muted-foreground">XLSX</span>
                    </div>
                    <div className="text-center">
                      <FileText className="h-8 w-8 mx-auto text-gray-500 mb-1" />
                      <span className="text-xs text-muted-foreground">TXT</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Query Tab */}
            <TabsContent value="query">
              <Card>
                <CardHeader>
                  <CardTitle>지식 베이스 쿼리</CardTitle>
                  <CardDescription>
                    자연어로 지식 베이스를 검색하세요
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="문서에 대해 질문하세요..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleQuery()}
                    />
                    <Button
                      onClick={handleQuery}
                      disabled={isQuerying}
                      aria-label="지식 베이스 검색"
                    >
                      {isQuerying ? (
                        <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <Search className="h-4 w-4" aria-hidden="true" />
                      )}
                    </Button>
                  </div>

                  {/* Results */}
                  {queryResults.length > 0 && (
                    <div className="space-y-4 mt-4">
                      <h4 className="font-medium">결과</h4>
                      {queryResults.map((result, index) => (
                        <Card key={index}>
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between mb-2">
                              <Badge variant="outline">
                                Score: {result.score.toFixed(3)}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {result.source}
                              </span>
                            </div>
                            <p className="text-sm">{result.content}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>지식 베이스 설정</CardTitle>
                  <CardDescription>
                    청킹 및 인덱싱 옵션을 구성하세요
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>청크 크기</Label>
                      <Input type="number" defaultValue={500} />
                      <p className="text-xs text-muted-foreground mt-1">
                        청크당 문자 수
                      </p>
                    </div>
                    <div>
                      <Label>청크 오버랩</Label>
                      <Input type="number" defaultValue={50} />
                      <p className="text-xs text-muted-foreground mt-1">
                        청크 간 중첩 문자 수
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>벡터 가중치</Label>
                      <Input
                        type="number"
                        defaultValue={0.7}
                        min={0}
                        max={1}
                        step={0.1}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        벡터 유사도 가중치 (0-1)
                      </p>
                    </div>
                    <div>
                      <Label>키워드 가중치</Label>
                      <Input
                        type="number"
                        defaultValue={0.3}
                        min={0}
                        max={1}
                        step={0.1}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        키워드 매칭 가중치 (0-1)
                      </p>
                    </div>
                  </div>
                  <Button>설정 저장</Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
