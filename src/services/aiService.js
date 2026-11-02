import { DEFAULT_CLAUDE_MODEL, IND } from '../constants/indicators';
import { calcAverageScore, normalizeAnalysisResult } from '../utils/clinical';

export const getConfiguredModel = () =>
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ANTHROPIC_MODEL) ||
  DEFAULT_CLAUDE_MODEL;

const NEGATION_PREFIXES = [
  'não ',
  'nao ',
  'nem ',
  'sem ',
  'nunca ',
  'jamais ',
  'nada ',
  'zero ',
  'não estou ',
  'nao estou ',
  'não me sinto ',
  'nao me sinto ',
  'deixei de ficar ',
  'passei sem ',
];

/**
 * Checks whether a keyword match in `lower` is preceded by a negation within
 * the preceding 22 characters of the same clause.
 */
const countContextAwareMatches = (lower, keywords) => {
  let score = 0;
  for (const kw of keywords) {
    let idx = lower.indexOf(kw);
    while (idx !== -1) {
      const windowStart = Math.max(0, idx - 22);
      const prefix = lower.slice(windowStart, idx);
      // Ignore negation if separated by punctuation (, . ; ! ? mas porém)
      const clausePrefix = prefix.split(/[.,;!?]|mas |porém |porem /).pop() || '';
      const isNegated = NEGATION_PREFIXES.some((neg) =>
        clausePrefix.includes(neg)
      );
      if (!isNegated) {
        score += 1;
      }
      idx = lower.indexOf(kw, idx + kw.length);
    }
  }
  return score;
};

/**
 * Deterministic, negation-aware clinical analyzer used as fallback when no
 * external API key is configured or when offline.
 */
