import path from "node:path";
import { fileURLToPath } from "node:url";
import { eq, sql } from "drizzle-orm";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { config } from "../config/config.js";
import { botGuilds, type StoredGuildRecord } from "./schema.js";

type DatabaseSchema = {
  botGuilds: typeof botGuilds;
};

type DatabaseClient = NodePgDatabase<DatabaseSchema>;

let pool: Pool | null = null;
let db: DatabaseClient | null = null;

const migrationsFolder = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "drizzle",
);

function createPool(): Pool {
  if (!config.database.url) {
    throw new Error("Missing required environment variable: DATABASE_URL");
  }

  return new Pool({
    connectionString: config.database.url,
  });
}

function createDb(client: Pool): DatabaseClient {
  return drizzle(client, {
    schema: {
      botGuilds,
    },
  });
}

export function getDb(): DatabaseClient {
  pool ??= createPool();
  db ??= createDb(pool);
  return db;
}

export async function initializeGuildStorage(): Promise<DatabaseClient> {
  const db = getDb();
  await migrate(db, { migrationsFolder });
  return db;
}

export async function upsertGuild(guildId: string, guildName: string): Promise<void> {
  const db = getDb();

  await db
    .insert(botGuilds)
    .values({ guildId, guildName })
    .onConflictDoUpdate({
      target: botGuilds.guildId,
      set: {
        guildName,
        updatedAt: sql`NOW()`,
      },
    });
}

export async function getGuildCommandHash(guildId: string): Promise<string | null> {
  const db = getDb();
  const result = await db
    .select({ commandsHash: botGuilds.commandsHash })
    .from(botGuilds)
    .where(eq(botGuilds.guildId, guildId))
    .limit(1);

  return result[0]?.commandsHash ?? null;
}

export async function getGuildRecord(guildId: string): Promise<StoredGuildRecord | null> {
  const db = getDb();
  const result = await db
    .select()
    .from(botGuilds)
    .where(eq(botGuilds.guildId, guildId))
    .limit(1);

  return result[0] ?? null;
}

export async function setGuildCommandHash(guildId: string, commandsHash: string): Promise<void> {
  const db = getDb();

  await db
    .update(botGuilds)
    .set({
      commandsHash,
      updatedAt: sql`NOW()`,
    })
    .where(eq(botGuilds.guildId, guildId));
}

export async function deleteGuild(guildId: string): Promise<void> {
  const db = getDb();
  await db.delete(botGuilds).where(eq(botGuilds.guildId, guildId));
}

export async function closeDb(): Promise<void> {
  if (!pool) {
    return;
  }

  await pool.end();
  db = null;
  pool = null;
}
