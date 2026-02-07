"use client";

import { useState, useEffect } from "react";
import { Plus, Search, MoreHorizontal, Play, ArrowRight, Loader2, Trash2, FileSearch } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { Agent } from "@/types/agents";

// Super Agents - 내장 에이전트
const superAgents = [
  {
    id: "moa",
    name: "Mixture of Agents",
    description: "GPT-4o, Claude, Gemini가 동시에 응답하고 최고의 답변을 조합합니다",
    href: "/chat?moa=true",
    features: ["멀티 AI 동시 실행", "응답 분석 & 선별", "최신 정보 검색", "Best Answer 합성"],
  },
  {
    id: "slides",
    name: "AI 슬라이드",
    description: "프롬프트를 입력하면 전문적인 프레젠테이션을 자동 생성합니다",
    href: "/slides",
    features: ["AI 슬라이드 생성", "6가지 테마", "실시간 편집", "발표 모드"],
  },
  {
    id: "research",
    name: "Agentic Research",
    description: "심층 조사를 수행하고 체계적인 보고서를 자동 작성합니다",
    href: "/research",
    features: ["퀵/표준/심층 리서치", "마크다운 보고서", "히스토리 저장"],
  },
  {
    id: "sheets",
    name: "AI 시트",
    description: "웹 리서치를 수행하고 데이터를 스프레드시트로 자동 정리합니다",
    href: "/sheets",
    features: ["데이터 자동 수집", "차트 시각화", "CSV 내보내기", "실시간 편집"],
  },
];

export default function AgentsPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      const res = await fetch("/api/agents");
      const data = await res.json();
      if (data.success) {
        setAgents(data.agents);
      }
    } catch (error) {
      toast.error("에이전트 로딩 실패");
    } finally {
      setLoading(false);
    }
  };

  const handleRunAgent = (agent: Agent) => {
    sessionStorage.setItem(
      "selectedAgent",
      JSON.stringify({
        id: agent.id,
        name: agent.name,
        model: agent.model,
        systemPrompt: agent.systemPrompt,
      })
    );
    toast.success(`${agent.name} 에이전트를 시작합니다`);
    router.push(`/chat?agent=${agent.id}`);
  };

  const handleUninstall = async (agentId: string) => {
    try {
      const res = await fetch(`/api/agents?id=${agentId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message);
        setAgents((prev) => prev.filter((a) => a.id !== agentId));
      } else {
        toast.error(data.error || "제거 실패");
      }
    } catch (error) {
      toast.error("에이전트 제거 중 오류 발생");
    }
  };

  const filteredAgents = agents.filter(
    (agent) =>
      searchQuery === "" ||
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">내 에이전트</h1>
          <p className="text-muted-foreground">
            커스텀 AI 에이전트를 생성하고 관리하세요
          </p>
        </div>
        <Button asChild>
          <Link href="/marketplace">
            <Plus className="mr-2 h-4 w-4" />
            에이전트 설치
          </Link>
        </Button>
      </div>

      {/* Super Agents */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <FileSearch className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Super Agent</h2>
          <Badge variant="secondary">New</Badge>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {superAgents.map((agent) => (
            <Link key={agent.id} href={agent.href}>
              <Card className="group transition-all hover:shadow-md hover:border-primary/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{agent.name}</CardTitle>
                    <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <CardDescription>{agent.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {agent.features.map((feature) => (
                      <Badge key={feature} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="mb-6 flex items-center gap-4">
        <h2 className="text-lg font-semibold">설치된 에이전트</h2>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="에이전트 검색..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Agents Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredAgents.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            {searchQuery
              ? "검색 결과가 없습니다"
              : "설치된 에이전트가 없습니다"}
          </p>
          <Button asChild>
            <Link href="/marketplace">
              <Plus className="mr-2 h-4 w-4" />
              마켓플레이스에서 설치하기
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredAgents.map((agent) => (
            <Card
              key={agent.id}
              className="group relative overflow-hidden transition-shadow hover:shadow-md"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base mb-1">{agent.name}</CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {agent.model}
                    </Badge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100"
                        aria-label="에이전트 메뉴"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>편집</DropdownMenuItem>
                      <DropdownMenuItem>복제</DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={async (e) => {
                          e.preventDefault();
                        }}
                      >
                        <ConfirmDialog
                          title="에이전트 제거"
                          description={`"${agent.name}"을(를) 제거하시겠습니까?`}
                          confirmText="제거"
                          variant="destructive"
                          onConfirm={async () => {
                            await handleUninstall(agent.id);
                          }}
                          trigger={
                            <div className="flex items-center text-destructive w-full cursor-pointer">
                              <Trash2 className="mr-2 h-4 w-4" />
                              제거
                            </div>
                          }
                        />
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="line-clamp-2 mb-4">
                  {agent.description}
                </CardDescription>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {agent.usageCount || 0}회 사용
                  </span>
                  <div className="flex items-center gap-2">
                    {agent.isPublic && (
                      <Badge variant="outline" className="text-xs">
                        공개
                      </Badge>
                    )}
                    <Button size="sm" onClick={() => handleRunAgent(agent)}>
                      <Play className="mr-1 h-3 w-3" />
                      실행
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
