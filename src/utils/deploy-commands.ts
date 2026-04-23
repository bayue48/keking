import { createHash } from "node:crypto";
import { REST, Routes, type RESTPostAPIChatInputApplicationCommandsJSONBody } from "discord.js";
import { config } from "../config.js";
import { getGuildCommandHash, setGuildCommandHash } from "../db/postgres.js";
import { loadCommands } from "../loaders/commands.js";

type CommandPayload = {
  body: RESTPostAPIChatInputApplicationCommandsJSONBody[];
  hash: string;
  names: string[];
};

type DeployCommandsResult = {
  count: number;
  hash: string;
  skipped: boolean;
  commandNames: string[];
};

let commandPayloadPromise: Promise<CommandPayload> | null = null;

async function getCommandPayload(): Promise<CommandPayload> {
  commandPayloadPromise ??= (async () => {
    const commands = await loadCommands();
    const body = [...commands.values()].map((command) => command.data.toJSON());
    const names = body.map((command) => command.name).sort((left, right) => left.localeCompare(right));
    const hash = createHash("sha256").update(JSON.stringify(body)).digest("hex");

    return { body, hash, names };
  })();

  return commandPayloadPromise;
}

export async function getCurrentCommandsHash(): Promise<string> {
  const payload = await getCommandPayload();
  return payload.hash;
}

type DeployCommandsOptions = {
  guildId?: string | null | undefined;
};

export async function deployCommands(options: DeployCommandsOptions = {}): Promise<DeployCommandsResult> {
  const { guildId } = options;
  const { body, hash, names } = await getCommandPayload();

  if (guildId && config.databaseUrl) {
    const currentHash = await getGuildCommandHash(guildId);

    if (currentHash === hash) {
      return {
        count: body.length,
        hash,
        skipped: true,
        commandNames: names,
      };
    }
  }

  const rest = new REST({ version: "10" }).setToken(config.token);
  const route = guildId
    ? Routes.applicationGuildCommands(config.clientId, guildId)
    : Routes.applicationCommands(config.clientId);

  await rest.put(route, { body });

  if (guildId && config.databaseUrl) {
    await setGuildCommandHash(guildId, hash);
  }

  return {
    count: body.length,
    hash,
    skipped: false,
    commandNames: names,
  };
}

export async function clearCommands(guildId?: string | null): Promise<void> {
  const rest = new REST({ version: "10" }).setToken(config.token);
  const route = guildId
    ? Routes.applicationGuildCommands(config.clientId, guildId)
    : Routes.applicationCommands(config.clientId);

  await rest.put(route, { body: [] });
}

export function formatDeployReport(result: DeployCommandsResult, guildId?: string | null): string {
  const target = guildId ? `guild ${guildId}` : "global scope";

  return [
    `${result.skipped ? "Skipped deployment for" : "Registered"} ${result.count} application command(s) for ${target}.`,
    `Hash: ${result.hash}`,
    `Commands: ${result.commandNames.join(", ")}`,
  ].join(" ");
}
