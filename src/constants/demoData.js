import { hash, normalizePhrase } from '../utils/crypto';
import { toLocalISO } from '../utils/date';

const daysAgoISO = (days) =>
  toLocalISO(new Date(Date.now() - days * 86400000));

export const DEMO_DATA = {
  schools: {
    'ESC-2025-ALUMIA': {
      token: 'ESC-2025-ALUMIA',
      name: 'Colégio Modelo Alumia',
      active: true,
      createdAt: Date.now() - 30 * 86400000,
    },
  },
  students: {
    'TURMA3A-01': {
      code: 'TURMA3A-01',
      pwdHash: hash('1234'),
      recoveryHash: hash(normalizePhrase('lua ponte vidro noite vento mar')),
      schoolToken: 'ESC-2025-ALUMIA',
      firstLogin: true,
      createdAt: Date.now() - 20 * 86400000,
    },
    'TURMA3A-02': {
      code: 'TURMA3A-02',
      pwdHash: hash('1234'),
      recoveryHash: hash(normalizePhrase('sol pedra rio sombra terra gelo')),
      schoolToken: 'ESC-2025-ALUMIA',
      firstLogin: true,
      createdAt: Date.now() - 15 * 86400000,
    },
    'TURMA3A-03': {
      code: 'TURMA3A-03',
      pwdHash: hash('1234'),
      recoveryHash: null,
      schoolToken: 'ESC-2025-ALUMIA',
      firstLogin: false,
      createdAt: Date.now() - 5 * 86400000,
    },
  },
  entries: [
    {
      id: 'demo-1',
      studentCode: 'TURMA3A-01',
      schoolToken: 'ESC-2025-ALUMIA',
      date: daysAgoISO(7),
      timestamp: Date.now() - 7 * 86400000,
      content:
        'A semana foi produtiva. Consegui estudar para os testes com antecedência e descansar com a família. Me sinto calmo e preparado.',
      indicators: {
        ansiedade: 20,
        depressao: 12,
        estresse: 30,
        burnout: 15,
        desempenho: 25,
        desmotivacao: 18,
        isolamento: 10,
        autodestrutivo: 0,
        agressividade: 5,
        inseguranca: 18,
        oscilacao: 12,
        sobrecarga: 25,
      },
      riskLevel: 'baixo',
      aiText:
        'O aluno apresenta excelente estabilidade emocional e senso de organização, com indicadores dentro da faixa regular de tranquilidade.',
      sinaisAlerta: [],
      fatoresProtetivos: [
        'Organização e engajamento nos estudos',
        'Apoio e convivência familiar',
        'Regulação emocional e tranquilidade',
      ],
      recomendacao:
        'Manter acompanhamento regular pelo diário e incentivar a continuidade dos hábitos de estudo e vínculos familiares positivos.',
      urgency: 'leve',
      aiSource: 'demo',
    },
    {
      id: 'demo-2',
      studentCode: 'TURMA3A-02',
      schoolToken: 'ESC-2025-ALUMIA',
      date: daysAgoISO(9),
      timestamp: Date.now() - 9 * 86400000,
      content:
        'Semana corrida com várias entregas de trabalho. Estou um pouco cansado e preocupado com as notas do simulado, mas tentando manter o ritmo.',
      indicators: {
        ansiedade: 48,
        depressao: 28,
        estresse: 54,
        burnout: 42,
        desempenho: 45,
        desmotivacao: 35,
        isolamento: 25,
        autodestrutivo: 0,
        agressividade: 10,
        inseguranca: 44,
        oscilacao: 30,
        sobrecarga: 52,
      },
      riskLevel: 'atencao',
      aiText:
        'O aluno demonstra sinais iniciais de desgaste e ansiedade frente às avaliações escolares. O quadro é situacional, mas requer observação preventiva.',
      sinaisAlerta: [
        'Pressão avaliativa e estresse',
        'Sobrecarga de entregas escolares',
        'Ansiedade pré-simulado',
      ],
      fatoresProtetivos: ['Esforço ativo para manter a rotina de estudos'],
      recomendacao:
        'Agendar conversa preventiva com a orientação pedagógica para apoio no planejamento de estudos e manejo de ansiedade pré-provas.',
      urgency: 'moderado',
      aiSource: 'demo',
    },
    {
      id: 'demo-3',
      studentCode: 'TURMA3A-02',
      schoolToken: 'ESC-2025-ALUMIA',
      date: daysAgoISO(2),
      timestamp: Date.now() - 2 * 86400000,
      content:
        'Não aguento mais a pressão das avaliações e a cobrança constante em casa. Me sinto exausto, tenho tido crises de choro à noite e sinto que não pertenço a lugar nenhum.',
      indicators: {
        ansiedade: 85,
        depressao: 72,
        estresse: 88,
        burnout: 80,
        desempenho: 68,
        desmotivacao: 74,
        isolamento: 80,
        autodestrutivo: 42,
        agressividade: 15,
        inseguranca: 82,
        oscilacao: 65,
        sobrecarga: 90,
      },
      riskLevel: 'alto',
      aiText:
        'O aluno manifesta sofrimento psíquico acentuado com sinais de sobrecarga crônica, isolamento e esgotamento. Em comparação ao registro anterior, houve escalada severa nos indicadores.',
      sinaisAlerta: [
        'Esgotamento e sobrecarga escolar aguda',
        'Crises de choro noturnas / Humor deprimido',
        'Sentimento de não pertencimento e isolamento',
        'Pressão acumulada (escola e família)',
      ],
      fatoresProtetivos: [],
      recomendacao:
        'Acionar imediatamente o psicólogo escolar para escuta individual acolhedora e planejar orientação cuidadosa junto à família sobre cobrança excessiva.',
      urgency: 'critico',
      aiSource: 'demo',
    },
  ],
};
