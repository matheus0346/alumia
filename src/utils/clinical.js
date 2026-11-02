import { IND } from '../constants/indicators';

export const clampIndicator = (val) => {
  const num = Number(val);
  if (Number.isNaN(num)) return 0;
  return Math.min(100, Math.max(0, Math.round(num)));
};

export const calcRiskLevel = (indicators = {}) => {
  const vals = Object.keys(IND).map((k) => clampIndicator(indicators[k]));
  if (vals.length === 0) return 'baixo';
  const media = vals.reduce((a, b) => a + b, 0) / vals.length;
  const maxVal = Math.max(...vals);
  const autodestrutivo = clampIndicator(indicators.autodestrutivo);

  if (autodestrutivo >= 35 || maxVal >= 70 || media >= 52) {
    return 'alto';
  }
  if (maxVal >= 40 || media >= 30) {
    return 'atencao';
  }
  return 'baixo';
};

export const calcUrgency = (entry) => {
  if (!entry?.indicators) return null;
  const autodestrutivo = clampIndicator(entry.indicators.autodestrutivo);
  if (autodestrutivo >= 35 || entry.riskLevel === 'alto') return 'critico';
  if (
    entry.riskLevel === 'atencao' ||
    Object.values(entry.indicators).some((v) => clampIndicator(v) >= 55)
  ) {
    return 'moderado';
  }
  return 'leve';
};

export const calcAverageScore = (indicators = {}) => {
  const vals = Object.keys(IND).map((k) => clampIndicator(indicators[k]));
  if (!vals.length) return 0;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
};

/**
 * Compares the two most recent entries (sorted newest-first) using both
 * riskLevel tier and average indicator progression (> 8 points delta).
 */
export const calcTrend = (entriesList = []) => {
  if (entriesList.length < 2) return 'stable';
  const sorted = [...entriesList].sort(
    (a, b) =>
      b.date.localeCompare(a.date) || (b.timestamp || 0) - (a.timestamp || 0)
  );
  const latest = sorted[0];
  const prev = sorted[1];
  const tier = { baixo: 0, atencao: 1, alto: 2 };
  const tLatest = tier[latest.riskLevel] ?? 0;
  const tPrev = tier[prev.riskLevel] ?? 0;

  if (tLatest > tPrev) return 'worsening';
  if (tLatest < tPrev) return 'improving';

  const avgDelta =
    calcAverageScore(latest.indicators) - calcAverageScore(prev.indicators);
  if (avgDelta >= 8) return 'worsening';
  if (avgDelta <= -8) return 'improving';
  return 'stable';
};

export const iColor = (v) =>
  v >= 65 ? '#dc2626' : v >= 40 ? '#b45309' : '#15803d';

const sanitizeStringArray = (arr, maxItems = 5) => {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean)
    .slice(0, maxItems);
};

/**
 * Ensures any AI output (from Claude Sonnet or fallback) strictly conforms
 * to the 12-indicator schema, clinical risk rules, warning signs, protective
 * factors, and school recommendation.
 */
export const normalizeAnalysisResult = (raw = {}) => {
  const indicators = {};
  Object.keys(IND).forEach((k) => {
    indicators[k] = clampIndicator(raw[k] ?? raw.indicators?.[k] ?? 0);
  });

  const computedRisk = calcRiskLevel(indicators);
  const validRisks = ['baixo', 'atencao', 'alto'];
  // Enforce clinical safety: never allow AI to downgrade a computed 'alto' risk
  const rawRisk = validRisks.includes(raw.nivel_risco)
    ? raw.nivel_risco
    : computedRisk;
  const tier = { baixo: 0, atencao: 1, alto: 2 };
  const nivel_risco =
    tier[computedRisk] > tier[rawRisk] ? computedRisk : rawRisk;

  const topIndicators = Object.entries(indicators)
    .filter(([, v]) => v >= 40)
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => IND[k]);

  let analise =
    typeof raw.analise === 'string'
      ? raw.analise.trim()
      : typeof raw.aiText === 'string'
      ? raw.aiText.trim()
      : '';
  if (!analise) {
    if (nivel_risco === 'alto') {
      analise = `O aluno expressa sofrimento emocional acentuado com ênfase em ${
        topIndicators.slice(0, 3).join(', ') || 'fatores de sobrecarga'
      }. Observam-se indicadores em faixa crítica que demandam acolhimento prioritário.`;
    } else if (nivel_risco === 'atencao') {
      analise = `O aluno manifesta sinais de tensão moderada associados a ${
        topIndicators.slice(0, 2).join(' e ') || 'demandas escolares'
      }. O relato sugere desgaste situacional que merece escuta preventiva.`;
    } else {
      analise =
        'O aluno relata experiências cotidianas com preservação do bem-estar e sem evidências de desregulação emocional significativa no momento.';
    }
  }

  let sinais_alerta = sanitizeStringArray(
    raw.sinais_alerta ?? raw.sinaisAlerta
  );
  if (sinais_alerta.length === 0 && topIndicators.length > 0) {
    sinais_alerta = topIndicators.slice(0, 3);
  }

  const fatores_protetivos = sanitizeStringArray(
    raw.fatores_protetivos ?? raw.fatoresProtetivos
  );

  let recomendacao =
    typeof raw.recomendacao === 'string' ? raw.recomendacao.trim() : '';
  if (!recomendacao) {
    if (indicators.autodestrutivo >= 35 || nivel_risco === 'alto') {
      recomendacao =
        'Acionar imediatamente o psicólogo ou orientador escolar para escuta individual acolhedora e avaliar necessidade de alinhamento com a rede de apoio familiar.';
    } else if (nivel_risco === 'atencao') {
      recomendacao =
        'Agendar conversa preventiva com a orientação pedagógica nos próximos dias e acompanhar a evolução no próximo registro semanal.';
    } else {
      recomendacao =
        'Manter acompanhamento regular pelo diário e incentivar a continuidade dos hábitos e vínculos positivos escolares.';
    }
  }

  return {
    ...indicators,
    indicators,
    nivel_risco,
    analise,
    sinais_alerta,
    fatores_protetivos,
    recomendacao,
  };
};
