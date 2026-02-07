"use client";

import { useState } from "react";
import {
  Bot,
  Search,
  MoreHorizontal,
  Eye,
  Ban,
  Trash2,
  CheckCircle,
  XCircle,
  Globe,
  Lock,
  Star,
  TrendingUp,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock data
const agents = [
  {
    id: "1",
    name: "Research Assistant Pro",
    description: "Advanced research agent with web search and document analysis",
    creator: "admin@platform.com",
    model: "gpt-4o",
    isPublic: true,
    isApproved: true,
    isFeatured: true,
    usageCount: 15420,
    rating: 4.8,
    createdAt: "2024-06-15",
    status: "active",
  },
  {
    id: "2",
    name: "Code Reviewer",
    description: "Automated code review with best practices suggestions",
    creator: "developer@tech.io",
    model: "claude-sonnet-4-5-20250929",
    isPublic: true,
    isApproved: true,
    isFeatured: false,
    usageCount: 8934,
    rating: 4.6,
    createdAt: "2024-08-20",
    status: "active",
  },
  {
    id: "3",
    name: "Marketing Writer",
    description: "Content creation for marketing campaigns",
    creator: "marketing@company.com",
    model: "gpt-4o",
    isPublic: true,
    isApproved: false,
    isFeatured: false,
    usageCount: 234,
    rating: null,
    createdAt: "2024-12-18",
    status: "pending",
  },
  {
    id: "4",
    name: "Data Analyst Bot",
    description: "Analyze datasets and generate insights",
    creator: "data@analytics.co",
    model: "gemini-1.5-pro",
    isPublic: false,
    isApproved: true,
    isFeatured: false,
    usageCount: 567,
    rating: 4.2,
    createdAt: "2024-10-05",
    status: "active",
  },
  {
    id: "5",
    name: "Customer Support Agent",
    description: "Handle customer inquiries automatically",
    creator: "support@helpdesk.com",
    model: "gpt-4o-mini",
    isPublic: true,
    isApproved: true,
    isFeatured: true,
    usageCount: 23456,
    rating: 4.7,
    createdAt: "2024-04-10",
    status: "active",
  },
  {
    id: "6",
    name: "Spam Generator",
    description: "Test agent - should be rejected",
    creator: "bad@actor.com",
    model: "gpt-4o-mini",
    isPublic: true,
    isApproved: false,
    isFeatured: false,
    usageCount: 5,
    rating: null,
    createdAt: "2024-12-20",
    status: "rejected",
  },
];

const pendingAgents = agents.filter((a) => a.status === "pending");
const publicAgents = agents.filter((a) => a.isPublic && a.isApproved);

export default function AgentsManagementPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredAgents = agents.filter((agent) => {
    const matchesSearch =
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.creator.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || agent.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Agent Management</h1>
        <p className="text-muted-foreground">
          Review, approve, and manage user-created agents
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agents.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {pendingAgents.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Public Agents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{publicAgents.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Featured</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {agents.filter((a) => a.isFeatured).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Agents</TabsTrigger>
          <TabsTrigger value="pending">
            Pending Review
            {pendingAgents.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingAgents.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="featured">Featured</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Agents</CardTitle>
              <CardDescription>
                Complete list of agents on the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex items-center gap-4 mb-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search agents..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent</TableHead>
                      <TableHead>Creator</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Visibility</TableHead>
                      <TableHead>Usage</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAgents.map((agent) => (
                      <TableRow key={agent.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                              <Bot className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{agent.name}</p>
                                {agent.isFeatured && (
                                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {agent.description}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {agent.creator}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{agent.model}</Badge>
                        </TableCell>
                        <TableCell>
                          {agent.isPublic ? (
                            <div className="flex items-center gap-1 text-green-600">
                              <Globe className="h-4 w-4" />
                              <span className="text-sm">Public</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Lock className="h-4 w-4" />
                              <span className="text-sm">Private</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            {agent.usageCount.toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          {agent.rating ? (
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              {agent.rating}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              agent.status === "active"
                                ? "default"
                                : agent.status === "pending"
                                ? "secondary"
                                : "destructive"
                            }
                            className={
                              agent.status === "active"
                                ? "bg-green-500 hover:bg-green-600"
                                : agent.status === "pending"
                                ? "bg-yellow-500 hover:bg-yellow-600"
                                : ""
                            }
                          >
                            {agent.status}
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
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              {agent.status === "pending" && (
                                <>
                                  <DropdownMenuItem className="text-green-600">
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600">
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Reject
                                  </DropdownMenuItem>
                                </>
                              )}
                              {agent.isApproved && !agent.isFeatured && (
                                <DropdownMenuItem>
                                  <Star className="mr-2 h-4 w-4" />
                                  Feature Agent
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem>
                                <Ban className="mr-2 h-4 w-4" />
                                Disable
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
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
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Review</CardTitle>
              <CardDescription>
                Agents awaiting approval for public marketplace
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingAgents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No agents pending review
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingAgents.map((agent) => (
                    <div
                      key={agent.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                          <Bot className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="font-medium">{agent.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {agent.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Created by {agent.creator} on {agent.createdAt}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="mr-2 h-4 w-4" />
                          Review
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Reject
                        </Button>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Approve
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="featured">
          <Card>
            <CardHeader>
              <CardTitle>Featured Agents</CardTitle>
              <CardDescription>
                Agents highlighted on the marketplace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {agents
                  .filter((a) => a.isFeatured)
                  .map((agent) => (
                    <div
                      key={agent.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                          <Bot className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{agent.name}</p>
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {agent.usageCount.toLocaleString()} uses • {agent.rating} rating
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Remove from Featured
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
