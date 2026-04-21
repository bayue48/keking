import type {
  ChatInputCommandInteraction,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
} from "discord.js";

export type CommandData = {
  name: string;
  toJSON: () => RESTPostAPIChatInputApplicationCommandsJSONBody;
};

export type SlashCommand = {
  data: CommandData;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
};
