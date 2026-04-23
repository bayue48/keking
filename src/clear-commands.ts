import { config } from "./config.js";
import { clearCommands } from "./utils/deploy-commands.js";

try {
  if (!config.databaseUrl) {
    throw new Error("DATABASE_URL is required to collect guild IDs before clearing commands.");
  }

  const resolvedGuildId = config.guildId ? config.guildId : null;
  await clearCommands(resolvedGuildId);
  console.log(`Cleared commands for ${resolvedGuildId ? `guild ${resolvedGuildId}` : "global scope"}`);
} catch (error) {
  console.error("Error clearing commands:", error);
  process.exit(1);
}