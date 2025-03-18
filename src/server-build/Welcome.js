import { ChannelType, PermissionsBitField } from 'discord.js';
import { setupConfig, saveConfig } from '../config/setupConfig.js';

let isRunning = false;
let retryCount = 0;
const MAX_RETRIES = 3;

export async function setupWelcomeCategory(guild) {
  if (retryCount >= MAX_RETRIES) {
    console.error('❌ Maximalanzahl an Wiederholungen erreicht. Abbruch.');
    return;
  }

  const config = setupConfig.welcome?.category;
  if (!config) return;

  let category = guild.channels.cache.get(config.ID);
  if (category?.type !== ChannelType.GuildCategory) {
    setupConfig.welcome.category.ID = null;
    saveConfig();
    category = null;
  }

  if (!category) {
    category = guild.channels.cache.find(
      (ch) => ch.name === config.NAME && ch.type === ChannelType.GuildCategory
    );

    if (category) {
      setupConfig.welcome.category.ID = category.id;
      saveConfig;
    } else {
      try {
        category = await guild.channels.create({
          name: config.NAME,
          type: ChannelType.GuildCategory,
          permissionOverwrites: [
            {
              id: guild.roles.everyone.id,
              allow: [PermissionsBitField.Flags.ViewChannel],
              deny: Object.values(PermissionsBitField.Flags).filter((flag) =>
                [
                  'SendMessages',
                  'AddReactions',
                  'AttachFiles',
                  'EmbedLinks',
                  'ManageMessages',
                  'ManageChannels',
                  'UseApplicationCommands',
                  'CreateInstantInvite',
                ].includes(flag.name)
              ),
            },
          ],
        });
        setupConfig.information.category.ID = category.id;
        saveConfig();
      } catch {
        return;
      }
    }
  }
  await setupWelcomeChannels(guild, category);
}
