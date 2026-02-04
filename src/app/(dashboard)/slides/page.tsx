"use client";

import { useState, useRef, useEffect } from "react";
import {
  Presentation,
  FileText,
  ChevronLeft,
  ChevronRight,
  Play,
  Download,
  Plus,
  Loader2,
  Check,
  Search,
  FileBarChart,
  Layout,
  Palette,
  Maximize2,
  Minimize2,
  X,
  Eye,
  Edit3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Presentation as PresentationType,
  Slide,
  SlideGenerationProgress,
  DEFAULT_THEMES,
  SLIDE_DIMENSIONS,
} from "@/types/slides";

// 슬라이드 렌더러 컴포넌트
function SlideRenderer({
  slide,
  theme,
  scale = 1,
  isActive = false,
  onClick,
}: {
  slide: Slide;
  theme: PresentationType["theme"];
  scale?: number;
  isActive?: boolean;
  onClick?: () => void;
}) {
  const width = SLIDE_DIMENSIONS.width * scale;
  const height = SLIDE_DIMENSIONS.height * scale;

  // 배경 스타일
  const getBackgroundStyle = () => {
    if (slide.background.type === "gradient" && slide.background.gradient) {
      const { from, to, direction } = slide.background.gradient;
      const gradientDir =
        direction === "to-r"
          ? "to right"
          : direction === "to-b"
          ? "to bottom"
          : direction === "to-br"
          ? "to bottom right"
          : "to bottom left";
      return { background: `linear-gradient(${gradientDir}, ${from}, ${to})` };
    }
    return { backgroundColor: slide.background.color || theme.colors.background };
  };

  return (
    <div
      className={`relative overflow-hidden rounded-lg shadow-lg transition-all cursor-pointer ${
        isActive ? "ring-2 ring-primary" : "hover:ring-1 hover:ring-primary/50"
      }`}
      style={{
        width,
        height,
        ...getBackgroundStyle(),
      }}
      onClick={onClick}
    >
      {slide.elements.map((element) => {
        const style: React.CSSProperties = {
          position: "absolute",
          left: element.style.position.x * scale,
          top: element.style.position.y * scale,
          width: element.style.size.width * scale,
          height: element.style.size.height * scale,
          fontSize: (element.style.fontSize || 16) * scale,
          fontWeight: element.style.fontWeight,
          color:
            slide.background.type === "gradient"
              ? "#ffffff"
              : element.style.color || theme.colors.text,
          textAlign: element.style.textAlign,
          padding: (element.style.padding || 0) * scale,
          overflow: "hidden",
        };

        if (element.type === "heading") {
          return (
            <h1 key={element.id} style={style} className="leading-tight">
              {element.content}
            </h1>
          );
        }

        if (element.type === "subheading") {
          return (
            <h2 key={element.id} style={style} className="leading-snug opacity-80">
              {element.content}
            </h2>
          );
        }

        if (element.type === "list") {
          const items = element.content.split("\n").filter((item) => item.trim());
          return (
            <ul key={element.id} style={style} className="space-y-1">
              {items.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span
                    className="mt-2 h-1.5 w-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: theme.colors.primary }}
                  />
                  <span>{item.replace(/^[-•]\s*/, "")}</span>
                </li>
              ))}
            </ul>
          );
        }

        if (element.type === "quote") {
          return (
            <blockquote
              key={element.id}
              style={style}
              className="italic border-l-4 pl-4"
            >
              "{element.content}"
            </blockquote>
          );
        }

        return (
          <p key={element.id} style={style} className="whitespace-pre-wrap">
            {element.content}
          </p>
        );
      })}

      {/* 슬라이드 번호 */}
      <div
        className="absolute bottom-2 right-3 text-xs opacity-50"
        style={{
          color:
            slide.background.type === "gradient" ? "#ffffff" : theme.colors.muted,
        }}
      >
        {slide.slideNumber}
      </div>
    </div>
  );
}

