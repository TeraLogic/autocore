import { ChannelType, PermissionFlagsBits } from 'discord.js';
import { setupConfig, reloadConfig } from '../config/setupConfig.js';
import * as db from '../db/database.js';

export async function setupReactionListener(client) {
  if (!client || typeof client.on !== 'function') {
    console.error('Fehler: `client` ist nicht korrekt initialisiert.');
    return;
  }

  reloadConfig();

  client.on('messageReactionAdd', async (reaction, user) => {
    try {
      if (user.bot) return;

      if (reaction.partial) await reaction.fetch();
      if (reaction.message.partial) await reaction.message.fetch();

      const ticketConfig = setupConfig?.information?.channels?.ticketsupport;
      let ticketData = db.getTicketData(user.id);
      if (!ticketConfig || !ticketConfig.message?.ID) {
        console.warn('Warnung: Ticket-Konfiguration nicht gefunden.');
        return;
      }

      if (reaction.message.id === ticketConfig.message.ID) {
        await reaction.users.remove(user);
        // await handleExistingChannel(user, reaction);
        await handlerTicket(reaction, user);
        return;
      }

      if (reaction.message.id === ticketData.ticket_message_id) {
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

      if (ticketData[lastProblemId].status === 'offen') {
        db.updateTicket(userId, lastProblemId, {
          status: 'bearbeitet',
        });
        console.log(
          `Problem ${lastProblemId} in Ticket ${message.channel.id} wurde auf 'bearbeitet' gesetzt.`
        );
      }
    }
  });
}

async function handleExistingChannel(user, reaction) {
  let ticketData = db.getTicketData(user.id);
  if (ticketData) {
    console.log(
      `Benutzer ${user.username} hat bereits ein Ticket: ${ticketData.channel_id}`
    );
    // const existingChannel = reaction.message.guild.channels.cache.get(ticketData.channel_id);
    // if (!existingChannel) return;

    const lastProblemId = getLastProblemId(ticketData);

    if (ticketData[lastProblemId].status === 'offen') {
      if (
        ticketData[lastProblemId].warning &&
        ticketData[lastProblemId].warnung_nachricht_id
      ) {
        try {
          const oldWarning = await existingChannel.messages.fetch(
            ticketData[lastProblemId].warnung_nachricht_id
          );
          if (oldWarning) await oldWarning.delete();
        } catch (error) {
          console.warn(
            'Warnungsnachricht konnte nicht gelöscht werden:',
            error
          );
        }
      }
      const warningMessageId = await sendWarning(existingChannel);
      db.updateTicket(user.id, lastProblemId, {
        warning: true,
        warnung_nachricht_id: warningMessageId,
      });
    } else {
      createNewProblem(user.id, existingChannel, user);
      console.log(`Neues Problem für ${user.username} erstellt.`);
    }
    return;
  }

  await createChannel(user, reaction);
}

async function closeTicket(channel, user) {
  try {
    await channel.send(`🔒 Ticket wird geschlossen von ${user.username}.`);
    setTimeout(async () => {
      await channel.delete();
      db.deleteTicket(user.id);
      console.log(`🚫 Ticket-Channel ${channel.name} wurde geschlossen.`);
    }, 5000);
  } catch (error) {
    console.error('Fehler beim Schließen des Tickets:', error);
  }
}

async function createChannel(user, reaction) {
  console.log(`Erstelle neuen Ticket-Channel für ${user.username}`);

  const guild = reaction.message.guild;
  if (!guild) return;

  const ticketCategoryId = setupConfig.information.category.ID;
  const supportRoleId = setupConfig.role.supporter;

  const ticketChannel = await guild.channels.create({
    name: `ticket-${user.username}`,
    type: ChannelType.GuildText,
    parent: ticketCategoryId,
    permissionOverwrites: [
      {
        id: guild.id,
        deny: [PermissionFlagsBits.ViewChannel],
      },
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
    if (!ticketData.channel_id) {
      console.error(
        `❌ Fehler: Kein gültiger Channel für das Ticket von User ${userId}`
      );
      return;
    }
    const channel = ticketData.channel_id;
    const sendMessage = await channel.send(
      `⚠️ **Der Support weiß bereits über dein Anliegen Bescheid. Bitte keine weiteren Tickets fordern.**`
    );
    await db.updateTicket(userId, { warnung_nachricht_id: sendMessage.id });
    console.log(
      `✅ Warnung gesendet & Nachricht-ID gespeichert: ${sendMessage.id}`
    );
  } catch (err) {
    console.error(`❌ Fehler beim Senden der Warnung:`, err);
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

  const ids = Object.keys(ticketData)
    .filter((k) => !isNaN(k))
    .map(Number)
    .sort((a, b) => b - a);

  return ids.length > 0 ? ids[0].toString() : null;
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

  // 🛑 Falls kein Ticket existiert, erstelle eines und speichere das neue `ticketData`
  if (!ticketData) {
    console.warn(
      `⚠️ Kein Ticket für User ${user.username} gefunden, erstelle ein neues.`
    );
    ticketData = createChannel(user, reaction);
  }

  const lastProblemId = getLastProblemId(ticketData);

  // 🛑 Sicherstellen, dass `lastProblemId` existiert und gültig ist
  if (!lastProblemId || !ticketData[lastProblemId]) {
    console.warn(
      `⚠️ Kein gültiges Problem für User ${user.username} gefunden.`
    );
    console.log('Aktuelles ticketData:', ticketData);
    return;
  }

  // ✅ Status überprüfen, bevor eine Warnung gesendet wird
  if (ticketData[lastProblemId].status === 'offen') {
    sendWarning(ticketData, user.id);
  }
}
