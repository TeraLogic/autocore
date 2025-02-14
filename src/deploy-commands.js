import fs from 'node:fs';
import path from 'node:path';
import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const commands = [];
const commandsPath = path.join(process.cwd(), 'src', 'commands');

// Lade Commands, wenn der Ordner existiert
if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    try {
      const command = await import(`file://${commandsPath}/${file}`);

      if (command.data && command.execute) {
        commands.push(command.data.toJSON());
        console.log(`✅ Befehl registriert: ${command.data.name}`);
      } else {
        console.warn(`⚠️ Der Befehl ${file} hat keine "data" oder "execute"-Eigenschaft.`);
      }
    } catch (error) {
      console.error(`❌ Fehler beim Laden des Befehls ${file}:`, error);
    }
  }
} else {
  console.warn('⚠️ Befehlsverzeichnis nicht gefunden!');
}

// Discord REST API für Slash Commands
const rest = new REST().setToken(process.env.DISCORD_BOT_TOKEN);

(async () => {
  try {
    console.log(`🔄 Starte das Aktualisieren von ${commands.length} Befehlen...`);

    const data = await rest.put(
      Routes.applicationGuildCommands(process.env.APPLICATION_CLIENTID, process.env.SERVER_GUILDID),
      { body: commands },
    );

    console.log(`✅ Erfolgreich ${data.length} Befehle registriert!`);
  } catch (error) {
    console.error("❌ Fehler beim Registrieren der Befehle:", error);
  }
})();
