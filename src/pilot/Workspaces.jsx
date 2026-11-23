import { useState } from 'react';
import { useSession } from './SessionContext';
import { ConfirmAction, ErrorMessage, Field, OneTimeSecret, Pager } from './Controls';
import { ListingStatus, useListing, useMutation } from './Listing';
import { AdminPeriods, SchoolSubmissions, StudentAssessment } from './Assessment';

export function AdminWorkspace() {
  const data = useListing('/api/v1/admin/schools', 'schools');
  const action = useMutation(data.refresh);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const showPassword = (result) => action.setSecret({ label: 'Senha temporária da escola', secret: result.temporary_password, username: result.username });
  const create = async (event) => {
    event.preventDefault();
    const ok = await action.mutate('/api/v1/admin/schools', 'POST', { name: name.trim(), username: username.trim() }, showPassword);
    if (ok) { setName(''); setUsername(''); }
  };
  return <><p className="pilot-eyebrow">ADMINISTRAÇÃO</p><h1>Escolas e acessos</h1><p className="pilot-intro">Gerencie as credenciais institucionais. Textos e dados individuais de estudantes não são exibidos neste perfil.</p>
    {action.secret && <OneTimeSecret {...action.secret} onClose={() => action.setSecret(null)} />}
    <ErrorMessage>{action.error}</ErrorMessage>
    <div className="pilot-grid"><section className="pilot-card"><h2>Cadastrar escola</h2><form onSubmit={create}><Field label="Nome da escola" value={name} onChange={(e) => setName(e.target.value)} required maxLength={255} /><Field label="Usuário institucional" value={username} onChange={(e) => setUsername(e.target.value)} required minLength={3} maxLength={80} pattern="[A-Za-z0-9_.-]+" autoCapitalize="none" /><p className="pilot-muted">A senha temporária será gerada pelo servidor.</p><button className="pilot-primary" disabled={action.busy || !!action.secret}>{action.busy ? 'Processando…' : 'Criar escola'}</button></form></section>
    <section className="pilot-card"><div className="pilot-section-heading"><h2>Escolas cadastradas</h2><button disabled={data.loading || action.busy} onClick={data.refresh}>Atualizar</button></div><ListingStatus data={data} empty="Nenhuma escola cadastrada." />
    <ul className="pilot-records">{data.listing?.data.map((school) => <li key={school.id}><div><h3>{school.name}</h3><span className={school.active ? 'pilot-status' : 'pilot-status pilot-inactive'}>{school.active ? 'Ativa' : 'Suspensa'}</span></div><div className="pilot-actions"><ConfirmAction label="Redefinir senha" description="Confirme que verificou a solicitação. A nova senha revoga as sessões anteriores e deverá ser entregue por canal seguro." disabled={action.busy || !!action.secret} onConfirm={() => action.mutate(`/api/v1/admin/schools/${school.id}/password`, 'POST', {}, showPassword)} /><ConfirmAction label={school.active ? 'Suspender acesso' : 'Reativar acesso'} description={school.active ? 'A escola e seus estudantes ficarão impedidos de usar a plataforma.' : 'A escola e seus estudantes ativos poderão acessar novamente.'} disabled={action.busy || !!action.secret} onConfirm={() => action.mutate(`/api/v1/admin/schools/${school.id}`, 'PATCH', { active: !school.active })} /></div></li>)}</ul>
    {data.listing && <Pager {...data.listing} onPage={data.setPage} busy={data.loading || action.busy} />}</section></div>
    <AdminPeriods schools={data.listing?.data || []} />
  </>;
}

export function SchoolWorkspace() {
  const data = useListing('/api/v1/school/students', 'students');
  const action = useMutation(data.refresh);
  const [code, setCode] = useState('');
  const showToken = (result) => action.setSecret({ label: `Token individual — ${result.student.code}`, secret: result.token });
  const create = async (event) => {
    event.preventDefault();
    const ok = await action.mutate('/api/v1/school/students', 'POST', { code: code.trim() }, showToken);
    if (ok) setCode('');
  };
  return <><p className="pilot-eyebrow">ÁREA DA ESCOLA</p><h1>Acessos dos estudantes</h1><p className="pilot-intro">Os registros abaixo pertencem à sua instituição. Use códigos internos; mantenha a correspondência com os alunos fora da plataforma.</p>
    {action.secret && <OneTimeSecret {...action.secret} onClose={() => action.setSecret(null)} />}
    <ErrorMessage>{action.error}</ErrorMessage>
    <div className="pilot-grid"><section className="pilot-card"><h2>Cadastrar código estudantil</h2><form onSubmit={create}><Field label="Código do estudante" value={code} onChange={(e) => setCode(e.target.value)} required maxLength={40} pattern="[A-Za-z0-9_-]+" autoCapitalize="characters" /><p className="pilot-muted">Não informe nome, e-mail ou documentos pessoais.</p><button className="pilot-primary" disabled={action.busy || !!action.secret}>{action.busy ? 'Processando…' : 'Criar acesso individual'}</button></form><div className="pilot-upcoming"><h3>Indicadores</h3><p>A análise automática ainda não está disponível nesta versão. Os textos enviados são lidos diretamente pela equipe da escola.</p></div></section>
    <section className="pilot-card"><div className="pilot-section-heading"><h2>Estudantes cadastrados</h2><button disabled={data.loading || action.busy} onClick={data.refresh}>Atualizar</button></div><ListingStatus data={data} empty="Nenhum código cadastrado nesta escola." />
    <ul className="pilot-records">{data.listing?.data.map((student) => <li key={student.id}><div><h3>{student.code}</h3><span className={student.active ? 'pilot-status' : 'pilot-status pilot-inactive'}>{student.active ? 'Acesso ativo' : 'Acesso revogado'}</span></div><div className="pilot-actions"><ConfirmAction label={student.active ? 'Gerar novo token' : 'Reativar com novo token'} description="O token anterior e as sessões vinculadas deixarão de funcionar. Guarde e entregue o novo token ao estudante." disabled={action.busy || !!action.secret} onConfirm={() => action.mutate(`/api/v1/school/students/${student.id}/token`, 'POST', {}, showToken)} />{student.active && <ConfirmAction label="Revogar acesso" description="O token e as sessões do estudante deixarão de funcionar. O registro será preservado." disabled={action.busy || !!action.secret} onConfirm={() => action.mutate(`/api/v1/school/students/${student.id}/token`, 'DELETE')} />}</div></li>)}</ul>
    {data.listing && <Pager {...data.listing} onPage={data.setPage} busy={data.loading || action.busy} />}</section></div>
    <SchoolSubmissions />
  </>;
}

export function StudentWorkspace() {
  const { identity } = useSession();
  return <><p className="pilot-eyebrow">SEU ESPAÇO NA ALUMIA</p><h1>Avaliação</h1><p className="pilot-intro">Você está conectado com o código <strong>{identity.code}</strong>.</p><StudentAssessment /></>;
}
