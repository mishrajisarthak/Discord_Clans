import { Client, GatewayIntentBits, Partials, REST } from 'discord.js';

// Use a singleton to prevent multiple instances in dev/serverless
declare global {
  var discordClient: Client | undefined;
}

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

let client: Client;

if (!global.discordClient) {
  client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
    ],
    partials: [Partials.User, Partials.GuildMember],
  });

  if (DISCORD_BOT_TOKEN) {
    client.login(DISCORD_BOT_TOKEN).catch((err) => {
      console.error('Failed to login Discord Client:', err);
    });
  } else {
    console.warn('DISCORD_BOT_TOKEN is not set.');
  }

  global.discordClient = client;
} else {
  client = global.discordClient;
}

export const discordClient = client;

// Also expose a REST client for stateless operations
export const discordRest = new REST({ version: '10' }).setToken(DISCORD_BOT_TOKEN || '');
