import { useState } from 'react';
import { ADMIN_EMAIL, ADMIN_HASH } from '../../constants/indicators';
import { hash, genPhrase } from '../../utils/crypto';
import { useApp } from '../../context/AppContext';
import { ModalWrap, Fld, Btn, Inf, Sp } from '../ui/Primitives';

export const LoginModal = ({ type, setType, onClose }) => {
  const {
    db,
    setAuth,
    completeStudentOnboarding,
    recoverStudentPassword,
  } = useApp();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [pwd, setPwd] = useState('');
  const [token, setToken] = useState('');
  const [err, setErr] = useState('');
  const [okMsg, setOkMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // First login onboarding state
  const [keyScr, setKeyScr] = useState(null);
  const [newFirstPwd, setNewFirstPwd] = useState('');

  // Recovery mode state
  const [recoverMode, setRecoverMode] = useState(false);
  const [recCode, setRecCode] = useState('');
  const [recPhrase, setRecPhrase] = useState('');
  const [recNewPwd, setRecNewPwd] = useState('');

  const doLogin = async () => {
    setErr('');
    setOkMsg('');
    setLoading(true);
    await new Promise((r) => setTimeout(r, 280));
    try {
      if (type === 'admin') {
        if (email.trim() === ADMIN_EMAIL && hash(pwd) === ADMIN_HASH) {
          setAuth({ type: 'admin' });
          onClose();
          return;
        }
        setErr('E-mail ou senha inválidos.');
      } else if (type === 'school') {
        const t = token.trim().toUpperCase();
        const school = (db.schools || {})[t];
        if (!school) {
          setErr('Token não encontrado.');
          setLoading(false);
          return;
        }
        if (!school.active) {
          setErr('Acesso suspenso. Entre em contato com a ALUMIA.');
          setLoading(false);
          return;
        }
        setAuth({ type: 'school', token: t, schoolName: school.name });
        onClose();
        return;
      } else {
        const c = code.trim();
        const student = (db.students || {})[c];
        if (!student || student.pwdHash !== hash(pwd)) {
          setErr('Código ou senha inválidos.');
          setLoading(false);
          return;
        }
        if (!(db.schools || {})[student.schoolToken]?.active) {
          setErr('Acesso suspenso. Contacte sua escola.');
          setLoading(false);
          return;
        }
        if (!student.firstLogin) {
          setKeyScr({
            key: genPhrase(),
            code: c,
            tok: student.schoolToken,
          });
          setLoading(false);
          return;
        }
        setAuth({ type: 'student', code: c, schoolToken: student.schoolToken });
        onClose();
        return;
      }
    } catch {
      setErr('Erro inesperado ao autenticar.');
    }
    setLoading(false);
  };

  const confirmKey = async () => {
    if (newFirstPwd && newFirstPwd.trim().length > 0 && newFirstPwd.trim().length < 4) {
      setErr('A nova senha opcional deve ter pelo menos 4 caracteres.');
      return;
    }
    await completeStudentOnboarding({
      code: keyScr.code,
      schoolToken: keyScr.tok,
      phrase: keyScr.key,
      newPassword: newFirstPwd,
    });
    onClose();
  };

  const handleRecovery = async () => {
    setErr('');
    setOkMsg('');
    const res = await recoverStudentPassword({
      code: recCode,
      phrase: recPhrase,
      newPassword: recNewPwd,
    });
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    setRecoverMode(false);
    setCode(recCode.trim());
    setPwd('');
    setOkMsg('Senha redefinida com sucesso! Faça login com a nova senha.');
  };

  return (
    <ModalWrap onClose={onClose} w={420}>
      <div style={{ padding: '30px 30px 32px' }}>
        <button
          onClick={onClose}
          className="hl"
          style={{
            position: 'absolute',
            top: 13,
            right: 14,
            fontSize: 17,
            color: '#bbb',
            cursor: 'pointer',
          }}
        >
          ✕
        </button>

        {keyScr ? (
          <>
            <div
              style={{
                fontFamily: "'Syne',sans-serif",
                fontSize: '1.05rem',
                fontWeight: 700,
                marginBottom: 5,
              }}
            >
              ⚠️ Primeiro Acesso — Frase Secreta
            </div>
            <p
              style={{
                fontSize: 13.5,
                color: '#555',
                lineHeight: 1.6,
                marginBottom: 14,
              }}
            >
              Esta frase de 6 palavras é exibida{' '}
              <strong>apenas uma vez</strong>. Anote em local seguro — é a única
              forma de recuperar sua senha mantendo o anonimato.
            </p>
            <div
              style={{
                background: '#f4f4f4',
                border: '2px solid #000',
                padding: 16,
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: 14,
                lineHeight: 2,
                marginBottom: 13,
                wordBreak: 'break-word',
              }}
            >
              {keyScr.key}
            </div>
            <Fld
              label="DEFINIR NOVA SENHA PESSOAL (OPCIONAL)"
              type="password"
              value={newFirstPwd}
              onChange={setNewFirstPwd}
              placeholder="Deixe em branco para manter a senha atual"
              note="Caso deseje trocar a senha inicial entregue pela escola, digite acima (mín. 4 caracteres)."
            />
            {err && <Inf type="err">{err}</Inf>}
            <Inf type="warn">
              Sem esta frase secreta, somente a escola poderá redefinir seu
              acesso.
            </Inf>
            <Btn full onClick={confirmKey}>
              ANOTEI A FRASE — CONTINUAR
            </Btn>
          </>
        ) : recoverMode ? (
          <>
            <div
              style={{
                fontFamily: "'Syne',sans-serif",
                fontSize: '1.1rem',
                fontWeight: 700,
                marginBottom: 6,
              }}
            >
              Recuperar Senha do Aluno
            </div>
            <p
              style={{
                fontSize: 13,
                color: '#666',
                lineHeight: 1.55,
                marginBottom: 16,
              }}
            >
              Informe seu código anônimo e as 6 palavras da sua frase secreta
              anotada no primeiro acesso.
            </p>
            <Fld
              label="CÓDIGO DO ALUNO"
              value={recCode}
              onChange={setRecCode}
              placeholder="Ex: TURMA3A-01"
              mono
              af
            />
            <Fld
              label="FRASE SECRETA (6 PALAVRAS)"
              value={recPhrase}
              onChange={setRecPhrase}
              placeholder="palavra1 palavra2 palavra3..."
              mono
            />
            <Fld
              label="NOVA SENHA"
              type="password"
              value={recNewPwd}
              onChange={setRecNewPwd}
              placeholder="Mínimo 4 caracteres"
            />
            {err && <Inf type="err">{err}</Inf>}
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn
                v="light"
                onClick={() => {
                  setRecoverMode(false);
                  setErr('');
                }}
              >
                VOLTAR
              </Btn>
              <Btn full onClick={handleRecovery}>
                REDEFINIR SENHA
              </Btn>
            </div>
          </>
        ) : (
          <>
            <div
              style={{
                fontFamily: "'Syne',sans-serif",
                fontSize: '1.15rem',
                fontWeight: 700,
                marginBottom: 18,
                letterSpacing: '-.02em',
              }}
            >
              Acessar ALUMIA
            </div>
            <div
              style={{
                display: 'flex',
                border: '1px solid #e8e8e8',
                marginBottom: 18,
              }}
            >
              {[
                ['student', 'Aluno'],
                ['school', 'Escola'],
                ['admin', 'Admin'],
              ].map(([t, l]) => (
                <button
                  key={t}
                  onClick={() => {
                    setType(t);
                    setErr('');
                    setOkMsg('');
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 4px',
                    fontSize: 11.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: type === t ? '#000' : 'transparent',
                    color: type === t ? '#fff' : '#bbb',
                    border: 'none',
                    letterSpacing: '.04em',
                    transition: 'all .14s',
                  }}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>

            <div
              style={{
                padding: '8px 11px',
                background: '#f9f9f9',
                border: '1px solid #f0f0f0',
                fontSize: 11.5,
                color: '#888',
                marginBottom: 14,
              }}
            >
              {type === 'admin' && (
                <span>
                  <strong>Demo:</strong> <code>admin@alumia.com</code> / senha:{' '}
                  <code>admin123</code>
                </span>
              )}
              {type === 'school' && (
                <span>
                  <strong>Demo:</strong> Token: <code>ESC-2025-ALUMIA</code>
                </span>
              )}
              {type === 'student' && (
                <span>
                  <strong>Demo:</strong> Código: <code>TURMA3A-01</code> (ou{' '}
                  <code>TURMA3A-03</code> p/ 1º acesso) / senha:{' '}
                  <code>1234</code>
                </span>
              )}
            </div>

            {type === 'admin' && (
              <>
                <Fld
                  label="E-MAIL"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="admin@alumia.com"
                  af
                />
                <Fld
                  label="SENHA"
                  type="password"
                  value={pwd}
                  onChange={setPwd}
                  placeholder="••••••••"
                />
              </>
            )}
            {type === 'school' && (
              <Fld
                label="TOKEN DA ESCOLA"
                value={token}
                onChange={setToken}
                placeholder="ESC-XXXX-ALUMIA"
                mono
                note="Token fornecido pela ALUMIA ao cadastrar sua escola."
                af
              />
            )}
            {type === 'student' && (
              <>
                <Fld
                  label="CÓDIGO DO ALUNO"
                  value={code}
                  onChange={setCode}
                  placeholder="Código fornecido pela escola"
                  mono
                  af
                />
                <Fld
                  label="SENHA"
                  type="password"
                  value={pwd}
                  onChange={setPwd}
                  placeholder="••••••••"
                />
                <div style={{ textAlign: 'right', marginTop: -6, marginBottom: 12 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setRecoverMode(true);
                      setRecCode(code);
                      setErr('');
                      setOkMsg('');
                    }}
                    style={{
                      fontSize: 11.5,
                      color: '#777',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                    }}
                  >
                    Esqueci minha senha (usar frase secreta)
                  </button>
                </div>
              </>
            )}

            {err && <Inf type="err">{err}</Inf>}
            {okMsg && <Inf type="ok">{okMsg}</Inf>}

            <Btn full onClick={doLogin} disabled={loading}>
              {loading ? (
                <>
                  <Sp /> Verificando...
                </>
              ) : (
                'ACESSAR'
              )}
            </Btn>
          </>
        )}
      </div>
    </ModalWrap>
  );
};
