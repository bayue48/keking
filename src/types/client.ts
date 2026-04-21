import type { Client } from "discord.js";
import type { Pool } from "pg";

import type { SlashCommand } from "../structures/command.js";

export type BotClient = Client & {
  commands: Map<string, SlashCommand>;
  db?: Pool;
};
