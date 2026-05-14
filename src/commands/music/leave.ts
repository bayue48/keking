import { createSimpleMusicCommand } from "./shared.js";

export const command = createSimpleMusicCommand({
  name: "leave",
  description: "Leave the voice channel",
  execute: (player) => {
    player.disconnect();
    return {
      title: "🎵 Left Voice Channel",
      description: "The bot has left the voice channel.",
    };
  },
});
