import { SlashCommandBuilder } from 'discord.js';
import type { SlashCommand } from '../../structures/command.js';
import { getPlayer } from '../../utils/music.js';
import { createInfoEmbed } from '../../utils/embeds.js';

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('leave')
    .setDescription('Leave the voice channel'),
  async execute(interaction) {
    const player = getPlayer(interaction.guildId!);
    player.disconnect();

    await interaction.reply({
      embeds: [createInfoEmbed({
        title: 'Left Voice Channel',
        description: 'The bot has left the voice channel.',
      })],
    });
  },
};
