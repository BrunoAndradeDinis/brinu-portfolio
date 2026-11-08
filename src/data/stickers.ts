import { t, type Locale, type Localized } from './localized.ts';
import { stickerFile } from './sticker-files.ts';

export interface StickerDefinition {
  readonly id: string;
  readonly file: string;
  readonly alt: Localized<string>;
}

export interface LocalizedSticker {
  id: string;
  file: string;
  alt: string;
}

export const STICKERS: readonly StickerDefinition[] = [
  { id: 'brinu-ransom', file: stickerFile(1), alt: t('Sticker com as letras BRINU recortadas como bilhete de resgate', 'Sticker with the letters BRINU cut like a ransom note') },
  { id: 'pai-da-helena', file: stickerFile(2), alt: t('Carimbo com o texto PAI DA HELENA', "Stamp reading PAI DA HELENA (Helena's dad)") },
  { id: 'space-cowboy', file: stickerFile(3), alt: t('Selo redondo com o texto SEE YOU SPACE COWBOY', 'Round seal reading SEE YOU SPACE COWBOY') },
  { id: 'avatar-duotone', file: stickerFile(4), alt: t('Retrato de Bruno em duotone vermelho e preto', 'Red and black duotone portrait of Bruno') },
  { id: 'calling-card', file: stickerFile(5), alt: t('Cartão de aviso com o retrato de Bruno e um troféu', "Calling card with Bruno's portrait and a trophy") },
  { id: 'heart', file: stickerFile(6), alt: t('Coração vermelho com contorno preto', 'Red heart with a black outline') },
  { id: 'star', file: stickerFile(7), alt: t('Estrela de oito pontas vermelha e preta', 'Red and black eight-point star') },
  { id: 'mask', file: stickerFile(8), alt: t('Máscara de ladrão fantasma', 'Phantom thief mask') },
  { id: 'cilada', file: stickerFile(9), alt: t('Triângulo de alerta com o texto CILADA!', 'Warning triangle reading CILADA!') },
  { id: 'front-end', file: stickerFile(10), alt: t('Etiqueta preta com o texto FRONT-END', 'Black label reading FRONT-END') },
  { id: 'eyes', file: stickerFile(11), alt: t('Faixa preta com dois olhos', 'Black strip with two eyes') },
  { id: 'speech', file: stickerFile(12), alt: t('Balão de fala com uma exclamação vermelha', 'Speech bubble with a red exclamation mark') },
  { id: 'spider-web', file: stickerFile(13), alt: t('Teia de aranha com uma aranha no centro', 'Spider web with a spider in the center') },
  { id: 'spider-mask', file: stickerFile(14), alt: t('Máscara vermelha com teias e olhos brancos', 'Red mask with web lines and white eyes') },
  { id: 'claws', file: stickerFile(15), alt: t('Três garras vermelhas rasgando um fundo preto', 'Three red claw marks tearing a black background') },
  { id: 'merc-mask', file: stickerFile(16), alt: t('Máscara vermelha e preta com duas espadas cruzadas', 'Red and black mask with two crossed swords') },
  { id: 'antifascista', file: stickerFile(17), alt: t('Bandeiras vermelha e preta com o texto ANTIFASCISTA', 'Red and black flags with the text ANTIFASCISTA') },
  { id: 'cafe', file: stickerFile(18), alt: t('Xícara de café fumegante com o texto CAFÉ', 'Steaming coffee cup with the text CAFÉ') },
  { id: 'lightning', file: stickerFile(19), alt: t('Círculo branco cortado por um raio vermelho', 'White circle split by a red lightning bolt') },
  { id: 'bowie', file: stickerFile(20), alt: t('Etiqueta preta com um raio e o texto BOWIE', 'Black label with a lightning bolt and the text BOWIE') },
  { id: 'moto', file: stickerFile(21), alt: t('Moto vermelha e preta de perfil', 'Red and black motorcycle in profile') },
  { id: 'racionais', file: stickerFile(22), alt: t('Microfone com o texto RACIONAIS MC\'S', 'Microphone with the text RACIONAIS MC\'S') },
  { id: 'skate', file: stickerFile(23), alt: t('Skate vermelho e preto de lado', 'Red and black skateboard seen from the side') },
  { id: 'violao', file: stickerFile(24), alt: t('Violão vermelho em diagonal', 'Red acoustic guitar on a diagonal') },
  { id: 'musica', file: stickerFile(25), alt: t('Colcheias brancas sob arcos vermelhos num círculo preto', 'White eighth notes under red arcs in a black circle') },
  { id: 'camping', file: stickerFile(26), alt: t('Barraca vermelha ao lado de uma pequena fogueira', 'Red tent next to a small campfire') },
  { id: 'pirate-flag', file: stickerFile(27), alt: t('Bandeira pirata com caveira de chapéu de palha e ossos cruzados', 'Pirate flag with a straw-hat skull and crossed bones') },
  { id: 'dragon-ball', file: stickerFile(28), alt: t('Esfera vermelha com quatro estrelas', 'Red sphere with four stars') },
  { id: 'crown', file: stickerFile(29), alt: t('Coroa vermelha com joias', 'Red crown with jewels') },
  { id: 'cannon', file: stickerFile(30), alt: t('Canhão disparando com o texto BOOM!', 'Cannon firing with the text BOOM!') },
  { id: 'medulla', file: stickerFile(31), alt: t('Etiqueta preta com o texto MEDULLA e dois círculos gêmeos', 'Black label reading MEDULLA with two twin circles') },
  { id: 'medulla-twins', file: stickerFile(32), alt: t('Dois círculos gêmeos espelhados com o texto KEOPS & RAONY', 'Two mirrored twin circles with the text KEOPS & RAONY') },
];

export function getLocalizedStickers(locale: Locale): LocalizedSticker[] {
  return STICKERS.map((sticker) => ({ id: sticker.id, file: sticker.file, alt: sticker.alt[locale] }));
}
