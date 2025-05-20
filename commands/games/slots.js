import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { sendWinnings, deductBalance, checkBalance, GameHistory } from '../../libs/onchain.js';
import { MIN_BALANCE } from '../../config.js';
import chalk from 'chalk';

const symbols = ['🍒', '🍋', '🍊', '🍉', '⭐', '🔔'];
const cooldowns = new Map();

export const data = new SlashCommandBuilder()
  .setName('slots')
  .setDescription('Play the slots game')
  .addNumberOption(option =>
    option.setName('bet')
      .setDescription('How much do you want to bet?')
      .setRequired(true)
      .setMinValue(MIN_BALANCE)
  );

function randomSpin() {
  return [
    symbols[Math.floor(Math.random() * symbols.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
    symbols[Math.floor(Math.random() * symbols.length)]
  ];
}

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
    await interaction.editReply({ content: `⏳ Please wait ${secondsLeft} seconds before playing slots again.`, ephemeral: true });
    return;
  }
  cooldowns.set(userId, now + 30000);
  try {
    console.log(chalk.yellow('[Slots] Command started'));
    const user = interaction.user;
    const bet = interaction.options.getNumber('bet');
    const hasEnough = await checkBalance(interaction.user.id, bet);
    if (!hasEnough) {
      const embed = new EmbedBuilder()
        .setTitle('❌ Insufficient Balance')
        .setDescription(`You need at least **${formatTokenAmount(bet)} tokens** to play Slots.`)
        .setColor(0xFF5252)
        .setFooter({ text: 'Neon Casino • Play responsibly', iconURL: user.displayAvatarURL() })
        .setTimestamp();
      await interaction.editReply({ embeds: [embed] });
      return;
    }
    await deductBalance(interaction.user.id, bet);
    let spinEmbed = new EmbedBuilder()
      .setTitle('🎰 Neon Slots')
      .setDescription('Spinning the reels...')
      .addFields(
        { name: 'Bet', value: `**${formatTokenAmount(bet)}**`, inline: true },
        { name: 'Player', value: `<@${user.id}>`, inline: true }
      )
      .setColor(0xFFD700)
      .setFooter({ text: 'Neon Casino', iconURL: user.displayAvatarURL() })
      .setTimestamp();
    await interaction.editReply({ embeds: [spinEmbed] });
    let spinResult = '';
    for (let i = 0; i < 4; i++) {
      const spin = randomSpin();
      spinResult = `| ${spin.join(' | ')} |`;
      spinEmbed.setDescription(`**${spinResult}**\nSpinning...`);
      await new Promise(res => setTimeout(res, 400));
      await interaction.editReply({ embeds: [spinEmbed] });
    }
    const finalSpin = randomSpin();
    const result = `| ${finalSpin.join(' | ')} |`;
    let win = false;
    let resultEmbed;
    if (finalSpin[0] === finalSpin[1] && finalSpin[1] === finalSpin[2]) {
      await sendWinnings(interaction.user.id, bet * 2);
      win = true;
      resultEmbed = new EmbedBuilder()
        .setTitle('🎉 JACKPOT!')
        .setDescription(`**${result}**\n\nNote: The games themselves are off-chain. Only wallet management and balance changes are enforced onchain.`)
        .addFields(
          { name: 'Winnings', value: `**${formatTokenAmount(bet * 2)} tokens**`, inline: true },
          { name: 'Player', value: `<@${user.id}>`, inline: true }
        )
        .setColor(0x00FF7F)
        .setFooter({ text: 'Web3 Discord Games • Congratulations!', iconURL: user.displayAvatarURL() })
        .setTimestamp();
      // Save win to history
      await GameHistory.create({
        userId: interaction.user.id,
        game: 'slots',
        bet,
        result: 'win',
        amount: bet * 2,
      });
    } else {
      resultEmbed = new EmbedBuilder()
        .setTitle('😢 No Win')
        .setDescription(`**${result}**\n\nNote: The games themselves are off-chain. Only wallet management and balance changes are enforced onchain.`)
        .addFields(
          { name: 'Lost', value: `**${formatTokenAmount(bet)} tokens**`, inline: true },
          { name: 'Player', value: `<@${user.id}>`, inline: true }
        )
        .setColor(0xFF5252)
        .setFooter({ text: 'Web3 Discord Games • Try again!', iconURL: user.displayAvatarURL() })
        .setTimestamp();
      // Save loss to history
      await GameHistory.create({
        userId: interaction.user.id,
        game: 'slots',
        bet,
        result: 'lose',
        amount: bet,
      });
    }
    await interaction.editReply({ embeds: [resultEmbed] });
    console.log('Slots command finished');
  } catch (error) {
    console.error(error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: 'There was an error executing this command!', ephemeral: true });
    }
  }
} 