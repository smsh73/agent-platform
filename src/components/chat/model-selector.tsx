"use client";

import { Check, ChevronsUpDown, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const MODELS = {
  openai: [
    { id: "gpt-4o", name: "GPT-4o", description: "Most capable, multimodal" },
    { id: "gpt-4o-mini", name: "GPT-4o Mini", description: "Fast and affordable" },
    { id: "o1", name: "o1", description: "Reasoning model" },
    { id: "o1-mini", name: "o1 Mini", description: "Fast reasoning" },
  ],
  anthropic: [
    { id: "claude-sonnet-4-5-20250929", name: "Claude 3.5 Sonnet", description: "Best balance" },
    { id: "claude-sonnet-4-20250514", name: "Claude 3.5 Haiku", description: "Fast and efficient" },
    { id: "claude-3-opus-latest", name: "Claude 3 Opus", description: "Most powerful" },
  ],
  google: [
    { id: "gemini-2.0-flash-exp", name: "Gemini 2.0 Flash", description: "Latest and fastest" },
    { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", description: "1M+ context" },
    { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", description: "Fast and capable" },
  ],
  perplexity: [
    { id: "llama-3.1-sonar-large-128k-online", name: "Sonar Large", description: "Web search enabled" },
    { id: "llama-3.1-sonar-small-128k-online", name: "Sonar Small", description: "Fast web search" },
  ],
};

const PROVIDER_NAMES: Record<string, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  google: "Google",
  perplexity: "Perplexity",
};

const PROVIDER_COLORS: Record<string, string> = {
  openai: "bg-green-500/10 text-green-600",
  anthropic: "bg-orange-500/10 text-orange-600",
  google: "bg-blue-500/10 text-blue-600",
  perplexity: "bg-purple-500/10 text-purple-600",
};

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string, provider: string) => void;
}

export function ModelSelector({
  selectedModel,
  onModelChange,
}: ModelSelectorProps) {
  // Find current model info
  let currentModel = { id: selectedModel, name: selectedModel, provider: "openai" };
  for (const [provider, models] of Object.entries(MODELS)) {
    const found = models.find((m) => m.id === selectedModel);
    if (found) {
      currentModel = { ...found, provider };
      break;
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">{currentModel.name}</span>
          <Badge
            variant="secondary"
            className={cn("hidden sm:flex", PROVIDER_COLORS[currentModel.provider])}
          >
            {PROVIDER_NAMES[currentModel.provider]}
          </Badge>
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[300px]">
        {Object.entries(MODELS).map(([provider, models], index) => (
          <div key={provider}>
            {index > 0 && <DropdownMenuSeparator />}
            <DropdownMenuLabel className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className={cn("text-xs", PROVIDER_COLORS[provider])}
              >
                {PROVIDER_NAMES[provider]}
              </Badge>
            </DropdownMenuLabel>
            {models.map((model) => (
              <DropdownMenuItem
                key={model.id}
                onClick={() => onModelChange(model.id, provider)}
                className="flex items-center justify-between"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{model.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {model.description}
                  </span>
                </div>
                {selectedModel === model.id && (
                  <Check className="h-4 w-4" />
                )}
              </DropdownMenuItem>
            ))}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
