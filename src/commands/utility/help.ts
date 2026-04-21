import { MessageFlags, SlashCommandBuilder, type InteractionReplyOptions } from "discord.js";

import type { SlashCommand } from "../../structures/command.js";
import { createInfoEmbed } from "../../utils/embeds.js";

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Shows the starter commands included in this bot."),
  async execute(interaction) {
    const embed = createInfoEmbed({
      title: "Available Commands",
      fields: [
        { name: "Utility", value: "`/help`, `/ping`, `/server`" },
        { name: "Integrations", value: "`/pia`" },
        { name: "Admin", value: "`/sync`, `/guildinfo`, `/botstats`" },
      ],
    });

    const reply = {
      embeds: [embed],
      flags: MessageFlags.Ephemeral as const,
    } satisfies InteractionReplyOptions;

    await interaction.reply(reply);
  },
};