export const simulateAiAnalyze = (text = '', previousEntries = []) => {
  const lower = text.toLowerCase();

  const rawAnsiedade = countContextAwareMatches(lower, [
    'ansioso', 'ansiosa', 'ansiedade', 'medo', 'pânico', 'panico', 'nervoso',
    'nervosa', 'coração acelerado', 'falta de ar', 'angústia', 'angustia',
    'preocupado', 'preocupada', 'apreensivo', 'apreensiva', 'roendo as unhas',
  ]);
  const rawDepressao = countContextAwareMatches(lower, [
    'triste', 'tristeza', 'choro', 'chorar', 'crises de choro', 'vazio',
    'desânimo', 'desanimo', 'sem esperança', 'sozinho', 'sozinha', 'solidão',
    'solidao', 'melancolia', 'deprimido', 'deprimida',
  ]);
  const rawEstresse = countContextAwareMatches(lower, [
    'estresse', 'estressado', 'estressada', 'pressão', 'pressao', 'cobrança',
    'cobranca', 'cansaço', 'cansaco', 'dormir mal', 'insônia', 'insonia',
    'tensão', 'tensao', 'correria', 'sobrecarregado',
  ]);
  const rawBurnout = countContextAwareMatches(lower, [
    'burnout', 'esgotado', 'esgotada', 'não aguento mais', 'nao aguento mais',
    'exausto', 'exausta', 'no limite', 'desmoronar', 'fadiga', 'sugado',
  ]);
  const rawDesempenho = countContextAwareMatches(lower, [
    'nota baixa', 'notas baixas', 'reprovar', 'recuperação', 'recuperacao',
    'baixo desempenho', 'dificuldade na matéria', 'não entendo a matéria',
    'fui mal na prova', 'medo da prova', 'atrasado nos estudos', 'perdi nota',
  ]);
  const rawDesmotivacao = countContextAwareMatches(lower, [
    'desmotivado', 'desmotivada', 'sem vontade', 'desistir', 'tanto faz',
    'sem sentido', 'não quero ir pra aula', 'preguiça de tudo', 'desanimado',
  ]);
  const rawIsolamento = countContextAwareMatches(lower, [
    'isolado', 'isolada', 'excluído', 'excluida', 'sem amigos', 'ninguém liga',
    'ninguem liga', 'afastado', 'afastada', 'invisível', 'invisivel',
    'não pertenço', 'nao pertenco', 'sozinho no recreio', 'sozinho no intervalo',
  ]);
  const rawAutodestrutivo = countContextAwareMatches(lower, [
    'sumir', 'desaparecer', 'morrer', 'acabar com tudo', 'me machucar',
    'não queria acordar', 'nao queria acordar', 'tirar minha vida',
    'não vale a pena viver',
  ]);
  const rawAgressividade = countContextAwareMatches(lower, [
    'raiva', 'ódio', 'odio', 'irritado', 'irritada', 'brigar', 'explodir',
    'bater', 'sem paciência', 'sem paciencia', 'vontade de gritar', 'discussão',
  ]);
  const rawInseguranca = countContextAwareMatches(lower, [
    'inseguro', 'insegura', 'vergonha', 'incapaz', 'insuficiente',
    'pior que os outros', 'inútil', 'inutil', 'fracasso', 'medo de errar',
  ]);
  const rawOscilacao = countContextAwareMatches(lower, [
    'oscilando', 'instável', 'instavel', 'mudando de humor', 'montanha russa',
    'uma hora bem outra mal', 'altos e baixos', 'humor variando',
  ]);
  const rawSobrecarga = countContextAwareMatches(lower, [
    'sobrecarga', 'muita coisa', 'sufocado', 'sufocada', 'sufoco',
    'pesado demais', 'não dou conta', 'nao dou conta', 'acumulado',
  ]);

  // Protective / positive signals reduce baseline tension and populate fatores_protetivos
  const protectiveRules = [
    {
      label: 'Regulação emocional e tranquilidade',
      words: ['calmo', 'calma', 'tranquilo', 'tranquila', 'em paz', 'sereno', 'bem comigo'],
    },
    {
      label: 'Organização e engajamento nos estudos',
      words: ['produtiva', 'produtivo', 'estudar com antecedência', 'preparado', 'preparada', 'fui bem', 'consegui estudar', 'organizei'],
    },
    {
      label: 'Apoio e convivência familiar',
      words: ['família', 'familia', 'meus pais', 'minha mãe', 'meu pai', 'em casa tudo bem'],
    },
    {
      label: 'Vínculo positivo com colegas/amigos',
      words: ['amigos', 'colegas me ajudaram', 'conversei com amigos', 'grupo de amigos', 'brincamos', 'risada'],
    },
    {
      label: 'Descanso e autocuidado',
      words: ['descansar', 'dormi bem', 'esporte', 'treino', 'música', 'lazer', 'passear'],
    },
  ];

  const fatores_protetivos = [];
  let positiveMatches = 0;
  for (const rule of protectiveRules) {
    const m = countContextAwareMatches(lower, rule.words);
    if (m > 0) {
      fatores_protetivos.push(rule.label);
      positiveMatches += m;
    }
  }

  // Deterministic hash offset (0..5) based on text content so scores look natural but never vary randomly
  const textChecksum = Array.from(lower).reduce(
    (acc, ch) => (acc * 31 + ch.charCodeAt(0)) % 97,
    7
  );
  const base = Math.max(8, 18 - positiveMatches * 3 + (textChecksum % 5));

  const calc = (count, salt = 0) => {
    if (count === 0) {
      return Math.max(4, base + ((textChecksum + salt) % 6) - positiveMatches * 2);
    }
    return Math.min(96, base + count * 26 + ((textChecksum + salt) % 7));
  };

  const rawIndicators = {
    ansiedade: calc(rawAnsiedade, 1),
    depressao: calc(rawDepressao, 2),
    estresse: calc(rawEstresse, 3),
    burnout: calc(rawBurnout, 4),
    desempenho: calc(rawDesempenho, 5),
    desmotivacao: calc(rawDesmotivacao, 6),
    isolamento: calc(rawIsolamento, 7),
    autodestrutivo:
      rawAutodestrutivo > 0
        ? Math.min(95, 45 + rawAutodestrutivo * 24)
        : 0,
    agressividade: calc(rawAgressividade, 8),
    inseguranca: calc(rawInseguranca, 9),
    oscilacao: calc(rawOscilacao, 10),
    sobrecarga: calc(rawSobrecarga, 11),
  };

  // Warning signs extraction
  const warningRules = [
    { cond: rawAutodestrutivo > 0, label: 'Ideação autodestrutiva / Desesperança aguda' },
    { cond: rawBurnout > 0 || rawSobrecarga > 0, label: 'Esgotamento e sobrecarga escolar' },
    { cond: rawAnsiedade > 0, label: 'Sintomas ansiosos / Tensão emocional' },
    { cond: rawDepressao > 0, label: 'Humor deprimido / Crises de choro' },
    { cond: rawIsolamento > 0, label: 'Retraimento social / Falta de pertencimento' },
    { cond: rawEstresse > 0, label: 'Pressão avaliativa e estresse' },
    { cond: rawAgressividade > 0, label: 'Irritabilidade / Reatividade emocional' },
    { cond: rawInseguranca > 0, label: 'Autodepreciação / Insegurança acadêmica' },
  ];

  const sinais_alerta = warningRules
    .filter((r) => r.cond)
    .map((r) => r.label)
    .slice(0, 4);

  const normalized = normalizeAnalysisResult({
    ...rawIndicators,
    sinais_alerta,
    fatores_protetivos,
  });

  // Add longitudinal comparison note if student has previous entries
  if (previousEntries && previousEntries.length > 0) {
    const prevLatest = [...previousEntries].sort((a, b) =>
      b.date.localeCompare(a.date)
    )[0];
    if (prevLatest?.indicators) {
      const prevAvg = calcAverageScore(prevLatest.indicators);
      const currAvg = calcAverageScore(normalized.indicators);
      const delta = currAvg - prevAvg;
      if (delta >= 12) {
        normalized.analise += ` Em comparação ao registro anterior (${prevLatest.date}), observa-se elevação expressiva de ${delta} pontos na média geral de tensão emocional.`;
      } else if (delta <= -12) {
        normalized.analise += ` Em relação ao registro anterior (${prevLatest.date}), nota-se evolução positiva com redução de ${Math.abs(delta)} pontos nos indicadores de sobrecarga.`;
      }
    }
  }

  return {
    ...normalized,
    aiSource: 'local-clinical-fallback',
  };
};

