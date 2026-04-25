import { ArrowRight, Github, Sparkles, BookOpen, Cpu, ShieldAlert, GitBranch, Layers } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

/* ─────────────────────────────────────────────────────────────
   API ENDPOINTS
───────────────────────────────────────────────────────────── */
const BACKEND_BASE      = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
const ANALYZE_URL       = `${BACKEND_BASE}/api/analyze`;
const ENTRYPOINT_URL    = `${BACKEND_BASE}/api/entrypoint`;
const DEPENDENCIES_URL  = `${BACKEND_BASE}/api/dependencies`;
const CRITICAL_URL      = `${BACKEND_BASE}/api/critical-files`;
const FLOW_URL          = `${BACKEND_BASE}/api/execution-flow`;
const INTEL_SUMMARY_URL = `${BACKEND_BASE}/api/intelligent-summary`;
const CLEANUP_URL       = `${BACKEND_BASE}/api/cleanup`;

/* ─────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────── */
const STEPS = [
  { id: 'clone',    label: 'Cloning repository' },
  { id: 'enrich',   label: 'Analyzing structure' },
  { id: 'critical', label: 'Identifying critical files' },
  { id: 'flow',     label: 'Mapping execution flow' },
  { id: 'summary',  label: 'Generating AI summary' },
];

const ROLE_META = {
  auth:       { bg:'#fef2f2', text:'#dc2626', border:'#fecaca' },
  database:   { bg:'#eff6ff', text:'#2563eb', border:'#bfdbfe' },
  controller: { bg:'#ecfdf5', text:'#059669', border:'#a7f3d0' },
  router:     { bg:'#faf5ff', text:'#7c3aed', border:'#ddd6fe' },
  service:    { bg:'#f0fdf4', text:'#16a34a', border:'#bbf7d0' },
  config:     { bg:'#fffbeb', text:'#d97706', border:'#fde68a' },
  entry:      { bg:'#f3f4f6', text:'#6b7280', border:'#d1d5db' },
};

const LAYER_META = {
  entry:      { bg:'#f3f4f6', text:'#4b5563' },
  middleware: { bg:'#fef3c7', text:'#92400e' },
  router:     { bg:'#ddd6fe', text:'#5b21b6' },
  controller: { bg:'#a7f3d0', text:'#065f46' },
  service:    { bg:'#dcfce7', text:'#15803d' },
  database:   { bg:'#bfdbfe', text:'#1e40af' },
};

const LAYER_LABELS = {
  entry:'Entry', middleware:'Middleware', router:'Router',
  controller:'Controller', service:'Service', database:'Database',
};

const FEATURES = [
  { icon:'🧠', title:'Intelligent Summary',     desc:'Architecture patterns, design decisions, tech stack, onboarding tips, and code quality signals.',  tag:'AI-powered',      color:'var(--primary)' },
  { icon:'🛡️', title:'Critical File Detection', desc:'Auth, databases, controllers, routers, and services auto-identified with role-based categorization.',   tag:'Static Analysis', color:'var(--error)' },
  { icon:'⚡', title:'Execution Flow Mapping',   desc:'Request flows traced through every layer from entry point to database.',   tag:'Flow Tracing',    color:'var(--info)' },
  { icon:'🗂️', title:'Folder Architecture',      desc:'Smart traversal with intelligent noise filtering for structural clarity.',                 tag:'Structure',   color:'var(--primary)' },
  { icon:'📦', title:'Dependency Graph',          desc:'Production and dev dependencies mapped from package.json with version tracking.',              tag:'Dependencies',          color:'var(--warning)' },
  { icon:'🎯', title:'Entry Point Detection',     desc:'Finds true entry point via package.json and convention-based scanning.',         tag:'Parser',  color:'var(--success)' },
];

