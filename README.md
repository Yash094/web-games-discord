# Web3 Discord Games

<!-- Place your project logo and screenshots here -->

---

## About

**Web3 Discord Games** is a modular Discord bot that brings casino-style games to your server, with onchain wallet integration and real token balances. All wallet management and balance changes are enforced onchain using thirdweb Engine Cloud, but the games themselves are off-chain for instant, fun gameplay.

> **Note:** The games themselves are off-chain. Only wallet management and balance changes are enforced onchain.

---

## Features
- Onchain wallet integration (thirdweb Engine Cloud)
- Play slots, coinflip, and more (off-chain games, onchain balances)
- Role shop with onchain token payments
- User-friendly, modern Discord UX
- MongoDB for persistent user and game data

---

## Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/Yash094/web-games-discord
cd web-games-discord
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory with the following:

```
DISCORD_TOKEN=your_discord_bot_token
CLIENT_ID=your_discord_application_client_id
GUILD_ID=your_discord_guild_id
MONGO_URI=your_mongodb_connection_string
ENGINE_VAULT_SECRET=your_thirdweb_engine_vault_secret
ENGINE_ACCESS_TOKEN=your_thirdweb_engine_access_token
THIRDWEB_SECRET_KEY=your_thirdweb_secret_key
```

#### Where to get these values:
- **DISCORD_TOKEN, CLIENT_ID, GUILD_ID:**
  - Go to the [Discord Developer Portal](https://discord.com/developers/applications)
  - Create a new application and bot, copy the token and client ID
  - Right-click your server in Discord and "Copy Server ID" for GUILD_ID
- **MONGO_URI:**
  - Create a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster or use your own MongoDB instance
- **ENGINE_VAULT_SECRET, ENGINE_ACCESS_TOKEN, THIRDWEB_SECRET_KEY:**
  - Go to the [thirdweb dashboard](https://thirdweb.com/dashboard)
  - Create a new project (this will set up Engine Cloud for you)
  - In the Engine section, get your Vault Admin Key and Access Tokens
  - Get your thirdweb secret key from the dashboard as well

---

### 4. Engine Cloud Setup

1. **Create a thirdweb project** — this will include a ready-to-go Engine server for you to start making API calls on.
2. **Get your Vault Admin Key + Access Tokens** — via the dashboard. Learn more about Vault [here](https://portal.thirdweb.com/engine/vault/overview).
3. **Create a server wallet** — in the Engine dashboard, create a wallet and label it `TREASURY WALLET`. Copy the address and paste it into your `config.js` as `TREASURY_WALLET`.

---

### 5. Configure `config.js`

Open `config.js` and fill out the following fields:

```js
export const MIN_BALANCE = 0.000000000000000001; // Minimum bet amount

export const shopRoles = [
  { name: 'VIP', roleId: 'YOUR_ROLE_ID', price: 0.0000000001, limitedTime: null },
  // Add more roles as needed
];

export const TREASURY_WALLET = 'YOUR_TREASURY_WALLET_ADDRESS';
```
- **MIN_BALANCE:** Minimum bet amount for games
- **shopRoles:** List of purchasable roles (get role IDs from your Discord server)
- **TREASURY_WALLET:** The address of your Engine server wallet labeled `TREASURY WALLET`

---

### 6. Run the Bot
```bash
npm start
```

---

## Support
For help with Engine Cloud, see the [thirdweb Engine Cloud changelog](https://blog.thirdweb.com/changelog/introducing-engine-cloud/) and [docs](https://portal.thirdweb.com/engine/overview).

For Discord bot issues, open an issue in this repo or reach out to the maintainers.

---

<!-- Add images/screenshots below as needed -->

# Onchain Casino Discord Bot

A Discord bot for casino-style games with onchain wallet integration. Built with [discord.js](https://discord.js.org/) v14+.

## Features
- Onchain wallet balance checking
- Wallet refill
- Casino games: Slots, Roulette, Coin Flip
- Modular command structure

## Commands
- `/balance` — Check your onchain wallet balance
- `/refill` — Refill your onchain wallet with test tokens
- `/slots` — Play the slots game
- `/roulette` — Play the roulette game
- `/coinflip` — Flip a coin and try your luck!
- `/help` — Show help message
