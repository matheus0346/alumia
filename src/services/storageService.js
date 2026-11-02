import { DEMO_DATA } from '../constants/demoData';
import { normalizeAnalysisResult } from '../utils/clinical';

export const KEYS = {
  schools: 'alm_sc',
  students: 'alm_st',
  entries: 'alm_en',
};

export const DB = {
  async get(k) {
    try {
      if (typeof window !== 'undefined' && window.storage?.get) {
        const r = await window.storage.get(k);
        return r ? JSON.parse(r.value) : null;
      }
      const item = localStorage.getItem(k);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },
  async set(k, v) {
    try {
      if (typeof window !== 'undefined' && window.storage?.set) {
        await window.storage.set(k, JSON.stringify(v));
        return;
      }
      localStorage.setItem(k, JSON.stringify(v));
    } catch {
      // Ignore storage quota or private mode errors
    }
  },
};

const enrichLegacyEntry = (entry) => {
  const demoMatch = DEMO_DATA.entries.find((d) => d.id === entry.id);
  const norm = normalizeAnalysisResult({
    indicators: entry.indicators,
    nivel_risco: entry.riskLevel,
    analise: entry.aiText,
    sinais_alerta: entry.sinaisAlerta ?? demoMatch?.sinaisAlerta,
    fatores_protetivos: entry.fatoresProtetivos ?? demoMatch?.fatoresProtetivos,
    recomendacao: entry.recomendacao ?? demoMatch?.recomendacao,
  });
  return {
    ...entry,
    indicators: norm.indicators,
    riskLevel: norm.nivel_risco,
    aiText: norm.analise,
    sinaisAlerta: norm.sinais_alerta,
    fatoresProtetivos: norm.fatores_protetivos,
    recomendacao: norm.recomendacao,
  };
};

export const loadInitialData = async () => {
  let [schools, students, entries] = await Promise.all([
    DB.get(KEYS.schools),
    DB.get(KEYS.students),
    DB.get(KEYS.entries),
  ]);

  if (!schools || Object.keys(schools).length === 0) {
    schools = DEMO_DATA.schools;
    students = DEMO_DATA.students;
    entries = DEMO_DATA.entries;
    await Promise.all([
      DB.set(KEYS.schools, schools),
      DB.set(KEYS.students, students),
      DB.set(KEYS.entries, entries),
    ]);
  } else if (Array.isArray(entries)) {
    entries = entries.map(enrichLegacyEntry);
  }

  return {
    schools: schools || {},
    students: students || {},
    entries: entries || [],
  };
};
