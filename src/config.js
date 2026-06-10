import 'dotenv/config';

const required = [
  'DISCORD_APPLICATION_ID',
  'DISCORD_BOT_TOKEN',
  'DISCORD_PUBLIC_KEY',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
];

export function requireConfig() {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

export const config = {
  discordApplicationId: process.env.DISCORD_APPLICATION_ID,
  discordBotToken: process.env.DISCORD_BOT_TOKEN,
  discordPublicKey: process.env.DISCORD_PUBLIC_KEY,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  guildId: process.env.GUILD_ID,
  logChannelId: process.env.LOG_CHANNEL_ID,
  startChannelId: process.env.START_CHANNEL_ID,
  statsChannelId: process.env.STATS_CHANNEL_ID,
  timezone: process.env.TIMEZONE || 'Europe/Istanbul',
  port: Number(process.env.PORT || 3000),
};
