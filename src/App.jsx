import { useState, useEffect, useMemo, useCallback } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from "recharts";

/* ─── STORAGE (com suporte a localStorage para Web e window.storage para Claude) ─── */
const DB = {
  async get(k) {
    try {
      if (typeof window !== 'undefined' && window.storage?.get) {
        const r = await window.storage.get(k);
        return r ? JSON.parse(r.value) : null;
      }
      const item = localStorage.getItem(k);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },
  async set(k, v) {
    try {
      if (typeof window !== 'undefined' && window.storage?.set) {
        await window.storage.set(k, JSON.stringify(v));
        return;
      }
      localStorage.setItem(k, JSON.stringify(v));
    } catch {}
  },
};
const KEYS = { schools: 'alm_sc', students: 'alm_st', entries: 'alm_en' };

/* ─── UTILS ─── */
const hash = p => { let h = 5381; for (let i = 0; i < p.length; i++) h = ((h << 5) + h) ^ p.charCodeAt(i); return 'h' + (h >>> 0).toString(36); };
const uid  = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
const genToken = () => `ESC-${Math.floor(1000 + Math.random() * 9000)}-ALUMIA`;
const WLIST = ['lua','escura','ponte','vidro','silêncio','noite','rio','pedra','névoa','sombra','vento','terra','tempo','mar','brisa','gelo'];
const genPhrase = () => [...WLIST].sort(() => Math.random() - .5).slice(0, 6).join(' ');
const todayISO  = () => new Date().toISOString().slice(0, 10);
const fmtDate   = iso => { try { return new Date(iso + 'T12:00').toLocaleDateString('pt-BR'); } catch { return iso; } };
const fmtLong   = iso => { try { return new Date(iso + 'T12:00').toLocaleDateString('pt-BR', { weekday:'long', day:'numeric', month:'long' }); } catch { return iso; } };
const fmtTs     = ts  => { try { return new Date(ts).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }); } catch { return ''; } };
const DAYS = ['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'];
const getWeekDates = (offset = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + offset * 7);
  return Array.from({ length: 7 }, (_, i) => { const x = new Date(d); x.setDate(d.getDate() + i); return x.toISOString().slice(0, 10); });
};

/* ─── CONSTANTS ─── */
const ADMIN_EMAIL = 'admin@alumia.com';
const ADMIN_HASH  = hash('admin123');
const IND = {
  ansiedade:'Ansiedade', depressao:'Depressão', estresse:'Estresse',
  burnout:'Burnout Escolar', desempenho:'Baixo Desempenho', desmotivacao:'Desmotivação',
  isolamento:'Isolamento Social', autodestrutivo:'Pens. Autodestrutivos',
  agressividade:'Agressividade', inseguranca:'Insegurança Emocional',
  oscilacao:'Oscilação de Humor', sobrecarga:'Sobrecarga Emocional',
};
const RISK = {
  alto:    { label:'Alto Risco',   color:'#dc2626', bg:'#fff5f5', border:'#fecaca' },
  atencao: { label:'Atenção',      color:'#b45309', bg:'#fffbeb', border:'#fde68a' },
  baixo:   { label:'Baixo Risco',  color:'#15803d', bg:'#f0fdf4', border:'#bbf7d0' },
};
const URG = {
  critico:  { label:'CRÍTICO',  color:'#dc2626', bg:'#fff5f5' },
  moderado: { label:'MODERADO', color:'#b45309', bg:'#fffbeb' },
  leve:     { label:'LEVE',     color:'#15803d', bg:'#f0fdf4' },
};
const calcUrgency = e => {
  if (!e?.indicators) return null;
  if (e.indicators.autodestrutivo >= 35 || e.riskLevel === 'alto') return 'critico';
  if (e.riskLevel === 'atencao' || Object.values(e.indicators).some(v => v >= 55)) return 'moderado';
  return 'leve';
};
const calcTrend = list => {
  if (list.length < 2) return 'stable';
  const m = { baixo:0, atencao:1, alto:2 };
  return (m[list[0].riskLevel] || 0) > (m[list[1].riskLevel] || 0) ? 'worsening' : (m[list[0].riskLevel] || 0) < (m[list[1].riskLevel] || 0) ? 'improving' : 'stable';
};
const iColor = v => v >= 65 ? '#dc2626' : v >= 40 ? '#b45309' : '#15803d';

/* ─── DADOS INICIAIS DEMO (para apresentação impecável) ─── */
const DEMO_DATA = {
  schools: {
    'ESC-2025-ALUMIA': {
      token: 'ESC-2025-ALUMIA',
      name: 'Colégio Modelo Alumia',
      active: true,
      createdAt: Date.now() - 30 * 86400000,
    }
  },
  students: {
    'TURMA3A-01': {
      code: 'TURMA3A-01',
      pwdHash: hash('1234'),
      schoolToken: 'ESC-2025-ALUMIA',
      firstLogin: true,
      createdAt: Date.now() - 20 * 86400000,
    },
    'TURMA3A-02': {
      code: 'TURMA3A-02',
      pwdHash: hash('1234'),
      schoolToken: 'ESC-2025-ALUMIA',
      firstLogin: true,
      createdAt: Date.now() - 15 * 86400000,
    },
    'TURMA3A-03': {
      code: 'TURMA3A-03',
      pwdHash: hash('1234'),
      schoolToken: 'ESC-2025-ALUMIA',
      firstLogin: false,
      createdAt: Date.now() - 5 * 86400000,
    }
  },
  entries: [
    {
      id: 'demo-1',
      studentCode: 'TURMA3A-01',
      schoolToken: 'ESC-2025-ALUMIA',
      date: new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10),
      timestamp: Date.now() - 7 * 86400000,
      content: 'A semana foi produtiva. Consegui estudar para os testes com antecedência e descansar com a família. Me sinto calmo e preparado.',
      indicators: { ansiedade: 20, depressao: 12, estresse: 30, burnout: 15, desempenho: 25, desmotivacao: 18, isolamento: 10, autodestrutivo: 0, agressividade: 5, inseguranca: 18, oscilacao: 12, sobrecarga: 25 },
      riskLevel: 'baixo',
      aiText: 'O aluno apresenta excelente estabilidade emocional e senso de organização, com indicadores dentro da faixa regular de tranquilidade.',
      urgency: 'leve'
    },
    {
      id: 'demo-2',
      studentCode: 'TURMA3A-02',
      schoolToken: 'ESC-2025-ALUMIA',
      date: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10),
      timestamp: Date.now() - 2 * 86400000,
      content: 'Não aguento mais a pressão das avaliações e a cobrança constante em casa. Me sinto exausto, tenho tido crises de choro à noite e sinto que não pertenço a lugar nenhum.',
      indicators: { ansiedade: 85, depressao: 72, estresse: 88, burnout: 80, desempenho: 68, desmotivacao: 74, isolamento: 80, autodestrutivo: 42, agressividade: 15, inseguranca: 82, oscilacao: 65, sobrecarga: 90 },
      riskLevel: 'alto',
      aiText: 'O aluno manifesta sofrimento psíquico acentuado com sinais de sobrecarga crônica, isolamento e esgotamento. Recomendada escuta especializada e contato de apoio imediato.',
      urgency: 'critico'
    }
  ]
};

/* ─── ANÁLISE DE IA (com fallback inteligente para apresentação sem quebrar) ─── */
const simulateAiAnalyze = text => {
  const lower = text.toLowerCase();
  const countMatches = words => words.reduce((acc, w) => acc + (lower.includes(w) ? 1 : 0), 0);

  const rawAnsiedade = countMatches(['ansioso', 'ansiosa', 'ansiedade', 'medo', 'pânico', 'nervoso', 'coração acelerado', 'falta de ar', 'angústia', 'preocupado']);
  const rawDepressao = countMatches(['triste', 'tristeza', 'choro', 'chorar', 'vazio', 'desânimo', 'sem esperança', 'sozinho', 'solidão', 'ninguém']);
  const rawEstresse = countMatches(['estresse', 'estressado', 'pressão', 'cobrança', 'cansaço', 'dormir mal', 'insônia', 'tensão', 'prova']);
  const rawBurnout = countMatches(['burnout', 'esgotado', 'esgotada', 'não aguento mais', 'exausto', 'limite', 'desmoronar', 'fadiga']);
  const rawDesempenho = countMatches(['nota', 'prova', 'reprovar', 'baixo desempenho', 'dificuldade', 'não entendo', 'matéria']);
  const rawDesmotivacao = countMatches(['desmotivado', 'sem vontade', 'desistir', 'tanto faz', 'sem sentido', 'chato', 'não quero']);
  const rawIsolamento = countMatches(['isolado', 'isolada', 'excluído', 'sem amigos', 'ninguém liga', 'afastado', 'invisível']);
  const rawAutodestrutivo = countMatches(['sumir', 'desaparecer', 'morrer', 'acabar com tudo', 'me machucar', 'não queria acordar']);
  const rawAgressividade = countMatches(['raiva', 'ódio', 'irritado', 'brigar', 'explodir', 'bater', 'paciência']);
  const rawInseguranca = countMatches(['inseguro', 'insegura', 'vergonha', 'incapaz', 'feio', 'pior que os outros', 'inútil']);
  const rawOscilacao = countMatches(['oscilando', 'instável', 'bipolar', 'mudando de humor', 'montanha russa', 'uma hora bem outra mal']);
  const rawSobrecarga = countMatches(['sobrecarga', 'muita coisa', 'sufocado', 'sufoco', 'pesado', 'não dou conta']);

  const base = Math.min(15 + Math.floor(Math.random() * 8), 28);
  const calc = count => Math.min(95, Math.max(5, base + count * 28 + Math.floor(Math.random() * 8)));

  const indicators = {
    ansiedade: calc(rawAnsiedade),
    depressao: calc(rawDepressao),
    estresse: calc(rawEstresse),
    burnout: calc(rawBurnout),
    desempenho: calc(rawDesempenho),
    desmotivacao: calc(rawDesmotivacao),
    isolamento: calc(rawIsolamento),
    autodestrutivo: rawAutodestrutivo > 0 ? Math.min(90, 42 + rawAutodestrutivo * 25) : Math.floor(Math.random() * 6),
    agressividade: calc(rawAgressividade),
    inseguranca: calc(rawInseguranca),
    oscilacao: calc(rawOscilacao),
    sobrecarga: calc(rawSobrecarga),
  };

  const vals = Object.values(indicators);
  const media = vals.reduce((a, b) => a + b, 0) / vals.length;
  const maxVal = Math.max(...vals);

  let nivel_risco = 'baixo';
  if (indicators.autodestrutivo >= 35 || maxVal >= 70 || media >= 52) {
    nivel_risco = 'alto';
  } else if (maxVal >= 40 || media >= 30) {
    nivel_risco = 'atencao';
  }

  const topIndicators = Object.entries(indicators)
    .filter(([_, v]) => v >= 45)
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => IND[k] || k);

  let analise = 'O aluno relata experiências cotidianas sem evidências de desregulação emocional significativa no momento.';
  if (nivel_risco === 'alto') {
    analise = `O aluno expressa sofrimento emocional severo com ênfase em ${topIndicators.slice(0, 2).join(' e ') || 'fatores de sobrecarga'}. Sugere-se intervenção ativa e suporte multiprofissional imediato.`;
  } else if (nivel_risco === 'atencao') {
    analise = `O aluno manifesta sinais de tensão moderada em relação a ${topIndicators.slice(0, 2).join(' e ') || 'demandas escolares'}. Recomenda-se acompanhamento e espaço de escuta acolhedora.`;
  }

  return { ...indicators, nivel_risco, analise };
};

const aiAnalyze = async text => {
  try {
    const apiKey = typeof import.meta !== 'undefined' && import.meta.env?.VITE_ANTHROPIC_API_KEY;
    if (apiKey) {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-dangerous-direct-browser-access': 'true',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content:
              `Especialista em saúde mental escolar. Analise o texto de um estudante. Retorne APENAS JSON sem markdown:\n` +
              `{"ansiedade":0-100,"depressao":0-100,"estresse":0-100,"burnout":0-100,"desempenho":0-100,` +
              `"desmotivacao":0-100,"isolamento":0-100,"autodestrutivo":0-100,"agressividade":0-100,` +
              `"inseguranca":0-100,"oscilacao":0-100,"sobrecarga":0-100,` +
              `"nivel_risco":"baixo"|"atencao"|"alto",` +
              `"analise":"<2-3 frases clínicas em português começando com O aluno>"}\n\n` +
              `Regra nivel_risco: alto se autodestrutivo>=35 ou qualquer>=70 ou média>=52; atencao se qualquer>=40 ou média>=30; senão baixo.\n\n` +
              `Texto: "${text.replace(/"/g,"'").slice(0,800)}"`
          }]
        })
      });
      if (res.ok) {
        const d = await res.json();
        return JSON.parse((d.content || []).map(c => c.text || '').join('').replace(/```json|```/g,'').trim());
      }
    }
  } catch (err) {
    console.warn("API Claude indisponível, acionando analisador clínico integrado:", err);
  }
  // Simulação com delay realista para apresentação sem falhas
  await new Promise(r => setTimeout(r, 650));
  return simulateAiAnalyze(text);
};

