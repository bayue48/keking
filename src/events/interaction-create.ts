import {
  Events,
  MessageFlags,
  type ButtonInteraction,
  type Interaction,
} from "discord.js";
import type { BotEvent } from "../structures/event.js";
import type { BotClient } from "../types/client.js";
import { createInteractionErrorReply, replyToInteraction } from "../utils/interaction-responses.js";
import { getPlayer } from "../utils/music.js";

export const event: BotEvent = {
  name: Events.InteractionCreate,
  async execute(...args) {
    const [interaction] = args as [Interaction];

    if (interaction.isChatInputCommand()) {
      const client = interaction.client as BotClient;
      const command = client.commands.get(interaction.commandName);

      if (!command) {
        await replyToInteraction(interaction, createInteractionErrorReply(
          "Unknown Command",
          "That command is not implemented yet.",
          null,
        ));
        return;
      }

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(`Failed to execute /${interaction.commandName}:`, error);
        await replyToInteraction(
          interaction,
          createInteractionErrorReply("Command Failed", "Something went wrong while running that command.", error),
        );
      }
    } else if (interaction.isButton()) {
      if (interaction.customId.startsWith('music_')) {
        try {
          await handleMusicButton(interaction);
        } catch (error) {
          console.error(`Failed to handle button ${interaction.customId}:`, error);
          await replyToInteraction(
            interaction,
            createInteractionErrorReply("Action Failed", "Something went wrong while running that action.", error),
          );
        }
      }
    }
  },
};

const musicButtonActions = {
  music_pause_resume: (player: ReturnType<typeof getPlayer>) => player.togglePause(),
  music_skip: (player: ReturnType<typeof getPlayer>) => player.skip(),
  music_stop: (player: ReturnType<typeof getPlayer>) => player.stop(),
} as const;

async function handleMusicButton(interaction: ButtonInteraction) {
  if (!interaction.guildId) {
    await replyToInteraction(interaction, createInteractionErrorReply(
      "Guild Only",
      "This action can only be used in a server.",
      null,
    ));
    return;
  }

  const action = musicButtonActions[interaction.customId as keyof typeof musicButtonActions];
  if (!action) {
    return;
  }

  const player = getPlayer(interaction.guildId);
  await replyToInteraction(interaction, {
    content: action(player),
    flags: MessageFlags.Ephemeral,
  });
}
