import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getOrCreateWallet } from '../libs/onchain.js';

export const data = new SlashCommandBuilder()
  .setName('refill')
  .setDescription('Refill your onchain wallet with tokens')
  .addIntegerOption(option =>
    option.setName('amount')
      .setDescription('Amount of tokens to add')
      .setRequired(true)
  );

function ethToWeiString(amount) {
  // amount can be a string or number (e.g., "1e-8")
  const wei = BigInt(Math.floor(Number(amount) * 1e18));
  if (wei < 1n) throw new Error('Bet too small: must be at least 1 wei');
  return wei.toString();
}

export async function execute(interaction) {
  try {
    const user = interaction.user;
    await interaction.deferReply();
    const amount = interaction.options.getInteger('amount');
    
    // Get or create wallet for the user
    const wallet = await getOrCreateWallet(user.id);
    
    // Generate the thirdweb.com/pay URL directly
    const url = `https://thirdweb.com/pay?chainId=8453` +
      `&recipientAddress=${wallet.address}` +
      `&tokenAddress=0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE` +
      `&amount=${ethToWeiString(amount)}` +
      `&clientId=d391b93f5f62d9c15f67142e43841acc`;
    
    const embed = new EmbedBuilder()
      .setTitle('💸 Refill Your Wallet')
      .setDescription(`Click the link below to add tokens to your casino wallet:`)
      .addFields(
        { name: 'Amount', value: `**${amount} tokens**`, inline: true },
        { name: 'Payment Link', value: `[🔗 **Pay with thirdweb**](${url})`, inline: false }
      )
      .setColor(0x00b894)
      .setFooter({ text: 'Web3 Discord Games • Play responsibly', iconURL: user.displayAvatarURL() })
      .setTimestamp();
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error(error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: 'There was an error executing this command!' });
    }
  }
} 
