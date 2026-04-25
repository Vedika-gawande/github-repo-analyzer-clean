const { analyzeFolderStructure, detectEntryPoint } = require('../services/parser');
const { mapDependencies } = require('../services/dependencyMapper');
const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * B3 — Intelligent Repository Summary
 * Generates a high-level summary covering:
 *   - Tech stack detection
 *   - Architecture style (MVC, microservices, monolith, serverless, etc.)
 *   - Key design decisions
 *   - Code quality signals
 *   - Recommended entry points for new devs
 */

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

const IGNORED = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'coverage']);

function detectArchitectureSignals(structure, deps) {
  const paths = structure.map(e => e.path.toLowerCase());
  const allDeps = Object.keys(deps.allDependencies || {});
  const signals = [];

  // Architecture patterns
  if (paths.some(p => /controllers?\//.test(p)) && paths.some(p => /models?\//.test(p))) signals.push('MVC');
  if (paths.some(p => /services?\//.test(p))) signals.push('Service Layer');
  if (paths.some(p => /routes?\//.test(p))) signals.push('Router-based API');
  if (paths.some(p => /middleware\//.test(p))) signals.push('Middleware Pipeline');
  if (allDeps.some(d => /express|fastify|koa|hapi/.test(d))) signals.push('REST API');
  if (allDeps.some(d => /graphql|apollo/.test(d))) signals.push('GraphQL');
  if (allDeps.some(d => /socket\.io|ws/.test(d))) signals.push('WebSocket');
  if (allDeps.some(d => /mongoose|sequelize|prisma|typeorm|knex/.test(d))) signals.push('ORM / Database');
  if (allDeps.some(d => /react|vue|angular|svelte/.test(d))) signals.push('Frontend Framework');
  if (allDeps.some(d => /next|nuxt|remix/.test(d))) signals.push('Full-stack / SSR');
  if (paths.some(p => /vercel\.json|serverless\.yml|\.lambda/.test(p))) signals.push('Serverless');
  if (allDeps.some(d => /jest|mocha|vitest|chai/.test(d))) signals.push('Tested (unit/integration)');
  if (allDeps.some(d => /docker|kubernetes/.test(d)) || paths.some(p => /dockerfile|docker-compose/.test(p))) signals.push('Containerised');

  return signals;
}

function extractKeyFiles(structure) {
  const important = [
    'package.json', 'tsconfig.json', 'webpack.config.js', 'vite.config.js',
    'docker-compose.yml', 'Dockerfile', '.env.example', 'README.md',
    'vercel.json', 'netlify.toml', 'jest.config.js', 'eslint.config.js',
    'prisma/schema.prisma',
  ];
  return structure
    .filter(e => e.type === 'file' && important.some(k => e.path.endsWith(k)))
    .map(e => e.path);
}

async function intelligentSummary(req, res) {
  try {
    const { localPath, repoName } = req.body || {};
    if (!localPath || !repoName) {
      return res.status(400).json({ success: false, error: 'localPath and repoName are required' });
    }

    // Collect all analysis data in parallel
    const [structure, entryPoint, depsResult] = await Promise.all([
      Promise.resolve(analyzeFolderStructure(localPath)),
      Promise.resolve(detectEntryPoint(localPath)),
      Promise.resolve(mapDependencies(localPath)),
    ]);

    const archSignals = detectArchitectureSignals(structure, depsResult);
    const keyFiles = extractKeyFiles(structure);
    const totalFiles = structure.filter(e => e.type === 'file').length;
    const totalFolders = structure.filter(e => e.type === 'directory').length;
    const topFolders = structure.filter(e => e.type === 'directory').map(e => e.name);
    const prodDeps = Object.keys(depsResult.dependencies || {});
    const devDeps = Object.keys(depsResult.devDependencies || {});

    // Base analysis (always returned, even without Gemini)
    const baseAnalysis = {
      repoName,
      entryPoint: entryPoint.entrypoint || 'not detected',
      entrySource: entryPoint.source,
      totalFiles,
      totalFolders,
      archSignals,
      keyFiles,
      prodDeps,
      devDeps,
    };

    if (!genAI) {
      return res.json({
        success: true,
        ...baseAnalysis,
        summary: 'AI summary unavailable — GEMINI_API_KEY not configured.',
        architectureStyle: archSignals.join(', ') || 'Unknown',
        keyDesignDecisions: [],
        techStack: [...prodDeps.slice(0, 8)],
        insights: [],
        onboardingTips: [],
        aiPowered: false,
      });
    }

    const prompt = `You are a senior software architect reviewing a codebase. Analyze and respond in raw JSON only — no markdown, no backticks.

Repository: ${repoName}
Entry point: ${entryPoint.entrypoint || 'unknown'} (${entryPoint.source || ''})
Total files: ${totalFiles} | Total folders: ${totalFolders}
Top-level folders: ${topFolders.slice(0, 15).join(', ')}
Architecture signals detected: ${archSignals.join(', ') || 'none'}
Key config files present: ${keyFiles.join(', ') || 'none'}
Production dependencies (${prodDeps.length}): ${prodDeps.slice(0, 20).join(', ')}
Dev dependencies (${devDeps.length}): ${devDeps.slice(0, 15).join(', ')}

Respond with exactly this JSON:
{
  "summary": "3-4 sentence plain English overview of what this project is, what it does, and who it's for",
  "architectureStyle": "One clear label: e.g. 'MVC REST API', 'Monolithic full-stack', 'Serverless microservices', 'Component-based SPA', etc.",
  "techStack": ["list", "of", "specific", "technologies", "detected"],
  "keyDesignDecisions": [
    "Specific design decision observed in the codebase (e.g. 'Uses JWT for stateless auth', 'Separates route and controller layers')",
    "Another concrete decision",
    "Another concrete decision"
  ],
  "insights": [
    "Insight about folder structure or module organisation",
    "Insight about dependency choices or tech maturity",
    "Insight about scalability, testability, or deployment"
  ],
  "onboardingTips": [
    "Where a new developer should start reading",
    "What to set up first (env vars, install steps)",
    "One gotcha or non-obvious thing about this codebase"
  ],
  "codeQualitySignals": ["positive or negative signals about code quality based on deps/structure"]
}`;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleaned = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return res.json({
      success: true,
      aiPowered: true,
      ...baseAnalysis,
      ...parsed,
    });
  } catch (err) {
    console.error('intelligentSummary error:', err.message);
    return res.status(500).json({ success: false, error: err.message || 'Failed to generate intelligent summary' });
  }
}

module.exports = { intelligentSummary };