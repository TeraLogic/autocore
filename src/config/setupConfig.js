import fs from 'fs';
import path from 'path';

const configPath = path.resolve('./src/config/setupConfig.json');
let setupConfig = {};

// Funktion zum Laden der Konfiguration
function loadConfig() {
  try {
    const fileContent = fs.readFileSync(configPath, 'utf8');
    setupConfig = JSON.parse(fileContent);
    console.log('✅ Konfiguration erfolgreich geladen.');
  } catch (err) {
    console.error('❌ Fehler beim Laden der Konfigurationsdatei:', err);
    setupConfig = {};
  }
}

// Funktion zum Speichern der Konfiguration
function saveConfig() {
  try {
    fs.writeFileSync(configPath, JSON.stringify(setupConfig, null, 2));
    console.log('💾 Konfigurationsdatei erfolgreich gespeichert.');
  } catch (err) {
    console.error('❌ Fehler beim Speichern der Konfigurationsdatei:', err);
  }
}

// Funktion zum Neuladen der Konfiguration
function reloadConfig() {
  console.log('♻️ Neuladen der Konfiguration...');
  loadConfig();
}

// Initiales Laden der Konfiguration
loadConfig();

export { setupConfig, saveConfig, reloadConfig };
