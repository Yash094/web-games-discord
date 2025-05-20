import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { addBalance } from '../libs/onchain.js';

export const data = new SlashCommandBuilder()
  .setName('refill')
  .setDescription('Refill your onchain wallet with tokens')
  .addIntegerOption(option =>
    option.setName('amount')
      .setDescription('Amount of tokens to add')
      .setRequired(true)
  );

export async function execute(interaction) {
  try {
    const user = interaction.user;
    await interaction.deferReply({ ephemeral: true });
    const amount = interaction.options.getInteger('amount');
    await addBalance(interaction.user.id, amount, interaction);
    const embed = new EmbedBuilder()
      .setTitle('💸 Refill Requested')
      .setDescription(`Check your DMs for a link to refill your wallet!`)
      .addFields({ name: 'Amount', value: `**${amount} tokens**`, inline: true })
      .setColor(0x00b894)
      .setFooter({ text: 'Neon Casino • Use /balance to check your funds', iconURL: user.displayAvatarURL() })
      .setTimestamp();
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error(error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: 'There was an error executing this command!', ephemeral: true });
    }
  }
} 