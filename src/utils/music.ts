import { Player, Track, QueueRepeatMode, QueryType } from "discord-player";
import { SpotifyExtractor, DefaultExtractors } from "@discord-player/extractor";
import { YoutubeExtractor } from "discord-player-youtube";
import type { GuildMember, VoiceBasedChannel } from "discord.js";
import { Client } from "discord.js";
import { TTSExtractor } from "discord-player-tts";
import { registerMusicEvents } from "./music-events.js";
import { Client as GeniusClient } from "genius-lyrics";
import { config } from "../config/config.js";
import { assertBotCanJoinVoice } from "./permissions.js";

const LEAVE_ON_END_COOLDOWN_MS = 300_000;
const DEFAULT_TTS_LANGUAGE = "en";

type QueueMetadata = {
  guildId: string;
  textChannelId: string | null;
};

export type NowPlayingDetails = {
  track: string;
  duration: string;
  queueSize: number;
  progressBar: string;
  thumbnail: string | null;
  url: string | null;
};

let player: Player | null = null;

export async function initializePlayer(client: Client): Promise<Player> {
  if (!player) {
    player = new Player(client as any);
    await player.extractors.loadMulti(DefaultExtractors);
    await player.extractors.register(YoutubeExtractor, {
      cookie: config.music.youtubeCookies,
    });
    await player.extractors.register(SpotifyExtractor, {
      clientId: config.music.spotifyClientId,
      clientSecret: config.music.spotifyClientSecret,
    });
    await player.extractors.register(TTSExtractor, {
      language: DEFAULT_TTS_LANGUAGE,
      slow: false,
    });

    await registerMusicEvents(player, client);
  }
  return player;
}

export class MusicPlayer {
  private activeChannel: VoiceBasedChannel | null = null;
  private textChannelId: string | null = null;
  private discordPlayer: Player;
  private guildId: string;

  constructor(discordPlayer: Player, guildId: string) {
    this.discordPlayer = discordPlayer;
    this.guildId = guildId;
  }

  setTextChannel(channelId: string): void {
    this.textChannelId = channelId;
  }

  async joinChannel(member: GuildMember): Promise<boolean> {
    if (!member.voice.channel) return false;
    assertBotCanJoinVoice(member);
    this.activeChannel = member.voice.channel;
    return true;
  }

  async play(urlOrQuery: string): Promise<string> {
    const activeChannel = this.activeChannel;
    if (!activeChannel) return "Not connected to a voice channel.";

    try {
      const normalizedQuery = this.normalizeQuery(urlOrQuery);
      const isDirectLink = this.isDirectLink(normalizedQuery);
      const result = await this.discordPlayer.play(activeChannel as any, normalizedQuery, {
        searchEngine: isDirectLink ? QueryType.AUTO : QueryType.YOUTUBE_SEARCH,
        nodeOptions: this.createNodeOptions(),
      });
      this.logVoiceConnectionState("play");

      if (result.searchResult.playlist) {
        return `${result.searchResult.playlist.title} with ${result.searchResult.tracks.length} tracks to the queue.`;
      }

      return `${result.track.title} by ${result.track.author}`;
    } catch (error) {
      console.error("Error playing track:", error);
      return "Failed to play the track. If this is a YouTube link, try using the full watch URL or a song title.";
    }
  }

  private normalizeQuery(input: string): string {
    const trimmed = input.trim();

    if (trimmed.includes("youtu")) {
      try {
        const url = new URL(trimmed);
        const videoId = url.searchParams.get("v");
        if (videoId) {
          return `https://www.youtube.com/watch?v=${videoId}`;
        }
      } catch {
        return trimmed;
      }
    }

    try {
      const url = new URL(trimmed);
      if (url.hostname.toLowerCase() === "open.spotify.com") {
        return trimmed;
      }
    } catch {
      // Not a URL; fall through and return as-is
    }

    return trimmed;
  }

  addToQueue(url: string): void {
    void this.play(url);
  }

