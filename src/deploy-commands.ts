import { config } from "./config.js";
import { closeDb, initializeGuildStorage } from "./db/postgres.js";
import { deployCommands, formatDeployReport } from "./utils/deploy-commands.js";

if (config.databaseUrl) {
  await initializeGuildStorage();
}

const resolvedGuildId = config.guildId;
let deployResult = { count: 0, skipped: false, hash: "", commandNames: [] as string[] };

try {
  deployResult = await deployCommands({ guildId: resolvedGuildId });
} finally {
  await closeDb();
}

console.log(
  formatDeployReport(deployResult, resolvedGuildId),
);
