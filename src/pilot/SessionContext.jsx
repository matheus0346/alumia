import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from './apiClient';

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [identity, setIdentity] = useState(null);
  const [checking, setChecking] = useState(true);
  const [notice, setNotice] = useState('');

  const call = useCallback(async (path, options) => {
    try { return await api.request(path, options); }
    catch (error) {
      if (error.status === 401 || error.code === 'access_suspended') {
        setIdentity(null);
        setNotice(error.message);
      }
      if (error.code === 'password_change_required') setIdentity((current) => current && ({ ...current, must_change_password: true }));
      throw error;
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    api.request('/api/v1/auth/session', { signal: controller.signal })
      .then((data) => { if (!controller.signal.aborted) setIdentity(data.identity); })
      .catch((error) => { if (!controller.signal.aborted && error.status !== 401) setNotice(error.message); })
      .finally(() => { if (!controller.signal.aborted) setChecking(false); });
    return () => controller.abort();
  }, []);

  const login = async (type, body) => {
    const data = await call(`/api/v1/auth/${type === 'student' ? 'student' : 'institution'}/login`, { method: 'POST', body });
    setNotice('');
    setIdentity(data.identity);
  };
  const logout = async () => {
    await call('/api/v1/auth/logout', { method: 'POST' });
    setIdentity(null);
    setNotice('Você saiu da plataforma.');
  };
  const changePassword = async (body) => {
    await call('/api/v1/auth/password', { method: 'PUT', body });
    try {
      const data = await call('/api/v1/auth/session');
      setIdentity(data.identity);
    } catch {
      setIdentity(null);
      setNotice('Senha alterada. Entre novamente para continuar.');
    }
  };
  return <SessionContext.Provider value={{ identity, checking, notice, setNotice, call, login, logout, changePassword }}>{children}</SessionContext.Provider>;
}

export const useSession = () => useContext(SessionContext);
