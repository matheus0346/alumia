export const DAYS = [
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
  'Domingo',
];

/**
 * Formats a Date object as YYYY-MM-DD in the user's local timezone
 * (prevents UTC evening roll-over bugs in Brazil UTC-3).
 */
export const toLocalISO = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const todayISO = () => toLocalISO(new Date());

export const fmtDate = (iso) => {
  try {
    return new Date(iso + 'T12:00').toLocaleDateString('pt-BR');
  } catch {
    return iso;
  }
};

export const fmtLong = (iso) => {
  try {
    return new Date(iso + 'T12:00').toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  } catch {
    return iso;
  }
};

export const fmtTs = (ts) => {
  try {
    return new Date(ts).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
};

export const getWeekDates = (offset = 0) => {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(d);
    x.setDate(d.getDate() + i);
    return toLocalISO(x);
  });
};
