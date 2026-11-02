const WLIST = [
  'lua', 'escura', 'ponte', 'vidro', 'silêncio', 'noite', 'rio', 'pedra',
  'névoa', 'sombra', 'vento', 'terra', 'tempo', 'mar', 'brisa', 'gelo',
];

export const hash = (str = '') => {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) ^ str.charCodeAt(i);
  }
  return 'h' + (h >>> 0).toString(36);
};

export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

export const genToken = () =>
  `ESC-${Math.floor(1000 + Math.random() * 9000)}-ALUMIA`;

export const genPhrase = () =>
  [...WLIST]
    .sort(() => Math.random() - 0.5)
    .slice(0, 6)
    .join(' ');

export const normalizePhrase = (phrase = '') =>
  phrase
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
