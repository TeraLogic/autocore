import {
  setupInformationCategory,
  setupInformationChannels,
} from './Information.js';

import { setupReactionListener } from '../listeners/ticketListener.js';

export async function setupServer(guild, client) {
  try {
    console.log(`⚙️ Starte Server-Setup für ${guild.name}...`);

    await setupInformation(guild);

    console.log(`✅ Server-Setup für ${guild.name} erfolgreich abgeschlossen!`);

    setupReactionListener(client);

    console.log('🔄 Ticket-Listener erfolgreich gestartet!');
  } catch (error) {
    console.error('❌ Fehler während des Server-Setups:', error);
  }
}

const setupInformation = async (guild) => {
  await setupInformationCategory(guild);
  await setupInformationChannels(guild);
};
