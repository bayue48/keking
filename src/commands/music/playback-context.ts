import { MessageFlags, type ChatInputCommandInteraction, type GuildMember } from "discord.js";
import { createErrorEmbed } from "../../utils/embeds.js";
import { getPlayer, type MusicPlayer } from "../../utils/music.js";

type PreparedPlaybackContext = {
  member: GuildMember;
  player: MusicPlayer;
};

export async function preparePlaybackContext(
  interaction: ChatInputCommandInteraction,
): Promise<PreparedPlaybackContext | null> {
  const guildId = interaction.guildId;
  if (!guildId) {
    await interaction.reply({
      embeds: [createErrorEmbed("Guild Only", "This command can only be used in a server.")],
      flags: MessageFlags.Ephemeral,
    });
    return null;
  }

  const member = await interaction.guild?.members.fetch(interaction.user.id);
  if (!member?.voice.channel) {
    await interaction.reply({
      embeds: [createErrorEmbed("Voice Channel Required", "You must be in a voice channel to use this command.")],
      flags: MessageFlags.Ephemeral,
    });
    return null;
  }

  const player = getPlayer(guildId);
  player.setTextChannel(interaction.channelId);

  const joined = await player.joinChannel(member);
  if (!joined) {
    await interaction.reply({
      embeds: [createErrorEmbed("Failed to Join", "Could not join the voice channel.")],
      flags: MessageFlags.Ephemeral,
    });
    return null;
  }

  return {
    member,
    player,
  };
}
