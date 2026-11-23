import { useCallback, useEffect, useState } from 'react';
import { useSession } from './SessionContext';
import { ErrorMessage } from './Controls';

export function useListing(path, key) {
  const { call } = useSession();
  const [page, setPage] = useState(1);
  const [version, setVersion] = useState(0);
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    call(`${path}?page=${page}`).then((data) => { if (active) setListing(data[key]); })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [path, key, page, version, call]);
  const refresh = useCallback(() => setVersion((value) => value + 1), []);
  return { listing, loading, error, setPage, refresh };
}

export function useMutation(refresh) {
  const { call } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [secret, setSecret] = useState(null);
  const mutate = async (path, method, body, onSuccess) => {
    setBusy(true); setError(''); setSecret(null);
    try {
      const result = await call(path, { method, body });
      onSuccess?.(result);
      refresh();
      return true;
    } catch (err) { setError(err.message); return false; }
    finally { setBusy(false); }
  };
  return { busy, error, secret, setSecret, mutate };
}

export function ListingStatus({ data, empty }) {
  return <>{data.loading && <p role="status">Carregando registros…</p>}<ErrorMessage>{data.error}</ErrorMessage>{data.error && <button onClick={data.refresh}>Tentar carregar novamente</button>}{!data.loading && !data.error && data.listing?.data.length === 0 && <p className="pilot-empty">{empty}</p>}</>;
}
