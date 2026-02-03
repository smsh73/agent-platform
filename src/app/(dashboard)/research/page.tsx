"use client";

import { useState, useRef, useEffect } from "react";
import {
  Search,
  Loader2,
  FileText,
  Zap,
  Layers,
  BookOpen,
  Download,
  Copy,
  Check,
  History,
  Trash2,
  Sparkles,
  Eye,
  Maximize2,
  X,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Button } from "@/components/ui/button";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";

interface ResearchResult {
  id: string;
  query: string;
  content: string;
  depth: string;
  createdAt: Date;
}

interface ResearchProgress {
  stage: string;
  step?: number;
  totalSteps?: number;
  agent?: string;
  message: string;
  progress: number;
  outline?: {
    title: string;
    summary: string;
    sections: { title: string; keyPoints: string[] }[];
    keywords: string[];
  };
}

const DEPTH_OPTIONS = [
  {
    id: "quick",
    name: "퀵 리서치",
    icon: Zap,
    description: "빠른 핵심 요약",
    time: "~1분",
  },
  {
    id: "standard",
    name: "표준 리서치",
    icon: FileText,
    description: "체계적인 분석",
    time: "~2분",
  },
  {
    id: "deep",
    name: "심층 리서치",
    icon: Layers,
    description: "상세한 보고서",
    time: "~3분",
  },
];

const AI_AGENTS = [
  { name: "Perplexity", color: "bg-purple-500", role: "1차 자료 수집" },
  { name: "GPT-4o", color: "bg-green-500", role: "검증 & 개요" },
  { name: "Gemini", color: "bg-blue-500", role: "크롤링 & 검색" },
  { name: "GPT-4o", color: "bg-green-500", role: "초안 작성" },
  { name: "Claude", color: "bg-orange-500", role: "Narrative" },
];

