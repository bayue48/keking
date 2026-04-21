import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";

import type { SlashCommand } from "../../structures/command.js";
import { createInfoEmbed } from "../../utils/embeds.js";

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with Pong!"),
  async execute(interaction: ChatInputCommandInteraction) {
    const embed = createInfoEmbed({
      title: "Pong",
      description: `Gateway latency is ${Math.round(interaction.client.ws.ping)} ms.`,
    });

    await interaction.reply({ embeds: [embed] });
  },
};
