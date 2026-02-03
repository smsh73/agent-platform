"use client";

import { useState } from "react";
import {
  Key,
  Plus,
  Copy,
  Eye,
  EyeOff,
  Trash2,
  MoreHorizontal,
  Check,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

// System API keys (platform-wide)
const systemApiKeys = [
  {
    id: "1",
    provider: "OpenAI",
    name: "Production Key",
    key: "sk-proj-xxxx...xxxx",
    status: "active",
    lastUsed: "2024-12-21",
    usageThisMonth: 4521000,
    costThisMonth: 45.21,
  },
  {
    id: "2",
    provider: "Anthropic",
    name: "Production Key",
    key: "sk-ant-xxxx...xxxx",
    status: "active",
    lastUsed: "2024-12-21",
    usageThisMonth: 2345000,
    costThisMonth: 35.18,
  },
  {
    id: "3",
    provider: "Google",
    name: "Gemini API Key",
    key: "AIza...xxxx",
    status: "active",
    lastUsed: "2024-12-20",
    usageThisMonth: 1567000,
    costThisMonth: 15.67,
  },
  {
    id: "4",
    provider: "Perplexity",
    name: "Search API Key",
    key: "pplx-xxxx...xxxx",
    status: "warning",
    lastUsed: "2024-12-19",
    usageThisMonth: 890000,
    costThisMonth: 8.90,
  },
];

// User API keys
const userApiKeys = [
  {
    id: "u1",
    user: "john@example.com",
    name: "Development Key",
    key: "ap_dev_xxxx...xxxx",
    permissions: ["read", "write"],
    rateLimit: 100,
    lastUsed: "2024-12-21",
    usageCount: 1523,
    status: "active",
  },
  {
    id: "u2",
    user: "jane@company.com",
    name: "Production API",
    key: "ap_prod_xxxx...xxxx",
    permissions: ["read", "write", "admin"],
    rateLimit: 500,
    lastUsed: "2024-12-20",
    usageCount: 8934,
    status: "active",
  },
  {
    id: "u3",
    user: "bot@service.com",
    name: "Bot Integration",
    key: "ap_bot_xxxx...xxxx",
    permissions: ["read"],
    rateLimit: 1000,
    lastUsed: "2024-12-21",
    usageCount: 45231,
    status: "active",
  },
];

const providerColors: Record<string, string> = {
  OpenAI: "bg-green-500/10 text-green-600",
  Anthropic: "bg-orange-500/10 text-orange-600",
  Google: "bg-blue-500/10 text-blue-600",
  Perplexity: "bg-purple-500/10 text-purple-600",
};

export default function ApiKeysPage() {
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const toggleKeyVisibility = (id: string) => {
    setShowKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyKey = (key: string, id: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">API Key Management</h1>
          <p className="text-muted-foreground">
            Manage system and user API keys
          </p>
        </div>
      </div>

      {/* System API Keys */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>System API Keys</CardTitle>
              <CardDescription>
                Platform-wide API keys for AI providers
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Test All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {systemApiKeys.map((apiKey) => (
              <div
                key={apiKey.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Key className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={providerColors[apiKey.provider]}
                      >
                        {apiKey.provider}
                      </Badge>
                      <span className="font-medium">{apiKey.name}</span>
                      {apiKey.status === "warning" && (
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs text-muted-foreground">
                        {showKeys[apiKey.id]
                          ? "sk-proj-abc123xyz789..."
                          : apiKey.key}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => toggleKeyVisibility(apiKey.id)}
                      >
                        {showKeys[apiKey.id] ? (
                          <EyeOff className="h-3 w-3" />
                        ) : (
                          <Eye className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyKey(apiKey.key, apiKey.id)}
                      >
                        {copiedKey === apiKey.id ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {(apiKey.usageThisMonth / 1000000).toFixed(2)}M tokens
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ${apiKey.costThisMonth.toFixed(2)} this month
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">Last used</p>
                    <p className="text-xs text-muted-foreground">
                      {apiKey.lastUsed}
                    </p>
                  </div>
                  <Badge
                    variant={apiKey.status === "active" ? "default" : "secondary"}
                    className={
                      apiKey.status === "active"
                        ? "bg-green-500 hover:bg-green-600"
                        : "bg-yellow-500 hover:bg-yellow-600"
                    }
                  >
                    {apiKey.status}
                  </Badge>
                  <Button variant="outline" size="sm">
                    Update
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Separator className="my-6" />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Total Estimated Cost</p>
              <p className="text-sm text-muted-foreground">This month</p>
            </div>
            <p className="text-2xl font-bold">
              $
              {systemApiKeys
                .reduce((sum, key) => sum + key.costThisMonth, 0)
                .toFixed(2)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* User API Keys */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>User API Keys</CardTitle>
              <CardDescription>
                API keys issued to users for platform access
              </CardDescription>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Generate Key
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Generate New API Key</DialogTitle>
                  <DialogDescription>
                    Create a new API key for a user or service
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Key Name</label>
                    <Input placeholder="e.g., Production API" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">User Email</label>
                    <Input placeholder="user@example.com" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Rate Limit (requests/min)
                    </label>
                    <Input type="number" placeholder="100" />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline">Cancel</Button>
                  <Button>Generate Key</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Key Name</TableHead>
                  <TableHead>API Key</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Rate Limit</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userApiKeys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium">{key.user}</TableCell>
                    <TableCell>{key.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-xs">{key.key}</code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyKey(key.key, key.id)}
                        >
                          {copiedKey === key.id ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {key.permissions.map((perm) => (
                          <Badge key={perm} variant="outline" className="text-xs">
                            {perm}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{key.rateLimit}/min</TableCell>
                    <TableCell>{key.usageCount.toLocaleString()} calls</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          key.status === "active"
                            ? "bg-green-500 hover:bg-green-600"
                            : ""
                        }
                      >
                        {key.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Edit Permissions</DropdownMenuItem>
                          <DropdownMenuItem>Regenerate Key</DropdownMenuItem>
                          <DropdownMenuItem>View Usage</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Revoke Key
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
