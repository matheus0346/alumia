import { RISK, URG } from '../../constants/indicators';
import { iColor } from '../../utils/clinical';
import logoImg from '../../assets/logo.jpeg';

export const Mn = ({ children, style: s = {} }) => (
  <span style={{ fontFamily: "'JetBrains Mono',monospace", ...s }}>
    {children}
  </span>
);

export const Logo = ({ inv = false }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexShrink: 0 }}>
    <div
      style={{
        width: 30,
        height: 30,
        background: inv ? '#000' : '#fff',
        borderRadius: 4,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <img
        src={logoImg}
        alt="ALUMIA Logo"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          transform: 'scale(1.3)',
          filter: inv ? 'invert(1)' : 'none',
        }}
      />
    </div>
    <span
      style={{
        fontFamily: "'Syne',sans-serif",
        fontSize: 15,
        fontWeight: 700,
        color: inv ? '#000' : '#fff',
        letterSpacing: '-.02em',
      }}
    >
      ALUMIA
    </span>
  </div>
);

export const Btn = ({
  children,
  onClick,
  v = 'dark',
  sz = 'md',
  full,
  disabled,
  style: s = {},
}) => {
  const P = {
    sm: { padding: '7px 14px', fontSize: 11.5 },
    md: { padding: '10px 24px', fontSize: 13 },
    lg: { padding: '13px 32px', fontSize: 14 },
  }[sz];
  const V = {
    dark: { background: '#000', color: '#fff', border: 'none' },
    light: { background: '#fff', color: '#000', border: '1px solid #ddd' },
    ghost: { background: 'transparent', color: '#555', border: '1px solid #bbb' },
    danger: { background: '#dc2626', color: '#fff', border: 'none' },
  }[v];

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontWeight: 700,
        letterSpacing: '.05em',
        transition: 'all .17s',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        justifyContent: 'center',
        opacity: disabled ? 0.45 : 1,
        width: full ? '100%' : 'auto',
        ...P,
        ...V,
        ...s,
      }}
      onMouseEnter={(e) => {
        if (!disabled && v === 'dark') e.currentTarget.style.background = '#1a1a1a';
        if (!disabled && v === 'light') e.currentTarget.style.borderColor = '#999';
      }}
      onMouseLeave={(e) => {
        if (v === 'dark') e.currentTarget.style.background = '#000';
        if (v === 'light') e.currentTarget.style.borderColor = '#ddd';
      }}
    >
      {children}
    </button>
  );
};

export const Tag = ({ risk, urgency }) => {
  if (urgency) {
    const u = URG[urgency] || URG.leve;
    return (
      <span
        style={{
          display: 'inline-block',
          padding: '2px 8px',
          fontSize: 10,
          fontWeight: 700,
          background: u.bg,
          color: u.color,
          letterSpacing: '.07em',
          border: `1px solid ${u.color}40`,
        }}
      >
        {u.label}
      </span>
    );
  }
  const r = RISK[risk] || RISK.baixo;
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 9px',
        fontSize: 10.5,
        fontWeight: 700,
        background: r.bg,
        color: r.color,
        letterSpacing: '.06em',
        border: `1px solid ${r.border}`,
      }}
    >
      {r.label}
    </span>
  );
};

export const Fld = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  mono,
  err,
  note,
  rows,
  af,
}) => (
  <div style={{ marginBottom: 14 }}>
    {label && (
      <label
        style={{
          display: 'block',
          fontSize: 10,
          fontWeight: 700,
          color: '#aaa',
          letterSpacing: '.1em',
          marginBottom: 5,
        }}
      >
        {label}
      </label>
    )}
    {rows ? (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        autoFocus={af}
        style={{
          width: '100%',
          border: `1px solid ${err ? '#dc2626' : '#ddd'}`,
          background: '#fafafa',
          padding: '10px 13px',
          fontSize: 14,
          color: '#111',
          lineHeight: 1.7,
          transition: 'border .14s',
          resize: 'vertical',
        }}
        onFocus={(e) => (e.target.style.borderColor = err ? '#dc2626' : '#000')}
        onBlur={(e) => (e.target.style.borderColor = err ? '#dc2626' : '#ddd')}
      />
    ) : (
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={af}
        style={{
          width: '100%',
          border: `1px solid ${err ? '#dc2626' : '#ddd'}`,
          background: '#fafafa',
          padding: '10px 13px',
          fontSize: 14,
          color: '#111',
          fontFamily: mono ? "'JetBrains Mono',monospace" : 'inherit',
          transition: 'border .14s',
        }}
        onFocus={(e) => (e.target.style.borderColor = err ? '#dc2626' : '#000')}
        onBlur={(e) => (e.target.style.borderColor = err ? '#dc2626' : '#ddd')}
      />
    )}
    {err && <div style={{ fontSize: 11, color: '#dc2626', marginTop: 3 }}>{err}</div>}
    {note && (
      <div style={{ fontSize: 11, color: '#bbb', marginTop: 3, lineHeight: 1.5 }}>
        {note}
      </div>
    )}
  </div>
);

