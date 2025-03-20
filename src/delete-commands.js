import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const rest = new REST({ version: '10' }).setToken(
  process.env.DISCORD_BOT_TOKEN
);
const GUILD_ID = process.env.SERVER_GUILDID;

const commandIDs = ['1352031225765957633', '1351909765298520196'];

(async () => {
  try {
    if (commandIDs.length === 0) {
      console.log(
        '⚠️ Keine Command-IDs angegeben. Bitte IDs in `commandIDs` einfügen.'
      );
      process.exit(1);
    }

    console.log('📡 Lade alle registrierten Slash-Commands...');

    // 1️⃣ Abrufen globaler Commands
    const globalCommands = await rest.get(
      Routes.applicationCommands(process.env.APPLICATION_CLIENTID)
    );
    // 2️⃣ Abrufen guild-spezifischer Commands (falls GUILD_ID vorhanden)
    const guildCommands = GUILD_ID
      ? await rest.get(
          Routes.applicationGuildCommands(
            process.env.APPLICATION_CLIENTID,
            GUILD_ID
          )
        )
      : [];

    const allCommands = [...globalCommands, ...guildCommands]; // Alle kombinieren

    console.log(`📜 Gefundene Commands: ${allCommands.length}`);
    allCommands.forEach((cmd) => console.log(`🆔 ${cmd.id} - ${cmd.name}`));

    // 🔍 Prüfe, welche Commands existieren
    const existingCommandIDs = allCommands.map((cmd) => cmd.id);
    const validCommandIDs = commandIDs.filter((id) =>
      existingCommandIDs.includes(id)
    );

    if (validCommandIDs.length === 0) {
      console.log(
        '⚠️ Keine der angegebenen Commands existieren in dieser Umgebung.'
      );
      process.exit(0);
    }

    console.log(`🗑️ Lösche ${validCommandIDs.length} Slash-Command(s)...`);

    for (const commandID of validCommandIDs) {
      if (globalCommands.some((cmd) => cmd.id === commandID)) {
        await rest.delete(
          Routes.applicationCommand(process.env.APPLICATION_CLIENTID, commandID)
        );
        console.log(`✅ Gelöscht (Global): ${commandID}`);
      } else if (guildCommands.some((cmd) => cmd.id === commandID)) {
        await rest.delete(
          Routes.applicationGuildCommand(
            process.env.APPLICATION_CLIENTID,
            GUILD_ID,
            commandID
          )
        );
        console.log(`✅ Gelöscht (Guild): ${commandID}`);
      }
    }

    console.log(
      '🎉 Alle angegebenen gültigen Commands wurden erfolgreich gelöscht!'
    );
  } catch (error) {
    console.error('❌ Fehler beim Löschen der Commands:', error);
  }
})();
