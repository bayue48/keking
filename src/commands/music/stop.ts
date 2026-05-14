import { createSimpleMusicCommand } from "./shared.js";

export const command = createSimpleMusicCommand({
  name: "stop",
  description: "Stop playback and clear the queue",
  execute: (player) => ({
    title: "🎵 Playback Stopped",
    description: player.stop(),
  }),
});
