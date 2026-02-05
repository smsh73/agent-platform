"use client";

import { useState, useEffect } from "react";
import { Search, Star, Download, Filter, TrendingUp, Plus, Check, Loader2 } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { MarketplaceAgent } from "@/types/agents";

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
  const [agents, setAgents] = useState<MarketplaceAgent[]>([]);
  const [installedAgents, setInstalledAgents] = useState<Set<string>>(new Set());
  const [installing, setInstalling] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("전체");

  // Load marketplace agents
  useEffect(() => {
    loadMarketplaceAgents();
    loadInstalledAgents();
  }, []);

  const loadMarketplaceAgents = async () => {
    try {
      const res = await fetch("/api/agents/marketplace?featured=true");
      const data = await res.json();
      if (data.success) {
        setAgents(data.agents);
      }
    } catch (error) {
      toast.error("마켓플레이스 로딩 실패");
    } finally {
      setLoading(false);
    }
  };

  const loadInstalledAgents = async () => {
    try {
      const res = await fetch("/api/agents");
      const data = await res.json();
      if (data.success) {
        const installed = new Set<string>(data.agents.map((a: any) => a.id as string));
        setInstalledAgents(installed);
      }
    } catch (error) {
      // User might not be logged in
      console.error("Failed to load installed agents:", error);
    }
  };

  const handleInstall = async (agent: MarketplaceAgent) => {
    setInstalling(agent.id);
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: agent.id,
          type: "install",
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(data.message);
        setInstalledAgents((prev) => new Set([...prev, agent.id]));

        // Update downloads count
        setAgents((prev) =>
          prev.map((a) =>
            a.id === agent.id ? { ...a, downloads: a.downloads + 1 } : a
          )
        );
      } else {
        toast.error(data.error || "설치 실패");
      }
    } catch (error) {
      toast.error("에이전트 설치 중 오류 발생");
    } finally {
      setInstalling(null);
    }
  };

  const filteredAgents = agents.filter((agent) => {
    const matchesSearch =
      searchQuery === "" ||
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchQuery.toLowerCase());

    const categoryMap: Record<string, string> = {
      "리서치": "research",
      "개발": "development",
      "마케팅": "marketing",
      "분석": "analytics",
      "지원": "support",
      "법률": "legal",
      "금융": "finance",
      "인사": "hr",
    };

    const matchesCategory =
      selectedCategory === "전체" ||
      agent.category === categoryMap[selectedCategory];

    return matchesSearch && matchesCategory;
  });

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
          <Input
            placeholder="에이전트 검색..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Categories */}
      <Tabs
        defaultValue="전체"
        value={selectedCategory}
        onValueChange={setSelectedCategory}
        className="mb-6"
      >
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

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            검색 결과가 없습니다
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAgents.map((agent) => {
              const isInstalled = installedAgents.has(agent.id);
              const isInstalling = installing === agent.id;

              return (
                <Card
                  key={agent.id}
                  className="group transition-shadow hover:shadow-md"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
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
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="line-clamp-2 mb-4">
                      {agent.description}
                    </CardDescription>
                    <div className="flex items-center justify-between mb-3">
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
                      <Badge variant="outline" className="text-xs">
                        {agent.category === "research"
                          ? "리서치"
                          : agent.category === "development"
                          ? "개발"
                          : agent.category === "marketing"
                          ? "마케팅"
                          : agent.category === "analytics"
                          ? "분석"
                          : agent.category === "support"
                          ? "지원"
                          : agent.category === "legal"
                          ? "법률"
                          : agent.category}
                      </Badge>
                    </div>
                    <Button
                      className="w-full"
                      size="sm"
                      variant={isInstalled ? "secondary" : "default"}
                      onClick={() => !isInstalled && handleInstall(agent)}
                      disabled={isInstalled || isInstalling}
                    >
                      {isInstalling ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          설치 중...
                        </>
                      ) : isInstalled ? (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          설치됨
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          설치
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
