import { InteractionResponseType, InteractionType, verifyKey } from 'discord-interactions';
import { config } from './config.js';
import { panelPayload, sendLog, startButtonRow, stopButtonRow, userMention } from './discord.js';
import { getSupabase } from './supabase.js';
import { formatDateTime, formatDuration, periodLabel } from './time.js';
import { getActiveUsers, getLeaderboard, getUserStats } from './stats.js';

const EPHEMERAL = 1 << 6;

function json(statusCode, body) {
  return { statusCode, body };
}

function interactionResponse(type, data) {
  return json(200, { type, data });
}

function ephemeral(content, components = []) {
  return interactionResponse(InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE, {
    content,
    components,
    flags: EPHEMERAL,
  });
}

function optionValue(interaction, name, fallback) {
  return interaction.data?.options?.find((option) => option.name === name)?.value ?? fallback;
}

function firstOptionValue(interaction, names, fallback) {
  for (const name of names) {
    const value = optionValue(interaction, name);
    if (value !== undefined) return value;
  }
  return fallback;
}

function guildIdOf(interaction) {
  return interaction.guild_id || config.guildId;
}

function assertStatsChannel(interaction) {
  if (!config.statsChannelId) return null;
  if (interaction.channel_id === config.statsChannelId) return null;
  return `Bu komutları <#${config.statsChannelId}> kanalında kullanmalısın.`;
}

async function startShift(interaction) {
  const supabase = getSupabase();
  const guildId = guildIdOf(interaction);
  const userId = interaction.member?.user?.id || interaction.user?.id;

  const { data: active, error: activeError } = await supabase
    .from('shift_sessions')
    .select('id, started_at')
    .eq('guild_id', guildId)
    .eq('user_id', userId)
    .is('ended_at', null)
    .maybeSingle();

  if (activeError) throw activeError;
  if (active) {
    return ephemeral(
      `**Zaten mesaidesin.**\nBaşlangıç: ${formatDateTime(active.started_at)}`,
      [stopButtonRow()],
    );
  }

  const { data, error } = await supabase
    .from('shift_sessions')
    .insert({ guild_id: guildId, user_id: userId })
    .select('started_at')
    .single();

  if (error) throw error;

  await sendLog(`${userMention(userId)} mesaiye başladı. Başlangıç: ${formatDateTime(data.started_at)}`);
  return ephemeral(
    `**Mesain başladı.**\nBaşlangıç: ${formatDateTime(data.started_at)}`,
    [stopButtonRow()],
  );
}

async function stopShift(interaction) {
  const supabase = getSupabase();
  const guildId = guildIdOf(interaction);
  const userId = interaction.member?.user?.id || interaction.user?.id;

  const { data: active, error: activeError } = await supabase
    .from('shift_sessions')
    .select('id, started_at')
    .eq('guild_id', guildId)
    .eq('user_id', userId)
    .is('ended_at', null)
    .maybeSingle();

  if (activeError) throw activeError;
  if (!active) {
    return ephemeral('**Açık mesain yok.**\nÖnce mesai başlatmalısın.', [startButtonRow()]);
  }

  const endedAt = new Date();
  const durationSeconds = Math.max(0, Math.floor((endedAt - new Date(active.started_at)) / 1000));
  const { error } = await supabase
    .from('shift_sessions')
    .update({ ended_at: endedAt.toISOString(), duration_seconds: durationSeconds })
    .eq('id', active.id);

  if (error) throw error;

  await sendLog(`${userMention(userId)} mesaiyi bitirdi. Süre: ${formatDuration(durationSeconds)}`);
  return ephemeral(`**Mesain kapatıldı.**\nToplam süre: ${formatDuration(durationSeconds)}`, [startButtonRow()]);
}

