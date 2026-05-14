import { SlashCommandBuilder } from 'discord.js';
import type { SlashCommand } from '../../structures/command.js';
import { createInfoEmbed } from '../../utils/embeds.js';
import { preparePlaybackContext } from './playback-context.js';

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play music from YouTube or Spotify')
    .addStringOption((option) =>
      option
        .setName('url')
        .setDescription('YouTube or Spotify URL to play')
        .setRequired(true),
    ),
  async execute(interaction) {
    const url = interaction.options.getString('url', true).trim();
    const playback = await preparePlaybackContext(interaction);
    if (!playback) {
      return;
    }

    const { player } = playback;
    const hadCurrentTrack = player.hasCurrentTrack();

    await interaction.deferReply();

    const result = await player.play(url);

    await interaction.editReply({
      embeds: [createInfoEmbed({
        title: hadCurrentTrack ? '🎵 Added to Queue' : '🎵 Started Playing',
        description: result,
      })],
    });
  },
};
