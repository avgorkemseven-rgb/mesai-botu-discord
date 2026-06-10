import 'dotenv/config';
import { config, requireConfig } from '../src/config.js';
import { discordRequest } from '../src/discord.js';

requireConfig();

const periodChoices = [
  { name: 'Bugün', value: 'gün' },
  { name: 'Bu hafta', value: 'hafta' },
  { name: 'Bu ay', value: 'ay' },
  { name: 'Tüm zamanlar', value: 'tüm' },
];

const commands = [
  {
    name: 'istatistik',
    description: 'Kendi veya bir kişinin mesai istatistiğini gösterir.',
    options: [
      {
        name: 'dönem',
        description: 'Hangi dönem hesaplansın?',
        type: 3,
        required: false,
        choices: periodChoices,
      },
      {
        name: 'kullanıcı',
        description: 'İstatistiği görülecek kullanıcı.',
        type: 6,
        required: false,
      },
    ],
  },
  {
    name: 'sıralama',
    description: 'Mesai lider tablosunu gösterir.',
    options: [
      {
        name: 'dönem',
        description: 'Hangi dönem sıralansın?',
        type: 3,
        required: false,
        choices: periodChoices,
      },
      {
        name: 'limit',
        description: 'Kaç kişi listelensin? En fazla 20.',
        type: 4,
        required: false,
        min_value: 1,
        max_value: 20,
      },
    ],
  },
  {
    name: 'haftalık-lider',
    description: 'Bu haftanın mesai liderlerini gösterir.',
  },
  {
    name: 'aktifler',
    description: 'Şu anda mesaide olanları listeler.',
  },
  {
    name: 'mesai-panel',
    description: 'Mesai başlatma panelini kullanıldığı kanala gönderir.',
    default_member_permissions: '16',
  },
  {
    name: 'mesai-kapat',
    description: 'Açık kalmış kendi mesaini kapatır.',
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
