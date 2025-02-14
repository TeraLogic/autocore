import fs from 'fs';

const translationsPath = './src/translations/';
let currentLanguage = 'default';

export function setLanguage(lang = 'default') {
    const langFile = `${translationsPath}${lang}.json`;
    if (fs.existsSync(langFile)) {
        currentLanguage = lang;
        console.log(`🌍 Sprache gesetzt: ${lang}`);
    } else {
        console.warn(`⚠️ Sprache '${lang}' nicht gefunden. Verwende Standard: 'default'`);
        currentLanguage = 'default';
    }
}

export function getTranslation(category, key) {
    try {
        const defaultFile = `${translationsPath}default.json`;
        const langFile = `${translationsPath}${currentLanguage}.json`;

        const defaultData = fs.existsSync(defaultFile)
            ? JSON.parse(fs.readFileSync(defaultFile, 'utf8'))
            : {};

        const langData = fs.existsSync(langFile)
            ? JSON.parse(fs.readFileSync(langFile, 'utf8'))
            : {};

        if (langData[category] && langData[category][key]) {
            return langData[category][key];
        }

        return defaultData[category] && defaultData[category][key]
            ? defaultData[category][key]
            : `⚠️ Fehlende Übersetzung für ${category}.${key}`;
    } catch (error) {
        console.error(`❌ Fehler beim Laden der Übersetzung für ${category}.${key}:`, error);
        return `⚠️ Fehler bei ${category}.${key}`;
    }
}
