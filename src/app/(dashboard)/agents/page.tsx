"use client";

import { Plus, MessageSquare, Search, MoreHorizontal, Play, Presentation, FileSearch, FileSpreadsheet, ArrowRight } from "lucide-react";
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

// Mock data - will be replaced with actual data
const agents = [
  {
    id: "1",
    name: "리서치 어시스턴트",
    description: "자율 웹 리서치 및 보고서 생성",
    icon: "🔍",
    model: "gpt-4o",
    provider: "openai",
    usageCount: 156,
    isPublic: false,
  },
  {
    id: "2",
    name: "코드 리뷰어",
    description: "코드 검토 및 개선 제안",
    icon: "👨‍💻",
    model: "claude-3-5-sonnet-latest",
    provider: "anthropic",
    usageCount: 89,
    isPublic: true,
  },
  {
    id: "3",
    name: "콘텐츠 작가",
    description: "블로그, 기사, 소셜 미디어 콘텐츠 작성",
    icon: "✍️",
    model: "gpt-4o",
    provider: "openai",
    usageCount: 234,
    isPublic: false,
  },
  {
    id: "4",
    name: "데이터 분석가",
    description: "데이터 분석 및 시각화 생성",
    icon: "📊",
    model: "gemini-1.5-pro",
    provider: "google",
    usageCount: 67,
    isPublic: false,
  },
];

const PROVIDER_COLORS: Record<string, string> = {
  openai: "bg-green-500/10 text-green-600",
  anthropic: "bg-orange-500/10 text-orange-600",
  google: "bg-blue-500/10 text-blue-600",
  perplexity: "bg-purple-500/10 text-purple-600",
};

// Super Agents - 내장 에이전트
const superAgents = [
  {
    id: "moa",
    name: "Mixture of Agents",
    description: "GPT-4o, Claude, Gemini가 동시에 응답하고 최고의 답변을 조합합니다",
    icon: FileSearch,
    href: "/chat?moa=true",
    color: "from-yellow-500 to-orange-500",
    features: ["멀티 AI 동시 실행", "응답 분석 & 선별", "최신 정보 검색", "Best Answer 합성"],
  },
  {
    id: "slides",
    name: "AI 슬라이드",
    description: "프롬프트를 입력하면 전문적인 프레젠테이션을 자동 생성합니다",
    icon: Presentation,
    href: "/slides",
    color: "from-blue-500 to-cyan-500",
    features: ["AI 슬라이드 생성", "6가지 테마", "실시간 편집", "발표 모드"],
  },
  {
    id: "research",
    name: "Agentic Research",
    description: "심층 조사를 수행하고 체계적인 보고서를 자동 작성합니다",
    icon: FileSearch,
    href: "/research",
    color: "from-purple-500 to-pink-500",
    features: ["퀵/표준/심층 리서치", "마크다운 보고서", "히스토리 저장"],
  },
  {
    id: "sheets",
    name: "AI 시트",
    description: "웹 리서치를 수행하고 데이터를 스프레드시트로 자동 정리합니다",
    icon: FileSpreadsheet,
    href: "/sheets",
    color: "from-green-500 to-emerald-500",
    features: ["데이터 자동 수집", "차트 시각화", "CSV 내보내기", "실시간 편집"],
  },
];

export default function AgentsPage() {
  const router = useRouter();

  const handleRunAgent = (agent: typeof agents[0]) => {
    // 에이전트 정보를 세션 스토리지에 저장하고 채팅 페이지로 이동
    sessionStorage.setItem("selectedAgent", JSON.stringify({
      id: agent.id,
      name: agent.name,
      model: agent.model,
      systemPrompt: `당신은 "${agent.name}"입니다. ${agent.description}을 수행하는 AI 어시스턴트입니다. 사용자의 요청에 따라 최선을 다해 도와주세요.`,
    }));
    toast.success(`${agent.name} 에이전트를 시작합니다`);
    router.push(`/chat?agent=${agent.id}`);
  };

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
          <Link href="/builder">
            <Plus className="mr-2 h-4 w-4" />
            에이전트 만들기
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
              <Card className="group relative overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
                <div className={`absolute inset-0 bg-gradient-to-br ${agent.color} opacity-5 group-hover:opacity-10 transition-opacity`} />
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${agent.color}`}>
                      <agent.icon className="h-6 w-6 text-white" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <CardTitle className="text-lg mt-3">{agent.name}</CardTitle>
                  <CardDescription>{agent.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {agent.features.map((feature) => (
                      <Badge key={feature} variant="outline" className="text-xs">
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
        <h2 className="text-lg font-semibold">내 에이전트</h2>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="에이전트 검색..." className="pl-9" />
        </div>
      </div>

      {/* Agents Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {agents.map((agent) => (
          <Card
            key={agent.id}
            className="group relative overflow-hidden transition-shadow hover:shadow-md"
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-xl">
                    {agent.icon}
                  </div>
                  <div>
                    <CardTitle className="text-base">{agent.name}</CardTitle>
                    <Badge
                      variant="secondary"
                      className={PROVIDER_COLORS[agent.provider]}
                    >
                      {agent.model}
                    </Badge>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>편집</DropdownMenuItem>
                    <DropdownMenuItem>복제</DropdownMenuItem>
                    <DropdownMenuItem>공유</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      삭제
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
                  {agent.usageCount}회 사용
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

        {/* Create New Card */}
        <Link href="/builder">
          <Card className="flex h-full min-h-[180px] cursor-pointer items-center justify-center border-dashed transition-colors hover:border-primary hover:bg-muted/50">
            <div className="text-center">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Plus className="h-5 w-5 text-primary" />
              </div>
              <p className="font-medium">새 에이전트 만들기</p>
              <p className="text-sm text-muted-foreground">
                비주얼 에디터로 빌드
              </p>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}
