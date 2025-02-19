import fs from 'node:fs';
import path from 'node:path';

export function loadCommands(client) {
  const commandsPath = path.join(process.cwd(), 'src', 'commands');
  if (fs.existsSync(commandsPath)) {
    const commandFiles = fs
      .readdirSync(commandsPath)
      .filter((file) => file.endsWith('.js'));

    for (const file of commandFiles) {
      import(`../commands/${file}`)
        .then((command) => {
          if (command.data && command.execute) {
            client.commands.set(command.data.name, command);
            console.log(`✅ Befehl geladen: ${command.data.name}`);
          } else {
            console.warn(
              `⚠️ Der Befehl ${file} hat keine "data" oder "execute"-Eigenschaft.`
            );
          }
        })
        .catch((err) =>
          console.error(`❌ Fehler beim Laden des Befehls ${file}:`, err)
        );
    }
  } else {
    console.warn('⚠️ Befehlsverzeichnis nicht gefunden!');
  }
}

export async function handleCommandInteraction(client, interaction) {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) {
    console.error(
      `❌ Kein passender Befehl für ${interaction.commandName} gefunden.`
    );
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(
      `❌ Fehler beim Ausführen des Befehls ${interaction.commandName}:`,
      error
    );
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: '❌ Ein Fehler ist beim Ausführen des Befehls aufgetreten!',
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: '❌ Ein Fehler ist beim Ausführen des Befehls aufgetreten!',
        ephemeral: true,
      });
    }
  }
}
