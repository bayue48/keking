import { Events, MessageFlags, type Message } from "discord.js";

import type { BotEvent } from "../structures/event.js";
import { extractSocialMirrorLinks } from "../utils/social-preview.js";

const mentionReplies = [
  "iya beb",
  "iya sayang",
  "apa beb",
  "apa sayang",
];

async function handleMentionReply(message: Message): Promise<boolean> {
  if (!message.inGuild() || message.author.bot) {
    return false;
  }

  const botId = message.client.user?.id;
  const authorId = message.author.id;

  if (!botId || authorId !== "330320305606230016") {
    return false;
  }

  if (!message.mentions.has(botId, { ignoreEveryone: true })) {
    return false;
  }

  const index = Math.floor(Math.random() * mentionReplies.length);
  const reply = mentionReplies[index] ?? "iya beb";

  await message.reply({
    content: reply,
    allowedMentions: {
      repliedUser: false,
    },
  });

  return true;
}

async function previewSocialLinks(message: Message): Promise<void> {
  if (!message.inGuild() || message.author.bot) {
    return;
  }

  const links = extractSocialMirrorLinks(message.content);

  if (links.length === 0) {
    return;
  }

  const previewContent = links.join("\n").slice(0, 1900);

  await message.reply({
    content: previewContent,
    allowedMentions: {
      repliedUser: false,
    },
    flags: MessageFlags.SuppressNotifications,
  });

  await message.suppressEmbeds(true).catch(() => null);
}

export const event: BotEvent = {
  name: Events.MessageCreate,
  execute(message) {
    const msg = message as Message;

    return handleMentionReply(msg)
      .then((handled) => {
        if (!handled) {
          return previewSocialLinks(msg);
        }
      });
  },
};
