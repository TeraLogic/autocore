import { ChannelType, PermissionFlagsBits } from 'discord.js';
import { ticketConfig, saveConfig } from '../config/ticketConfig.js';
import { getTranslation } from '../utils/translationHandler.js';

async function getOrCreateCategory(guild, categoryName) {
  let category = guild.channels.cache.find(
    (channel) =>
      channel.type === ChannelType.GuildCategory &&
      channel.name === categoryName
  );

  if (!category) {
    category = await guild.channels.create({
      name: categoryName,
      type: ChannelType.GuildCategory,
      permissionOverwrites: [
        {
          id: guild.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: guild.client.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.ManageChannels,
            PermissionFlagsBits.SendMessages,
          ],
        },
      ],
    });

    ticketConfig.TICKET_CATEGORY_ID = category.id;
    saveConfig();
  }

  return category;
}

async function getOrCreateChannel(guild, channelName, type, category) {
  let channel = guild.channels.cache.find(
    (ch) => ch.name === channelName && ch.type === type
  );

  if (!channel) {
    channel = await guild.channels.create({
      name: channelName,
      type: type,
      parent: category.id,
      permissionOverwrites: [
        {
          id: guild.id,
          deny: [PermissionFlagsBits.SendMessages],
        },
      ],
    });

    ticketConfig.TICKET_CHANNEL_ID = channel.id;
    saveConfig();
  } else if (channel.parentId !== category.id) {
    await channel.setParent(category.id, { lockPermissions: true });

    ticketConfig.TICKET_CHANNEL_ID = channel.id;
    saveConfig();
  }

  return channel;
}

export async function createOrFetchTicketMessage(guild) {
  if (!ticketConfig.TICKET_CHANNEL_ID) return;

  const channel = await guild.channels.fetch(ticketConfig.TICKET_CHANNEL_ID);
  if (!channel) return;

  const ticketText = getTranslation('ticket', 'message');
  let needsNewMessage = false;

  if (ticketConfig.TARGET_MESSAGE_ID) {
    try {
      const existingMessage = await channel.messages.fetch(
        ticketConfig.TARGET_MESSAGE_ID
      );

      if (existingMessage) {
        if (existingMessage.content !== ticketText) {
          console.log(
            `📝 Ticket-Nachricht aktualisieren, da sich der Text geändert hat.`
          );
          await existingMessage.edit(ticketText);
        }
        return;
      }
    } catch (error) {
      console.warn(
        `⚠️ Ticket-Nachricht mit ID ${ticketConfig.TARGET_MESSAGE_ID} existiert nicht mehr. Erstelle eine neue.`
      );
      needsNewMessage = true;
    }
  } else {
    needsNewMessage = true;
  }

  if (needsNewMessage) {
    const newMessage = await channel.send({ content: ticketText });
    await newMessage.react(ticketConfig.TICKET_EMOJI);

    ticketConfig.TARGET_MESSAGE_ID = newMessage.id;
    saveConfig();
    console.log(
      `✅ Neue Ticket-Nachricht erstellt & gespeichert: ${newMessage.id}`
    );
  }
}

export async function setupServer(guild) {
  if (!guild) return;

  const ticketCategory = await getOrCreateCategory(guild, '🎟️ Support Tickets');
  const ticketChannel = await getOrCreateChannel(
    guild,
    'ticket',
    ChannelType.GuildText,
    ticketCategory
  );

  ticketConfig.TICKET_CATEGORY_ID = ticketCategory.id;
  ticketConfig.TICKET_CHANNEL_ID = ticketChannel.id;
  saveConfig();

  await createOrFetchTicketMessage(guild);
}
