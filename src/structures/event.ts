import type { ClientEvents } from "discord.js";

export type BotEvent = {
  name: keyof ClientEvents;
  once?: boolean;
  execute: (...args: unknown[]) => Promise<void> | void;
};
