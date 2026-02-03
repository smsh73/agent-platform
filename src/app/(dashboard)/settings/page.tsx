"use client";

import { useState, useEffect } from "react";
import {
  User,
  Key,
  CreditCard,
  Bell,
  Shield,
  Loader2,
  Check,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const API_PROVIDERS = [
  {
    id: "openai",
    name: "OpenAI",
    icon: "🟢",
    description: "GPT-4o, GPT-4 Turbo, o1",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    icon: "🟠",
    description: "Claude 3.5 Sonnet, Claude 3 Opus",
  },
  {
    id: "google",
    name: "Google AI",
    icon: "🔵",
    description: "Gemini 2.0, Gemini 1.5 Pro",
  },
  {
    id: "perplexity",
    name: "Perplexity",
    icon: "🟣",
    description: "Sonar (Online Search)",
  },
];

interface ProviderStatus {
  provider: string;
  isConfigured: boolean;
  updatedAt: string | null;
}

export default function SettingsPage() {
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [providerStatus, setProviderStatus] = useState<ProviderStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingProvider, setSavingProvider] = useState<string | null>(null);
  const [deletingProvider, setDeletingProvider] = useState<string | null>(null);

  // 저장된 API 키 상태 로드
  useEffect(() => {
    async function loadProviderStatus() {
      try {
        const response = await fetch("/api/settings/provider-keys");
        if (response.ok) {
          const data = await response.json();
          setProviderStatus(data.providers || []);
        }
      } catch (error) {
        console.error("Provider 상태 로드 실패:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadProviderStatus();
  }, []);

  // API 키 저장
  const handleSaveKey = async (providerId: string) => {
    const apiKey = apiKeys[providerId];

    if (!apiKey || apiKey.trim().length === 0) {
      toast.error("API 키를 입력해주세요");
      return;
    }

    setSavingProvider(providerId);

    try {
      const response = await fetch("/api/settings/provider-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: providerId, apiKey }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        // 상태 업데이트
        setProviderStatus((prev) =>
          prev.map((p) =>
            p.provider === providerId
              ? { ...p, isConfigured: true, updatedAt: new Date().toISOString() }
              : p
          )
        );
        // 입력 필드 비우기
        setApiKeys((prev) => ({ ...prev, [providerId]: "" }));
      } else {
        toast.error(data.error || "저장 실패");
      }
    } catch (error) {
      toast.error("API 키 저장 중 오류가 발생했습니다");
    } finally {
      setSavingProvider(null);
    }
  };

  // API 키 삭제
  const handleDeleteKey = async (providerId: string) => {
    setDeletingProvider(providerId);

    try {
      const response = await fetch(
        `/api/settings/provider-keys?provider=${providerId}`,
        { method: "DELETE" }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        // 상태 업데이트
        setProviderStatus((prev) =>
          prev.map((p) =>
            p.provider === providerId
              ? { ...p, isConfigured: false, updatedAt: null }
              : p
          )
        );
      } else {
        toast.error(data.error || "삭제 실패");
      }
    } catch (error) {
      toast.error("API 키 삭제 중 오류가 발생했습니다");
    } finally {
      setDeletingProvider(null);
    }
  };

  // Provider가 설정되어 있는지 확인
  const isProviderConfigured = (providerId: string) => {
    return providerStatus.find((p) => p.provider === providerId)?.isConfigured || false;
  };

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">설정</h1>
        <p className="text-muted-foreground">
          계정 및 환경설정을 관리하세요
        </p>
      </div>

      <Tabs defaultValue="api-keys" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="api-keys">
            <Key className="mr-2 h-4 w-4" />
            API 키
          </TabsTrigger>
          <TabsTrigger value="profile">
            <User className="mr-2 h-4 w-4" />
            프로필
          </TabsTrigger>
          <TabsTrigger value="billing">
            <CreditCard className="mr-2 h-4 w-4" />
            결제
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="mr-2 h-4 w-4" />
            알림
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="mr-2 h-4 w-4" />
            보안
          </TabsTrigger>
        </TabsList>

        <TabsContent value="api-keys" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API 키</CardTitle>
              <CardDescription>
                다양한 AI 제공업체를 사용하기 위해 API 키를 연결하세요.
                키는 암호화되어 안전하게 저장됩니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                API_PROVIDERS.map((provider) => {
                  const configured = isProviderConfigured(provider.id);
                  const isSaving = savingProvider === provider.id;
                  const isDeleting = deletingProvider === provider.id;

                  return (
                    <div key={provider.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{provider.icon}</span>
                          <div>
                            <p className="font-medium">{provider.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {provider.description}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant={configured ? "default" : "outline"}
                          className={configured ? "bg-green-600" : ""}
                        >
                          {configured ? (
                            <>
                              <Check className="mr-1 h-3 w-3" />
                              연결됨
                            </>
                          ) : (
                            "연결 안됨"
                          )}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          type="password"
                          placeholder={
                            configured
                              ? "새 API 키로 변경하려면 입력하세요"
                              : `${provider.name} API 키를 입력하세요`
                          }
                          value={apiKeys[provider.id] || ""}
                          onChange={(e) =>
                            setApiKeys((prev) => ({
                              ...prev,
                              [provider.id]: e.target.value,
                            }))
                          }
                          disabled={isSaving || isDeleting}
                        />
                        <Button
                          variant="outline"
                          onClick={() => handleSaveKey(provider.id)}
                          disabled={isSaving || isDeleting || !apiKeys[provider.id]}
                        >
                          {isSaving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "저장"
                          )}
                        </Button>
                        {configured && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteKey(provider.id)}
                            disabled={isSaving || isDeleting}
                            className="text-destructive hover:text-destructive"
                          >
                            {isDeleting ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                      <Separator className="mt-4" />
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>사용량</CardTitle>
              <CardDescription>
                모든 제공업체의 API 사용량 및 비용을 확인하세요.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-4">
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">총 토큰</p>
                  <p className="text-2xl font-bold">-</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">API 호출</p>
                  <p className="text-2xl font-bold">-</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">예상 비용</p>
                  <p className="text-2xl font-bold">-</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">에이전트 실행</p>
                  <p className="text-2xl font-bold">-</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>프로필</CardTitle>
              <CardDescription>
                개인 정보를 수정하세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">이름</label>
                  <Input placeholder="이름을 입력하세요" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">이메일</label>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    className="mt-1"
                  />
                </div>
              </div>
              <Button>변경사항 저장</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>결제</CardTitle>
              <CardDescription>
                구독 및 결제 수단을 관리하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Badge className="mb-2">무료 플랜</Badge>
                    <p className="text-sm text-muted-foreground">
                      제한된 API 호출로 기본 기능 사용
                    </p>
                  </div>
                  <Button>Pro로 업그레이드</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>알림</CardTitle>
              <CardDescription>
                알림 수신 방법을 설정하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                알림 설정이 곧 추가됩니다...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>보안</CardTitle>
              <CardDescription>
                보안 설정을 관리하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                보안 설정이 곧 추가됩니다...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
