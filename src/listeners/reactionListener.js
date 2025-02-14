import { ChannelType, PermissionFlagsBits } from 'discord.js';
import { ticketConfig } from '../config/ticketConfig.js';


export function setupReactionListener(client) {
  client.on('messageReactionAdd', async (reaction, user) => {
    try {
      if (user.bot) return;

      if (reaction.message.partial) {
        await reaction.message.fetch();
      }

      if (
        reaction.message.id !== ticketConfig.TARGET_MESSAGE_ID ||
        reaction.message.channel.id !== ticketConfig.TICKET_CHANNEL_ID
      ) {
        return;
      }

      console.log(`🎟️ ${user.username} hat auf die Ticket-Nachricht reagiert.`);

      const guild = reaction.message.guild;
      if (!guild) return;

      const ticketChannel = await guild.channels.create({
        name: `ticket-${user.username}`,
        type: ChannelType.GuildText,
        parent: ticketConfig.TICKET_CATEGORY_ID,
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
            id: ticketConfig.SUPPORT_ROLE_ID,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
            ],
          },
        ],
      });

      console.log(`✅ Ticket-Channel für ${user.username} erstellt: ${ticketChannel.name}`);

      const ticketMessage = await ticketChannel.send(
        `👋 Hallo ${user}, ein Support-Mitarbeiter wird sich bald melden!\n\n📩 **Reagiere mit 🎟️, um das Ticket zu schließen.**`
      );

      await ticketMessage.react('🎟️');

      await reaction.users.remove(user);
    } catch (error) {
      console.error('❌ Fehler beim Erstellen des Ticket-Channels:', error);
    }
  });
}

