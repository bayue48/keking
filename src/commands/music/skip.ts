import { createSimpleMusicCommand } from "./shared.js";

export const command = createSimpleMusicCommand({
  name: "skip",
  description: "Skip the current track",
  execute: (player) => ({
    title: "🎵 Track Skipped",
    description: player.skip(),
  }),
});
