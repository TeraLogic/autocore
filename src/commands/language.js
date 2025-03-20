import { setLanguage } from '../utils/translationHandler.js';
import { SlashCommandBuilder } from 'discord.js';

let availableLanguages = [
  { name: 'default', value: 'Standart' },
  { name: 'daxo', value: 'Partner' },
];

export const data = new SlashCommandBuilder()
  .setName('language')
  .setDescription(
    'Ändere deine Sprache oder verwende deine eigene, wenn du Partner bist.'
  )
  .addStringOption(
    (option) =>
      option
        .setName('language')
        .setDescription('Wähle eine Sprache')
        .setRequired(true)
    //.addChoices(...availableLanguages)
  );

export async function execute(interaction) {
  const input = interaction.options.getString('language');
  if (!input) {
    return await interaction.reply({
      content: '❌ Ungültige Sprache ausgewählt!',
      ephemeral: true,
    });
  }

  try {
    setLanguage(input);
    await interaction.reply(`✅ Sprache wurde auf **${input}** geändert.`);
  } catch (error) {
    console.error('❌ Fehler beim Setzen der Sprache:', error);
    await interaction.reply({
      content: '❌ Es gab einen Fehler beim Ändern der Sprache.',
      ephemeral: true,
    });
  }
}
