import { Collection } from "discord.js";
import type { SlashCommand } from "../structures/command.js";
import { importNamedExportsFrom } from "../utils/load-files.js";

export async function loadCommands(): Promise<Collection<string, SlashCommand>> {
  const commands = await importNamedExportsFrom<SlashCommand>("commands", "command");
  return new Collection(commands.map((command) => [command.data.name, command] as const));
}
