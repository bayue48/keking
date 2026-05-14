import { createSimpleMusicCommand } from "./shared.js";

export const command = createSimpleMusicCommand({
  name: "pause",
  description: "Pause the current music",
  execute: (player) => ({
    title: "🎵 Music Paused",
    description: player.pause(),
  }),
});
