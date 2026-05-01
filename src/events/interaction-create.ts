import {
  Events,
  MessageFlags,
  type ButtonInteraction,
  type Interaction,
  type InteractionReplyOptions,
} from "discord.js";

import type { BotEvent } from "../structures/event.js";
import type { BotClient } from "../types/client.js";
import { createErrorEmbed } from "../utils/embeds.js";
import { getPlayer } from "../utils/music.js";
import { MissingBotPermissionsError, createMissingPermissionsReply } from "../utils/permissions.js";

export const event: BotEvent = {
  name: Events.InteractionCreate,
  async execute(...args) {
    const [interaction] = args as [Interaction];

    if (interaction.isChatInputCommand()) {
      const client = interaction.client as BotClient;
      const command = client.commands.get(interaction.commandName);

      if (!command) {
        const reply = {
          embeds: [createErrorEmbed("Unknown Command", "That command is not implemented yet.")],
          flags: MessageFlags.Ephemeral,
        } satisfies InteractionReplyOptions;

        await interaction.reply(reply);
        return;
      }

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(`Failed to execute /${interaction.commandName}:`, error);

        const reply = error instanceof MissingBotPermissionsError
          ? createMissingPermissionsReply(error)
          : {
              embeds: [createErrorEmbed("Command Failed", "Something went wrong while running that command.")],
              flags: MessageFlags.Ephemeral,
            } satisfies InteractionReplyOptions;

        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(reply);
          return;
        }

        await interaction.reply(reply);
      }
    } else if (interaction.isButton()) {
      if (interaction.customId.startsWith('music_')) {
        try {
          await handleMusicButton(interaction);
        } catch (error) {
          console.error(`Failed to handle button ${interaction.customId}:`, error);

          const reply = error instanceof MissingBotPermissionsError
            ? createMissingPermissionsReply(error)
            : {
                embeds: [createErrorEmbed("Action Failed", "Something went wrong while running that action.")],
                flags: MessageFlags.Ephemeral,
              } satisfies InteractionReplyOptions;

          if (interaction.replied || interaction.deferred) {
            await interaction.followUp(reply);
            return;
          }

          await interaction.reply(reply);
        }
      }
    }
  },
};

async function handleMusicButton(interaction: ButtonInteraction) {
  const player = getPlayer(interaction.guildId!);

  switch (interaction.customId) {
    case 'music_pause_resume': {
      const queue = player["discordPlayer"].nodes.get(interaction.guildId!);
      const paused = queue?.isPlaying() && !queue.node.isPaused();
      const message = paused ? player.pause() : player.resume();
      await interaction.reply({
        content: message,
        ephemeral: true,
      });
      break;
    }

    case 'music_skip': {
      const message = player.skip();
      await interaction.reply({
        content: message,
        ephemeral: true,
      });
      break;
    }

    case 'music_stop':
      {
      const message = player.stop();
      await interaction.reply({
        content: message,
        ephemeral: true,
      });
      break;
      }
  }
}
