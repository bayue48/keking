import { Player, Track } from "discord-player";
import { DefaultExtractors } from "@discord-player/extractor";
import { YoutubeiExtractor } from "discord-player-youtubei";
import type { GuildMember, VoiceBasedChannel } from "discord.js";
import { Client } from "discord.js";

// Initialize discord-player
let player: Player | null = null;

export async function initializePlayer(client: Client): Promise<Player> {
  if (!player) {
    player = new Player(client as any);
    await player.extractors.loadMulti(DefaultExtractors);
    await player.extractors.register(YoutubeiExtractor, {
      useYoutubeDL: true,
    });
  }
  return player;
}

export class MusicPlayer {
  private activeChannel: VoiceBasedChannel | null = null;
  private discordPlayer: Player;
  private guildId: string;

  constructor(discordPlayer: Player, guildId: string) {
    this.discordPlayer = discordPlayer;
    this.guildId = guildId;
  }

  async joinChannel(member: GuildMember): Promise<boolean> {
    if (!member.voice.channel) return false;
    this.activeChannel = member.voice.channel;
    return true;
  }

  async play(urlOrQuery: string): Promise<string> {
    if (!this.activeChannel) return "Not connected to a voice channel.";

    try {
      const normalizedQuery = this.normalizeQuery(urlOrQuery);

      const result = await this.discordPlayer.play(this.activeChannel as any, normalizedQuery, {
        nodeOptions: {
          leaveOnEnd: true,
          leaveOnEndCooldown: 60_000,
          metadata: { guildId: this.guildId },
        },
      });

      return `Now playing: ${result.track.title} by ${result.track.author}`;
    } catch (error) {
      console.error("Error playing track:", error);
      return "Failed to play the track.";
    }
  }

  private normalizeQuery(input: string): string {
    const trimmed = input.trim();
    if (!trimmed.includes("open.spotify.com/") && !trimmed.includes("youtu")) {
      return trimmed;
    }

    // Drop tracking/search params (e.g. ?si=...) to improve extractor matching.
    const [baseUrl] = trimmed.split("?");
    return baseUrl ?? trimmed;
  }

  addToQueue(url: string): void {
    void this.play(url);
  }

  skip(): string {
    const queue = this.discordPlayer.nodes.get(this.guildId);
    if (queue?.node.skip()) {
      return "Skipped current track.";
    }
    return "No track is currently playing.";
  }

  stop(): string {
    const queue = this.discordPlayer.nodes.get(this.guildId);
    if (queue) {
      queue.delete();
    }
    this.activeChannel = null;
    return "Stopped playback and cleared queue.";
  }

  getQueue(): string[] {
    const queue = this.discordPlayer.nodes.get(this.guildId);
    if (!queue) return [];
    return queue.tracks.toArray().map((track: Track) => `${track.title} by ${track.author}`);
  }

  getCurrentTrack(): string | null {
    const queue = this.discordPlayer.nodes.get(this.guildId);
    if (!queue?.currentTrack) return null;
    return `${queue.currentTrack.title} by ${queue.currentTrack.author}`;
  }

  disconnect(): void {
    const queue = this.discordPlayer.nodes.get(this.guildId);
    if (queue) {
      queue.delete();
    }
    this.activeChannel = null;
  }
}

// Global player instances per guild
const players = new Map<string, MusicPlayer>();

export function getPlayer(guildId: string): MusicPlayer {
  if (!player) {
    throw new Error("Music player has not been initialized.");
  }

  if (!players.has(guildId)) {
    players.set(guildId, new MusicPlayer(player, guildId));
  }
  return players.get(guildId)!;
}
