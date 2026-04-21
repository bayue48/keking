import { MessageFlags, SlashCommandBuilder, type InteractionReplyOptions } from "discord.js";

import type { SlashCommand } from "../structures/command.js";
import { createInfoEmbed } from "../utils/embeds.js";

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Shows the starter commands included in this bot."),
  async execute(interaction) {
    const embed = createInfoEmbed({
      title: "Available Commands",
      fields: [
        { name: "/ping", value: "Checks whether the bot is responding." },
        { name: "/help", value: "Shows this command list." },
        { name: "/server", value: "Shows info about the current server." },
        { name: "/pia", value: "Searches novels from NovelPia." },
        { name: "/sync", value: "Redeploys commands for the current server." },
        { name: "/guildinfo", value: "Shows guild and command-sync info." },
        { name: "/botstats", value: "Shows bot health and database stats." },
      ],
    });

    const reply = {
      embeds: [embed],
      flags: MessageFlags.Ephemeral as const,
    } satisfies InteractionReplyOptions;

    await interaction.reply(reply);
  },
};
