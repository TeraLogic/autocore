import { ChannelType, PermissionsBitField } from 'discord.js';
import { setupConfig, saveConfig } from '../config/setupConfig.js';

let isRunning = false;
let retryCount = 0;
const MAX_RETRIES = 3;

export async function setupInformationCategory(guild) {
  if (retryCount >= MAX_RETRIES) {
    console.error("❌ Maximalanzahl an Wiederholungen erreicht. Abbruch.");
    return;
  }
  
  const config = setupConfig.information?.category;
  if (!config) return;

  let category = guild.channels.cache.get(config.ID);
  if (category?.type !== ChannelType.GuildCategory) {
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
    } else {
      try {
        category = await guild.channels.create({
          name: config.NAME,
          type: ChannelType.GuildCategory,
          permissionOverwrites: [{
            id: guild.roles.everyone.id,
            allow: [PermissionsBitField.Flags.ViewChannel],
            deny: Object.values(PermissionsBitField.Flags).filter(flag => 
              [
                'SendMessages', 'AddReactions', 'AttachFiles', 'EmbedLinks',
                'ManageMessages', 'ManageChannels', 'UseApplicationCommands',
                'CreateInstantInvite'
              ].includes(flag.name))
          }],
        });
        setupConfig.information.category.ID = category.id;
        saveConfig();
      } catch {
        return;
      }
    }
  }
  await setupInformationChannels(guild, category);
}

export async function setupInformationChannels(guild, category) {
  if (isRunning || !category || category.type !== ChannelType.GuildCategory) return;
  isRunning = true;

  const permissionConfig = setupConfig.information?.permission?.readOnly;
  if (!permissionConfig) {
    isRunning = false;
    return;
  }

  const permissions = permissionConfig.map(perm => ({
    id: guild.roles.everyone.id,
    allow: perm.allow.map(flag => PermissionsBitField.Flags[flag]),
    deny: perm.deny.map(flag => PermissionsBitField.Flags[flag]),
  }));

  const updateMessage = async (channel, messageConfig) => {
    try {
      if (messageConfig.ID) {
        const fetchedMessage = await channel.messages.fetch(messageConfig.ID);
        if (fetchedMessage.partial) {
          retryCount++;
          console.warn("⚠️ Nachricht nicht vollständig. Wiederhole setupInformationCategory...");
          if (retryCount < MAX_RETRIES) {
            await setupInformationCategory(guild);
          } else {
            console.error("❌ Maximalanzahl an Wiederholungen erreicht. Fehlerhafte Nachricht.");
          }
          return;
        }
        if (fetchedMessage.content !== messageConfig.MESSAGE) {
          await fetchedMessage.edit(messageConfig.MESSAGE);
        }
        if (!fetchedMessage.reactions.cache.has('📩')) {
          await fetchedMessage.react('📩'); // Reaktion hinzufügen
        }
        return;
      }
    } catch {}
    
    const newMessage = await channel.send(messageConfig.MESSAGE);
    messageConfig.ID = newMessage.id;
    saveConfig();
    await newMessage.react('📩'); // Fügt eine Reaktion hinzu, um Tickets zu öffnen
  };

  const manageChannel = async (channelConfig) => {
    let channel = guild.channels.cache.get(channelConfig.ID) ||
      guild.channels.cache.find(ch => ch.name.toLowerCase() === channelConfig.NAME.toLowerCase());

    if (!channel) {
      try {
        channel = await guild.channels.create({
          name: channelConfig.NAME,
          type: ChannelType.GuildText,
          parent: category.id,
          permissionOverwrites: permissions,
        });
        channelConfig.ID = channel.id;
        saveConfig();
      } catch {
        return;
      }
    } else if (channel.parentId !== category.id) {
      await channel.setParent(category.id);
    }

    if (channelConfig.message) await updateMessage(channel, channelConfig.message);
  };

  const { announcements, changelog, partner, ticketsupport } = setupConfig.information.channels;
  await Promise.all([
    manageChannel(announcements),
    manageChannel(changelog),
    manageChannel(partner),
    manageChannel(ticketsupport)
  ]);

  isRunning = false;
}