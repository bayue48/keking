import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} from "discord.js";
import type { ChatInputCommandInteraction } from "discord.js";
import type { SlashCommand } from "../../structures/command.js";
import type { BotClient } from "../../types/client.js";

interface VibePlaylist {
  mood: string;
  emoji: string;
  songs: string[];
  color: number;
}

const VIBE_PLAYLISTS: Record<string, VibePlaylist> = {
  chill: {
    mood: "Chill Vibes",
    emoji: "🎧",
    color: 0x6495ed,
    songs: [
      "Sunset Lover - Petit Biscuit",
      "Levitating - Dua Lipa",
      "Good as Hell - Lizzo",
      "Blinding Lights - The Weeknd",
      "heat waves - Glass Animals",
      "Electric Feel - MGMT",
      "Take On Me - a-ha",
      "Passionfruit - Drake",
    ],
  },
  energetic: {
    mood: "Pure Energy",
    emoji: "⚡",
    color: 0xff6347,
    songs: [
      "Uptown Funk - Mark Ronson ft. Bruno Mars",
      "Don't You Worry Child - Swedish House Mafia",
      "Titanium - David Guetta ft. Sia",
      "Animals - Martin Garrix",
      "Wake Me Up - Avicii",
      "Levels - Avicii",
      "Turn Down For What - DJ Snake, Lil Jon",
      "Mr. Brightside - The Killers",
    ],
  },
  focus: {
    mood: "Deep Focus",
    emoji: "🧠",
    color: 0x9370db,
    songs: [
      "Weightless - Marconi Union",
      "Piano Sonata No. 8 - Beethoven",
      "Ambient Sleep - Brian Eno",
      "Soft Focus - Ólafur Arnalds",
      "Arrival of the Birds - The Cinematic Orchestra",
      "Experience - Ludovico Einaudi",
      "Gymnopédie No. 1 - Erik Satie",
      "You and I - Bon Iver",
    ],
  },
  party: {
    mood: "Party Mode 🎉",
    emoji: "🎉",
    color: 0xffd700,
    songs: [
      "Yeah! - Usher ft. Lil Jon",
      "Shut Up and Dance - Walk the Moon",
      "September - Earth Wind & Fire",
      "Disco Inferno - The Trammps",
      "I Gotta Feeling - Black Eyed Peas",
      "Can't Stop the Feeling - Justin Timberlake",
      "Blister in the Sun - Violent Femmes",
      "Dancing Queen - ABBA",
    ],
  },
  sad: {
    mood: "Emotional Journey",
    emoji: "🌧️",
    color: 0x4169e1,
    songs: [
      "Someone Like You - Adele",
      "The Night We Met - Lord Huron",
      "Skinny Love - Bon Iver",
      "Yesterday - The Beatles",
      "Hurt - Nine Inch Nails",
      "Black - Pearl Jam",
      "Hallelujah - Leonard Cohen",
      "Tears in Heaven - Eric Clapton",
    ],
  },
  gaming: {
    mood: "Gaming Soundtrack",
    emoji: "🎮",
    color: 0x00ff00,
    songs: [
      "C418 - Sweden",
      "Mineceaft Theme",
      "Dearly Beloved - Kingdom Hearts",
      "Zelda Theme - The Legend of Zelda",
      "Megalovania - Undertale",
      "Gusty Garden Galaxy - Super Mario Galaxy",
      "Still Alive - Portal",
      "Halo Main Theme - Halo",
    ],
  },
};

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("vibe-check")
    .setDescription("Get song recommendations based on your current mood! 🎵")
    .addStringOption((option) =>
      option
        .setName("mood")
        .setDescription("Pick your current vibe")
        .setRequired(false)
        .addChoices(
          { name: "Chill Vibes 🎧", value: "chill" },
          { name: "Pure Energy ⚡", value: "energetic" },
          { name: "Deep Focus 🧠", value: "focus" },
          { name: "Party Mode 🎉", value: "party" },
          { name: "Emotional Journey 🌧️", value: "sad" },
          { name: "Gaming Soundtrack 🎮", value: "gaming" }
        )
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const client = interaction.client as BotClient;

    // Check if user is in a voice channel
    const member = interaction.member as any;
    if (!member.voice.channel) {
      await interaction.reply({
        content: "❌ You need to be in a voice channel to use this command!",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const voiceChannel = member.voice.channel;

    // Get mood (random if not specified)
    const moodInput =
      interaction.options.getString("mood") ||
      Object.keys(VIBE_PLAYLISTS)[
        Math.floor(Math.random() * Object.keys(VIBE_PLAYLISTS).length)
      ];

    const mood = moodInput as keyof typeof VIBE_PLAYLISTS;
    const playlist = VIBE_PLAYLISTS[mood];

    if (!playlist) {
      await interaction.reply({
        content: "❌ Invalid mood! Available moods: chill, energetic, focus, party, sad, gaming",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Pick a random song from the playlist
    const randomSong =
      playlist.songs[Math.floor(Math.random() * playlist.songs.length)];

    const embed = new EmbedBuilder()
      .setColor(playlist.color)
      .setTitle(`${playlist.emoji} ${playlist.mood}`)
      .setDescription(`Now checking your vibe...\n\n🎵 **${randomSong}**`)
      .setFooter({
        text: "Click ▶️ to play this song, or 🔄 for another suggestion!",
      });

    const playButton = new ButtonBuilder()
      .setCustomId(`vibe_play_${randomSong}`)
      .setLabel("Play Song")
      .setStyle(ButtonStyle.Success)
      .setEmoji("▶️");

    const rerollButton = new ButtonBuilder()
      .setCustomId(`vibe_reroll_${mood}`)
      .setLabel("Another Vibe")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("🔄");

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      playButton,
      rerollButton
    );

    const message = await interaction.reply({
      embeds: [embed],
      components: [row],
      fetchReply: true,
    });

    // Button interaction collector
    const collector = message.createMessageComponentCollector({
      time: 30_000,
    });

    collector.on("collect", async (buttonInteraction) => {
      if (buttonInteraction.user.id !== interaction.user.id) {
        await buttonInteraction.reply({
          content: "❌ You can't interact with someone else's vibe check!",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      if (buttonInteraction.customId.startsWith("vibe_play_")) {
        const songName = buttonInteraction.customId.replace("vibe_play_", "");
        await buttonInteraction.deferUpdate();

        try {
          const queue = client.musicPlayer.nodes.create(voiceChannel.guild);

          if (!queue.connection) {
            await queue.connect(voiceChannel);
          }

          const track = await client.musicPlayer.search(songName, {
            requestedBy: interaction.user as any,
          });

          if (!track.tracks.length) {
            await interaction.followUp({
              content: `❌ Could not find "${songName}" on YouTube`,
              flags: MessageFlags.Ephemeral,
            });
            return;
          }

          const firstTrack = track.tracks[0];
          if (!firstTrack) {
            await interaction.followUp({
              content: "❌ Could not find a valid track",
              flags: MessageFlags.Ephemeral,
            });
            return;
          }

          queue.play(firstTrack);

          const playEmbed = new EmbedBuilder()
            .setColor(playlist.color)
            .setTitle(`✅ Added to Queue`)
            .setDescription(
              `🎵 **${firstTrack.title}** by **${firstTrack.author}**`
            )
            .setThumbnail(firstTrack.thumbnail);

          await interaction.followUp({ embeds: [playEmbed] });
        } catch (error) {
          console.error("Error playing song:", error);
          await interaction.followUp({
            content: "❌ Failed to play the song. Try another!",
            flags: MessageFlags.Ephemeral,
          });
        }
      } else if (buttonInteraction.customId.startsWith("vibe_reroll_")) {
        const moodForReroll = buttonInteraction.customId.replace(
          "vibe_reroll_",
          ""
        ) as keyof typeof VIBE_PLAYLISTS;
        const playlistForReroll = VIBE_PLAYLISTS[moodForReroll];
        
        if (!playlistForReroll) {
          await buttonInteraction.reply({
            content: "❌ Invalid mood playlist",
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        const newSong =
          playlistForReroll.songs[
            Math.floor(Math.random() * playlistForReroll.songs.length)
          ];

        const newEmbed = new EmbedBuilder()
          .setColor(playlistForReroll.color)
          .setTitle(`${playlistForReroll.emoji} ${playlistForReroll.mood}`)
          .setDescription(`Shuffling your vibe...\n\n🎵 **${newSong}**`)
          .setFooter({
            text: "Click ▶️ to play this song, or 🔄 for another suggestion!",
          });

        const newPlayButton = new ButtonBuilder()
          .setCustomId(`vibe_play_${newSong}`)
          .setLabel("Play Song")
          .setStyle(ButtonStyle.Success)
          .setEmoji("▶️");

        const newRerollButton = new ButtonBuilder()
          .setCustomId(`vibe_reroll_${moodForReroll}`)
          .setLabel("Another Vibe")
          .setStyle(ButtonStyle.Secondary)
          .setEmoji("🔄");

        const newRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
          newPlayButton,
          newRerollButton
        );

        await buttonInteraction.update({
          embeds: [newEmbed],
          components: [newRow],
        });
      }
    });

    collector.on("end", async () => {
      const disabledRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        playButton.setDisabled(true),
        rerollButton.setDisabled(true)
      );

      await message.edit({ components: [disabledRow] }).catch(() => {});
    });
  },
};
