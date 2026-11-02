import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { getConfiguredModel } from '../../services/aiService';
import { fmtDate } from '../../utils/date';
import { Shell, Inf, Mn, Fld, Btn } from '../ui/Primitives';

export const AdminPanel = () => {
  const { logout, db, createSchool, toggleSchoolStatus } = useApp();
  const [tab, setTab] = useState('escolas');
  const [newSc, setNewSc] = useState({ name: '' });
  const [scErr, setScErr] = useState('');
  const [gen, setGen] = useState(null);

  const schools = Object.values(db.schools || {});
  const students = Object.values(db.students || {});
  const entries = db.entries || [];

  const handleCreateSchool = async () => {
    setScErr('');
    const res = await createSchool(newSc.name);
    if (!res.ok) {
      setScErr(res.error);
      return;
    }
    setGen({ token: res.school.token, name: res.school.name });
    setNewSc({ name: '' });
  };

  return (
    <Shell
      title="Painel Administrativo"
      sub="ALUMIA — ACESSO RESTRITO"
      tabs={[
        ['escolas', '🏫 Escolas'],
        ['tokens', '🔑 Tokens'],
        ['sistema', '⚙️ Sistema'],
      ]}
      tab={tab}
      setTab={setTab}
      onLogout={logout}
    >
      <Inf type="ok">
        🔒 Como administrador, você <strong>não tem acesso</strong> a textos de
        alunos nem a dados de identificação. Conformidade LGPD ativa.
      </Inf>

      {tab === 'escolas' && (
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
              ESCOLAS CADASTRADAS
            </div>
            <div style={{ fontSize: 11, color: '#aaa' }}>{schools.length}</div>
          </div>
          {schools.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>
              <div style={{ fontSize: 26, marginBottom: 10 }}>🏫</div>
              <div style={{ fontSize: 13, marginBottom: 7 }}>
                Nenhuma escola cadastrada.
              </div>
              <button
                onClick={() => setTab('tokens')}
                style={{
                  fontSize: 12.5,
                  color: '#000',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  background: 'none',
                }}
              >
                Gerar o primeiro token
              </button>
            </div>
          ) : (
            [...schools]
              .sort((a, b) => b.createdAt - a.createdAt)
              .map((s) => (
                <div
                  key={s.token}
                  style={{
                    padding: '16px',
                    borderBottom: '1px solid #f5f5f5',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 10,
                  }}
                >
                  <div>
                    <div
                      style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}
                    >
                      {s.name}
                    </div>
                    <Mn
                      style={{ fontSize: 12, color: '#888', display: 'block' }}
                    >
                      {s.token}
                    </Mn>
                    <div
                      style={{ fontSize: 10.5, color: '#aaa', marginTop: 1 }}
                    >
                      {fmtDate(new Date(s.createdAt).toISOString().slice(0, 10))}{' '}
                      ·{' '}
                      {students.filter((st) => st.schoolToken === s.token).length}{' '}
                      aluno(s)
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div
                      style={{
                        padding: '2px 9px',
                        background: s.active ? '#f0fdf4' : '#f5f5f5',
                        border: `1px solid ${
                          s.active ? '#bbf7d0' : '#e0e0e0'
                        }`,
                        fontSize: 10.5,
                        fontWeight: 700,
                        color: s.active ? '#15803d' : '#999',
                      }}
                    >
                      {s.active ? 'ATIVO' : 'INATIVO'}
                    </div>
                    <button
                      onClick={() => toggleSchoolStatus(s.token)}
                      style={{
                        fontSize: 12,
                        padding: '4px 11px',
                        cursor: 'pointer',
                        background: 'none',
                        border: '1px solid #e0e0e0',
                        color: '#666',
                        transition: 'border .14s',
                      }}
                      onMouseEnter={(e) =>
                        (e.target.style.borderColor = '#999')
                      }
                      onMouseLeave={(e) =>
                        (e.target.style.borderColor = '#e0e0e0')
                      }
                    >
                      {s.active ? 'Suspender' : 'Reativar'}
                    </button>
                  </div>
                </div>
              ))
          )}
        </div>
      )}

      {tab === 'tokens' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))',
            gap: 16,
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
              Gerar token para nova escola
            </h3>
            <p
              style={{
                fontSize: 13,
                color: '#888',
                lineHeight: 1.55,
                marginBottom: 16,
              }}
            >
              O token é o único meio de acesso da escola ao sistema. Envie por
              e-mail institucional.
            </p>
            <Fld
              label="NOME DA ESCOLA"
              value={newSc.name}
              onChange={(v) => setNewSc({ name: v })}
              placeholder="Ex: E.E. João Pessoa — SP"
              err={scErr}
            />
            <Btn full onClick={handleCreateSchool}>
              GERAR TOKEN
            </Btn>
            {gen && (
              <div
                className="fi"
                style={{
                  marginTop: 14,
                  padding: 18,
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#15803d',
                    letterSpacing: '.09em',
                    marginBottom: 7,
                  }}
                >
                  TOKEN GERADO
                </div>
                <Mn
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    letterSpacing: '.08em',
                    color: '#000',
                    display: 'block',
                    marginBottom: 6,
                  }}
                >
                  {gen.token}
                </Mn>
                <div style={{ fontSize: 12, color: '#666' }}>
                  Envie para {gen.name} por canal seguro.
                </div>
              </div>
            )}
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
              TOKENS ATIVOS
            </div>
            {schools.filter((s) => s.active).length === 0 ? (
              <div style={{ fontSize: 13, color: '#aaa' }}>
                Nenhum token ativo.
              </div>
            ) : (
              schools
                .filter((s) => s.active)
                .map((s) => (
                  <div
                    key={s.token}
                    style={{
                      padding: '10px 0',
                      borderBottom: '1px solid #f0f0f0',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        marginBottom: 2,
                      }}
                    >
                      {s.name}
                    </div>
                    <Mn style={{ fontSize: 12, color: '#888' }}>{s.token}</Mn>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {tab === 'sistema' && (
        <div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))',
              gap: 12,
              marginBottom: 16,
            }}
          >
            {[
              ['Escolas', schools.length],
              ['Alunos', students.length],
              ['Análises', entries.length],
              ['Modelo IA', getConfiguredModel()],
              ['Conformidade', 'LGPD · Lei 13.709'],
              ['Versão', '3.1.0'],
            ].map(([k, v]) => (
              <div
                key={k}
                style={{
                  background: '#fff',
                  border: '1px solid #e8e8e8',
                  padding: '16px 14px',
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
                  {String(k).toUpperCase()}
                </div>
                <Mn style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>
                  {v}
                </Mn>
              </div>
            ))}
          </div>
          <div
            style={{
              background: '#fff5f5',
              border: '1px solid #fecaca',
              padding: 18,
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: '#dc2626',
                letterSpacing: '.09em',
                marginBottom: 9,
              }}
            >
              RESTRIÇÕES DO ADMINISTRADOR — POR DESIGN
            </div>
            {[
              'Visualizar textos de alunos',
              'Acessar indicadores individuais',
              'Relacionar código com identidade real',
              'Recuperar senhas de alunos ou escolas',
              'Acessar frases de recuperação',
            ].map((r) => (
              <div
                key={r}
                style={{
                  fontSize: 13,
                  color: '#dc2626',
                  marginBottom: 5,
                  display: 'flex',
                  gap: 8,
                }}
              >
                <span style={{ fontWeight: 700 }}>✕</span>
                {r}
              </div>
            ))}
          </div>
        </div>
      )}
    </Shell>
  );
};
