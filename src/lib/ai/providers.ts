import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

// 기본 Provider 인스턴스 (환경변수 사용)
export const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_AI_API_KEY,
});

export const perplexity = createOpenAI({
  apiKey: process.env.PERPLEXITY_API_KEY,
  baseURL: "https://api.perplexity.ai",
});

// 동적 API 키를 사용한 Provider 생성
export function createProviderWithKey(provider: Provider, apiKey: string) {
  switch (provider) {
    case "openai":
      return createOpenAI({ apiKey });
    case "anthropic":
      return createAnthropic({ apiKey });
    case "google":
      return createGoogleGenerativeAI({ apiKey });
    case "perplexity":
      return createOpenAI({ apiKey, baseURL: "https://api.perplexity.ai" });
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

// Model configurations
export const MODELS = {
  openai: {
    "gpt-4o": { name: "GPT-4o", provider: "openai", maxTokens: 128000 },
    "gpt-4o-mini": { name: "GPT-4o Mini", provider: "openai", maxTokens: 128000 },
    "gpt-4-turbo": { name: "GPT-4 Turbo", provider: "openai", maxTokens: 128000 },
    "o1": { name: "o1", provider: "openai", maxTokens: 200000 },
    "o1-mini": { name: "o1 Mini", provider: "openai", maxTokens: 128000 },
  },
  anthropic: {
    "claude-3-5-sonnet-latest": { name: "Claude 3.5 Sonnet", provider: "anthropic", maxTokens: 200000 },
    "claude-3-5-haiku-latest": { name: "Claude 3.5 Haiku", provider: "anthropic", maxTokens: 200000 },
    "claude-3-opus-latest": { name: "Claude 3 Opus", provider: "anthropic", maxTokens: 200000 },
  },
  google: {
    "gemini-2.0-flash-exp": { name: "Gemini 2.0 Flash", provider: "google", maxTokens: 1000000 },
    "gemini-1.5-pro": { name: "Gemini 1.5 Pro", provider: "google", maxTokens: 2000000 },
    "gemini-1.5-flash": { name: "Gemini 1.5 Flash", provider: "google", maxTokens: 1000000 },
  },
  perplexity: {
    "llama-3.1-sonar-large-128k-online": { name: "Sonar Large (Online)", provider: "perplexity", maxTokens: 128000 },
    "llama-3.1-sonar-small-128k-online": { name: "Sonar Small (Online)", provider: "perplexity", maxTokens: 128000 },
  },
} as const;

export type Provider = keyof typeof MODELS;
export type ModelId = string;

// Get provider instance by name
export function getProvider(provider: Provider) {
  switch (provider) {
    case "openai":
      return openai;
    case "anthropic":
      return anthropic;
    case "google":
      return google;
    case "perplexity":
      return perplexity;
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

// Get model by ID (기본 환경변수 API 키 사용)
export function getModel(modelId: string) {
  for (const [provider, models] of Object.entries(MODELS)) {
    if (modelId in models) {
      const providerInstance = getProvider(provider as Provider);
      return providerInstance(modelId);
    }
  }
  // Default to OpenAI GPT-4o
  return openai("gpt-4o");
}

// Get model with specific API key (사용자 API 키 사용)
export function getModelWithKey(modelId: string, apiKey: string) {
  const provider = getProviderFromModel(modelId);
  const providerInstance = createProviderWithKey(provider, apiKey);
  return providerInstance(modelId);
}

// Get provider name from model ID
export function getProviderFromModel(modelId: string): Provider {
  for (const [provider, models] of Object.entries(MODELS)) {
    if (modelId in models) {
      return provider as Provider;
    }
  }
  // Default to openai
  return "openai";
}

// Get all models as flat array for UI
export function getAllModels() {
  const allModels: Array<{
    id: string;
    name: string;
    provider: string;
    maxTokens: number;
  }> = [];

  for (const [provider, models] of Object.entries(MODELS)) {
    for (const [id, config] of Object.entries(models)) {
      allModels.push({
        id,
        ...config,
      });
    }
  }

  return allModels;
}
