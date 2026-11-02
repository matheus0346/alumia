import { useState } from 'react';
import { IND } from '../constants/indicators';
import { Mn, Btn, Dv, Fld } from '../components/ui/Primitives';

export const Home = ({ go }) => (
  <div>
    <section
      style={{
        minHeight: '100vh',
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        padding: '80px 5%',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.022,
          backgroundImage:
            'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      <div style={{ maxWidth: 850, position: 'relative' }}>
        <div
          className="u0"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            border: '1px solid #1a1a1a',
            padding: '5px 14px',
            marginBottom: 30,
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#4ade80',
            }}
            className="pulse"
          />
          <Mn style={{ fontSize: 10.5, color: '#666', letterSpacing: '.1em' }}>
            PLATAFORMA DE BEM-ESTAR ESCOLAR COM IA · CLAUDE SONNET
          </Mn>
        </div>
        <h1
          className="u1"
          style={{
            fontFamily: "'Syne',sans-serif",
            fontSize: 'clamp(2.3rem,5.8vw,4.6rem)',
            fontWeight: 800,
            color: '#fff',
            lineHeight: 1.06,
            letterSpacing: '-.04em',
            marginBottom: 24,
          }}
        >
          Tecnologia para
          <br />
          <span style={{ color: '#444' }}>enxergar o que a</span>
          <br />
          escola não vê
        </h1>
        <p
          className="u2"
          style={{
            fontSize: 'clamp(.93rem,1.7vw,1.1rem)',
            color: '#777',
            lineHeight: 1.82,
            marginBottom: 38,
            maxWidth: 520,
          }}
        >
          ALUMIA usa inteligência artificial para identificar sinais de
          sofrimento emocional em estudantes — de forma anônima, segura e em
          conformidade com a LGPD.
        </p>
        <div
          className="u3"
          style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}
        >
          <Btn onClick={() => go('how')} v="light" sz="lg">
            COMO FUNCIONA →
          </Btn>
          <Btn onClick={() => go('contact')} v="ghost" sz="lg">
            SOLICITAR ACESSO
          </Btn>
        </div>
      </div>
    </section>

    <section
      style={{
        background: '#f6f6f6',
        padding: '46px 5%',
        borderBottom: '1px solid #eee',
      }}
    >
      <div style={{ maxWidth: 1060, margin: '0 auto' }}>
        <div
          style={{
            fontSize: 9.5,
            fontWeight: 700,
            color: '#aaa',
            letterSpacing: '.14em',
            marginBottom: 20,
            textAlign: 'center',
          }}
        >
          DADOS DE PESQUISA EDUCACIONAL
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(165px,1fr))',
            gap: 12,
          }}
        >
          {[
            ['1 em 7', 'jovens tem transtorno não diagnosticado', 'OMS, 2022'],
            ['27%', 'dos estudantes com sintomas de ansiedade', 'CEBRID, 2022'],
            ['62%', 'da evasão correlacionada a problemas emocionais', 'INEP, 2023'],
            ['50%', 'dos transtornos iniciam antes dos 14 anos', 'UNICEF, 2021'],
            ['40%', 'afetados por burnout escolar', 'Lancet, 2023'],
            ['1 em 4', 'em sofrimento recebe apoio na escola', 'ABP, 2022'],
          ].map(([n, d, s], i) => (
            <div
              key={i}
              className="hc"
              style={{
                background: '#fff',
                border: '1px solid #e8e8e8',
                padding: '16px 14px',
              }}
            >
              <div
                style={{
                  fontFamily: "'Syne',sans-serif",
                  fontSize: 'clamp(1.2rem,2.5vw,1.7rem)',
                  fontWeight: 800,
                  letterSpacing: '-.03em',
                  marginBottom: 3,
                }}
              >
                {n}
              </div>
              <div
                style={{
                  fontSize: 12.5,
                  color: '#666',
                  lineHeight: 1.5,
                  marginBottom: 3,
                }}
              >
                {d}
              </div>
              <Mn style={{ fontSize: 10, color: '#bbb' }}>{s}</Mn>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section style={{ background: '#000', padding: '60px 5%' }}>
      <div style={{ maxWidth: 880, margin: '0 auto', textAlign: 'center' }}>
        <div
          style={{
            fontSize: 9.5,
            fontWeight: 700,
            color: '#444',
            letterSpacing: '.14em',
            marginBottom: 10,
          }}
        >
          FLUXO ALUMIA
        </div>
        <h2
          style={{
            fontFamily: "'Syne',sans-serif",
            fontSize: 'clamp(1.4rem,2.8vw,2.1rem)',
            fontWeight: 700,
            color: '#fff',
            letterSpacing: '-.03em',
            marginBottom: 36,
          }}
        >
          Da escrita à intervenção — com total privacidade
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))',
            gap: 2,
            marginBottom: 26,
          }}
        >
          {[
            ['01', 'Escola cria alunos', 'Código anônimo'],
            ['02', 'Aluno escreve', 'Diário acolhedor'],
            ['03', 'Claude analisa', '12 indicadores'],
            ['04', 'Escola interpreta', 'Gráficos e laudo'],
            ['05', 'Equipe age', 'Intervenção guiada'],
          ].map(([n, t, d]) => (
            <div
              key={n}
              style={{
                background: '#090909',
                border: '1px solid #161616',
                padding: '20px 14px',
                textAlign: 'left',
              }}
            >
              <Mn
                style={{
                  color: '#333',
                  fontSize: 20,
                  display: 'block',
                  marginBottom: 10,
                }}
              >
                {n}
              </Mn>
              <div
                style={{
                  fontFamily: "'Syne',sans-serif",
                  fontWeight: 700,
                  fontSize: 13,
                  color: '#fff',
                  marginBottom: 4,
                }}
              >
                {t}
              </div>
              <div style={{ fontSize: 11.5, color: '#666', lineHeight: 1.5 }}>
                {d}
              </div>
            </div>
          ))}
        </div>
        <Btn onClick={() => go('how')} v="light">
          VER DETALHES →
        </Btn>
      </div>
    </section>

    <section style={{ padding: '68px 5%' }}>
      <div
        style={{
          maxWidth: 1060,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(270px,1fr))',
          gap: 48,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 9.5,
              fontWeight: 700,
              color: '#aaa',
              letterSpacing: '.14em',
              marginBottom: 11,
            }}
          >
            O PROBLEMA
          </div>
          <h2
            style={{
              fontFamily: "'Syne',sans-serif",
              fontSize: 'clamp(1.4rem,2.8vw,2.1rem)',
              fontWeight: 700,
              lineHeight: 1.12,
              letterSpacing: '-.03em',
              marginBottom: 14,
            }}
          >
            Problemas invisíveis que viram crises
          </h2>
          <p
            style={{
              fontSize: 14.5,
              color: '#555',
              lineHeight: 1.85,
              marginBottom: 13,
            }}
          >
            Ansiedade, burnout, depressão e bullying raramente chegam aos
            profissionais. Os alunos não falam, os sinais são sutis, e a janela
            de intervenção se fecha rapidamente.
          </p>
          <p
            style={{
              fontSize: 14.5,
              color: '#555',
              lineHeight: 1.85,
              marginBottom: 22,
            }}
          >
            ALUMIA cria um canal seguro e anônimo de expressão onde a IA detecta
            o que a linguagem esconde e entrega indicadores claros para os
            responsáveis da escola.
          </p>
          <Btn onClick={() => go('about')}>SAIBA MAIS</Btn>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 9,
          }}
        >
          {[
            ['😰', 'Ansiedade', '30% dos estudantes'],
            ['😶', 'Isolamento', 'Principal barreira'],
            ['💢', 'Bullying', '85% não reportado'],
            ['🔥', 'Burnout', 'Crescente pós-2020'],
            ['😔', 'Depressão', 'Subdiagnosticada'],
            ['😤', 'Agressividade', 'Sofrimento oculto'],
          ].map(([ic, l, d], i) => (
            <div
              key={i}
              className="hc"
              style={{ padding: '14px', border: '1px solid #e8e8e8' }}
            >
              <div style={{ fontSize: 19, marginBottom: 7 }}>{ic}</div>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>
                {l}
              </div>
              <div style={{ fontSize: 11.5, color: '#999' }}>{d}</div>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section
      style={{
        padding: '36px 5%',
        background: '#f6f6f6',
        borderTop: '1px solid #eee',
      }}
    >
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <div
          style={{
            fontSize: 9.5,
            fontWeight: 700,
            color: '#aaa',
            letterSpacing: '.14em',
            marginBottom: 14,
          }}
        >
          FONTES E REFERÊNCIAS
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(285px,1fr))',
            gap: 7,
          }}
        >
          {[
            'OMS — World Mental Health Report (2022)',
            "UNICEF — The State of the World's Children (2021)",
            'CEBRID/UNIFESP — V Levantamento Nacional (2022)',
            'INEP/MEC — Indicadores de Fluxo Escolar (2023)',
            'Lancet Psychiatry — Global prevalence of youth burnout (2023)',
            'ABP — Saúde Mental na Escola (2022)',
            'CFP — Referências para Psicólogos na Educação (2021)',
            'UNICAMP — Saúde Mental de Adolescentes Brasileiros (2022)',
          ].map((r, i) => (
            <div
              key={i}
              style={{
                padding: '8px 11px',
                background: '#fff',
                border: '1px solid #eee',
                fontSize: 12,
                color: '#777',
                display: 'flex',
                gap: 6,
              }}
            >
              <Mn style={{ fontSize: 10, color: '#ccc', flexShrink: 0 }}>
                [{i + 1}]
              </Mn>
              {r}
            </div>
          ))}
        </div>
      </div>
    </section>
  </div>
);

