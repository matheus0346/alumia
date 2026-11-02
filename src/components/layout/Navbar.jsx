import { useState, useEffect } from 'react';
import { Logo, Btn } from '../ui/Primitives';

export const Navbar = ({ go, page, openLogin, menuOpen, setMenuOpen }) => {
  const [sc, setSc] = useState(false);

  useEffect(() => {
    const h = () => setSc(window.scrollY > 10);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  const links = [
    ['home', 'Home'],
    ['about', 'Sobre'],
    ['how', 'Como funciona'],
    ['privacy', 'Privacidade'],
    ['team', 'Equipe'],
    ['contact', 'Contato'],
  ];

  return (
    <>
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 200,
          height: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 5%',
          background: sc ? 'rgba(0,0,0,.97)' : '#000',
          backdropFilter: 'blur(12px)',
          transition: 'background .25s',
          borderBottom: sc ? '1px solid #111' : 'none',
        }}
      >
        <div onClick={() => go('home')} style={{ cursor: 'pointer' }}>
          <Logo />
        </div>
        <div className="dk" style={{ display: 'flex', gap: 24 }}>
          {links.map(([id, l]) => (
            <span
              key={id}
              className="hl"
              onClick={() => go(id)}
              style={{
                color: page === id ? '#fff' : '#666',
                fontSize: 12.5,
                fontWeight: 500,
                cursor: 'pointer',
                borderBottom:
                  page === id ? '1px solid #fff' : '1px solid transparent',
                paddingBottom: 2,
                transition: 'color .14s',
              }}
            >
              {l}
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div className="dk">
            <Btn v="ghost" sz="sm" onClick={() => openLogin('school')}>
              ESCOLA
            </Btn>
          </div>
          <Btn sz="sm" onClick={() => openLogin('student')}>
            LOGIN
          </Btn>
          <button
            className="mb hl"
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              color: '#fff',
              fontSize: 19,
              cursor: 'pointer',
              marginLeft: 4,
            }}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </nav>
      {menuOpen && (
        <div
          className="fi"
          style={{
            position: 'fixed',
            top: 60,
            left: 0,
            right: 0,
            zIndex: 199,
            background: '#000',
            borderBottom: '1px solid #111',
          }}
        >
          {links.map(([id, l]) => (
            <div
              key={id}
              onClick={() => {
                go(id);
                setMenuOpen(false);
              }}
              style={{
                color: '#888',
                fontSize: 14,
                padding: '13px 5%',
                borderBottom: '1px solid #0d0d0d',
                cursor: 'pointer',
              }}
            >
              {l}
            </div>
          ))}
          <div
            onClick={() => {
              openLogin('school');
              setMenuOpen(false);
            }}
            style={{
              color: '#555',
              fontSize: 14,
              padding: '13px 5%',
              borderBottom: '1px solid #0d0d0d',
              cursor: 'pointer',
            }}
          >
            Área da Escola
          </div>
          <div
            onClick={() => {
              openLogin('admin');
              setMenuOpen(false);
            }}
            style={{
              color: '#2a2a2a',
              fontSize: 12,
              padding: '12px 5%',
              cursor: 'pointer',
              fontFamily: "'JetBrains Mono',monospace",
            }}
          >
            admin
          </div>
        </div>
      )}
    </>
  );
};
