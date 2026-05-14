import { MessageFlags } from "discord.js";
import { createSimpleMusicCommand } from "./shared.js";

export const command = createSimpleMusicCommand({
  name: "shuffle",
  description: "Shuffle the current music queue",
  execute: (player) => {
    const result = player.shuffle();

    if (result.includes("Need at least 2 tracks")) {
      return {
        title: "Cannot Shuffle",
        description: result,
        error: true,
        flags: MessageFlags.Ephemeral,
      };
    }

    return {
      title: "🎵 Queue Shuffled",
      description: result,
    };
  },
});
