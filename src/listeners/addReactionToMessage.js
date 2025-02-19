import { ticketConfig } from '../config/ticketConfig.js';

export async function addReactionToMessage(client) {
  if (!ticketConfig.TARGET_MESSAGE_ID) return;

  const channel = await client.channels.fetch(ticketConfig.TICKET_CHANNEL_ID);
  if (!channel) return;

  const message = await channel.messages.fetch(ticketConfig.TARGET_MESSAGE_ID);
  if (!message) return;

  const existingReactions = message.reactions.cache.has(
    ticketConfig.TICKET_EMOJI
  );
  if (!existingReactions) {
    await message.react(ticketConfig.TICKET_EMOJI);
  }
}