/* ─────────────────────────────────────────────────────────────
   GLOBAL STYLES
───────────────────────────────────────────────────────────── */
const GLOBAL_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#ffffff;--surface:#f9fafb;--card:#f3f4f6;--border:#e5e7eb;--border2:#d1d5db;
  --text:#111827;--text2:#6b7280;--text3:#9ca3af;--primary:#2563eb;--primary-dark:#1d4ed8;
  --success:#10b981;--warning:#f59e0b;--error:#dc2626;--info:#0891b2;
}
html{scroll-behavior:smooth;scrollbar-width:thin;scrollbar-color:var(--primary) var(--surface)}
body{font-family:'Inter',sans-serif;background:var(--bg);color:var(--text);overflow-x:hidden;margin:0}
.reveal{opacity:0;transform:translateY(20px);transition:opacity 0.6s ease 0.1s,transform 0.6s ease 0.1s}
.reveal.vis{opacity:1;transform:translateY(0)}
.d1{transition-delay:0.1s!important}.d2{transition-delay:0.2s!important}.d3{transition-delay:0.3s!important}
.d4{transition-delay:0.4s!important}.d5{transition-delay:0.5s!important}
@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes slideDown{from{transform:translateY(-100%);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes spinSlow{to{transform:rotate(360deg)}}
@keyframes typeIn{from{opacity:0;transform:translateX(-4px)}to{opacity:1;transform:translateX(0)}}
.progress-bar{position:fixed;top:0;left:0;height:3px;z-index:300;background:var(--primary);box-shadow:none;border-radius:0;transition:width 0.2s ease;pointer-events:none}
.toast-wrap{position:fixed;bottom:32px;right:32px;z-index:300;display:flex;flex-direction:column;gap:10px;pointer-events:none}
.t-line{opacity:0;animation:typeIn 0.3s ease forwards}
.t-line:nth-child(1){animation-delay:0.2s}.t-line:nth-child(2){animation-delay:0.4s}
.t-line:nth-child(3){animation-delay:0.6s}.t-line:nth-child(4){animation-delay:0.8s}
@media(max-width:768px){.how-grid{grid-template-columns:1fr!important}.feat-grid{grid-template-columns:1fr!important}}
`;

/* ─────────────────────────────────────────────────────────────
   HOOKS
───────────────────────────────────────────────────────────── */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('vis'); obs.unobserve(e.target); } }),
      { threshold: 0.08, rootMargin: '0px 0px -48px 0px' }
    );
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  });
}

function useScrollProgress() {
  useEffect(() => {
    const bar = document.getElementById('aivya-pb');
    if (!bar) return;
    const fn = () => {
      const p = (window.scrollY / Math.max(document.body.scrollHeight - window.innerHeight, 1)) * 100;
      bar.style.width = Math.min(p, 100) + '%';
    };
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);
}

/* ─────────────────────────────────────────────────────────────
   ATOMS
───────────────────────────────────────────────────────────── */
function Tag({ children, color = 'var(--primary)' }) {
  return (
    <span style={{ display:'inline-flex', alignItems:'center', padding:'4px 12px', borderRadius:6, fontSize:12, fontWeight:600, letterSpacing:'0.03em', background:color+'1a', color:color, border:`1px solid ${color}40` }}>
      {children}
    </span>
  );
}

function RoleBadge({ role, label }) {
  const m = ROLE_META[role] || ROLE_META.entry;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', padding:'3px 10px', borderRadius:6, fontSize:11, fontWeight:700, background:m.bg, color:m.text, border:`1px solid ${m.border}` }}>
      {label}
    </span>
  );
}

function LayerChip({ layer }) {
  const m = LAYER_META[layer] || LAYER_META.entry;
  return (
    <span style={{ padding:'3px 10px', borderRadius:6, fontSize:10, fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase', background:m.bg, color:m.text, minWidth:80, display:'inline-block', textAlign:'center' }}>
      {LAYER_LABELS[layer] || layer}
    </span>
  );
}

function Spinner({ size = 14 }) {
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.2)', borderTopColor:'#fff', animation:'spinSlow 0.7s linear infinite', flexShrink:0 }} />
  );
}

function GlassCard({ children, style = {} }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background:'#fff', border:`2px solid ${hov ? 'var(--primary)' : 'var(--border)'}`, borderRadius:12, transition:'all 0.3s ease', transform:hov ? 'translateY(-4px)' : 'none', boxShadow:hov ? '0 10px 25px rgba(0,0,0,0.08)' : '0 2px 8px rgba(0,0,0,0.04)', position:'relative', overflow:'hidden', ...style }}>
      {children}
    </div>
  );
}

function ResultCard({ title, icon: Icon, children, accent = 'var(--primary)' }) {
  return (
    <div style={{ background:'#fff', border:'2px solid var(--border)', borderRadius:12, overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'16px 20px', background:accent+'12', borderBottom:`2px solid ${accent}30` }}>
        {Icon && <Icon size={16} style={{ color:accent, flexShrink:0 }} />}
        <h3 style={{ fontSize:12, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--text)', margin:0 }}>{title}</h3>
      </div>
      <div style={{ padding:'20px' }}>
        {children}
      </div>
    </div>
  );
}

function Toast({ msg }) {
  const [vis, setVis] = useState(false);
  useEffect(() => { requestAnimationFrame(() => setVis(true)); }, []);
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', borderRadius:8, fontSize:14, fontWeight:500, background:'#fff', border:'2px solid var(--border)', color:'var(--text)', boxShadow:'0 4px 12px rgba(0,0,0,0.12)', transform:vis ? 'translateY(0)' : 'translateY(100px)', opacity:vis ? 1 : 0, transition:'all 0.3s cubic-bezier(0.34,1.56,0.64,1)', pointerEvents:'all' }}>
      <span style={{ color:'var(--primary)', fontWeight:700 }}>✓</span> {msg}
    </div>
  );
}

function PrimaryBtn({ children, onClick, style = {} }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ padding:'11px 28px', borderRadius:8, fontSize:15, fontWeight:600, border:'none', cursor:'pointer', transition:'all 0.2s ease', display:'inline-flex', alignItems:'center', gap:8, background:h ? 'var(--primary-dark)' : 'var(--primary)', color:'#fff', boxShadow:h ? '0 4px 12px rgba(37, 99, 235, 0.3)' : '0 2px 4px rgba(0,0,0,0.08)', transform:h ? 'translateY(-1px)' : 'none', ...style }}>
      {children}
    </button>
  );
}

function SecondaryBtn({ children, onClick }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ padding:'11px 28px', borderRadius:8, fontSize:15, fontWeight:600, border:'2px solid var(--border)', cursor:'pointer', transition:'all 0.2s ease', display:'inline-flex', alignItems:'center', gap:8, background:h ? 'var(--surface)' : 'transparent', color:'var(--text)', transform:h ? 'translateY(-1px)' : 'none', boxShadow:h ? '0 2px 8px rgba(0,0,0,0.05)' : 'none' }}>
      {children}
    </button>
  );
}

function NavLink({ children, onClick }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ padding:'8px 12px', borderRadius:6, color:h ? 'var(--text)' : 'var(--text2)', background:h ? 'var(--surface)' : 'none', border:'none', fontSize:14, fontWeight:500, cursor:'pointer', transition:'all 0.2s ease' }}>
      {children}
    </button>
  );
}

function StepProgress({ currentStep }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      {STEPS.map((step, i) => {
        const state = i < currentStep ? 'done' : i === currentStep ? 'active' : 'pending';
        return (
          <div key={step.id} style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:22, height:22, borderRadius:'50%', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, transition:'all 0.3s ease', background:state==='done'?'#22c55e':state==='active'?'var(--p1)':'var(--card2)', border:`1px solid ${state==='done'?'#22c55e':state==='active'?'var(--p1)':'var(--border2)'}`, color:state==='pending'?'var(--text3)':'#fff' }}>
              {state === 'done' ? '✓' : state === 'active' ? <Spinner size={10} /> : i + 1}
            </div>
            <span style={{ fontSize:13, transition:'all 0.3s ease', color:state==='done'?'#22c55e':state==='active'?'var(--text)':'var(--text3)', fontWeight:state==='active'?600:400 }}>
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   ANALYSIS PANELS
───────────────────────────────────────────────────────────── */
function CriticalFilesPanel({ data }) {
  const grouped = data.grouped || {};
  if (!Object.keys(grouped).length)
    return <p style={{ fontSize:13, color:'var(--text2)' }}>No critical files detected.</p>;
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
      {Object.entries(grouped).map(([role, group]) => (
        <div key={role}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
            <RoleBadge role={role} label={group.label} />
            <span style={{ fontSize:11, color:'var(--text3)' }}>{group.files.length} file{group.files.length !== 1 ? 's' : ''}</span>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
            {group.files.map((file, i) => (
              <div key={i} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:'9px 13px' }}>
                <p style={{ fontFamily:'monospace', fontSize:11, fontWeight:700, color:'var(--text)', marginBottom:file.snippet ? 3 : 0 }}>{file.path}</p>
                {file.snippet && <p style={{ fontSize:11, color:'var(--text3)', fontFamily:'monospace', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', margin:0 }}>{file.snippet.slice(0, 88)}</p>}
              </div>
            ))}
          </div>
        </div>
      ))}
      <p style={{ fontSize:11, color:'var(--text3)' }}>{data.totalCritical} critical / {data.totalScanned} files scanned</p>
    </div>
  );
}

function ExecutionFlowPanel({ data }) {
  const layers = data.layers || {};
  const flows  = data.flows  || [];
  const order  = ['entry','middleware','router','controller','service','database'];
  const present = order.filter(l => layers[l]?.length > 0);
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
      <div>
        <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text3)', marginBottom:10 }}>Layer Map</p>
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {present.map(layer => (
            <div key={layer} style={{ display:'flex', alignItems:'center', gap:8 }}>
              <LayerChip layer={layer} />
              <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                {layers[layer].slice(0, 3).map((f, j) => (
                  <span key={j} style={{ fontFamily:'monospace', fontSize:10, padding:'2px 7px', borderRadius:5, background:'var(--card2)', color:'var(--text2)' }}>{f.split('/').pop()}</span>
                ))}
                {layers[layer].length > 3 && <span style={{ fontSize:10, color:'var(--text3)' }}>+{layers[layer].length - 3}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
      {flows.length > 0 && (
        <div>
          <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text3)', marginBottom:10 }}>Sample Flows</p>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {flows.slice(0, 3).map((flow, i) => {
              const mc = flow.method==='GET'?'#4ade80':flow.method==='POST'?'#60a5fa':flow.method==='DELETE'?'#f87171':'var(--text2)';
              return (
                <div key={i} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 13px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                    <span style={{ padding:'2px 8px', borderRadius:5, fontSize:10, fontWeight:800, background:mc+'20', color:mc }}>{flow.method}</span>
                    <span style={{ fontFamily:'monospace', fontSize:11, color:'var(--text2)' }}>{flow.path}</span>
                  </div>
                  <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', gap:4 }}>
                    {flow.steps.map((s, j) => (
                      <span key={j} style={{ display:'inline-flex', alignItems:'center', gap:4 }}>
                        {j > 0 && <span style={{ color:'var(--text3)', fontSize:10 }}>→</span>}
                        <LayerChip layer={s.layer} />
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {data.totalRoutes > 0 && <p style={{ fontSize:11, color:'var(--text3)' }}>{data.totalRoutes} routes · {Object.values(layers).flat().length} files</p>}
    </div>
  );
}

function IntelligentSummaryPanel({ data }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <p style={{ fontSize:14, lineHeight:1.75, color:'var(--text)', fontWeight:300, margin:0 }}>{data.summary}</p>
      {data.architectureStyle && (
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <Layers size={13} style={{ color:'var(--p2)', flexShrink:0 }} />
          <span style={{ fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--text3)' }}>Architecture:</span>
          <Tag color="#a78bfa">{data.architectureStyle}</Tag>
        </div>
      )}
      {data.techStack?.length > 0 && (
        <div>
          <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text3)', marginBottom:10 }}>Tech Stack</p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>{data.techStack.map((t,i) => <Tag key={i} color="var(--b2)">{t}</Tag>)}</div>
        </div>
      )}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        {data.keyDesignDecisions?.length > 0 && (
          <div>
            <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text3)', marginBottom:8 }}>Design Decisions</p>
            <ul style={{ listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column', gap:7 }}>
              {data.keyDesignDecisions.map((d,i) => (
                <li key={i} style={{ display:'flex', gap:9, fontSize:13 }}>
                  <span style={{ marginTop:6, width:5, height:5, borderRadius:'50%', background:'var(--p1)', flexShrink:0 }} />
                  <span style={{ color:'var(--text2)', lineHeight:1.6 }}>{d}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {data.onboardingTips?.length > 0 && (
          <div>
            <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text3)', marginBottom:8 }}>Onboarding Tips</p>
            <ul style={{ listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column', gap:7 }}>
              {data.onboardingTips.map((t,i) => (
                <li key={i} style={{ display:'flex', gap:9, fontSize:13 }}>
                  <span style={{ marginTop:6, width:5, height:5, borderRadius:'50%', background:'var(--teal)', flexShrink:0 }} />
                  <span style={{ color:'var(--text2)', lineHeight:1.6 }}>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {data.insights?.length > 0 && (
        <div>
          <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text3)', marginBottom:8 }}>Insights</p>
          <ul style={{ listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column', gap:7 }}>
            {data.insights.map((ins,i) => (
              <li key={i} style={{ display:'flex', gap:9, fontSize:13 }}>
                <span style={{ marginTop:6, width:5, height:5, borderRadius:'50%', background:'var(--b1)', flexShrink:0 }} />
                <span style={{ color:'var(--text2)', lineHeight:1.6 }}>{ins}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {data.codeQualitySignals?.length > 0 && (
        <div>
          <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text3)', marginBottom:8 }}>Code Quality</p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {data.codeQualitySignals.map((s,i) => (
              <span key={i} style={{ padding:'4px 11px', borderRadius:100, fontSize:11, background:'var(--card2)', border:'1px solid var(--border2)', color:'var(--text2)' }}>{s}</span>
            ))}
          </div>
        </div>
      )}
      {data.aiPowered === false && (
        <p style={{ fontSize:12, color:'var(--amber)', padding:'10px 13px', borderRadius:10, background:'rgba(251,191,36,0.08)', border:'1px solid rgba(251,191,36,0.2)', margin:0 }}>
          Set GEMINI_API_KEY in backend .env for full AI-powered analysis.
        </p>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   LANDING SECTIONS
───────────────────────────────────────────────────────────── */
function LandingHero({ onAnalyze }) {
  const [c, setC] = useState({ files:0, repos:0, time:'0.0', acc:0 });
  useEffect(() => {
    const T = { files:24800, repos:1200, time:2.4, acc:97 }, dur = 2000;
    let s = null;
    const fn = ts => {
      if (!s) s = ts;
      const p = Math.min((ts - s) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      setC({ files:Math.floor(e*T.files), repos:Math.floor(e*T.repos), time:(e*T.time).toFixed(1), acc:Math.floor(e*T.acc) });
      if (p < 1) requestAnimationFrame(fn);
    };
    const t = setTimeout(() => requestAnimationFrame(fn), 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <section style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:'120px 24px 80px', position:'relative', zIndex:1, background:'#fff' }}>
      <div className="reveal" style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'6px 16px', borderRadius:24, border:'1px solid var(--border)', background:'var(--surface)', fontSize:13, color:'var(--text2)', fontWeight:500, marginBottom:32 }}>
        <span style={{ width:5, height:5, borderRadius:'50%', background:'var(--primary)', display:'inline-block' }}></span>
        Powered by Gemini 2.5 Flash
      </div>

      <h1 className="reveal d1" style={{ fontSize:'clamp(36px, 6vw, 68px)', fontWeight:700, color:'var(--text)', lineHeight:1.1, letterSpacing:'-0.02em', marginBottom:24, maxWidth:900 }}>
        Understand any repository<br/>
        <span style={{ color:'var(--primary)' }}>instantly</span>
      </h1>

      <p className="reveal d2" style={{ maxWidth:600, color:'var(--text2)', fontSize:18, lineHeight:1.6, fontWeight:400, marginBottom:48 }}>
        Paste a GitHub URL. Get instant architectural maps, critical files, execution flows, and AI-powered insights without setup.
      </p>

      <div className="reveal d3" style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap', marginBottom:80 }}>
        <PrimaryBtn onClick={onAnalyze}>Start analyzing <ArrowRight size={16} /></PrimaryBtn>
        <SecondaryBtn onClick={() => window.open('https://github.com', '_blank')}>Learn more</SecondaryBtn>
      </div>

      <div className="reveal d4" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(120px, 1fr))', gap:32, maxWidth:600 }}>
        {[
          { v: c.files.toLocaleString()+'+', l:'Files analyzed' },
          { v: c.repos.toLocaleString()+'+', l:'Repos processed' },
          { v: c.time+'s',                   l:'Avg analysis' },
          { v: c.acc+'%',                    l:'Accuracy' },
        ].map(({ v, l }) => (
          <div key={l} style={{ textAlign:'center' }}>
            <div style={{ fontSize:28, fontWeight:700, color:'var(--primary)', marginBottom:8 }}>{v}</div>
            <div style={{ fontSize:12, color:'var(--text3)', fontWeight:500 }}>{l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function LandingFeatures() {
  return (
    <section id="features" style={{ padding:'100px 24px', position:'relative', zIndex:1, background:'var(--surface)' }}>
      <div style={{ maxWidth:1200, margin:'0 auto' }}>
        <div className="reveal" style={{ marginBottom:64, textAlign:'center' }}>
          <span style={{ fontSize:12, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--primary)', marginBottom:12, display:'block' }}>Capabilities</span>
          <h2 style={{ fontSize:'clamp(28px, 4vw, 48px)', fontWeight:700, letterSpacing:'-0.02em', color:'var(--text)', lineHeight:1.2, marginBottom:16 }}>
            Everything you need to understand a codebase
          </h2>
          <p style={{ color:'var(--text2)', fontSize:16, fontWeight:400, maxWidth:500, lineHeight:1.6, margin:'0 auto' }}>
            From raw GitHub URLs to deep architectural insights.
          </p>
        </div>
        <div className="feat-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(320px, 1fr))', gap:24 }}>
          {FEATURES.map((f, i) => (
            <GlassCard key={i} style={{ padding:'32px 28px' }}>
              <div className={`reveal d${(i % 5) + 1}`}>
                <div style={{ width:48, height:48, borderRadius:10, background:f.color+'15', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, marginBottom:20 }}>{f.icon}</div>
                <h3 style={{ fontSize:18, fontWeight:700, color:'var(--text)', marginBottom:10, letterSpacing:'-0.01em' }}>{f.title}</h3>
                <p style={{ fontSize:14, color:'var(--text2)', lineHeight:1.6, marginBottom:20 }}>{f.desc}</p>
                <Tag color={f.color}>{f.tag}</Tag>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}

function LandingHowItWorks() {
  return (
    <section id="how-it-works" style={{ padding:'100px 24px', position:'relative', zIndex:1, background:'#fff' }}>
      <div style={{ maxWidth:1200, margin:'0 auto' }}>
        <div className="how-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:80, alignItems:'center' }}>
          <div>
            <div className="reveal" style={{ fontSize:12, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--primary)', marginBottom:12 }}>How it works</div>
            <h2 className="reveal d1" style={{ fontSize:'clamp(28px, 3.5vw, 44px)', fontWeight:700, letterSpacing:'-0.02em', color:'var(--text)', lineHeight:1.2, marginBottom:48 }}>
              From URL to insight<br/>in five steps
            </h2>
            {[
              { n:1, t:'Paste a GitHub URL',    d:'Any public repository — paste the URL and click Analyze.' },
              { n:2, t:'Repository cloned',   d:'Shallow clone pulled to a temp directory.' },
              { n:3, t:'Static analysis runs',   d:'Parser, dependency mapper, and entry detector run in parallel.' },
              { n:4, t:'Critical files mapped',  d:'Role patterns identify key files; flow tracer maps requests.' },
              { n:5, t:'AI summary generated',   d:'Gemini generates architecture, insights, and onboarding tips.' },
            ].map((step, i) => (
              <div key={i} className={`reveal d${i + 1}`} style={{ display:'flex', gap:20, padding:'20px 0', borderBottom:i < 4 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ width:40, height:40, borderRadius:8, background:'var(--surface)', border:'2px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:16, color:'var(--primary)', flexShrink:0, transition:'all 0.3s ease' }}>{step.n}</div>
                <div>
                  <div style={{ fontWeight:700, fontSize:16, color:'var(--text)', marginBottom:4 }}>{step.t}</div>
                  <div style={{ fontSize:14, color:'var(--text2)', lineHeight:1.6 }}>{step.d}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="reveal d2" style={{ background:'#fff', border:'2px solid var(--border)', borderRadius:12, padding:24, position:'relative', overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20 }}>
              {['#ff5f57','#febc2e','#28c840'].map(c => <div key={c} style={{ width:12, height:12, borderRadius:'50%', background:c }} />)}
              <span style={{ marginLeft:8, fontSize:12, color:'var(--text3)', fontFamily:'monospace', fontWeight:500 }}>aivya analysis</span>
            </div>
            <div style={{ fontFamily:'monospace', fontSize:12, lineHeight:2, color:'var(--text3)' }}>
              {[
                { c:'#2563eb', p:'$ ', t:'aivya analyze github.com/user/repo' },
                { c:'#2563eb', p:'→ ', t:'Cloning repository...' },
                { c:'#2563eb', p:'→ ', t:'Running parallel analyzers...' },
                { c:'#9ca3af', p:'✓ ', t:'148 files scanned' },
                { c:'#9ca3af', p:'✓ ', t:'12 critical files found' },
                { c:'#9ca3af', p:'✓ ', t:'6 flows traced' },
                { c:'#10b981', p:'✓ ', t:'Analysis complete · 2.4s' },
              ].map(({ c, p, t }, i) => (
                <div key={i} className="t-line" style={{ display:'flex', gap:10, color:c }}>
                  <span style={{ fontWeight:700, flexShrink:0 }}>{p}</span>
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   ANALYZER SECTION (replaces dashboard — lives on the landing page)
───────────────────────────────────────────────────────────── */
function AnalyzerSection({ addToast }) {
  const [repoUrl, setRepoUrl]           = useState('');
  const [analyzing, setAnalyzing]       = useState(false);
  const [currentStep, setCurrentStep]   = useState(-1);
  const [analysisError, setAnalysisError] = useState(null);
  const [analysisResponse, setAnalysisResponse] = useState(null);
  const [criticalData, setCriticalData] = useState(null);
  const [flowData, setFlowData]         = useState(null);
  const [summaryData, setSummaryData]   = useState(null);
  const [summaryError, setSummaryError] = useState(null);

  const abortRef = useRef(null);
  const genRef   = useRef(0);

  async function handleAnalyze() {
    const trimmed = repoUrl.trim();
    if (!trimmed) { setAnalysisError('Please enter a GitHub repository URL.'); return; }

    setAnalyzing(true); setCurrentStep(0);
    setAnalysisError(null); setAnalysisResponse(null);
    setCriticalData(null); setFlowData(null);
    setSummaryData(null); setSummaryError(null);

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const gen = ++genRef.current;

    try {
      // Step 1 — clone
      const r1 = await fetch(ANALYZE_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ repoUrl:trimmed }), signal:ctrl.signal });
      if (gen !== genRef.current) return;
      const d1 = await r1.json().catch(() => ({}));
      if (!r1.ok || d1.success === false) { setAnalysisError(d1.error || `Failed (${r1.status})`); return; }

      const { localPath, repoName } = d1;

      // Step 2 — enrich
      setCurrentStep(1);
      if (localPath) {
        const [er, dr] = await Promise.all([
          fetch(ENTRYPOINT_URL,   { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ localPath }), signal:ctrl.signal }).catch(() => null),
          fetch(DEPENDENCIES_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ localPath }), signal:ctrl.signal }).catch(() => null),
        ]);
        if (gen !== genRef.current) return;
        const ed = er ? await er.json().catch(() => ({})) : {};
        const dd = dr ? await dr.json().catch(() => ({})) : {};
        setAnalysisResponse({
          ...d1,
          entryPoint: er?.ok && ed?.entrypoint
            ? { primary:ed.entrypoint, context:ed.source ? `Detected from ${ed.source}.` : '' }
            : { primary:'—', context:'Not detected.' },
          dependencies: dr?.ok && dd
            ? { hasManifest:!!dd.hasManifest, dependencies:dd.dependencies||{}, devDependencies:dd.devDependencies||{} }
            : {},
        });
      }

      // Step 3 — critical files
      setCurrentStep(2);
      if (localPath) {
        const cr = await fetch(CRITICAL_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ localPath }), signal:ctrl.signal }).catch(() => null);
        if (gen !== genRef.current) return;
        if (cr?.ok) { const cd = await cr.json().catch(() => null); if (cd?.success) setCriticalData(cd); }
      }

      // Step 4 — flow
      setCurrentStep(3);
      if (localPath) {
        const fr = await fetch(FLOW_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ localPath }), signal:ctrl.signal }).catch(() => null);
        if (gen !== genRef.current) return;
        if (fr?.ok) { const fd = await fr.json().catch(() => null); if (fd?.success) setFlowData(fd); }
      }

      // Step 5 — AI summary
      setCurrentStep(4);
      if (localPath && repoName) {
        const sr = await fetch(INTEL_SUMMARY_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ localPath, repoName }), signal:ctrl.signal });
        if (gen !== genRef.current) return;
        const sd = await sr.json().catch(() => ({}));
        if (sr.ok && sd.success) {
          setSummaryData(sd);
          if (!sd.aiPowered) setSummaryError('AI features require GEMINI_API_KEY in backend .env');
        } else {
          setSummaryError(sd.error || `Summary failed (${sr.status})`);
        }
        addToast('Analysis complete!');
        fetch(CLEANUP_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ localPath }) }).catch(() => {});
      }
    } catch (err) {
      if (err?.name === 'AbortError' || gen !== genRef.current) return;
      setAnalysisError(err.message || 'Network error — is the backend running?');
    } finally {
      if (gen === genRef.current) { setAnalyzing(false); setCurrentStep(-1); }
    }
  }

  const hasResults = !analyzing && (analysisResponse || criticalData || flowData || summaryData);

  return (
    <section id="analyze" style={{ padding:'100px 24px', position:'relative', zIndex:1, background:'var(--surface)' }}>
      <div style={{ maxWidth:1200, margin:'0 auto' }}>
        <div className="reveal" style={{ marginBottom:48, textAlign:'center' }}>
          <span style={{ fontSize:12, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--primary)', marginBottom:12, display:'block' }}>Try it now</span>
          <h2 style={{ fontSize:'clamp(28px, 4vw, 48px)', fontWeight:700, letterSpacing:'-0.02em', color:'var(--text)', lineHeight:1.2 }}>
            Analyze any repository
          </h2>
        </div>

        {/* URL input */}
        <div className="reveal" style={{ background:'#fff', border:'2px solid var(--border)', borderRadius:12, padding:'16px 20px', marginBottom:24, display:'flex', gap:12, alignItems:'center', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ width:36, height:36, borderRadius:8, background:'var(--primary)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Github size={16} style={{ color:'#fff' }} />
          </div>
          <input
            type="url"
            placeholder="https://github.com/owner/repository"
            value={repoUrl}
            onChange={e => setRepoUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !analyzing && handleAnalyze()}
            style={{ flex:1, background:'none', border:'none', outline:'none', fontSize:15, color:'var(--text)', fontFamily:'inherit' }}
          />
          <button onClick={handleAnalyze} disabled={analyzing}
            style={{ padding:'10px 24px', borderRadius:8, fontWeight:700, background:analyzing ? 'var(--card)' : 'var(--primary)', color:analyzing ? 'var(--text2)' : '#fff', border:'none', cursor:analyzing ? 'not-allowed' : 'pointer', transition:'all 0.2s ease', flexShrink:0, boxShadow:'0 2px 8px rgba(37, 99, 235, 0.2)', opacity:analyzing ? 0.6 : 1, display:'flex', alignItems:'center', gap:8, fontSize:14, fontWeight:700 }}
          >
            {analyzing ? <><Spinner /> Analyzing…</> : <>Analyze <ArrowRight size={14} /></>}
          </button>
        </div>

        {/* Step progress */}
        {analyzing && (
          <div style={{ background:'#fff', border:'2px solid var(--border)', borderRadius:12, padding:'20px 24px', marginBottom:24 }}>
            <StepProgress currentStep={currentStep} />
          </div>
        )}

        {/* Error */}
        {analysisError && (
          <div style={{ padding:'12px 16px', borderRadius:8, background:'#fef2f2', border:'2px solid #fecaca', color:'#dc2626', fontSize:14, fontWeight:500, display:'flex', alignItems:'center', gap:10, marginBottom:22 }}>
            <span style={{ width:5, height:5, borderRadius:'50%', background:'#dc2626', flexShrink:0 }} />
            {analysisError}
          </div>
        )}

        {/* Empty state */}
        {!hasResults && !analyzing && !analysisError && (
          <div style={{ textAlign:'center', padding:'64px 20px', background:'#fff', border:'2px solid var(--border)', borderRadius:12 }}>
            <Github size={32} style={{ color:'var(--text3)', margin:'0 auto 16px', display:'block', opacity:0.5 }} />
            <p style={{ color:'var(--text2)', fontSize:16, fontWeight:400, margin:0 }}>Enter a repository URL above to begin analysis.</p>
            <p style={{ color:'var(--text3)', fontSize:14, marginTop:8 }}>Supports any public GitHub repository</p>
          </div>
        )}

        {/* Results */}
        {hasResults && (
          <div style={{ display:'flex', flexDirection:'column', gap:24, animation:'fadeUp 0.5s ease' }}>

            {/* B3 — Intelligent summary */}
            {summaryData && (
              <ResultCard title="Repository Summary" icon={Sparkles} accent="var(--primary)">
                <IntelligentSummaryPanel data={summaryData} />
              </ResultCard>
            )}
            {summaryError && !summaryData && (
              <div style={{ padding:'12px 16px', borderRadius:8, background:'#fffbeb', border:'2px solid #fde68a', color:'#d97706', fontSize:14, fontWeight:500 }}>{summaryError}</div>
            )}

            {/* B1 + B2 */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(340px, 1fr))', gap:24 }}>
              {criticalData && (
                <ResultCard title="Critical Files" icon={ShieldAlert} accent="var(--error)">
                  <CriticalFilesPanel data={criticalData} />
                </ResultCard>
              )}
              {flowData && (
                <ResultCard title="Execution Flow" icon={GitBranch} accent="var(--info)">
                  <ExecutionFlowPanel data={flowData} />
                </ResultCard>
              )}
            </div>

            {/* Folder + Entry + Deps */}
            {analysisResponse && (() => {
              const tree    = analysisResponse.folderStructure;
              const ch      = tree?.children || [];
              const folders = ch.filter(n => n?.type === 'folder').slice(0, 10);
              const files   = ch.filter(n => n?.type === 'file').slice(0, 6);
              const deps    = analysisResponse.dependencies || {};
              const prod    = deps.dependencies    ? Object.entries(deps.dependencies).map(([n,v]) => ({ name:n, ver:String(v) })) : [];
              const dev     = deps.devDependencies ? Object.entries(deps.devDependencies).map(([n,v]) => ({ name:n, ver:String(v) })) : [];
              return (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:24 }}>
                  <ResultCard title="Folder Architecture" icon={BookOpen} accent="var(--primary)">
                    {folders.length === 0 && files.length === 0
                      ? <p style={{ fontSize:14, color:'var(--text2)' }}>No folder data available.</p>
                      : <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                          {folders.map((n,i) => (
                            <div key={i} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 12px' }}>
                              <p style={{ fontSize:11, fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase', color:'var(--primary)', marginBottom:2 }}>{n.name}</p>
                              <p style={{ fontSize:12, color:'var(--text3)', margin:0 }}>{Array.isArray(n.children) ? n.children.length : 0} items</p>
                            </div>
                          ))}
                          {files.length > 0 && (
                            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 12px' }}>
                              <p style={{ fontSize:11, fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase', color:'var(--primary)', marginBottom:3 }}>Root files</p>
                              <p style={{ fontSize:12, color:'var(--text2)', fontFamily:'monospace', margin:0 }}>{files.map(f => f.name).join(', ')}</p>
                            </div>
                          )}
                        </div>
                    }
                  </ResultCard>

                  <ResultCard title="Entry Point" icon={Sparkles} accent="var(--primary)">
                    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, padding:'12px 14px', marginBottom:12 }}>
                      <p style={{ fontFamily:'monospace', fontSize:13, fontWeight:700, color:'var(--text)', wordBreak:'break-all', margin:0 }}>
                        {analysisResponse.entryPoint?.primary || '—'}
                      </p>
                    </div>
                    {analysisResponse.entryPoint?.context && (
                      <div style={{ display:'flex', gap:8 }}>
                        <ArrowRight size={11} style={{ color:'var(--text3)', flexShrink:0, marginTop:2 }} />
                        <p style={{ fontSize:13, color:'var(--text3)', lineHeight:1.6, fontStyle:'italic', margin:0 }}>{analysisResponse.entryPoint.context}</p>
                      </div>
                    )}
                  </ResultCard>

                  <ResultCard title="Dependencies" icon={Cpu} accent="var(--warning)">
                    {!deps.hasManifest
                      ? <p style={{ fontSize:14, color:'var(--text2)' }}>No package.json detected.</p>
                      : <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                          {[['Production', prod], ['Development', dev]].map(([lbl, items]) => (
                            <div key={lbl}>
                              <p style={{ fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--text3)', marginBottom:8 }}>{lbl}</p>
                              {items.length === 0
                                ? <p style={{ fontSize:13, color:'var(--text3)', margin:0 }}>None</p>
                                : <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                                    {items.slice(0, 12).map((d,i) => (
                                      <span key={i} style={{ fontFamily:'monospace', fontSize:12, padding:'3px 8px', borderRadius:5, background:'var(--card)', border:'1px solid var(--border)', color:'var(--text2)' }}>{d.name}</span>
                                    ))}
                                    {items.length > 12 && <span style={{ fontSize:12, color:'var(--text3)', padding:'3px 6px' }}>+{items.length - 12}</span>}
                                  </div>
                              }
                            </div>
                          ))}
                        </div>
                    }
                  </ResultCard>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   NAVBAR
───────────────────────────────────────────────────────────── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, height:64, padding:'0 24px', display:'flex', alignItems:'center', justifyContent:'space-between', background:scrolled ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.5)', backdropFilter:'blur(12px)', borderBottom:`1px solid ${scrolled ? 'var(--border)' : 'transparent'}`, transition:'all 0.3s ease', animation:'slideDown 0.5s ease both' }}>
      <button onClick={() => window.scrollTo({ top:0, behavior:'smooth' })} style={{ display:'flex', alignItems:'center', gap:10, background:'none', border:'none', cursor:'pointer', padding:0 }}>
        <div style={{ width:32, height:32, borderRadius:6, background:'var(--primary)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:15, color:'#fff', boxShadow:'0 2px 8px rgba(37, 99, 235, 0.3)' }}>A</div>
        <span style={{ fontWeight:700, fontSize:16, color:'var(--text)', letterSpacing:'-0.01em' }}>Aivya</span>
      </button>
      <div style={{ display:'flex', alignItems:'center', gap:2 }}>
        <NavLink onClick={() => document.getElementById('features')?.scrollIntoView({ behavior:'smooth' })}>Features</NavLink>
        <NavLink onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior:'smooth' })}>How it works</NavLink>
        <PrimaryBtn onClick={() => document.getElementById('analyze')?.scrollIntoView({ behavior:'smooth' })} style={{ padding:'8px 20px', fontSize:14, marginLeft:8 }}>
          Analyze
        </PrimaryBtn>
      </div>
    </nav>
  );
}

/* ─────────────────────────────────────────────────────────────
   ROOT APP — single page, no auth, no routing
───────────────────────────────────────────────────────────── */
export default function App() {
  const [toasts, setToasts] = useState([]);

  useReveal();
  useScrollProgress();

  function addToast(msg) {
    const id = Date.now();
    setToasts(t => [...t, { id, msg }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }

  function scrollToAnalyze() {
    document.getElementById('analyze')?.scrollIntoView({ behavior:'smooth' });
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_STYLES }} />
      <div id="aivya-pb" className="progress-bar" />

      <Navbar />

      <div style={{ position:'relative', zIndex:1 }}>
        <LandingHero onAnalyze={scrollToAnalyze} />
        <LandingFeatures />
        <LandingHowItWorks />
        <AnalyzerSection addToast={addToast} />

        {/* Footer */}
        <footer style={{ padding:'48px 24px 24px', borderTop:'1px solid var(--border)', background:'var(--surface)', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:24 }}>
          <div>
            <span style={{ fontSize:14, color:'var(--text)' }}>© 2025 <strong>Aivya</strong> · Built for developers</span>
          </div>
          <div style={{ display:'flex', gap:32 }}>
            {['GitHub', 'Docs', 'API'].map(l => (
              <NavLink key={l} onClick={() => {}}>
                <span style={{ fontSize:14, fontWeight:500 }}>{l}</span>
              </NavLink>
            ))}
          </div>
        </footer>
      </div>

      <div className="toast-wrap">
        {toasts.map(t => <Toast key={t.id} msg={t.msg} />)}
      </div>
    </>
  );
}