import { Client, GatewayIntentBits, Collection, ActivityType, Events } from 'discord.js';
import dotenv from 'dotenv';
import { botConfig } from './src/config/bot-config.js';
import { onReady } from './src/listeners/readyListener.js';
import { loadCommands, handleCommandInteraction } from './src/listeners/commandHandler.js';
import { setLanguage } from './src/utils/translationHandler.js';
import { createOrFetchTicketMessage } from './src/server-build/serverSetup.js';
import { setLoading } from './src/utils/loader.js'

dotenv.config();

const botLanguage = process.env.LANGUAGE || 'default';
setLanguage(botLanguage);

setLoading(true, "⚙️ Starte Bot...");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessageReactions
    ],
});

client.commands = new Collection();

client.once(Events.ClientReady, async () => {
    await onReady(client);
})

client.on(Events.InteractionCreate, async (interaction) => {
    await handleCommandInteraction(client, interaction);
});

setLoading(false)

client.login(process.env.DISCORD_BOT_TOKEN).catch((err) => {
    console.error('❌ Fehler beim Login:', err);
});
