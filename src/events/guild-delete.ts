import { Events, type Guild } from "discord.js";
import { config } from "../config/config.js";
import { deleteGuild } from "../db/postgres.js";
import type { BotEvent } from "../structures/event.js";

export const event: BotEvent = {
  name: Events.GuildDelete,
  async execute(...args) {
    const [guild] = args as [Guild];

    if (!config.database.enabled) {
      return;
    }

    try {
      await deleteGuild(guild.id);
      console.log(`Removed guild ${guild.id} (${guild.name})`);
    } catch (error) {
      console.error(`Failed to remove guild ${guild.id}:`, error);
    }
  },
};