// 진행 상태 표시 컴포넌트
function GenerationProgress({
  progress,
}: {
  progress: SlideGenerationProgress & { outline?: object; plans?: object[]; slide?: object };
}) {
  const stageLabels: Record<string, string> = {
    analyzing: "의도 분석",
    "researching-topic": "주제 검색",
    "creating-outline": "개요 생성",
    "planning-slides": "슬라이드 계획",
    "researching-slides": "자료 조사",
    "generating-content": "콘텐츠 생성",
    "designing-layout": "레이아웃 디자인",
    complete: "완료",
    error: "오류",
  };

  const stageIcons: Record<string, React.ReactNode> = {
    analyzing: <Presentation className="h-4 w-4" />,
    "researching-topic": <Search className="h-4 w-4" />,
    "creating-outline": <FileBarChart className="h-4 w-4" />,
    "planning-slides": <Layout className="h-4 w-4" />,
    "researching-slides": <Search className="h-4 w-4" />,
    "generating-content": <Edit3 className="h-4 w-4" />,
    "designing-layout": <Palette className="h-4 w-4" />,
    complete: <Check className="h-4 w-4" />,
    error: <X className="h-4 w-4" />,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div
          className={`p-2 rounded-lg ${
            progress.stage === "error"
              ? "bg-red-500/10 text-red-500"
              : progress.stage === "complete"
              ? "bg-green-500/10 text-green-500"
              : "bg-primary/10 text-primary"
          }`}
        >
          {progress.stage === "complete" || progress.stage === "error" ? (
            stageIcons[progress.stage]
          ) : (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">
              {stageLabels[progress.stage] || progress.stage}
            </span>
            <span className="text-xs text-muted-foreground">{progress.progress}%</span>
          </div>
          <Progress value={progress.progress} className="h-2" />
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{progress.message}</p>

      {/* 진행 상태별 추가 정보 */}
      {progress.currentSlide && progress.totalSlides && (
        <div className="text-xs text-muted-foreground">
          슬라이드 {progress.currentSlide} / {progress.totalSlides}
        </div>
      )}
    </div>
  );
}

// 메인 페이지 컴포넌트
export default function SlidesPage() {
  const [prompt, setPrompt] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("modern-dark");
  const [slideCount, setSlideCount] = useState(20);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<SlideGenerationProgress | null>(null);
  const [presentation, setPresentation] = useState<PresentationType | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");
  const fullscreenRef = useRef<HTMLDivElement>(null);

  // 슬라이드 생성
  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setProgress({ stage: "analyzing", message: "시작 중...", progress: 0 });
    setPresentation(null);

    try {
      const response = await fetch("/api/slides/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          slideCount,
          themeId: selectedTheme,
        }),
      });

      if (!response.ok) {
        throw new Error("슬라이드 생성 실패");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("No reader");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              setProgress(data);

              if (data.presentation) {
                setPresentation(data.presentation);
              }
            } catch (e) {
              // JSON 파싱 오류 무시
            }
          }
        }
      }
    } catch (error) {
      console.error("슬라이드 생성 오류:", error);
      setProgress({
        stage: "error" as SlideGenerationProgress["stage"],
        message: (error as Error).message,
        progress: 0,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // 풀스크린 토글
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      fullscreenRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // 키보드 네비게이션
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!presentation) return;

      if (e.key === "ArrowRight" || e.key === " ") {
        setCurrentSlideIndex((prev) =>
          Math.min(prev + 1, presentation.slides.length - 1)
        );
      } else if (e.key === "ArrowLeft") {
        setCurrentSlideIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [presentation, isFullscreen]);

  // 풀스크린 변경 감지
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const theme =
    presentation?.theme ||
    DEFAULT_THEMES.find((t) => t.id === selectedTheme) ||
    DEFAULT_THEMES[0];

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-2">
          <Presentation className="h-5 w-5 text-primary" />
          <h1 className="font-semibold">AI 슬라이드</h1>
          {presentation && (
            <Badge variant="secondary">{presentation.slides.length}장</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {presentation && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === "edit" ? "preview" : "edit")}
              >
                {viewMode === "edit" ? (
                  <>
                    <Eye className="mr-1 h-4 w-4" /> 미리보기
                  </>
                ) : (
                  <>
                    <Edit3 className="mr-1 h-4 w-4" /> 편집
                  </>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={toggleFullscreen}>
                <Play className="mr-1 h-4 w-4" /> 발표
              </Button>
              <Button variant="outline" size="sm">
                <Download className="mr-1 h-4 w-4" /> 내보내기
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* 좌측: 생성 패널 또는 슬라이드 목록 */}
        <div className="w-80 border-r flex flex-col">
          {!presentation ? (
            // 생성 패널
            <div className="p-4 space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  프레젠테이션 주제
                </label>
                <Textarea
                  placeholder="예: 2025년 AI 트렌드 분석 및 비즈니스 전략"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">테마</label>
                <Select value={selectedTheme} onValueChange={setSelectedTheme}>
                  <SelectTrigger>
                    <SelectValue placeholder="테마 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEFAULT_THEMES.map((theme) => (
                      <SelectItem key={theme.id} value={theme.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: theme.colors.primary }}
                          />
                          {theme.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  슬라이드 수: {slideCount}장
                </label>
                <input
                  type="range"
                  min={10}
                  max={30}
                  value={slideCount}
                  onChange={(e) => setSlideCount(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    생성 중...
                  </>
                ) : (
                  <>
                    <Presentation className="mr-2 h-4 w-4" />
                    슬라이드 생성
                  </>
                )}
              </Button>

              {/* 진행 상태 */}
              {progress && (
                <div className="mt-4 p-4 rounded-lg bg-muted/50">
                  <GenerationProgress progress={progress as SlideGenerationProgress & { outline?: object; plans?: object[]; slide?: object }} />
                </div>
              )}

              {/* 생성 파이프라인 설명 */}
              <div className="mt-4 p-4 rounded-lg border bg-card">
                <h3 className="text-sm font-medium mb-3">생성 파이프라인</h3>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      1
                    </div>
                    <span>의도 분석 & Perplexity 검색</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      2
                    </div>
                    <span>프레젠테이션 개요 생성</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      3
                    </div>
                    <span>{slideCount}장 슬라이드 계획</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      4
                    </div>
                    <span>슬라이드별 자료 조사</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      5
                    </div>
                    <span>콘텐츠 & 레이아웃 생성</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // 슬라이드 썸네일 목록
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mb-2"
                  onClick={() => {
                    setPresentation(null);
                    setProgress(null);
                  }}
                >
                  <Plus className="mr-1 h-4 w-4" />새 프레젠테이션
                </Button>

                {presentation.slides.map((slide, index) => (
                  <div
                    key={slide.id}
                    className={`p-2 rounded-lg cursor-pointer transition-colors ${
                      currentSlideIndex === index
                        ? "bg-primary/10 border-2 border-primary"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => setCurrentSlideIndex(index)}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-muted-foreground w-5">
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <SlideRenderer
                          slide={slide}
                          theme={theme}
                          scale={0.12}
                          isActive={currentSlideIndex === index}
                        />
                        <p className="text-xs mt-1 truncate">{slide.title}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* 메인: 슬라이드 뷰어 */}
        <div className="flex-1 flex flex-col bg-muted/30">
          {presentation ? (
            <>
              {/* 슬라이드 뷰어 */}
              <div
                ref={fullscreenRef}
                className={`flex-1 flex items-center justify-center p-8 ${
                  isFullscreen ? "bg-black" : ""
                }`}
              >
                <SlideRenderer
                  slide={presentation.slides[currentSlideIndex]}
                  theme={theme}
                  scale={isFullscreen ? 1.5 : 0.8}
                />
              </div>

              {/* 네비게이션 */}
              {!isFullscreen && (
                <div className="border-t p-4 flex items-center justify-between bg-background">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentSlideIndex((prev) => Math.max(prev - 1, 0))
                    }
                    disabled={currentSlideIndex === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <div className="flex items-center gap-4">
                    <span className="text-sm">
                      {currentSlideIndex + 1} / {presentation.slides.length}
                    </span>
                    <Badge variant="secondary">
                      {presentation.slides[currentSlideIndex].layout}
                    </Badge>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentSlideIndex((prev) =>
                        Math.min(prev + 1, presentation.slides.length - 1)
                      )
                    }
                    disabled={currentSlideIndex === presentation.slides.length - 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            // 빈 상태
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500">
                  <Presentation className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-xl font-semibold">AI 슬라이드 생성</h2>
                <p className="mt-2 text-muted-foreground max-w-md">
                  주제를 입력하면 Perplexity가 자료를 검색하고,
                  <br />
                  AI가 전문적인 프레젠테이션을 자동으로 생성합니다.
                </p>
                <div className="mt-6 flex justify-center gap-2">
                  <Badge variant="outline">16:9 규격</Badge>
                  <Badge variant="outline">1280×720px</Badge>
                  <Badge variant="outline">최대 30장</Badge>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 우측: 슬라이드 속성 패널 (편집 모드) */}
        {presentation && viewMode === "edit" && (
          <div className="w-72 border-l p-4">
            <h3 className="font-medium mb-4">슬라이드 속성</h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">제목</label>
                <Input
                  value={presentation.slides[currentSlideIndex].title}
                  className="mt-1"
                  readOnly
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground">레이아웃</label>
                <Select
                  value={presentation.slides[currentSlideIndex].layout}
                  disabled
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="title">타이틀</SelectItem>
                    <SelectItem value="title-content">제목 + 본문</SelectItem>
                    <SelectItem value="title-two-column">2열</SelectItem>
                    <SelectItem value="section">섹션</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 발표자 노트 */}
              {presentation.slides[currentSlideIndex].notes && (
                <div>
                  <label className="text-sm text-muted-foreground">발표자 노트</label>
                  <Textarea
                    value={presentation.slides[currentSlideIndex].notes}
                    className="mt-1 text-xs"
                    rows={4}
                    readOnly
                  />
                </div>
              )}

              {/* 검색 자료 */}
              {presentation.slides[currentSlideIndex].research && (
                <div>
                  <label className="text-sm text-muted-foreground flex items-center gap-1">
                    <Search className="h-3 w-3" />
                    검색 자료
                  </label>
                  <div className="mt-1 p-2 rounded bg-muted text-xs max-h-32 overflow-auto">
                    {presentation.slides[currentSlideIndex].research?.substring(
                      0,
                      300
                    )}
                    ...
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 풀스크린 컨트롤 */}
      {isFullscreen && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/80 rounded-lg p-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-white"
            onClick={() =>
              setCurrentSlideIndex((prev) => Math.max(prev - 1, 0))
            }
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="text-white text-sm px-4">
            {currentSlideIndex + 1} / {presentation?.slides.length}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="text-white"
            onClick={() =>
              setCurrentSlideIndex((prev) =>
                Math.min(prev + 1, (presentation?.slides.length || 1) - 1)
              )
            }
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
          <div className="w-px h-6 bg-white/30 mx-2" />
          <Button
            variant="ghost"
            size="sm"
            className="text-white"
            onClick={toggleFullscreen}
          >
            <Minimize2 className="h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  );
}
