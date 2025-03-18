import { setLanguage } from '../utils/translationHandler.js';

export async function handleLanguageCommand(client, message) {
  if (!message.guild || message.author.bot) return;

  if (message.content.startsWith('!language ')) {
    const args = message.content.split(' ');
    if (args.length < 2) {
      message.reply('⚠️ Bitte gib eine Sprache an. Beispiel: `!language daxo`');
      return;
    }

    const newLang = args[1];
    setLanguage(newLang);
    console.log(
      `🌍 Sprache auf '${newLang}' geändert. Aktualisiere die Ticket-Nachricht...`
    );
    await createOrFetchTicketMessage(message.guild);
    message.reply(`✅ Sprache wurde auf **${newLang}** geändert.`);
  }
}
