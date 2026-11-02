import { hash } from '../utils/crypto';

export const ADMIN_EMAIL = 'admin@alumia.com';
export const ADMIN_HASH = hash('admin123');

export const IND = {
  ansiedade: 'Ansiedade',
  depressao: 'Depressão',
  estresse: 'Estresse',
  burnout: 'Burnout Escolar',
  desempenho: 'Baixo Desempenho',
  desmotivacao: 'Desmotivação',
  isolamento: 'Isolamento Social',
  autodestrutivo: 'Pens. Autodestrutivos',
  agressividade: 'Agressividade',
  inseguranca: 'Insegurança Emocional',
  oscilacao: 'Oscilação de Humor',
  sobrecarga: 'Sobrecarga Emocional',
};

export const INDICATOR_COLORS = {
  ansiedade: '#dc2626',
  depressao: '#2563eb',
  estresse: '#b45309',
  burnout: '#7c3aed',
  desempenho: '#0891b2',
  desmotivacao: '#64748b',
  isolamento: '#4f46e5',
  autodestrutivo: '#991b1b',
  agressividade: '#ea580c',
  inseguranca: '#d97706',
  oscilacao: '#9333ea',
  sobrecarga: '#be123c',
};

export const RISK = {
  alto: {
    label: 'Alto Risco',
    color: '#dc2626',
    bg: '#fff5f5',
    border: '#fecaca',
  },
  atencao: {
    label: 'Atenção',
    color: '#b45309',
    bg: '#fffbeb',
    border: '#fde68a',
  },
  baixo: {
    label: 'Baixo Risco',
    color: '#15803d',
    bg: '#f0fdf4',
    border: '#bbf7d0',
  },
};

export const URG = {
  critico: { label: 'CRÍTICO', color: '#dc2626', bg: '#fff5f5' },
  moderado: { label: 'MODERADO', color: '#b45309', bg: '#fffbeb' },
  leve: { label: 'LEVE', color: '#15803d', bg: '#f0fdf4' },
};

export const DEFAULT_CLAUDE_MODEL = 'claude-sonnet-4-20250514';
