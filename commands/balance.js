import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getBalance } from '../libs/onchain.js';

export const data = new SlashCommandBuilder()
  .setName('balance')
  .setDescription('Check your onchain wallet balance');

export async function execute(interaction) {
  try {
    const user = interaction.user;
    await interaction.deferReply({ ephemeral: true });
    const balance = await getBalance(interaction.user.id);
    const embed = new EmbedBuilder()
      .setTitle('💰 Wallet Balance')
      .setDescription('Your onchain wallet balance:')
      .addFields({ name: 'Balance', value: `**${balance} tokens**`, inline: true })
      .setColor(0x0984e3)
      .setFooter({ text: 'Neon Casino • Use /refill to top up', iconURL: user.displayAvatarURL() })
      .setTimestamp();
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error(error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: 'There was an error executing this command!', ephemeral: true });
    }
  }
} 