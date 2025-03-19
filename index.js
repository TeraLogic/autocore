import { Client, GatewayIntentBits, Collection } from 'discord.js';
import dotenv from 'dotenv';
import { setLanguage } from './src/utils/translationHandler.js';
import { setupServer } from './src/server-build/serverSetup.js';
import { startPeriodicUpdate } from './src/utils/timeScheduler.js';
import {
  loadCommands,
  handleInteraction,
} from './src/handlers/commandHandler.js';

dotenv.config();

const botLanguage = process.env.LANGUAGE || 'default';
setLanguage(botLanguage);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessageReactions,
  ],
});

const commands = loadCommands();
client.on('interactionCreate', (interaction) =>
  handleInteraction(interaction, commands)
);

client.once('ready', async () => {
  const guild = client.guilds.cache.get(process.env.SERVER_GUILDID);
  await setupServer(guild, client);
  startPeriodicUpdate(client);
});

client.login(process.env.DISCORD_BOT_TOKEN).catch((err) => {
  console.error('❌ Fehler beim Login:', err);
});