export const About = () => (
  <div style={{ paddingTop: 60 }}>
    <section
      style={{
        background: '#000',
        padding: '68px 5%',
        minHeight: 280,
        display: 'flex',
        alignItems: 'flex-end',
      }}
    >
      <div style={{ maxWidth: 680 }}>
        <div
          className="u0"
          style={{
            fontSize: 9.5,
            fontWeight: 700,
            color: '#444',
            letterSpacing: '.14em',
            marginBottom: 11,
          }}
        >
          SOBRE O ALUMIA
        </div>
        <h1
          className="u1"
          style={{
            fontFamily: "'Syne',sans-serif",
            fontSize: 'clamp(1.9rem,4.8vw,3.7rem)',
            fontWeight: 800,
            color: '#fff',
            lineHeight: 1.06,
            letterSpacing: '-.04em',
          }}
        >
          Uma nova forma de cuidar de quem aprende
        </h1>
      </div>
    </section>
    <section style={{ padding: '58px 5%', maxWidth: 1020, margin: '0 auto' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))',
          gap: 44,
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: "'Syne',sans-serif",
              fontSize: '1.35rem',
              fontWeight: 700,
              marginBottom: 13,
              letterSpacing: '-.02em',
            }}
          >
            Nossa missão
          </h2>
          <p
            style={{
              fontSize: 14.5,
              color: '#555',
              lineHeight: 1.85,
              marginBottom: 13,
            }}
          >
            ALUMIA nasceu de uma premissa simples: todo estudante merece ser
            ouvido, mesmo quando não consegue falar. Combinamos a eficácia
            terapêutica da escrita com inteligência artificial para criar um
            sistema de alerta precoce que respeita a privacidade de cada aluno.
          </p>
          <p style={{ fontSize: 14.5, color: '#555', lineHeight: 1.85 }}>
            Trabalhamos com escolas públicas e privadas, orientando equipes
            pedagógicas a transformarem dados em cuidado real.
          </p>
        </div>
        <div>
          <h2
            style={{
              fontFamily: "'Syne',sans-serif",
              fontSize: '1.35rem',
              fontWeight: 700,
              marginBottom: 13,
              letterSpacing: '-.02em',
            }}
          >
            O que identificamos
          </h2>
          {[
            'Ansiedade e estresse acadêmico crônico',
            'Burnout escolar e desmotivação profunda',
            'Sinais precoces de depressão',
            'Isolamento social e falta de pertencimento',
            'Pensamentos autodestrutivos e risco elevado',
            'Agressividade como manifestação de sofrimento',
            'Sobrecarga emocional e oscilação de humor',
            'Baixo desempenho de origem emocional',
          ].map((i) => (
            <div
              key={i}
              style={{ display: 'flex', gap: 9, marginBottom: 8 }}
            >
              <div
                style={{
                  width: 4,
                  height: 4,
                  background: '#000',
                  flexShrink: 0,
                  marginTop: 7,
                }}
              />
              <span style={{ fontSize: 14, color: '#555' }}>{i}</span>
            </div>
          ))}
        </div>
      </div>
      <Dv m="40px 0" />
      <div
        style={{
          background: '#f6f6f6',
          padding: 32,
          borderLeft: '3px solid #000',
        }}
      >
        <p
          style={{
            fontSize: '1.03rem',
            fontStyle: 'italic',
            color: '#333',
            lineHeight: 1.85,
            maxWidth: 620,
          }}
        >
          "O aluno não precisa pedir ajuda em voz alta. O texto que ele escreve
          toda semana fala por ele — e o ALUMIA está ouvindo, com discrição e
          responsabilidade."
        </p>
        <div style={{ marginTop: 9, fontSize: 12, color: '#aaa' }}>
          — Manifesto ALUMIA
        </div>
      </div>
    </section>
  </div>
);

