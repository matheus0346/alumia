import { DEFAULT_CLAUDE_MODEL } from '../constants/indicators';
import { normalizeAnalysisResult } from '../utils/clinical';

export const getConfiguredModel = () =>
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ANTHROPIC_MODEL) ||
  DEFAULT_CLAUDE_MODEL;

export const simulateAiAnalyze = (text = '') => {
  const lower = text.toLowerCase();
  const countMatches = (words) =>
    words.reduce((acc, w) => acc + (lower.includes(w) ? 1 : 0), 0);

  const rawAnsiedade = countMatches([
    'ansioso', 'ansiosa', 'ansiedade', 'medo', 'pânico', 'nervoso',
    'coração acelerado', 'falta de ar', 'angústia', 'preocupado', 'preocupada',
  ]);
  const rawDepressao = countMatches([
    'triste', 'tristeza', 'choro', 'chorar', 'vazio', 'desânimo',
    'sem esperança', 'sozinho', 'sozinha', 'solidão', 'ninguém',
  ]);
  const rawEstresse = countMatches([
    'estresse', 'estressado', 'estressada', 'pressão', 'cobrança',
    'cansaço', 'dormir mal', 'insônia', 'tensão', 'prova', 'simulado',
  ]);
  const rawBurnout = countMatches([
    'burnout', 'esgotado', 'esgotada', 'não aguento mais', 'exausto',
    'exausta', 'limite', 'desmoronar', 'fadiga',
  ]);
  const rawDesempenho = countMatches([
    'nota', 'prova', 'reprovar', 'baixo desempenho', 'dificuldade',
    'não entendo', 'matéria', 'atrasado',
  ]);
  const rawDesmotivacao = countMatches([
    'desmotivado', 'desmotivada', 'sem vontade', 'desistir', 'tanto faz',
    'sem sentido', 'chato', 'não quero',
  ]);
  const rawIsolamento = countMatches([
    'isolado', 'isolada', 'excluído', 'excluída', 'sem amigos',
    'ninguém liga', 'afastado', 'invisível', 'não pertenço',
  ]);
  const rawAutodestrutivo = countMatches([
    'sumir', 'desaparecer', 'morrer', 'acabar com tudo',
    'me machucar', 'não queria acordar',
  ]);
  const rawAgressividade = countMatches([
    'raiva', 'ódio', 'irritado', 'irritada', 'brigar', 'explodir',
    'bater', 'sem paciência',
  ]);
  const rawInseguranca = countMatches([
    'inseguro', 'insegura', 'vergonha', 'incapaz', 'feio', 'feia',
    'pior que os outros', 'inútil', 'fracasso',
  ]);
  const rawOscilacao = countMatches([
    'oscilando', 'instável', 'bipolar', 'mudando de humor',
    'montanha russa', 'uma hora bem outra mal',
  ]);
  const rawSobrecarga = countMatches([
    'sobrecarga', 'muita coisa', 'sufocado', 'sufocada', 'sufoco',
    'pesado', 'não dou conta',
  ]);

  const base = Math.min(15 + Math.floor(Math.random() * 8), 28);
  const calc = (count) =>
    Math.min(95, Math.max(5, base + count * 28 + Math.floor(Math.random() * 8)));

  const rawIndicators = {
    ansiedade: calc(rawAnsiedade),
    depressao: calc(rawDepressao),
    estresse: calc(rawEstresse),
    burnout: calc(rawBurnout),
    desempenho: calc(rawDesempenho),
    desmotivacao: calc(rawDesmotivacao),
    isolamento: calc(rawIsolamento),
    autodestrutivo:
      rawAutodestrutivo > 0
        ? Math.min(90, 42 + rawAutodestrutivo * 25)
        : Math.floor(Math.random() * 6),
    agressividade: calc(rawAgressividade),
    inseguranca: calc(rawInseguranca),
    oscilacao: calc(rawOscilacao),
    sobrecarga: calc(rawSobrecarga),
  };

  return {
    ...normalizeAnalysisResult(rawIndicators),
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

export const aiAnalyze = async (text = '') => {
  const sanitizedText = text.replace(/"/g, "'").slice(0, 4000);
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
          messages: [
            {
              role: 'user',
              content:
                `Você é um especialista em psicologia e saúde mental escolar. Analise o relato semanal de um estudante para orientar exclusivamente a equipe psicopedagógica da escola.\n` +
                `Retorne APENAS um objeto JSON válido (sem markdown) no seguinte formato:\n` +
                `{"ansiedade":0-100,"depressao":0-100,"estresse":0-100,"burnout":0-100,"desempenho":0-100,` +
                `"desmotivacao":0-100,"isolamento":0-100,"autodestrutivo":0-100,"agressividade":0-100,` +
                `"inseguranca":0-100,"oscilacao":0-100,"sobrecarga":0-100,` +
                `"nivel_risco":"baixo"|"atencao"|"alto",` +
                `"analise":"<2 a 3 frases clínicas em português para o psicólogo/orientador escolar, começando com 'O aluno'>"}\n\n` +
                `Regra nivel_risco: "alto" se autodestrutivo>=35 ou qualquer indicador>=70 ou média>=52; "atencao" se qualquer indicador>=40 ou média>=30; caso contrário "baixo".\n\n` +
                `Relato do estudante: "${sanitizedText}"`,
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
  return simulateAiAnalyze(sanitizedText);
};
