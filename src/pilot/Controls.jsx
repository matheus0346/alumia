import { useId, useState } from 'react';

export function Field({ label, error, ...props }) {
  const id = useId();
  return <label className="pilot-field" htmlFor={id}><span>{label}</span><input id={id} aria-invalid={!!error} {...props} />{error && <small>{error}</small>}</label>;
}

export function ErrorMessage({ children }) {
  return children ? <p className="pilot-error" role="alert">{children}</p> : null;
}

export function Pager({ current_page, last_page, onPage, busy }) {
  if (last_page <= 1) return null;
  return <nav className="pilot-pagination" aria-label="Paginação"><button disabled={busy || current_page <= 1} onClick={() => onPage(current_page - 1)}>Anterior</button><span>Página {current_page} de {last_page}</span><button disabled={busy || current_page >= last_page} onClick={() => onPage(current_page + 1)}>Próxima</button></nav>;
}

export function OneTimeSecret({ secret, label, username, onClose }) {
  return <section className="pilot-secret" role="region" aria-label={label}><h2>{label}</h2>{username && <p>Usuário: <strong>{username}</strong></p>}<code>{secret}</code><p>Guarde agora e entregue por um canal seguro. Esta credencial não poderá ser consultada novamente.</p><button onClick={onClose}>Já guardei, ocultar credencial</button></section>;
}

export function ConfirmAction({ label, description, onConfirm, disabled }) {
  const [confirm, setConfirm] = useState(false);
  return confirm ? <div className="pilot-confirm"><p>{description}</p><div className="pilot-actions"><button disabled={disabled} onClick={async () => { try { await onConfirm(); } finally { setConfirm(false); } }}>Confirmar</button><button disabled={disabled} onClick={() => setConfirm(false)}>Cancelar</button></div></div> : <button disabled={disabled} className="pilot-secondary" onClick={() => setConfirm(true)}>{label}</button>;
}
