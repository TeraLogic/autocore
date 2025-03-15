import { ChannelType, PermissionFlagsBits } from 'discord.js';
import {
  setupConfig,
  saveConfig,
  reloadConfig,
} from '../config/setupConfig.js';
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

        const ticketConfig = setupConfig.information.channels.ticketsupport;

        // Falls auf die Ticket-Erstellungsnachricht reagiert wird
        if (reaction.message.id === ticketConfig.message.ID) {
            await reaction.users.remove(user);
            await handleExistingChannel(user, reaction);
            return;
        }

        let ticketData = db.getTicketData(reaction.message.channel.id);
        if (ticketData && reaction.message.id === ticketData["1"].ticket_message_id) {
            console.log(`Ticket ${reaction.message.channel.id} wird geschlossen.`);
            await closeTicket(reaction.message.channel, reaction.message.guild, user);
        }
    } catch (error) {
        console.error('Fehler bei der Verarbeitung der Reaktion:', error);
    }
});

  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    let ticketData = db.getTicketData(message.channel.id);
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
        db.updateTicket(message.channel.id, lastProblemId, {
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
  console.log(`Prüfe auf existierendes Ticket für ${user.username}`);

  let ticketData = db.getTicketData(user.id);
  if (ticketData) {
    console.log(
      `Benutzer ${user.username} hat bereits ein Ticket: ${ticketData.channel_id}`
    );
    const existingChannel = reaction.message.guild.channels.cache.get(
      ticketData.channel_id
    );
    if (!existingChannel) return;

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
      const warningMessageId = await sendWarning(existingChannel, user);
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

async function closeTicket(channel, guild, user) {
  try {
    await channel.send(`🔒 Ticket wird geschlossen von ${user}.`);
    setTimeout(async () => {
      await channel.delete();
      db.deleteTicket(user.id);
      console.log(`🚫 Ticket-Channel ${channel.id} wurde geschlossen.`);
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

  db.saveTicket(user.id, ticketChannel.id);
  db.updateTicket(user.id, '1', {
    status: 'offen',
    warning: false,
    warnung_nachricht_id: '',
    ticket_message_id: ticketMessage.id,
  });

  await ticketMessage.react(
    setupConfig.information.channels.ticketsupport.REACTION
  );
}

async function sendWarning(channel, user) {
  const warningMessage = await channel.send(
    `⚠️ **Der Support weiß bereits über dein Anliegen Bescheid. Bitte keine weiteren Tickets fordern.**`
  );
  return warningMessage.id;
}

function getLastProblemId(ticketData) {
  return Object.keys(ticketData)
    .filter((k) => !isNaN(k))
    .map(Number)
    .sort((a, b) => b - a)[0]
    .toString();
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