export const How = () => (
  <div style={{ paddingTop: 60 }}>
    <section
      style={{
        background: '#000',
        padding: '68px 5%',
        minHeight: 260,
        display: 'flex',
        alignItems: 'flex-end',
      }}
    >
      <div style={{ maxWidth: 680 }}>
        <div
          className="u0"
          style={{
            fontSize: 9.5,
            fontWeight: 700,
            color: '#444',
            letterSpacing: '.14em',
            marginBottom: 11,
          }}
        >
          COMO FUNCIONA
        </div>
        <h1
          className="u1"
          style={{
            fontFamily: "'Syne',sans-serif",
            fontSize: 'clamp(1.9rem,4.8vw,3.5rem)',
            fontWeight: 800,
            color: '#fff',
            lineHeight: 1.06,
            letterSpacing: '-.04em',
          }}
        >
          Do texto à intervenção
        </h1>
      </div>
    </section>
    <section style={{ padding: '52px 5%', maxWidth: 840, margin: '0 auto' }}>
      {[
        {
          n: '01',
          t: 'Escola acessa com token',
          d: 'O gestor recebe um token único da ALUMIA. Com ele, entra no dashboard e cria perfis anônimos — apenas código e senha, sem dados pessoais.',
          ic: '🔑',
        },
        {
          n: '02',
          t: 'Aluno recebe código e senha',
          d: 'Cada aluno recebe um código definido pela escola. No primeiro login, recebe sua frase secreta de recuperação.',
          ic: '🪪',
        },
        {
          n: '03',
          t: 'Aluno escreve no diário acolhedor',
          d: 'Semanalmente, o aluno acessa o diário digital. A interface oferece um espaço seguro, acolhedor e livre de rótulos clínicos para o estudante.',
          ic: '📖',
        },
        {
          n: '04',
          t: 'Claude Sonnet analisa 12 indicadores',
          d: 'O modelo processa o texto em segundos, avalia 12 dimensões emocionais (0 a 100%) e redige uma síntese clínica para os profissionais da escola.',
          ic: '🤖',
        },
        {
          n: '05',
          t: 'Dashboard da escola atualizado',
          d: 'Psicólogos e coordenadores visualizam gráficos de barras, evolução histórica dos 12 indicadores, textos originais e alertas de risco.',
          ic: '📊',
        },
        {
          n: '06',
          t: 'Equipe realiza intervenção',
          d: 'Com os dados em mãos, a equipe aciona o psicólogo, conversa com o aluno ou notifica responsáveis — sempre de forma ética.',
          ic: '🎯',
        },
      ].map(({ n, t, d, ic }, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            gap: 20,
            padding: '26px 0',
            borderBottom: '1px solid #eee',
            alignItems: 'flex-start',
          }}
        >
          <Mn
            style={{
              fontSize: 22,
              color: '#e0e0e0',
              flexShrink: 0,
              fontWeight: 500,
              width: 38,
            }}
          >
            {n}
          </Mn>
          <div>
            <div
              style={{
                display: 'flex',
                gap: 8,
                alignItems: 'center',
                marginBottom: 7,
              }}
            >
              <span style={{ fontSize: 16 }}>{ic}</span>
              <h3
                style={{
                  fontFamily: "'Syne',sans-serif",
                  fontWeight: 700,
                  fontSize: '.95rem',
                  letterSpacing: '-.01em',
                }}
              >
                {t}
              </h3>
            </div>
            <p style={{ fontSize: 14.5, color: '#666', lineHeight: 1.8 }}>{d}</p>
          </div>
        </div>
      ))}
    </section>
    <section
      style={{
        background: '#f6f6f6',
        padding: '44px 5%',
        borderTop: '1px solid #eee',
      }}
    >
      <div style={{ maxWidth: 840, margin: '0 auto' }}>
        <h2
          style={{
            fontFamily: "'Syne',sans-serif",
            fontSize: '1.3rem',
            fontWeight: 700,
            marginBottom: 18,
            letterSpacing: '-.02em',
          }}
        >
          Os 12 indicadores analisados
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(185px,1fr))',
            gap: 8,
          }}
        >
          {Object.values(IND).map((l) => (
            <div
              key={l}
              style={{
                padding: '9px 13px',
                background: '#fff',
                border: '1px solid #eee',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 7,
              }}
            >
              <div
                style={{
                  width: 4,
                  height: 4,
                  background: '#000',
                  flexShrink: 0,
                }}
              />
              {l}
            </div>
          ))}
        </div>
      </div>
    </section>
  </div>
);

