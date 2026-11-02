import { DEMO_DATA } from '../constants/demoData';

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
  }

  return {
    schools: schools || {},
    students: students || {},
    entries: entries || [],
  };
};
