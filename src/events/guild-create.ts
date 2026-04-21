import { Events, type Guild } from "discord.js";

import { config } from "../config.js";
import { upsertGuild } from "../db/postgres.js";
import type { BotEvent } from "../structures/event.js";
import { deployCommands, formatDeployReport } from "../utils/deploy-commands.js";

export const event: BotEvent = {
  name: Events.GuildCreate,
  async execute(...args) {
    const [guild] = args as [Guild];

    try {
      if (config.databaseUrl) {
        await upsertGuild(guild.id, guild.name);
        console.log(`Saved guild ${guild.id} (${guild.name})`);
      }

      const deployResult = await deployCommands({ guildId: guild.id });
      console.log(formatDeployReport(deployResult, guild.id));
    } catch (error) {
      console.error(`Failed to initialize guild ${guild.id}:`, error);
    }
  },
};
