import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

export function loadCommands() {
  const commands = new Map();

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const commandsPath = join(__dirname, '../commands');

  const commandFiles = readdirSync(commandsPath).filter((file) =>
    file.endsWith('.js')
  );

  for (const file of commandFiles) {
    import(`file://${join(commandsPath, file)}`)
      .then((module) => {
        commands.set(module.data.name, module);
      })
      .catch((error) => {
        console.error(`❌ Fehler beim Laden von ${file}:`, error);
      });
  }

  console.log(`✅ ${commandFiles.length} Commands aus src/commands geladen.`);
  return commands;
}

export async function handleInteraction(interaction, commands) {
  if (interaction.isChatInputCommand()) {
    const command = commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: '❌ Fehler beim Ausführen des Befehls!',
        ephemeral: true,
      });
    }
  } else if (interaction.isAutocomplete()) {
    const command = commands.get(interaction.commandName);
    if (command && command.autocomplete) {
      try {
        await command.autocomplete(interaction);
      } catch (error) {
        console.error(error);
      }
    }
  }
}
