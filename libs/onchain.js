import 'dotenv/config';
import mongoose from 'mongoose';
import fetch from 'node-fetch';
import { getWalletBalance } from 'thirdweb/wallets';
import { defineChain } from 'thirdweb/chains';
import { createThirdwebClient } from 'thirdweb';
import { TREASURY_WALLET } from '../config.js';
import chalk from 'chalk';

const ENGINE_ACCESS_TOKEN = process.env.ENGINE_ACCESS_TOKEN;
const THIRDWEB_SECRET_KEY = process.env.THIRDWEB_SECRET_KEY;
const ENGINE_URL = 'https://engine.thirdweb.com/v1/accounts';
const ENGINE_TX_URL = 'https://engine.thirdweb.com/v1/write/transaction';
const CHAIN = 8453; // BASE chain ID
const CLIENT_ID = process.env.CLIENT_ID;
const client = createThirdwebClient({ clientId: CLIENT_ID });

// Mongoose schema and model for user wallets
const userWalletSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  address: { type: String, required: true },
  smartAccountAddress: { type: String },
});
const UserWallet = mongoose.models.UserWallet || mongoose.model('UserWallet', userWalletSchema);

// Mongoose schema and model for game history
const gameHistorySchema = new mongoose.Schema({
  userId: { type: String, required: true },
  game: { type: String, required: true }, // 'slots' or 'coinflip'
  bet: { type: Number, required: true },
  result: { type: String, required: true }, // 'win' or 'lose'
  amount: { type: Number, required: true }, // amount won or lost
  timestamp: { type: Date, default: Date.now },
});
const GameHistory = mongoose.models.GameHistory || mongoose.model('GameHistory', gameHistorySchema);

function ethToWeiString(amount) {
  // amount can be a string or number (e.g., "1e-8")
  const wei = BigInt(Math.floor(Number(amount) * 1e18));
  if (wei < 1n) throw new Error('Bet too small: must be at least 1 wei');
  return wei.toString();
}

export async function getOrCreateWallet(userId) {
  let wallet = await UserWallet.findOne({ userId });
  if (wallet) {
    console.log(chalk.blue(`[DB] Found wallet for user ${userId}`));
    return wallet;
  }
  // Create wallet via Thirdweb Engine
  console.log(chalk.yellow(`[Engine] Creating wallet for user ${userId}`));
  const res = await fetch(ENGINE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Secret-Key': THIRDWEB_SECRET_KEY,
      'x-vault-access-token': ENGINE_ACCESS_TOKEN,
    },
    body: JSON.stringify({ label: userId }),
  });
  const data = await res.json();
  console.log(data);
  if (!data.result || !data.result.address) {
    console.error(chalk.red('[Engine] Failed to create wallet'), data);
    throw new Error('Failed to create wallet');
  }
  wallet = await UserWallet.create({
    userId,
    address: data.result.address,
    smartAccountAddress: data.result.smartAccountAddress,
  });
  console.log(chalk.green(`[DB] Created wallet for user ${userId}`));
  return wallet;
}

export async function checkBalance(userId, minAmount) {
  const wallet = await getOrCreateWallet(userId);
  const balance = await getWalletBalance({
    address: wallet.smartAccountAddress,    
    client, // TODO: Use your actual thirdweb client
    chain: defineChain(CHAIN),
  });
  console.log(chalk.blue(`[Onchain] Checked balance for user ${userId}: ${balance.value}`));
  return parseFloat(balance.value) >= minAmount;
}

export async function addBalance(userId, amount, interaction = null) {
  const wallet = await getOrCreateWallet(userId);
  // Use the thirdweb.com/pay URL directly, amount in wei
  const url = `https://thirdweb.com/pay?chainId=8453` +
    `&recipientAddress=${wallet.address}` +
    `&tokenAddress=0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE` +
    `&amount=${ethToWeiString(amount)}` +
    `&clientId=d391b93f5f62d9c15f67142e43841acc`;
  if (interaction) {
    await interaction.user.send(
      `To top up your casino balance, please complete the payment here:\n${url}`
    );
  }
  console.log(chalk.green(`[Onchain] Prompted user ${userId} to top up ${amount} tokens: ${url}`));
}

async function sendEngineTransaction({ from, to, amount }) {
  console.log(chalk.yellow(`[Engine] Sending transaction from ${from} to ${to} for ${amount} tokens`));
  const res = await fetch(ENGINE_TX_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Secret-Key': THIRDWEB_SECRET_KEY,
      'x-vault-access-token': ENGINE_ACCESS_TOKEN,
    },
    body: JSON.stringify({
      params: [
        {
          to,
          data: '0x',
          value: ethToWeiString(amount),
        },
      ],
      executionOptions: {
        chainId: CHAIN.toString(),
        from,
      },
    }),
  });
  return res.json();
}

export async function sendWinnings(userId, amount, interaction = null) {
  const wallet = await getOrCreateWallet(userId);
  const data = await sendEngineTransaction({
    from: TREASURY_WALLET,
    to: wallet.address,
    amount,
  });
  if (interaction) {
    await interaction.user.send(
      `Your winnings of ${amount} tokens have been sent to your wallet: ${wallet.address}\nTransaction result: ${JSON.stringify(data)}`
    );
  }
  console.log(chalk.green(`[Onchain] Sent winnings of ${amount} tokens from treasury to user ${userId} (${wallet.address})`));
}

export async function deductBalance(userId, amount) {
  const wallet = await getOrCreateWallet(userId);
  const data = await sendEngineTransaction({
    from: wallet.address,
    to: TREASURY_WALLET,
    amount,
  });
  console.log(chalk.yellow(`[Onchain] Deducted ${amount} tokens from user ${userId} (${wallet.address}) to treasury`));
}

export async function getBalance(userId) {
  const wallet = await getOrCreateWallet(userId);
  
  const balance = await getWalletBalance({
    address: wallet.smartAccountAddress,
    client,
    chain: defineChain(CHAIN),
  });
 
  console.log(chalk.blue(`[Onchain] Got balance for user ${userId}: ${balance.displayValue}`));
  return balance.displayValue;
}

export { GameHistory }; 