export const Privacy = () => (
  <div style={{ paddingTop: 60 }}>
    <section
      style={{
        background: '#000',
        padding: '68px 5%',
        minHeight: 260,
        display: 'flex',
        alignItems: 'flex-end',
      }}
    >
      <div style={{ maxWidth: 680 }}>
        <div
          className="u0"
          style={{
            fontSize: 9.5,
            fontWeight: 700,
            color: '#444',
            letterSpacing: '.14em',
            marginBottom: 11,
          }}
        >
          PRIVACIDADE & LGPD
        </div>
        <h1
          className="u1"
          style={{
            fontFamily: "'Syne',sans-serif",
            fontSize: 'clamp(1.9rem,4.8vw,3.5rem)',
            fontWeight: 800,
            color: '#fff',
            lineHeight: 1.06,
            letterSpacing: '-.04em',
          }}
        >
          Anonimato total. Sem exceções.
        </h1>
      </div>
    </section>
    <section style={{ padding: '52px 5%', maxWidth: 920, margin: '0 auto' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(255px,1fr))',
          gap: 12,
          marginBottom: 36,
        }}
      >
        {[
          {
            t: 'Zero dados pessoais',
            d: 'ALUMIA não armazena nome, CPF ou qualquer dado identificável. O sistema opera exclusivamente com códigos anônimos.',
          },
          {
            t: 'Código único por aluno',
            d: 'Cada aluno recebe um ID gerado pela escola. Apenas o responsável — fora do sistema — conhece a correspondência.',
          },
          {
            t: 'Admin sem acesso sensível',
            d: 'Administradores não podem ver textos, indicadores individuais ou qualquer dado identificável. Segmentação por design.',
          },
          {
            t: 'Conformidade LGPD',
            d: 'Sistema projetado em conformidade com a Lei 13.709/2018, incluindo minimização de dados e segurança por padrão.',
          },
          {
            t: 'Chave de recuperação',
            d: 'No primeiro acesso, o aluno recebe uma frase secreta exibida apenas uma vez — garantindo recuperação de senha autônoma.',
          },
          {
            t: 'Proteção emocional do aluno',
            d: 'Laudos clínicos e porcentagens de risco são restritos aos profissionais da escola, preservando o acolhimento do aluno.',
          },
        ].map(({ t, d }, i) => (
          <div
            key={i}
            className="hc"
            style={{ padding: 20, border: '1px solid #e8e8e8' }}
          >
            <div
              style={{
                width: 20,
                height: 3,
                background: '#000',
                marginBottom: 11,
              }}
            />
            <h3
              style={{
                fontFamily: "'Syne',sans-serif",
                fontWeight: 700,
                fontSize: '.9rem',
                marginBottom: 8,
              }}
            >
              {t}
            </h3>
            <p style={{ fontSize: 13.5, color: '#666', lineHeight: 1.7 }}>
              {d}
            </p>
          </div>
        ))}
      </div>
      <div style={{ background: '#000', padding: '28px 32px' }}>
        <h3
          style={{
            fontFamily: "'Syne',sans-serif",
            fontWeight: 700,
            fontSize: '1rem',
            marginBottom: 10,
            color: '#fff',
          }}
        >
          Por que o anonimato é fundamental?
        </h3>
        <p style={{ fontSize: 14.5, color: '#777', lineHeight: 1.85 }}>
          Em saúde mental, o medo de exposição é a principal barreira para
          buscar ajuda. Quando o aluno sabe que suas palavras não serão
          associadas ao seu nome — nem para o administrador, nem para quem criou
          a plataforma — ele escreve com mais liberdade. É essa sinceridade que
          salva trajetórias.
        </p>
      </div>
    </section>
  </div>
);

