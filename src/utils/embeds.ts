import { EmbedBuilder, type APIEmbedField } from "discord.js";

const EMBED_COLOR = 0x4f46e5;
const ERROR_COLOR = 0xdc2626;

type BaseEmbedOptions = {
  title: string;
  description?: string;
  fields?: APIEmbedField[];
};

export function createInfoEmbed(options: BaseEmbedOptions): EmbedBuilder {
  const embed = new EmbedBuilder().setColor(EMBED_COLOR).setTitle(options.title).setTimestamp();

  if (options.description) {
    embed.setDescription(options.description);
  }

  if (options.fields?.length) {
    embed.addFields(options.fields);
  }

  return embed;
}

export function createErrorEmbed(title: string, description: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(ERROR_COLOR)
    .setTitle(title)
    .setDescription(description)
    .setTimestamp();
}
