import { MessageFlags, SlashCommandBuilder, type ChatInputCommandInteraction, type InteractionReplyOptions } from "discord.js";

import type { SlashCommand } from "../../structures/command.js";
import { createErrorEmbed, createInfoEmbed } from "../../utils/embeds.js";
import { getPlayer, type MusicPlayer } from "../../utils/music.js";

type MusicCommandResult = {
  description: string;
  title: string;
  error?: boolean;
  flags?: InteractionReplyOptions["flags"];
};

type SimpleMusicCommandOptions = {
  description: string;
  execute: (player: MusicPlayer, interaction: ChatInputCommandInteraction) => MusicCommandResult | Promise<MusicCommandResult>;
  name: string;
};

export function createSimpleMusicCommand(options: SimpleMusicCommandOptions): SlashCommand {
  return {
    data: new SlashCommandBuilder()
      .setName(options.name)
      .setDescription(options.description),
    async execute(interaction) {
      const guildId = interaction.guildId;
      if (!guildId) {
        await interaction.reply({
          embeds: [createErrorEmbed("Guild Only", "This command can only be used in a server.")],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const player = getPlayer(guildId);
      const result = await options.execute(player, interaction);

      await interaction.reply({
        embeds: [
          result.error
            ? createErrorEmbed(result.title, result.description)
            : createInfoEmbed({
                title: result.title,
                description: result.description,
              }),
        ],
        ...(result.flags !== undefined ? { flags: result.flags } : {}),
      });
    },
  };
}
