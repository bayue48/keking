import { Events, type Client } from "discord.js";

import { config } from "../config.js";
import { upsertGuild } from "../db/postgres.js";
import type { BotEvent } from "../structures/event.js";
import { deployCommands, formatDeployReport } from "../utils/deploy-commands.js";

export const event: BotEvent = {
  name: Events.ClientReady,
  once: true,
  async execute(...args) {
    const [client] = args as [Client<true>];
    console.log(`Logged in as ${client.user.tag}`);
    console.log(`Client is in ${client.guilds.cache.size} guild(s).`);
    console.log("Initializing guild storage and deploying commands...");
    
    for (const guild of client.guilds.cache.values()) {
      try {
        if (config.databaseUrl) {
          await upsertGuild(guild.id, guild.name);
        }

        const deployResult = await deployCommands({ guildId: guild.id });
        console.log(formatDeployReport(deployResult, guild.id));
      } catch (error) {
        console.error(`Failed to initialize guild ${guild.id}:`, error);
      }
    }

    if (!config.databaseUrl) {
      console.warn("DATABASE_URL is not set. Guild persistence is disabled.");
    }
  },
};
