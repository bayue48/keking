import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import type { SlashCommand } from '../../structures/command.js';
import { createInfoEmbed, createErrorEmbed } from '../../utils/embeds.js';
import { preparePlaybackContext } from './playback-context.js';

export const command: SlashCommand = {
    data: new SlashCommandBuilder()
        .setName('tts')
        .setDescription('Convert text to speech and play it in voice channel')
        .addStringOption((option) =>
            option
                .setName('text')
                .setDescription('Text to convert to speech')
                .setRequired(true),
        ),
    async execute(interaction) {
        const text = interaction.options.getString('text', true);

        try {
            const playback = await preparePlaybackContext(interaction);
            if (!playback) {
                return;
            }

            const { player } = playback;
            const result = await player.playTTS(text);
            await interaction.reply({
                embeds: [createInfoEmbed({
                    title: 'TTS',
                    description: result,
                })],
            });
        } catch (error) {
            console.error('Error in TTS command:', error);
            await interaction.reply({
                embeds: [createErrorEmbed('Error', 'Failed to play TTS.')],
                flags: MessageFlags.Ephemeral,
            });
        }
    },
};
