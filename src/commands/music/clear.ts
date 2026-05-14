import { createSimpleMusicCommand } from "./shared.js";

export const command = createSimpleMusicCommand({
  name: "clear",
  description: "Clear all tracks from the queue",
  execute: (player) => ({
    title: "🎵 Queue Cleared",
    description: player.clearQueue(),
  }),
});
