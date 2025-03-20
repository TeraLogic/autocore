import { REST, Routes } from 'discord.js';
import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.SERVER_GUILDID;
const CLIENT_ID = process.env.APPLICATION_CLIENTID;
const __dirname = dirname(fileURLToPath(import.meta.url));
const commandsPath = join(__dirname, 'commands');

const commands = [];
const commandFiles = readdirSync(commandsPath).filter((file) =>
  file.endsWith('.js')
);

if (commandFiles.length === 0) {
  console.warn(
    '⚠️ WARNUNG: Keine Commands gefunden! Der Bot wird keine Slash-Commands registrieren.'
  );
} else {
  console.log(`📂 ${commandFiles.length} Commands gefunden. Werden geladen...`);
}

async function loadCommands() {
  try {
    const commandImports = commandFiles.map(
      (file) => import(`file://${join(commandsPath, file)}`)
    );
    const modules = await Promise.all(commandImports);

    modules.forEach((module) => {
      if (module.data) {
        commands.push(module.data.toJSON());
      } else {
        console.warn(
          `⚠️ WARNUNG: Datei ${file} hat keine gültigen Command-Daten!`
        );
      }
    });

    console.log(`✅ ${commands.length} Slash-Commands geladen.`);
  } catch (error) {
    console.error('❌ Fehler beim Laden der Commands:', error);
  }
}

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('🔄 Slash-Commands werden aktualisiert...');
    await loadCommands();

    if (commands.length === 0) {
      console.log(
        '⚠️ Keine gültigen Commands gefunden. Registrierung wird übersprungen.'
      );
      return;
    }

    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
      body: commands,
    });

    console.log(
      `✅ Erfolgreich ${commands.length} Slash-Commands registriert!`
    );
  } catch (error) {
    console.error('❌ Fehler beim Registrieren der Commands:', error);
  }
})();
