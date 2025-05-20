import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { GameHistory } from '../../libs/onchain.js';
import chalk from 'chalk';

export const data = new SlashCommandBuilder()
  .setName('history')
  .setDescription('Show your combined Neon Casino game history and stats');

function formatTokenAmount(amount) {
  return Number(amount).toLocaleString(undefined, { maximumFractionDigits: 18 });
}

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });
  console.log(chalk.yellow('[History] Command started'));
  const userId = interaction.user.id;
  const history = await GameHistory.find({ userId });
  console.log(chalk.blue(`[History] Loaded ${history.length} records from DB for user ${userId}`));
  let slots = { wins: 0, losses: 0, earned: 0, lost: 0 };
  let coinflip = { wins: 0, losses: 0, earned: 0, lost: 0 };
  for (const entry of history) {
    if (entry.game === 'slots') {
      if (entry.result === 'win') {
        slots.wins++;
        slots.earned += entry.amount;
      } else {
        slots.losses++;
        slots.lost += entry.amount;
      }
    } else if (entry.game === 'coinflip') {
      if (entry.result === 'win') {
        coinflip.wins++;
        coinflip.earned += entry.amount;
      } else {
        coinflip.losses++;
        coinflip.lost += entry.amount;
      }
    }
  }
  const totalWins = slots.wins + coinflip.wins;
  const totalLosses = slots.losses + coinflip.losses;
  const totalEarned = slots.earned + coinflip.earned;
  const totalLost = slots.lost + coinflip.lost;
  const embed = new EmbedBuilder()
    .setTitle('🎲 Web3 Discord Games History')
    .setDescription('Your combined stats for all games:\n\nNote: The games themselves are off-chain. Only wallet management and balance changes are enforced onchain.')
    .addFields(
      { name: 'Slots Wins', value: `${slots.wins}`, inline: true },
      { name: 'Slots Losses', value: `${slots.losses}`, inline: true },
      { name: 'Slots Earned', value: `**${formatTokenAmount(slots.earned)} tokens**`, inline: true },
      { name: 'Slots Lost', value: `**${formatTokenAmount(slots.lost)} tokens**`, inline: true },
      { name: 'Coinflip Wins', value: `${coinflip.wins}`, inline: true },
      { name: 'Coinflip Losses', value: `${coinflip.losses}`, inline: true },
      { name: 'Coinflip Earned', value: `**${formatTokenAmount(coinflip.earned)} tokens**`, inline: true },
      { name: 'Coinflip Lost', value: `**${formatTokenAmount(coinflip.lost)} tokens**`, inline: true },
      { name: 'Total Wins', value: `${totalWins}`, inline: true },
      { name: 'Total Losses', value: `${totalLosses}`, inline: true },
      { name: 'Total Earned', value: `**${formatTokenAmount(totalEarned)} tokens**`, inline: true },
      { name: 'Total Lost', value: `**${formatTokenAmount(totalLost)} tokens**`, inline: true }
    )
    .setColor(0x00b894)
    .setFooter({ text: 'Web3 Discord Games', iconURL: interaction.user.displayAvatarURL() })
    .setTimestamp();
  console.log(chalk.green(`[History] Stats calculated for user ${userId}`));
  await interaction.editReply({ embeds: [embed] });
}

try {
  // ... existing code ...
} catch (error) {
  console.error(chalk.red('[History] Error:'), error);
  // ... existing code ...
} 