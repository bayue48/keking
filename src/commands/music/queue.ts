import { SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../../structures/command.js";
import { getPlayer } from "../../utils/music.js";
import { createInfoEmbed } from "../../utils/embeds.js";

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("queue")
    .setDescription("Show the current music queue"),
  async execute(interaction) {
    const player = getPlayer(interaction.guildId!);
    const queue = player.getQueue();
    const current = player.getCurrentTrack();

    let description = "";
    if (current) {
      description += `**Now Playing:** ${current}\n\n`;
    } else {
      description += "No track is currently playing.\n\n";
    }

    if (queue.length > 0) {
      description += "**Queue:**\n";
      queue.forEach((track, index) => {
        description += `${index + 1}. ${track}\n`;
      });
    } else {
      description += "The queue is empty.";
    }

    await interaction.reply({
      embeds: [createInfoEmbed({ title: "Music Queue", description })],
    });
  },
};
