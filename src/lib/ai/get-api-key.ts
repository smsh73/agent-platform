import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/crypto";
import { auth } from "@/lib/auth";
import { ensureDefaultUser } from "@/lib/api-keys";

/**
 * Provider에 대한 API 키를 가져옵니다.
 * 우선순위: 1) DB에 저장된 사용자별 키 -> 2) 환경변수
 * 세션이 없으면 기본 개발 사용자의 키를 사용합니다.
 */
export async function getApiKey(
  provider: string,
  userId?: string
): Promise<string | null> {
  // userId가 제공되지 않으면 세션에서 가져오기
  let effectiveUserId = userId;

  if (!effectiveUserId) {
    try {
      const session = await auth();
      if (session?.user?.id) {
        effectiveUserId = session.user.id;
      } else {
        // 세션이 없으면 기본 개발 사용자 사용
        const defaultUser = await ensureDefaultUser();
        effectiveUserId = defaultUser.id;
      }
    } catch (error) {
      console.error("세션 확인 오류:", error);
    }
  }

  // 1. 사용자 저장 키 확인
  if (effectiveUserId) {
    try {
      const userKey = await prisma.userProviderKey.findUnique({
        where: {
          userId_provider: {
            userId: effectiveUserId,
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

  // 2. 환경변수 확인 (fallback)
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
