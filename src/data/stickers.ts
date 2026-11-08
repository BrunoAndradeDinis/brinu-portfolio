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
  { id: 'calling-card', file: '/stickers/sticker-05.svg', alt: t('Cartão de aviso com o retrato de Bruno e uma estrela', "Calling card with Bruno's portrait and a star") },
  { id: 'heart', file: '/stickers/sticker-06.svg', alt: t('Coração vermelho com contorno preto', 'Red heart with a black outline') },
  { id: 'star', file: '/stickers/sticker-07.svg', alt: t('Estrela de oito pontas vermelha e preta', 'Red and black eight-point star') },
  { id: 'mask', file: '/stickers/sticker-08.svg', alt: t('Máscara de ladrão fantasma', 'Phantom thief mask') },
  { id: 'cilada', file: '/stickers/sticker-09.svg', alt: t('Triângulo de alerta com o texto CILADA!', 'Warning triangle reading CILADA!') },
  { id: 'front-end', file: '/stickers/sticker-10.svg', alt: t('Etiqueta preta com o texto FRONT-END', 'Black label reading FRONT-END') },
  { id: 'eyes', file: '/stickers/sticker-11.svg', alt: t('Faixa preta com dois olhos', 'Black strip with two eyes') },
  { id: 'speech', file: '/stickers/sticker-12.svg', alt: t('Balão de fala com uma exclamação vermelha', 'Speech bubble with a red exclamation mark') },
];

export function getLocalizedStickers(locale: Locale): LocalizedSticker[] {
  return STICKERS.map((sticker) => ({ id: sticker.id, file: sticker.file, alt: sticker.alt[locale] }));
}
