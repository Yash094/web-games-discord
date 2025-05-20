import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { shopRoles } from '../../config.js';

export const data = new SlashCommandBuilder()
  .setName('shop')
  .setDescription('View the shop and available roles');

export async function execute(interaction) {
  const user = interaction.user;
  const embed = new EmbedBuilder()
    .setTitle('🛒 Web3 Discord Games Role Shop')
    .setDescription('Purchase exclusive roles with your onchain tokens!\n\nNote: The games themselves are off-chain. Only wallet management and balance changes are enforced onchain.')
    .setColor(0xFFD700)
    .setFooter({ text: 'Web3 Discord Games • Use /buyrole to purchase', iconURL: user.displayAvatarURL() })
    .setTimestamp();
  for (const role of shopRoles) {
    embed.addFields({
      name: `🎲 ${role.name}`,
      value: `Price: **${role.price} tokens**${role.limitedTime ? `\n⏳ Limited: ${role.limitedTime} min` : ''}`,
      inline: false,
    });
  }
  await interaction.reply({ embeds: [embed], ephemeral: true });
} 