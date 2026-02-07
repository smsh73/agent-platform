import { prisma } from "./db";
import { decrypt } from "./crypto";
import { auth } from "./auth";

export type Provider = "openai" | "anthropic" | "google" | "perplexity";

/**
 * API 키를 가져옵니다.
 * 우선순위: 1) DB에 저장된 사용자별 키 -> 2) 환경변수
 */
export async function getApiKey(provider: Provider): Promise<string | null> {
  try {
    // 1. 세션이 있으면 DB에서 사용자 API 키 조회
    const session = await auth();

    if (session?.user?.id) {
      const userKey = await prisma.userProviderKey.findUnique({
        where: {
          userId_provider: {
            userId: session.user.id,
            provider,
          },
        },
      });

      if (userKey) {
        try {
          return decrypt(userKey.encryptedKey);
        } catch (error) {
          console.error(`Failed to decrypt ${provider} key:`, error);
        }
      }
    }

    // 2. DB에 없거나 세션이 없으면 환경변수 fallback
    return getEnvApiKey(provider);
  } catch (error) {
    console.error(`Error fetching ${provider} API key:`, error);
    // 에러가 발생해도 환경변수는 시도
    return getEnvApiKey(provider);
  }
}

/**
 * 환경변수에서 API 키를 가져옵니다.
 */
function getEnvApiKey(provider: Provider): string | null {
  const envKeys: Record<Provider, string | undefined> = {
    openai: process.env.OPENAI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
    google: process.env.GOOGLE_AI_API_KEY,
    perplexity: process.env.PERPLEXITY_API_KEY,
  };

  return envKeys[provider] || null;
}

/**
 * 여러 프로바이더의 API 키를 한 번에 가져옵니다.
 */
export async function getApiKeys(
  providers: Provider[]
): Promise<Record<Provider, string | null>> {
  const keys = await Promise.all(
    providers.map(async (provider) => {
      const key = await getApiKey(provider);
      return [provider, key] as const;
    })
  );

  return Object.fromEntries(keys) as Record<Provider, string | null>;
}

/**
 * API 키가 설정되어 있는지 확인합니다.
 */
export async function hasApiKey(provider: Provider): Promise<boolean> {
  const key = await getApiKey(provider);
  return key !== null && key.length > 0;
}

/**
 * 기본 사용자를 생성하거나 가져옵니다 (개발 환경용)
 */
export async function ensureDefaultUser() {
  const defaultEmail = "dev@localhost";

  try {
    // 먼저 기존 사용자 확인
    let user = await prisma.user.findUnique({
      where: { email: defaultEmail },
    });

    if (user) {
      console.log("✅ 기존 개발 사용자 사용:", user.email, "ID:", user.id);
      return user;
    }

    // 사용자가 없으면 생성
    console.log("📝 기본 개발 사용자 생성 중...");
    user = await prisma.user.create({
      data: {
        email: defaultEmail,
        name: "개발자",
        password: null, // 개발용 사용자는 비밀번호 없음
        role: "USER",
      },
    });
    console.log("✅ 기본 개발 사용자 생성 완료:", user.email, "ID:", user.id);

    // 생성 확인
    const verified = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!verified) {
      throw new Error("사용자 생성 후 확인 실패");
    }

    return user;
  } catch (error) {
    console.error("❌ 기본 사용자 생성/조회 실패:", error);
    throw error;
  }
}
