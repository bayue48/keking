import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import type { SlashCommand } from '../../structures/command.js';
import { getPlayer } from '../../utils/music.js';
import { createInfoEmbed, createErrorEmbed } from '../../utils/embeds.js';

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('filter')
    .setDescription('Toggle an audio filter')
    .addStringOption(option =>
      option
        .setName('name')
        .setDescription('The filter to toggle')
        .setRequired(true)
        .addChoices(
          { name: 'Bassboost', value: 'bassboost' },
          { name: 'Nightcore', value: 'nightcore' },
          { name: '8D', value: '8D' },
          { name: 'Vaporwave', value: 'vaporwave' },
          { name: 'Karaoke', value: 'karaoke' },
          { name: 'Tremolo', value: 'tremolo' }
        )),
  async execute(interaction) {
    if (!interaction.guildId) {
      await interaction.reply({
        embeds: [createErrorEmbed('Guild Only', 'This command can only be used in a server.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const filterName = interaction.options.getString('name', true);
    const player = getPlayer(interaction.guildId);

    const result = player.toggleFilter(filterName);

    if (result.includes('No queue available') || result.includes('Failed')) {
      await interaction.reply({
        embeds: [createErrorEmbed('Filter Error', result)],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const activeFilters = player.getFilters();
    const activeString = activeFilters.length > 0 ? activeFilters.join(', ') : 'None';

    await interaction.reply({
      embeds: [createInfoEmbed({
        title: '🎵 Audio Filter Toggled',
        description: `${result}\n\n**Active Filters:** ${activeString}`,
      })],
    });
  },
};