import fs from 'node:fs';
import path from 'node:path';
import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const APPLICATION_CLIENTID = process.env.APPLICATION_CLIENTID;
const SERVER_GUILDID = process.env.SERVER_GUILDID;

const commands = [];
const commandsPath = path.join(process.cwd(), 'src', 'commands');

if (fs.existsSync(commandsPath)) {
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith('.js'));

  for (const file of commandFiles) {
    try {
      const command = await import(`file://${commandsPath}/${file}`);

      if (command.data && command.execute) {
        commands.push(command.data.toJSON());
        console.log(`✅ Befehl registriert: ${command.data.name}`);
      } else {
        console.warn(
          `⚠️ Der Befehl ${file} hat keine "data" oder "execute"-Eigenschaft.`
        );
      }
    } catch (error) {
      console.error(`❌ Fehler beim Laden des Befehls ${file}:`, error);
    }
  }
} else {
  console.warn('⚠️ Befehlsverzeichnis nicht gefunden!');
}

const rest = new REST().setToken(DISCORD_BOT_TOKEN);

(async () => {
  try {
    console.log(
      `🔄 Starte das Aktualisieren von ${commands.length} Befehlen...`
    );

    const data = await rest.put(
      Routes.applicationGuildCommands(APPLICATION_CLIENTID, SERVER_GUILDID),
      { body: commands }
    );

    console.log(`✅ Erfolgreich ${data.length} Befehle registriert!`);
  } catch (error) {
    console.error('❌ Fehler beim Registrieren der Befehle:', error);
  }
})();
