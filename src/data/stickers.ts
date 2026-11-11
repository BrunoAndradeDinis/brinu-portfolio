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
  { id: 'heart', file: stickerFile(6), alt: t('Coração roxo com contorno preto', 'Purple heart with a black outline') },
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
  { id: 'lightning', file: stickerFile(19), alt: t('Retrato estilo Ziggy Stardust com mullet vermelho e raio no rosto', 'Ziggy Stardust style portrait with red mullet and lightning bolt across the face') },
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
  { id: 'x-gene', file: stickerFile(33), alt: t('Símbolo X-Gene em losango vermelho e preto', 'X-Gene symbol in a red and black diamond') },
  { id: 'snikt', file: stickerFile(34), alt: t('Balão de quadrinhos com SNIKT! em estrela vermelha', 'Comic burst reading SNIKT! in a red star') },
  { id: 'storm', file: stickerFile(35), alt: t('Nuvem de tempestade com raio vermelho', 'Storm cloud with a red lightning bolt') },
  { id: 'pow', file: stickerFile(36), alt: t('Explosão de quadrinhos com POW!', 'Comic explosion reading POW!') },
  { id: 'wolverine', file: stickerFile(37), alt: t('Asas pretas da máscara do Wolverine em círculo amarelo', 'Black wings of the Wolverine mask on a yellow circle') },
  { id: 'bomba', file: stickerFile(38), alt: t('Bomba preta com pavio aceso', 'Black bomb with a lit fuse') },
  { id: 'finish', file: stickerFile(39), alt: t('Painel com o texto FINISH HIM!', 'Panel reading FINISH HIM!') },
  { id: 'mk3', file: stickerFile(40), alt: t('Logo MK3 com medalhão vermelho', 'MK3 logo with a red medallion') },
  { id: 'cogumelo', file: stickerFile(41), alt: t('Cogumelo pixelado vermelho e branco', 'Pixel art red and white mushroom') },
  { id: 'bloco', file: stickerFile(42), alt: t('Bloco de interrogação vermelho', 'Red question-mark block') },
  { id: 'carro', file: stickerFile(43), alt: t('Texto TOP GEAR 2 com bandeiras de xadrez', 'TOP GEAR 2 text with checkered flags') },
  { id: 'magneto', file: stickerFile(44), alt: t('Capacete do Magneto', 'Magneto helmet') },
  { id: 'casco', file: stickerFile(45), alt: t('Casco de tartaruga ninja vermelho', 'Red ninja turtle shell') },
  { id: 'pizza', file: stickerFile(46), alt: t('Fatia de pizza', 'Slice of pizza') },
  { id: 'bueiro', file: stickerFile(47), alt: t('Tampa de bueiro redonda', 'Round manhole cover') },
  { id: 'rugrats', file: stickerFile(48), alt: t('Logo Rugrats em letras tortas sobre explosão', 'Rugrats logo in wobbly letters over a burst') },
  { id: 'touche-label', file: stickerFile(49), alt: t('Etiqueta TOUCHÉ! com faixa', 'TOUCHÉ! label with a banner') },
  { id: 'bota', file: stickerFile(50), alt: t('Bota de trilha', 'Hiking boot') },
  { id: 'montanha', file: stickerFile(51), alt: t('Montanha vermelha ao sol', 'Red mountain under the sun') },
  { id: 'placa', file: stickerFile(52), alt: t('Placa de trilha com seta', 'Trail sign with an arrow') },
  { id: 'bussola', file: stickerFile(53), alt: t('Bússola preta e branca com agulha vermelha', 'Black and white compass with a red needle') },
  { id: 'palmeira', file: stickerFile(54), alt: t('Palmeira em ilha vermelha', 'Palm tree on a red island') },
  { id: 'tiki', file: stickerFile(55), alt: t('Tocha tiki do luau', 'Luau tiki torch') },
  { id: 'mascara', file: stickerFile(56), alt: t('Máscara tribal de madeira preta com crista de penas', 'Black wooden tribal mask with a feather crest') },
];

export function getLocalizedStickers(locale: Locale): LocalizedSticker[] {
  return STICKERS.map((sticker) => ({ id: sticker.id, file: sticker.file, alt: sticker.alt[locale] }));
}
