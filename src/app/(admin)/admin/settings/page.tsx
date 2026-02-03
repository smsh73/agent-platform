"use client";

import { useState } from "react";
import {
  Settings,
  Save,
  AlertTriangle,
  Shield,
  Bell,
  Database,
  Globe,
  Zap,
  Lock,
  Mail,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    siteName: "Agent Platform",
    siteDescription: "The ultimate AI agent workspace",
    supportEmail: "support@agentplatform.com",
    defaultModel: "gpt-4o",
    maxTokensPerRequest: 4096,
    rateLimitPerMinute: 60,
    allowPublicAgents: true,
    requireAgentApproval: true,
    enableUsageTracking: true,
    maintenanceMode: false,
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Settings</h1>
          <p className="text-muted-foreground">
            Configure platform-wide settings and preferences
          </p>
        </div>
        <Button>
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">
            <Settings className="mr-2 h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="ai">
            <Zap className="mr-2 h-4 w-4" />
            AI Settings
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="mr-2 h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          {/* Platform Info */}
          <Card>
            <CardHeader>
              <CardTitle>Platform Information</CardTitle>
              <CardDescription>
                Basic information about your platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Platform Name</label>
                  <Input
                    value={settings.siteName}
                    onChange={(e) =>
                      setSettings({ ...settings, siteName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Support Email</label>
                  <Input
                    type="email"
                    value={settings.supportEmail}
                    onChange={(e) =>
                      setSettings({ ...settings, supportEmail: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Platform Description</label>
                <Textarea
                  value={settings.siteDescription}
                  onChange={(e) =>
                    setSettings({ ...settings, siteDescription: e.target.value })
                  }
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Maintenance Mode */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Maintenance Mode
              </CardTitle>
              <CardDescription>
                Enable maintenance mode to restrict access during updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">Maintenance Mode</p>
                  <p className="text-sm text-muted-foreground">
                    When enabled, only admins can access the platform
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <Badge
                    variant={settings.maintenanceMode ? "destructive" : "secondary"}
                  >
                    {settings.maintenanceMode ? "Enabled" : "Disabled"}
                  </Badge>
                  <Button
                    variant={settings.maintenanceMode ? "destructive" : "outline"}
                    onClick={() =>
                      setSettings({
                        ...settings,
                        maintenanceMode: !settings.maintenanceMode,
                      })
                    }
                  >
                    {settings.maintenanceMode ? "Disable" : "Enable"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-6">
          {/* Default AI Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Default AI Configuration</CardTitle>
              <CardDescription>
                Configure default settings for AI interactions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Default Model</label>
                  <Select
                    value={settings.defaultModel}
                    onValueChange={(value) =>
                      setSettings({ ...settings, defaultModel: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4o">GPT-4o (OpenAI)</SelectItem>
                      <SelectItem value="gpt-4o-mini">GPT-4o Mini (OpenAI)</SelectItem>
                      <SelectItem value="claude-3-5-sonnet-latest">
                        Claude 3.5 Sonnet (Anthropic)
                      </SelectItem>
                      <SelectItem value="gemini-1.5-pro">
                        Gemini 1.5 Pro (Google)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Max Tokens per Request
                  </label>
                  <Input
                    type="number"
                    value={settings.maxTokensPerRequest}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        maxTokensPerRequest: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rate Limiting */}
          <Card>
            <CardHeader>
              <CardTitle>Rate Limiting</CardTitle>
              <CardDescription>
                Configure API rate limits for users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Free Tier (requests/min)
                  </label>
                  <Input type="number" defaultValue={10} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Pro Tier (requests/min)
                  </label>
                  <Input type="number" defaultValue={60} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Enterprise (requests/min)
                  </label>
                  <Input type="number" defaultValue={300} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Agent Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Agent Marketplace Settings</CardTitle>
              <CardDescription>
                Configure settings for the agent marketplace
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">Allow Public Agents</p>
                  <p className="text-sm text-muted-foreground">
                    Allow users to publish agents to the marketplace
                  </p>
                </div>
                <Button
                  variant={settings.allowPublicAgents ? "default" : "outline"}
                  onClick={() =>
                    setSettings({
                      ...settings,
                      allowPublicAgents: !settings.allowPublicAgents,
                    })
                  }
                >
                  {settings.allowPublicAgents ? "Enabled" : "Disabled"}
                </Button>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">Require Agent Approval</p>
                  <p className="text-sm text-muted-foreground">
                    Require admin approval before agents go public
                  </p>
                </div>
                <Button
                  variant={settings.requireAgentApproval ? "default" : "outline"}
                  onClick={() =>
                    setSettings({
                      ...settings,
                      requireAgentApproval: !settings.requireAgentApproval,
                    })
                  }
                >
                  {settings.requireAgentApproval ? "Enabled" : "Disabled"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          {/* Authentication */}
          <Card>
            <CardHeader>
              <CardTitle>Authentication</CardTitle>
              <CardDescription>
                Configure authentication providers and settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {[
                  { name: "Google OAuth", enabled: true },
                  { name: "GitHub OAuth", enabled: true },
                  { name: "Email/Password", enabled: true },
                  { name: "SAML/SSO", enabled: false },
                ].map((provider) => (
                  <div
                    key={provider.name}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center gap-3">
                      <Lock className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">{provider.name}</span>
                    </div>
                    <Badge
                      variant={provider.enabled ? "default" : "secondary"}
                      className={
                        provider.enabled ? "bg-green-500 hover:bg-green-600" : ""
                      }
                    >
                      {provider.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Session Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Session Settings</CardTitle>
              <CardDescription>
                Configure user session behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Session Timeout (hours)
                  </label>
                  <Input type="number" defaultValue={24} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Max Sessions per User
                  </label>
                  <Input type="number" defaultValue={5} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          {/* Email Notifications */}
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>
                Configure email notification settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">SMTP Host</label>
                  <Input placeholder="smtp.example.com" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">SMTP Port</label>
                  <Input type="number" placeholder="587" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">SMTP Username</label>
                  <Input placeholder="username" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">SMTP Password</label>
                  <Input type="password" placeholder="••••••••" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">From Email</label>
                <Input placeholder="noreply@agentplatform.com" />
              </div>
              <Button variant="outline">
                <Mail className="mr-2 h-4 w-4" />
                Send Test Email
              </Button>
            </CardContent>
          </Card>

          {/* Notification Events */}
          <Card>
            <CardHeader>
              <CardTitle>Notification Events</CardTitle>
              <CardDescription>
                Choose which events trigger notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { event: "New user registration", enabled: true },
                  { event: "Agent submitted for review", enabled: true },
                  { event: "Usage limit exceeded", enabled: true },
                  { event: "API key created", enabled: false },
                  { event: "Payment received", enabled: true },
                ].map((item) => (
                  <div
                    key={item.event}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <span>{item.event}</span>
                    <Button
                      variant={item.enabled ? "default" : "outline"}
                      size="sm"
                    >
                      {item.enabled ? "Enabled" : "Disabled"}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
