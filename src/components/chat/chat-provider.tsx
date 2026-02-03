"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { MoAResult } from "@/types/mixture-of-agents";

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  moaResult?: MoAResult; // MoA 결과 (분석 정보 포함)
}

interface AgentConfig {
  id: string;
  name: string;
  model: string;
  systemPrompt: string;
}

interface ChatContextValue {
  messages: Message[];
  isLoading: boolean;
  selectedModel: string;
  currentAgent: AgentConfig | null;
  isMoAMode: boolean;
  sendMessage: (content: string) => Promise<void>;
  setSelectedModel: (model: string) => void;
  setMoAMode: (enabled: boolean) => void;
  clearMessages: () => void;
  stopGeneration: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
}

interface ChatProviderProps {
  children: ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
  const searchParams = useSearchParams();
  const agentId = searchParams.get("agent");
  const moaParam = searchParams.get("moa");

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gpt-4o");
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [currentAgent, setCurrentAgent] = useState<AgentConfig | null>(null);
  const [isMoAMode, setMoAMode] = useState(moaParam === "true");

  // 에이전트 로드
  useEffect(() => {
    if (agentId) {
      const storedAgent = sessionStorage.getItem("selectedAgent");
      if (storedAgent) {
        try {
          const agent = JSON.parse(storedAgent) as AgentConfig;
          if (agent.id === agentId) {
            setCurrentAgent(agent);
            setSelectedModel(agent.model);
            // 시스템 메시지 추가
            setMessages([{
              id: crypto.randomUUID(),
              role: "system",
              content: agent.systemPrompt,
            }]);
          }
        } catch (e) {
          console.error("에이전트 로드 실패:", e);
        }
      }
    }
  }, [agentId]);

  // MoA 모드로 메시지 전송
  const sendMoAMessage = useCallback(async (content: string) => {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
    };

    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "🔄 Mixture of Agents 실행 중...\n\n⏳ 여러 AI 모델에서 동시에 응답을 수집하고 있습니다...",
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setIsLoading(true);

    const controller = new AbortController();
    setAbortController(controller);

    try {
      const response = await fetch("/api/chat/moa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          enableSearch: true,
        }),
        signal: controller.signal,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "MoA 실행 실패");
      }

      // MoA 결과로 메시지 업데이트
      setMessages((prev) => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        if (updated[lastIndex]?.role === "assistant") {
          updated[lastIndex] = {
            ...updated[lastIndex],
            content: data.finalAnswer,
            moaResult: data,
          };
        }
        return updated;
      });
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        console.log("MoA 요청이 취소되었습니다");
      } else {
        console.error("MoA 오류:", error);
        setMessages((prev) => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          if (updated[lastIndex]?.role === "assistant") {
            updated[lastIndex] = {
              ...updated[lastIndex],
              content: `⚠️ ${(error as Error).message}`,
            };
          }
          return updated;
        });
      }
    } finally {
      setIsLoading(false);
      setAbortController(null);
    }
  }, [messages]);

  // 일반 메시지 전송
  const sendRegularMessage = useCallback(async (content: string) => {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
    };

    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setIsLoading(true);

    const controller = new AbortController();
    setAbortController(controller);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          model: selectedModel,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "메시지 전송에 실패했습니다");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No reader available");
      }

      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        // Parse SSE data
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("0:")) {
            // Text content
            const text = line.slice(2).trim();
            if (text.startsWith('"') && text.endsWith('"')) {
              fullContent += JSON.parse(text);
              setMessages((prev) => {
                const updated = [...prev];
                const lastIndex = updated.length - 1;
                if (updated[lastIndex]?.role === "assistant") {
                  updated[lastIndex] = {
                    ...updated[lastIndex],
                    content: fullContent,
                  };
                }
                return updated;
              });
            }
          }
        }
      }
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        console.log("요청이 취소되었습니다");
      } else {
        console.error("메시지 전송 오류:", error);
        const errorMessage = (error as Error).message || "오류가 발생했습니다. 다시 시도해주세요.";
        setMessages((prev) => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          if (updated[lastIndex]?.role === "assistant") {
            updated[lastIndex] = {
              ...updated[lastIndex],
              content: `⚠️ ${errorMessage}`,
            };
          }
          return updated;
        });
      }
    } finally {
      setIsLoading(false);
      setAbortController(null);
    }
  }, [messages, selectedModel]);

  // 메시지 전송 (MoA 모드에 따라 분기)
  const sendMessage = useCallback(async (content: string) => {
    if (isMoAMode) {
      await sendMoAMessage(content);
    } else {
      await sendRegularMessage(content);
    }
  }, [isMoAMode, sendMoAMessage, sendRegularMessage]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const stopGeneration = useCallback(() => {
    if (abortController) {
      abortController.abort();
    }
  }, [abortController]);

  return (
    <ChatContext.Provider
      value={{
        messages,
        isLoading,
        selectedModel,
        currentAgent,
        isMoAMode,
        sendMessage,
        setSelectedModel,
        setMoAMode,
        clearMessages,
        stopGeneration,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}
