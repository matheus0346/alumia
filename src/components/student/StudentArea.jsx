import { useState, useMemo, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { fmtDate, fmtTs } from '../../utils/date';
import { Logo, Mn } from '../ui/Primitives';
import { WeekView } from './WeekView';

export const StudentArea = () => {
  const { auth, logout, db, createDiaryEntry } = useApp();
  const [view, setView] = useState('diary');
  const [offset, setOffset] = useState(0);

  const myEntries = useMemo(
    () =>
      (db.entries || [])
        .filter((e) => e.studentCode === auth.code)
        .sort(
          (a, b) =>
            b.date.localeCompare(a.date) || (b.timestamp || 0) - (a.timestamp || 0)
        ),
    [db.entries, auth.code]
  );

  const handleSaveEntry = useCallback(
    async (date, text) => {
      return createDiaryEntry({
        studentCode: auth.code,
        schoolToken: auth.schoolToken,
        date,
        text,
      });
    },
    [createDiaryEntry, auth.code, auth.schoolToken]
  );

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f4f4f4',
        fontFamily: "'Epilogue',sans-serif",
      }}
    >
      <div
        style={{
          background: '#000',
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <Logo />
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Mn style={{ fontSize: 11, color: '#777' }}>{auth.code}</Mn>
          <button
            onClick={logout}
            style={{
              fontSize: 11,
              color: '#777',
              cursor: 'pointer',
              padding: '4px 10px',
              border: '1px solid #1e1e1e',
              background: 'none',
              letterSpacing: '.04em',
              transition: 'border .14s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#555')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1e1e1e')}
          >
            SAIR
          </button>
        </div>
      </div>

      <div
        style={{
          background: '#fff',
          borderBottom: '1px solid #e8e8e8',
          padding: '0 24px',
        }}
      >
        {[
          ['diary', '📖 Diário'],
          ['history', '📋 Meus Relatos'],
        ].map(([v, l]) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`tab-btn${view === v ? ' on' : ''}`}
          >
            {l}
          </button>
        ))}
      </div>

      <div style={{ padding: '18px 24px', maxWidth: 840, margin: '0 auto' }}>
        {view === 'diary' && (
          <>
            <WeekView
              offset={offset}
              setOffset={setOffset}
              entriesList={myEntries}
              onSaveEntry={handleSaveEntry}
            />
            <div
              style={{
                background: '#fff',
                border: '1px solid #e8e8e8',
                padding: '12px 16px',
                fontSize: 13,
                color: '#777',
                lineHeight: 1.55,
              }}
            >
              📖 Clique em qualquer dia passado ou presente para registrar como
              você se sentiu. Seus relatos são confidenciais e compartilhados de
              forma anônima apenas com a equipe de apoio da escola.
            </div>
          </>
        )}

        {view === 'history' && (
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
                HISTÓRICO DOS MEUS RELATOS
              </div>
              <div style={{ fontSize: 11, color: '#aaa' }}>
                {myEntries.length} registro(s)
              </div>
            </div>
            {myEntries.length === 0 ? (
              <div
                style={{
                  padding: '36px 20px',
                  textAlign: 'center',
                  color: '#aaa',
                  fontSize: 13,
                }}
              >
                Nenhum texto registrado ainda. Comece pelo diário semanal.
              </div>
            ) : (
              myEntries.map((e) => (
                <div
                  key={e.id}
                  style={{
                    padding: '16px',
                    borderBottom: '1px solid #f5f5f5',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 8,
                      flexWrap: 'wrap',
                      gap: 6,
                    }}
                  >
                    <Mn style={{ fontSize: 12, color: '#555', fontWeight: 600 }}>
                      {fmtDate(e.date)}
                    </Mn>
                    <span
                      style={{
                        fontSize: 10.5,
                        color: '#666',
                        background: '#f6f6f2',
                        border: '1px solid #e5e2d9',
                        padding: '2px 8px',
                      }}
                    >
                      ✓ Enviado à equipe escolar · {fmtTs(e.timestamp)}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: 14,
                      color: '#444',
                      lineHeight: 1.78,
                      fontStyle: 'italic',
                    }}
                  >
                    "{e.content}"
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
