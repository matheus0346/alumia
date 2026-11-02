import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { DB, KEYS, loadInitialData } from '../services/storageService';
import { hash, genToken, normalizePhrase, uid } from '../utils/crypto';
import { calcUrgency } from '../utils/clinical';
import { aiAnalyze } from '../services/aiService';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);

  useEffect(() => {
    let active = true;
    loadInitialData().then((initial) => {
      if (active) setDb(initial);
    });
    return () => {
      active = false;
    };
  }, []);

  const logout = useCallback(() => {
    setAuth(null);
  }, []);

  const completeStudentOnboarding = useCallback(
    async ({ code, schoolToken, phrase, newPassword }) => {
      if (!db?.students?.[code]) return;
      const current = db.students[code];
      const updatedStudent = {
        ...current,
        firstLogin: true,
        recoveryHash: hash(normalizePhrase(phrase)),
        pwdHash:
          newPassword && newPassword.trim().length >= 4
            ? hash(newPassword.trim())
            : current.pwdHash,
      };
      const students = { ...db.students, [code]: updatedStudent };
      await DB.set(KEYS.students, students);
      setDb((prev) => ({ ...prev, students }));
      setAuth({ type: 'student', code, schoolToken });
    },
    [db]
  );

  const recoverStudentPassword = useCallback(
    async ({ code, phrase, newPassword }) => {
      const cleanCode = code.trim();
      const student = db?.students?.[cleanCode];
      if (!student) {
        return { ok: false, error: 'Código de aluno não encontrado.' };
      }
      if (!student.recoveryHash) {
        return {
          ok: false,
          error:
            'Este aluno ainda não realizou o primeiro acesso. Utilize a senha inicial fornecida pela escola.',
        };
      }
      if (hash(normalizePhrase(phrase)) !== student.recoveryHash) {
        return { ok: false, error: 'Frase secreta de recuperação incorreta.' };
      }
      if (!newPassword || newPassword.trim().length < 4) {
        return {
          ok: false,
          error: 'A nova senha deve ter no mínimo 4 caracteres.',
        };
      }
      const updatedStudent = {
        ...student,
        pwdHash: hash(newPassword.trim()),
      };
      const students = { ...db.students, [cleanCode]: updatedStudent };
      await DB.set(KEYS.students, students);
      setDb((prev) => ({ ...prev, students }));
      return { ok: true };
    },
    [db]
  );

  const createDiaryEntry = useCallback(
    async ({ studentCode, schoolToken, date, text }) => {
      const previousEntries = (db?.entries || []).filter(
        (e) => e.studentCode === studentCode
      );
      const analysis = await aiAnalyze(text, previousEntries);
      const entry = {
        id: uid(),
        studentCode,
        schoolToken,
        date,
        timestamp: Date.now(),
        content: text.trim(),
        indicators: analysis.indicators,
        riskLevel: analysis.nivel_risco || 'baixo',
        aiText: analysis.analise || '',
        sinaisAlerta: analysis.sinais_alerta || [],
        fatoresProtetivos: analysis.fatores_protetivos || [],
        recomendacao: analysis.recomendacao || '',
        aiSource: analysis.aiSource || 'claude',
      };
      entry.urgency = calcUrgency(entry);

      const entries = [...(db?.entries || []), entry];
      await DB.set(KEYS.entries, entries);
      setDb((prev) => ({ ...prev, entries }));
      return entry;
    },
    [db]
  );

  const createStudent = useCallback(
    async ({ code, password, schoolToken }) => {
      const c = code.trim();
      const p = password.trim();
      if (!c || !p) return { ok: false, error: 'Preencha código e senha.' };
      if (c.length < 3) return { ok: false, error: 'Código mínimo 3 caracteres.' };
      if (p.length < 4) return { ok: false, error: 'Senha mínima 4 caracteres.' };
      if (db?.students?.[c]) return { ok: false, error: 'Este código já existe.' };

      const students = {
        ...(db?.students || {}),
        [c]: {
          code: c,
          pwdHash: hash(p),
          recoveryHash: null,
          schoolToken,
          firstLogin: false,
          createdAt: Date.now(),
        },
      };
      await DB.set(KEYS.students, students);
      setDb((prev) => ({ ...prev, students }));
      return { ok: true, code: c };
    },
    [db]
  );

  const resetStudentAccess = useCallback(
    async ({ code, newPassword, schoolToken }) => {
      const student = db?.students?.[code];
      if (!student || student.schoolToken !== schoolToken) {
        return { ok: false, error: 'Aluno não encontrado nesta escola.' };
      }
      if (!newPassword || newPassword.trim().length < 4) {
        return {
          ok: false,
          error: 'A nova senha deve ter no mínimo 4 caracteres.',
        };
      }
      const students = {
        ...db.students,
        [code]: {
          ...student,
          pwdHash: hash(newPassword.trim()),
          recoveryHash: null,
          firstLogin: false,
        },
      };
      await DB.set(KEYS.students, students);
      setDb((prev) => ({ ...prev, students }));
      return { ok: true };
    },
    [db]
  );

  const createSchool = useCallback(
    async (name) => {
      if (!name.trim()) return { ok: false, error: 'Informe o nome da escola.' };
      const token = genToken();
      const school = {
        token,
        name: name.trim(),
        active: true,
        createdAt: Date.now(),
      };
      const schools = { ...(db?.schools || {}), [token]: school };
      await DB.set(KEYS.schools, schools);
      setDb((prev) => ({ ...prev, schools }));
      return { ok: true, school };
    },
    [db]
  );

  const toggleSchoolStatus = useCallback(
    async (token) => {
      const target = db?.schools?.[token];
      if (!target) return;
      const schools = {
        ...db.schools,
        [token]: { ...target, active: !target.active },
      };
      await DB.set(KEYS.schools, schools);
      setDb((prev) => ({ ...prev, schools }));
    },
    [db]
  );

  return (
    <AppContext.Provider
      value={{
        db,
        setDb,
        auth,
        setAuth,
        logout,
        completeStudentOnboarding,
        recoverStudentPassword,
        createDiaryEntry,
        createStudent,
        resetStudentAccess,
        createSchool,
        toggleSchoolStatus,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
};
