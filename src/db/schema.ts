import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const botGuilds = pgTable("bot_guilds", {
  guildId: text("guild_id").primaryKey(),
  guildName: text("guild_name").notNull(),
  commandsHash: text("commands_hash"),
  joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type StoredGuildRecord = typeof botGuilds.$inferSelect;
