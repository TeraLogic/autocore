import { setupServer } from '../server-build/serverSetup.js';
import { addReactionToMessage } from './addReactionToMessage.js';
import { setupReactionListener } from './reactionListener.js';
import { ticketConfig } from '../config/ticketConfig.js';
import { botConfig } from '../config/bot-config.js';
import { ActivityType } from 'discord.js';

export async function onReady(client) {
    console.log(`✅ Bot erfolgreich gestartet als ${client.user.tag}`);

    const guild = client.guilds.cache.first();
    if (!guild) {
        console.error('❌ Kein Server gefunden!');
        return;
    }

    console.log('⚙️ Starte Server-Setup...');
    await setupServer(guild);

    if (ticketConfig.TARGET_MESSAGE_ID) {
        console.log('🎟️ Füge Ticket-Reaktion hinzu...');
        await addReactionToMessage(client);
    } else {
        console.warn('⚠️ `TARGET_MESSAGE_ID` nicht gefunden! Warte 5 Sekunden, dann erneut versuchen...');
        setTimeout(async () => {
            if (ticketConfig.TARGET_MESSAGE_ID) {
                console.log('🎟️ Erneuter Versuch: Ticket-Reaktion hinzufügen...');
                await addReactionToMessage(client);
            } else {
                console.error('❌ `TARGET_MESSAGE_ID` konnte nicht automatisch gesetzt werden.');
            }
        }, 5000);
    }

    setupReactionListener(client);
    console.log('🔄 Reaktions-Listener gestartet.');

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
}