// 진행 상태 컴포넌트
function CollaborationProgress({ progress }: { progress: ResearchProgress }) {
  const currentStepIndex = (progress.step || 1) - 1;

  return (
    <div className="space-y-4">
      {/* AI 협업 플로우 */}
      <div className="flex items-center justify-between gap-2">
        {AI_AGENTS.map((agent, idx) => {
          const isActive = idx === currentStepIndex;
          const isComplete = idx < currentStepIndex;

          return (
            <div key={idx} className="flex items-center flex-1">
              <div
                className={`relative flex flex-col items-center gap-1 flex-1 ${
                  idx > 0 ? "ml-2" : ""
                }`}
              >
                <div
                  className={`w-full px-2 py-1.5 rounded-lg text-center transition-all ${
                    isComplete
                      ? `${agent.color} text-white`
                      : isActive
                      ? `${agent.color}/20 border-2 ${agent.color.replace("bg-", "border-")}`
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isActive && <Loader2 className="h-3 w-3 animate-spin mx-auto mb-1" />}
                  <div className="text-xs font-medium">{agent.name}</div>
                  <div className="text-[10px] opacity-80">{agent.role}</div>
                </div>
              </div>
              {idx < AI_AGENTS.length - 1 && (
                <div className="mx-1">→</div>
              )}
            </div>
          );
        })}
      </div>

      {/* 전체 진행률 */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            {progress.agent && (
              <Badge variant="secondary" className="text-xs">
                {progress.agent}
              </Badge>
            )}
            Step {progress.step} / {progress.totalSteps}
          </span>
          <span className="font-medium">{progress.progress}%</span>
        </div>
        <Progress value={progress.progress} className="h-2" />
      </div>

      {/* 현재 상태 메시지 */}
      <div className="text-sm whitespace-pre-line bg-muted/50 rounded-lg p-3">
        {progress.message}
      </div>

      {/* 개요 표시 */}
      {progress.outline && (
        <div className="pt-3 border-t space-y-2">
          <div>
            <p className="text-xs font-medium text-muted-foreground">보고서 구조</p>
            <div className="mt-2 space-y-1">
              {progress.outline.sections.map((section, i) => (
                <div key={i} className="text-xs bg-muted rounded px-2 py-1">
                  {i + 1}. {section.title}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 마크다운 렌더러
function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:mt-6 prose-headings:mb-3 prose-p:my-3 prose-li:my-1">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold mt-6 mb-4 pb-2 border-b">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold mt-6 mb-3 text-primary">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-medium mt-4 mb-2">{children}</h3>
          ),
          p: ({ children }) => <p className="my-3 leading-relaxed">{children}</p>,
          ul: ({ children }) => (
            <ul className="my-3 space-y-1 list-disc list-inside">{children}</ul>
          ),
          li: ({ children }) => <li className="ml-2">{children}</li>,
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default function ResearchPage() {
  const [query, setQuery] = useState("");
  const [depth, setDepth] = useState<"quick" | "standard" | "deep">("standard");
  const [isResearching, setIsResearching] = useState(false);
  const [artifact, setArtifact] = useState(""); // 아티팩트 내용
  const [progress, setProgress] = useState<ResearchProgress | null>(null);
  const [history, setHistory] = useState<ResearchResult[]>([]);
  const [copied, setCopied] = useState(false);
  const [showArtifact, setShowArtifact] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 리서치 시작
  const handleResearch = async () => {
    if (!query.trim()) {
      toast.error("검색할 내용을 입력해주세요");
      return;
    }

    setIsResearching(true);
    setArtifact("");
    setShowArtifact(true);
    setProgress({ stage: "perplexity", message: "시작 중...", progress: 0 });

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, depth }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "리서치 실패");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("응답을 읽을 수 없습니다");

      let buffer = "";
      let finalContent = ""; // 최종 콘텐츠를 로컬에 저장

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("event: progress")) {
            continue;
          }

          if (line.startsWith("event: artifact")) {
            continue;
          }

          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6);
            try {
              const data = JSON.parse(dataStr);

              if (data.content !== undefined) {
                // 아티팩트 업데이트
                finalContent = data.content;
                setArtifact(data.content);
                console.log("아티팩트 수신:", data.content.substring(0, 100));
              } else if (data.stage) {
                // 진행 상태 업데이트
                setProgress(data);
                console.log("진행 상태:", data.stage, data.progress);
              }
            } catch (e) {
              // JSON 파싱 실패 로그
              console.log("JSON 파싱 실패:", dataStr.substring(0, 100));
            }
          }
        }
      }

      // 히스토리에 추가 (로컬 변수 사용)
      if (finalContent) {
        const newResult: ResearchResult = {
          id: `research-${Date.now()}`,
          query,
          content: finalContent,
          depth,
          createdAt: new Date(),
        };
        setHistory((prev) => [newResult, ...prev].slice(0, 20));
        toast.success("리서치가 완료되었습니다!");
      }
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        toast.info("리서치가 중단되었습니다");
      } else {
        toast.error((error as Error).message);
      }
    } finally {
      setIsResearching(false);
      abortControllerRef.current = null;
    }
  };

  const handleCopy = async () => {
    if (!artifact) return;
    await navigator.clipboard.writeText(artifact);
    setCopied(true);
    toast.success("클립보드에 복사되었습니다");
    setTimeout(() => setCopied(false), 2000);
  };

  const loadFromHistory = (result: ResearchResult) => {
    setQuery(result.query);
    setArtifact(result.content);
    setDepth(result.depth as typeof depth);
    setProgress(null);
    setShowArtifact(true);
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* 왼쪽: 히스토리 */}
      <div className="w-72 border-r bg-muted/30 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4" />
            <h3 className="font-semibold text-sm">리서치 기록</h3>
          </div>
          <Badge variant="secondary">{history.length}</Badge>
        </div>
        <ScrollArea className="h-[calc(100vh-10rem)]">
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              리서치 기록이 없습니다
            </p>
          ) : (
            <div className="space-y-2">
              {history.map((result) => (
                <div
                  key={result.id}
                  className="group p-3 rounded-lg border bg-background hover:bg-muted/50 cursor-pointer"
                  onClick={() => loadFromHistory(result)}
                >
                  <p className="text-sm font-medium line-clamp-2">{result.query}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {DEPTH_OPTIONS.find((d) => d.id === result.depth)?.name}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* 중앙: 입력 및 진행 상태 */}
      <div className="flex-1 flex flex-col">
        <div className="border-b p-6">
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Agentic Research</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              5개 AI 협업: Perplexity → GPT-4o → Gemini → GPT-4o → Claude
            </p>

            <div className="flex gap-2">
              <Textarea
                placeholder="리서치할 주제를 입력하세요..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                rows={2}
                className="resize-none flex-1"
              />
              <div className="flex flex-col gap-2">
                <Select value={depth} onValueChange={(v) => setDepth(v as typeof depth)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPTH_OPTIONS.map((opt) => (
                      <SelectItem key={opt.id} value={opt.id}>
                        {opt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleResearch}
                  disabled={isResearching || !query.trim()}
                  className="w-[140px]"
                >
                  {isResearching ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  리서치
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* 진행 상태 */}
        {progress && (
          <div className="p-6 border-b">
            <div className="max-w-2xl mx-auto">
              <CollaborationProgress progress={progress} />
            </div>
          </div>
        )}

        {/* 빈 상태 또는 채팅 영역 */}
        <div className="flex-1 flex items-center justify-center p-6">
          {!artifact && !isResearching ? (
            <div className="text-center max-w-2xl">
              <BookOpen className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h2 className="text-xl font-semibold mb-2">AI 협업 리서치</h2>
              <p className="text-muted-foreground mb-8">
                5개 AI가 협업하여 검증된 보고서를 생성합니다
              </p>
              <div className="grid grid-cols-5 gap-2">
                {AI_AGENTS.map((agent, i) => (
                  <div key={i} className="text-center p-3 rounded-lg border bg-card">
                    <div className={`w-8 h-8 ${agent.color} rounded-full mx-auto mb-2`} />
                    <p className="text-xs font-medium">{agent.name}</p>
                    <p className="text-[10px] text-muted-foreground">{agent.role}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MessageSquare className="h-5 w-5" />
              <span>보고서는 오른쪽 아티팩트 패널에서 확인하세요</span>
            </div>
          )}
        </div>
      </div>

      {/* 우측: 아티팩트 미리보기 패널 */}
      {showArtifact && (
        <div className="w-[600px] border-l flex flex-col bg-background">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">리서치 보고서</span>
              {isResearching && (
                <Badge variant="secondary" className="text-xs">
                  생성 중...
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {artifact && (
                <Button variant="ghost" size="sm" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowArtifact(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1 p-6">
            {artifact ? (
              <MarkdownContent content={artifact} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  AI가 협업하여 보고서를 생성하고 있습니다...
                </p>
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
