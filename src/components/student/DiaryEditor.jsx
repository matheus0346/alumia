import { useState } from 'react';
import { fmtLong, fmtTs } from '../../utils/date';
import { ModalWrap, Btn, Sp } from '../ui/Primitives';

export const DiaryEditor = ({ date, existing, onSave, onClose, saving }) => {
  const [text, setText] = useState('');
  const isFri = new Date(date + 'T12:00').getDay() === 5;

  if (existing) {
    return (
      <ModalWrap onClose={onClose} w={600}>
        <div style={{ background: '#fdfcf8', padding: '26px 30px 30px' }}>
          <button
            onClick={onClose}
            className="hl"
            style={{
              position: 'absolute',
              top: 13,
              right: 13,
              fontSize: 17,
              color: '#bbb',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: '#bbb',
              letterSpacing: '.1em',
              marginBottom: 3,
              textTransform: 'uppercase',
            }}
          >
            {fmtLong(date)}
          </div>
          <div
            style={{
              fontFamily: "'Syne',sans-serif",
              fontWeight: 700,
              fontSize: '.95rem',
              color: '#666',
              marginBottom: 18,
            }}
          >
            Você já realizou sua escrita neste dia.
          </div>
          <div
            style={{
              padding: '18px 20px',
              background: '#fff',
              border: '1px solid #ece8dd',
              borderLeft: '3px solid #111',
              fontSize: 14.5,
              lineHeight: 1.9,
              color: '#444',
              fontStyle: 'italic',
              marginBottom: 12,
            }}
          >
            "{existing.content}"
          </div>
          <div
            style={{
              display: 'flex',
              gap: 10,
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                padding: '3px 9px',
                fontSize: 10.5,
                fontWeight: 700,
                background: '#f4f4f0',
                color: '#444',
                letterSpacing: '.05em',
                border: '1px solid #e2dfd5',
              }}
            >
              ✓ ENVIADO PARA ACOMPANHAMENTO ESCOLAR
            </span>
            <span style={{ fontSize: 11, color: '#bbb' }}>
              {fmtTs(existing.timestamp)}
            </span>
          </div>
        </div>
      </ModalWrap>
    );
  }

  return (
    <ModalWrap onClose={onClose} w={660}>
      <div
        style={{
          background: '#fdfcf8',
          padding: '24px 28px 26px',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 72,
            bottom: 0,
            width: 1,
            background: '#ece8dd',
            pointerEvents: 'none',
          }}
        />
        <button
          onClick={onClose}
          className="hl"
          style={{
            position: 'absolute',
            top: 13,
            right: 13,
            fontSize: 17,
            color: '#bbb',
            cursor: 'pointer',
            zIndex: 2,
          }}
        >
          ✕
        </button>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: '#bbb',
            letterSpacing: '.1em',
            marginBottom: 3,
            textTransform: 'uppercase',
          }}
        >
          {fmtLong(date)}
          {isFri && (
            <span
              style={{
                marginLeft: 8,
                background: '#000',
                color: '#fff',
                padding: '1px 6px',
                fontSize: 9,
                letterSpacing: '.06em',
              }}
            >
              SEXTA · DIA PRINCIPAL
            </span>
          )}
        </div>
        <div
          style={{
            fontFamily: "'Syne',sans-serif",
            fontSize: '.95rem',
            fontWeight: 700,
            color: '#555',
            marginBottom: 16,
          }}
        >
          Como você está se sentindo?
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          autoFocus
          rows={11}
          placeholder="Escreva livremente sobre seu dia, sentimentos, relações, o que está pesando ou o que está bem. Não existe resposta certa."
          style={{
            width: '100%',
            border: 'none',
            background: 'transparent',
            fontSize: 14.5,
            lineHeight: 1.95,
            color: '#333',
            resize: 'none',
            fontFamily: "'Epilogue',sans-serif",
            outline: 'none',
            paddingLeft: 8,
          }}
        />
        <div
          style={{
            borderTop: '1px solid #ece8dd',
            paddingTop: 12,
            marginTop: 6,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 9,
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: text.trim().length < 30 ? '#dc2626' : '#888',
            }}
          >
            {text.trim().length} / mín. 30 caracteres
          </div>
          <Btn
            onClick={() => text.trim().length >= 30 && onSave(text)}
            disabled={saving || text.trim().length < 30}
          >
            {saving ? (
              <>
                <Sp /> Enviando relato...
              </>
            ) : (
              'SALVAR NO DIÁRIO →'
            )}
          </Btn>
        </div>
        {saving && (
          <div
            style={{
              marginTop: 9,
              padding: '8px 12px',
              background: '#f5f5f5',
              fontSize: 12,
              color: '#888',
              display: 'flex',
              gap: 6,
              alignItems: 'center',
            }}
          >
            <Sp /> Registrando sua escrita de forma segura e anônima...
          </div>
        )}
        <div style={{ marginTop: 8, fontSize: 11, color: '#bbb' }}>
          🔒 Anônimo · Encaminhado exclusivamente para a equipe de apoio da
          escola · Não é possível editar após salvar
        </div>
      </div>
    </ModalWrap>
  );
};
