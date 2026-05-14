import { Events, type Client } from "discord.js";
import { config } from "../config/config.js";
import type { BotEvent } from "../structures/event.js";
import { deployCommands, formatDeployReport } from "../utils/deploy-commands.js";

export const event: BotEvent = {
  name: Events.ClientReady,
  once: true,
  async execute(...args) {
    const [client] = args as [Client<true>];
    console.log(`Logged in as ${client.user.tag}`);
    console.log(`Client is in ${client.guilds.cache.size} guild(s).`);

    if (config.startup.deployGlobally) {
      console.log("Production mode: deploying commands globally...");
      const result = await deployCommands({ guildId: null });
      console.log(formatDeployReport(result, null));
    } else if (config.startup.deployGuildId) {
      console.log(`Development mode: deploying commands for guild ${config.startup.deployGuildId}...`);
      const result = await deployCommands({ guildId: config.startup.deployGuildId });
      console.log(formatDeployReport(result, config.startup.deployGuildId));
    }

    if (!config.database.enabled) {
      console.warn("DATABASE_URL is not set. Guild persistence is disabled.");
    }
  },
};
