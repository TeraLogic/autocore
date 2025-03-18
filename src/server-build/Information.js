import { ChannelType, PermissionsBitField } from 'discord.js';
import { setupConfig, saveConfig } from '../config/setupConfig.js';

let isRunning = false;
let retryCount = 0;
const MAX_RETRIES = 3;

export async function setupInformationCategory(guild) {
  if (retryCount >= MAX_RETRIES) {
    console.error('❌ Maximalanzahl an Wiederholungen erreicht. Abbruch.');
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
          position: config.POSITION || 0,
          permissionOverwrites: config.PERMISSIONS || []
        });
        setupConfig.information.category.ID = category.id;
        saveConfig();
      } catch (error) {
        console.error('❌ Fehler beim Erstellen der Kategorie:', error);
        return;
      }
    }
  }
  await setupInformationChannels(guild, category);
}

async function setupInformationChannels(guild, category) {
  if (isRunning || !category || category.type !== ChannelType.GuildCategory) return;
  isRunning = true;

  const permissionConfig = setupConfig.information?.permission?.readOnly || [];
  const permissions = permissionConfig.map(perm => ({
    id: guild.roles.everyone.id,
    allow: perm.allow.map(flag => PermissionsBitField.Flags[flag]),
    deny: perm.deny.map(flag => PermissionsBitField.Flags[flag]),
  }));

  const updateMessage = async (channel, channelConfig) => {
    try {
      if (!channelConfig?.message) return;
      const messageConfig = channelConfig.message;
      
      if (messageConfig.ID) {
        const fetchedMessage = await channel.messages.fetch(messageConfig.ID).catch(() => null);
        if (fetchedMessage) {
          if (fetchedMessage.partial) {
            retryCount++;
            console.warn('⚠️ Nachricht nicht vollständig. Wiederhole setupInformationCategory...');
            if (retryCount < MAX_RETRIES) {
              await setupInformationCategory(guild);
            } else {
              console.error('❌ Maximalanzahl an Wiederholungen erreicht. Fehlerhafte Nachricht.');
            }
            return;
          }
          if (fetchedMessage.content !== messageConfig.MESSAGE) {
            await fetchedMessage.edit(messageConfig.MESSAGE);
          }
          if (channelConfig === setupConfig.information.channels.ticketsupport) {
            const emoji = setupConfig.information.channels.ticketsupport.REACTION;
            if (!fetchedMessage.reactions.cache.has(emoji)) {
              await fetchedMessage.react(emoji);
            }
          }
          return;
        }
      }
      
      const newMessage = await channel.send(messageConfig.MESSAGE);
      channelConfig.message.ID = newMessage.id;
      saveConfig();
      
      if (channelConfig === setupConfig.information.channels.ticketsupport) {
        await newMessage.react(setupConfig.information.channels.ticketsupport.REACTION);
      }
    } catch (error) {
      console.error('❌ Fehler beim Aktualisieren der Nachricht:', error);
    }
  };

  const createOrUpdateChannel = async (channelConfig) => {
    if (!channelConfig) return;
    let channel = guild.channels.cache.get(channelConfig.ID) ||
      guild.channels.cache.find(ch => ch.name.toLowerCase() === channelConfig.NAME.toLowerCase());

    if (!channel) {
      try {
        channel = await guild.channels.create({
          name: channelConfig.NAME,
          type: ChannelType.GuildText,
          parent: category.id,
          position: channelConfig.POSITION || 0,
          permissionOverwrites: permissions,
        });
        channelConfig.ID = channel.id;
        saveConfig();
      } catch (error) {
        console.error(`❌ Fehler beim Erstellen des Kanals ${channelConfig.NAME}:`, error);
        return;
      }
    } else if (channel.parentId !== category.id) {
      await channel.setParent(category.id);
    }
    await updateMessage(channel, channelConfig);
  };

  const { announcements, changelog, partner, ticketsupport } = setupConfig.information.channels;
  await Promise.all([
    createOrUpdateChannel(announcements),
    createOrUpdateChannel(changelog),
    createOrUpdateChannel(partner),
    createOrUpdateChannel(ticketsupport),
  ]);

  isRunning = false;
}