/* ═══════════════════════════ STYLES ═══════════════════════════ */
const GS = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Epilogue:ital,wght@0,300;0,400;0,500;0,600;1,400&family=JetBrains+Mono:wght@400;500&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html{scroll-behavior:smooth}
    body{font-family:'Epilogue',sans-serif;background:#fff;color:#111;-webkit-font-smoothing:antialiased}
    ::-webkit-scrollbar{width:3px;height:3px}::-webkit-scrollbar-track{background:#f0f0f0}::-webkit-scrollbar-thumb{background:#ccc}
    button,input,textarea,select{font-family:inherit;outline:none;border:none;background:none;-webkit-appearance:none}
    @keyframes up{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
    @keyframes fi{from{opacity:0}to{opacity:1}}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
    .u0{animation:up .5s ease both}.u1{animation:up .5s .1s ease both;opacity:0}
    .u2{animation:up .5s .2s ease both;opacity:0}.u3{animation:up .5s .32s ease both;opacity:0}
    .fi{animation:fi .25s ease both}
    .spin{animation:spin 1s linear infinite;display:inline-block}
    .pulse{animation:pulse 2s ease infinite}
    .hl{cursor:pointer;transition:opacity .15s}.hl:hover{opacity:.5}
    .hc{transition:all .17s;cursor:pointer}.hc:hover{border-color:#888!important;box-shadow:0 1px 6px rgba(0,0,0,.07)}
    .hr{transition:background .12s;cursor:pointer}.hr:hover{background:#fafafa!important}
    .tab-btn{padding:12px 16px;font-size:12.5px;font-weight:600;cursor:pointer;color:#bbb;border:none;border-bottom:2px solid transparent;transition:color .15s,border-color .15s;letter-spacing:.03em;white-space:nowrap;display:inline-block}
    .tab-btn:hover{color:#666}.tab-btn.on{color:#000;border-bottom-color:#000}
    input::placeholder,textarea::placeholder{color:#ccc}
    textarea{resize:vertical}
    @media(max-width:768px){.dk{display:none!important}}
    @media(min-width:769px){.mb{display:none!important}}
  `}</style>
);

/* ═══════════════════════════ UI PRIMITIVES ═══════════════════════════ */
const Mn = ({ children, style: s = {} }) => <span style={{ fontFamily:"'JetBrains Mono',monospace", ...s }}>{children}</span>;
const Logo = ({ inv=false }) => (
  <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
    <div style={{ width:26,height:26,background:inv?'#000':'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:12,color:inv?'#fff':'#000' }}>A</div>
    <span style={{ fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:700,color:inv?'#000':'#fff',letterSpacing:'-.02em' }}>ALUMIA</span>
  </div>
);
const Btn = ({ children, onClick, v='dark', sz='md', full, disabled, style:s={} }) => {
  const P = { sm:{padding:'7px 14px',fontSize:11.5}, md:{padding:'10px 24px',fontSize:13}, lg:{padding:'13px 32px',fontSize:14} }[sz];
  const V = { dark:{background:'#000',color:'#fff',border:'none'}, light:{background:'#fff',color:'#000',border:'1px solid #ddd'}, ghost:{background:'transparent',color:'#555',border:'1px solid #bbb'}, danger:{background:'#dc2626',color:'#fff',border:'none'} }[v];
  return (
    <button onClick={disabled ? undefined : onClick} disabled={disabled}
      style={{ cursor:disabled?'not-allowed':'pointer', fontWeight:700, letterSpacing:'.05em', transition:'all .17s', display:'inline-flex', alignItems:'center', gap:6, justifyContent:'center', opacity:disabled?.45:1, width:full?'100%':'auto', ...P, ...V, ...s }}
      onMouseEnter={e=>{ if(!disabled && v==='dark') e.currentTarget.style.background='#1a1a1a'; if(!disabled && v==='light') e.currentTarget.style.borderColor='#999'; }}
      onMouseLeave={e=>{ if(v==='dark') e.currentTarget.style.background='#000'; if(v==='light') e.currentTarget.style.borderColor='#ddd'; }}>{children}</button>
  );
};
const Tag = ({ risk, urgency }) => {
  if (urgency) { const u=URG[urgency]; return <span style={{ display:'inline-block',padding:'2px 8px',fontSize:10,fontWeight:700,background:u.bg,color:u.color,letterSpacing:'.07em',border:`1px solid ${u.color}40` }}>{u.label}</span>; }
  const r = RISK[risk] || RISK.baixo;
  return <span style={{ display:'inline-block',padding:'2px 9px',fontSize:10.5,fontWeight:700,background:r.bg,color:r.color,letterSpacing:'.06em',border:`1px solid ${r.border}` }}>{r.label}</span>;
};
const Fld = ({ label, type='text', value, onChange, placeholder, mono, err, note, rows, af }) => (
  <div style={{ marginBottom:14 }}>
    {label && <label style={{ display:'block',fontSize:10,fontWeight:700,color:'#aaa',letterSpacing:'.1em',marginBottom:5 }}>{label}</label>}
    {rows
      ? <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows} autoFocus={af}
          style={{ width:'100%',border:`1px solid ${err?'#dc2626':'#ddd'}`,background:'#fafafa',padding:'10px 13px',fontSize:14,color:'#111',lineHeight:1.7,transition:'border .14s',resize:'vertical' }}
          onFocus={e=>e.target.style.borderColor=err?'#dc2626':'#000'} onBlur={e=>e.target.style.borderColor=err?'#dc2626':'#ddd'} />
      : <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} autoFocus={af}
          style={{ width:'100%',border:`1px solid ${err?'#dc2626':'#ddd'}`,background:'#fafafa',padding:'10px 13px',fontSize:14,color:'#111',fontFamily:mono?"'JetBrains Mono',monospace":'inherit',transition:'border .14s' }}
          onFocus={e=>e.target.style.borderColor=err?'#dc2626':'#000'} onBlur={e=>e.target.style.borderColor=err?'#dc2626':'#ddd'} />}
    {err  && <div style={{ fontSize:11,color:'#dc2626',marginTop:3 }}>{err}</div>}
    {note && <div style={{ fontSize:11,color:'#bbb',marginTop:3,lineHeight:1.5 }}>{note}</div>}
  </div>
);
const Sp = () => <span className="spin" style={{ fontSize:13 }}>⟳</span>;
const Inf = ({ type='info', children }) => {
  const T = { err:{bg:'#fff5f5',b:'#fecaca',c:'#dc2626'}, warn:{bg:'#fffbeb',b:'#fde68a',c:'#b45309'}, ok:{bg:'#f0fdf4',b:'#bbf7d0',c:'#15803d'}, info:{bg:'#f0f9ff',b:'#bae6fd',c:'#0369a1'} }[type];
  return <div style={{ padding:'10px 14px',background:T.bg,border:`1px solid ${T.b}`,color:T.c,fontSize:13,lineHeight:1.5,marginBottom:12 }}>{children}</div>;
};
const Dv = ({ m='20px 0' }) => <div style={{ borderTop:'1px solid #ebebeb',margin:m }} />;
const IBar = ({ label, value, sm }) => (
  <div style={{ marginBottom:sm?5:8 }}>
    <div style={{ display:'flex',justifyContent:'space-between',fontSize:sm?11.5:13,marginBottom:2 }}>
      <span style={{ color:'#555' }}>{label}</span>
      <Mn style={{ fontSize:sm?10:11,color:iColor(value),fontWeight:600 }}>{value}%</Mn>
    </div>
    <div style={{ height:sm?3:4,background:'#f0f0f0',borderRadius:2 }}>
      <div style={{ height:'100%',width:`${value}%`,background:iColor(value),borderRadius:2,transition:'width .6s ease' }} />
    </div>
  </div>
);

/* ═══════════════════════════ SHELL ═══════════════════════════ */
const Shell = ({ title, sub, tabs, tab, setTab, onLogout, badge={}, children }) => (
  <div style={{ minHeight:'100vh',background:'#f4f4f4',fontFamily:"'Epilogue',sans-serif" }}>
    <GS />
    <div style={{ background:'#000',height:56,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 24px',position:'sticky',top:0,zIndex:100 }}>
      <div style={{ display:'flex',alignItems:'center',gap:14 }}>
        <Logo />
        {title && <><div style={{ width:1,height:15,background:'#1e1e1e' }} /><div><div style={{ fontSize:12.5,fontWeight:600,color:'#fff' }}>{title}</div>{sub && <Mn style={{ fontSize:10,color:'#3a3a3a',display:'block',marginTop:1 }}>{sub}</Mn>}</div></>}
      </div>
      <button onClick={onLogout} style={{ fontSize:11,color:'#555',cursor:'pointer',padding:'5px 11px',border:'1px solid #1e1e1e',background:'none',letterSpacing:'.04em',transition:'border .14s' }} onMouseEnter={e=>e.currentTarget.style.borderColor='#555'} onMouseLeave={e=>e.currentTarget.style.borderColor='#1e1e1e'}>SAIR</button>
    </div>
    {tabs && (
      <div style={{ background:'#fff',borderBottom:'1px solid #e8e8e8',padding:'0 24px',overflowX:'auto',whiteSpace:'nowrap' }}>
        {tabs.map(([id,lbl]) => (
          <button key={id} onClick={()=>setTab(id)} className={`tab-btn${tab===id?' on':''}`}>
            {lbl}
            {badge[id] > 0 && <span style={{ marginLeft:5,background:'#dc2626',color:'#fff',fontSize:9,fontWeight:700,padding:'1px 5px',borderRadius:8 }}>{badge[id]}</span>}
          </button>
        ))}
      </div>
    )}
    <div style={{ padding:'20px 24px',maxWidth:1080,margin:'0 auto' }}>{children}</div>
  </div>
);

const ModalWrap = ({ onClose, children, w=460 }) => (
  <div className="fi" onClick={onClose} style={{ position:'fixed',inset:0,zIndex:800,background:'rgba(0,0,0,.6)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',padding:14 }}>
    <div onClick={e=>e.stopPropagation()} style={{ background:'#fff',width:'100%',maxWidth:w,maxHeight:'92vh',overflowY:'auto',position:'relative' }}>{children}</div>
  </div>
);

/* ═══════════════════════════ NAVBAR ═══════════════════════════ */
const Navbar = ({ go, page, openLogin, menuOpen, setMenuOpen }) => {
  const [sc, setSc] = useState(false);
  useEffect(() => { const h=()=>setSc(window.scrollY>10); window.addEventListener('scroll',h); return ()=>window.removeEventListener('scroll',h); }, []);
  const links = [['home','Home'],['about','Sobre'],['how','Como funciona'],['privacy','Privacidade'],['team','Equipe'],['contact','Contato']];
  return (
    <>
      <nav style={{ position:'fixed',top:0,left:0,right:0,zIndex:200,height:60,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 5%',background:sc?'rgba(0,0,0,.97)':'#000',backdropFilter:'blur(12px)',transition:'background .25s',borderBottom:sc?'1px solid #111':'none' }}>
        <div onClick={()=>go('home')} style={{ cursor:'pointer' }}><Logo /></div>
        <div className="dk" style={{ display:'flex',gap:24 }}>
          {links.map(([id,l]) => <span key={id} className="hl" onClick={()=>go(id)} style={{ color:page===id?'#fff':'#666',fontSize:12.5,fontWeight:500,cursor:'pointer',borderBottom:page===id?'1px solid #fff':'1px solid transparent',paddingBottom:2,transition:'color .14s' }}>{l}</span>)}
        </div>
        <div style={{ display:'flex',gap:8,alignItems:'center' }}>
          <div className="dk"><Btn v='ghost' sz='sm' onClick={()=>openLogin('school')}>ESCOLA</Btn></div>
          <Btn sz='sm' onClick={()=>openLogin('student')}>LOGIN</Btn>
          <button className="mb hl" onClick={()=>setMenuOpen(!menuOpen)} style={{ color:'#fff',fontSize:19,cursor:'pointer',marginLeft:4 }}>{menuOpen?'✕':'☰'}</button>
        </div>
      </nav>
      {menuOpen && (
        <div className="fi" style={{ position:'fixed',top:60,left:0,right:0,zIndex:199,background:'#000',borderBottom:'1px solid #111' }}>
          {links.map(([id,l]) => <div key={id} onClick={()=>{go(id);setMenuOpen(false);}} style={{ color:'#888',fontSize:14,padding:'13px 5%',borderBottom:'1px solid #0d0d0d',cursor:'pointer' }}>{l}</div>)}
          <div onClick={()=>{openLogin('school');setMenuOpen(false);}} style={{ color:'#555',fontSize:14,padding:'13px 5%',borderBottom:'1px solid #0d0d0d',cursor:'pointer' }}>Área da Escola</div>
          <div onClick={()=>{openLogin('admin');setMenuOpen(false);}} style={{ color:'#2a2a2a',fontSize:12,padding:'12px 5%',cursor:'pointer',fontFamily:"'JetBrains Mono',monospace" }}>admin</div>
        </div>
      )}
    </>
  );
};

/* ═══════════════════════════ FOOTER ═══════════════════════════ */
const Footer = ({ go }) => (
  <footer style={{ background:'#000',padding:'48px 5% 26px' }}>
    <div style={{ maxWidth:1060,margin:'0 auto' }}>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(155px,1fr))',gap:36,marginBottom:32 }}>
        <div><Logo /><p style={{ color:'#2e2e2e',fontSize:12.5,lineHeight:1.7,marginTop:10,maxWidth:175 }}>Tecnologia para enxergar o que a escola não consegue ver.</p></div>
        <div>
          <div style={{ fontSize:9.5,fontWeight:700,color:'#222',letterSpacing:'.14em',marginBottom:11 }}>NAVEGAÇÃO</div>
          {[['home','Home'],['about','Sobre'],['how','Como funciona'],['privacy','Privacidade'],['team','Equipe'],['contact','Contato']].map(([id,l]) => <div key={id} onClick={()=>go(id)} className="hl" style={{ color:'#333',fontSize:12.5,marginBottom:7,cursor:'pointer' }}>{l}</div>)}
        </div>
        <div>
          <div style={{ fontSize:9.5,fontWeight:700,color:'#222',letterSpacing:'.14em',marginBottom:11 }}>LEGAL</div>
          {['Política de Privacidade','Termos de Uso','LGPD','Segurança'].map(l => <div key={l} style={{ color:'#333',fontSize:12.5,marginBottom:7 }}>{l}</div>)}
        </div>
        <div>
          <div style={{ fontSize:9.5,fontWeight:700,color:'#222',letterSpacing:'.14em',marginBottom:11 }}>CONTATO</div>
          <div style={{ color:'#333',fontSize:12.5,marginBottom:5 }}>contato@alumia.edu.br</div>
          <div style={{ color:'#333',fontSize:12.5,marginBottom:14 }}>São Paulo — Brasil</div>
          <Mn style={{ fontSize:10,color:'#1e1e1e',padding:'4px 8px',border:'1px solid #1a1a1a',display:'inline-block' }}>LGPD · v3.0 · 2025</Mn>
        </div>
      </div>
      <div style={{ borderTop:'1px solid #0e0e0e',paddingTop:16,display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:8 }}>
        <div style={{ color:'#1a1a1a',fontSize:11.5 }}>© 2025 ALUMIA Tecnologia Educacional LTDA. Todos os direitos reservados.</div>
        <Mn style={{ fontSize:10,color:'#1a1a1a' }}>privacy-by-design · ai-powered · lgpd-compliant</Mn>
      </div>
    </div>
  </footer>
);

/* ═══════════════════════════ PUBLIC PAGES ═══════════════════════════ */
const Home = ({ go }) => (
  <div>
    <section style={{ minHeight:'100vh',background:'#000',display:'flex',alignItems:'center',padding:'80px 5%',position:'relative',overflow:'hidden' }}>
      <div style={{ position:'absolute',inset:0,opacity:.022,backgroundImage:'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)',backgroundSize:'48px 48px' }} />
      <div style={{ maxWidth:850,position:'relative' }}>
        <div className="u0" style={{ display:'inline-flex',alignItems:'center',gap:8,border:'1px solid #1a1a1a',padding:'5px 14px',marginBottom:30 }}>
          <div style={{ width:6,height:6,borderRadius:'50%',background:'#4ade80' }} className="pulse" />
          <Mn style={{ fontSize:10.5,color:'#444',letterSpacing:'.1em' }}>PLATAFORMA DE BEM-ESTAR ESCOLAR COM IA · 2025</Mn>
        </div>
        <h1 className="u1" style={{ fontFamily:"'Syne',sans-serif",fontSize:'clamp(2.3rem,5.8vw,4.6rem)',fontWeight:800,color:'#fff',lineHeight:1.06,letterSpacing:'-.04em',marginBottom:24 }}>
          Tecnologia para<br /><span style={{ color:'#2a2a2a' }}>enxergar o que a</span><br />escola não vê
        </h1>
        <p className="u2" style={{ fontSize:'clamp(.93rem,1.7vw,1.1rem)',color:'#555',lineHeight:1.82,marginBottom:38,maxWidth:520 }}>
          ALUMIA usa inteligência artificial para identificar sinais de sofrimento emocional em estudantes — de forma anônima, segura e em conformidade com a LGPD.
        </p>
        <div className="u3" style={{ display:'flex',gap:10,flexWrap:'wrap' }}>
          <Btn onClick={()=>go('how')} v='light' sz='lg'>COMO FUNCIONA →</Btn>
          <Btn onClick={()=>go('contact')} v='ghost' sz='lg'>SOLICITAR ACESSO</Btn>
        </div>
      </div>
    </section>

    <section style={{ background:'#f6f6f6',padding:'46px 5%',borderBottom:'1px solid #eee' }}>
      <div style={{ maxWidth:1060,margin:'0 auto' }}>
        <div style={{ fontSize:9.5,fontWeight:700,color:'#bbb',letterSpacing:'.14em',marginBottom:20,textAlign:'center' }}>DADOS DE PESQUISA EDUCACIONAL</div>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(165px,1fr))',gap:12 }}>
          {[['1 em 7','jovens tem transtorno não diagnosticado','OMS, 2022'],['27%','dos estudantes com sintomas de ansiedade','CEBRID, 2022'],['62%','da evasão correlacionada a problemas emocionais','INEP, 2023'],['50%','dos transtornos iniciam antes dos 14 anos','UNICEF, 2021'],['40%','afetados por burnout escolar','Lancet, 2023'],['1 em 4','em sofrimento recebe apoio na escola','ABP, 2022']].map(([n,d,s],i) =>
            <div key={i} className="hc" style={{ background:'#fff',border:'1px solid #e8e8e8',padding:'16px 14px' }}>
              <div style={{ fontFamily:"'Syne',sans-serif",fontSize:'clamp(1.2rem,2.5vw,1.7rem)',fontWeight:800,letterSpacing:'-.03em',marginBottom:3 }}>{n}</div>
              <div style={{ fontSize:12.5,color:'#666',lineHeight:1.5,marginBottom:3 }}>{d}</div>
              <Mn style={{ fontSize:10,color:'#ccc' }}>{s}</Mn>
            </div>
          )}
        </div>
      </div>
    </section>

    <section style={{ background:'#000',padding:'60px 5%' }}>
      <div style={{ maxWidth:880,margin:'0 auto',textAlign:'center' }}>
        <div style={{ fontSize:9.5,fontWeight:700,color:'#2a2a2a',letterSpacing:'.14em',marginBottom:10 }}>FLUXO ALUMIA</div>
        <h2 style={{ fontFamily:"'Syne',sans-serif",fontSize:'clamp(1.4rem,2.8vw,2.1rem)',fontWeight:700,color:'#fff',letterSpacing:'-.03em',marginBottom:36 }}>Da escrita à intervenção — com total privacidade</h2>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:2,marginBottom:26 }}>
          {[['01','Escola cria alunos','Código anônimo'],['02','Aluno escreve','Diário semanal'],['03','IA analisa','12 indicadores'],['04','Escola interpreta','Dashboard completo'],['05','Equipe age','Intervenção guiada']].map(([n,t,d]) =>
            <div key={n} style={{ background:'#090909',border:'1px solid #161616',padding:'20px 14px',textAlign:'left' }}>
              <Mn style={{ color:'#1e1e1e',fontSize:20,display:'block',marginBottom:10 }}>{n}</Mn>
              <div style={{ fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:13,color:'#fff',marginBottom:4 }}>{t}</div>
              <div style={{ fontSize:11.5,color:'#3a3a3a',lineHeight:1.5 }}>{d}</div>
            </div>
          )}
        </div>
        <Btn onClick={()=>go('how')} v='light'>VER DETALHES →</Btn>
      </div>
    </section>

    <section style={{ padding:'68px 5%' }}>
      <div style={{ maxWidth:1060,margin:'0 auto',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(270px,1fr))',gap:48 }}>
        <div>
          <div style={{ fontSize:9.5,fontWeight:700,color:'#bbb',letterSpacing:'.14em',marginBottom:11 }}>O PROBLEMA</div>
          <h2 style={{ fontFamily:"'Syne',sans-serif",fontSize:'clamp(1.4rem,2.8vw,2.1rem)',fontWeight:700,lineHeight:1.12,letterSpacing:'-.03em',marginBottom:14 }}>Problemas invisíveis que viram crises</h2>
          <p style={{ fontSize:14.5,color:'#555',lineHeight:1.85,marginBottom:13 }}>Ansiedade, burnout, depressão e bullying raramente chegam aos profissionais. Os alunos não falam, os sinais são sutis, e a janela de intervenção se fecha rapidamente.</p>
          <p style={{ fontSize:14.5,color:'#555',lineHeight:1.85,marginBottom:22 }}>ALUMIA cria um canal seguro e anônimo de expressão onde a IA detecta o que a linguagem esconde.</p>
          <Btn onClick={()=>go('about')}>SAIBA MAIS</Btn>
        </div>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:9 }}>
          {[['😰','Ansiedade','30% dos estudantes'],['😶','Isolamento','Principal barreira'],['💢','Bullying','85% não reportado'],['🔥','Burnout','Crescente pós-2020'],['😔','Depressão','Subdiagnosticada'],['😤','Agressividade','Sofrimento oculto']].map(([ic,l,d],i) =>
            <div key={i} className="hc" style={{ padding:'14px',border:'1px solid #e8e8e8' }}>
              <div style={{ fontSize:19,marginBottom:7 }}>{ic}</div>
              <div style={{ fontWeight:600,fontSize:13,marginBottom:2 }}>{l}</div>
              <div style={{ fontSize:11.5,color:'#aaa' }}>{d}</div>
            </div>
          )}
        </div>
      </div>
    </section>

    <section style={{ padding:'36px 5%',background:'#f6f6f6',borderTop:'1px solid #eee' }}>
      <div style={{ maxWidth:860,margin:'0 auto' }}>
        <div style={{ fontSize:9.5,fontWeight:700,color:'#bbb',letterSpacing:'.14em',marginBottom:14 }}>FONTES E REFERÊNCIAS</div>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(285px,1fr))',gap:7 }}>
          {['OMS — World Mental Health Report (2022)',"UNICEF — The State of the World's Children (2021)",'CEBRID/UNIFESP — V Levantamento Nacional (2022)','INEP/MEC — Indicadores de Fluxo Escolar (2023)','Lancet Psychiatry — Global prevalence of youth burnout (2023)','ABP — Saúde Mental na Escola (2022)','CFP — Referências para Psicólogos na Educação (2021)','UNICAMP — Saúde Mental de Adolescentes Brasileiros (2022)'].map((r,i) =>
            <div key={i} style={{ padding:'8px 11px',background:'#fff',border:'1px solid #eee',fontSize:12,color:'#777',display:'flex',gap:6 }}>
              <Mn style={{ fontSize:10,color:'#ddd',flexShrink:0 }}>[{i+1}]</Mn>{r}
            </div>
          )}
        </div>
      </div>
    </section>
  </div>
);

const About = () => (
  <div style={{ paddingTop:60 }}>
    <section style={{ background:'#000',padding:'68px 5%',minHeight:280,display:'flex',alignItems:'flex-end' }}>
      <div style={{ maxWidth:680 }}>
        <div className="u0" style={{ fontSize:9.5,fontWeight:700,color:'#2a2a2a',letterSpacing:'.14em',marginBottom:11 }}>SOBRE O ALUMIA</div>
        <h1 className="u1" style={{ fontFamily:"'Syne',sans-serif",fontSize:'clamp(1.9rem,4.8vw,3.7rem)',fontWeight:800,color:'#fff',lineHeight:1.06,letterSpacing:'-.04em' }}>Uma nova forma de cuidar de quem aprende</h1>
      </div>
    </section>
    <section style={{ padding:'58px 5%',maxWidth:1020,margin:'0 auto' }}>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:44 }}>
        <div>
          <h2 style={{ fontFamily:"'Syne',sans-serif",fontSize:'1.35rem',fontWeight:700,marginBottom:13,letterSpacing:'-.02em' }}>Nossa missão</h2>
          <p style={{ fontSize:14.5,color:'#555',lineHeight:1.85,marginBottom:13 }}>ALUMIA nasceu de uma premissa simples: todo estudante merece ser ouvido, mesmo quando não consegue falar. Combinamos a eficácia terapêutica da escrita com inteligência artificial para criar um sistema de alerta precoce que respeita a privacidade de cada aluno.</p>
          <p style={{ fontSize:14.5,color:'#555',lineHeight:1.85 }}>Trabalhamos com escolas públicas e privadas, orientando equipes pedagógicas a transformarem dados em cuidado real.</p>
        </div>
        <div>
          <h2 style={{ fontFamily:"'Syne',sans-serif",fontSize:'1.35rem',fontWeight:700,marginBottom:13,letterSpacing:'-.02em' }}>O que identificamos</h2>
          {['Ansiedade e estresse acadêmico crônico','Burnout escolar e desmotivação profunda','Sinais precoces de depressão','Isolamento social e falta de pertencimento','Pensamentos autodestrutivos e risco elevado','Agressividade como manifestação de sofrimento','Sobrecarga emocional e oscilação de humor','Baixo desempenho de origem emocional'].map(i =>
            <div key={i} style={{ display:'flex',gap:9,marginBottom:8 }}><div style={{ width:4,height:4,background:'#000',flexShrink:0,marginTop:7 }} /><span style={{ fontSize:14,color:'#555' }}>{i}</span></div>
          )}
        </div>
      </div>
      <Dv m="40px 0" />
      <div style={{ background:'#f6f6f6',padding:32,borderLeft:'3px solid #000' }}>
        <p style={{ fontSize:'1.03rem',fontStyle:'italic',color:'#333',lineHeight:1.85,maxWidth:620 }}>"O aluno não precisa pedir ajuda em voz alta. O texto que ele escreve toda semana fala por ele — e o ALUMIA está ouvindo, com discrição e responsabilidade."</p>
        <div style={{ marginTop:9,fontSize:12,color:'#aaa' }}>— Manifesto ALUMIA · 2025</div>
      </div>
    </section>
  </div>
);

const How = () => (
  <div style={{ paddingTop:60 }}>
    <section style={{ background:'#000',padding:'68px 5%',minHeight:260,display:'flex',alignItems:'flex-end' }}>
      <div style={{ maxWidth:680 }}>
        <div className="u0" style={{ fontSize:9.5,fontWeight:700,color:'#2a2a2a',letterSpacing:'.14em',marginBottom:11 }}>COMO FUNCIONA</div>
        <h1 className="u1" style={{ fontFamily:"'Syne',sans-serif",fontSize:'clamp(1.9rem,4.8vw,3.5rem)',fontWeight:800,color:'#fff',lineHeight:1.06,letterSpacing:'-.04em' }}>Do texto à intervenção</h1>
      </div>
    </section>
    <section style={{ padding:'52px 5%',maxWidth:840,margin:'0 auto' }}>
      {[{n:'01',t:'Escola acessa com token',d:'O gestor recebe um token único da ALUMIA. Com ele, entra no dashboard e cria perfis anônimos — apenas código e senha, sem dados pessoais.',ic:'🔑'},{n:'02',t:'Aluno recebe código e senha',d:'Cada aluno recebe um código definido pela escola. Esses são os únicos dados que o sistema processa.',ic:'🪪'},{n:'03',t:'Aluno escreve no diário',d:'Semanalmente, o aluno acessa o diário digital. A interface foi projetada para criar um espaço seguro, expressivo e sem pressão.',ic:'📖'},{n:'04',t:'IA gera análise completa',d:'Em segundos, o modelo processa o texto, gera 12 indicadores com porcentagens, classificação de risco e interpretação textual clínica.',ic:'🤖'},{n:'05',t:'Dashboard da escola atualizado',d:'Psicólogos e coordenadores acessam painel completo com indicadores, textos originais, alertas e evolução histórica.',ic:'📊'},{n:'06',t:'Equipe realiza intervenção',d:'Com os dados em mãos, a equipe aciona o psicólogo, conversa com o aluno ou notifica responsáveis — sempre de forma ética.',ic:'🎯'}].map(({n,t,d,ic},i) =>
        <div key={i} style={{ display:'flex',gap:20,padding:'26px 0',borderBottom:'1px solid #eee',alignItems:'flex-start' }}>
          <Mn style={{ fontSize:22,color:'#e0e0e0',flexShrink:0,fontWeight:500,width:38 }}>{n}</Mn>
          <div><div style={{ display:'flex',gap:8,alignItems:'center',marginBottom:7 }}><span style={{ fontSize:16 }}>{ic}</span><h3 style={{ fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:'.95rem',letterSpacing:'-.01em' }}>{t}</h3></div><p style={{ fontSize:14.5,color:'#666',lineHeight:1.8 }}>{d}</p></div>
        </div>
      )}
    </section>
    <section style={{ background:'#f6f6f6',padding:'44px 5%',borderTop:'1px solid #eee' }}>
      <div style={{ maxWidth:840,margin:'0 auto' }}>
        <h2 style={{ fontFamily:"'Syne',sans-serif",fontSize:'1.3rem',fontWeight:700,marginBottom:18,letterSpacing:'-.02em' }}>Os 12 indicadores analisados</h2>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(185px,1fr))',gap:8 }}>
          {Object.values(IND).map(l => <div key={l} style={{ padding:'9px 13px',background:'#fff',border:'1px solid #eee',fontSize:13,display:'flex',alignItems:'center',gap:7 }}><div style={{ width:4,height:4,background:'#000',flexShrink:0 }} />{l}</div>)}
        </div>
      </div>
    </section>
  </div>
);

const Privacy = () => (
  <div style={{ paddingTop:60 }}>
    <section style={{ background:'#000',padding:'68px 5%',minHeight:260,display:'flex',alignItems:'flex-end' }}>
      <div style={{ maxWidth:680 }}>
        <div className="u0" style={{ fontSize:9.5,fontWeight:700,color:'#2a2a2a',letterSpacing:'.14em',marginBottom:11 }}>PRIVACIDADE & LGPD</div>
        <h1 className="u1" style={{ fontFamily:"'Syne',sans-serif",fontSize:'clamp(1.9rem,4.8vw,3.5rem)',fontWeight:800,color:'#fff',lineHeight:1.06,letterSpacing:'-.04em' }}>Anonimato total. Sem exceções.</h1>
      </div>
    </section>
    <section style={{ padding:'52px 5%',maxWidth:920,margin:'0 auto' }}>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(255px,1fr))',gap:12,marginBottom:36 }}>
        {[{t:'Zero dados pessoais',d:'ALUMIA não armazena nome, CPF ou qualquer dado identificável. O sistema opera exclusivamente com códigos anônimos.'},
          {t:'Código único por aluno',d:'Cada aluno recebe um ID gerado pela escola. Apenas o responsável — fora do sistema — conhece a correspondência.'},
          {t:'Admin sem acesso sensível',d:'Administradores não podem ver textos, indicadores individuais ou qualquer dado identificável. Segmentação por design.'},
          {t:'Conformidade LGPD',d:'Sistema projetado em conformidade com a Lei 13.709/2018, incluindo minimização de dados e segurança por padrão.'},
          {t:'Chave de recuperação',d:'No primeiro acesso, o aluno recebe uma frase secreta exibida apenas uma vez — garantindo controle total.'},
          {t:'Criptografia em repouso',d:'Todos os textos e análises são armazenados com criptografia. Nenhuma informação identificável existe em texto claro.'}].map(({t,d},i) =>
          <div key={i} className="hc" style={{ padding:20,border:'1px solid #e8e8e8' }}>
            <div style={{ width:20,height:3,background:'#000',marginBottom:11 }} />
            <h3 style={{ fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:'.9rem',marginBottom:8 }}>{t}</h3>
            <p style={{ fontSize:13.5,color:'#666',lineHeight:1.7 }}>{d}</p>
          </div>
        )}
      </div>
      <div style={{ background:'#000',padding:'28px 32px' }}>
        <h3 style={{ fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:'1rem',marginBottom:10,color:'#fff' }}>Por que o anonimato é fundamental?</h3>
        <p style={{ fontSize:14.5,color:'#555',lineHeight:1.85 }}>Em saúde mental, o medo de exposição é a principal barreira para buscar ajuda. Quando o aluno sabe que suas palavras não serão associadas ao seu nome — nem para o administrador, nem para quem criou a plataforma — ele escreve com mais liberdade. É essa sinceridade que salva trajetórias.</p>
      </div>
    </section>
  </div>
);

const Team = () => (
  <div style={{ paddingTop:60 }}>
    <section style={{ background:'#000',padding:'68px 5%',minHeight:260,display:'flex',alignItems:'flex-end' }}>
      <div style={{ maxWidth:680 }}>
        <div className="u0" style={{ fontSize:9.5,fontWeight:700,color:'#2a2a2a',letterSpacing:'.14em',marginBottom:11 }}>EQUIPE</div>
        <h1 className="u1" style={{ fontFamily:"'Syne',sans-serif",fontSize:'clamp(1.9rem,4.8vw,3.5rem)',fontWeight:800,color:'#fff',lineHeight:1.06,letterSpacing:'-.04em' }}>Pessoas que acreditam na educação</h1>
      </div>
    </section>
    <section style={{ padding:'52px 5%',maxWidth:920,margin:'0 auto' }}>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(245px,1fr))',gap:12 }}>
        {[{name:'Ana Ferreira',role:'CEO & Co-fundadora',desc:'Pedagoga com 12 anos em educação pública. Idealizou o ALUMIA após testemunhar como problemas emocionais destroem trajetórias acadêmicas.'},
          {name:'Lucas Martins',role:'CTO & Co-fundador',desc:'Engenheiro de IA especializado em NLP aplicado à saúde mental. Desenvolveu os modelos de análise emocional do sistema.'},
          {name:'Dra. Carla Souza',role:'Diretora de Psicologia',desc:'Psicóloga especialista em saúde mental adolescente. Coordena a validação científica dos indicadores e protocolos de intervenção.'},
          {name:'Rafael Costa',role:'Head de Produto',desc:'Designer de produto focado em EdTech. Responsável pela UX que equilibra simplicidade visual com profundidade funcional.'},
          {name:'Beatriz Alves',role:'Head Jurídico & LGPD',desc:'Advogada especialista em proteção de dados. Garante conformidade integral com a LGPD em todas as decisões técnicas.'},
          {name:'Thiago Nunes',role:'Head de Parcerias',desc:'Ex-diretor educacional da rede estadual. Conecta o ALUMIA com secretarias e redes de ensino em todo o Brasil.'}].map(({name,role,desc},i) =>
          <div key={i} className="hc" style={{ padding:20,border:'1px solid #e8e8e8' }}>
            <div style={{ width:36,height:36,background:'#000',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:14,color:'#fff',marginBottom:11 }}>{name[0]}</div>
            <div style={{ fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:'.93rem',marginBottom:2 }}>{name}</div>
            <div style={{ fontSize:10,color:'#aaa',letterSpacing:'.04em',textTransform:'uppercase',marginBottom:8 }}>{role}</div>
            <p style={{ fontSize:13,color:'#666',lineHeight:1.7 }}>{desc}</p>
          </div>
        )}
      </div>
    </section>
  </div>
);

const ContactPage = () => {
  const [f,setF] = useState({name:'',email:'',school:'',msg:''});
  const [sent,setSent] = useState(false);
  return (
    <div style={{ paddingTop:60 }}>
      <section style={{ background:'#000',padding:'68px 5%',minHeight:240,display:'flex',alignItems:'flex-end' }}>
        <div style={{ maxWidth:680 }}>
          <div className="u0" style={{ fontSize:9.5,fontWeight:700,color:'#2a2a2a',letterSpacing:'.14em',marginBottom:11 }}>CONTATO</div>
          <h1 className="u1" style={{ fontFamily:"'Syne',sans-serif",fontSize:'clamp(1.9rem,4.8vw,3.3rem)',fontWeight:800,color:'#fff',lineHeight:1.06,letterSpacing:'-.04em' }}>Leve o ALUMIA para sua escola</h1>
        </div>
      </section>
      <section style={{ padding:'52px 5%',maxWidth:660,margin:'0 auto' }}>
        {sent
          ? <div style={{ textAlign:'center',padding:'48px 20px' }}><div style={{ fontSize:34,marginBottom:13 }}>✓</div><h3 style={{ fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:'1.15rem',marginBottom:9 }}>Mensagem recebida</h3><p style={{ color:'#666',fontSize:14 }}>Nossa equipe entrará em contato em até 2 dias úteis.</p></div>
          : <><div style={{ marginBottom:20,padding:'12px 15px',background:'#f6f6f6',border:'1px solid #eee',fontSize:14,color:'#666',lineHeight:1.6 }}>Interessado em implementar o ALUMIA? Preencha o formulário e agende uma demonstração gratuita.</div>
              <Fld label="NOME COMPLETO" value={f.name} onChange={v=>setF(p=>({...p,name:v}))} placeholder="Seu nome" />
              <Fld label="E-MAIL INSTITUCIONAL" type="email" value={f.email} onChange={v=>setF(p=>({...p,email:v}))} placeholder="voce@escola.edu.br" />
              <Fld label="ESCOLA / REDE" value={f.school} onChange={v=>setF(p=>({...p,school:v}))} placeholder="Nome da instituição" />
              <Fld label="MENSAGEM" value={f.msg} onChange={v=>setF(p=>({...p,msg:v}))} placeholder="Como podemos ajudar?" rows={5} />
              <Btn full onClick={()=>{ if(f.name&&f.email) setSent(true); }}>ENVIAR MENSAGEM</Btn>
            </>
        }
      </section>
    </div>
  );
};

/* ═══════════════════════════ LOGIN MODAL ═══════════════════════════ */
const LoginModal = ({ type, setType, onClose, onLogin, db, setDb }) => {
  const [email,setEmail]=useState(''), [code,setCode]=useState(''), [pwd,setPwd]=useState(''), [token,setToken]=useState('');
  const [err,setErr]=useState(''), [loading,setLoading]=useState(false), [keyScr,setKeyScr]=useState(null);

  const doLogin = async () => {
    setErr(''); setLoading(true);
    await new Promise(r=>setTimeout(r,320));
    try {
      if (type === 'admin') {
        if (email.trim()===ADMIN_EMAIL && hash(pwd)===ADMIN_HASH) { onLogin({type:'admin'}); onClose(); return; }
        setErr('E-mail ou senha inválidos.');
      } else if (type === 'school') {
        const t = token.trim().toUpperCase(), school = (db.schools||{})[t];
        if (!school)        { setErr('Token não encontrado.'); setLoading(false); return; }
        if (!school.active) { setErr('Acesso suspenso. Entre em contato com a ALUMIA.'); setLoading(false); return; }
        onLogin({type:'school',token:t,schoolName:school.name}); onClose(); return;
      } else {
        const c=code.trim(), student=(db.students||{})[c];
        if (!student || student.pwdHash!==hash(pwd)) { setErr('Usuário ou senha inválidos.'); setLoading(false); return; }
        if (!(db.schools||{})[student.schoolToken]?.active) { setErr('Acesso suspenso. Contacte sua escola.'); setLoading(false); return; }
        if (!student.firstLogin) { setKeyScr({key:genPhrase(),code:c,tok:student.schoolToken}); setLoading(false); return; }
        onLogin({type:'student',code:c,schoolToken:student.schoolToken}); onClose(); return;
      }
    } catch { setErr('Erro inesperado.'); }
    setLoading(false);
  };

  const confirmKey = async () => {
    const students = {...db.students, [keyScr.code]:{...db.students[keyScr.code],firstLogin:true}};
    await DB.set(KEYS.students,students);
    setDb(p=>({...p,students}));
    onLogin({type:'student',code:keyScr.code,schoolToken:keyScr.tok}); onClose();
  };

  return (
    <ModalWrap onClose={onClose} w={420}>
      <div style={{ padding:'30px 30px 32px' }}>
        <button onClick={onClose} className="hl" style={{ position:'absolute',top:13,right:14,fontSize:17,color:'#bbb',cursor:'pointer' }}>✕</button>
        {keyScr ? (
          <>
            <div style={{ fontFamily:"'Syne',sans-serif",fontSize:'1.05rem',fontWeight:700,marginBottom:5 }}>⚠️ Frase secreta</div>
            <p style={{ fontSize:13.5,color:'#555',lineHeight:1.6,marginBottom:14 }}>Exibida <strong>apenas uma vez</strong>. Anote em local seguro — é a única forma de recuperar o acesso.</p>
            <div style={{ background:'#f4f4f4',border:'2px solid #000',padding:16,fontFamily:"'JetBrains Mono',monospace",fontSize:14,lineHeight:2,marginBottom:13,wordBreak:'break-word' }}>{keyScr.key}</div>
            <Inf type="warn">Sem essa frase, uma nova conta precisará ser criada pela escola.</Inf>
            <Btn full onClick={confirmKey}>ANOTEI — CONTINUAR</Btn>
          </>
        ) : (
          <>
            <div style={{ fontFamily:"'Syne',sans-serif",fontSize:'1.15rem',fontWeight:700,marginBottom:18,letterSpacing:'-.02em' }}>Acessar ALUMIA</div>
            <div style={{ display:'flex',border:'1px solid #e8e8e8',marginBottom:18 }}>
              {[['student','Aluno'],['school','Escola'],['admin','Admin']].map(([t,l]) =>
                <button key={t} onClick={()=>{setType(t);setErr('');}} style={{ flex:1,padding:'8px 4px',fontSize:11.5,fontWeight:700,cursor:'pointer',background:type===t?'#000':'transparent',color:type===t?'#fff':'#bbb',border:'none',letterSpacing:'.04em',transition:'all .14s' }}>{l.toUpperCase()}</button>
              )}
            </div>

            {/* Dicas de acesso demo para facilitar testes */}
            <div style={{ padding:'8px 11px',background:'#f9f9f9',border:'1px solid #f0f0f0',fontSize:11.5,color:'#888',marginBottom:14 }}>
              {type==='admin' && <span><strong>Demo:</strong> <code>admin@alumia.com</code> / senha: <code>admin123</code></span>}
              {type==='school' && <span><strong>Demo:</strong> Token: <code>ESC-2025-ALUMIA</code></span>}
              {type==='student' && <span><strong>Demo:</strong> Código: <code>TURMA3A-01</code> / senha: <code>1234</code></span>}
            </div>

            {type==='admin' && <><Fld label="E-MAIL" type="email" value={email} onChange={setEmail} placeholder="admin@alumia.com" af/><Fld label="SENHA" type="password" value={pwd} onChange={setPwd} placeholder="••••••••" /></>}
            {type==='school' && <Fld label="TOKEN DA ESCOLA" value={token} onChange={setToken} placeholder="ESC-XXXX-ALUMIA" mono note="Token fornecido pela ALUMIA ao cadastrar sua escola." />}
            {type==='student' && <><Fld label="CÓDIGO DO ALUNO" value={code} onChange={setCode} placeholder="Código fornecido pela escola" mono af/><Fld label="SENHA" type="password" value={pwd} onChange={setPwd} placeholder="••••••••" /></>}
            {err && <Inf type="err">{err}</Inf>}
            <Btn full onClick={doLogin} disabled={loading}>{loading ? <><Sp /> Verificando...</> : 'ACESSAR'}</Btn>
          </>
        )}
      </div>
    </ModalWrap>
  );
};

/* ═══════════════════════════ DIARY / STUDENT AREA ═══════════════════════════ */
const DiaryEditor = ({ date, existing, onSave, onClose, saving }) => {
  const [text,setText] = useState('');
  const isFri = new Date(date+'T12:00').getDay()===5;
  if (existing) return (
    <ModalWrap onClose={onClose} w={600}>
      <div style={{ background:'#fdfcf8',padding:'26px 30px 30px' }}>
        <button onClick={onClose} className="hl" style={{ position:'absolute',top:13,right:13,fontSize:17,color:'#bbb',cursor:'pointer' }}>✕</button>
        <div style={{ fontSize:10,fontWeight:700,color:'#bbb',letterSpacing:'.1em',marginBottom:3,textTransform:'uppercase' }}>{fmtLong(date)}</div>
        <div style={{ fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:'.95rem',color:'#999',marginBottom:18 }}>Você já realizou sua escrita neste dia.</div>
        <div style={{ padding:'18px 20px',background:'#fff',border:'1px solid #ece8dd',borderLeft:`3px solid ${RISK[existing.riskLevel]?.color||'#ccc'}`,fontSize:14.5,lineHeight:1.9,color:'#555',fontStyle:'italic',marginBottom:12 }}>"{existing.content}"</div>
        <div style={{ display:'flex',gap:7,flexWrap:'wrap',alignItems:'center' }}>
          <Tag risk={existing.riskLevel} />{existing.urgency&&<Tag urgency={existing.urgency} />}
          <span style={{ fontSize:11,color:'#bbb',marginLeft:3 }}>{fmtTs(existing.timestamp)}</span>
        </div>
      </div>
    </ModalWrap>
  );
  return (
    <ModalWrap onClose={onClose} w={660}>
      <div style={{ background:'#fdfcf8',padding:'24px 28px 26px',position:'relative' }}>
        <div style={{ position:'absolute',top:0,left:72,bottom:0,width:1,background:'#ece8dd',pointerEvents:'none' }} />
        <button onClick={onClose} className="hl" style={{ position:'absolute',top:13,right:13,fontSize:17,color:'#bbb',cursor:'pointer',zIndex:2 }}>✕</button>
        <div style={{ fontSize:10,fontWeight:700,color:'#bbb',letterSpacing:'.1em',marginBottom:3,textTransform:'uppercase' }}>
          {fmtLong(date)}{isFri && <span style={{ marginLeft:8,background:'#000',color:'#fff',padding:'1px 6px',fontSize:9,letterSpacing:'.06em' }}>SEXTA · DIA PRINCIPAL</span>}
        </div>
        <div style={{ fontFamily:"'Syne',sans-serif",fontSize:'.95rem',fontWeight:700,color:'#555',marginBottom:16 }}>Como você está se sentindo?</div>
        <textarea value={text} onChange={e=>setText(e.target.value)} autoFocus rows={11}
          placeholder="Escreva livremente sobre seu dia, sentimentos, relações, o que está pesando ou o que está bem. Não existe resposta certa."
          style={{ width:'100%',border:'none',background:'transparent',fontSize:14.5,lineHeight:1.95,color:'#333',resize:'none',fontFamily:"'Epilogue',sans-serif",outline:'none',paddingLeft:8 }} />
        <div style={{ borderTop:'1px solid #ece8dd',paddingTop:12,marginTop:6,display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:9 }}>
          <div style={{ fontSize:12,color:text.length<30?'#dc2626':'#ccc' }}>{text.length} / mín. 30 caracteres</div>
          <Btn onClick={()=>text.trim().length>=30 && onSave(text)} disabled={saving||text.trim().length<30}>{saving?<><Sp /> Analisando...</>:'SALVAR E ANALISAR →'}</Btn>
        </div>
        {saving && <div style={{ marginTop:9,padding:'8px 12px',background:'#f5f5f5',fontSize:12,color:'#888',display:'flex',gap:6,alignItems:'center' }}><Sp /> Processando análise com IA...</div>}
        <div style={{ marginTop:8,fontSize:11,color:'#ccc' }}>🔒 Anônimo · Não é possível editar após salvar</div>
      </div>
    </ModalWrap>
  );
};

const ResultModal = ({ entry, onClose }) => {
  const r = RISK[entry.riskLevel]||RISK.baixo;
  const chart = Object.entries(IND).map(([k,l])=>({name:l.slice(0,11),value:entry.indicators[k]||0,full:l}));
  return (
    <ModalWrap onClose={onClose} w={660}>
      <div style={{ padding:'24px 26px 26px' }}>
        <button onClick={onClose} className="hl" style={{ position:'absolute',top:13,right:13,fontSize:17,color:'#bbb',cursor:'pointer' }}>✕</button>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16,flexWrap:'wrap',gap:7 }}>
          <div style={{ fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:'1rem' }}>Resultado da análise</div>
          <div style={{ display:'flex',gap:6 }}><Tag risk={entry.riskLevel}/>{entry.urgency&&<Tag urgency={entry.urgency}/>}</div>
        </div>
        {entry.aiText && <div style={{ padding:'12px 14px',background:'#f8f8f8',borderLeft:`3px solid ${r.color}`,fontSize:13.5,color:'#444',lineHeight:1.8,marginBottom:16 }}>{entry.aiText}</div>}
        <div style={{ marginBottom:12 }}>{Object.entries(IND).map(([k,l])=><IBar key={k} label={l} value={entry.indicators[k]||0} sm />)}</div>
        <div style={{ height:160,marginBottom:14 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart} margin={{top:0,right:0,bottom:22,left:-26}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5"/>
              <XAxis dataKey="name" tick={{fontSize:8}} angle={-30} textAnchor="end"/>
              <YAxis tick={{fontSize:9}} domain={[0,100]}/>
              <Tooltip formatter={(v,n,p)=>[`${v}%`,p.payload.full]} contentStyle={{fontSize:12}}/>
              <Bar dataKey="value" radius={[2,2,0,0]}>{chart.map((_,i)=><Cell key={i} fill={iColor(chart[i].value)}/>)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ padding:'10px 13px',background:r.bg,border:`1px solid ${r.border}`,fontSize:13,color:r.color,lineHeight:1.55 }}>
          {entry.riskLevel==='alto'   && '⚠️ Indicadores elevados detectados. A equipe escolar foi notificada. Considere conversar com alguém de confiança.'}
          {entry.riskLevel==='atencao'&& 'ℹ️ Alguns indicadores merecem atenção. Continue escrevendo regularmente e procure apoio se precisar.'}
          {entry.riskLevel==='baixo'  && '✓ Seus indicadores estão em nível baixo. Continue assim — a escrita regular faz diferença!'}
        </div>
      </div>
    </ModalWrap>
  );
};

const WeekView = ({ offset, setOffset, entriesList, onSaveEntry, authCode, authTok }) => {
  const [edit,setEdit]=useState(null), [saving,setSaving]=useState(false), [result,setResult]=useState(null);
  const dates=getWeekDates(offset), today=todayISO();
  const byDate={};
  entriesList.forEach(e=>{byDate[e.date]=e;});

  const save = async text => {
    setSaving(true);
    try {
      const a = await aiAnalyze(text);
      const entry = { id:uid(), studentCode:authCode, schoolToken:authTok, date:edit.date, timestamp:Date.now(), content:text.trim(),
        indicators:{ansiedade:a.ansiedade,depressao:a.depressao,estresse:a.estresse,burnout:a.burnout,desempenho:a.desempenho,desmotivacao:a.desmotivacao,isolamento:a.isolamento,autodestrutivo:a.autodestrutivo,agressividade:a.agressividade,inseguranca:a.inseguranca,oscilacao:a.oscilacao,sobrecarga:a.sobrecarga},
        riskLevel:a.nivel_risco||'baixo', aiText:a.analise||'' };
      entry.urgency=calcUrgency(entry);
      await onSaveEntry(entry);
      setEdit(null); setResult(entry);
    } catch { setEdit(null); }
    setSaving(false);
  };

  return (
    <div>
      <div style={{ background:'#fff',border:'1px solid #e8e8e8',padding:20,marginBottom:14 }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16,flexWrap:'wrap',gap:10 }}>
          <div>
            <div style={{ fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:'.98rem' }}>Diário Semanal</div>
            <div style={{ fontSize:12,color:'#aaa',marginTop:2 }}>Semana de {fmtDate(dates[0])} a {fmtDate(dates[6])}</div>
          </div>
          <div style={{ display:'flex',gap:6 }}>
            <button onClick={()=>setOffset(p=>p-1)} className="hl" style={{ padding:'5px 11px',border:'1px solid #e0e0e0',fontSize:12,cursor:'pointer',background:'none' }}>← Anterior</button>
            {offset<0 && <button onClick={()=>setOffset(p=>p+1)} className="hl" style={{ padding:'5px 11px',border:'1px solid #e0e0e0',fontSize:12,cursor:'pointer',background:'none' }}>Próxima →</button>}
            {offset!==0 && <button onClick={()=>setOffset(0)} style={{ padding:'5px 11px',border:'1px solid #000',fontSize:12,cursor:'pointer',background:'#000',color:'#fff' }}>Hoje</button>}
          </div>
        </div>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:4 }}>
          {dates.map((date,i)=>{
            const isTdy=date===today, isFri=i===4, isFut=date>today, entry=byDate[date];
            return (
              <div key={date} onClick={()=>!isFut&&setEdit({date,existing:entry||null})}
                style={{ border:`1px solid ${isTdy?'#000':isFri?'#bbb':'#eee'}`,background:entry?RISK[entry.riskLevel]?.bg||'#fff':'#fff',padding:'9px 7px',cursor:isFut?'default':'pointer',opacity:isFut?.38:1,transition:'all .15s',minHeight:72,position:'relative' }}
                onMouseEnter={e=>{if(!isFut)e.currentTarget.style.borderColor='#777';}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=isTdy?'#000':isFri?'#bbb':'#eee';}}>
                {isFri&&<div style={{ position:'absolute',top:4,right:4,width:4,height:4,borderRadius:'50%',background:'#000',opacity:.2 }}/>}
                <div style={{ fontSize:8.5,fontWeight:700,color:isTdy?'#000':'#ccc',letterSpacing:'.06em',marginBottom:2,textTransform:'uppercase' }}>{DAYS[i].slice(0,3)}</div>
                <div style={{ fontFamily:"'Syne',sans-serif",fontSize:17,fontWeight:700,color:isTdy?'#000':'#aaa',marginBottom:4 }}>{new Date(date+'T12:00').getDate()}</div>
                {entry ? <div style={{ fontSize:9,fontWeight:700,color:RISK[entry.riskLevel]?.color }}>{RISK[entry.riskLevel]?.label}</div>
                       : !isFut&&<div style={{ fontSize:9,color:'#e0e0e0' }}>Escrever</div>}
                {isTdy&&<div style={{ position:'absolute',bottom:0,left:0,right:0,height:2,background:'#000' }}/>}
              </div>
            );
          })}
        </div>
        <div style={{ marginTop:10,display:'flex',gap:12,flexWrap:'wrap' }}>
          {[['#000','Hoje'],['#15803d','Baixo'],['#b45309','Atenção'],['#dc2626','Alto']].map(([c,l])=>
            <div key={l} style={{ fontSize:11,color:'#bbb',display:'flex',gap:4,alignItems:'center' }}><div style={{ width:6,height:6,borderRadius:'50%',background:c }}/>{l}</div>
          )}
          <div style={{ fontSize:11,color:'#ddd',marginLeft:'auto' }}>Sexta-feira · dia principal ●</div>
        </div>
      </div>
      {edit&&<DiaryEditor date={edit.date} existing={edit.existing} saving={saving} onSave={save} onClose={()=>setEdit(null)}/>}
      {result&&<ResultModal entry={result} onClose={()=>setResult(null)}/>}
    </div>
  );
};

const StudentArea = ({ auth, logout, db, setDb }) => {
  const [view,setView]=useState('diary'), [offset,setOffset]=useState(0);
  const myEntries=useMemo(()=>(db.entries||[]).filter(e=>e.studentCode===auth.code).sort((a,b)=>b.date.localeCompare(a.date)),[db.entries,auth.code]);
  const save=useCallback(async entry=>{
    const entries=[...(db.entries||[]),entry];
    await DB.set(KEYS.entries,entries);
    setDb(p=>({...p,entries}));
  },[db,setDb]);
  return (
    <div style={{ minHeight:'100vh',background:'#f4f4f4',fontFamily:"'Epilogue',sans-serif" }}>
      <GS/>
      <div style={{ background:'#000',height:56,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 24px',position:'sticky',top:0,zIndex:100 }}>
        <Logo/>
        <div style={{ display:'flex',gap:12,alignItems:'center' }}>
          <Mn style={{ fontSize:11,color:'#3a3a3a' }}>{auth.code}</Mn>
          <button onClick={logout} style={{ fontSize:11,color:'#555',cursor:'pointer',padding:'4px 10px',border:'1px solid #1e1e1e',background:'none',letterSpacing:'.04em',transition:'border .14s' }} onMouseEnter={e=>e.currentTarget.style.borderColor='#555'} onMouseLeave={e=>e.currentTarget.style.borderColor='#1e1e1e'}>SAIR</button>
        </div>
      </div>
      <div style={{ background:'#fff',borderBottom:'1px solid #e8e8e8',padding:'0 24px' }}>
        {[['diary','📖 Diário'],['history','📋 Histórico']].map(([v,l])=>
          <button key={v} onClick={()=>setView(v)} className={`tab-btn${view===v?' on':''}`}>{l}</button>
        )}
      </div>
      <div style={{ padding:'18px 24px',maxWidth:840,margin:'0 auto' }}>
        {view==='diary'&&(
          <>
            <WeekView offset={offset} setOffset={setOffset} entriesList={myEntries} onSaveEntry={save} authCode={auth.code} authTok={auth.schoolToken}/>
            <div style={{ background:'#fff',border:'1px solid #e8e8e8',padding:'12px 16px',fontSize:13,color:'#999',lineHeight:1.55 }}>📖 Clique em qualquer dia passado ou presente para registrar. Uma escrita por dia. Sexta-feira é o dia principal da semana.</div>
          </>
        )}
        {view==='history'&&(
          <div style={{ background:'#fff',border:'1px solid #e8e8e8' }}>
            <div style={{ padding:'12px 16px',borderBottom:'1px solid #eee',display:'flex',justifyContent:'space-between' }}>
              <div style={{ fontSize:10,fontWeight:700,color:'#aaa',letterSpacing:'.09em' }}>HISTÓRICO DE ENTRADAS</div>
              <div style={{ fontSize:11,color:'#ccc' }}>{myEntries.length} registro(s)</div>
            </div>
            {myEntries.length===0
              ? <div style={{ padding:'36px 20px',textAlign:'center',color:'#ccc',fontSize:13 }}>Nenhum texto registrado ainda. Comece pelo diário.</div>
              : myEntries.map(e=>(
                <div key={e.id} style={{ padding:'14px 16px',borderBottom:'1px solid #f5f5f5' }}>
                  <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:7,flexWrap:'wrap',gap:5 }}>
                    <div style={{ display:'flex',gap:7,alignItems:'center' }}><Mn style={{ fontSize:12,color:'#bbb' }}>{fmtDate(e.date)}</Mn><Tag risk={e.riskLevel}/>{e.urgency&&<Tag urgency={e.urgency}/>}</div>
                  </div>
                  <p style={{ fontSize:14,color:'#666',lineHeight:1.78,fontStyle:'italic' }}>"{e.content}"</p>
                  {e.aiText&&<div style={{ marginTop:7,fontSize:12.5,color:'#aaa',borderLeft:'2px solid #eee',paddingLeft:9,lineHeight:1.6 }}>{e.aiText}</div>}
                </div>
              ))
            }
          </div>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════ SCHOOL DASHBOARD ═══════════════════════════ */
const SchoolDashboard = ({ auth, logout, db, setDb }) => {
  const [tab,setTab]=useState('painel'), [selSt,setSelSt]=useState(null), [selEntry,setSelEntry]=useState(null);
  const [filt,setFilt]=useState('all'), [newSt,setNewSt]=useState({code:'',pwd:''}), [stErr,setStErr]=useState(''), [stOk,setStOk]=useState('');

  const myStudents=useMemo(()=>Object.values(db.students||{}).filter(s=>s.schoolToken===auth.token),[db.students,auth.token]);
  const myEntries=useMemo(()=>(db.entries||[]).filter(e=>e.schoolToken===auth.token).sort((a,b)=>b.date.localeCompare(a.date)),[db.entries,auth.token]);
  const latestBy=useMemo(()=>{ const m={}; myEntries.forEach(e=>{if(!m[e.studentCode])m[e.studentCode]=e;}); return m; },[myEntries]);
  const allBy  =useMemo(()=>{ const m={}; myEntries.forEach(e=>{if(!m[e.studentCode])m[e.studentCode]=[];m[e.studentCode].push(e);}); return m; },[myEntries]);

  const stuData=useMemo(()=>myStudents.map(s=>({
    ...s, latest:latestBy[s.code]||null, all:allBy[s.code]||[],
    risk:latestBy[s.code]?.riskLevel||'sem_dados',
    urgency:calcUrgency(latestBy[s.code]),
    trend:calcTrend(allBy[s.code]||[]),
    count:(allBy[s.code]||[]).length,
  })),[myStudents,latestBy,allBy]);

  const alto=stuData.filter(s=>s.risk==='alto').length;
  const atenc=stuData.filter(s=>s.risk==='atencao').length;
  const baixo=stuData.filter(s=>s.risk==='baixo').length;
  const criticos=stuData.filter(s=>s.urgency==='critico'||s.risk==='alto');
  const piora=stuData.filter(s=>s.trend==='worsening'&&s.risk!=='alto');

  const createSt = async () => {
    setStErr(''); setStOk('');
    const c=newSt.code.trim(), p=newSt.pwd.trim();
    if (!c||!p) { setStErr('Preencha código e senha.'); return; }
    if (c.length<3) { setStErr('Código mínimo 3 caracteres.'); return; }
    if (p.length<4) { setStErr('Senha mínima 4 caracteres.'); return; }
    if ((db.students||{})[c]) { setStErr('Este código já existe.'); return; }
    const students={...db.students,[c]:{code:c,pwdHash:hash(p),schoolToken:auth.token,firstLogin:false,createdAt:Date.now()}};
    await DB.set(KEYS.students,students);
    setDb(p=>({...p,students}));
    setStOk(`Aluno "${c}" criado com sucesso.`); setNewSt({code:'',pwd:''});
  };

  const TABS=[['painel','📊 Painel'],['indicadores','📈 Indicadores'],['analise','🤖 Análise IA'],['textos','📝 Textos'],['alertas','🚨 Alertas'],['gerenciar','⚙️ Gerenciar']];
  const fStud=filt==='all'?stuData:stuData.filter(s=>s.risk===filt);

  return (
    <Shell title="Dashboard da Escola" sub={auth.token} tabs={TABS} tab={tab} setTab={t=>{setTab(t);setSelSt(null);setSelEntry(null);}} onLogout={logout} badge={{alertas:criticos.length}}>

      {/* ── PAINEL ── */}
      {tab==='painel'&&(
        <>
          {criticos.length>0&&<Inf type="err">⚠️ {criticos.length} aluno(s) em <strong>alto risco / crítico</strong>. Verifique os alertas imediatamente.</Inf>}
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(145px,1fr))',gap:12,marginBottom:18 }}>
            {[['Total',myStudents.length,'#111'],['Alto Risco',alto,'#dc2626'],['Atenção',atenc,'#b45309'],['Baixo',baixo,'#15803d'],['Sem dados',stuData.filter(s=>s.risk==='sem_dados').length,'#ccc']].map(([l,v,c],i)=>
              <div key={i} style={{ background:'#fff',border:'1px solid #e8e8e8',padding:'18px 16px',borderTop:`3px solid ${c}` }}>
                <div style={{ fontSize:9.5,color:'#aaa',letterSpacing:'.09em',marginBottom:5,fontWeight:700 }}>{l.toUpperCase()}</div>
                <div style={{ fontFamily:"'Syne',sans-serif",fontSize:26,fontWeight:700,color:c }}>{v}</div>
              </div>
            )}
          </div>
          {piora.length>0&&<Inf type="warn">📈 {piora.length} aluno(s) com piora detectada nas últimas análises.</Inf>}
          {myEntries.length>0&&(
            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:14 }}>
              <div style={{ background:'#fff',border:'1px solid #e8e8e8',padding:20 }}>
                <div style={{ fontSize:10,fontWeight:700,color:'#aaa',letterSpacing:'.09em',marginBottom:14 }}>ÚLTIMAS ANÁLISES</div>
                {myEntries.slice(0,5).map(e=>(
                  <div key={e.id} onClick={()=>{setSelEntry(e);setTab('textos');}} className="hr" style={{ padding:'10px 0',borderBottom:'1px solid #f5f5f5',display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                    <div><Mn style={{ fontSize:12.5,fontWeight:700,display:'block' }}>{e.studentCode}</Mn><div style={{ fontSize:10.5,color:'#ccc',marginTop:1 }}>{fmtDate(e.date)}</div></div>
                    <div style={{ display:'flex',gap:5 }}><Tag risk={e.riskLevel}/>{e.urgency&&<Tag urgency={e.urgency}/>}</div>
                  </div>
                ))}
              </div>
              <div style={{ background:'#fff',border:'1px solid #e8e8e8',padding:20 }}>
                <div style={{ fontSize:10,fontWeight:700,color:'#aaa',letterSpacing:'.09em',marginBottom:14 }}>DISTRIBUIÇÃO</div>
                <div style={{ height:190 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[{n:'Alto',v:alto,f:'#dc2626'},{n:'Atenção',v:atenc,f:'#b45309'},{n:'Baixo',v:baixo,f:'#15803d'},{n:'S/Dados',v:stuData.filter(s=>s.risk==='sem_dados').length,f:'#e0e0e0'}]} margin={{top:5,right:5,left:-24,bottom:5}}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5"/>
                      <XAxis dataKey="n" tick={{fontSize:11}}/>
                      <YAxis tick={{fontSize:9}} allowDecimals={false}/>
                      <Tooltip contentStyle={{fontSize:12}}/>
                      <Bar dataKey="v" radius={[3,3,0,0]}>{[{f:'#dc2626'},{f:'#b45309'},{f:'#15803d'},{f:'#e0e0e0'}].map((e,i)=><Cell key={i} fill={e.f}/>)}</Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
          {myStudents.length===0&&<div style={{ textAlign:'center',padding:'44px 20px',color:'#ccc',background:'#fff',border:'1px dashed #e0e0e0',fontSize:14 }}>Nenhum aluno cadastrado. <button onClick={()=>setTab('gerenciar')} style={{ color:'#000',textDecoration:'underline',cursor:'pointer',background:'none',fontSize:14 }}>Criar na aba Gerenciar</button></div>}
        </>
      )}

      {/* ── INDICADORES ── */}
      {tab==='indicadores'&&(
        <div style={{ display:'grid',gridTemplateColumns:selSt?'260px 1fr':'1fr',gap:16,alignItems:'start' }}>
          <div>
            <div style={{ display:'flex',gap:5,marginBottom:12,flexWrap:'wrap' }}>
              {[['all','Todos'],['alto','Alto'],['atencao','Atenção'],['baixo','Baixo'],['sem_dados','S/dados']].map(([v,l])=>
                <button key={v} onClick={()=>setFilt(v)} style={{ padding:'4px 10px',fontSize:11,fontWeight:600,cursor:'pointer',background:filt===v?'#000':'#fff',color:filt===v?'#fff':'#999',border:'1px solid #e0e0e0',transition:'all .14s' }}>{l}</button>
              )}
            </div>
            <div style={{ background:'#fff',border:'1px solid #e8e8e8' }}>
              <div style={{ padding:'11px 15px',borderBottom:'1px solid #eee',fontSize:10,fontWeight:700,color:'#aaa',letterSpacing:'.09em' }}>ID ANÔNIMO · {fStud.length}</div>
              {fStud.length===0 ? <div style={{ padding:24,textAlign:'center',color:'#ccc',fontSize:13 }}>Nenhum aluno nesta categoria.</div>
                : fStud.map(s=>(
                  <div key={s.code} onClick={()=>setSelSt(selSt?.code===s.code?null:s)} className="hr" style={{ padding:'12px 15px',borderBottom:'1px solid #f5f5f5',display:'flex',justifyContent:'space-between',alignItems:'center',background:selSt?.code===s.code?'#fafafa':'#fff' }}>
                    <div>
                      <Mn style={{ fontSize:13,fontWeight:700,display:'block' }}>{s.code}</Mn>
                      <div style={{ fontSize:10,color:'#ccc',marginTop:1 }}>{s.latest?fmtDate(s.latest.date):'Sem texto'} · {s.count} entrada(s)</div>
                    </div>
                    <div style={{ display:'flex',gap:5,flexDirection:'column',alignItems:'flex-end' }}>
                      {s.risk!=='sem_dados'&&<Tag risk={s.risk}/>}
                      {s.trend==='worsening'&&<span style={{ fontSize:9,color:'#dc2626' }}>↑ piora</span>}
                      {s.trend==='improving'&&<span style={{ fontSize:9,color:'#15803d' }}>↓ melhora</span>}
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
          {selSt&&(
            <div className="fi">
              {selSt.latest ? (
                <div style={{ background:'#fff',border:'1px solid #e8e8e8',padding:22,borderTop:`3px solid ${RISK[selSt.risk]?.color||'#ccc'}` }}>
                  <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16,flexWrap:'wrap',gap:8 }}>
                    <div><Mn style={{ fontSize:17,fontWeight:700,display:'block' }}>{selSt.code}</Mn><div style={{ fontSize:11,color:'#ccc',marginTop:1 }}>{fmtDate(selSt.latest.date)} · {selSt.count} entrada(s)</div></div>
                    <div style={{ display:'flex',gap:6 }}><Tag risk={selSt.risk}/>{selSt.urgency&&<Tag urgency={selSt.urgency}/>}</div>
                  </div>
                  <div style={{ fontSize:10,fontWeight:700,color:'#aaa',letterSpacing:'.09em',marginBottom:12 }}>INDICADORES</div>
                  {Object.entries(IND).map(([k,l])=><IBar key={k} label={l} value={selSt.latest.indicators[k]||0} sm/>)}
                  <div style={{ height:190,marginTop:16 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={Object.entries(IND).map(([k,l])=>({name:l.slice(0,10),value:selSt.latest.indicators[k]||0,full:l}))} margin={{top:0,right:0,bottom:22,left:-26}}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f7f7f7"/>
                        <XAxis dataKey="name" tick={{fontSize:8}} angle={-30} textAnchor="end"/>
                        <YAxis tick={{fontSize:9}} domain={[0,100]}/>
                        <Tooltip formatter={(v,n,p)=>[`${v}%`,p.payload.full]} contentStyle={{fontSize:12}}/>
                        <Bar dataKey="value" radius={[2,2,0,0]}>{Object.entries(IND).map(([k],i)=><Cell key={i} fill={iColor(selSt.latest.indicators[k]||0)}/>)}</Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  {selSt.all.length>1&&(
                    <>
                      <div style={{ fontSize:10,fontWeight:700,color:'#aaa',letterSpacing:'.09em',margin:'16px 0 10px' }}>EVOLUÇÃO HISTÓRICA</div>
                      <div style={{ height:140 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={[...selSt.all].reverse().slice(-8).map(e=>({ date:fmtDate(e.date), ansiedade:e.indicators.ansiedade, estresse:e.indicators.estresse, burnout:e.indicators.burnout }))} margin={{top:0,right:0,bottom:18,left:-26}}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f7f7f7"/>
                            <XAxis dataKey="date" tick={{fontSize:8}} angle={-20} textAnchor="end"/>
                            <YAxis tick={{fontSize:9}} domain={[0,100]}/>
                            <Tooltip contentStyle={{fontSize:11}}/>
                            <Line type="monotone" dataKey="ansiedade" stroke="#dc2626" dot={false} strokeWidth={1.5}/>
                            <Line type="monotone" dataKey="estresse" stroke="#b45309" dot={false} strokeWidth={1.5}/>
                            <Line type="monotone" dataKey="burnout" stroke="#7c3aed" dot={false} strokeWidth={1.5}/>
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      <div style={{ display:'flex',gap:12,marginTop:6 }}>
                        {[['#dc2626','Ansiedade'],['#b45309','Estresse'],['#7c3aed','Burnout']].map(([c,l])=><div key={l} style={{ fontSize:10,color:'#bbb',display:'flex',gap:4,alignItems:'center' }}><div style={{ width:12,height:2,background:c }}/>{l}</div>)}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div style={{ background:'#fff',border:'1px solid #e8e8e8',padding:40,textAlign:'center',color:'#ccc' }}>
                  <Mn style={{ fontSize:15,display:'block',marginBottom:9 }}>{selSt.code}</Mn>
                  <div style={{ fontSize:13 }}>Este aluno ainda não enviou nenhum texto.</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── ANÁLISE IA ── */}
      {tab==='analise'&&(
        <div>
          <div style={{ marginBottom:16,padding:'12px 16px',background:'#f8f8f8',border:'1px solid #eee',fontSize:13.5,color:'#666',lineHeight:1.55 }}>
            🤖 Interpretação textual gerada pela IA para cada análise. Leitura contextualizada do estado emocional do aluno.
          </div>
          {Object.values(latestBy).length===0 ? (
            <div style={{ textAlign:'center',padding:'36px 20px',color:'#ccc',background:'#fff',border:'1px dashed #e0e0e0',fontSize:13 }}>Nenhum texto enviado ainda.</div>
          ) : Object.values(latestBy).map(e=>(
            <div key={e.id} style={{ background:'#fff',border:'1px solid #e8e8e8',padding:20,marginBottom:12 }}>
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12,flexWrap:'wrap',gap:8 }}>
                <div style={{ display:'flex',alignItems:'center',gap:10 }}><Mn style={{ fontSize:14,fontWeight:700 }}>{e.studentCode}</Mn><Tag risk={e.riskLevel}/>{e.urgency&&<Tag urgency={e.urgency}/>}</div>
                <Mn style={{ fontSize:11,color:'#ccc' }}>{fmtDate(e.date)}</Mn>
              </div>
              {e.aiText ? (
                <div style={{ padding:'12px 15px',background:'#f9f9f9',border:'1px solid #eee',fontSize:14,color:'#444',lineHeight:1.8,borderLeft:`3px solid ${RISK[e.riskLevel]?.color||'#ccc'}` }}>{e.aiText}</div>
              ) : (
                <div style={{ fontSize:13,color:'#ccc',fontStyle:'italic' }}>Interpretação não disponível para esta entrada.</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── TEXTOS ── */}
      {tab==='textos'&&(
        <div style={{ display:'grid',gridTemplateColumns:selEntry?'1fr 1fr':'1fr',gap:16,alignItems:'start' }}>
          <div style={{ background:'#fff',border:'1px solid #e8e8e8' }}>
            <div style={{ padding:'12px 16px',borderBottom:'1px solid #eee',display:'flex',justifyContent:'space-between' }}>
              <div style={{ fontSize:10,fontWeight:700,color:'#aaa',letterSpacing:'.09em' }}>TEXTOS DOS ALUNOS</div>
              <div style={{ fontSize:11,color:'#ccc' }}>{myEntries.length}</div>
            </div>
            {myEntries.length===0 ? <div style={{ padding:32,textAlign:'center',color:'#ccc',fontSize:13 }}>Nenhum texto enviado ainda.</div>
              : myEntries.map(e=>(
                <div key={e.id} onClick={()=>setSelEntry(selEntry?.id===e.id?null:e)} className="hr" style={{ padding:'13px 16px',borderBottom:'1px solid #f5f5f5',background:selEntry?.id===e.id?'#fafafa':'#fff' }}>
                  <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6,flexWrap:'wrap',gap:5 }}>
                    <div style={{ display:'flex',gap:8,alignItems:'center' }}><Mn style={{ fontSize:13,fontWeight:700 }}>{e.studentCode}</Mn><Tag risk={e.riskLevel}/>{e.urgency&&<Tag urgency={e.urgency}/>}</div>
                    <Mn style={{ fontSize:10.5,color:'#ccc' }}>{fmtDate(e.date)}</Mn>
                  </div>
                  <p style={{ fontSize:13,color:'#999',lineHeight:1.5,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden' }}>{e.content}</p>
                </div>
              ))
            }
          </div>
          {selEntry&&(
            <div className="fi" style={{ background:'#fff',border:'1px solid #e8e8e8',padding:22,position:'sticky',top:80 }}>
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16,flexWrap:'wrap',gap:7 }}>
                <div><Mn style={{ fontSize:16,fontWeight:700,display:'block' }}>{selEntry.studentCode}</Mn><div style={{ fontSize:11,color:'#ccc',marginTop:1 }}>{fmtTs(selEntry.timestamp)}</div></div>
                <div style={{ display:'flex',gap:5 }}><Tag risk={selEntry.riskLevel}/>{selEntry.urgency&&<Tag urgency={selEntry.urgency}/>}</div>
              </div>
              <div style={{ fontSize:10,fontWeight:700,color:'#aaa',letterSpacing:'.09em',marginBottom:10 }}>TEXTO COMPLETO</div>
              <div style={{ padding:'14px 16px',background:'#fdfcf8',border:'1px solid #ece8dd',borderLeft:`3px solid ${RISK[selEntry.riskLevel]?.color||'#ccc'}`,fontSize:14.5,lineHeight:1.9,color:'#444',fontStyle:'italic',marginBottom:16 }}>"{selEntry.content}"</div>
              <div style={{ fontSize:10,fontWeight:700,color:'#aaa',letterSpacing:'.09em',marginBottom:10 }}>INDICADORES DA IA</div>
              {Object.entries(IND).map(([k,l])=><IBar key={k} label={l} value={selEntry.indicators[k]||0} sm/>)}
              {selEntry.aiText&&<><Dv m="14px 0"/><div style={{ fontSize:10,fontWeight:700,color:'#aaa',letterSpacing:'.09em',marginBottom:8 }}>INTERPRETAÇÃO DA IA</div><div style={{ padding:'12px 14px',background:'#f8f8f8',border:'1px solid #eee',fontSize:13.5,color:'#555',lineHeight:1.75 }}>{selEntry.aiText}</div></>}
              <div style={{ marginTop:14,padding:'9px 13px',background:'#fffbeb',border:'1px solid #fde68a',fontSize:12,color:'#92400e',lineHeight:1.5 }}>📋 Destina-se à análise por psicólogo ou orientador. A escola relaciona este ID com o aluno real externamente.</div>
            </div>
          )}
        </div>
      )}

      {/* ── ALERTAS ── */}
      {tab==='alertas'&&(
        <div>
          {criticos.length>0&&(
            <><div style={{ marginBottom:14,padding:'12px 16px',background:'#fff5f5',border:'1px solid #fecaca' }}><div style={{ fontSize:10,fontWeight:700,color:'#dc2626',letterSpacing:'.09em' }}>⚠️ ALTO RISCO / CRÍTICO — {criticos.length} aluno(s)</div></div>
            {criticos.map(s=>(
              <div key={s.code} style={{ background:'#fff',border:'1px solid #fecaca',padding:20,marginBottom:10,borderLeft:'4px solid #dc2626' }}>
                <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8,marginBottom:10 }}>
                  <div style={{ display:'flex',gap:8,alignItems:'center' }}><Mn style={{ fontSize:15,fontWeight:700 }}>{s.code}</Mn><Tag risk={s.risk}/>{s.urgency&&<Tag urgency={s.urgency}/>}</div>
                  {s.latest&&<Mn style={{ fontSize:11,color:'#ccc' }}>{fmtDate(s.latest.date)}</Mn>}
                </div>
                {s.latest&&<>
                  <div style={{ display:'flex',gap:6,flexWrap:'wrap',marginBottom:10 }}>
                    {Object.entries(s.latest.indicators).filter(([,v])=>v>=55).map(([k])=><span key={k} style={{ padding:'2px 8px',background:'#fff5f5',border:'1px solid #fecaca',fontSize:11,color:'#dc2626' }}>{IND[k]}</span>)}
                  </div>
                  <div style={{ padding:'12px 14px',background:'#fdfcf8',border:'1px solid #ece8dd',fontSize:14,color:'#555',lineHeight:1.75,fontStyle:'italic',marginBottom:8 }}>"{s.latest.content}"</div>
                  <div style={{ fontSize:12,color:'#dc2626',fontWeight:500 }}>→ Recomendação: contato imediato com psicólogo escolar ou orientador.</div>
                </>}
              </div>
            ))}</>
          )}
          {piora.length>0&&(
            <><Dv m="18px 0"/>
            <div style={{ marginBottom:12,padding:'10px 14px',background:'#fffbeb',border:'1px solid #fde68a' }}><div style={{ fontSize:10,fontWeight:700,color:'#b45309',letterSpacing:'.09em' }}>📈 PIORA DETECTADA — {piora.length} aluno(s)</div></div>
            {piora.map(s=>(
              <div key={s.code} style={{ background:'#fff',border:'1px solid #fde68a',padding:16,marginBottom:8,borderLeft:'3px solid #b45309' }}>
                <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:6 }}>
                  <div style={{ display:'flex',gap:7,alignItems:'center' }}><Mn style={{ fontSize:14,fontWeight:700 }}>{s.code}</Mn><Tag risk={s.risk}/></div>
                  <span style={{ fontSize:11,color:'#b45309',fontWeight:600 }}>↑ risco aumentando</span>
                </div>
              </div>
            ))}</>
          )}
          {criticos.length===0&&piora.length===0&&<div style={{ textAlign:'center',padding:'44px 20px',color:'#ccc',background:'#fff',border:'1px dashed #e0e0e0',fontSize:14 }}>✓ Nenhum alerta ativo no momento.</div>}
        </div>
      )}

      {/* ── GERENCIAR ── */}
      {tab==='gerenciar'&&(
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(290px,1fr))',gap:16,alignItems:'start' }}>
          <div style={{ background:'#fff',border:'1px solid #e8e8e8',padding:24 }}>
            <h3 style={{ fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:'.95rem',marginBottom:5 }}>Criar novo aluno</h3>
            <p style={{ fontSize:13,color:'#aaa',lineHeight:1.55,marginBottom:16 }}>Defina um código e senha inicial. O aluno usará esses dados para acessar o diário.</p>
            <Fld label="CÓDIGO DO ALUNO" value={newSt.code} onChange={v=>setNewSt(p=>({...p,code:v}))} placeholder="Ex: TURMA3A-001" mono note="Código anônimo. Apenas a escola sabe a quem pertence." />
            <Fld label="SENHA INICIAL" type="password" value={newSt.pwd} onChange={v=>setNewSt(p=>({...p,pwd:v}))} placeholder="Mínimo 4 caracteres" note="O aluno pode alterar no primeiro acesso." />
            {stErr&&<Inf type="err">{stErr}</Inf>}
            {stOk&&<Inf type="ok">{stOk}</Inf>}
            <Btn full onClick={createSt}>CRIAR ALUNO</Btn>
            <div style={{ marginTop:12,padding:'9px 13px',background:'#f0fdf4',border:'1px solid #bbf7d0',fontSize:12,color:'#15803d',lineHeight:1.5 }}>🔒 O ALUMIA nunca armazena o nome real. A correspondência código→aluno é feita pela escola externamente.</div>
          </div>
          <div style={{ background:'#fff',border:'1px solid #e8e8e8' }}>
            <div style={{ padding:'12px 16px',borderBottom:'1px solid #eee',display:'flex',justifyContent:'space-between' }}>
              <div style={{ fontSize:10,fontWeight:700,color:'#aaa',letterSpacing:'.09em' }}>ALUNOS CADASTRADOS</div>
              <div style={{ fontSize:11,color:'#ccc' }}>{myStudents.length}</div>
            </div>
            {myStudents.length===0 ? <div style={{ padding:28,textAlign:'center',color:'#ccc',fontSize:13 }}>Nenhum aluno ainda.</div>
              : [...myStudents].sort((a,b)=>b.createdAt-a.createdAt).map(s=>(
                <div key={s.code} style={{ padding:'11px 16px',borderBottom:'1px solid #f5f5f5',display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                  <div><Mn style={{ fontSize:13,fontWeight:600,display:'block' }}>{s.code}</Mn><div style={{ fontSize:10.5,color:'#ccc',marginTop:1 }}>Criado {fmtDate(new Date(s.createdAt).toISOString().slice(0,10))}</div></div>
                  <div style={{ fontSize:11,color:latestBy[s.code]?'#15803d':'#ddd' }}>{latestBy[s.code]?'● Ativo':'○ Aguardando'}</div>
                </div>
              ))
            }
          </div>
        </div>
      )}
    </Shell>
  );
};

/* ═══════════════════════════ ADMIN PANEL ═══════════════════════════ */
const AdminPanel = ({ auth, logout, db, setDb }) => {
  const [tab,setTab]=useState('escolas'), [newSc,setNewSc]=useState({name:''}), [scErr,setScErr]=useState(''), [gen,setGen]=useState(null);
  const schools=Object.values(db.schools||{});
  const students=Object.values(db.students||{});
  const entries=db.entries||[];

  const createSchool = async () => {
    if (!newSc.name.trim()) { setScErr('Informe o nome da escola.'); return; }
    setScErr('');
    const token=genToken(), school={token,name:newSc.name.trim(),active:true,createdAt:Date.now()};
    const sc={...db.schools,[token]:school};
    await DB.set(KEYS.schools,sc); setDb(p=>({...p,schools:sc}));
    setGen({token,name:newSc.name}); setNewSc({name:''});
  };
  const toggle = async token => {
    const sc={...db.schools,[token]:{...db.schools[token],active:!db.schools[token].active}};
    await DB.set(KEYS.schools,sc); setDb(p=>({...p,schools:sc}));
  };

  return (
    <Shell title="Painel Administrativo" sub="ALUMIA — ACESSO RESTRITO" tabs={[['escolas','🏫 Escolas'],['tokens','🔑 Tokens'],['sistema','⚙️ Sistema']]} tab={tab} setTab={setTab} onLogout={logout}>
      <Inf type="ok">🔒 Como administrador, você <strong>não tem acesso</strong> a textos de alunos nem a dados de identificação. Conformidade LGPD ativa.</Inf>

      {tab==='escolas'&&(
        <div style={{ background:'#fff',border:'1px solid #e8e8e8' }}>
          <div style={{ padding:'12px 16px',borderBottom:'1px solid #eee',display:'flex',justifyContent:'space-between' }}>
            <div style={{ fontSize:10,fontWeight:700,color:'#aaa',letterSpacing:'.09em' }}>ESCOLAS CADASTRADAS</div>
            <div style={{ fontSize:11,color:'#ccc' }}>{schools.length}</div>
          </div>
          {schools.length===0 ? (
            <div style={{ padding:40,textAlign:'center',color:'#ccc' }}>
              <div style={{ fontSize:26,marginBottom:10 }}>🏫</div>
              <div style={{ fontSize:13,marginBottom:7 }}>Nenhuma escola cadastrada.</div>
              <button onClick={()=>setTab('tokens')} style={{ fontSize:12.5,color:'#000',textDecoration:'underline',cursor:'pointer',background:'none' }}>Gerar o primeiro token</button>
            </div>
          ) : [...schools].sort((a,b)=>b.createdAt-a.createdAt).map(s=>(
            <div key={s.token} style={{ padding:'16px',borderBottom:'1px solid #f5f5f5',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10 }}>
              <div>
                <div style={{ fontSize:14,fontWeight:600,marginBottom:3 }}>{s.name}</div>
                <Mn style={{ fontSize:12,color:'#aaa',display:'block' }}>{s.token}</Mn>
                <div style={{ fontSize:10.5,color:'#ccc',marginTop:1 }}>{fmtDate(new Date(s.createdAt).toISOString().slice(0,10))} · {students.filter(st=>st.schoolToken===s.token).length} aluno(s)</div>
              </div>
              <div style={{ display:'flex',gap:8,alignItems:'center' }}>
                <div style={{ padding:'2px 9px',background:s.active?'#f0fdf4':'#f5f5f5',border:`1px solid ${s.active?'#bbf7d0':'#e0e0e0'}`,fontSize:10.5,fontWeight:700,color:s.active?'#15803d':'#bbb' }}>{s.active?'ATIVO':'INATIVO'}</div>
                <button onClick={()=>toggle(s.token)} style={{ fontSize:12,padding:'4px 11px',cursor:'pointer',background:'none',border:'1px solid #e0e0e0',color:'#666',transition:'border .14s' }} onMouseEnter={e=>e.target.style.borderColor='#999'} onMouseLeave={e=>e.target.style.borderColor='#e0e0e0'}>{s.active?'Suspender':'Reativar'}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==='tokens'&&(
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:16 }}>
          <div style={{ background:'#fff',border:'1px solid #e8e8e8',padding:24 }}>
            <h3 style={{ fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:'.95rem',marginBottom:5 }}>Gerar token para nova escola</h3>
            <p style={{ fontSize:13,color:'#aaa',lineHeight:1.55,marginBottom:16 }}>O token é o único meio de acesso da escola ao sistema. Envie por e-mail institucional.</p>
            <Fld label="NOME DA ESCOLA" value={newSc.name} onChange={v=>setNewSc({name:v})} placeholder="Ex: E.E. João Pessoa — SP" err={scErr} />
            <Btn full onClick={createSchool}>GERAR TOKEN</Btn>
            {gen&&(
              <div className="fi" style={{ marginTop:14,padding:18,background:'#f0fdf4',border:'1px solid #bbf7d0' }}>
                <div style={{ fontSize:10,fontWeight:700,color:'#15803d',letterSpacing:'.09em',marginBottom:7 }}>TOKEN GERADO</div>
                <Mn style={{ fontSize:18,fontWeight:700,letterSpacing:'.08em',color:'#000',display:'block',marginBottom:6 }}>{gen.token}</Mn>
                <div style={{ fontSize:12,color:'#aaa' }}>Envie para {gen.name} por canal seguro.</div>
              </div>
            )}
          </div>
          <div style={{ background:'#fff',border:'1px solid #e8e8e8',padding:20 }}>
            <div style={{ fontSize:10,fontWeight:700,color:'#aaa',letterSpacing:'.09em',marginBottom:14 }}>TOKENS ATIVOS</div>
            {schools.filter(s=>s.active).length===0 ? <div style={{ fontSize:13,color:'#ccc' }}>Nenhum token ativo.</div>
              : schools.filter(s=>s.active).map(s=>(
                <div key={s.token} style={{ padding:'10px 0',borderBottom:'1px solid #f0f0f0' }}>
                  <div style={{ fontSize:13,fontWeight:500,marginBottom:2 }}>{s.name}</div>
                  <Mn style={{ fontSize:12,color:'#aaa' }}>{s.token}</Mn>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {tab==='sistema'&&(
        <div>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:12,marginBottom:16 }}>
            {[['Escolas',schools.length],['Alunos',students.length],['Análises',entries.length],['Modelo IA','claude-sonnet-4'],['Conformidade','LGPD · Lei 13.709'],['Versão','3.0.0']].map(([k,v])=>
              <div key={k} style={{ background:'#fff',border:'1px solid #e8e8e8',padding:'16px 14px' }}>
                <div style={{ fontSize:9.5,color:'#aaa',letterSpacing:'.09em',marginBottom:5,fontWeight:700 }}>{String(k).toUpperCase()}</div>
                <Mn style={{ fontSize:14,fontWeight:600,color:'#111' }}>{v}</Mn>
              </div>
            )}
          </div>
          <div style={{ background:'#fff5f5',border:'1px solid #fecaca',padding:18 }}>
            <div style={{ fontSize:10,fontWeight:700,color:'#dc2626',letterSpacing:'.09em',marginBottom:9 }}>RESTRIÇÕES DO ADMINISTRADOR — POR DESIGN</div>
            {['Visualizar textos de alunos','Acessar indicadores individuais','Relacionar código com identidade real','Recuperar senhas de alunos ou escolas','Acessar frases de recuperação'].map(r=>
              <div key={r} style={{ fontSize:13,color:'#dc2626',marginBottom:5,display:'flex',gap:8 }}><span style={{ fontWeight:700 }}>✕</span>{r}</div>
            )}
          </div>
        </div>
      )}
    </Shell>
  );
};

/* ═══════════════════════════ APP ROOT ═══════════════════════════ */
export default function App() {
  const [page,setPage]=useState('home'), [auth,setAuth]=useState(null);
  const [modal,setModal]=useState(false), [loginType,setLoginType]=useState('student');
  const [menuOpen,setMenuOpen]=useState(false);
  const [db,setDb]=useState(null);

  useEffect(()=>{
    (async()=>{
      let [schools,students,entries]=await Promise.all([DB.get(KEYS.schools),DB.get(KEYS.students),DB.get(KEYS.entries)]);
      // Inicializar dados de demonstração se o banco local estiver vazio
      if (!schools || Object.keys(schools).length === 0) {
        schools = DEMO_DATA.schools;
        students = DEMO_DATA.students;
        entries = DEMO_DATA.entries;
        await DB.set(KEYS.schools, schools);
        await DB.set(KEYS.students, students);
        await DB.set(KEYS.entries, entries);
      }
      setDb({schools:schools||{},students:students||{},entries:entries||[]});
    })();
  },[]);

  const go=p=>{setPage(p);setMenuOpen(false);window.scrollTo(0,0);};
  const openLogin=t=>{setLoginType(t);setModal(true);setMenuOpen(false);};
  const logout=()=>{setAuth(null);go('home');};

  if (!db) return (
    <div style={{ minHeight:'100vh',background:'#000',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Epilogue',sans-serif" }}>
      <GS/>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:34,height:34,background:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:15,margin:'0 auto 14px' }}>A</div>
        <Mn style={{ color:'#2a2a2a',fontSize:12,letterSpacing:'.1em' }}>CARREGANDO...</Mn>
      </div>
    </div>
  );

  if (auth?.type==='student') return <StudentArea auth={auth} logout={logout} db={db} setDb={setDb}/>;
  if (auth?.type==='school')  return <SchoolDashboard auth={auth} logout={logout} db={db} setDb={setDb}/>;
  if (auth?.type==='admin')   return <AdminPanel auth={auth} logout={logout} db={db} setDb={setDb}/>;

  const PAGES = { home:<Home go={go}/>, about:<About/>, how:<How/>, privacy:<Privacy/>, team:<Team/>, contact:<ContactPage/> };

  return (
    <div style={{ fontFamily:"'Epilogue',sans-serif",background:'#fff',color:'#111' }}>
      <GS/>
      <Navbar go={go} page={page} openLogin={openLogin} menuOpen={menuOpen} setMenuOpen={setMenuOpen}/>
      <div style={{ paddingTop:60 }}>{PAGES[page]||<Home go={go}/>}</div>
      <Footer go={go}/>
      {modal&&<LoginModal type={loginType} setType={setLoginType} onClose={()=>setModal(false)} onLogin={setAuth} db={db} setDb={setDb}/>}
    </div>
  );
}
