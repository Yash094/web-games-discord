import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { sendWinnings, deductBalance, checkBalance, GameHistory } from '../../libs/onchain.js';
import { MIN_BALANCE } from '../../config.js';
import chalk from 'chalk';

const coinGif = 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif';

const cooldowns = new Map();

export const data = new SlashCommandBuilder()
  .setName('coinflip')
  .setDescription('Flip a coin and try your luck!')
  .addStringOption(option =>
    option.setName('call')
      .setDescription('Heads or tails?')
      .setRequired(true)
      .addChoices(
        { name: 'Heads', value: 'heads' },
        { name: 'Tails', value: 'tails' }
      )
  )
  .addNumberOption(option =>
    option.setName('bet')
      .setDescription('How much do you want to bet?')
      .setRequired(true)
      .setMinValue(MIN_BALANCE)
  );

function formatTokenAmount(amount) {
  // Show up to 8 decimals, no scientific notation
  return Number(amount).toLocaleString(undefined, { maximumFractionDigits: 18 });
}

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });
  const userId = interaction.user.id;
  const now = Date.now();
  const cooldown = cooldowns.get(userId);
  if (cooldown && now < cooldown) {
    const secondsLeft = Math.ceil((cooldown - now) / 1000);
    await interaction.editReply({ content: `⏳ Please wait ${secondsLeft} seconds before playing coinflip again.`, ephemeral: true });
    return;
  }
  cooldowns.set(userId, now + 30000);
  try {
    console.log(chalk.yellow('[Coinflip] Command started'));
    const user = interaction.user;
    const call = interaction.options.getString('call').toLowerCase();
    const bet = interaction.options.getNumber('bet');
    console.log(chalk.blue(`[Coinflip] User: ${interaction.user.id}, Bet: ${bet}, Call: ${call}`));
    console.log('Call:', call);
    console.log('Bet:', bet.toString());
    const hasEnough = await checkBalance(interaction.user.id, bet);
    if (!hasEnough) {
      console.log(chalk.red(`[Coinflip] Not enough balance for user ${interaction.user.id}`));
      const embed = new EmbedBuilder()
        .setTitle('❌ Insufficient Balance')
        .setDescription(`You need at least **${formatTokenAmount(bet)} tokens** to play Coinflip.`)
        .setColor(0xFF5252)
        .setFooter({ text: 'Neon Casino • Play responsibly', iconURL: user.displayAvatarURL() })
        .setTimestamp();
      await interaction.editReply({ embeds: [embed] });
      return;
    }
    if (call !== 'heads' && call !== 'tails') {
      console.log(chalk.red(`[Coinflip] Invalid call: ${call}`));
      const embed = new EmbedBuilder()
        .setTitle('❓ Invalid Call')
        .setDescription('Please choose either **Heads** or **Tails**.')
        .setColor(0xFFD700)
        .setFooter({ text: 'Neon Casino', iconURL: user.displayAvatarURL() })
        .setTimestamp();
      await interaction.editReply({ embeds: [embed] });
      return;
    }
    await deductBalance(interaction.user.id, bet);
    console.log(chalk.blue(`[Coinflip] Deducted ${bet} tokens from user ${interaction.user.id}`));
    const flippingEmbed = new EmbedBuilder()
      .setTitle('🪙 Coinflip')
      .setDescription(`Flipping the coin for **${formatTokenAmount(bet)} tokens**...`)
      .addFields(
        { name: 'Your Call', value: `**${call.charAt(0).toUpperCase() + call.slice(1)}**`, inline: true },
        { name: 'Bet', value: `**${formatTokenAmount(bet)}**`, inline: true }
      )
      .setColor(0x00b894)
      .setFooter({ text: 'Neon Casino', iconURL: user.displayAvatarURL() })
      .setTimestamp();
    await interaction.editReply({ embeds: [flippingEmbed] });
    await new Promise(res => setTimeout(res, 1200));
    const flip = Math.random() < 0.5 ? 'heads' : 'tails';
    let win = false;
    let resultEmbed;
    if (flip === call) {
      await sendWinnings(interaction.user.id, bet * 2);
      console.log(chalk.green(`[Coinflip] WIN! User: ${interaction.user.id}, Amount: ${bet * 2}`));
      win = true;
      resultEmbed = new EmbedBuilder()
        .setTitle('🟢 You Win!')
        .setDescription(`The coin landed on **${flip.charAt(0).toUpperCase() + flip.slice(1)}**!\n\nNote: The games themselves are off-chain. Only wallet management and balance changes are enforced onchain.`)
        .addFields(
          { name: 'Winnings', value: `**${formatTokenAmount(bet * 2)} tokens**`, inline: true },
          { name: 'Your Call', value: `**${call.charAt(0).toUpperCase() + call.slice(1)}**`, inline: true }
        )
        .setColor(0x00FF7F)
        .setFooter({ text: 'Web3 Discord Games • Congratulations!', iconURL: user.displayAvatarURL() })
        .setTimestamp();
      // Save win to history
      await GameHistory.create({
        userId: interaction.user.id,
        game: 'coinflip',
        bet,
        result: 'win',
        amount: bet * 2,
      });
      console.log(chalk.blue(`[Coinflip] Saved WIN to DB for user ${interaction.user.id}`));
    } else {
      console.log(chalk.red(`[Coinflip] LOSS! User: ${interaction.user.id}, Amount: ${bet}`));
      resultEmbed = new EmbedBuilder()
        .setTitle('🔴 You Lose')
        .setDescription(`The coin landed on **${flip.charAt(0).toUpperCase() + flip.slice(1)}**.\n\nNote: The games themselves are off-chain. Only wallet management and balance changes are enforced onchain.`)
        .addFields(
          { name: 'Lost', value: `**${formatTokenAmount(bet)} tokens**`, inline: true },
          { name: 'Your Call', value: `**${call.charAt(0).toUpperCase() + call.slice(1)}**`, inline: true }
        )
        .setColor(0xFF5252)
        .setFooter({ text: 'Web3 Discord Games • Try again!', iconURL: user.displayAvatarURL() })
        .setTimestamp();
      // Save loss to history
      await GameHistory.create({
        userId: interaction.user.id,
        game: 'coinflip',
        bet,
        result: 'lose',
        amount: bet,
      });
      console.log(chalk.blue(`[Coinflip] Saved LOSS to DB for user ${interaction.user.id}`));
    }
    await interaction.editReply({ embeds: [resultEmbed] });
    console.log(chalk.yellow('[Coinflip] Command finished'));
  } catch (error) {
    console.error(chalk.red('[Coinflip] Error:'), error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: 'There was an error executing this command!', ephemeral: true });
    }
  }
} 