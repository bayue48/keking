import type { Client } from "discord.js";

import type { BotEvent } from "../structures/event.js";
import { importModulesFrom } from "../utils/load-files.js";

export async function loadEvents(client: Client): Promise<void> {
  const modules = await importModulesFrom("events");

  for (const module of modules) {
    if (!module || typeof module !== "object" || !("event" in module)) {
      continue;
    }

    const event = module.event as BotEvent | undefined;

    if (!event) {
      continue;
    }

    if (event.once) {
      client.once(event.name, (...args: unknown[]) => event.execute(...args));
      continue;
    }

    client.on(event.name, (...args: unknown[]) => event.execute(...args));
  }
}
