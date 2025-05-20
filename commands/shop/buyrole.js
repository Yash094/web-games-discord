import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { deductBalance, checkBalance } from '../../libs/onchain.js';
import { shopRoles } from '../../config.js';
import chalk from 'chalk';

export const data = new SlashCommandBuilder()
  .setName('buyrole')
  .setDescription('Purchase a special role from the shop')
  .addStringOption(option =>
    option.setName('role')
      .setDescription('Role to purchase')
      .setRequired(true)
      .addChoices(...shopRoles.map(r => ({ name: r.name, value: r.roleId })))
  );

export async function execute(interaction) {
  console.log(chalk.yellow('[BuyRole] Command started'));
  const user = interaction.user;
  const roleId = interaction.options.getString('role');
  console.log(chalk.blue(`[BuyRole] User: ${user.id}, RoleId: ${roleId}`));
  const roleItem = shopRoles.find(r => r.roleId === roleId);
  if (!roleItem) {
    console.log(chalk.red(`[BuyRole] Role not found in shop for roleId: ${roleId}`));
    const embed = new EmbedBuilder()
      .setTitle('❌ Role Not Found')
      .setDescription('Role not found in shop.\n\nNote: The games themselves are off-chain. Only wallet management and balance changes are enforced onchain.')
      .setColor(0xFF5252)
      .setFooter({ text: 'Web3 Discord Games', iconURL: user.displayAvatarURL() })
      .setTimestamp();
    await interaction.reply({ embeds: [embed], ephemeral: true });
    return;
  }
  // Check balance
  const hasEnough = await checkBalance(interaction.user.id, roleItem.price);
  if (!hasEnough) {
    console.log(chalk.red(`[BuyRole] Not enough balance for user ${user.id}`));
    const embed = {
      title: '❌ Insufficient Balance',
      description: `You need at least **${roleItem.price} tokens** to buy this role.`,
      color: 0xFF5252,
      footer: { text: 'Web3 Discord Games • Play more to earn!', icon_url: user.displayAvatarURL() },
      timestamp: new Date()
    };
    await interaction.reply({ embeds: [embed], ephemeral: true });
    return;
  }
  // Deduct tokens
  await deductBalance(interaction.user.id, roleItem.price);
  console.log(chalk.blue(`[BuyRole] Deducted ${roleItem.price} tokens from user ${user.id}`));
  // Assign role
  const member = await interaction.guild.members.fetch(interaction.user.id);
  if (member.roles.cache.has(roleId)) {
    console.log(chalk.yellow(`[BuyRole] User ${user.id} already owns role ${roleId}`));
    const embed = new EmbedBuilder()
      .setTitle('⚠️ Already Owned')
      .setDescription(`You already have the **${roleItem.name}** role!\n\nNote: The games themselves are off-chain. Only wallet management and balance changes are enforced onchain.`)
      .setColor(0xFFD700)
      .setFooter({ text: 'Web3 Discord Games', iconURL: user.displayAvatarURL() })
      .setTimestamp();
    await interaction.reply({ embeds: [embed], ephemeral: true });
    return;
  }
  await member.roles.add(roleId);
  console.log(chalk.green(`[BuyRole] Assigned role ${roleId} to user ${user.id}`));
  let embed = {
    title: '✅ Role Purchased',
    description: `You have purchased the **${roleItem.name}** role!\n\nNote: The games themselves are off-chain. Only wallet management and balance changes are enforced onchain.`,
    color: 0x00FF7F,
    fields: [
      { name: 'Price', value: `**${roleItem.price} tokens**`, inline: true },
      { name: 'Role', value: `<@&${roleId}>`, inline: true }
    ],
    footer: { text: 'Web3 Discord Games', icon_url: user.displayAvatarURL() },
    timestamp: new Date()
  };
  // Handle limited time
  if (roleItem.limitedTime) {
    setTimeout(async () => {
      try {
        await member.roles.remove(roleId);
        await interaction.user.send(`Your **${roleItem.name}** role has expired.`);
      } catch {}
    }, roleItem.limitedTime * 60 * 1000);
    embed.fields.push({ name: '⏳ Expiry', value: `${roleItem.limitedTime} minutes`, inline: true });
    embed.description += `\nThis role will expire in ${roleItem.limitedTime} minutes.`;
  }
  await interaction.reply({ embeds: [embed], ephemeral: true });
}

try {
  // ... existing code ...
} catch (error) {
  console.error(chalk.red('[BuyRole] Error:'), error);
  // ... existing code ...
}

// ... existing code ... 