  private isDirectLink(input: string): boolean {
    try {
      const url = new URL(input);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }

  skip(): string {
    const queue = this.getQueueNode();
    if (queue?.node.skip()) {
      return "Skipped current track.";
    }
    return "No track is currently playing.";
  }

  pause(): string {
    const queue = this.getQueueNode();
    if (!queue) return "No music is currently playing.";

    if (queue.node.pause()) {
      return "Music paused.";
    }
    return "Music is already paused.";
  }

  resume(): string {
    const queue = this.getQueueNode();
    if (!queue) return "No music is currently playing.";

    if (queue.node.resume()) {
      return "Music resumed.";
    }
    return "Music is already playing.";
  }

  togglePause(): string {
    const queue = this.getQueueNode();
    if (!queue) return "No music is currently playing.";

    return queue.node.isPaused() ? this.resume() : this.pause();
  }

  stop(): string {
    const queue = this.getQueueNode();
    if (queue) {
      queue.delete();
    }
    this.activeChannel = null;
    return "Stopped playback and cleared queue.";
  }

  getQueue(): string[] {
    const queue = this.getQueueNode();
    if (!queue) return [];
    return queue.tracks.toArray().map((track: Track) => `${track.title} by ${track.author}`);
  }

  getCurrentTrack(): string | null {
    const queue = this.getQueueNode();
    if (!queue?.currentTrack) return null;
    return `${queue.currentTrack.title} by ${queue.currentTrack.author}`;
  }

  hasCurrentTrack(): boolean {
    return this.getQueueNode()?.currentTrack != null;
  }

  getNowPlayingDetails(): NowPlayingDetails | null {
    const queue = this.getQueueNode();
    if (!queue?.currentTrack) return null;

    const durationMs = queue.currentTrack.durationMS || 0;
    const durationMins = Math.floor(durationMs / 60000);
    const durationSecs = Math.floor((durationMs % 60000) / 1000);
    const progressBar = queue.node.createProgressBar({
      length: 30,
      leftChar: "=",
      indicator: "o",
      rightChar: "-",
      queue: false,
    }) ?? "`0:00 |o-----------------| 0:00`";

    return {
      track: `${queue.currentTrack.title} by ${queue.currentTrack.author}`,
      duration: `${durationMins}:${durationSecs.toString().padStart(2, '0')}`,
      queueSize: queue.tracks.size,
      progressBar,
      thumbnail: queue.currentTrack.thumbnail ?? null,
      url: queue.currentTrack.url ?? null,
    };
  }

  removeTrack(index: number): string {
    const queue = this.getQueueNode();
    if (!queue) return "No queue available.";

    const tracks = queue.tracks.toArray();
    if (index < 0 || index >= tracks.length) {
      return `Invalid track index. Queue has ${tracks.length} tracks.`;
    }

    const removed = tracks[index];
    if (removed) {
      queue.tracks.remove((track: Track) => track === removed);
      return `Removed: ${removed.title || 'Unknown'} by ${removed.author || 'Unknown'}`;
    }
    return "Failed to remove track.";
  }

  clearQueue(): string {
    const queue = this.getQueueNode();
    if (!queue) return "No queue available.";

    const size = queue.tracks.size;
    queue.tracks.clear();
    return `Cleared ${size} tracks from the queue.`;
  }

  shuffle(): string {
    const queue = this.getQueueNode();
    if (!queue) return "No queue available.";

    if (queue.tracks.size < 2) {
      return "Need at least 2 tracks in queue to shuffle.";
    }

    queue.tracks.shuffle();
    return "Queue shuffled!";
  }

  setLoopMode(mode: 'off' | 'track' | 'queue' | 'autoplay'): string {
    const queue = this.getQueueNode();
    if (!queue) return "No queue available.";

    switch (mode) {
      case 'off':
        queue.setRepeatMode(QueueRepeatMode.OFF);
        return "Loop mode disabled.";
      case 'track':
        queue.setRepeatMode(QueueRepeatMode.TRACK);
        return "Now looping current track.";
      case 'queue':
        queue.setRepeatMode(QueueRepeatMode.QUEUE);
        return "Now looping entire queue.";
      default:
        return "Invalid loop mode.";
    }
  }

  getLoopMode(): string {
    const queue = this.getQueueNode();
    if (!queue) return "No queue available.";

    const mode = queue.repeatMode;
    switch (mode) {
      case QueueRepeatMode.OFF:
        return 'off';
      case QueueRepeatMode.TRACK:
        return 'track';
      case QueueRepeatMode.QUEUE:
        return 'queue';
      case QueueRepeatMode.AUTOPLAY:
        return 'autoplay';
      default:
        return 'unknown';
    }
  }

  async getLyrics(trackTitle?: string, artist?: string): Promise<{ lyrics: string; title: string; artist: string } | null> {
    try {
      let query = '';
      if (trackTitle && artist) {
        query = `${trackTitle} ${artist}`;
      } else {
        const currentTrack = this.getCurrentTrack();
        if (!currentTrack) return null;
        query = currentTrack;
      }

      const client = new GeniusClient();
      const songs = await client.songs.search(query);
      if (songs.length === 0 || !songs[0]) return null;

      const lyrics = await songs[0].lyrics();
      return {
        lyrics: lyrics || 'No lyrics found.',
        title: songs[0].title || 'Unknown',
        artist: songs[0].artist?.name || 'Unknown',
      };
    } catch (error) {
      console.error("Lyrics error:", error);
      return null;
    }
  }

  async search(query: string): Promise<Track[]> {
    try {
      const results = await this.discordPlayer.search(query, {
        searchEngine: QueryType.YOUTUBE_SEARCH,
      });
      return results.tracks.slice(0, 5);
    } catch (error) {
      console.error("Search error:", error);
      return [];
    }
  }

  async playTrack(track: Track): Promise<string> {
    const activeChannel = this.activeChannel;
    if (!activeChannel) return "Not connected to a voice channel.";

    try {
      const queue = this.ensureQueue();
      await this.connectQueueIfNeeded(queue, activeChannel, "playTrack.connect");

      queue.addTrack(track);

      if (!queue.isPlaying()) {
        await queue.node.play();
        this.logVoiceConnectionState("playTrack.start");
      }

      return `${track.title} by ${track.author}`;
    } catch (error) {
      console.error("Error playing track:", error);
      return "Failed to play the track.";
    }
  }

  async playTTS(text: string): Promise<string> {
    const activeChannel = this.activeChannel;
    if (!activeChannel) return "Not connected to a voice channel.";
    if (!text || text.trim().length === 0) return "Please provide text to convert to speech.";

    try {
      await this.discordPlayer.play(activeChannel as any, `tts:${text}`, {
        nodeOptions: this.createNodeOptions(),
      });
      this.logVoiceConnectionState("playTTS");

      return `Playing TTS: ${text}`;
    } catch (error) {
      console.error("Error playing TTS:", error);
      return "Failed to play TTS. Please check the text format.";
    }
  }

  disconnect(): void {
    const queue = this.getQueueNode();
    if (queue) {
      queue.delete();
    }
    this.activeChannel = null;
  }

  toggleFilter(filterName: string): string {
    const queue = this.getQueueNode();
    if (!queue) return "No queue available.";

    const filters = queue.filters.ffmpeg;
    if (!filters) return "Filters are not ready.";

    try {
      filters.toggle(filterName as any);
      return `Toggled filter: ${filterName}`;
    } catch (e) {
      return `Failed to toggle filter: ${filterName}`;
    }
  }

  getFilters(): string[] {
    const queue = this.getQueueNode();
    if (!queue) return [];

    const filters = queue.filters.ffmpeg;
    if (!filters) return [];

    return filters.getFiltersEnabled();
  }

  private logVoiceConnectionState(context: string): void {
    const queue = this.getQueueNode();
    const status = queue?.connection?.state?.status ?? "no-connection";
    const channelId = this.activeChannel?.id ?? "none";
    console.log(`[voice:${context}] guild=${this.guildId} channel=${channelId} status=${status}`);
  }

  private createNodeOptions() {
    return {
      leaveOnEnd: true,
      leaveOnEndCooldown: LEAVE_ON_END_COOLDOWN_MS,
      metadata: this.createQueueMetadata(),
    };
  }

  private createQueueMetadata(): QueueMetadata {
    return {
      guildId: this.guildId,
      textChannelId: this.textChannelId,
    };
  }

  private ensureQueue() {
    const existingQueue = this.getQueueNode();
    if (existingQueue) {
      existingQueue.metadata = {
        ...existingQueue.metadata,
        ...this.createQueueMetadata(),
      };
      return existingQueue;
    }

    return this.discordPlayer.nodes.create(this.guildId, this.createNodeOptions());
  }

  private async connectQueueIfNeeded(queue: NonNullable<ReturnType<MusicPlayer["getQueueNode"]>>, channel: VoiceBasedChannel, context: string): Promise<void> {
    if (queue.connection) {
      return;
    }

    await queue.connect(channel as any);
    this.logVoiceConnectionState(context);
  }

  private getQueueNode() {
    return this.discordPlayer.nodes.get(this.guildId);
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
