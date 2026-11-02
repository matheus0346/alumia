import { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Mn } from './components/ui/Primitives';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { LoginModal } from './components/auth/LoginModal';
import { StudentArea } from './components/student/StudentArea';
import { SchoolDashboard } from './components/school/SchoolDashboard';
import { AdminPanel } from './components/admin/AdminPanel';
import {
  Home,
  About,
  How,
  Privacy,
  Team,
  ContactPage,
} from './pages/PublicPages';

const AppRouter = () => {
  const { db, auth } = useApp();
  const [page, setPage] = useState('home');
  const [modal, setModal] = useState(false);
  const [loginType, setLoginType] = useState('student');
  const [menuOpen, setMenuOpen] = useState(false);

  const go = (p) => {
    setPage(p);
    setMenuOpen(false);
    window.scrollTo(0, 0);
  };

  const openLogin = (t) => {
    setLoginType(t);
    setModal(true);
    setMenuOpen(false);
  };

  if (!db) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Epilogue',sans-serif",
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 34,
              height: 34,
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Syne',sans-serif",
              fontWeight: 800,
              fontSize: 15,
              margin: '0 auto 14px',
            }}
          >
            A
          </div>
          <Mn style={{ color: '#555', fontSize: 12, letterSpacing: '.1em' }}>
            CARREGANDO...
          </Mn>
        </div>
      </div>
    );
  }

  if (auth?.type === 'student') return <StudentArea />;
  if (auth?.type === 'school') return <SchoolDashboard />;
  if (auth?.type === 'admin') return <AdminPanel />;

  const PAGES = {
    home: <Home go={go} />,
    about: <About />,
    how: <How />,
    privacy: <Privacy />,
    team: <Team />,
    contact: <ContactPage />,
  };

  return (
    <div
      style={{
        fontFamily: "'Epilogue',sans-serif",
        background: '#fff',
        color: '#111',
      }}
    >
      <Navbar
        go={go}
        page={page}
        openLogin={openLogin}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
      />
      <div style={{ paddingTop: 60 }}>{PAGES[page] || <Home go={go} />}</div>
      <Footer go={go} />
      {modal && (
        <LoginModal
          type={loginType}
          setType={setLoginType}
          onClose={() => setModal(false)}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  );
}
