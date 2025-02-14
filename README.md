Hier ist deine **`README.md`** Datei für den Bot:  

📂 **Datei:** `README.md`  
```md
# 🚀 AutoCore Discord Bot

Ein leistungsstarker und modularer Discord-Bot mit Ticket-System und mehr!  
Diese Anleitung hilft dir, den Bot auf deinem eigenen Server einzurichten.  

---

## 📌 **Voraussetzungen**
Stelle sicher, dass du folgende Dinge installiert hast, bevor du beginnst:

- **[Node.js](https://nodejs.org/)** (empfohlen: **v18 oder höher**)
- **[pnpm](https://pnpm.io/installation)** (anstelle von npm oder yarn)
- **Ein Discord-Bot-Token** ([Anleitung](https://discord.com/developers/applications))
- **Einrichten der `.env` Datei** (siehe unten)

---

## 📥 **Installation**
1. **Projekt klonen**
   ```sh
   git clone https://github.com/dein-repo/discord-bot.git
   cd discord-bot
   ```

2. **Abhängigkeiten installieren**
   ```sh
   pnpm install
   ```

---

## ⚙️ **Konfiguration**
### **1️⃣ Erstelle eine `.env` Datei**
Erstelle eine Datei namens `.env` im Hauptverzeichnis des Projekts mit folgendem Inhalt:

```env
DISCORD_BOT_TOKEN=DeinDiscordBotToken
LANGUAGE=default
```
✏️ **Erklärung:**  
- `DISCORD_BOT_TOKEN` → Dein Bot-Token aus dem [Discord Developer Portal](https://discord.com/developers/applications)  
- `LANGUAGE` → Standard-Sprache für den Bot (z. B. `default` oder `daxo`)  

---

## 🚀 **Bot starten**
1. **Entwicklungsmodus starten** (mit automatischem Neustart bei Änderungen)
   ```sh
   pnpm dev
   ```
2. **Produktionsmodus starten**
   ```sh
   pnpm start
   ```

---

## 📂 **Dateistruktur**
```
/src
  /commands          → Slash-Befehle des Bots
  /config            → Konfigurationsdateien (bot-config.js)
  /listeners         → Event-Listener (ready, commands, etc.)
  /server-build      → Server-Setup (Ticket-System)
  /translations      → Sprachdateien (default.json, daxo.json)
  /utils             → Hilfsfunktionen (translationHandler.js)
  index.js           → Haupteinstiegspunkt des Bots
```

---

## 🛠 **Nützliche Befehle**
- **Abhängigkeiten aktualisieren:**  
  ```sh
  pnpm update
  ```
- **Code-Formatierung mit Prettier:**  
  ```sh
  pnpm format
  ```
- **ESLint für Code-Qualität prüfen & fixen:**  
  ```sh
  pnpm lint
  ```

---

## 🎭 **Sprachen anpassen**
Die Sprache des Bots kann in der `.env` Datei geändert werden:
```env
LANGUAGE=daxo
```
- Standardmäßig verwendet der Bot die `default.json` Datei aus `/translations`
- Falls du eine neue Sprache hinzufügen möchtest, erstelle eine neue Datei in `/translations` (z. B. `fr.json` für Französisch)

---

## 📝 **Lizenz**
Dieses Projekt steht unter der **MIT-Lizenz**.  
Mehr Infos findest du in der [LICENSE](LICENSE) Datei.

---

## 💡 **Fehlermeldungen & Hilfe**
Falls du Probleme hast, überprüfe bitte:
1. **Ist die `.env` Datei richtig konfiguriert?**
2. **Läuft der Bot mit `pnpm dev` ohne Fehlermeldungen?**
3. **Sind alle Abhängigkeiten installiert (`pnpm install`)?**

Falls du immer noch Probleme hast, öffne ein [GitHub Issue](https://github.com/dein-repo/discord-bot/issues) oder frag in unserer Community nach Hilfe! 🚀  
```

---

## **✅ Fazit**
✔ **Alles, was man für die Installation & Nutzung des Bots braucht, ist enthalten.** ✅  
✔ **Die `.env` Datei ist klar erklärt.** ✅  
✔ **Nützliche Befehle für Entwickler sind aufgelistet.** ✅  
✔ **Die Dateistruktur des Projekts ist dokumentiert.** ✅  
✔ **Anleitung für Sprachänderungen ist enthalten.** ✅  

Falls du noch Anpassungen möchtest (z. B. extra Befehle oder Features in die README), sag Bescheid! 🚀😊