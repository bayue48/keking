import "dotenv/config";

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value.trim();
}

function getOptionalEnv(name: string): string | null {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

const developmentGuildId = getOptionalEnv("DISCORD_GUILD_ID");
const databaseUrl = getOptionalEnv("DATABASE_URL");

export const config = {
  discord: {
    token: getRequiredEnv("DISCORD_TOKEN"),
    clientId: getRequiredEnv("DISCORD_CLIENT_ID"),
    developmentGuildId,
  },
  database: {
    url: databaseUrl,
    enabled: databaseUrl !== null,
  },
  music: {
    youtubeCookies: getOptionalEnv("YOUTUBE_COOKIES") ?? "",
    spotifyClientId: getOptionalEnv("SPOTIFY_CLIENT_ID") ?? "",
    spotifyClientSecret: getOptionalEnv("SPOTIFY_CLIENT_SECRET") ?? "",
  },
  startup: {
    deployGlobally: developmentGuildId === null,
    deployGuildId: developmentGuildId,
    enableDebugLogging: developmentGuildId !== null,
  },
} as const;
