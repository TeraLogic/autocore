import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('online')
  .setDescription('Zeigt an, wie viele Mitglieder gerade online sind.');
  
  export async function execute(interaction) {
    try {
      const guild = interaction.guild;
      if (!guild) {
        return await interaction.reply({ content: '❌ Dieser Befehl kann nur in einem Server verwendet werden.', ephemeral: true });
      }
      await guild.members.fetch();
      const onlineMembers = guild.members.cache.filter(member =>
        member.presence?.status === 'online' ||
        member.presence?.status === 'idle' ||
        member.presence?.status === 'dnd'
      ).size;
      await interaction.reply(`✅ Es sind aktuell **${onlineMembers}** Mitglieder aktiv (online, abwesend oder bitte nicht stören).`);
    } catch (error) {
      console.error('❌ Fehler beim Ausführen des /online-Befehls:', error);
      await interaction.reply({ content: '❌ Ein Fehler ist aufgetreten. Bitte versuche es später erneut.', ephemeral: true });
    }
  }
  