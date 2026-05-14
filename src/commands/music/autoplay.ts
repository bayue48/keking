import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import type { SlashCommand } from '../../structures/command.js';
import { getPlayer } from '../../utils/music.js';
import { createInfoEmbed, createErrorEmbed } from '../../utils/embeds.js';

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('autoplay')
    .setDescription('Toggle autoplay mode for the queue'),
  async execute(interaction) {
    if (!interaction.guildId) {
      await interaction.reply({
        embeds: [createErrorEmbed('Guild Only', 'This command can only be used in a server.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const player = getPlayer(interaction.guildId);
    
    const currentMode = player.getLoopMode();
    const newMode = currentMode === 'autoplay' ? 'off' : 'autoplay';
    
    const result = player.setLoopMode(newMode);

    if (result.includes('No queue available')) {
      await interaction.reply({
        embeds: [createErrorEmbed('No Queue', result)],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.reply({
      embeds: [createInfoEmbed({
        title: '🎵 Autoplay Toggled',
        description: result,
      })],
    });
  },
};