import type { Client } from "discord.js";
import type { BotEvent } from "../structures/event.js";
import { importNamedExportsFrom } from "../utils/load-files.js";

export async function loadEvents(client: Client): Promise<void> {
  const events = await importNamedExportsFrom<BotEvent>("events", "event");

  for (const event of events) {
    if (event.once) {
      client.once(event.name, (...args: unknown[]) => event.execute(...args));
      continue;
    }

    client.on(event.name, (...args: unknown[]) => event.execute(...args));
  }
}
