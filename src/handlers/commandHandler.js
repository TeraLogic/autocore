import { readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === 'production';
const commandsPath = isProduction
  ? join(__dirname, 'src/commands')
  : join(__dirname, '../../src/commands');

if (!existsSync(commandsPath)) {
  console.error(
    `❌ FEHLER: Der Commands-Ordner existiert nicht unter: ${commandsPath}`
  );
  process.exit(1);
}

export async function loadCommands() {
  const commands = new Map();
  const commandFiles = readdirSync(commandsPath).filter((file) =>
    file.endsWith('.js')
  );

  if (commandFiles.length === 0) {
    console.warn('⚠️ WARNUNG: Keine Commands gefunden.');
    return commands;
  }

  await Promise.all(
    commandFiles.map(async (file) => {
      try {
        const module = await import(`file://${join(commandsPath, file)}`);
        if (module?.data?.name) {
          commands.set(module.data.name, module);
        } else {
          console.warn(
            `⚠️ WARNUNG: ${file} enthält keine gültigen Command-Daten.`
          );
        }
      } catch (error) {
        console.error(`❌ Fehler beim Laden von ${file}:`, error);
      }
    })
  );

  console.log(`✅ Erfolgreich ${commands.size} Commands geladen.`);
  return commands;
}

export async function handleInteraction(interaction, commands) {
  if (interaction.isChatInputCommand()) {
    const command = commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(
        `❌ Fehler beim Ausführen von /${interaction.commandName}:`,
        error
      );
      await interaction.reply({
        content: '❌ Fehler beim Ausführen des Befehls!',
        ephemeral: true,
      });
    }
  } else if (interaction.isAutocomplete()) {
    const command = commands.get(interaction.commandName);
    if (command?.autocomplete) {
      try {
        await command.autocomplete(interaction);
      } catch (error) {
        console.error(
          `❌ Fehler beim Autocomplete für /${interaction.commandName}:`,
          error
        );
      }
    }
  }
}
