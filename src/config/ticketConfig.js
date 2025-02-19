import fs from 'fs';

const configPath = './src/config/ticketConfig.json';

let ticketConfig = {};
if (fs.existsSync(configPath)) {
  ticketConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  ticketConfig.TICKET_CHANNEL_ID = ticketConfig.TICKET_CHANNEL_ID || null;
  ticketConfig.TICKET_CATEGORY_ID = ticketConfig.TICKET_CATEGORY_ID || null;
} else {
  ticketConfig = {
    TICKET_CHANNEL_ID: null,
    TICKET_CATEGORY_ID: null,
    SUPPORT_ROLE_ID: '1339263180093784154',
    TARGET_MESSAGE_ID: null,
    TICKET_EMOJI: '🎟️',
  };
  saveConfig();
}

function saveConfig() {
  fs.writeFileSync(configPath, JSON.stringify(ticketConfig, null, 2));
}

export { ticketConfig, saveConfig };
