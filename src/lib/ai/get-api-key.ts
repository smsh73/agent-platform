import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/crypto";

/**
 * Provider에 대한 API 키를 가져옵니다.
 * 1. 사용자 저장 키 확인
 * 2. 환경변수 확인
 */
export async function getApiKey(
  provider: string,
  userId?: string
): Promise<string | null> {
  // 1. 사용자 저장 키 확인 (로그인한 경우)
  if (userId) {
    try {
      const userKey = await prisma.userProviderKey.findUnique({
        where: {
          userId_provider: {
            userId,
            provider,
          },
        },
      });

      if (userKey) {
        return decrypt(userKey.encryptedKey);
      }
    } catch (error) {
      console.error("사용자 API 키 조회 오류:", error);
    }
  }

  // 2. 환경변수 확인
  const envVars: Record<string, string> = {
    openai: "OPENAI_API_KEY",
    anthropic: "ANTHROPIC_API_KEY",
    google: "GOOGLE_AI_API_KEY",
    perplexity: "PERPLEXITY_API_KEY",
  };

  const envVar = envVars[provider];
  if (envVar && process.env[envVar]) {
    return process.env[envVar]!;
  }

  return null;
}

/**
 * API 키가 설정되어 있는지 확인합니다.
 */
export async function hasApiKey(
  provider: string,
  userId?: string
): Promise<boolean> {
  const key = await getApiKey(provider, userId);
  return !!key;
}
