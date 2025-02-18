import { Client, GatewayIntentBits, Collection, ActivityType, Events } from 'discord.js';
import dotenv from 'dotenv';
import { botConfig } from './src/config/bot-config.js';
import { onReady } from './src/listeners/readyListener.js';
import { loadCommands, handleCommandInteraction } from './src/listeners/commandHandler.js';
import { setLanguage } from './src/utils/translationHandler.js';
import { createOrFetchTicketMessage } from './src/server-build/serverSetup.js';
import { setLoading, log } from './src/utils/loader.js'

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

setLoading(false)

client.once('ready', async () => {
    await onReady(client);

    const guild = client.guilds.cache.first();
    if (guild) {
        console.log(`🌍 Sprache eingestellt auf: ${botLanguage}`);
        await createOrFetchTicketMessage(guild);
    }
});

client.once(Events.ClientReady, (readyClient) => {
    console.log(`✅ Bot erfolgreich gestartet als ${readyClient.user.tag}`);

    if (botConfig.status && botConfig.statusType) {
        client.user.setPresence({
            activities: [
                {
                    name: botConfig.name,
                    type: ActivityType[botConfig.statusType],
                },
            ],
            status: botConfig.status,
        });
        console.log(`🎮 Status gesetzt auf: ${botConfig.statusType} ${botConfig.status}`);
    }
});

loadCommands(client);

client.on(Events.InteractionCreate, async (interaction) => {
    await handleCommandInteraction(client, interaction);
});

client.login(process.env.DISCORD_BOT_TOKEN).catch((err) => {
    console.error('❌ Fehler beim Login:', err);
});
