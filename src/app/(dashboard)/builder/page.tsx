"use client";

import { useState } from "react";
import { WorkflowBuilder } from "@/components/workflow/workflow-builder";
import { Workflow } from "@/lib/workflow/types";
import { toast } from "sonner";

export default function BuilderPage() {
  const [isRunning, setIsRunning] = useState(false);

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
    <div className="h-[calc(100vh-64px)]">
      <WorkflowBuilder onSave={handleSave} onRun={handleRun} />
    </div>
  );
}
