import { useEffect, useState } from 'react';
import { useSession } from './SessionContext';
import { ConfirmAction, ErrorMessage, Field, Pager } from './Controls';
import { ListingStatus, useListing, useMutation } from './Listing';

const TZ = 'America/Sao_Paulo';
const fmt = (iso) => iso ? new Intl.DateTimeFormat('pt-BR', { timeZone: TZ, dateStyle: 'short', timeStyle: 'medium' }).format(new Date(iso)) : '—';
const STATUS = { scheduled: 'Agendado', open: 'Aberto', ended: 'Encerrado pelo prazo', closed: 'Encerrado pelo administrador' };
const today = () => new Intl.DateTimeFormat('sv-SE', { timeZone: TZ }).format(new Date());

function PeriodItem({ period, children }) {
  return <li><div><h3>{fmt(period.starts_at)} a {fmt(period.ends_at)}</h3><span className={period.status === 'open' ? 'pilot-status' : 'pilot-status pilot-inactive'}>{STATUS[period.status] || period.status}</span><p className="pilot-muted">{period.submissions_count ?? 0} texto(s) enviado(s)</p></div>{children}</li>;
}

// Administração geral: abre e encerra períodos. Não exibe textos.
export function AdminPeriods({ schools }) {
  const [schoolId, setSchoolId] = useState('');
  return <section className="pilot-card pilot-periods"><h2>Períodos de avaliação</h2><p className="pilot-muted">Cada período dura 7 dias (horário de Brasília): abre às 00:00:00 do primeiro dia e fecha às 23:59:59 do último. Só a administração geral abre e encerra períodos; os textos não aparecem neste perfil.</p>
    <label className="pilot-field"><span>Escola</span><select value={schoolId} onChange={(e) => setSchoolId(e.target.value)}><option value="">Selecione…</option>{schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
    {schoolId && <SchoolPeriods key={schoolId} schoolId={schoolId} />}
  </section>;
}

function SchoolPeriods({ schoolId }) {
  const [start, setStart] = useState(today());
  const path = `/api/v1/admin/schools/${schoolId}/assessment-periods`;
  const data = useListing(path, 'periods');
  const action = useMutation(data.refresh);
  const create = async (event) => { event.preventDefault(); await action.mutate(path, 'POST', { start_date: start }); };
  return <><form onSubmit={create}><Field label="Primeiro dia do período" type="date" value={start} min={today()} onChange={(e) => setStart(e.target.value)} required /><button className="pilot-primary" disabled={action.busy || !start}>{action.busy ? 'Processando…' : 'Abrir período de 7 dias'}</button></form><ErrorMessage>{action.error}</ErrorMessage>
    <ListingStatus data={data} empty="Nenhum período criado para esta escola." />
    <ul className="pilot-records">{data.listing?.data.map((p) => <PeriodItem key={p.id} period={p}>{(p.status === 'open' || p.status === 'scheduled') && <ConfirmAction label="Encerrar período" description="Novos envios serão bloqueados imediatamente. Os textos já enviados são mantidos." disabled={action.busy} onConfirm={() => action.mutate(`/api/v1/admin/assessment-periods/${p.id}/close`, 'POST', {})} />}</PeriodItem>)}</ul>
    {data.listing && <Pager {...data.listing} onPage={data.setPage} busy={data.loading || action.busy} />}</>;
}

// Escola: lê os textos da própria instituição, por período.
export function SchoolSubmissions() {
  const periods = useListing('/api/v1/school/assessment-periods', 'periods');
  const [selected, setSelected] = useState(null);
  return <section className="pilot-card pilot-periods"><div className="pilot-section-heading"><h2>Textos dos estudantes</h2><button disabled={periods.loading} onClick={periods.refresh}>Atualizar</button></div><p className="pilot-muted">Conteúdo sensível: acesse somente se for da coordenação ou da psicologia da escola, não copie para outros meios e não compartilhe fora do protocolo da escola.</p>
    <ListingStatus data={periods} empty="Nenhum período de avaliação foi aberto para a sua escola." />
    <ul className="pilot-records">{periods.listing?.data.map((p) => <PeriodItem key={p.id} period={p}><div className="pilot-actions"><button onClick={() => setSelected(selected === p.id ? null : p.id)}>{selected === p.id ? 'Ocultar textos' : 'Ler textos'}</button></div></PeriodItem>)}</ul>
    {periods.listing && <Pager {...periods.listing} onPage={periods.setPage} busy={periods.loading} />}
    {selected && <SubmissionList key={selected} periodId={selected} />}
  </section>;
}

function SubmissionList({ periodId }) {
  const data = useListing(`/api/v1/school/assessment-periods/${periodId}/submissions`, 'submissions');
  return <div className="pilot-submissions"><ListingStatus data={data} empty="Nenhum texto enviado neste período." />
    <ul className="pilot-records">{data.listing?.data.map((s) => <li key={s.id}><div><h3>{s.student_code}</h3><span className="pilot-muted">Enviado em {fmt(s.submitted_at)}</span><p className="pilot-text">{s.text}</p></div></li>)}</ul>
    {data.listing && <Pager {...data.listing} onPage={data.setPage} busy={data.loading} />}</div>;
}

// Estudante: escreve e envia um texto por período, sem edição nem reenvio.
export function StudentAssessment() {
  const { call } = useSession();
  const [state, setState] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [text, setText] = useState('');
  const [step, setStep] = useState('write');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const load = () => { setLoadError(''); return call('/api/v1/student/assessment').then(setState).catch((e) => setLoadError(e.message)); };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  if (loadError) return <section className="pilot-card pilot-student"><ErrorMessage>{loadError}</ErrorMessage><button onClick={load}>Tentar novamente</button></section>;
  if (!state) return <p role="status">Carregando…</p>;
  if (state.submitted) return <section className="pilot-card pilot-student" role="status"><h2>Texto enviado</h2><p>Seu texto foi enviado em {fmt(state.submitted_at)}. Ele não pode ser editado nem reenviado. Obrigado por participar.</p></section>;
  if (!state.period) return <section className="pilot-card pilot-student"><h2>Nenhum período de avaliação aberto</h2><p>Quando a escola abrir um período, a atividade aparecerá aqui. Volte durante o período indicado pela sua escola.</p><Help /></section>;
  const send = async () => {
    setBusy(true); setError('');
    try {
      const result = await call(`/api/v1/student/assessment-periods/${state.period.id}/submission`, { method: 'POST', body: { text } });
      setText(''); setState({ ...state, submitted: true, submitted_at: result.submitted_at });
    } catch (err) {
      if (err.code === 'already_submitted' || err.code === 'period_closed') { setText(''); await load(); }
      else { setError(err.message); setStep('write'); }
    } finally { setBusy(false); }
  };
  const tooLong = text.length > state.max_length;
  return <section className="pilot-card pilot-student"><h2>Escreva seu texto</h2><p className="pilot-muted">Período aberto até {fmt(state.period.ends_at)} (horário de Brasília).</p>
    <div className="pilot-notice-box" role="note"><h3>Antes de escrever</h3><ul><li>Quem lê: o texto será lido pela coordenação e pela psicologia da sua escola. Ele não é público e não é lido por outros alunos.</li><li>Não há resposta imediata e este canal não é um atendimento de emergência.</li><li>Se você precisa de ajuda agora, procure um adulto de confiança ou ligue para o CVV, no 188 (24 horas, gratuito).</li><li>Você pode enviar apenas um texto neste período, e ele não poderá ser editado depois de enviado.</li></ul></div>
    <ErrorMessage>{error}</ErrorMessage>
    {step === 'write' ? <form onSubmit={(e) => { e.preventDefault(); setError(''); setStep('confirm'); }}><label className="pilot-field"><span>Seu texto</span><textarea rows={12} value={text} onChange={(e) => setText(e.target.value)} aria-describedby="count" maxLength={state.max_length + 500} required /></label><p id="count" className="pilot-muted" aria-live="polite">{text.length} de {state.max_length} caracteres{tooLong ? ' — reduza o texto para enviar' : ''}</p><button className="pilot-primary" disabled={!text.trim() || tooLong}>Revisar e enviar</button></form>
      : <div className="pilot-confirm" role="alertdialog" aria-label="Confirmar envio"><p><strong>Enviar definitivamente?</strong> Depois de enviado, o texto não poderá ser editado nem reenviado.</p><div className="pilot-actions"><button className="pilot-primary" disabled={busy} onClick={send}>{busy ? 'Enviando…' : 'Enviar definitivamente'}</button><button disabled={busy} onClick={() => setStep('write')}>Voltar e editar</button></div></div>}
    {error && <button onClick={load}>Verificar se o texto foi enviado</button>}
    <Help />
  </section>;
}

function Help() { return <p className="pilot-muted">Se precisar de ajuda agora, procure um adulto de confiança ou ligue para o CVV: 188.</p>; }
