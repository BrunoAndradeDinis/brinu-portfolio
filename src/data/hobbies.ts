import { t, type Locale, type Localized } from './localized.ts';
import { STICKERS } from './stickers.ts';

export type HobbyId = 'animes' | 'musica' | 'violao' | 'skate' | 'jogos' | 'natureza';

export interface HobbyTag {
  readonly code: Localized<string>;
  readonly label: Localized<string>;
}

export interface HobbyStat extends HobbyTag {
  readonly value: number;
}

export type HobbyStats = readonly [HobbyStat, HobbyStat, HobbyStat, HobbyStat, HobbyStat, HobbyStat];

export interface HobbyDefinition {
  readonly id: HobbyId;
  readonly name: Localized<string>;
  readonly sticker: string;
  readonly rating: number;
  readonly position: HobbyTag;
  readonly stats: HobbyStats;
  readonly text: Localized<string>;
  readonly source: 'author';
}

export interface LocalizedHobbyTag {
  code: string;
  label: string;
}

export interface LocalizedHobbyStat extends LocalizedHobbyTag {
  value: number;
}

export interface LocalizedHobby {
  id: HobbyId;
  name: string;
  sticker: string;
  rating: number;
  position: LocalizedHobbyTag;
  stats: LocalizedHobbyStat[];
  text: string;
}

const tag = (code: Localized<string>, label: Localized<string>): HobbyTag => ({ code, label });
const stat = (code: Localized<string>, label: Localized<string>, value: number): HobbyStat => ({ code, label, value });

