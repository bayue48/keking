import { ActivityType, Client, GatewayIntentBits, PresenceUpdateStatus } from "discord.js";
import { config } from "../config/config.js";
import { closeDb, initializeGuildStorage } from "../db/postgres.js";
import { loadCommands } from "../loaders/commands.js";
import { loadEvents } from "../loaders/events.js";
import type { BotClient } from "../types/client.js";
import { initializePlayer } from "../utils/music.js";

export async function startBot(): Promise<BotClient> {
  const client = createClient();

  try {
    await initializeClient(client);
    registerProcessHandlers(client);
    await client.login(config.discord.token);
    return client;
  } catch (error) {
    await shutdownClient(client, "startup failure");
    throw error;
  }
}

function createClient(): BotClient {
  return new Client({
    presence: {
      activities: [
        {
          name: "Youtube",
          type: ActivityType.Watching,
        },
      ],
      status: PresenceUpdateStatus.Online,
    },
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  }) as BotClient;
}

async function initializeClient(client: BotClient): Promise<void> {
  client.musicPlayer = await initializePlayer(client);
  client.commands = new Map((await loadCommands()).entries());

  if (config.database.enabled) {
    client.db = await initializeGuildStorage();
  }

  await loadEvents(client);
}

async function shutdownClient(client: BotClient, reason: string): Promise<void> {
  console.log(`Shutting down (${reason})...`);

  try {
    client.destroy();
    await closeDb();
  } catch (error) {
    console.error("Shutdown cleanup failed:", error);
  }
}

function registerProcessHandlers(client: BotClient): void {
  let shuttingDown = false;

  const handleShutdown = async (signal: string): Promise<void> => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    console.log(`Received ${signal}. Shutting down gracefully...`);
    await shutdownClient(client, signal);
    process.exit(0);
  };

  process.once("SIGINT", () => void handleShutdown("SIGINT"));
  process.once("SIGTERM", () => void handleShutdown("SIGTERM"));
  process.on("unhandledRejection", (error) => {
    console.error("Unhandled promise rejection:", error);
  });
  process.on("uncaughtException", (error) => {
    console.error("Uncaught exception:", error);
  });
}
