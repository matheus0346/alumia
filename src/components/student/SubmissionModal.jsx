import { fmtLong } from '../../utils/date';
import { ModalWrap, Btn } from '../ui/Primitives';

export const SubmissionModal = ({ entry, onClose }) => {
  return (
    <ModalWrap onClose={onClose} w={500}>
      <div style={{ padding: '28px 30px 30px', background: '#fdfcf8' }}>
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
            width: 42,
            height: 42,
            background: '#000',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            marginBottom: 16,
          }}
        >
          ✓
        </div>

        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: '#aaa',
            letterSpacing: '.1em',
            textTransform: 'uppercase',
            marginBottom: 4,
          }}
        >
          {fmtLong(entry.date)}
        </div>

        <div
          style={{
            fontFamily: "'Syne',sans-serif",
            fontWeight: 700,
            fontSize: '1.15rem',
            marginBottom: 12,
            color: '#111',
          }}
        >
          Seu relato foi registrado com segurança
        </div>

        <p
          style={{
            fontSize: 14,
            color: '#555',
            lineHeight: 1.75,
            marginBottom: 16,
          }}
        >
          Obrigado por compartilhar como você está se sentindo. Colocar nossos
          pensamentos em palavras é um passo importante de autocuidado.
        </p>

        <div
          style={{
            padding: '13px 15px',
            background: '#f4f4f0',
            border: '1px solid #e6e2d6',
            borderLeft: '3px solid #000',
            fontSize: 13,
            color: '#555',
            lineHeight: 1.65,
            marginBottom: 20,
          }}
        >
          🔒 <strong>Espaço confidencial:</strong> seu texto foi encaminhado de
          forma anônima e protegida para a equipe de apoio e orientação da sua
          escola. Se sentir necessidade de conversar presencialmente, procure o
          orientador ou psicólogo escolar a qualquer momento.
        </div>

        <Btn full onClick={onClose}>
          VOLTAR AO MEU DIÁRIO
        </Btn>
      </div>
    </ModalWrap>
  );
};
