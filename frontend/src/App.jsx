import { ArrowRight, Github, Lock, Moon, Sun, Sparkles, BookOpen, Lightbulb, Cpu } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const BACKEND_BASE = 'https://wings-aivya.vercel.app';
const ANALYZE_URL = `${BACKEND_BASE}/api/analyze`;
const SUMMARY_URL = `${BACKEND_BASE}/api/summary`;

function FadeIn({ children }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <div className={`transition-opacity duration-700 ease-out ${show ? 'opacity-100' : 'opacity-0'}`}>
      {children}
    </div>
  );
}

function DetailText({ text, theme }) {
  const parts = String(text).split(/(`[^`]+`)/g);
  const textClass = theme === 'dark' ? 'text-slate-300' : 'text-slate-700';
  const codeClass =
    theme === 'dark'
      ? 'mx-0.5 rounded border border-slate-800 bg-slate-950/60 px-1.5 py-0.5 font-mono text-xs text-slate-200'
      : 'mx-0.5 rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-800';
  return (
    <p className={`leading-relaxed ${textClass}`}>
      {parts.map((part, i) =>
        part.startsWith('`') && part.endsWith('`') ? (
          <code key={i} className={codeClass}>
            {part.slice(1, -1)}
          </code>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </p>
  );
}

function DependencyFlow({ label, items, theme }) {
  const muted = theme === 'dark' ? 'text-slate-400' : 'text-slate-600';
  const strong = theme === 'dark' ? 'text-slate-300' : 'text-slate-700';
  const chip =
    theme === 'dark'
      ? 'inline-flex items-center rounded-md border border-slate-800 bg-slate-950/40 px-2.5 py-1.5 text-xs shadow-sm'
      : 'inline-flex items-center rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs shadow-sm';

  if (!items.length) {
    return (
      <p className={`text-sm ${muted}`}>
        <span className={`font-medium ${strong}`}>{label}:</span> none listed.
      </p>
    );
  }

  return (
    <div>
      <p className={`text-xs font-semibold uppercase tracking-wider ${muted}`}>{label}</p>
      <div className="mt-2.5 flex flex-wrap items-center gap-y-2" role="list" aria-label={`${label} dependencies`}>
        {items.map((dep, index) => (
          <span key={dep.name} className="inline-flex items-center" role="listitem">
            {index > 0 && (
              <span className={`select-none px-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-400'}`} aria-hidden>
                {'->'}
              </span>
            )}
            <span className={chip}>
              <span className={`font-medium ${theme === 'dark' ? 'text-slate-200' : 'text-slate-900'}`}>{dep.name}</span>
              <span className={`ml-2 font-mono ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{dep.version}</span>
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

function getAnalysisView(response) {
  if (!response) return null;
  if (Array.isArray(response.folderStructure)) {
    return {
      folderStructure: response.folderStructure,
      entryPoint: response.entryPoint || { primary: '—', context: 'No entry point information included in this response.' },
      dependencies: response.dependencies || { hasManifest: false, production: [], development: [] },
    };
  }
  const info = response.info;
  if (info && typeof info === 'object') {
    const branch = info.default_branch || 'main';
    return {
      folderStructure: [
        { heading: 'Repository', detail: info.full_name ? `${info.full_name}${info.description ? ` - ${info.description}` : ''}` : 'Repository metadata only (legacy response).' },
        { heading: 'Default branch', detail: `Active branch is \`${branch}\`. Clone or browse this branch to inspect files.` },
      ],
      entryPoint: {
        primary: info.html_url && branch ? `${info.html_url}/tree/${branch}` : info.html_url || '—',
        context: 'From GitHub repository metadata (upgrade backend for richer analysis).',
      },
      dependencies: { hasManifest: false, production: [], development: [] },
    };
  }
  return { folderStructure: [], entryPoint: { primary: '—', context: 'No recognizable analysis payload.' }, dependencies: { hasManifest: false, production: [], development: [] } };
}

