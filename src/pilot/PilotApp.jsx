import { useState } from 'react';
import { SessionProvider, useSession } from './SessionContext';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Logo } from '../components/ui/Primitives';
import { Home, About, How, Privacy, Team } from '../pages/PublicPages';
import { AccessForm, PasswordChange } from './AccessForm';
import { AdminWorkspace, SchoolWorkspace, StudentWorkspace } from './Workspaces';
import { ErrorMessage } from './Controls';
import './pilot.css';

function Workspace() {
  const { identity, logout } = useSession();
  const [error, setError] = useState('');
  const [leaving, setLeaving] = useState(false);
  if (identity.must_change_password) return <PasswordChange />;
  const exit = async () => { setLeaving(true); setError(''); try { await logout(); } catch (err) { setError(err.message); } finally { setLeaving(false); } };
  const roles = { admin: 'Administração geral', school: 'Acesso institucional', student: 'Acesso estudantil' };
  return <div className="pilot"><header className="pilot-header"><Logo inv /><div><span>{roles[identity.type]}</span><button disabled={leaving} onClick={exit}>{leaving ? 'Saindo…' : 'Sair'}</button></div></header><main className="pilot-main"><ErrorMessage>{error}</ErrorMessage>{identity.type === 'admin' ? <AdminWorkspace /> : identity.type === 'school' ? <SchoolWorkspace /> : <StudentWorkspace />}</main></div>;
}

function Router() {
  const { identity, checking, notice, setNotice } = useSession();
  const [page, setPage] = useState('home');
  const [access, setAccess] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  if (checking) return <main className="pilot-loading" role="status">Verificando sua sessão…</main>;
  if (identity) return <Workspace key={`${identity.type}:${identity.id}`} />;
  const go = (next) => { setPage(next); setMenuOpen(false); window.scrollTo(0, 0); };
  const pages = { home: <Home go={go} />, about: <About />, how: <How />, privacy: <Privacy />, team: <Team />, contact: <section className="pilot-main"><h1>Contato</h1><p>O formulário de contato ainda não está disponível. Procure o responsável pelo piloto na sua instituição.</p></section> };
  return <><Navbar page={page} go={go} openLogin={setAccess} menuOpen={menuOpen} setMenuOpen={setMenuOpen} /><main style={{ paddingTop: 60 }}>{notice && <div className="pilot-notice" role="status"><span>{notice}</span><button onClick={() => setNotice('')} aria-label="Ocultar aviso">Fechar</button></div>}{pages[page] || pages.home}</main><Footer go={go} />{access && <AccessForm initialType={access} onClose={() => setAccess(null)} />}</>;
}

export default function PilotApp() {
  return <SessionProvider><Router /></SessionProvider>;
}
