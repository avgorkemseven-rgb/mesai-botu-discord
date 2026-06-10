import 'dotenv/config';
import { config, requireConfig } from '../src/config.js';
import { discordRequest } from '../src/discord.js';

requireConfig();

const periodChoices = [
  { name: 'Bugun', value: 'gun' },
  { name: 'Bu hafta', value: 'hafta' },
  { name: 'Bu ay', value: 'ay' },
  { name: 'Tum zamanlar', value: 'tum' },
];

const commands = [
  {
    name: 'istatistik',
    description: 'Kendi veya bir kisinin mesai istatistigini gosterir.',
    options: [
      {
        name: 'donem',
        description: 'Hangi donem hesaplansin?',
        type: 3,
        required: false,
        choices: periodChoices,
      },
      {
        name: 'kullanici',
        description: 'Istatistigi gorulecek kullanici.',
        type: 6,
        required: false,
      },
    ],
  },
  {
    name: 'siralama',
    description: 'Mesai lider tablosunu gosterir.',
    options: [
      {
        name: 'donem',
        description: 'Hangi donem siralansin?',
        type: 3,
        required: false,
        choices: periodChoices,
      },
      {
        name: 'limit',
        description: 'Kac kisi listelensin? En fazla 20.',
        type: 4,
        required: false,
        min_value: 1,
        max_value: 20,
      },
    ],
  },
  {
    name: 'haftalik-lider',
    description: 'Bu haftanin mesai liderlerini gosterir.',
  },
  {
    name: 'aktifler',
    description: 'Su anda mesaide olanlari listeler.',
  },
  {
    name: 'mesai-panel',
    description: 'Mesai baslatma/bitirme panelini kanala gonderir.',
    default_member_permissions: '16',
    options: [
      {
        name: 'kanal',
        description: 'Panelin gonderilecegi kanal.',
        type: 7,
        required: false,
        channel_types: [0],
      },
    ],
  },
  {
    name: 'mesai-kapat',
    description: 'Acik kalmis kendi mesaini kapatir.',
  },
];

const route = config.guildId
  ? `/applications/${config.discordApplicationId}/guilds/${config.guildId}/commands`
  : `/applications/${config.discordApplicationId}/commands`;

await discordRequest(route, {
  method: 'PUT',
  body: JSON.stringify(commands),
});

console.log(`${commands.length} komut kaydedildi.`);
