import { EmbedBuilder } from 'discord.js';
import { getTranslation } from '../utils/translationHandler.js';

export function createRuleEmbeds() {
  const embedData = getTranslation('rules', 'embed');
  if (!embedData) return [];

  return [
    new EmbedBuilder()
      .setTitle(embedData.header.title)
      .setColor(embedData.header.color),

    ...embedData.sections.map((section) =>
      new EmbedBuilder()
        .setTitle(section.title)
        .setDescription(section.description)
        .setColor(section.color)
    ),

    new EmbedBuilder()
      .setTitle(embedData.footer.title)
      .setColor(embedData.footer.color),
  ];
}