export const Sp = () => (
  <span className="spin" style={{ fontSize: 13 }}>
    ⟳
  </span>
);

export const Inf = ({ type = 'info', children }) => {
  const T = {
    err: { bg: '#fff5f5', b: '#fecaca', c: '#dc2626' },
    warn: { bg: '#fffbeb', b: '#fde68a', c: '#b45309' },
    ok: { bg: '#f0fdf4', b: '#bbf7d0', c: '#15803d' },
    info: { bg: '#f0f9ff', b: '#bae6fd', c: '#0369a1' },
  }[type];
  return (
    <div
      style={{
        padding: '10px 14px',
        background: T.bg,
        border: `1px solid ${T.b}`,
        color: T.c,
        fontSize: 13,
        lineHeight: 1.5,
        marginBottom: 12,
      }}
    >
      {children}
    </div>
  );
};

export const Dv = ({ m = '20px 0' }) => (
  <div style={{ borderTop: '1px solid #ebebeb', margin: m }} />
);

export const IBar = ({ label, value, sm }) => (
  <div style={{ marginBottom: sm ? 5 : 8 }}>
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: sm ? 11.5 : 13,
        marginBottom: 2,
      }}
    >
      <span style={{ color: '#555' }}>{label}</span>
      <Mn style={{ fontSize: sm ? 10 : 11, color: iColor(value), fontWeight: 600 }}>
        {value}%
      </Mn>
    </div>
    <div style={{ height: sm ? 3 : 4, background: '#f0f0f0', borderRadius: 2 }}>
      <div
        style={{
          height: '100%',
          width: `${value}%`,
          background: iColor(value),
          borderRadius: 2,
          transition: 'width .6s ease',
        }}
      />
    </div>
  </div>
);

export const Shell = ({
  title,
  sub,
  tabs,
  tab,
  setTab,
  onLogout,
  badge = {},
  children,
}) => (
  <div
    style={{
      minHeight: '100vh',
      background: '#f4f4f4',
      fontFamily: "'Epilogue',sans-serif",
    }}
  >
    <div
      style={{
        background: '#000',
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <Logo />
        {title && (
          <>
            <div style={{ width: 1, height: 15, background: '#1e1e1e' }} />
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: '#fff' }}>
                {title}
              </div>
              {sub && (
                <Mn
                  style={{
                    fontSize: 10,
                    color: '#666',
                    display: 'block',
                    marginTop: 1,
                  }}
                >
                  {sub}
                </Mn>
              )}
            </div>
          </>
        )}
      </div>
      <button
        onClick={onLogout}
        style={{
          fontSize: 11,
          color: '#777',
          cursor: 'pointer',
          padding: '5px 11px',
          border: '1px solid #1e1e1e',
          background: 'none',
          letterSpacing: '.04em',
          transition: 'border .14s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#555')}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1e1e1e')}
      >
        SAIR
      </button>
    </div>
    {tabs && (
      <div
        style={{
          background: '#fff',
          borderBottom: '1px solid #e8e8e8',
          padding: '0 24px',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
        }}
      >
        {tabs.map(([id, lbl]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`tab-btn${tab === id ? ' on' : ''}`}
          >
            {lbl}
            {badge[id] > 0 && (
              <span
                style={{
                  marginLeft: 5,
                  background: '#dc2626',
                  color: '#fff',
                  fontSize: 9,
                  fontWeight: 700,
                  padding: '1px 5px',
                  borderRadius: 8,
                }}
              >
                {badge[id]}
              </span>
            )}
          </button>
        ))}
      </div>
    )}
    <div style={{ padding: '20px 24px', maxWidth: 1080, margin: '0 auto' }}>
      {children}
    </div>
  </div>
);

export const ModalWrap = ({ onClose, children, w = 460 }) => (
  <div
    className="fi"
    onClick={onClose}
    style={{
      position: 'fixed',
      inset: 0,
      zIndex: 800,
      background: 'rgba(0,0,0,.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 14,
    }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        background: '#fff',
        width: '100%',
        maxWidth: w,
        maxHeight: '92vh',
        overflowY: 'auto',
        position: 'relative',
      }}
    >
      {children}
    </div>
  </div>
);
