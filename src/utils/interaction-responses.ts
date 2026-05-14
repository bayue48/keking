import { MessageFlags, type ButtonInteraction, type ChatInputCommandInteraction, type InteractionReplyOptions } from "discord.js";
import { createErrorEmbed } from "./embeds.js";
import { MissingBotPermissionsError, createMissingPermissionsReply } from "./permissions.js";

type RepliableInteraction = ChatInputCommandInteraction | ButtonInteraction;

export async function replyToInteraction(
  interaction: RepliableInteraction,
  reply: InteractionReplyOptions,
): Promise<void> {
  if (interaction.replied || interaction.deferred) {
    await interaction.followUp(reply);
    return;
  }

  await interaction.reply(reply);
}

export function createInteractionErrorReply(
  title: string,
  description: string,
  error: unknown,
): InteractionReplyOptions {
  if (error instanceof MissingBotPermissionsError) {
    return createMissingPermissionsReply(error);
  }

  return {
    embeds: [createErrorEmbed(title, description)],
    flags: MessageFlags.Ephemeral,
  };
}
