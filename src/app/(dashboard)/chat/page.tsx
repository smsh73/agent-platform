"use client";

import { useRef, useEffect, Suspense, useState } from "react";
import { Plus, History, Trash2, MessageSquare, ChevronDown, ChevronUp, PanelLeftClose, PanelLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessage } from "@/components/chat/chat-message";
import { ModelSelector } from "@/components/chat/model-selector";
import { ConversationHistory } from "@/components/chat/conversation-history";
import { ChatProvider, useChatContext, Message } from "@/components/chat/chat-provider";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// MoA 분석 결과 표시 컴포넌트
function MoAAnalysisPanel({ message }: { message: Message }) {
  const [isOpen, setIsOpen] = useState(false);
  const moaResult = message.moaResult;

  if (!moaResult) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-4">
      <CollapsibleTrigger asChild>
        <Button variant="outline" size="sm" className="w-full justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            <span>Mixture of Agents 분석 결과</span>
            <Badge variant="secondary" className="text-xs">
              {moaResult.totalLatency}ms
            </Badge>
          </div>
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-4 space-y-4">
        {/* 검색 결과 */}
        {moaResult.searchResults && (
          <div className="rounded-lg border p-4">
            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
              <span className="text-purple-500">🔍</span> Perplexity 검색 결과
            </h4>
            <p className="text-sm text-muted-foreground line-clamp-3">
              {moaResult.searchResults.substring(0, 300)}...
            </p>
          </div>
        )}

        {/* 에이전트 응답 */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">에이전트 응답</h4>
          <div className="grid gap-3">
            {moaResult.agentResponses.map((response, idx) => {
              const ranking = moaResult.analysis.rankings.find(
                (r) => r.provider === response.provider
              );
              return (
                <div key={idx} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={
                          response.provider === "openai"
                            ? "border-green-500 text-green-600"
                            : response.provider === "anthropic"
                            ? "border-orange-500 text-orange-600"
                            : "border-blue-500 text-blue-600"
                        }
                      >
                        {response.provider}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {response.model}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {ranking && (
                        <Badge variant="secondary" className="text-xs">
                          점수: {ranking.score}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {response.latency}ms
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {response.content.substring(0, 200)}...
                  </p>
                  {ranking && ranking.strengths.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {ranking.strengths.map((s, i) => (
                        <Badge key={i} variant="outline" className="text-xs bg-green-50">
                          ✓ {s}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 선별된 최고 파트 */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">선별된 최고 파트</h4>
          <div className="space-y-2">
            {moaResult.analysis.bestParts.slice(0, 3).map((part, idx) => (
              <div key={idx} className="rounded-lg bg-primary/5 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary" className="text-xs">
                    {part.provider}
                  </Badge>
                  <span className="text-xs font-medium">{part.section}</span>
                </div>
                <p className="text-xs text-muted-foreground">{part.reason}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 메타 정보 */}
        <div className="text-xs text-muted-foreground border-t pt-3">
          <div className="flex items-center justify-between">
            <span>Orchestrator: {moaResult.orchestrator}</span>
            <span>Narrator: {moaResult.narrator}</span>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function ChatContent() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showHistory, setShowHistory] = useState(false);
  const {
    messages,
    isLoading,
    selectedModel,
    currentAgent,
    isMoAMode,
    currentConversationId,
    sendMessage,
    setSelectedModel,
    setMoAMode,
    clearMessages,
    stopGeneration,
    loadConversation,
    createNewConversation,
  } = useChatContext();

  // 시스템 메시지 제외한 메시지 (표시용)
  const displayMessages = messages.filter(m => m.role !== "system");

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (content: string) => {
    sendMessage(content);
  };

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Conversation History Sidebar */}
      <div
        className={cn(
          "border-r transition-all duration-300",
          showHistory ? "w-80" : "w-0 border-0"
        )}
      >
        {showHistory && (
          <ConversationHistory
            currentConversationId={currentConversationId || undefined}
            onSelectConversation={loadConversation}
            onNewConversation={createNewConversation}
          />
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-2">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              aria-label={showHistory ? "대화 기록 숨기기" : "대화 기록 보기"}
            >
              {showHistory ? (
                <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
              ) : (
                <PanelLeft className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>
            {currentAgent ? (
              <Badge variant="secondary" className="flex items-center gap-1 py-1.5 px-3">
                <MessageSquare className="h-3 w-3" />
                {currentAgent.name}
              </Badge>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              onClick={createNewConversation}
            >
              <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
              새 대화
            </Button>
          </div>
        <div className="flex items-center gap-3">
          {/* MoA 토글 */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2">
                  <Switch
                    id="moa-mode"
                    checked={isMoAMode}
                    onCheckedChange={setMoAMode}
                  />
                  <label
                    htmlFor="moa-mode"
                    className={`text-sm font-medium cursor-pointer flex items-center gap-1 ${
                      isMoAMode ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    <MessageSquare className="h-3 w-3" />
                    MoA
                  </label>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p className="font-medium">Mixture of Agents</p>
                <p className="text-xs text-muted-foreground mt-1">
                  OpenAI, Claude, Gemini가 동시에 응답하고,<br />
                  최고의 답변을 조합하여 생성합니다.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {!isMoAMode && (
            <ModelSelector
              selectedModel={selectedModel}
              onModelChange={handleModelChange}
            />
          )}
          {displayMessages.length > 0 && (
            <ConfirmDialog
              title="대화 삭제"
              description="모든 대화 내용이 삭제됩니다. 이 작업은 되돌릴 수 없습니다."
              confirmText="삭제"
              variant="destructive"
              onConfirm={async () => {
                clearMessages();
              }}
              trigger={
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  aria-label="대화 삭제"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              }
            />
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1">
        {displayMessages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-8">
            <div className="text-center">
              {isMoAMode ? (
                <>
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-3xl">
                    <MessageSquare className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold">Mixture of Agents</h2>
                  <p className="mt-2 text-muted-foreground max-w-md">
                    OpenAI, Claude, Gemini가 동시에 응답하고,<br />
                    Perplexity가 최신 정보를 검색합니다.<br />
                    AI가 각 응답을 분석하여 최고의 답변을 조합합니다.
                  </p>
                  <div className="mt-4 flex justify-center gap-2">
                    <Badge className="bg-green-500">GPT-4o</Badge>
                    <Badge className="bg-orange-500">Claude 3.5</Badge>
                    <Badge className="bg-blue-500">Gemini 1.5</Badge>
                    <Badge className="bg-purple-500">Perplexity</Badge>
                  </div>
                </>
              ) : currentAgent ? (
                <>
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-3xl">
                    <MessageSquare className="h-8 w-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold">{currentAgent.name}</h2>
                  <p className="mt-2 text-muted-foreground">
                    무엇을 도와드릴까요?
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold">Agent Platform에 오신 것을 환영합니다</h2>
                  <p className="mt-2 text-muted-foreground">
                    어떤 AI 모델과도 대화를 시작하세요. OpenAI, Claude, Gemini,
                    Perplexity 중에서 선택할 수 있습니다.
                  </p>
                </>
              )}
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    title: "코드 작성",
                    prompt: "할 일 목록을 위한 React 컴포넌트를 작성해주세요",
                  },
                  {
                    title: "개념 설명",
                    prompt: "머신러닝이 어떻게 작동하는지 쉽게 설명해주세요",
                  },
                  {
                    title: "데이터 분석",
                    prompt: "이 데이터셋을 분석하고 인사이트를 찾아주세요",
                  },
                  {
                    title: "창작 글쓰기",
                    prompt: "AI 어시스턴트에 관한 짧은 이야기를 써주세요",
                  },
                ].map((example) => (
                  <button
                    key={example.title}
                    onClick={() => handleSend(example.prompt)}
                    className="rounded-lg border p-4 text-left transition-colors hover:bg-muted"
                  >
                    <h3 className="font-medium">{example.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {example.prompt}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl pb-4">
            {displayMessages.map((message, index) => (
              <div key={message.id}>
                <ChatMessage
                  role={message.role}
                  content={message.content}
                  isStreaming={
                    isLoading &&
                    index === displayMessages.length - 1 &&
                    message.role === "assistant"
                  }
                />
                {/* MoA 결과가 있으면 분석 패널 표시 */}
                {message.role === "assistant" && message.moaResult && (
                  <div className="mx-4 mb-4">
                    <MoAAnalysisPanel message={message} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

        {/* Input */}
        <ChatInput
          onSend={handleSend}
          isLoading={isLoading}
          onStop={stopGeneration}
          placeholder={
            isMoAMode
              ? "Mixture of Agents에게 질문하기..."
              : currentAgent
              ? `${currentAgent.name}에게 메시지 보내기...`
              : `${selectedModel}에게 메시지 보내기...`
          }
        />
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="flex h-full items-center justify-center">로딩 중...</div>}>
      <ChatProvider>
        <ChatContent />
      </ChatProvider>
    </Suspense>
  );
}
