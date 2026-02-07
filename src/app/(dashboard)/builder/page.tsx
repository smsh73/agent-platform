"use client";

import { useState } from "react";
import { WorkflowBuilder } from "@/components/workflow/workflow-builder";
import { Workflow } from "@/lib/workflow/types";
import { EXAMPLE_WORKFLOWS, EXAMPLE_LIST } from "@/lib/workflow/examples";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Lightbulb, Play } from "lucide-react";

export default function BuilderPage() {
  const [currentWorkflow, setCurrentWorkflow] = useState<Workflow | undefined>(undefined);
  const [selectedExample, setSelectedExample] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [showExamples, setShowExamples] = useState(true);

  const handleLoadExample = (exampleId: string) => {
    const workflow = EXAMPLE_WORKFLOWS[exampleId];
    if (workflow) {
      setCurrentWorkflow({ ...workflow });
      setSelectedExample(exampleId);
      setShowExamples(false);
      toast.success(`"${workflow.name}" 예제를 로드했습니다`);
    }
  };

  const handleNewWorkflow = () => {
    setCurrentWorkflow(undefined);
    setSelectedExample("");
    setShowExamples(false);
  };

  const handleSave = async (workflow: Workflow) => {
    try {
      const response = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(workflow),
      });

      if (response.ok) {
        toast.success("워크플로우가 저장되었습니다");
      } else {
        toast.error("워크플로우 저장 실패");
      }
    } catch (error) {
      toast.error("워크플로우 저장 중 오류 발생");
    }
  };

  const handleRun = async (workflow: Workflow) => {
    setIsRunning(true);
    try {
      const response = await fetch("/api/workflows/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflow }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`워크플로우 완료: ${result.status}`);
        console.log("실행 결과:", result);
      } else {
        toast.error(`워크플로우 실패: ${result.error}`);
      }
    } catch (error) {
      toast.error("워크플로우 실행 중 오류 발생");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] relative">
      {showExamples ? (
        <div className="h-full overflow-auto p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">워크플로우 빌더</h1>
                <p className="text-muted-foreground mt-2">
                  예제를 선택하여 시작하거나 새로운 워크플로우를 만드세요
                </p>
              </div>
              <Button onClick={handleNewWorkflow} size="lg">
                <FileText className="mr-2 h-4 w-4" />
                새로 만들기
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {EXAMPLE_LIST.map((example) => (
                <Card
                  key={example.id}
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => handleLoadExample(example.id)}
                >
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold">{example.name}</h3>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {example.difficulty}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      {example.description}
                    </p>

                    <div className="flex flex-wrap gap-1">
                      {example.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <Button className="w-full" variant="outline">
                      <Play className="mr-2 h-3 w-3" />
                      예제 열기
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* 예제 선택 바 */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
            <Card className="shadow-lg">
              <CardContent className="p-3 flex items-center gap-3">
                <Select value={selectedExample} onValueChange={handleLoadExample}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="예제 선택..." />
                  </SelectTrigger>
                  <SelectContent>
                    {EXAMPLE_LIST.map((example) => (
                      <SelectItem key={example.id} value={example.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{example.name}</span>
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {example.difficulty}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={handleNewWorkflow}>
                  새로 만들기
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowExamples(true)}>
                  예제 보기
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* 워크플로우 빌더 */}
          <WorkflowBuilder
            key={selectedExample}
            workflow={currentWorkflow}
            onSave={handleSave}
            onRun={handleRun}
          />
        </>
      )}
    </div>
  );
}
