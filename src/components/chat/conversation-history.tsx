"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Plus, Archive, Pin, Trash2, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Message {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  title: string | null;
  model: string;
  isPinned: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}

interface ConversationHistoryProps {
  currentConversationId?: string;
  onSelectConversation: (conversationId: string) => void;
  onNewConversation: () => void;
}

export function ConversationHistory({
  currentConversationId,
  onSelectConversation,
  onNewConversation,
}: ConversationHistoryProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/conversations?archived=${showArchived}`);
      const data = await res.json();

      if (data.success) {
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error("Failed to load conversations:", error);
      toast.error("대화 이력을 불러오는데 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [showArchived]);

  const handlePin = async (conversationId: string, isPinned: boolean) => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: !isPinned }),
      });

      if (res.ok) {
        toast.success(isPinned ? "고정 해제되었습니다" : "고정되었습니다");
        loadConversations();
      }
    } catch (error) {
      toast.error("작업에 실패했습니다");
    }
  };

  const handleArchive = async (conversationId: string, isArchived: boolean) => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: !isArchived }),
      });

      if (res.ok) {
        toast.success(isArchived ? "보관 해제되었습니다" : "보관되었습니다");
        loadConversations();
      }
    } catch (error) {
      toast.error("작업에 실패했습니다");
    }
  };

  const handleDelete = async (conversationId: string) => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("대화가 삭제되었습니다");
        loadConversations();
        if (currentConversationId === conversationId) {
          onNewConversation();
        }
      }
    } catch (error) {
      toast.error("삭제에 실패했습니다");
    }
  };

  const getConversationTitle = (conversation: Conversation) => {
    if (conversation.title) return conversation.title;
    if (conversation.messages.length > 0) {
      return conversation.messages[0].content.substring(0, 30) + "...";
    }
    return "새 대화";
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "방금 전";
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">대화 이력</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowArchived(!showArchived)}
          >
            {showArchived ? "활성" : "보관함"}
          </Button>
        </div>
        <Button
          onClick={onNewConversation}
          className="w-full"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          새 대화
        </Button>
      </div>

      {/* Conversation List */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            불러오는 중...
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            {showArchived ? "보관된 대화가 없습니다" : "대화 이력이 없습니다"}
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={cn(
                  "group relative flex items-start gap-3 rounded-lg p-3 hover:bg-accent cursor-pointer transition-colors",
                  currentConversationId === conversation.id && "bg-accent"
                )}
                onClick={() => onSelectConversation(conversation.id)}
              >
                <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        {conversation.isPinned && (
                          <Pin className="h-3 w-3 text-primary" />
                        )}
                        <p className="text-sm font-medium truncate">
                          {getConversationTitle(conversation)}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(conversation.updatedAt)}
                      </p>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100"
                        >
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePin(conversation.id, conversation.isPinned);
                          }}
                        >
                          <Pin className="h-4 w-4 mr-2" />
                          {conversation.isPinned ? "고정 해제" : "고정"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleArchive(conversation.id, conversation.isArchived);
                          }}
                        >
                          <Archive className="h-4 w-4 mr-2" />
                          {conversation.isArchived ? "보관 해제" : "보관"}
                        </DropdownMenuItem>
                        <ConfirmDialog
                          title="대화 삭제"
                          description="이 대화를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
                          confirmText="삭제"
                          variant="destructive"
                          onConfirm={() => handleDelete(conversation.id)}
                          trigger={
                            <DropdownMenuItem
                              onSelect={(e) => e.preventDefault()}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              삭제
                            </DropdownMenuItem>
                          }
                        />
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
