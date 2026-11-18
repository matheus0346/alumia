import { useEffect, useRef, useState } from 'react';
import { useSession } from './SessionContext';
import { ErrorMessage, Field } from './Controls';

export function AccessForm({ initialType, onClose }) {
  const { login } = useSession();
  const [type, setType] = useState(initialType === 'student' ? 'student' : 'institution');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const dialog = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    dialog.current.showModal();
    return () => { dialog.current?.close(); previous?.focus(); };
  }, []);
  const switchType = (next) => { setType(next); setUsername(''); setPassword(''); setToken(''); setError(''); };
  const submit = async (event) => {
    event.preventDefault();
    setBusy(true); setError('');
    try { await login(type, type === 'student' ? { token: token.trim() } : { username: username.trim(), password }); setPassword(''); setToken(''); onClose(); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  return <dialog ref={dialog} className="pilot-dialog" aria-labelledby="access-title" onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}>
    <div className="pilot-dialog-heading"><h2 id="access-title">Acesse a AlumIA</h2><button type="button" disabled={busy} onClick={onClose} aria-label="Fechar acesso">Fechar</button></div>
    <div className="pilot-tabs" aria-label="Tipo de acesso"><button disabled={busy} aria-pressed={type === 'student'} onClick={() => switchType('student')}>Estudante</button><button disabled={busy} aria-pressed={type === 'institution'} onClick={() => switchType('institution')}>Escola / Administração</button></div>
    <form onSubmit={submit}>
      {type === 'student' ? <><p>Use o token individual entregue pela sua escola.</p><Field label="Token individual" value={token} onChange={(event) => setToken(event.target.value)} autoComplete="off" autoCapitalize="none" spellCheck={false} required maxLength={64} /></> : <><Field label="Usuário institucional" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" autoCapitalize="none" required maxLength={80} /><Field label="Senha" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /><p className="pilot-muted">Se perdeu a senha, solicite a redefinição ao administrador geral.</p></>}
      <ErrorMessage>{error}</ErrorMessage><button className="pilot-primary" type="submit" disabled={busy}>{busy ? 'Verificando acesso…' : 'Entrar'}</button>
    </form>
  </dialog>;
}

export function PasswordChange() {
  const { changePassword, logout } = useSession();
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    if (password !== confirmation) { setError('As senhas não conferem.'); setBusy(false); return; }
    try { await changePassword({ current_password: current, password, password_confirmation: confirmation }); setCurrent(''); setPassword(''); setConfirmation(''); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  return <main className="pilot-password"><div className="pilot-card"><p className="pilot-eyebrow">PRIMEIRO ACESSO</p><h1>Defina sua nova senha</h1><p>Substitua a senha temporária antes de acessar os dados da escola.</p><form onSubmit={submit}><Field label="Senha temporária ou atual" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required /><Field label="Nova senha" type="password" autoComplete="new-password" minLength={12} value={password} onChange={(e) => setPassword(e.target.value)} required /><Field label="Confirme a nova senha" type="password" autoComplete="new-password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} required /><p className="pilot-muted">Use pelo menos 12 caracteres e até 72 bytes. Caracteres acentuados podem ocupar mais de um byte.</p><ErrorMessage>{error}</ErrorMessage><button className="pilot-primary" disabled={busy}>{busy ? 'Salvando…' : 'Salvar nova senha'}</button></form><button className="pilot-secondary" disabled={busy} onClick={async () => { try { await logout(); } catch (err) { setError(err.message); } }}>Sair</button></div></main>;
}
