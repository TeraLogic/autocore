import { ChannelType, PermissionFlagsBits } from 'discord.js';
import { setupConfig, reloadConfig } from '../config/setupConfig.js';
import * as db from '../db/database.js';
import { reloadTicketListeners } from '../db/database.js';

export async function setupReactionListener(client) {
  if (!client || typeof client.on !== 'function') return;

  reloadConfig();
  await reloadTicketListeners(client);

  client.on('messageReactionAdd', async (reaction, user) => {
    try {
      if (user.bot) return;
      if (reaction.partial) await reaction.fetch();
      if (reaction.message.partial) await reaction.message.fetch();

      const ticketConfig = setupConfig?.information?.channels?.ticketsupport;
      let ticketData = db.getTicketData(user.id);
      if (!ticketConfig || !ticketConfig.message?.ID) return;

      if (reaction.message.id === ticketConfig.message.ID) {
        await reaction.users.remove(user);
        // await handleExistingChannel(user, reaction);
        await handlerTicket(reaction, user);
        return;
      }

      if (reaction.message.id === ticketData?.ticket_message_id) {
        // await reaction.users.remove(user);
        await closeTicket(reaction.message.channel, user);
      }
    } catch (error) {
      console.error('Fehler bei der Verarbeitung der Reaktion:', error);
    }
  });

  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const userId = message.author.id;
    let ticketData = db.getTicketData(userId);
    if (!ticketData) return;

    const privilegedRoles = [
      setupConfig.role.supporter,
      setupConfig.role.moderator,
      setupConfig.role.administrator,
      setupConfig.role.developer,
    ];

    const userRoles = message.member.roles.cache.map((role) => role.id);

    if (userRoles.some((role) => privilegedRoles.includes(role))) {
      const lastProblemId = getLastProblemId(ticketData);

      if (ticketData[lastProblemId]?.status === 'offen') {
        db.updateTicket(userId, lastProblemId, { status: 'bearbeitet' });
      }
    }
  });
}

async function handleExistingChannel(user, reaction) {
  let ticketData = db.getTicketData(user.id);
  if (!ticketData) return;

  const lastProblemId = getLastProblemId(ticketData);

  if (ticketData[lastProblemId]?.status === 'offen') {
    if (
      ticketData[lastProblemId].warning &&
      ticketData[lastProblemId].warnung_nachricht_id
    ) {
      try {
        const existingChannel = reaction.message.guild.channels.cache.get(
          ticketData.channel_id
        );
        if (!existingChannel) return;
        const oldWarning = await existingChannel.messages.fetch(
          ticketData[lastProblemId].warnung_nachricht_id
        );
        if (oldWarning) await oldWarning.delete();
      } catch (error) {
        console.warn('Warnungsnachricht konnte nicht gelöscht werden:', error);
      }
    }
    const warningMessageId = await sendWarning(ticketData, user.id);
    db.updateTicket(user.id, lastProblemId, {
      warning: true,
      warnung_nachricht_id: warningMessageId,
    });
  } else {
    createNewProblem(user.id, reaction.message.channel, user);
  }

  await createChannel(user, reaction);
}

async function closeTicket(channel, user) {
  try {
    await channel.send(`🔒 Ticket wird geschlossen von ${user.username}.`);
    setTimeout(async () => {
      await channel.delete();
      db.deleteTicket(user.id);
    }, 5000);
  } catch (error) {
    console.error('Fehler beim Schließen des Tickets:', error);
  }
}

async function createChannel(user, reaction) {
  const guild = reaction.message.guild;
  if (!guild) return;

  const ticketCategoryId = setupConfig.information.category.ID;
  const supportRoleId = setupConfig.role.supporter;

  const ticketChannel = await guild.channels.create({
    name: `ticket-${user.username}`,
    type: ChannelType.GuildText,
    parent: ticketCategoryId,
    permissionOverwrites: [
      { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
      {
        id: user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
        ],
      },
      {
        id: supportRoleId,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
        ],
      },
    ],
  });

  const ticketMessage = await ticketChannel.send(
    `👋 Hallo ${user}, ein Support-Mitarbeiter wird sich bald melden!\n\n📩 **Reagiere mit ${setupConfig.information.channels.ticketsupport.REACTION}, um das Ticket zu schließen.**`
  );
  db.saveTicket(user.id, ticketChannel.id, ticketMessage.id);
  db.updateTicket(user.id, '1', {
    status: 'offen',
    warning: false,
    warnung_nachricht_id: '',
  });
  await ticketMessage.react(
    setupConfig.information.channels.ticketsupport.REACTION
  );
}

async function sendWarning(ticketData, userId) {
  try {
    if (!ticketData.channel_id) return;
    const channel = ticketData.channel_id;
    const sendMessage = await channel.send(
      `⚠️ **Der Support weiß bereits über dein Anliegen Bescheid. Bitte keine weiteren Tickets fordern.**`
    );
    await db.updateTicket(userId, { warnung_nachricht_id: sendMessage.id });
  } catch (err) {
    console.error(`Fehler beim Senden der Warnung:`, err);
  }
}

function getLastProblemId(ticketData) {
  if (
    !ticketData ||
    typeof ticketData !== 'object' ||
    Object.keys(ticketData).length === 0
  ) {
    console.warn(
      '⚠️ Warnung: `ticketData` ist ungültig oder leer.',
      ticketData
    );
    return null;
  }
  return (
    Object.keys(ticketData)
      .filter((k) => !isNaN(k))
      .map(Number)
      .sort((a, b) => b - a)[0]
      ?.toString() || null
  );
}

function createNewProblem(userId, channel, user) {
  let ticketData = db.getTicketData(userId);
  const newProblemId = (Object.keys(ticketData).length + 1).toString();
  db.updateTicket(userId, newProblemId, {
    status: 'offen',
    warning: false,
    warnung_nachricht_id: '',
  });
  channel.send(`📌 **${user.tag} hat ein neues Problem gemeldet.**`);
}

function handlerTicket(reaction, user) {
  let ticketData = db.getTicketData(user.id);
  if (!ticketData) ticketData = createChannel(user, reaction);

  const lastProblemId = getLastProblemId(ticketData);
  if (!lastProblemId || !ticketData[lastProblemId]) return;

  if (ticketData[lastProblemId].status === 'offen') {
    sendWarning(ticketData, user.id);
  }
}
