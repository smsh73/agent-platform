"use client";

import { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Zap,
  Calendar,
  Download,
  Filter,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock data
const overviewStats = {
  totalTokens: 125000000,
  totalCost: 1245.50,
  totalApiCalls: 89340,
  avgCostPerUser: 12.45,
  tokensChange: 15.2,
  costChange: 8.5,
};

const dailyUsage = [
  { date: "Dec 15", tokens: 4200000, cost: 42.00, calls: 3200 },
  { date: "Dec 16", tokens: 3800000, cost: 38.00, calls: 2900 },
  { date: "Dec 17", tokens: 4500000, cost: 45.00, calls: 3400 },
  { date: "Dec 18", tokens: 5100000, cost: 51.00, calls: 3800 },
  { date: "Dec 19", tokens: 4800000, cost: 48.00, calls: 3600 },
  { date: "Dec 20", tokens: 5500000, cost: 55.00, calls: 4100 },
  { date: "Dec 21", tokens: 6200000, cost: 62.00, calls: 4600 },
];

const providerUsage = [
  {
    provider: "OpenAI",
    tokens: 52000000,
    cost: 520.00,
    calls: 38000,
    percentage: 42,
  },
  {
    provider: "Anthropic",
    tokens: 35000000,
    cost: 420.00,
    calls: 25000,
    percentage: 28,
  },
  {
    provider: "Google",
    tokens: 28000000,
    cost: 210.00,
    calls: 18000,
    percentage: 22,
  },
  {
    provider: "Perplexity",
    tokens: 10000000,
    cost: 95.50,
    calls: 8340,
    percentage: 8,
  },
];

const topUsers = [
  { email: "enterprise@company.com", tokens: 15000000, cost: 150.00, plan: "ENTERPRISE" },
  { email: "power@user.io", tokens: 8500000, cost: 85.00, plan: "PRO" },
  { email: "developer@tech.com", tokens: 6200000, cost: 62.00, plan: "PRO" },
  { email: "team@startup.co", tokens: 4800000, cost: 48.00, plan: "TEAM" },
  { email: "user@example.com", tokens: 3200000, cost: 32.00, plan: "PRO" },
];

const modelUsage = [
  { model: "gpt-4o", provider: "OpenAI", tokens: 28000000, cost: 280.00, calls: 21000 },
  { model: "claude-3-5-sonnet", provider: "Anthropic", tokens: 22000000, cost: 330.00, calls: 16000 },
  { model: "gpt-4o-mini", provider: "OpenAI", tokens: 18000000, cost: 72.00, calls: 14000 },
  { model: "gemini-1.5-pro", provider: "Google", tokens: 15000000, cost: 112.50, calls: 10000 },
  { model: "gemini-1.5-flash", provider: "Google", tokens: 12000000, cost: 36.00, calls: 8000 },
  { model: "claude-3-5-haiku", provider: "Anthropic", tokens: 10000000, cost: 50.00, calls: 8000 },
];

const providerColors: Record<string, string> = {
  OpenAI: "bg-green-500",
  Anthropic: "bg-orange-500",
  Google: "bg-blue-500",
  Perplexity: "bg-purple-500",
};

export default function UsagePage() {
  const [timeRange, setTimeRange] = useState("7d");

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Usage & Billing</h1>
          <p className="text-muted-foreground">
            Monitor API usage, costs, and billing across the platform
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[150px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(overviewStats.totalTokens / 1000000).toFixed(1)}M
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                +{overviewStats.tokensChange}% from last period
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${overviewStats.totalCost.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                +{overviewStats.costChange}% from last period
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">API Calls</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overviewStats.totalApiCalls.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              This period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Cost/User</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${overviewStats.avgCostPerUser.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per active user
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Provider Usage Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Usage by Provider</CardTitle>
          <CardDescription>Distribution of API usage across providers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {providerUsage.map((provider) => (
              <div key={provider.provider} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-3 w-3 rounded-full ${providerColors[provider.provider]}`}
                    />
                    <span className="font-medium">{provider.provider}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{(provider.tokens / 1000000).toFixed(1)}M tokens</span>
                    <span>${provider.cost.toFixed(2)}</span>
                    <span>{provider.calls.toLocaleString()} calls</span>
                    <span className="font-medium text-foreground">
                      {provider.percentage}%
                    </span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full ${providerColors[provider.provider]}`}
                    style={{ width: `${provider.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabs for detailed views */}
      <Tabs defaultValue="daily" className="space-y-4">
        <TabsList>
          <TabsTrigger value="daily">Daily Usage</TabsTrigger>
          <TabsTrigger value="models">By Model</TabsTrigger>
          <TabsTrigger value="users">Top Users</TabsTrigger>
        </TabsList>

        <TabsContent value="daily">
          <Card>
            <CardHeader>
              <CardTitle>Daily Usage</CardTitle>
              <CardDescription>Token usage and costs per day</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Tokens</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>API Calls</TableHead>
                      <TableHead>Avg Cost/Call</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailyUsage.map((day) => (
                      <TableRow key={day.date}>
                        <TableCell className="font-medium">{day.date}</TableCell>
                        <TableCell>
                          {(day.tokens / 1000000).toFixed(2)}M
                        </TableCell>
                        <TableCell>${day.cost.toFixed(2)}</TableCell>
                        <TableCell>{day.calls.toLocaleString()}</TableCell>
                        <TableCell>
                          ${(day.cost / day.calls).toFixed(4)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="models">
          <Card>
            <CardHeader>
              <CardTitle>Usage by Model</CardTitle>
              <CardDescription>Breakdown of usage per AI model</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Model</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Tokens</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>API Calls</TableHead>
                      <TableHead>Cost/1M Tokens</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {modelUsage.map((model) => (
                      <TableRow key={model.model}>
                        <TableCell className="font-medium">
                          {model.model}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={`${providerColors[model.provider]}/10 text-${providerColors[model.provider].replace("bg-", "")}`}
                          >
                            {model.provider}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {(model.tokens / 1000000).toFixed(1)}M
                        </TableCell>
                        <TableCell>${model.cost.toFixed(2)}</TableCell>
                        <TableCell>{model.calls.toLocaleString()}</TableCell>
                        <TableCell>
                          ${((model.cost / model.tokens) * 1000000).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Top Users by Usage</CardTitle>
              <CardDescription>Users with highest token consumption</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Tokens Used</TableHead>
                      <TableHead>Est. Cost</TableHead>
                      <TableHead>% of Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topUsers.map((user, index) => (
                      <TableRow key={user.email}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs">
                              {index + 1}
                            </span>
                            {user.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{user.plan}</Badge>
                        </TableCell>
                        <TableCell>
                          {(user.tokens / 1000000).toFixed(1)}M
                        </TableCell>
                        <TableCell>${user.cost.toFixed(2)}</TableCell>
                        <TableCell>
                          {((user.tokens / overviewStats.totalTokens) * 100).toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
