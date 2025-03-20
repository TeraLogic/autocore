import { ChannelType, PermissionsBitField } from 'discord.js';
import { setupConfig, saveConfig } from '../config/setupConfig.js';
import { createRuleEmbeds } from '../components/createRuleEmbeds.js';

let isRunning = false;
let retryCount = 0;
const MAX_RETRIES = 3;

export async function setupWelcomeCategory(guild) {
  if (retryCount >= MAX_RETRIES) return;

  const config = setupConfig.welcome?.category;
  if (!config) return;

  let category = guild.channels.cache.get(config.ID);
  if (category?.type !== ChannelType.GuildCategory) {
    setupConfig.welcome.category.ID = null;
    await saveConfig();
    category = null;
  }

  if (!category) {
    category = guild.channels.cache.find(
      (ch) => ch.name === config.NAME && ch.type === ChannelType.GuildCategory
    );

    if (category) {
      setupConfig.welcome.category.ID = category.id;
      await saveConfig();
    } else {
      try {
        category = await guild.channels.create({
          name: config.NAME,
          type: ChannelType.GuildCategory,
          position: config.POSITION || 0,
          permissionOverwrites: config.PERMISSIONS || [],
        });
        setupConfig.welcome.category.ID = category.id;
        await saveConfig();
      } catch (error) {
        console.error(
          `❌ Fehler beim Erstellen der Kategorie ${config.NAME}:`,
          error
        );
        return;
      }
    }
  }
  await setupWelcomeChannels(guild, category);
}

export const updateMessage = async (channel, channelConfig) => {
  try {
    if (!channelConfig?.message) return;
    const messageConfig = channelConfig.message;
    const embeds =
      channelConfig === setupConfig.welcome.channels.rules
        ? createRuleEmbeds()
        : null;
    const textMessage = embeds ? null : messageConfig.MESSAGE;

    if (!embeds && !textMessage) return;

    if (messageConfig.ID) {
      const fetchedMessage = await channel.messages
        .fetch(messageConfig.ID)
        .catch(() => null);
      if (fetchedMessage) {
        if (embeds) {
          await fetchedMessage.edit({ embeds });
        } else if (fetchedMessage.content !== textMessage) {
          await fetchedMessage.edit(textMessage);
        }
        return;
      }
    }

    if (embeds) {
      const newMessage = await channel.send({ embeds });
      channelConfig.message.ID = newMessage.id;
    } else {
      const newMessage = await channel.send(textMessage);
      channelConfig.message.ID = newMessage.id;
    }

    await saveConfig();
  } catch (error) {
    console.error(`❌ Fehler in ${channelConfig.NAME}:`, error);
  }
};

export async function setupWelcomeChannels(guild, category) {
  if (isRunning || !category || category.type !== ChannelType.GuildCategory)
    return;
  isRunning = true;

  const permissionConfig = setupConfig.information?.permission?.readOnly || [];
  const permissions = permissionConfig.map((perm) => ({
    id: guild.roles.everyone.id,
    allow: perm.allow.map((flag) => PermissionsBitField.Flags[flag]),
    deny: perm.deny.map((flag) => PermissionsBitField.Flags[flag]),
  }));

  const createOrUpdateChannel = async (channelConfig) => {
    if (!channelConfig) return;
    let channel =
      guild.channels.cache.get(channelConfig.ID) ||
      guild.channels.cache.find(
        (ch) => ch.name.toLowerCase() === channelConfig.NAME.toLowerCase()
      );

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
        await saveConfig();
      } catch (error) {
        console.error(
          `❌ Fehler beim Erstellen des Kanals ${channelConfig.NAME}:`,
          error
        );
        return;
      }
    } else if (channel.parentId !== category.id) {
      await channel.setParent(category.id);
    }
    await updateMessage(channel, channelConfig);
  };

  const { rules, welcome, roles, boosts } = setupConfig.welcome.channels;
  await Promise.all([
    createOrUpdateChannel(rules),
    createOrUpdateChannel(welcome),
    createOrUpdateChannel(roles),
    createOrUpdateChannel(boosts),
  ]);

  isRunning = false;
}
