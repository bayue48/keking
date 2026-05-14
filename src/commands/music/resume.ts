import { createSimpleMusicCommand } from "./shared.js";

export const command = createSimpleMusicCommand({
  name: "resume",
  description: "Resume the paused music",
  execute: (player) => ({
    title: "🎵 Music Resumed",
    description: player.resume(),
  }),
});
