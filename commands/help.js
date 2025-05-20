import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('List all available casino and wallet commands');

export async function execute(interaction) {
  try {
    const user = interaction.user;
    await interaction.deferReply({ ephemeral: true });
    const embed = new EmbedBuilder()
      .setTitle('📖 Web3 Discord Games Help')
      .setDescription('List of available casino and wallet commands:\n\nNote: The games themselves are off-chain. Only wallet management and balance changes are enforced onchain.')
      .setColor(0x9b59b6)
      .addFields(
        { name: '/balance', value: 'Check your onchain wallet balance', inline: false },
        { name: '/refill', value: 'Refill your onchain wallet with test tokens', inline: false },
        { name: '/slots', value: 'Play the slots game', inline: false },
        { name: '/roulette', value: 'Play the roulette game', inline: false },
        { name: '/coinflip', value: 'Flip a coin and try your luck!', inline: false },
        { name: '/help', value: 'Show this help message', inline: false }
      )
      .setFooter({ text: 'Web3 Discord Games • Play responsibly', iconURL: user.displayAvatarURL() })
      .setTimestamp();
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error(error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: 'There was an error executing this command!', ephemeral: true });
    }
  }
} 