async function commandStats(interaction) {
  const channelError = assertStatsChannel(interaction);
  if (channelError) {
    return ephemeral(channelError);
  }

  const userId = firstOptionValue(interaction, ['kullanıcı', 'kullanici'], interaction.member?.user?.id || interaction.user?.id);
  const period = firstOptionValue(interaction, ['dönem', 'donem'], 'hafta');
  const stats = await getUserStats(guildIdOf(interaction), userId, period);

  return ephemeral(
      `**${periodLabel(period)} Mesai İstatistiği**\n` +
      `Kişi: ${userMention(userId)}\n` +
      `Toplam: **${formatDuration(stats.total)}**\n` +
      `Mesai sayısı: **${stats.count}**\n` +
      `Ortalama: **${formatDuration(stats.average)}**`,
  );
}

async function commandLeaderboard(interaction) {
  const channelError = assertStatsChannel(interaction);
  if (channelError) {
    return ephemeral(channelError);
  }

  const period = firstOptionValue(interaction, ['dönem', 'donem'], 'hafta');
  const limit = Math.min(Number(optionValue(interaction, 'limit', 10)), 20);
  const rows = await getLeaderboard(guildIdOf(interaction), period, limit);
  return ephemeral(`**${periodLabel(period)} Sıralama**\n${rows.length ? rows.join('\n') : 'Henüz tamamlanmış mesai yok.'}`);
}

async function commandActive(interaction) {
  const rows = await getActiveUsers(guildIdOf(interaction));
  const content = rows.length
    ? rows.map((row) => `${userMention(row.user_id)} — ${formatDateTime(row.started_at)} tarihinden beri mesaide`).join('\n')
    : 'Şu anda mesaide olan kimse yok.';

  return ephemeral(`**Aktif Mesailer**\n${content}`);
}

async function commandPanel(interaction) {
  const targetChannelId = optionValue(interaction, 'kanal', config.startChannelId);
  if (targetChannelId && targetChannelId !== interaction.channel_id) {
    return ephemeral(
      `Paneli <#${targetChannelId}> kanalına göndermek için terminalden \`npm run panel\` çalıştır. ` +
        'Discord zaman aşımına takılmamak için slash komutu paneli yalnızca kullanıldığı kanala anında gönderir.',
    );
  }

  return interactionResponse(InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE, panelPayload());
}

async function commandClose(interaction) {
  const userId = interaction.member?.user?.id || interaction.user?.id;
  return stopShift({
    ...interaction,
    member: { ...interaction.member, user: { ...interaction.member?.user, id: userId } },
  });
}

async function routeCommand(interaction) {
  const name = interaction.data?.name;
  if (name === 'istatistik') return commandStats(interaction);
  if (name === 'siralama' || name === 'sıralama') return commandLeaderboard(interaction);
  if (name === 'haftalik-lider' || name === 'haftalık-lider') {
    return commandLeaderboard({ ...interaction, data: { ...interaction.data, options: [{ name: 'dönem', value: 'hafta' }] } });
  }
  if (name === 'aktifler') return commandActive(interaction);
  if (name === 'mesai-panel') return commandPanel(interaction);
  if (name === 'mesai-kapat') return commandClose(interaction);

  return ephemeral('Bilinmeyen komut.');
}

export async function handleInteraction({ headers, rawBody }) {
  const signature = headers['x-signature-ed25519'];
  const timestamp = headers['x-signature-timestamp'];
  if (!signature || !timestamp || !config.discordPublicKey) {
    return json(401, { error: 'Bad request signature' });
  }

  const isValidRequest = await verifyKey(rawBody, signature, timestamp, config.discordPublicKey);

  if (!isValidRequest) return json(401, { error: 'Bad request signature' });

  const interaction = JSON.parse(rawBody);

  try {
    if (interaction.type === InteractionType.PING) {
      return interactionResponse(InteractionResponseType.PONG);
    }

    if (interaction.type === InteractionType.MESSAGE_COMPONENT) {
      if (interaction.data?.custom_id === 'shift_start') return startShift(interaction);
      if (interaction.data?.custom_id === 'shift_stop') return stopShift(interaction);
    }

    if (interaction.type === InteractionType.APPLICATION_COMMAND) {
      return routeCommand(interaction);
    }

    return ephemeral('Bu etkileşim desteklenmiyor.');
  } catch (error) {
    console.error(error);
    return ephemeral('Bir hata oluştu. Logları kontrol et.');
  }
}
