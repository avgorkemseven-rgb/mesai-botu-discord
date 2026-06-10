import { createClient } from '@supabase/supabase-js';
import { config, requireConfig } from './config.js';

let client;

export function getSupabase() {
  requireConfig();
  if (!client) {
    client = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
      auth: { persistSession: false },
    });
  }
  return client;
}
