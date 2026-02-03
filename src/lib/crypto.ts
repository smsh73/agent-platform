import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

// 암호화 키 (환경변수에서 가져오거나 AUTH_SECRET 사용)
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY || process.env.AUTH_SECRET || "default-key-change-in-production";
  // 32바이트 키로 변환
  return Buffer.from(key.padEnd(32, "0").slice(0, 32));
}

/**
 * 문자열을 암호화합니다
 */
export function encrypt(text: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  // IV + AuthTag + 암호화된 데이터를 합쳐서 반환
  return iv.toString("hex") + authTag.toString("hex") + encrypted;
}

/**
 * 암호화된 문자열을 복호화합니다
 */
export function decrypt(encryptedText: string): string {
  const key = getEncryptionKey();

  // IV, AuthTag, 암호화된 데이터 분리
  const iv = Buffer.from(encryptedText.slice(0, IV_LENGTH * 2), "hex");
  const authTag = Buffer.from(encryptedText.slice(IV_LENGTH * 2, IV_LENGTH * 2 + AUTH_TAG_LENGTH * 2), "hex");
  const encrypted = encryptedText.slice(IV_LENGTH * 2 + AUTH_TAG_LENGTH * 2);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * API 키를 마스킹합니다 (표시용)
 */
export function maskApiKey(key: string): string {
  if (key.length <= 8) {
    return "*".repeat(key.length);
  }
  return key.slice(0, 4) + "*".repeat(key.length - 8) + key.slice(-4);
}
