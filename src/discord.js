import { config, requireConfig } from './config.js';

const DISCORD_API = 'https://discord.com/api/v10';

export function userMention(userId) {
  return `<@${userId}>`;
}

export async function discordRequest(path, options = {}) {
  requireConfig();
  const response = await fetch(`${DISCORD_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bot ${config.discordBotToken}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Discord API ${response.status}: ${body}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

export async function sendChannelMessage(channelId, payload) {
  if (!channelId) return null;
  return discordRequest(`/channels/${channelId}/messages`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function sendLog(content) {
  return sendChannelMessage(config.logChannelId, { content, allowed_mentions: { parse: ['users'] } });
}

export function startButtonRow() {
  return {
    type: 1,
    components: [
      {
        type: 2,
        custom_id: 'shift_start',
        label: 'Mesai Başlat',
        style: 3,
      },
    ],
  };
}

export function stopButtonRow() {
  return {
    type: 1,
    components: [
      {
        type: 2,
        custom_id: 'shift_stop',
        label: 'Mesai Bitir',
        style: 4,
      },
    ],
  };
}

export function panelPayload() {
  return {
    content: '**Mesai Paneli**\nMesaini başlatmak için aşağıdaki butonu kullan. Başlattıktan sonra mesai bitirme butonu sana özel olarak görünecek.',
    components: [startButtonRow()],
  };
}
