import { getSupabase } from './supabase.js';
import { formatDuration, getPeriodStart } from './time.js';
import { userMention } from './discord.js';

export async function getUserStats(guildId, userId, period) {
  const supabase = getSupabase();
  let query = supabase
    .from('shift_sessions')
    .select('duration_seconds, started_at, ended_at')
    .eq('guild_id', guildId)
    .eq('user_id', userId)
    .not('ended_at', 'is', null);

  const start = getPeriodStart(period);
  if (start) query = query.gte('started_at', start);

  const { data, error } = await query;
  if (error) throw error;

  const total = data.reduce((sum, row) => sum + Number(row.duration_seconds || 0), 0);
  return {
    total,
    count: data.length,
    average: data.length ? Math.round(total / data.length) : 0,
  };
}

export async function getLeaderboard(guildId, period, limit = 10) {
  const supabase = getSupabase();
  let query = supabase
    .from('shift_sessions')
    .select('user_id, duration_seconds')
    .eq('guild_id', guildId)
    .not('ended_at', 'is', null);

  const start = getPeriodStart(period);
  if (start) query = query.gte('started_at', start);

  const { data, error } = await query;
  if (error) throw error;

  const totals = new Map();
  for (const row of data) {
    totals.set(row.user_id, (totals.get(row.user_id) || 0) + Number(row.duration_seconds || 0));
  }

  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([userId, total], index) => `${index + 1}. ${userMention(userId)} - ${formatDuration(total)}`);
}

export async function getActiveUsers(guildId) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('shift_sessions')
    .select('user_id, started_at')
    .eq('guild_id', guildId)
    .is('ended_at', null)
    .order('started_at', { ascending: true });

  if (error) throw error;
  return data;
}
