import { Client, GatewayIntentBits, Collection } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import express from 'express';
import mongoose from 'mongoose';
import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
if (!fs.existsSync(commandsPath)) {
  fs.mkdirSync(commandsPath);
}

function getAllCommandFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllCommandFiles(filePath));
    } else if (file.endsWith('.js')) {
      results.push(filePath);
    }
  }
  return results;
}

const commandFiles = getAllCommandFiles(commandsPath);
for (const filePath of commandFiles) {
  const command = await import(pathToFileURL(filePath).href);
  if (command.data && command.execute) {
    client.commands.set(command.data.name, command);
  }
}

client.once('ready', () => {
  console.log(chalk.green(`Logged in as ${client.user.tag}`));
  // Webhook server removed
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;
  try {
    console.log(chalk.yellow(`[Discord] Executing command: /${interaction.commandName} by user ${interaction.user.id}`));
    await command.execute(interaction);
    console.log(chalk.green(`[Discord] Command /${interaction.commandName} executed successfully`));
  } catch (error) {
    console.error(chalk.red(`[Discord] Error executing command /${interaction.commandName}:`), error);
    await interaction.reply({ content: 'There was an error executing this command!', ephemeral: true });
  }
});

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error(chalk.red('MONGO_URI is not set in environment variables.'));
  process.exit(1);
}
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log(chalk.blue('Connected to MongoDB')))
  .catch(err => {
    console.error(chalk.red('Failed to connect to MongoDB:'), err);
    process.exit(1);
  });

const commands = [];
for (const filePath of commandFiles) {
  const command = await import(pathToFileURL(filePath).href);
  if (command.data) {
    commands.push(command.data.toJSON());
  }
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

try {
  console.log(chalk.yellow('Started refreshing application (/) commands.'));

  // For guild-specific commands (instant, for testing)
  await rest.put(
    Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
    { body: commands },
  );

  // For global commands (may take up to 1 hour to appear)
  // await rest.put(
  //   Routes.applicationCommands(process.env.CLIENT_ID),
  //   { body: commands },
  // );

  console.log(chalk.green('Successfully reloaded application (/) commands.'));
} catch (error) {
  console.error(chalk.red('Error refreshing application (/) commands:'), error);
}

client.login(process.env.DISCORD_TOKEN);

export { client }; 