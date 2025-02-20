import { ChannelType, PermissionFlagsBits } from 'discord.js';
import { setupConfig, saveConfig } from '../config/setupConfig.js';

export function setupReactionListener(client) {
  if (!client || typeof client.on !== 'function') {
    console.error('❌ Fehler: `client` ist nicht korrekt initialisiert.');
    return;
  }

  client.on('messageReactionAdd', async (reaction, user) => {
    try {
      if (user.bot) return;

      if (reaction.partial) {
        await reaction.fetch();
      }
      if (reaction.message.partial) {
        await reaction.message.fetch();
      }

      const ticketConfig = setupConfig.information.channels.ticketsupport;

      if (
        reaction.message.id !== ticketConfig.message.ID ||
        reaction.message.channel.id !== ticketConfig.ID
      ) {
        return;
      }

      console.log(`🎟️ ${user.username} hat auf die Ticket-Nachricht reagiert.`);

      const guild = reaction.message.guild;
      if (!guild) return;

      const existingChannel = guild.channels.cache.find(
        (channel) => channel.name === `ticket-${user.username.toLowerCase()}`
      );

      if (existingChannel) {
        console.log(`⚠️ Ticket-Channel für ${user.username} existiert bereits.`);
        await user.send(`⚠️ Du hast bereits ein offenes Ticket: ${existingChannel}`);
        await reaction.users.remove(user);
        return;
      }

      const ticketChannel = await guild.channels.create({
        name: `ticket-${user.username}`,
        type: ChannelType.GuildText,
        parent: setupConfig.information.category.ID,
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
            id: setupConfig.role.supporter,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
            ],
          },
        ],
      });

      console.log(
        `✅ Ticket-Channel für ${user.username} erstellt: ${ticketChannel.name}`
      );

      const ticketMessage = await ticketChannel.send(
        `👋 Hallo ${user}, ein Support-Mitarbeiter wird sich bald melden!\n\n📩 **Reagiere mit 🎟️, um das Ticket zu schließen.**`
      );

      await ticketMessage.react('🎟️');
      await reaction.users.remove(user);

      const closeTicket = async (reactionClose, userClose) => {
        if (userClose.bot) return;
        if (reactionClose.emoji.name !== '🎟️') return;

        await ticketChannel.send(`🔒 Ticket wird geschlossen von ${userClose}.`);
        setTimeout(async () => {
          await ticketChannel.delete();
          console.log(`🚫 Ticket-Channel ${ticketChannel.name} wurde geschlossen.`);
        }, 5000);
      };

      const collector = ticketMessage.createReactionCollector({
        filter: (reactionClose, userClose) => 
          reactionClose.emoji.name === '🎟️' && 
          userClose.id === user.id,
      });

      collector.on('collect', closeTicket);

    } catch (error) {
      console.error('❌ Fehler beim Erstellen des Ticket-Channels:', error);
    }
  });

  checkAndRestoreTicketMessage(client);
}

async function checkAndRestoreTicketMessage(client) {
  const ticketConfig = setupConfig.information.channels.ticketsupport;

  const channel = await client.channels.fetch(ticketConfig.ID);
  if (!channel) {
    console.error('❌ Fehler: Ticket-Support-Channel existiert nicht.');
    return;
  }

  try {
    const message = await channel.messages.fetch(ticketConfig.message.ID);

    if (message) {
      const hasReaction = message.reactions.cache.some(
        (reaction) => reaction.emoji.name === ticketConfig.REACTION
      );

      if (!hasReaction) {
        await message.react(ticketConfig.REACTION);
        console.log(`✅ Reaktion "${ticketConfig.REACTION}" zur Nachricht hinzugefügt.`);
      } else {
        console.log(`🔄 Reaktion "${ticketConfig.REACTION}" ist bereits vorhanden.`);
      }
    } else {
      console.warn('⚠️ Ticket-Nachricht existiert nicht mehr. Erstelle neu...');
      const newMessage = await channel.send(ticketConfig.message.MESSAGE);
      ticketConfig.message.ID = newMessage.id;
      await newMessage.react(ticketConfig.REACTION);
      saveConfig();
      console.log(`✅ Ticket-Nachricht neu erstellt und ID gespeichert: ${newMessage.id}`);
    }
  } catch (error) {
    console.warn('⚠️ Fehler beim Überprüfen der Ticket-Nachricht:', error);
  }

  setTimeout(() => checkAndRestoreTicketMessage(client), 60000);
}
