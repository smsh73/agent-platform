/**
 * Oracle DB Prisma-compatible interface
 * Drop-in replacement for PrismaClient - exports `prisma` with same method signatures
 */
import { execute, executeOne, executeDML, cuid, toCamelCase } from "./db/oracle";

// ============================================
// User Repository
// ============================================
const user = {
  async findUnique(args: {
    where: { id?: string; email?: string };
    select?: Record<string, boolean>;
  }) {
    const { where, select } = args;
    let sql: string;
    let binds: Record<string, string>;

    if (where.id) {
      sql = "SELECT * FROM USERS WHERE ID = :id";
      binds = { id: where.id };
    } else if (where.email) {
      sql = "SELECT * FROM USERS WHERE EMAIL = :email";
      binds = { email: where.email };
    } else {
      return null;
    }

    const row = await executeOne<Record<string, unknown>>(sql, binds);
    if (!row) return null;

    const mapped = toCamelCase(row);
    if (select) {
      const filtered: Record<string, unknown> = {};
      for (const key of Object.keys(select)) {
        if (select[key]) filtered[key] = mapped[key];
      }
      return filtered;
    }
    return mapped;
  },

  async create(args: { data: Record<string, unknown> }) {
    const id = cuid();
    const now = new Date();
    const d = args.data;

    await executeDML(
      `INSERT INTO USERS (ID, EMAIL, PASSWORD, NAME, IMAGE, ROLE, CREATED_AT, UPDATED_AT)
       VALUES (:id, :email, :password, :name, :image, :role, :createdAt, :updatedAt)`,
      {
        id,
        email: (d.email as string) || "",
        password: (d.password as string) || null,
        name: (d.name as string) || null,
        image: (d.image as string) || null,
        role: (d.role as string) || "USER",
        createdAt: now,
        updatedAt: now,
      }
    );

    return { id, ...d, createdAt: now, updatedAt: now };
  },
};

