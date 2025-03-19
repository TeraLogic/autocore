import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Antwortet mit Pong!')
  .addStringOption((option) =>
    option
      .setName('input')
      .setDescription('Ändert die Pong-Reaktion')
      .setAutocomplete(true)
  );

export async function execute(interaction) {
  const input = interaction.options.getString('input');
  let replyMessage = '🏓 Pong!';
  if (input) {
    replyMessage = `🏓 Pong mit ${input}!`;
  }
  await interaction.reply(replyMessage);
}

export async function autocomplete(interaction) {
  const focusedValue = interaction.options.getFocused();
  const choices = ['schnell', 'laut', 'leise', 'langsam'];
  const filtered = choices.filter((choice) => choice.startsWith(focusedValue));
  await interaction.respond(
    filtered.map((choice) => ({ name: choice, value: choice }))
  );
}