function ResultsCard({ title, icon: Icon, children, theme }) {
  const cardClass =
    theme === 'dark'
      ? 'rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-xl p-6'
      : 'rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl';
  const titleClass = theme === 'dark' ? 'text-slate-200/90' : 'text-slate-700';
  const iconClass = theme === 'dark' ? 'text-blue-400' : 'text-blue-600';

  return (
    <section className={cardClass}>
      <div className="flex items-center gap-2.5 mb-4">
        {Icon && <Icon className={`h-4 w-4 ${iconClass}`} />}
        <h3 className={`text-sm font-semibold uppercase tracking-wider ${titleClass}`}>{title}</h3>
      </div>
      <div>{children}</div>
    </section>
  );
}

export default function App() {
  const [theme, setTheme] = useState('dark');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(null);

  const [repoUrl, setRepoUrl] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const [analysisResponse, setAnalysisResponse] = useState(null);
  const [summaryResponse, setSummaryResponse] = useState(null);

  const fetchAbortRef = useRef(null);
  const scanGenerationRef = useRef(0);

  const isDark = theme === 'dark';
  const wrapperClass = isDark
    ? 'bg-[#020617] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent text-white'
    : 'bg-slate-50 text-slate-900';
  const glassClass = isDark
    ? 'bg-slate-900/40 backdrop-blur-xl border border-white/10'
    : 'bg-white border border-slate-200 shadow-2xl';
  const inputClass = isDark
    ? 'w-full rounded-xl bg-slate-950/50 border border-slate-800 text-white p-4 placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all'
    : 'w-full rounded-xl bg-white border border-slate-300 text-slate-900 p-4 placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all';
  const buttonShadow = isDark ? 'shadow-blue-600/20 hover:shadow-[0_0_20px_rgba(37,99,235,0.6)]' : 'shadow-blue-500/30 hover:shadow-[0_0_18px_rgba(37,99,235,0.35)]';
  const mutedText = isDark ? 'text-slate-400' : 'text-slate-600';
  const titleText = isDark ? 'text-white' : 'text-slate-900';

  function handleLogin() {
    setLoginError(null);
    if (!email.trim()) return setLoginError('Email is required.');
    if (!password) return setLoginError('Password is required.');
    setIsLoggedIn(true);
  }

  function handleLogout() {
    setIsLoggedIn(false);
    setLoginError(null);
    setAnalysisError(null);
    setAnalysisResponse(null);
    setSummaryResponse(null);
    setAnalyzing(false);
    fetchAbortRef.current?.abort();
  }

  async function handleAnalyze() {
    const trimmed = repoUrl.trim();
    if (!trimmed) {
      setAnalysisError('Please enter a GitHub repository URL.');
      setAnalysisResponse(null);
      setSummaryResponse(null);
      return;
    }

    setAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResponse(null);
    setSummaryResponse(null);

    fetchAbortRef.current?.abort();
    const controller = new AbortController();
    fetchAbortRef.current = controller;
    const scanId = ++scanGenerationRef.current;

    try {
      // Step 1: Analyze Repo
      const analyzeRes = await fetch(ANALYZE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl: trimmed }),
        signal: controller.signal,
      });

      if (scanId !== scanGenerationRef.current) return;
      const analyzeData = await analyzeRes.json().catch(() => ({}));

      if (!analyzeRes.ok) {
        setAnalysisError(typeof analyzeData.error === 'string' ? analyzeData.error : `Request failed (${analyzeRes.status})`);
        return;
      }

      setAnalysisResponse(analyzeData);

      // Step 2: Get AI Summary
      const { localPath, repoName } = analyzeData;
      if (localPath && repoName) {
        const summaryRes = await fetch(SUMMARY_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ localPath, repoName }),
          signal: controller.signal,
        });

        if (scanId !== scanGenerationRef.current) return;
        const summaryData = await summaryRes.json().catch(() => ({}));

        if (summaryRes.ok && summaryData.success) {
          setSummaryResponse(summaryData);
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      if (scanId !== scanGenerationRef.current) return;
      setAnalysisError(err instanceof Error ? err.message : 'Network error. Is the backend running?');
    } finally {
      if (scanId === scanGenerationRef.current) setAnalyzing(false);
    }
  }

  const analysis = !analyzing && !analysisError && analysisResponse ? getAnalysisView(analysisResponse) : null;

  return (
    <div className={`min-h-screen transition-colors duration-500 ${wrapperClass}`}>
      <div className="fixed top-6 right-8 z-50 flex items-center gap-6">
        {isLoggedIn && (
          <button
            type="button"
            onClick={handleLogout}
            className="text-slate-500 hover:text-blue-500 font-medium transition-all text-sm"
          >
            Sign Out
          </button>
        )}

        <button
          type="button"
          onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-all border ${isDark ? 'bg-slate-900 border-white/10 shadow-lg text-slate-200 hover:text-white' : 'bg-white border-slate-200 shadow-sm text-slate-700 hover:text-slate-900'}`}
          aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          <span>{isDark ? 'Light' : 'Dark'}</span>
        </button>
      </div>

      {!isLoggedIn ? (
        <main className="flex min-h-screen items-center justify-center p-4">
          <section className={`w-full max-w-md p-10 rounded-[2.5rem] ${glassClass}`}>
            <div className="flex flex-col items-center text-center">
              <Github className={`h-7 w-7 ${isDark ? 'text-white/90' : 'text-slate-900'}`} aria-hidden />
              <h1 className={`mt-4 text-xl font-bold tracking-tight sm:text-2xl ${titleText} ${isDark ? 'drop-shadow-[0_0_16px_rgba(59,130,246,0.45)]' : ''}`}>
                Aivya Insight
              </h1>
              <p className={`mt-2 text-sm font-medium ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Developer Access</p>
            </div>

            <form
              className="mt-8 space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                handleLogin();
              }}
            >
              <input id="email" type="email" autoComplete="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />

              <div className="relative">
                <Lock className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} aria-hidden />
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClass} pl-12`}
                />
              </div>

              {loginError && <p className="text-sm text-red-500">{loginError}</p>}

              <button
                type="submit"
                onClick={() => handleLogin()}
                className={`w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95 ${buttonShadow}`}
              >
                Login
              </button>
            </form>
          </section>
        </main>
      ) : (
        <FadeIn>
          <main className="min-h-screen flex flex-col items-center justify-center p-8">
            <div className="w-full max-w-5xl">
              <div className="text-center mb-12">
                <Github className={`mx-auto h-8 w-8 ${isDark ? 'text-white/90' : 'text-slate-900'}`} aria-hidden />
                <h1 className={`mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl ${titleText} ${isDark ? 'drop-shadow-[0_0_20px_rgba(59,130,246,0.65)]' : ''}`}>
                  Aivya Insight
                </h1>
                <p className={`mt-3 text-base font-medium sm:text-lg ${mutedText}`}>Advanced Repo Analyzer | Automated Architectural Mapping</p>
              </div>

              <div className="mx-auto w-full max-w-3xl space-y-8">
                <section className={`p-10 rounded-[2.5rem] ${glassClass}`}>
                  <div className="flex flex-col items-center">
                    <input
                      type="url"
                      placeholder="Paste GitHub repo URL here"
                      value={repoUrl}
                      onChange={(e) => setRepoUrl(e.target.value)}
                      className={`${inputClass} w-full p-5 text-base rounded-2xl`}
                    />
                    <button
                      type="button"
                      onClick={handleAnalyze}
                      disabled={analyzing}
                      className={`mt-6 w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-5 px-12 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${buttonShadow}`}
                    >
                      {analyzing ? (
                        <>
                          <div className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full" />
                          <span>Generating AI Insight…</span>
                        </>
                      ) : (
                        <>
                          <span>Analyze Repository</span>
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                </section>

                <div className="space-y-6">
                  {analysisError && (
                    <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                      {analysisError}
                    </div>
                  )}

                  {!analysis && !analyzing && !analysisError && (
                    <div className={`p-10 rounded-[2.5rem] text-center ${glassClass}`}>
                      <div className="flex flex-col items-center gap-3">
                        <Github className={`h-8 w-8 opacity-20 ${isDark ? 'text-white' : 'text-slate-900'}`} />
                        <p className={`text-sm font-medium ${mutedText}`}>Enter a repository URL above to begin the architectural mapping.</p>
                      </div>
                    </div>
                  )}

                  {analysis && (
                    <FadeIn>
                      <div className="space-y-6">
                        {/* AI Summary Section */}
                        {summaryResponse && (
                          <ResultsCard title="AI Repository Summary" icon={Sparkles} theme={theme}>
                            <div className="space-y-6">
                              <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                                {summaryResponse.summary}
                              </p>
                              
                              <div className="grid gap-6 sm:grid-cols-2">
                                <div>
                                  <div className="flex items-center gap-2 mb-3">
                                    <Lightbulb className="h-3.5 w-3.5 text-yellow-500" />
                                    <span className={`text-xs font-bold uppercase tracking-widest ${mutedText}`}>Key Insights</span>
                                  </div>
                                  <ul className="space-y-2.5">
                                    {summaryResponse.insights?.map((insight, i) => (
                                      <li key={i} className="flex gap-3 text-sm">
                                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-blue-500" />
                                        <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>{insight}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                <div>
                                  <div className="flex items-center gap-2 mb-3">
                                    <Cpu className="h-3.5 w-3.5 text-purple-500" />
                                    <span className={`text-xs font-bold uppercase tracking-widest ${mutedText}`}>Tech Stack</span>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {summaryResponse.techStack?.map((tech, i) => (
                                      <span 
                                        key={i} 
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-tight ${
                                          isDark 
                                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                                            : 'bg-blue-50 border border-blue-100 text-blue-700'
                                        }`}
                                      >
                                        {tech}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </ResultsCard>
                        )}

                        <div className="grid gap-6 md:grid-cols-3">
                          <ResultsCard title="Folder Architecture" icon={BookOpen} theme={theme}>
                            {analysis.folderStructure.length === 0 ? (
                              <p className={`text-sm ${mutedText}`}>No folder explanations available.</p>
                            ) : (
                              <ul className="space-y-3 p-0 list-none m-0">
                                {analysis.folderStructure.map((item, idx) => (
                                  <li key={`${item.heading}-${idx}`} className={`${isDark ? 'rounded-xl border border-white/5 bg-slate-950/40 p-4' : 'rounded-xl border border-slate-200 bg-slate-50 p-4'}`}>
                                    <p className={`text-xs font-bold uppercase tracking-widest mb-1.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{item.heading}</p>
                                    <DetailText text={item.detail} theme={theme} />
                                  </li>
                                ))}
                              </ul>
                            )}
                          </ResultsCard>

                          <ResultsCard title="System Entry Point" icon={Sparkles} theme={theme}>
                            <div className={`${isDark ? 'rounded-xl border border-white/5 bg-slate-950/40 p-4' : 'rounded-xl border border-slate-200 bg-slate-50 p-4'}`}>
                              <p className={`break-all font-mono text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{analysis.entryPoint.primary}</p>
                            </div>
                            {analysis.entryPoint.context && (
                              <div className="mt-4 flex gap-3 px-1">
                                <ArrowRight className={`h-3 w-3 mt-0.5 shrink-0 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                                <p className={`text-xs leading-relaxed italic ${mutedText}`}>{analysis.entryPoint.context}</p>
                              </div>
                            )}
                          </ResultsCard>

                          <ResultsCard title="Dependency Graph" icon={Cpu} theme={theme}>
                            {!analysis.dependencies.hasManifest ? (
                              <p className={`text-sm leading-relaxed ${mutedText}`}>
                                No root <span className="font-mono text-xs underline decoration-blue-500/40 underline-offset-4">package.json</span> detected.
                              </p>
                            ) : (
                              <div className="space-y-6">
                                <DependencyFlow label="Production" items={analysis.dependencies.production} theme={theme} />
                                <DependencyFlow label="Development" items={analysis.dependencies.development} theme={theme} />
                              </div>
                            )}
                          </ResultsCard>
                        </div>
                      </div>
                    </FadeIn>
                  )}
                </div>
              </div>
            </div>
          </main>
        </FadeIn>
      )}
    </div>
  );
}