// ============================================
// Conversation Repository
// ============================================
const conversation = {
  async findUnique(args: {
    where: { id: string };
    select?: Record<string, boolean>;
    include?: {
      messages?: { orderBy?: Record<string, string>; take?: number } | boolean;
      agent?: { select?: Record<string, boolean> } | boolean;
    };
  }) {
    const row = await executeOne<Record<string, unknown>>(
      "SELECT * FROM CONVERSATIONS WHERE ID = :id",
      { id: args.where.id }
    );
    if (!row) return null;

    const conv = toCamelCase(row) as Record<string, unknown>;

    if (args.select && !args.include) {
      const filtered: Record<string, unknown> = {};
      for (const key of Object.keys(args.select)) {
        if (args.select[key]) filtered[key] = conv[key];
      }
      return filtered;
    }

    if (args.include?.messages) {
      const msgOpts = typeof args.include.messages === "object" ? args.include.messages : {};
      const orderDir = msgOpts.orderBy?.createdAt === "desc" ? "DESC" : "ASC";
      const limit = msgOpts.take;
      let msgSql = `SELECT * FROM MESSAGES WHERE CONVERSATION_ID = :convId ORDER BY CREATED_AT ${orderDir}`;
      if (limit) msgSql += ` FETCH FIRST ${limit} ROWS ONLY`;
      const messages = await execute<Record<string, unknown>>(msgSql, { convId: args.where.id });
      conv.messages = messages.map(toCamelCase);
    }

    if (args.include?.agent && conv.agentId) {
      const agentOpts = typeof args.include.agent === "object" ? args.include.agent : {};
      const agentRow = await executeOne<Record<string, unknown>>(
        "SELECT * FROM AGENTS WHERE ID = :id",
        { id: conv.agentId as string }
      );
      if (agentRow) {
        const agent = toCamelCase(agentRow);
        if (agentOpts.select) {
          const filtered: Record<string, unknown> = {};
          for (const key of Object.keys(agentOpts.select)) {
            if (agentOpts.select[key]) filtered[key] = agent[key];
          }
          conv.agent = filtered;
        } else {
          conv.agent = agent;
        }
      } else {
        conv.agent = null;
      }
    }

    return conv;
  },

  async findMany(args: {
    where?: Record<string, unknown>;
    include?: {
      messages?: { take?: number; orderBy?: Record<string, string> };
      agent?: { select?: Record<string, boolean> };
    };
    orderBy?: Record<string, string> | Record<string, string>[];
    take?: number;
    skip?: number;
  }) {
    const conditions: string[] = [];
    const binds: Record<string, unknown> = {};

    if (args.where) {
      if (args.where.userId) {
        conditions.push("USER_ID = :userId");
        binds.userId = args.where.userId;
      }
      if (args.where.isArchived !== undefined) {
        conditions.push("IS_ARCHIVED = :isArchived");
        binds.isArchived = args.where.isArchived ? 1 : 0;
      }
    }

    let sql = "SELECT * FROM CONVERSATIONS";
    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(" AND ")}`;
    }

    const orderClauses: string[] = [];
    if (args.orderBy) {
      const orderArr = Array.isArray(args.orderBy) ? args.orderBy : [args.orderBy];
      for (const o of orderArr) {
        for (const [key, dir] of Object.entries(o)) {
          const col = key.replace(/[A-Z]/g, (l) => `_${l}`).toUpperCase();
          orderClauses.push(`${col} ${dir === "desc" ? "DESC" : "ASC"}`);
        }
      }
    }
    sql += orderClauses.length > 0
      ? ` ORDER BY ${orderClauses.join(", ")}`
      : " ORDER BY UPDATED_AT DESC";

    if (args.skip) sql += ` OFFSET ${args.skip} ROWS`;
    if (args.take) sql += ` FETCH FIRST ${args.take} ROWS ONLY`;

    const rows = await execute<Record<string, unknown>>(sql, binds);
    const results = rows.map(toCamelCase) as Record<string, unknown>[];

    if (args.include?.messages) {
      for (const conv of results) {
        const msgOpts = args.include.messages!;
        const orderDir = msgOpts.orderBy?.createdAt === "desc" ? "DESC" : "ASC";
        let msgSql = `SELECT * FROM MESSAGES WHERE CONVERSATION_ID = :convId ORDER BY CREATED_AT ${orderDir}`;
        if (msgOpts.take) msgSql += ` FETCH FIRST ${msgOpts.take} ROWS ONLY`;
        const msgs = await execute<Record<string, unknown>>(msgSql, { convId: conv.id as string });
        conv.messages = msgs.map(toCamelCase);
      }
    }

    if (args.include?.agent) {
      for (const conv of results) {
        if (conv.agentId) {
          const agentRow = await executeOne<Record<string, unknown>>(
            "SELECT * FROM AGENTS WHERE ID = :id",
            { id: conv.agentId as string }
          );
          if (agentRow) {
            const agent = toCamelCase(agentRow);
            const sel = (args.include.agent as { select?: Record<string, boolean> }).select;
            if (sel) {
              const filtered: Record<string, unknown> = {};
              for (const key of Object.keys(sel)) {
                if (sel[key]) filtered[key] = agent[key];
              }
              conv.agent = filtered;
            } else {
              conv.agent = agent;
            }
          } else {
            conv.agent = null;
          }
        } else {
          conv.agent = null;
        }
      }
    }

    return results;
  },

  async create(args: {
    data: Record<string, unknown>;
    include?: { agent?: { select?: Record<string, boolean> } };
  }) {
    const id = cuid();
    const now = new Date();
    const d = args.data;

    await executeDML(
      `INSERT INTO CONVERSATIONS (ID, TITLE, MODEL, PROVIDER, USER_ID, AGENT_ID, IS_ARCHIVED, IS_PINNED, CREATED_AT, UPDATED_AT)
       VALUES (:id, :title, :model, :provider, :userId, :agentId, :isArchived, :isPinned, :createdAt, :updatedAt)`,
      {
        id,
        title: (d.title as string) || null,
        model: (d.model as string) || "gpt-4o",
        provider: (d.provider as string) || "OPENAI",
        userId: d.userId as string,
        agentId: (d.agentId as string) || null,
        isArchived: 0,
        isPinned: 0,
        createdAt: now,
        updatedAt: now,
      }
    );

    const result: Record<string, unknown> = {
      id, title: d.title || null, model: d.model || "gpt-4o",
      provider: d.provider || "OPENAI", userId: d.userId,
      agentId: d.agentId || null, isArchived: false, isPinned: false,
      createdAt: now, updatedAt: now,
    };

    if (args.include?.agent && d.agentId) {
      const agentRow = await executeOne<Record<string, unknown>>(
        "SELECT * FROM AGENTS WHERE ID = :id", { id: d.agentId as string }
      );
      if (agentRow) {
        const agent = toCamelCase(agentRow);
        const sel = args.include.agent.select;
        if (sel) {
          const filtered: Record<string, unknown> = {};
          for (const key of Object.keys(sel)) {
            if (sel[key]) filtered[key] = agent[key];
          }
          result.agent = filtered;
        } else {
          result.agent = agent;
        }
      }
    }

    return result;
  },

  async update(args: {
    where: { id: string };
    data: Record<string, unknown>;
    include?: { agent?: { select?: Record<string, boolean> } };
  }) {
    const setClauses: string[] = [];
    const binds: Record<string, unknown> = { id: args.where.id };

    for (const [key, value] of Object.entries(args.data)) {
      if (value === undefined) continue;
      const col = key.replace(/[A-Z]/g, (l) => `_${l}`).toUpperCase();
      if (typeof value === "boolean") {
        setClauses.push(`${col} = :${key}`);
        binds[key] = value ? 1 : 0;
      } else {
        setClauses.push(`${col} = :${key}`);
        binds[key] = value;
      }
    }

    if (!setClauses.some((c) => c.startsWith("UPDATED_AT"))) {
      setClauses.push("UPDATED_AT = :updatedAtAuto");
      binds.updatedAtAuto = new Date();
    }

    if (setClauses.length > 0) {
      await executeDML(
        `UPDATE CONVERSATIONS SET ${setClauses.join(", ")} WHERE ID = :id`,
        binds
      );
    }

    return conversation.findUnique({ where: { id: args.where.id }, include: args.include });
  },

  async delete(args: { where: { id: string } }) {
    await executeDML("DELETE FROM CONVERSATIONS WHERE ID = :id", { id: args.where.id });
    return { id: args.where.id };
  },
};

// ============================================
// Message Repository
// ============================================
const message = {
  async create(args: { data: Record<string, unknown> }) {
    const id = cuid();
    const now = new Date();
    const d = args.data;

    await executeDML(
      `INSERT INTO MESSAGES (ID, ROLE, CONTENT, TOOL_CALLS, TOOL_RESULTS, MODEL, TOKENS, CONVERSATION_ID, CREATED_AT)
       VALUES (:id, :role, :content, :toolCalls, :toolResults, :model, :tokens, :conversationId, :createdAt)`,
      {
        id,
        role: d.role as string,
        content: d.content as string,
        toolCalls: (d.toolCalls as string) || null,
        toolResults: (d.toolResults as string) || null,
        model: (d.model as string) || null,
        tokens: (d.tokens as number) || null,
        conversationId: d.conversationId as string,
        createdAt: now,
      }
    );

    return { id, ...d, createdAt: now };
  },

  async findMany(args: {
    where: { conversationId: string };
    orderBy?: Record<string, string>;
    skip?: number;
    take?: number;
  }) {
    const orderDir = args.orderBy?.createdAt === "desc" ? "DESC" : "ASC";
    let sql = `SELECT * FROM MESSAGES WHERE CONVERSATION_ID = :convId ORDER BY CREATED_AT ${orderDir}`;
    if (args.skip) sql += ` OFFSET ${args.skip} ROWS`;
    if (args.take) sql += ` FETCH FIRST ${args.take} ROWS ONLY`;

    const rows = await execute<Record<string, unknown>>(sql, { convId: args.where.conversationId });
    return rows.map(toCamelCase);
  },
};

// ============================================
// UserProviderKey Repository
// ============================================
const userProviderKey = {
  async findUnique(args: {
    where: { userId_provider?: { userId: string; provider: string } };
  }) {
    if (!args.where.userId_provider) return null;
    const { userId, provider } = args.where.userId_provider;

    const row = await executeOne<Record<string, unknown>>(
      "SELECT * FROM USER_PROVIDER_KEYS WHERE USER_ID = :userId AND PROVIDER = :provider",
      { userId, provider }
    );
    return row ? toCamelCase(row) : null;
  },

  async findMany(args: {
    where: { userId: string };
    select?: Record<string, boolean>;
  }) {
    const rows = await execute<Record<string, unknown>>(
      "SELECT * FROM USER_PROVIDER_KEYS WHERE USER_ID = :userId",
      { userId: args.where.userId }
    );
    const results = rows.map(toCamelCase);

    if (args.select) {
      return results.map((row) => {
        const filtered: Record<string, unknown> = {};
        for (const key of Object.keys(args.select!)) {
          if (args.select![key]) filtered[key] = (row as Record<string, unknown>)[key];
        }
        return filtered;
      });
    }
    return results;
  },

  async upsert(args: {
    where: { userId_provider: { userId: string; provider: string } };
    update: Record<string, unknown>;
    create: Record<string, unknown>;
  }) {
    const { userId, provider } = args.where.userId_provider;

    const existing = await executeOne<Record<string, unknown>>(
      "SELECT ID FROM USER_PROVIDER_KEYS WHERE USER_ID = :userId AND PROVIDER = :provider",
      { userId, provider }
    );

    if (existing) {
      const setClauses: string[] = [];
      const binds: Record<string, unknown> = { userId, provider };
      for (const [key, value] of Object.entries(args.update)) {
        if (value === undefined) continue;
        const col = key.replace(/[A-Z]/g, (l) => `_${l}`).toUpperCase();
        setClauses.push(`${col} = :${key}`);
        binds[key] = value;
      }
      if (setClauses.length > 0) {
        await executeDML(
          `UPDATE USER_PROVIDER_KEYS SET ${setClauses.join(", ")} WHERE USER_ID = :userId AND PROVIDER = :provider`,
          binds
        );
      }
      const updated = await executeOne<Record<string, unknown>>(
        "SELECT * FROM USER_PROVIDER_KEYS WHERE USER_ID = :userId AND PROVIDER = :provider",
        { userId, provider }
      );
      return updated ? toCamelCase(updated) : null;
    } else {
      const id = cuid();
      const now = new Date();
      const d = args.create;
      await executeDML(
        `INSERT INTO USER_PROVIDER_KEYS (ID, PROVIDER, ENCRYPTED_KEY, USER_ID, CREATED_AT, UPDATED_AT)
         VALUES (:id, :provider, :encryptedKey, :userId, :createdAt, :updatedAt)`,
        {
          id,
          provider: (d.provider as string) || provider,
          encryptedKey: d.encryptedKey as string,
          userId: (d.userId as string) || userId,
          createdAt: now,
          updatedAt: now,
        }
      );
      return { id, ...d, createdAt: now, updatedAt: now };
    }
  },

  async delete(args: {
    where: { userId_provider: { userId: string; provider: string } };
  }) {
    const { userId, provider } = args.where.userId_provider;
    await executeDML(
      "DELETE FROM USER_PROVIDER_KEYS WHERE USER_ID = :userId AND PROVIDER = :provider",
      { userId, provider }
    );
    return { userId, provider };
  },
};

// ============================================
// UsageRecord Repository
// ============================================
const usageRecord = {
  async create(args: { data: Record<string, unknown> }) {
    const id = cuid();
    const now = new Date();
    const d = args.data;

    await executeDML(
      `INSERT INTO USAGE_RECORDS (ID, PROVIDER, MODEL, TYPE, INPUT_TOKENS, OUTPUT_TOKENS, TOTAL_TOKENS, COST, USER_ID, CREATED_AT)
       VALUES (:id, :provider, :model, :type, :inputTokens, :outputTokens, :totalTokens, :cost, :userId, :createdAt)`,
      {
        id,
        provider: d.provider as string,
        model: d.model as string,
        type: d.type as string,
        inputTokens: (d.inputTokens as number) || 0,
        outputTokens: (d.outputTokens as number) || 0,
        totalTokens: (d.totalTokens as number) || 0,
        cost: (d.cost as number) || 0,
        userId: d.userId as string,
        createdAt: now,
      }
    );
    return { id, ...d, createdAt: now };
  },
};

// ============================================
// Prisma-compatible interface
// ============================================
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const prisma: any = {
  user,
  conversation,
  message,
  userProviderKey,
  usageRecord,

  async $queryRaw(_strings: TemplateStringsArray, ..._values: unknown[]) {
    const sql = _strings.join("");
    return execute(sql);
  },
};

export default prisma;
