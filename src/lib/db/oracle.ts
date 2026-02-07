import oracledb from "oracledb";
import path from "path";

// Oracle DB connection pool management
let pool: oracledb.Pool | null = null;

function getWalletDir(): string {
  return process.env.ORACLE_WALLET_DIR || path.join(process.cwd(), "oci", "wallet");
}

export async function getPool(): Promise<oracledb.Pool> {
  if (pool) return pool;

  const user = process.env.ORACLE_USER || "ADMIN";
  const password = process.env.ORACLE_PASSWORD || "AgentPlat2026#Secure";
  const connectString = process.env.ORACLE_CONNECTION_STRING || "agentplatdb_tp";
  const walletDir = getWalletDir();
  const walletPassword = process.env.ORACLE_WALLET_PASSWORD || "WalletPass2026#";

  pool = await oracledb.createPool({
    user,
    password,
    connectString,
    configDir: walletDir,
    walletLocation: walletDir,
    walletPassword,
    poolMin: 1,
    poolMax: 10,
    poolIncrement: 1,
  });

  return pool;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function execute<T = Record<string, unknown>>(
  sql: string,
  binds: any = {},
  options: oracledb.ExecuteOptions = {}
): Promise<T[]> {
  const p = await getPool();
  const conn = await p.getConnection();
  try {
    const result = await conn.execute(sql, binds, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      autoCommit: true,
      ...options,
    });
    return (result.rows as T[]) || [];
  } finally {
    await conn.close();
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function executeOne<T = Record<string, unknown>>(
  sql: string,
  binds: any = {},
  options: oracledb.ExecuteOptions = {}
): Promise<T | null> {
  const rows = await execute<T>(sql, binds, options);
  return rows.length > 0 ? rows[0] : null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function executeDML(
  sql: string,
  binds: any = {}
): Promise<number> {
  const p = await getPool();
  const conn = await p.getConnection();
  try {
    const result = await conn.execute(sql, binds, { autoCommit: true });
    return result.rowsAffected || 0;
  } finally {
    await conn.close();
  }
}

// Generate CUID-like IDs
export function cuid(): string {
  const ts = Date.now().toString(36);
  const rand = Array.from({ length: 12 }, () =>
    Math.floor(Math.random() * 36).toString(36)
  ).join("");
  return `c${ts}${rand}`.substring(0, 25);
}

// Convert Oracle row (UPPER_CASE keys) to camelCase
export function toCamelCase(row: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    const camelKey = key
      .toLowerCase()
      .replace(/_([a-z])/g, (_, char) => char.toUpperCase());
    // Handle Oracle NUMBER(1) → boolean
    if (
      (camelKey === "isArchived" ||
        camelKey === "isPinned" ||
        camelKey === "isPublic" ||
        camelKey === "isTemplate" ||
        camelKey === "isRevoked" ||
        camelKey === "isAutoScalingEnabled" ||
        camelKey === "emailVerified" ||
        camelKey === "isMtlsConnectionRequired") &&
      typeof value === "number"
    ) {
      result[camelKey] = value === 1;
    } else {
      result[camelKey] = value;
    }
  }
  return result;
}

// Convert camelCase keys to SNAKE_CASE for Oracle
export function toSnakeCase(key: string): string {
  return key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`).toUpperCase();
}

// Close pool on shutdown
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.close(0);
    pool = null;
  }
}
