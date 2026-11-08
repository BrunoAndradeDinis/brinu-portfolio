import { t, type Locale, type Localized } from './localized.ts';

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
  { id: 'brinu-ransom', file: '/stickers/sticker-01.svg', alt: t('Sticker com as letras BRINU recortadas como bilhete de resgate', 'Sticker with the letters BRINU cut like a ransom note') },
  { id: 'pai-da-helena', file: '/stickers/sticker-02.svg', alt: t('Carimbo com o texto PAI DA HELENA', "Stamp reading PAI DA HELENA (Helena's dad)") },
  { id: 'space-cowboy', file: '/stickers/sticker-03.svg', alt: t('Selo redondo com o texto SEE YOU SPACE COWBOY', 'Round seal reading SEE YOU SPACE COWBOY') },
  { id: 'avatar-duotone', file: '/stickers/sticker-04.svg', alt: t('Retrato de Bruno em duotone vermelho e preto', 'Red and black duotone portrait of Bruno') },
  { id: 'calling-card', file: '/stickers/sticker-05.svg', alt: t('Cartão de aviso com o retrato de Bruno e um troféu', "Calling card with Bruno's portrait and a trophy") },
  { id: 'heart', file: '/stickers/sticker-06.svg', alt: t('Coração vermelho com contorno preto', 'Red heart with a black outline') },
  { id: 'star', file: '/stickers/sticker-07.svg', alt: t('Estrela de oito pontas vermelha e preta', 'Red and black eight-point star') },
  { id: 'mask', file: '/stickers/sticker-08.svg', alt: t('Máscara de ladrão fantasma', 'Phantom thief mask') },
  { id: 'cilada', file: '/stickers/sticker-09.svg', alt: t('Triângulo de alerta com o texto CILADA!', 'Warning triangle reading CILADA!') },
  { id: 'front-end', file: '/stickers/sticker-10.svg', alt: t('Etiqueta preta com o texto FRONT-END', 'Black label reading FRONT-END') },
  { id: 'eyes', file: '/stickers/sticker-11.svg', alt: t('Faixa preta com dois olhos', 'Black strip with two eyes') },
  { id: 'speech', file: '/stickers/sticker-12.svg', alt: t('Balão de fala com uma exclamação vermelha', 'Speech bubble with a red exclamation mark') },
  { id: 'spider-web', file: '/stickers/sticker-13.svg', alt: t('Teia de aranha com uma aranha no centro', 'Spider web with a spider in the center') },
  { id: 'spider-mask', file: '/stickers/sticker-14.svg', alt: t('Máscara vermelha com teias e olhos brancos', 'Red mask with web lines and white eyes') },
  { id: 'claws', file: '/stickers/sticker-15.svg', alt: t('Três garras vermelhas rasgando um fundo preto', 'Three red claw marks tearing a black background') },
  { id: 'merc-mask', file: '/stickers/sticker-16.svg', alt: t('Máscara vermelha e preta com duas espadas cruzadas', 'Red and black mask with two crossed swords') },
  { id: 'antifascista', file: '/stickers/sticker-17.svg', alt: t('Bandeiras vermelha e preta com o texto ANTIFASCISTA', 'Red and black flags with the text ANTIFASCISTA') },
  { id: 'cafe', file: '/stickers/sticker-18.svg', alt: t('Xícara de café fumegante com o texto CAFÉ', 'Steaming coffee cup with the text CAFÉ') },
  { id: 'lightning', file: '/stickers/sticker-19.svg', alt: t('Círculo branco cortado por um raio vermelho', 'White circle split by a red lightning bolt') },
  { id: 'bowie', file: '/stickers/sticker-20.svg', alt: t('Etiqueta preta com um raio e o texto BOWIE', 'Black label with a lightning bolt and the text BOWIE') },
  { id: 'moto', file: '/stickers/sticker-21.svg', alt: t('Moto vermelha e preta de perfil', 'Red and black motorcycle in profile') },
  { id: 'racionais', file: '/stickers/sticker-22.svg', alt: t('Microfone com o texto RACIONAIS MC\'S', 'Microphone with the text RACIONAIS MC\'S') },
];

export function getLocalizedStickers(locale: Locale): LocalizedSticker[] {
  return STICKERS.map((sticker) => ({ id: sticker.id, file: sticker.file, alt: sticker.alt[locale] }));
}
