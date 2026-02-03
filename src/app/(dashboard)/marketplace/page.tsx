"use client";

import { Search, Star, Download, Filter, TrendingUp } from "lucide-react";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const featuredAgents = [
  {
    id: "1",
    name: "리서치 프로",
    description:
      "여러 소스를 검색하고 데이터를 분석하여 종합 보고서를 작성하는 고급 리서치 에이전트입니다.",
    icon: "🔬",
    author: "Agent Platform",
    rating: 4.9,
    downloads: 15420,
    category: "리서치",
    isVerified: true,
  },
  {
    id: "2",
    name: "코드 어시스턴트",
    description:
      "코드 리뷰, 디버깅, 문서화 기능을 갖춘 풀스택 개발 어시스턴트입니다.",
    icon: "💻",
    author: "DevTools Inc",
    rating: 4.8,
    downloads: 12350,
    category: "개발",
    isVerified: true,
  },
  {
    id: "3",
    name: "콘텐츠 크리에이터",
    description:
      "블로그 포스트, 소셜 미디어 콘텐츠, 이메일 캠페인, 마케팅 카피를 생성합니다.",
    icon: "✍️",
    author: "Marketing AI",
    rating: 4.7,
    downloads: 9870,
    category: "마케팅",
    isVerified: true,
  },
  {
    id: "4",
    name: "데이터 분석가",
    description:
      "데이터셋을 분석하고 시각화를 생성하며 자동으로 인사이트를 도출합니다.",
    icon: "📊",
    author: "DataWiz",
    rating: 4.6,
    downloads: 7650,
    category: "분석",
    isVerified: false,
  },
  {
    id: "5",
    name: "고객 지원",
    description:
      "고객 문의를 처리하고 문제를 해결하며 필요시 에스컬레이션합니다.",
    icon: "🎧",
    author: "SupportAI",
    rating: 4.5,
    downloads: 6420,
    category: "지원",
    isVerified: true,
  },
  {
    id: "6",
    name: "법률 어시스턴트",
    description:
      "계약서를 검토하고 법률 문서를 요약하며 컴플라이언스 체크를 제공합니다.",
    icon: "⚖️",
    author: "LegalTech",
    rating: 4.4,
    downloads: 4320,
    category: "법률",
    isVerified: true,
  },
];

const categories = [
  "전체",
  "리서치",
  "개발",
  "마케팅",
  "분석",
  "지원",
  "법률",
  "금융",
  "인사",
];

export default function MarketplacePage() {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">에이전트 마켓플레이스</h1>
        <p className="mt-2 text-muted-foreground">
          커뮤니티가 만든 사전 구축된 AI 에이전트를 발견하고 설치하세요
        </p>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 flex items-center gap-4">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="에이전트 검색..." className="pl-9" />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          필터
        </Button>
      </div>

      {/* Categories */}
      <Tabs defaultValue="전체" className="mb-6">
        <TabsList className="flex-wrap h-auto gap-2 bg-transparent p-0">
          {categories.map((category) => (
            <TabsTrigger
              key={category}
              value={category}
              className="rounded-full border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {category}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Featured Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">추천 에이전트</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featuredAgents.map((agent) => (
            <Card
              key={agent.id}
              className="group cursor-pointer transition-shadow hover:shadow-md"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-2xl">
                      {agent.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">
                          {agent.name}
                        </CardTitle>
                        {agent.isVerified && (
                          <Badge variant="secondary" className="text-xs">
                            인증됨
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {agent.author} 제작
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="line-clamp-2 mb-4">
                  {agent.description}
                </CardDescription>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      {agent.rating}
                    </span>
                    <span className="flex items-center gap-1">
                      <Download className="h-4 w-4" />
                      {(agent.downloads / 1000).toFixed(1)}k
                    </span>
                  </div>
                  <Badge variant="outline">{agent.category}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