export const Team = () => (
  <div style={{ paddingTop: 60 }}>
    <section
      style={{
        background: '#000',
        padding: '68px 5%',
        minHeight: 260,
        display: 'flex',
        alignItems: 'flex-end',
      }}
    >
      <div style={{ maxWidth: 680 }}>
        <div
          className="u0"
          style={{
            fontSize: 9.5,
            fontWeight: 700,
            color: '#444',
            letterSpacing: '.14em',
            marginBottom: 11,
          }}
        >
          EQUIPE
        </div>
        <h1
          className="u1"
          style={{
            fontFamily: "'Syne',sans-serif",
            fontSize: 'clamp(1.9rem,4.8vw,3.5rem)',
            fontWeight: 800,
            color: '#fff',
            lineHeight: 1.06,
            letterSpacing: '-.04em',
          }}
        >
          Pessoas que acreditam na educação
        </h1>
      </div>
    </section>
    <section style={{ padding: '52px 5%', maxWidth: 920, margin: '0 auto' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(245px,1fr))',
          gap: 12,
        }}
      >
        {[
          {
            name: 'Ana Ferreira',
            role: 'CEO & Co-fundadora',
            desc: 'Pedagoga com 12 anos em educação pública. Idealizou o ALUMIA após testemunhar como problemas emocionais destroem trajetórias acadêmicas.',
          },
          {
            name: 'Lucas Martins',
            role: 'CTO & Co-fundador',
            desc: 'Engenheiro de IA especializado em NLP aplicado à saúde mental. Desenvolveu os modelos de análise emocional do sistema.',
          },
          {
            name: 'Dra. Carla Souza',
            role: 'Diretora de Psicologia',
            desc: 'Psicóloga especialista em saúde mental adolescente. Coordena a validação científica dos indicadores e protocolos de intervenção.',
          },
          {
            name: 'Rafael Costa',
            role: 'Head de Produto',
            desc: 'Designer de produto focado em EdTech. Responsável pela UX que equilibra simplicidade visual com profundidade funcional.',
          },
          {
            name: 'Beatriz Alves',
            role: 'Head Jurídico & LGPD',
            desc: 'Advogada especialista em proteção de dados. Garante conformidade integral com a LGPD em todas as decisões técnicas.',
          },
          {
            name: 'Thiago Nunes',
            role: 'Head de Parcerias',
            desc: 'Ex-diretor educacional da rede estadual. Conecta o ALUMIA com secretarias e redes de ensino em todo o Brasil.',
          },
        ].map(({ name, role, desc }, i) => (
          <div
            key={i}
            className="hc"
            style={{ padding: 20, border: '1px solid #e8e8e8' }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                background: '#000',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Syne',sans-serif",
                fontWeight: 700,
                fontSize: 14,
                color: '#fff',
                marginBottom: 11,
              }}
            >
              {name[0]}
            </div>
            <div
              style={{
                fontFamily: "'Syne',sans-serif",
                fontWeight: 700,
                fontSize: '.93rem',
                marginBottom: 2,
              }}
            >
              {name}
            </div>
            <div
              style={{
                fontSize: 10,
                color: '#aaa',
                letterSpacing: '.04em',
                textTransform: 'uppercase',
                marginBottom: 8,
              }}
            >
              {role}
            </div>
            <p style={{ fontSize: 13, color: '#666', lineHeight: 1.7 }}>
              {desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  </div>
);

export const ContactPage = () => {
  const [f, setF] = useState({ name: '', email: '', school: '', msg: '' });
  const [sent, setSent] = useState(false);
  return (
    <div style={{ paddingTop: 60 }}>
      <section
        style={{
          background: '#000',
          padding: '68px 5%',
          minHeight: 240,
          display: 'flex',
          alignItems: 'flex-end',
        }}
      >
        <div style={{ maxWidth: 680 }}>
          <div
            className="u0"
            style={{
              fontSize: 9.5,
              fontWeight: 700,
              color: '#444',
              letterSpacing: '.14em',
              marginBottom: 11,
            }}
          >
            CONTATO
          </div>
          <h1
            className="u1"
            style={{
              fontFamily: "'Syne',sans-serif",
              fontSize: 'clamp(1.9rem,4.8vw,3.3rem)',
              fontWeight: 800,
              color: '#fff',
              lineHeight: 1.06,
              letterSpacing: '-.04em',
            }}
          >
            Leve o ALUMIA para sua escola
          </h1>
        </div>
      </section>
      <section style={{ padding: '52px 5%', maxWidth: 660, margin: '0 auto' }}>
        {sent ? (
          <div style={{ textAlign: 'center', padding: '48px 20px' }}>
            <div style={{ fontSize: 34, marginBottom: 13 }}>✓</div>
            <h3
              style={{
                fontFamily: "'Syne',sans-serif",
                fontWeight: 700,
                fontSize: '1.15rem',
                marginBottom: 9,
              }}
            >
              Mensagem recebida
            </h3>
            <p style={{ color: '#666', fontSize: 14 }}>
              Nossa equipe entrará em contato em até 2 dias úteis.
            </p>
          </div>
        ) : (
          <>
            <div
              style={{
                marginBottom: 20,
                padding: '12px 15px',
                background: '#f6f6f6',
                border: '1px solid #eee',
                fontSize: 14,
                color: '#666',
                lineHeight: 1.6,
              }}
            >
              Interessado em implementar o ALUMIA? Preencha o formulário e
              agende uma demonstração gratuita.
            </div>
            <Fld
              label="NOME COMPLETO"
              value={f.name}
              onChange={(v) => setF((p) => ({ ...p, name: v }))}
              placeholder="Seu nome"
            />
            <Fld
              label="E-MAIL INSTITUCIONAL"
              type="email"
              value={f.email}
              onChange={(v) => setF((p) => ({ ...p, email: v }))}
              placeholder="voce@escola.edu.br"
            />
            <Fld
              label="ESCOLA / REDE"
              value={f.school}
              onChange={(v) => setF((p) => ({ ...p, school: v }))}
              placeholder="Nome da instituição"
            />
            <Fld
              label="MENSAGEM"
              value={f.msg}
              onChange={(v) => setF((p) => ({ ...p, msg: v }))}
              placeholder="Como podemos ajudar?"
              rows={5}
            />
            <Btn
              full
              onClick={() => {
                if (f.name && f.email) setSent(true);
              }}
            >
              ENVIAR MENSAGEM
            </Btn>
          </>
        )}
      </section>
    </div>
  );
};
