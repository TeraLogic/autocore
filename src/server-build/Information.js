import { ChannelType, PermissionsBitField } from 'discord.js';
import { setupConfig, saveConfig } from '../config/setupConfig.js';

let isRunning = false;

export async function setupInformationCategory(guild) {
  if (!setupConfig.information || !setupConfig.information.category) {
    console.error(
      '❌ Fehler: `information.category` in der Konfiguration fehlt!'
    );
    return;
  }

  let config = setupConfig.information.category;
  let category = guild.channels.cache.get(config.ID);

  if (category && category.type !== ChannelType.GuildCategory) {
    console.warn(
      '⚠️ Gespeicherte ID verweist auf keinen gültigen Kategorietyp. ID wird zurückgesetzt.'
    );
    setupConfig.information.category.ID = null;
    saveConfig();
    category = null;
  }

  if (!category) {
    category = guild.channels.cache.find(
      (ch) => ch.name === config.NAME && ch.type === ChannelType.GuildCategory
    );

    if (category) {
      setupConfig.information.category.ID = category.id;
      saveConfig();
      console.log(
        `✅ Kategorie "${category.name}" durch Name gefunden und ID gespeichert.`
      );
    } else {
      try {
        category = await guild.channels.create({
          name: config.NAME,
          type: ChannelType.GuildCategory,
          permissionOverwrites: [
            {
              id: guild.roles.everyone.id,
              allow: [PermissionsBitField.Flags.ViewChannel],
              deny: [
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.AddReactions,
                PermissionsBitField.Flags.AttachFiles,
                PermissionsBitField.Flags.EmbedLinks,
                PermissionsBitField.Flags.ManageMessages,
                PermissionsBitField.Flags.ManageChannels,
                PermissionsBitField.Flags.UseApplicationCommands,
                PermissionsBitField.Flags.CreateInstantInvite,
              ],
            },
          ],
        });

        if (category) {
          setupConfig.information.category.ID = category.id;
          saveConfig();
          console.log(
            `✅ Kategorie "${category.name}" erfolgreich erstellt und ID gespeichert.`
          );
        } else {
          console.error('❌ Fehler: Kategorie konnte nicht erstellt werden.');
          return;
        }
      } catch (err) {
        console.error('❌ Fehler beim Erstellen der Kategorie:', err);
        return;
      }
    }
  } else {
    console.log(`📂 Kategorie "${category.name}" existiert bereits.`);
  }

  await setupInformationChannels(guild, category);
}

export async function setupInformationChannels(guild, category) {
  if (isRunning) return;
  isRunning = true;

  if (!category || category.type !== ChannelType.GuildCategory) {
    console.error(
      '❌ Fehler: `category` ist nicht korrekt initialisiert oder kein Kategorietyp.'
    );
    isRunning = false;
    return;
  }

  if (
    !setupConfig.information.permission ||
    !setupConfig.information.permission.readOnly
  ) {
    console.error(
      '❌ Fehler: `information.permission.readOnly` in der Konfiguration fehlt!'
    );
    isRunning = false;
    return;
  }

  const permissions = setupConfig.information.permission.readOnly.map(
    (perm) => ({
      id: guild.roles.everyone.id,
      allow: perm.allow.map((flag) => PermissionsBitField.Flags[flag]),
      deny: perm.deny.map((flag) => PermissionsBitField.Flags[flag]),
    })
  );

  const checkAndUpdateMessage = async (channel, messageConfig) => {
    if (messageConfig.ID) {
      try {
        const fetchedMessage = await channel.messages.fetch(messageConfig.ID);
        if (fetchedMessage.content === messageConfig.MESSAGE) {
          console.log(
            `📌 Nachricht im Kanal "${channel.name}" ist bereits aktuell.`
          );
          return;
        } else {
          await fetchedMessage.edit(messageConfig.MESSAGE);
          console.log(
            `✅ Nachricht im Kanal "${channel.name}" erfolgreich aktualisiert.`
          );
          return;
        }
      } catch (err) {
        console.log(
          `⚠️ Nachricht mit ID ${messageConfig.ID} existiert nicht mehr.`
        );
        messageConfig.ID = null;
        saveConfig();
      }
    }

    const newMessage = await channel.send(messageConfig.MESSAGE);
    messageConfig.ID = newMessage.id;
    saveConfig();
    console.log(
      `✅ Nachricht im Kanal "${channel.name}" neu erstellt und ID gespeichert.`
    );
  };

  const createOrUpdateChannel = async (channelConfig) => {
    let channel = guild.channels.cache.get(channelConfig.ID);

    if (!channel) {
      channel = guild.channels.cache.find(
        (ch) => ch.name === channelConfig.NAME.toLowerCase()
      );

      if (!channel) {
        try {
          channel = await guild.channels.create({
            name: channelConfig.NAME,
            type: ChannelType.GuildText,
            parent: category.id,
            permissionOverwrites: permissions,
          });

          if (channel) {
            channelConfig.ID = channel.id;
            saveConfig();
            console.log(
              `✅ Kanal "${channel.name}" in der Kategorie "${category.name}" erfolgreich erstellt und ID gespeichert.`
            );
          } else {
            console.error(
              `❌ Fehler: Kanal "${channelConfig.NAME}" konnte nicht erstellt werden.`
            );
          }
        } catch (err) {
          console.error(
            `❌ Fehler beim Erstellen des Kanals "${channelConfig.NAME}":`,
            err
          );
          return;
        }
      } else {
        console.log(
          `📂 Kanal "${channel.name}" existiert bereits, aber ID in JSON war nicht gesetzt. Aktualisiere ID...`
        );
        channelConfig.ID = channel.id;
        saveConfig();
      }
    }

    if (channel && channel.parentId !== category.id) {
      await channel.setParent(category.id);
      console.log(
        `🔄 Kanal "${channel.name}" in die Kategorie "${category.name}" verschoben.`
      );
    } else if (channel) {
      console.log(
        `📂 Kanal "${channel.name}" ist bereits in der Kategorie "${category.name}".`
      );
    }

    if (channelConfig.message) {
      await checkAndUpdateMessage(channel, channelConfig.message);
    }
  };

  await createOrUpdateChannel(setupConfig.information.channels.announcements);
  await createOrUpdateChannel(setupConfig.information.channels.changelog);
  await createOrUpdateChannel(setupConfig.information.channels.partner);
  await createOrUpdateChannel(setupConfig.information.channels.ticketsupport);

  isRunning = false;
}
