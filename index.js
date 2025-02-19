import { Client, GatewayIntentBits, Collection, Events } from 'discord.js';
import dotenv from 'dotenv';
import { onReady } from './src/listeners/readyListener.js';
import { handleCommandInteraction } from './src/listeners/commandHandler.js';
import { setLanguage } from './src/utils/translationHandler.js';

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

client.commands = new Collection();

client.once(Events.ClientReady, async () => {
  await onReady(client);
});

client.on(Events.InteractionCreate, async (interaction) => {
  await handleCommandInteraction(client, interaction);
});

client.login(process.env.DISCORD_BOT_TOKEN).catch((err) => {
  console.error('❌ Fehler beim Login:', err);
});