const extractJsonObject = (rawText = '') => {
  const cleaned = rawText.replace(/```json|```/gi, '').trim();
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
  }
  return JSON.parse(cleaned);
};

const buildHistoryContextPrompt = (previousEntries = []) => {
  if (!previousEntries || previousEntries.length === 0) {
    return 'Histórico prévio do estudante: Primeiro registro disponível (sem histórico anterior).';
  }
  const recent = [...previousEntries]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3);
  const lines = recent.map((e) => {
    const avg = calcAverageScore(e.indicators);
    const high = Object.entries(e.indicators || {})
      .filter(([, v]) => v >= 45)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([k, v]) => `${IND[k]}:${v}%`)
      .join(', ');
    return `- Data ${e.date}: risco=${e.riskLevel}, média=${avg}%${
      high ? `, destaques=[${high}]` : ''
    }`;
  });
  return `Histórico recente deste mesmo código de estudante (para comparação longitudinal):\n${lines.join('\n')}`;
};

const SYSTEM_PROMPT = `Você é um psicólogo escolar e especialista em saúde mental de adolescentes atuando na plataforma ALUMIA.
Sua tarefa é analisar o relato do diário semanal de um estudante e produzir uma avaliação psicométrica e clínica estruturada, destinada EXCLUSIVAMENTE ao psicólogo/orientador da escola (o aluno nunca vê esta análise).

RÉGUA DE CALIBRAÇÃO DOS 12 INDICADORES (0 a 100):
- 0 a 24 (Faixa Baixa / Esperada): Ausência de sofrimento no indicador ou vivência escolar cotidiana saudável. Atenção: se o estudante menciona "prova", "estudo" ou "nota" em contexto positivo/organizado ou com negação ("não estou ansioso"), mantenha a pontuação baixa (<20).
- 25 a 49 (Faixa de Atenção Leve / Situacional): Desconforto pontual, cansaço específico da semana ou preocupação moderada com demandas escolares, sem prejuízo global.
- 50 a 69 (Faixa Moderada / Persistente): Sofrimento emocional claro, queixas recorrentes, prejuízo no sono/motivação/vínculos sociais.
- 70 a 100 (Faixa Severa / Crítica): Desregulação aguda, exaustão intensa, isolamento severo ou sofrimento psíquico acentuado. Para "autodestrutivo", qualquer menção direta ou indireta a desejar sumir, não acordar ou autolesão deve pontuar >= 45.

REGRAS DE CLASSIFICAÇÃO DE RISCO (nivel_risco):
- "alto": autodestrutivo >= 35 OU qualquer indicador >= 70 OU média dos 12 indicadores >= 52.
- "atencao": qualquer indicador >= 40 OU média dos 12 indicadores >= 30.
- "baixo": demais casos.

Retorne APENAS um objeto JSON válido, sem blocos markdown e sem texto fora do JSON, seguindo exatamente este esquema:
{
  "ansiedade": 0-100,
  "depressao": 0-100,
  "estresse": 0-100,
  "burnout": 0-100,
  "desempenho": 0-100,
  "desmotivacao": 0-100,
  "isolamento": 0-100,
  "autodestrutivo": 0-100,
  "agressividade": 0-100,
  "inseguranca": 0-100,
  "oscilacao": 0-100,
  "sobrecarga": 0-100,
  "nivel_risco": "baixo" | "atencao" | "alto",
  "sinais_alerta": ["até 4 evidências clínicas curtas identificadas no relato, ou array vazio se baixo risco"],
  "fatores_protetivos": ["até 4 recursos positivos, vínculos ou estratégias de enfrentamento presentes no relato"],
  "analise": "2 a 3 frases clínicas em português iniciando obrigatoriamente com 'O aluno', sintetizando o estado emocional e comparando com o histórico recente quando houver.",
  "recomendacao": "1 frase prática e objetiva orientando a conduta recomendada para a equipe psicopedagógica da escola."
}`;

