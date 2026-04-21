import { Pool } from "pg";

import { config } from "../config.js";

let pool: Pool | null = null;

function createPool(): Pool {
  if (!config.databaseUrl) {
    throw new Error("Missing required environment variable: DATABASE_URL");
  }

  return new Pool({
    connectionString: config.databaseUrl,
  });
}

export function getDb(): Pool {
  pool ??= createPool();
  return pool;
}

export async function initializeGuildStorage(): Promise<Pool> {
  const db = getDb();

  await db.query(`
    CREATE TABLE IF NOT EXISTS bot_guilds (
      guild_id TEXT PRIMARY KEY,
      guild_name TEXT NOT NULL,
      commands_hash TEXT,
      joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  return db;
}

export async function upsertGuild(guildId: string, guildName: string): Promise<void> {
  const db = getDb();

  await db.query(
    `
      INSERT INTO bot_guilds (guild_id, guild_name)
      VALUES ($1, $2)
      ON CONFLICT (guild_id)
      DO UPDATE SET
        guild_name = EXCLUDED.guild_name,
        updated_at = NOW()
    `,
    [guildId, guildName],
  );
}

export async function getGuildCommandHash(guildId: string): Promise<string | null> {
  const db = getDb();
  const result = await db.query<{ commands_hash: string | null }>(
    `
      SELECT commands_hash
      FROM bot_guilds
      WHERE guild_id = $1
      LIMIT 1
    `,
    [guildId],
  );

  return result.rows[0]?.commands_hash ?? null;
}

export type StoredGuildRecord = {
  guild_id: string;
  guild_name: string;
  commands_hash: string | null;
  joined_at: Date;
  updated_at: Date;
};

export async function getGuildRecord(guildId: string): Promise<StoredGuildRecord | null> {
  const db = getDb();
  const result = await db.query<StoredGuildRecord>(
    `
      SELECT guild_id, guild_name, commands_hash, joined_at, updated_at
      FROM bot_guilds
      WHERE guild_id = $1
      LIMIT 1
    `,
    [guildId],
  );

  return result.rows[0] ?? null;
}

export async function getStoredGuildCount(): Promise<number> {
  const db = getDb();
  const result = await db.query<{ count: string }>("SELECT COUNT(*) AS count FROM bot_guilds");

  return Number(result.rows[0]?.count ?? 0);
}

export async function setGuildCommandHash(guildId: string, commandsHash: string): Promise<void> {
  const db = getDb();

  await db.query(
    `
      UPDATE bot_guilds
      SET commands_hash = $2,
          updated_at = NOW()
      WHERE guild_id = $1
    `,
    [guildId, commandsHash],
  );
}

export async function deleteGuild(guildId: string): Promise<void> {
  const db = getDb();

  await db.query(
    `
      DELETE FROM bot_guilds
      WHERE guild_id = $1
    `,
    [guildId],
  );
}

export async function closeDb(): Promise<void> {
  if (!pool) {
    return;
  }

  await pool.end();
  pool = null;
}
