import { Logo, Mn } from '../ui/Primitives';

export const Footer = ({ go }) => (
  <footer style={{ background: '#000', padding: '48px 5% 26px' }}>
    <div style={{ maxWidth: 1060, margin: '0 auto' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(155px,1fr))',
          gap: 36,
          marginBottom: 32,
        }}
      >
        <div>
          <Logo />
          <p
            style={{
              color: '#444',
              fontSize: 12.5,
              lineHeight: 1.7,
              marginTop: 10,
              maxWidth: 175,
            }}
          >
            Tecnologia para enxergar o que a escola não consegue ver.
          </p>
        </div>
        <div>
          <div
            style={{
              fontSize: 9.5,
              fontWeight: 700,
              color: '#333',
              letterSpacing: '.14em',
              marginBottom: 11,
            }}
          >
            NAVEGAÇÃO
          </div>
          {[
            ['home', 'Home'],
            ['about', 'Sobre'],
            ['how', 'Como funciona'],
            ['privacy', 'Privacidade'],
            ['team', 'Equipe'],
            ['contact', 'Contato'],
          ].map(([id, l]) => (
            <div
              key={id}
              onClick={() => go(id)}
              className="hl"
              style={{
                color: '#555',
                fontSize: 12.5,
                marginBottom: 7,
                cursor: 'pointer',
              }}
            >
              {l}
            </div>
          ))}
        </div>
        <div>
          <div
            style={{
              fontSize: 9.5,
              fontWeight: 700,
              color: '#333',
              letterSpacing: '.14em',
              marginBottom: 11,
            }}
          >
            LEGAL
          </div>
          {['Política de Privacidade', 'Termos de Uso', 'LGPD', 'Segurança'].map(
            (l) => (
              <div
                key={l}
                style={{ color: '#555', fontSize: 12.5, marginBottom: 7 }}
              >
                {l}
              </div>
            )
          )}
        </div>
        <div>
          <div
            style={{
              fontSize: 9.5,
              fontWeight: 700,
              color: '#333',
              letterSpacing: '.14em',
              marginBottom: 11,
            }}
          >
            CONTATO
          </div>
          <div style={{ color: '#555', fontSize: 12.5, marginBottom: 5 }}>
            contato@alumia.edu.br
          </div>
          <div style={{ color: '#555', fontSize: 12.5, marginBottom: 14 }}>
            São Paulo — Brasil
          </div>
          <Mn
            style={{
              fontSize: 10,
              color: '#444',
              padding: '4px 8px',
              border: '1px solid #1a1a1a',
              display: 'inline-block',
            }}
          >
            LGPD · v3.1 · 2026
          </Mn>
        </div>
      </div>
      <div
        style={{
          borderTop: '1px solid #0e0e0e',
          paddingTop: 16,
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div style={{ color: '#333', fontSize: 11.5 }}>
          © 2026 ALUMIA Tecnologia Educacional LTDA. Todos os direitos reservados.
        </div>
        <Mn style={{ fontSize: 10, color: '#333' }}>
          privacy-by-design · claude-sonnet · lgpd-compliant
        </Mn>
      </div>
    </div>
  </footer>
);
