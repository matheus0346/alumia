import { useState } from 'react';
import { DAYS, getWeekDates, todayISO, fmtDate } from '../../utils/date';
import { DiaryEditor } from './DiaryEditor';
import { SubmissionModal } from './SubmissionModal';

export const WeekView = ({
  offset,
  setOffset,
  entriesList,
  onSaveEntry,
}) => {
  const [edit, setEdit] = useState(null);
  const [saving, setSaving] = useState(false);
  const [submittedEntry, setSubmittedEntry] = useState(null);

  const dates = getWeekDates(offset);
  const today = todayISO();
  const byDate = {};
  entriesList.forEach((e) => {
    byDate[e.date] = e;
  });

  const save = async (text) => {
    setSaving(true);
    try {
      const entry = await onSaveEntry(edit.date, text);
      setEdit(null);
      setSubmittedEntry(entry);
    } catch {
      setEdit(null);
    }
    setSaving(false);
  };

  return (
    <div>
      <div
        style={{
          background: '#fff',
          border: '1px solid #e8e8e8',
          padding: 20,
          marginBottom: 14,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "'Syne',sans-serif",
                fontWeight: 700,
                fontSize: '.98rem',
              }}
            >
              Diário Semanal
            </div>
            <div style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>
              Semana de {fmtDate(dates[0])} a {fmtDate(dates[6])}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => setOffset((p) => p - 1)}
              className="hl"
              style={{
                padding: '5px 11px',
                border: '1px solid #e0e0e0',
                fontSize: 12,
                cursor: 'pointer',
                background: 'none',
              }}
            >
              ← Anterior
            </button>
            {offset < 0 && (
              <button
                onClick={() => setOffset((p) => p + 1)}
                className="hl"
                style={{
                  padding: '5px 11px',
                  border: '1px solid #e0e0e0',
                  fontSize: 12,
                  cursor: 'pointer',
                  background: 'none',
                }}
              >
                Próxima →
              </button>
            )}
            {offset !== 0 && (
              <button
                onClick={() => setOffset(0)}
                style={{
                  padding: '5px 11px',
                  border: '1px solid #000',
                  fontSize: 12,
                  cursor: 'pointer',
                  background: '#000',
                  color: '#fff',
                }}
              >
                Hoje
              </button>
            )}
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7,1fr)',
            gap: 4,
          }}
        >
          {dates.map((date, i) => {
            const isTdy = date === today;
            const isFri = i === 4;
            const isFut = date > today;
            const entry = byDate[date];
            return (
              <div
                key={date}
                onClick={() => !isFut && setEdit({ date, existing: entry || null })}
                style={{
                  border: `1px solid ${
                    isTdy ? '#000' : entry ? '#d5d0c5' : isFri ? '#bbb' : '#eee'
                  }`,
                  background: entry ? '#fdfcf8' : '#fff',
                  padding: '9px 7px',
                  cursor: isFut ? 'default' : 'pointer',
                  opacity: isFut ? 0.38 : 1,
                  transition: 'all .15s',
                  minHeight: 72,
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  if (!isFut) e.currentTarget.style.borderColor = '#777';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = isTdy
                    ? '#000'
                    : entry
                    ? '#d5d0c5'
                    : isFri
                    ? '#bbb'
                    : '#eee';
                }}
              >
                {isFri && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      background: '#000',
                      opacity: 0.25,
                    }}
                  />
                )}
                <div
                  style={{
                    fontSize: 8.5,
                    fontWeight: 700,
                    color: isTdy ? '#000' : '#ccc',
                    letterSpacing: '.06em',
                    marginBottom: 2,
                    textTransform: 'uppercase',
                  }}
                >
                  {DAYS[i].slice(0, 3)}
                </div>
                <div
                  style={{
                    fontFamily: "'Syne',sans-serif",
                    fontSize: 17,
                    fontWeight: 700,
                    color: isTdy ? '#000' : entry ? '#333' : '#aaa',
                    marginBottom: 4,
                  }}
                >
                  {new Date(date + 'T12:00').getDate()}
                </div>
                {entry ? (
                  <div
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: '#111',
                    }}
                  >
                    ✓ Registrado
                  </div>
                ) : (
                  !isFut && (
                    <div style={{ fontSize: 9, color: '#ccc' }}>Escrever</div>
                  )
                )}
                {isTdy && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: 2,
                      background: '#000',
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div
          style={{
            marginTop: 10,
            display: 'flex',
            gap: 14,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: '#888',
              display: 'flex',
              gap: 5,
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#000',
              }}
            />
            Hoje
          </div>
          <div
            style={{
              fontSize: 11,
              color: '#888',
              display: 'flex',
              gap: 5,
              alignItems: 'center',
            }}
          >
            <span style={{ fontWeight: 700, color: '#111' }}>✓</span> Dia com
            relato salvo
          </div>
          <div style={{ fontSize: 11, color: '#bbb', marginLeft: 'auto' }}>
            Sexta-feira · dia principal ●
          </div>
        </div>
      </div>

      {edit && (
        <DiaryEditor
          date={edit.date}
          existing={edit.existing}
          saving={saving}
          onSave={save}
          onClose={() => setEdit(null)}
        />
      )}
      {submittedEntry && (
        <SubmissionModal
          entry={submittedEntry}
          onClose={() => setSubmittedEntry(null)}
        />
      )}
    </div>
  );
};