export const HOBBIES: readonly HobbyDefinition[] = [
  {
    id: 'animes',
    name: t('ANIMES', 'ANIME'),
    sticker: 'space-cowboy',
    rating: 96,
    position: tag(t('OTK', 'OTK'), t('Otaku', 'Otaku')),
    stats: [
      stat(t('GHI', 'GHI'), t('Ghibli', 'Ghibli'), 97),
      stat(t('BEB', 'BEB'), t('Bebop', 'Bebop'), 99),
      stat(t('DBZ', 'DBZ'), t('Dragon Ball', 'Dragon Ball'), 92),
      stat(t('OPC', 'OPC'), t('One Piece', 'One Piece'), 90),
      stat(t('AKI', 'AKI'), t('Akira', 'Akira'), 88),
      stat(t('P5R', 'P5R'), t('Persona 5', 'Persona 5'), 95),
    ],
    text: t(
      'Amo assistir animes, principalmente os antigos, filmes inclusive: a maioria dos do Studio Ghibli, Cowboy Bebop, Dragon Ball, One Piece, Akira e Persona 5.',
      'I love watching anime, especially the older ones, films included: most of Studio Ghibli, Cowboy Bebop, Dragon Ball, One Piece, Akira and Persona 5.'
    ),
    source: 'author',
  },
  {
    id: 'musica',
    name: t('MÚSICA', 'MUSIC'),
    sticker: 'medulla',
    rating: 94,
    position: tag(t('OUV', 'LIS'), t('Ouvinte', 'Listener')),
    stats: [
      stat(t('HIP', 'HIP'), t('Hip-hop', 'Hip-hop'), 98),
      stat(t('MED', 'MED'), t('Medulla', 'Medulla'), 97),
      stat(t('DES', 'DSB'), t('Desert blues', 'Desert blues'), 93),
      stat(t('AFR', 'AFR'), t('África', 'Africa'), 90),
      stat(t('LET', 'LYR'), t('Letras', 'Lyrics'), 89),
      stat(t('CUL', 'CUL'), t('Cultura', 'Culture'), 95),
    ],
    text: t(
      'Adoro conhecer estilos diferentes. A música traz uma informação cultural rica nas melodias, nas letras e no posicionamento, mantendo tradições, religiões e muito mais. Tenho um apreço gigante pelo hip-hop: a história dele é a de um movimento incrível. Me identifico muito com a banda Medulla, de Keops e Raony, que se transforma e inova sempre. Hoje escuto bastante Tinariwen e Tissilawen, do desert blues, e já ouvi artistas africanos como Boubacar Traoré (Mali), Lokua Kanza e Richard Bona.',
      'I love discovering different styles. Music carries rich cultural information in its melodies, lyrics and stance, keeping traditions, religions and more alive. I have huge appreciation for hip-hop: its history is that of an incredible movement. I relate a lot to the band Medulla, by Keops and Raony, who keep transforming and innovating. Lately I listen to a lot of Tinariwen and Tissilawen, from desert blues, and I have heard African artists such as Boubacar Traoré (Mali), Lokua Kanza and Richard Bona.'
    ),
    source: 'author',
  },
  {
    id: 'violao',
    name: t('VIOLÃO & LUAUS', 'GUITAR & LUAUS'),
    sticker: 'violao',
    rating: 82,
    position: tag(t('LUA', 'LUA'), t('Luau', 'Luau')),
    stats: [
      stat(t('ACO', 'CHD'), t('Acordes', 'Chords'), 72),
      stat(t('DES', 'OFF'), t('Desafinada', 'Out of tune'), 95),
      stat(t('FOG', 'FIR'), t('Fogueira', 'Campfire'), 90),
      stat(t('LUA', 'MON'), t('Lua cheia', 'Full moon'), 99),
      stat(t('SAU', 'MIS'), t('Saudade', 'Missing it'), 97),
      stat(t('ANI', 'HYP'), t('Ânimo', 'Hype'), 94),
    ],
    text: t(
      'Como gosto de música, às vezes pego o violão para dar uma desafinada e curtir o meu momento com ele. Já participei de alguns luaus e organizei outros ao longo da vida; sinto bastante saudade dessa época e estou sempre animado para fazer um novo, mesmo parado.',
      'Since I love music, sometimes I pick up the guitar to play a little out of tune and enjoy the moment. I have joined some luaus and hosted others over the years; I miss those days a lot and I am always up for a new one, even if it has been a while.'
    ),
    source: 'author',
  },
  {
    id: 'skate',
    name: t('SKATE', 'SKATEBOARDING'),
    sticker: 'skate',
    rating: 70,
    position: tag(t('SKT', 'SKT'), t('Skatista', 'Skater')),
    stats: [
      stat(t('OLL', 'OLL'), t('Ollie', 'Ollie'), 68),
      stat(t('EQU', 'BAL'), t('Equilíbrio', 'Balance'), 72),
      stat(t('NOS', 'NOS'), t('Nostalgia', 'Nostalgia'), 99),
      stat(t('TOM', 'FAL'), t('Tombos', 'Falls'), 85),
      stat(t('MAN', 'TRK'), t('Manobras', 'Tricks'), 60),
      stat(t('RUA', 'STR'), t('Rua', 'Street'), 88),
    ],
    text: t(
      'Curto andar de skate de vez em quando para relembrar a minha adolescência.',
      'I enjoy skateboarding now and then to relive my teenage years.'
    ),
    source: 'author',
  },
  {
    id: 'jogos',
    name: t('JOGOS DE CELULAR', 'MOBILE GAMES'),
    sticker: 'crown',
    rating: 88,
    position: tag(t('MOB', 'MOB'), t('Mobile', 'Mobile')),
    stats: [
      stat(t('DUO', 'DUO'), t('Duolingo', 'Duolingo'), 99),
      stat(t('CLR', 'CLR'), t('Clash Royale', 'Clash Royale'), 91),
      stat(t('BRW', 'BRW'), t('Brawl Stars', 'Brawl Stars'), 86),
      stat(t('WRF', 'WRF'), t('Wild Rift', 'Wild Rift'), 84),
      stat(t('TIL', 'TIL'), t('Tilt', 'Tilt'), 75),
      stat(t('RNK', 'RNK'), t('Ranking', 'Ranking'), 80),
    ],
    text: t(
      'Gosto bastante de jogos de celular, como Duolingo, Clash Royale, Brawl Stars e League of Legends: Wild Rift.',
      'I really like mobile games, such as Duolingo, Clash Royale, Brawl Stars and League of Legends: Wild Rift.'
    ),
    source: 'author',
  },
  {
    id: 'natureza',
    name: t('NATUREZA', 'NATURE'),
    sticker: 'montanha',
    rating: 97,
    position: tag(t('MAT', 'WLD'), t('Mato', 'Wild')),
    stats: [
      stat(t('CAC', 'WFL'), t('Cachoeira', 'Waterfalls'), 98),
      stat(t('PAS', 'PAS'), t('Pasto', 'Pasture'), 95),
      stat(t('VER', 'GRN'), t('Verde', 'Green'), 99),
      stat(t('CAL', 'CLM'), t('Calmaria', 'Calm'), 96),
      stat(t('MIN', 'MIN'), t('Minas', 'Minas'), 90),
      stat(t('REN', 'RNW'), t('Renovação', 'Renewal'), 97),
    ],
    text: t(
      'Para a minha calmaria, gosto de ver o mato e me distanciar um pouco da cidade. Às vezes, só parar num pasto e ficar olhando a natureza já me renova. Franca é cercada de verde e fica bem perto de Minas Gerais, então tem várias cachoeiras. Acho importante me conectar com a natureza de vez em quando.',
      'To unwind, I like to see the countryside and get a little away from the city. Sometimes just stopping by a pasture and looking at nature renews me. Franca is surrounded by green and sits close to Minas Gerais, so there are plenty of waterfalls. I think it matters to connect with nature every now and then.'
    ),
    source: 'author',
  },
];

export function hobbyStickerFile(stickerId: string): string {
  const sticker = STICKERS.find((entry) => entry.id === stickerId);
  if (!sticker) throw new Error(`Unknown sticker "${stickerId}"`);
  return sticker.file;
}

const localizeStat = (entry: HobbyStat, locale: Locale): LocalizedHobbyStat => ({
  code: entry.code[locale],
  label: entry.label[locale],
  value: entry.value,
});

export function getLocalizedHobbies(locale: Locale): LocalizedHobby[] {
  return HOBBIES.map((hobby) => ({
    id: hobby.id,
    name: hobby.name[locale],
    sticker: hobbyStickerFile(hobby.sticker),
    rating: hobby.rating,
    position: { code: hobby.position.code[locale], label: hobby.position.label[locale] },
    stats: hobby.stats.map((entry) => localizeStat(entry, locale)),
    text: hobby.text[locale],
  }));
}