export const aiAnalyze = async (text = '', previousEntries = []) => {
  const sanitizedText = text.replace(/"/g, "'").slice(0, 4000);
  const historyContext = buildHistoryContextPrompt(previousEntries);

  try {
    const apiKey =
      typeof import.meta !== 'undefined' &&
      import.meta.env?.VITE_ANTHROPIC_API_KEY;
    const apiUrl =
      (typeof import.meta !== 'undefined' &&
        import.meta.env?.VITE_ANTHROPIC_API_URL) ||
      'https://api.anthropic.com/v1/messages';

    if (apiKey) {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-dangerous-direct-browser-access': 'true',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: getConfiguredModel(),
          max_tokens: 1024,
          temperature: 0.2,
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: 'user',
              content: `${historyContext}\n\nRelato atual do estudante:\n"""\n${sanitizedText}\n"""`,
            },
          ],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const rawText = (data.content || []).map((c) => c.text || '').join('');
        const parsed = extractJsonObject(rawText);
        return {
          ...normalizeAnalysisResult(parsed),
          aiSource: getConfiguredModel(),
        };
      }
    }
  } catch (err) {
    console.warn(
      'API Claude indisponível, acionando analisador clínico integrado:',
      err
    );
  }

  await new Promise((r) => setTimeout(r, 650));
  return simulateAiAnalyze(sanitizedText, previousEntries);
};
