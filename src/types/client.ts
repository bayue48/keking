import type { Client } from "discord.js";
import type { Player } from "discord-player";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { botGuilds } from "../db/schema.js";
import type { SlashCommand } from "../structures/command.js";

type BotDatabase = NodePgDatabase<{
  botGuilds: typeof botGuilds;
}>;

export type BotClient = Client & {
  commands: Map<string, SlashCommand>;
  db?: BotDatabase;
  musicPlayer: Player;
};
