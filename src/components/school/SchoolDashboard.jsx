import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from 'recharts';
import { IND, INDICATOR_COLORS, RISK } from '../../constants/indicators';
import { calcUrgency, calcTrend, iColor } from '../../utils/clinical';
import { fmtDate, fmtTs } from '../../utils/date';
import { useApp } from '../../context/AppContext';
import { Shell, Mn, Tag, Inf, IBar, Dv, Fld, Btn } from '../ui/Primitives';

const ClinicalParametersBlock = ({ entry }) => {
  if (!entry) return null;
  const sinais = entry.sinaisAlerta || [];
  const protetivos = entry.fatoresProtetivos || [];
  const recomendacao = entry.recomendacao || '';

  if (sinais.length === 0 && protetivos.length === 0 && !recomendacao) {
    return null;
  }

  return (
    <div style={{ marginTop: 12, marginBottom: 14 }}>
      {(sinais.length > 0 || protetivos.length > 0) && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))',
            gap: 10,
            marginBottom: recomendacao ? 10 : 0,
          }}
        >
          {sinais.length > 0 && (
            <div
              style={{
                padding: '10px 12px',
                background: '#fff5f5',
                border: '1px solid #fecaca',
              }}
            >
              <div
                style={{
                  fontSize: 9.5,
                  fontWeight: 700,
                  color: '#dc2626',
                  letterSpacing: '.08em',
                  marginBottom: 6,
                }}
              >
                ⚠️ SINAIS DE ALERTA IDENTIFICADOS
              </div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {sinais.map((s, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: 11.5,
                      color: '#b91c1c',
                      background: '#fff',
                      border: '1px solid #fca5a5',
                      padding: '2px 7px',
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {protetivos.length > 0 && (
            <div
              style={{
                padding: '10px 12px',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
              }}
            >
              <div
                style={{
                  fontSize: 9.5,
                  fontWeight: 700,
                  color: '#15803d',
                  letterSpacing: '.08em',
                  marginBottom: 6,
                }}
              >
                🛡️ FATORES PROTETIVOS / RECURSOS
              </div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {protetivos.map((p, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: 11.5,
                      color: '#166534',
                      background: '#fff',
                      border: '1px solid #86efac',
                      padding: '2px 7px',
                    }}
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {recomendacao && (
        <div
          style={{
            padding: '10px 13px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderLeft: '3px solid #0f172a',
            fontSize: 12.5,
            color: '#334155',
            lineHeight: 1.55,
          }}
        >
          <strong style={{ color: '#0f172a' }}>
            🎯 Conduta Recomendada à Escola:{' '}
          </strong>
          {recomendacao}
        </div>
      )}
    </div>
  );
};

export const SchoolDashboard = () => {
  const { auth, logout, db, createStudent, resetStudentAccess } = useApp();

  const [tab, setTab] = useState('painel');
  const [selStCode, setSelStCode] = useState(null);
  const [selEntryId, setSelEntryId] = useState(null);
  const [filt, setFilt] = useState('all');
  const [aiFilt, setAiFilt] = useState('all');
  const [activeLines, setActiveLines] = useState([
    'ansiedade',
    'estresse',
    'burnout',
    'depressao',
  ]);

  const [newSt, setNewSt] = useState({ code: '', pwd: '' });
  const [stErr, setStErr] = useState('');
  const [stOk, setStOk] = useState('');
  const [resetTarget, setResetTarget] = useState(null);
  const [resetPwd, setResetPwd] = useState('');

  const myStudents = useMemo(
    () =>
      Object.values(db.students || {}).filter(
        (s) => s.schoolToken === auth.token
      ),
    [db.students, auth.token]
  );

  const myEntries = useMemo(
    () =>
      (db.entries || [])
        .filter((e) => e.schoolToken === auth.token)
        .sort(
          (a, b) =>
            b.date.localeCompare(a.date) ||
            (b.timestamp || 0) - (a.timestamp || 0)
        ),
    [db.entries, auth.token]
  );

  const latestBy = useMemo(() => {
    const m = {};
    myEntries.forEach((e) => {
      if (!m[e.studentCode]) m[e.studentCode] = e;
    });
    return m;
  }, [myEntries]);

  const allBy = useMemo(() => {
    const m = {};
    myEntries.forEach((e) => {
      if (!m[e.studentCode]) m[e.studentCode] = [];
      m[e.studentCode].push(e);
    });
    return m;
  }, [myEntries]);

  const stuData = useMemo(
    () =>
      myStudents.map((s) => ({
        ...s,
        latest: latestBy[s.code] || null,
        all: allBy[s.code] || [],
        risk: latestBy[s.code]?.riskLevel || 'sem_dados',
        urgency: calcUrgency(latestBy[s.code]),
        trend: calcTrend(allBy[s.code] || []),
        count: (allBy[s.code] || []).length,
      })),
    [myStudents, latestBy, allBy]
  );

  const selSt = useMemo(
    () => stuData.find((s) => s.code === selStCode) || null,
    [stuData, selStCode]
  );

  const selEntry = useMemo(
    () => myEntries.find((e) => e.id === selEntryId) || null,
    [myEntries, selEntryId]
  );

  const alto = stuData.filter((s) => s.risk === 'alto').length;
  const atenc = stuData.filter((s) => s.risk === 'atencao').length;
  const baixo = stuData.filter((s) => s.risk === 'baixo').length;
  const criticos = stuData.filter(
    (s) => s.urgency === 'critico' || s.risk === 'alto'
  );
  const piora = stuData.filter(
    (s) => s.trend === 'worsening' && s.risk !== 'alto'
  );

  const toggleLineIndicator = (key) => {
    setActiveLines((prev) =>
      prev.includes(key)
        ? prev.length > 1
          ? prev.filter((k) => k !== key)
          : prev
        : [...prev, key]
    );
  };

  const handleCreateStudent = async () => {
    setStErr('');
    setStOk('');
    const res = await createStudent({
      code: newSt.code,
      password: newSt.pwd,
      schoolToken: auth.token,
    });
    if (!res.ok) {
      setStErr(res.error);
      return;
    }
    setStOk(`Aluno "${res.code}" criado com sucesso.`);
    setNewSt({ code: '', pwd: '' });
  };

  const handleResetStudent = async (code) => {
    setStErr('');
    setStOk('');
    const res = await resetStudentAccess({
      code,
      newPassword: resetPwd,
      schoolToken: auth.token,
    });
    if (!res.ok) {
      setStErr(res.error);
      return;
    }
    setStOk(`Senha do aluno "${code}" redefinida com sucesso.`);
    setResetTarget(null);
    setResetPwd('');
  };

  const TABS = [
    ['painel', '📊 Painel'],
    ['indicadores', '📈 Indicadores'],
    ['analise', '🤖 Análise IA'],
    ['textos', '📝 Textos'],
    ['alertas', '🚨 Alertas'],
    ['gerenciar', '⚙️ Gerenciar'],
  ];

  const fStud =
    filt === 'all' ? stuData : stuData.filter((s) => s.risk === filt);

  const filteredAnalyses =
    aiFilt === 'all'
      ? myEntries
      : myEntries.filter((e) => e.riskLevel === aiFilt);

  return (
    <Shell
      title={auth.schoolName || 'Dashboard da Escola'}
      sub={auth.token}
      tabs={TABS}
      tab={tab}
      setTab={(t) => {
        setTab(t);
        setSelStCode(null);
        setSelEntryId(null);
      }}
      onLogout={logout}
      badge={{ alertas: criticos.length }}
    >
      {/* ── PAINEL ── */}
      {tab === 'painel' && (
        <>
          {criticos.length > 0 && (
            <Inf type="err">
              ⚠️ {criticos.length} aluno(s) em{' '}
              <strong>alto risco / crítico</strong>. Verifique a aba Alertas
              imediatamente.
            </Inf>
          )}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit,minmax(145px,1fr))',
              gap: 12,
              marginBottom: 18,
            }}
          >
            {[
              ['Total', myStudents.length, '#111'],
              ['Alto Risco', alto, '#dc2626'],
              ['Atenção', atenc, '#b45309'],
              ['Baixo', baixo, '#15803d'],
              [
                'Sem dados',
                stuData.filter((s) => s.risk === 'sem_dados').length,
                '#ccc',
              ],
            ].map(([l, v, c], i) => (
              <div
                key={i}
                style={{
                  background: '#fff',
                  border: '1px solid #e8e8e8',
                  padding: '18px 16px',
                  borderTop: `3px solid ${c}`,
                }}
              >
                <div
                  style={{
                    fontSize: 9.5,
                    color: '#aaa',
                    letterSpacing: '.09em',
                    marginBottom: 5,
                    fontWeight: 700,
                  }}
                >
                  {l.toUpperCase()}
                </div>
                <div
                  style={{
                    fontFamily: "'Syne',sans-serif",
                    fontSize: 26,
                    fontWeight: 700,
                    color: c,
                  }}
                >
                  {v}
                </div>
              </div>
            ))}
          </div>

          {piora.length > 0 && (
            <Inf type="warn">
              📈 {piora.length} aluno(s) com tendência de piora detectada nas
              últimas análises.
            </Inf>
          )}

          {myEntries.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))',
                gap: 14,
              }}
            >
              <div
                style={{
                  background: '#fff',
                  border: '1px solid #e8e8e8',
                  padding: 20,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#aaa',
                    letterSpacing: '.09em',
                    marginBottom: 14,
                  }}
                >
                  ÚLTIMAS ANÁLISES RECEBIDAS
                </div>
                {myEntries.slice(0, 6).map((e) => (
                  <div
                    key={e.id}
                    onClick={() => {
                      setSelEntryId(e.id);
                      setTab('textos');
                    }}
                    className="hr"
                    style={{
                      padding: '10px 0',
                      borderBottom: '1px solid #f5f5f5',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <Mn
                        style={{
                          fontSize: 12.5,
                          fontWeight: 700,
                          display: 'block',
                        }}
                      >
                        {e.studentCode}
                      </Mn>
                      <div
                        style={{ fontSize: 10.5, color: '#aaa', marginTop: 1 }}
                      >
                        {fmtDate(e.date)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <Tag risk={e.riskLevel} />
                      {e.urgency && <Tag urgency={e.urgency} />}
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  background: '#fff',
                  border: '1px solid #e8e8e8',
                  padding: 20,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#aaa',
                    letterSpacing: '.09em',
                    marginBottom: 14,
                  }}
                >
                  DISTRIBUIÇÃO POR NÍVEL DE RISCO
                </div>
                <div style={{ height: 190 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { n: 'Alto', v: alto, f: '#dc2626' },
                        { n: 'Atenção', v: atenc, f: '#b45309' },
                        { n: 'Baixo', v: baixo, f: '#15803d' },
                        {
                          n: 'S/Dados',
                          v: stuData.filter((s) => s.risk === 'sem_dados')
                            .length,
                          f: '#e0e0e0',
                        },
                      ]}
                      margin={{ top: 5, right: 5, left: -24, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                      <XAxis dataKey="n" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 9 }} allowDecimals={false} />
                      <Tooltip contentStyle={{ fontSize: 12 }} />
                      <Bar dataKey="v" radius={[3, 3, 0, 0]}>
                        {[
                          { f: '#dc2626' },
                          { f: '#b45309' },
                          { f: '#15803d' },
                          { f: '#e0e0e0' },
                        ].map((e, i) => (
                          <Cell key={i} fill={e.f} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {myStudents.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: '44px 20px',
                color: '#aaa',
                background: '#fff',
                border: '1px dashed #e0e0e0',
                fontSize: 14,
              }}
            >
              Nenhum aluno cadastrado.{' '}
              <button
                onClick={() => setTab('gerenciar')}
                style={{
                  color: '#000',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  background: 'none',
                  fontSize: 14,
                }}
              >
                Criar na aba Gerenciar
              </button>
            </div>
          )}
        </>
      )}

      {/* ── INDICADORES ── */}
      {tab === 'indicadores' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: selSt ? '260px 1fr' : '1fr',
            gap: 16,
            alignItems: 'start',
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                gap: 5,
                marginBottom: 12,
                flexWrap: 'wrap',
              }}
            >
              {[
                ['all', 'Todos'],
                ['alto', 'Alto'],
                ['atencao', 'Atenção'],
                ['baixo', 'Baixo'],
                ['sem_dados', 'S/dados'],
              ].map(([v, l]) => (
                <button
                  key={v}
                  onClick={() => setFilt(v)}
                  style={{
                    padding: '4px 10px',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: filt === v ? '#000' : '#fff',
                    color: filt === v ? '#fff' : '#888',
                    border: '1px solid #e0e0e0',
                    transition: 'all .14s',
                  }}
                >
                  {l}
                </button>
              ))}
            </div>
            <div style={{ background: '#fff', border: '1px solid #e8e8e8' }}>
              <div
                style={{
                  padding: '11px 15px',
                  borderBottom: '1px solid #eee',
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#aaa',
                  letterSpacing: '.09em',
                }}
              >
                ID ANÔNIMO · {fStud.length}
              </div>
              {fStud.length === 0 ? (
                <div
                  style={{
                    padding: 24,
                    textAlign: 'center',
                    color: '#aaa',
                    fontSize: 13,
                  }}
                >
                  Nenhum aluno nesta categoria.
                </div>
              ) : (
                fStud.map((s) => (
                  <div
                    key={s.code}
                    onClick={() =>
                      setSelStCode(selStCode === s.code ? null : s.code)
                    }
                    className="hr"
                    style={{
                      padding: '12px 15px',
                      borderBottom: '1px solid #f5f5f5',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: selStCode === s.code ? '#fafafa' : '#fff',
                    }}
                  >
                    <div>
                      <Mn
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          display: 'block',
                        }}
                      >
                        {s.code}
                      </Mn>
                      <div
                        style={{ fontSize: 10, color: '#aaa', marginTop: 1 }}
                      >
                        {s.latest ? fmtDate(s.latest.date) : 'Sem texto'} ·{' '}
                        {s.count} entrada(s)
                      </div>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        gap: 5,
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                      }}
                    >
                      {s.risk !== 'sem_dados' && <Tag risk={s.risk} />}
                      {s.trend === 'worsening' && (
                        <span style={{ fontSize: 9, color: '#dc2626' }}>
                          ↑ piora
                        </span>
                      )}
                      {s.trend === 'improving' && (
                        <span style={{ fontSize: 9, color: '#15803d' }}>
                          ↓ melhora
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {selSt && (
            <div className="fi">
              {selSt.latest ? (
                <div
                  style={{
                    background: '#fff',
                    border: '1px solid #e8e8e8',
                    padding: 22,
                    borderTop: `3px solid ${RISK[selSt.risk]?.color || '#ccc'}`,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 16,
                      flexWrap: 'wrap',
                      gap: 8,
                    }}
                  >
                    <div>
                      <Mn
                        style={{
                          fontSize: 17,
                          fontWeight: 700,
                          display: 'block',
                        }}
                      >
                        {selSt.code}
                      </Mn>
                      <div
                        style={{ fontSize: 11, color: '#aaa', marginTop: 1 }}
                      >
                        Último relato: {fmtDate(selSt.latest.date)} ·{' '}
                        {selSt.count} entrada(s)
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Tag risk={selSt.risk} />
                      {selSt.urgency && <Tag urgency={selSt.urgency} />}
                    </div>
                  </div>

                  {selSt.latest.aiText && (
                    <div
                      style={{
                        padding: '12px 15px',
                        background: '#f8f8f8',
                        borderLeft: `3px solid ${
                          RISK[selSt.risk]?.color || '#ccc'
                        }`,
                        fontSize: 13.5,
                        color: '#444',
                        lineHeight: 1.75,
                        marginBottom: 12,
                      }}
                    >
                      {selSt.latest.aiText}
                    </div>
                  )}

                  <ClinicalParametersBlock entry={selSt.latest} />

                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: '#aaa',
                      letterSpacing: '.09em',
                      marginBottom: 12,
                      marginTop: 16,
                    }}
                  >
                    OS 12 INDICADORES EMOCIONAIS (ÚLTIMA ANÁLISE)
                  </div>
                  {Object.entries(IND).map(([k, l]) => (
                    <IBar
                      key={k}
                      label={l}
                      value={selSt.latest.indicators[k] || 0}
                      sm
                    />
                  ))}

                  <div style={{ height: 195, marginTop: 16 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={Object.entries(IND).map(([k, l]) => ({
                          name: l.slice(0, 10),
                          value: selSt.latest.indicators[k] || 0,
                          full: l,
                        }))}
                        margin={{ top: 5, right: 5, bottom: 24, left: -26 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f7f7f7" />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 8 }}
                          angle={-30}
                          textAnchor="end"
                        />
                        <YAxis tick={{ fontSize: 9 }} domain={[0, 100]} />
                        <Tooltip
                          formatter={(v, n, p) => [`${v}%`, p.payload.full]}
                          contentStyle={{ fontSize: 12 }}
                        />
                        <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                          {Object.entries(IND).map(([k], i) => (
                            <Cell
                              key={i}
                              fill={iColor(selSt.latest.indicators[k] || 0)}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {selSt.all.length > 1 && (
                    <>
                      <Dv m="18px 0" />
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: '#aaa',
                          letterSpacing: '.09em',
                          marginBottom: 8,
                        }}
                      >
                        EVOLUÇÃO HISTÓRICA (SELECIONE INDICADORES)
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          gap: 5,
                          flexWrap: 'wrap',
                          marginBottom: 12,
                        }}
                      >
                        {Object.entries(IND).map(([k, label]) => {
                          const on = activeLines.includes(k);
                          return (
                            <button
                              key={k}
                              onClick={() => toggleLineIndicator(k)}
                              style={{
                                padding: '3px 8px',
                                fontSize: 10.5,
                                cursor: 'pointer',
                                border: `1px solid ${
                                  on ? INDICATOR_COLORS[k] : '#e0e0e0'
                                }`,
                                background: on
                                  ? `${INDICATOR_COLORS[k]}14`
                                  : '#fff',
                                color: on ? INDICATOR_COLORS[k] : '#888',
                                fontWeight: on ? 700 : 500,
                              }}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                      <div style={{ height: 165 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={[...selSt.all]
                              .reverse()
                              .slice(-10)
                              .map((e) => ({
                                date: fmtDate(e.date),
                                ...e.indicators,
                              }))}
                            margin={{ top: 5, right: 8, bottom: 18, left: -26 }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#f7f7f7"
                            />
                            <XAxis
                              dataKey="date"
                              tick={{ fontSize: 8 }}
                              angle={-20}
                              textAnchor="end"
                            />
                            <YAxis tick={{ fontSize: 9 }} domain={[0, 100]} />
                            <Tooltip
                              formatter={(v, k) => [`${v}%`, IND[k] || k]}
                              contentStyle={{ fontSize: 11 }}
                            />
                            {activeLines.map((k) => (
                              <Line
                                key={k}
                                type="monotone"
                                dataKey={k}
                                stroke={INDICATOR_COLORS[k]}
                                dot={{ r: 2.5 }}
                                strokeWidth={1.8}
                              />
                            ))}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    background: '#fff',
                    border: '1px solid #e8e8e8',
                    padding: 40,
                    textAlign: 'center',
                    color: '#aaa',
                  }}
                >
                  <Mn
                    style={{
                      fontSize: 15,
                      display: 'block',
                      marginBottom: 9,
                      color: '#333',
                    }}
                  >
                    {selSt.code}
                  </Mn>
                  <div style={{ fontSize: 13 }}>
                    Este aluno ainda não enviou nenhum texto.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── ANÁLISE IA ── */}
      {tab === 'analise' && (
        <div>
          <div
            style={{
              marginBottom: 14,
              padding: '12px 16px',
              background: '#f8f8f8',
              border: '1px solid #eee',
              fontSize: 13.5,
              color: '#666',
              lineHeight: 1.55,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            <span>
              🤖 Sínteses clínicas, sinais de alerta, fatores protetivos e
              recomendações geradas pelo Claude Sonnet para orientação exclusiva
              da equipe psicopedagógica.
            </span>
            <div style={{ display: 'flex', gap: 5 }}>
              {[
                ['all', 'Todas'],
                ['alto', 'Alto Risco'],
                ['atencao', 'Atenção'],
                ['baixo', 'Baixo'],
              ].map(([v, l]) => (
                <button
                  key={v}
                  onClick={() => setAiFilt(v)}
                  style={{
                    padding: '4px 10px',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: aiFilt === v ? '#000' : '#fff',
                    color: aiFilt === v ? '#fff' : '#888',
                    border: '1px solid #e0e0e0',
                  }}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {filteredAnalyses.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '36px 20px',
                color: '#aaa',
                background: '#fff',
                border: '1px dashed #e0e0e0',
                fontSize: 13,
              }}
            >
              Nenhuma análise encontrada para este filtro.
            </div>
          ) : (
            filteredAnalyses.map((e) => (
              <div
                key={e.id}
                style={{
                  background: '#fff',
                  border: '1px solid #e8e8e8',
                  padding: 20,
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12,
                    flexWrap: 'wrap',
                    gap: 8,
                  }}
                >
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 10 }}
                  >
                    <Mn style={{ fontSize: 14, fontWeight: 700 }}>
                      {e.studentCode}
                    </Mn>
                    <Tag risk={e.riskLevel} />
                    {e.urgency && <Tag urgency={e.urgency} />}
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <Mn style={{ fontSize: 11, color: '#aaa' }}>
                      {fmtDate(e.date)}
                    </Mn>
                    <button
                      onClick={() => {
                        setSelStCode(e.studentCode);
                        setTab('indicadores');
                      }}
                      style={{
                        fontSize: 11,
                        color: '#111',
                        textDecoration: 'underline',
                        cursor: 'pointer',
                      }}
                    >
                      Ver gráficos →
                    </button>
                  </div>
                </div>
                {e.aiText ? (
                  <div
                    style={{
                      padding: '12px 15px',
                      background: '#f9f9f9',
                      border: '1px solid #eee',
                      fontSize: 14,
                      color: '#444',
                      lineHeight: 1.8,
                      borderLeft: `3px solid ${
                        RISK[e.riskLevel]?.color || '#ccc'
                      }`,
                    }}
                  >
                    {e.aiText}
                  </div>
                ) : (
                  <div
                    style={{
                      fontSize: 13,
                      color: '#aaa',
                      fontStyle: 'italic',
                    }}
                  >
                    Interpretação não disponível para esta entrada.
                  </div>
                )}

                <ClinicalParametersBlock entry={e} />
              </div>
            ))
          )}
        </div>
      )}

      {/* ── TEXTOS ── */}
      {tab === 'textos' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: selEntry ? '1fr 1fr' : '1fr',
            gap: 16,
            alignItems: 'start',
          }}
        >
          <div style={{ background: '#fff', border: '1px solid #e8e8e8' }}>
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid #eee',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#aaa',
                  letterSpacing: '.09em',
                }}
              >
                TEXTOS DOS ALUNOS
              </div>
              <div style={{ fontSize: 11, color: '#aaa' }}>
                {myEntries.length}
              </div>
            </div>
            {myEntries.length === 0 ? (
              <div
                style={{
                  padding: 32,
                  textAlign: 'center',
                  color: '#aaa',
                  fontSize: 13,
                }}
              >
                Nenhum texto enviado ainda.
              </div>
            ) : (
              myEntries.map((e) => (
                <div
                  key={e.id}
                  onClick={() =>
                    setSelEntryId(selEntryId === e.id ? null : e.id)
                  }
                  className="hr"
                  style={{
                    padding: '13px 16px',
                    borderBottom: '1px solid #f5f5f5',
                    background: selEntryId === e.id ? '#fafafa' : '#fff',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 6,
                      flexWrap: 'wrap',
                      gap: 5,
                    }}
                  >
                    <div
                      style={{ display: 'flex', gap: 8, alignItems: 'center' }}
                    >
                      <Mn style={{ fontSize: 13, fontWeight: 700 }}>
                        {e.studentCode}
                      </Mn>
                      <Tag risk={e.riskLevel} />
                      {e.urgency && <Tag urgency={e.urgency} />}
                    </div>
                    <Mn style={{ fontSize: 10.5, color: '#aaa' }}>
                      {fmtDate(e.date)}
                    </Mn>
                  </div>
                  <p
                    style={{
                      fontSize: 13,
                      color: '#777',
                      lineHeight: 1.5,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {e.content}
                  </p>
                </div>
              ))
            )}
          </div>

          {selEntry && (
            <div
              className="fi"
              style={{
                background: '#fff',
                border: '1px solid #e8e8e8',
                padding: 22,
                position: 'sticky',
                top: 80,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                  flexWrap: 'wrap',
                  gap: 7,
                }}
              >
                <div>
                  <Mn
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      display: 'block',
                    }}
                  >
                    {selEntry.studentCode}
                  </Mn>
                  <div style={{ fontSize: 11, color: '#aaa', marginTop: 1 }}>
                    {fmtTs(selEntry.timestamp)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 5 }}>
                  <Tag risk={selEntry.riskLevel} />
                  {selEntry.urgency && <Tag urgency={selEntry.urgency} />}
                </div>
              </div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#aaa',
                  letterSpacing: '.09em',
                  marginBottom: 10,
                }}
              >
                TEXTO COMPLETO
              </div>
              <div
                style={{
                  padding: '14px 16px',
                  background: '#fdfcf8',
                  border: '1px solid #ece8dd',
                  borderLeft: `3px solid ${
                    RISK[selEntry.riskLevel]?.color || '#ccc'
                  }`,
                  fontSize: 14.5,
                  lineHeight: 1.9,
                  color: '#444',
                  fontStyle: 'italic',
                  marginBottom: 16,
                }}
              >
                "{selEntry.content}"
              </div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#aaa',
                  letterSpacing: '.09em',
                  marginBottom: 10,
                }}
              >
                INDICADORES DA IA
              </div>
              {Object.entries(IND).map(([k, l]) => (
                <IBar
                  key={k}
                  label={l}
                  value={selEntry.indicators[k] || 0}
                  sm
                />
              ))}
              {selEntry.aiText && (
                <>
                  <Dv m="14px 0" />
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: '#aaa',
                      letterSpacing: '.09em',
                      marginBottom: 8,
                    }}
                  >
                    INTERPRETAÇÃO DA IA
                  </div>
                  <div
                    style={{
                      padding: '12px 14px',
                      background: '#f8f8f8',
                      border: '1px solid #eee',
                      fontSize: 13.5,
                      color: '#555',
                      lineHeight: 1.75,
                    }}
                  >
                    {selEntry.aiText}
                  </div>
                </>
              )}
              <ClinicalParametersBlock entry={selEntry} />
              <div
                style={{
                  marginTop: 14,
                  padding: '9px 13px',
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  fontSize: 12,
                  color: '#92400e',
                  lineHeight: 1.5,
                }}
              >
                📋 Destina-se exclusivamente à análise por psicólogo ou
                orientador educacional. A escola relaciona este ID com o aluno
                real externamente.
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ALERTAS ── */}
      {tab === 'alertas' && (
        <div>
          {criticos.length > 0 && (
            <>
              <div
                style={{
                  marginBottom: 14,
                  padding: '12px 16px',
                  background: '#fff5f5',
                  border: '1px solid #fecaca',
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#dc2626',
                    letterSpacing: '.09em',
                  }}
                >
                  ⚠️ ALTO RISCO / CRÍTICO — {criticos.length} aluno(s)
                </div>
              </div>
              {criticos.map((s) => (
                <div
                  key={s.code}
                  style={{
                    background: '#fff',
                    border: '1px solid #fecaca',
                    padding: 20,
                    marginBottom: 10,
                    borderLeft: '4px solid #dc2626',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 8,
                      marginBottom: 10,
                    }}
                  >
                    <div
                      style={{ display: 'flex', gap: 8, alignItems: 'center' }}
                    >
                      <Mn style={{ fontSize: 15, fontWeight: 700 }}>
                        {s.code}
                      </Mn>
                      <Tag risk={s.risk} />
                      {s.urgency && <Tag urgency={s.urgency} />}
                    </div>
                    {s.latest && (
                      <Mn style={{ fontSize: 11, color: '#aaa' }}>
                        {fmtDate(s.latest.date)}
                      </Mn>
                    )}
                  </div>
                  {s.latest && (
                    <>
                      <div
                        style={{
                          display: 'flex',
                          gap: 6,
                          flexWrap: 'wrap',
                          marginBottom: 10,
                        }}
                      >
                        {Object.entries(s.latest.indicators)
                          .filter(([, v]) => v >= 55)
                          .map(([k, v]) => (
                            <span
                              key={k}
                              style={{
                                padding: '2px 8px',
                                background: '#fff5f5',
                                border: '1px solid #fecaca',
                                fontSize: 11,
                                color: '#dc2626',
                              }}
                            >
                              {IND[k]} ({v}%)
                            </span>
                          ))}
                      </div>
                      <div
                        style={{
                          padding: '12px 14px',
                          background: '#fdfcf8',
                          border: '1px solid #ece8dd',
                          fontSize: 14,
                          color: '#555',
                          lineHeight: 1.75,
                          fontStyle: 'italic',
                          marginBottom: 8,
                        }}
                      >
                        "{s.latest.content}"
                      </div>
                      {s.latest.aiText && (
                        <div
                          style={{
                            fontSize: 13,
                            color: '#444',
                            marginBottom: 8,
                            lineHeight: 1.6,
                          }}
                        >
                          {s.latest.aiText}
                        </div>
                      )}
                      <ClinicalParametersBlock entry={s.latest} />
                    </>
                  )}
                </div>
              ))}
            </>
          )}

          {piora.length > 0 && (
            <>
              <Dv m="18px 0" />
              <div
                style={{
                  marginBottom: 12,
                  padding: '10px 14px',
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#b45309',
                    letterSpacing: '.09em',
                  }}
                >
                  📈 PIORA DETECTADA — {piora.length} aluno(s)
                </div>
              </div>
              {piora.map((s) => (
                <div
                  key={s.code}
                  style={{
                    background: '#fff',
                    border: '1px solid #fde68a',
                    padding: 16,
                    marginBottom: 8,
                    borderLeft: '3px solid #b45309',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 6,
                    }}
                  >
                    <div
                      style={{ display: 'flex', gap: 7, alignItems: 'center' }}
                    >
                      <Mn style={{ fontSize: 14, fontWeight: 700 }}>
                        {s.code}
                      </Mn>
                      <Tag risk={s.risk} />
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        color: '#b45309',
                        fontWeight: 600,
                      }}
                    >
                      ↑ indicadores em elevação
                    </span>
                  </div>
                </div>
              ))}
            </>
          )}

          {criticos.length === 0 && piora.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: '44px 20px',
                color: '#aaa',
                background: '#fff',
                border: '1px dashed #e0e0e0',
                fontSize: 14,
              }}
            >
              ✓ Nenhum alerta ativo no momento.
            </div>
          )}
        </div>
      )}

      {/* ── GERENCIAR ── */}
      {tab === 'gerenciar' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(290px,1fr))',
            gap: 16,
            alignItems: 'start',
          }}
        >
          <div
            style={{
              background: '#fff',
              border: '1px solid #e8e8e8',
              padding: 24,
            }}
          >
            <h3
              style={{
                fontFamily: "'Syne',sans-serif",
                fontWeight: 700,
                fontSize: '.95rem',
                marginBottom: 5,
              }}
            >
              Criar novo aluno
            </h3>
            <p
              style={{
                fontSize: 13,
                color: '#888',
                lineHeight: 1.55,
                marginBottom: 16,
              }}
            >
              Defina um código anônimo e senha inicial. No primeiro acesso o
              aluno receberá sua frase secreta e poderá definir uma senha
              pessoal.
            </p>
            <Fld
              label="CÓDIGO DO ALUNO"
              value={newSt.code}
              onChange={(v) => setNewSt((p) => ({ ...p, code: v }))}
              placeholder="Ex: TURMA3A-04"
              mono
              note="Código anônimo. Apenas a escola sabe a quem pertence."
            />
            <Fld
              label="SENHA INICIAL"
              type="password"
              value={newSt.pwd}
              onChange={(v) => setNewSt((p) => ({ ...p, pwd: v }))}
              placeholder="Mínimo 4 caracteres"
              note="O aluno poderá alterar no primeiro acesso."
            />
            {stErr && <Inf type="err">{stErr}</Inf>}
            {stOk && <Inf type="ok">{stOk}</Inf>}
            <Btn full onClick={handleCreateStudent}>
              CRIAR ALUNO
            </Btn>
            <div
              style={{
                marginTop: 12,
                padding: '9px 13px',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                fontSize: 12,
                color: '#15803d',
                lineHeight: 1.5,
              }}
            >
              🔒 O ALUMIA nunca armazena o nome real. A correspondência
              código→aluno é feita pela escola externamente.
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid #e8e8e8' }}>
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid #eee',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#aaa',
                  letterSpacing: '.09em',
                }}
              >
                ALUNOS CADASTRADOS
              </div>
              <div style={{ fontSize: 11, color: '#aaa' }}>
                {myStudents.length}
              </div>
            </div>
            {myStudents.length === 0 ? (
              <div
                style={{
                  padding: 28,
                  textAlign: 'center',
                  color: '#aaa',
                  fontSize: 13,
                }}
              >
                Nenhum aluno ainda.
              </div>
            ) : (
              [...myStudents]
                .sort((a, b) => b.createdAt - a.createdAt)
                .map((s) => (
                  <div
                    key={s.code}
                    style={{
                      padding: '11px 16px',
                      borderBottom: '1px solid #f5f5f5',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <Mn
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            display: 'block',
                          }}
                        >
                          {s.code}
                        </Mn>
                        <div
                          style={{ fontSize: 10.5, color: '#aaa', marginTop: 1 }}
                        >
                          Criado{' '}
                          {fmtDate(
                            new Date(s.createdAt).toISOString().slice(0, 10)
                          )}
                        </div>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          gap: 10,
                          alignItems: 'center',
                        }}
                      >
                        <span
                          style={{
                            fontSize: 11,
                            color: latestBy[s.code] ? '#15803d' : '#aaa',
                          }}
                        >
                          {latestBy[s.code] ? '● Ativo' : '○ Aguardando'}
                        </span>
                        <button
                          onClick={() => {
                            setResetTarget(
                              resetTarget === s.code ? null : s.code
                            );
                            setResetPwd('');
                          }}
                          style={{
                            fontSize: 11,
                            color: '#666',
                            border: '1px solid #e0e0e0',
                            padding: '3px 8px',
                            cursor: 'pointer',
                          }}
                        >
                          Redefinir senha
                        </button>
                      </div>
                    </div>
                    {resetTarget === s.code && (
                      <div
                        style={{
                          marginTop: 10,
                          paddingTop: 10,
                          borderTop: '1px dashed #eee',
                          display: 'flex',
                          gap: 8,
                          alignItems: 'center',
                        }}
                      >
                        <input
                          type="password"
                          value={resetPwd}
                          onChange={(e) => setResetPwd(e.target.value)}
                          placeholder="Nova senha inicial (mín. 4)"
                          style={{
                            flex: 1,
                            border: '1px solid #ddd',
                            padding: '6px 10px',
                            fontSize: 12.5,
                            background: '#fafafa',
                          }}
                        />
                        <Btn
                          sz="sm"
                          onClick={() => handleResetStudent(s.code)}
                        >
                          SALVAR
                        </Btn>
                      </div>
                    )}
                  </div>
                ))
            )}
          </div>
        </div>
      )}
    </Shell>
  );
};
