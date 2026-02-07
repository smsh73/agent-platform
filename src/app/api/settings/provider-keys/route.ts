import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { encrypt, decrypt, maskApiKey } from "@/lib/crypto";
import { ensureDefaultUser } from "@/lib/api-keys";

const VALID_PROVIDERS = ["openai", "anthropic", "google", "perplexity"];

/**
 * GET - 저장된 Provider API 키 목록 조회 (마스킹된 형태)
 */
export async function GET() {
  try {
    const session = await auth();

    // 세션이 없으면 기본 사용자 사용 (개발 환경)
    let userId = session?.user?.id;
    if (!userId) {
      const defaultUser = await ensureDefaultUser();
      userId = defaultUser.id;
    }

    const providerKeys = await prisma.userProviderKey.findMany({
      where: { userId },
      select: {
        provider: true,
        encryptedKey: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // 어떤 provider가 설정되어 있는지 반환 (마스킹된 키 포함)
    const providers = VALID_PROVIDERS.map((provider) => {
      const key = providerKeys.find((k: Record<string, unknown>) => k.provider === provider);
      let maskedKey = null;

      if (key) {
        try {
          const decryptedKey = decrypt(key.encryptedKey);
          maskedKey = maskApiKey(decryptedKey);
        } catch (error) {
          console.error(`Failed to decrypt key for ${provider}:`, error);
        }
      }

      return {
        provider,
        isConfigured: !!key,
        maskedKey,
        updatedAt: key?.updatedAt || null,
      };
    });

    return NextResponse.json({ providers });
  } catch (error) {
    console.error("Provider keys 조회 오류:", error);
    return NextResponse.json(
      { error: "Provider keys 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

/**
 * POST - Provider API 키 저장
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    console.log("🔐 API 키 저장 요청 - 세션:", session?.user?.email || "없음");

    // 세션이 없으면 기본 사용자 사용 (개발 환경)
    let userId = session?.user?.id;
    if (!userId) {
      console.log("⚠️ 세션 없음 - 기본 사용자 사용");
      const defaultUser = await ensureDefaultUser();
      userId = defaultUser.id;
      console.log("✅ 사용할 userId:", userId);
    } else {
      console.log("✅ 세션 사용자 ID:", userId);
    }

    const body = await req.json();
    const { provider, apiKey } = body;
    console.log("📝 저장할 provider:", provider);

    // 유효성 검사
    if (!provider || !VALID_PROVIDERS.includes(provider)) {
      return NextResponse.json(
        { error: "유효하지 않은 provider입니다" },
        { status: 400 }
      );
    }

    if (!apiKey || typeof apiKey !== "string" || apiKey.trim().length === 0) {
      return NextResponse.json(
        { error: "API 키를 입력해주세요" },
        { status: 400 }
      );
    }

    // API 키 암호화
    const encryptedKey = encrypt(apiKey.trim());
    console.log("🔐 API 키 암호화 완료");

    // Upsert (있으면 업데이트, 없으면 생성)
    console.log("💾 DB 저장 시도 - userId:", userId, "provider:", provider);
    const result = await prisma.userProviderKey.upsert({
      where: {
        userId_provider: {
          userId,
          provider,
        },
      },
      update: {
        encryptedKey,
        updatedAt: new Date(),
      },
      create: {
        userId,
        provider,
        encryptedKey,
      },
    });
    console.log("✅ API 키 저장 성공:", result.id);

    return NextResponse.json({
      success: true,
      message: `${provider.toUpperCase()} API 키가 저장되었습니다`,
    });
  } catch (error) {
    console.error("Provider key 저장 오류:", error);
    return NextResponse.json(
      { error: "API 키 저장 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Provider API 키 삭제
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();

    // 세션이 없으면 기본 사용자 사용 (개발 환경)
    let userId = session?.user?.id;
    if (!userId) {
      const defaultUser = await ensureDefaultUser();
      userId = defaultUser.id;
    }

    const { searchParams } = new URL(req.url);
    const provider = searchParams.get("provider");

    if (!provider || !VALID_PROVIDERS.includes(provider)) {
      return NextResponse.json(
        { error: "유효하지 않은 provider입니다" },
        { status: 400 }
      );
    }

    await prisma.userProviderKey.delete({
      where: {
        userId_provider: {
          userId,
          provider,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `${provider.toUpperCase()} API 키가 삭제되었습니다`,
    });
  } catch (error) {
    console.error("Provider key 삭제 오류:", error);
    return NextResponse.json(
      { error: "API 키 삭제 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
