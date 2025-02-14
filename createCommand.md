## **🛠 Anleitung: Wie erstelle ich einen Slash Command für deinen Discord-Bot?**

Diese Anleitung zeigt dir, **wie du einen Slash Command für deinen Bot erstellst** und was du beachten musst.

---

## **📌 1. Grundaufbau eines Slash Commands**
Ein Slash Command benötigt **mindestens zwei Dinge**:
1️⃣ **`data`** – Die Befehlsdaten (`name`, `description`, optionale Parameter).  
2️⃣ **`execute`** – Die Funktion, die ausgeführt wird, wenn jemand den Befehl nutzt.  

### **✅ Minimaler Command (`/ping` – Antwortet mit "Pong!")**
```javascript
import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Antwortet mit Pong!');

export async function execute(interaction) {
  await interaction.reply('🏓 Pong!');
}
```
👉 **Speichern unter:** `src/commands/ping.js`

---

## **📌 2. Ein Command mit Parametern**
Du kannst auch **Parameter (Options)** hinzufügen, damit der User zusätzliche Informationen eingeben kann.

### **✅ Command mit Option (`/say <text>` – Wiederholt eine Nachricht)**
```javascript
import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('say')
  .setDescription('Lässt den Bot eine Nachricht sagen.')
  .addStringOption(option =>
    option.setName('text')
      .setDescription('Die Nachricht, die der Bot wiederholen soll.')
      .setRequired(true) // Muss eingegeben werden
  );

export async function execute(interaction) {
  const userMessage = interaction.options.getString('text'); // Hole die Eingabe des Nutzers
  await interaction.reply(userMessage);
}
```
👉 **Speichern unter:** `src/commands/say.js`

### **🛠 Erklärung:**
✅ **`addStringOption()`** → Fügt eine Texteingabe (`/say Hallo!`) hinzu  
✅ **`.setRequired(true)`** → Die Option muss eingegeben werden  
✅ **`interaction.options.getString('text')`** → Liest den eingegebenen Text  

---

## **📌 3. Command mit Benutzer- und Zahlen-Optionen**
Hier ein Beispiel, wie du einen Befehl mit **verschiedenen Parametern** erstellst.

### **✅ Command `/add <zahl1> <zahl2>` – Addiert zwei Zahlen**
```javascript
import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('add')
  .setDescription('Addiert zwei Zahlen.')
  .addIntegerOption(option =>
    option.setName('zahl1')
      .setDescription('Die erste Zahl')
      .setRequired(true)
  )
  .addIntegerOption(option =>
    option.setName('zahl2')
      .setDescription('Die zweite Zahl')
      .setRequired(true)
  );

export async function execute(interaction) {
  const zahl1 = interaction.options.getInteger('zahl1');
  const zahl2 = interaction.options.getInteger('zahl2');
  const summe = zahl1 + zahl2;

  await interaction.reply(`📊 Ergebnis: **${zahl1} + ${zahl2} = ${summe}**`);
}
```
👉 **Speichern unter:** `src/commands/add.js`

---

## **📌 4. Command mit Benutzer-Interaktion**
Du kannst auch Befehle schreiben, die mit anderen **Benutzern** interagieren.

### **✅ Command `/info <user>` – Zeigt Infos über einen Benutzer**
```javascript
import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('info')
  .setDescription('Zeigt Informationen über einen Benutzer.')
  .addUserOption(option =>
    option.setName('user')
      .setDescription('Der Benutzer, über den du Infos willst.')
      .setRequired(true)
  );

export async function execute(interaction) {
  const user = interaction.options.getUser('user');

  await interaction.reply(`👤 Name: **${user.username}**\n🆔 ID: **${user.id}**`);
}
```
👉 **Speichern unter:** `src/commands/info.js`

### **🛠 Erklärung:**
✅ **`addUserOption()`** → Ermöglicht die Auswahl eines Discord-Benutzers  
✅ **`interaction.options.getUser('user')`** → Holt den gewählten User  

---

## **📌 5. Wie registriere ich den neuen Command?**
Sobald du deinen neuen Command in `src/commands/` erstellt hast, musst du ihn **bei Discord registrieren**.

**Starte die Command-Registrierung mit:**
```sh
pnpm deploy-commands
```
🔹 Danach ist der neue Slash Command in Discord verfügbar! 🎉

---

## **📌 6. Command-Liste aktualisieren**
Falls du die Slash Commands ändern möchtest:
1. **Ändere die Datei in `src/commands/`**
2. **Führe erneut `pnpm deploy-commands` aus**
3. **Starte den Bot neu mit `pnpm dev`**

---

## **🚀 Fazit**
🔹 **Ein Slash Command braucht `data` & `execute`**  
🔹 **Du kannst Optionen hinzufügen (`String`, `Integer`, `User` etc.)**  
🔹 **Nach jeder Änderung `pnpm deploy-commands` ausführen!**  

Jetzt kannst du **eigene Commands schreiben**! 🚀✨  
Falls du Fragen hast, sag Bescheid! 😊