import 'dotenv/config';
import { config, requireConfig } from '../src/config.js';
import { panelPayload, sendChannelMessage } from '../src/discord.js';

requireConfig();

if (!config.startChannelId) {
  throw new Error('START_CHANNEL_ID gerekli.');
}

await sendChannelMessage(config.startChannelId, panelPayload());
console.log('Mesai paneli gonderildi.');
