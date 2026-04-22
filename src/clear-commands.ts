import { config } from "./config.js";
import { closeDb, initializeGuildStorage } from "./db/postgres.js";
import { clearCommands } from "./utils/deploy-commands.js";

if (config.databaseUrl) {
  await initializeGuildStorage();
}

// if config.guildId is set, clear commands for that guild; otherwise clear global commands
const resolvedGuildId = config.guildId ? config.guildId : null;

try {
  console.log("Clearing commands...");
  await clearCommands(resolvedGuildId);
  console.log("✓ Commands cleared!");
} finally {
  await closeDb();
}
