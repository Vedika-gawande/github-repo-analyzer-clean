
console.log('--- BACKEND STARTING ---');
require('dotenv').config();
console.log('--- DOTENV LOADED ---');

const express = require('express');
const cors = require('cors');

const app = express();

// ---------------- MIDDLEWARE ----------------
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));

app.use(express.json());

// ---------------- ROUTES ----------------
console.log('--- ROUTES LOADING ---');

const analyzeRoutes            = require('./routes/analyze');
const structureRoutes          = require('./routes/structure');
const entrypointRoutes         = require('./routes/entrypoint');
const dependenciesRoutes       = require('./routes/dependencies');
const summaryRoutes            = require('./routes/summary');
const cleanupRoutes            = require('./routes/cleanup');
const criticalFilesRoutes      = require('./routes/criticalFiles');
const executionFlowRoutes      = require('./routes/executionFlow');
const intelligentSummaryRoutes = require('./routes/intelligentSummary');

console.log('--- ROUTES LOADED ---');

// ---------------- BASIC ROUTES ----------------
app.get('/', (_req, res) => {
  res.json({
    message: 'Backend is running!',
    node_env: process.env.NODE_ENV,
    has_gemini: !!process.env.GEMINI_API_KEY,
    has_github: !!process.env.GITHUB_TOKEN
  });
});

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

// ---------------- API ROUTES ----------------
app.use('/api', analyzeRoutes);
app.use('/api/structure', structureRoutes);
app.use('/api/entrypoint', entrypointRoutes);
app.use('/api/dependencies', dependenciesRoutes);
app.use('/api/summary', summaryRoutes);
app.use('/api/cleanup', cleanupRoutes);
app.use('/api/critical-files', criticalFilesRoutes);
app.use('/api/execution-flow', executionFlowRoutes);
app.use('/api/intelligent-summary', intelligentSummaryRoutes);

// ---------------- LOCAL SERVER (with fallback) ----------------
const basePort = process.env.PORT ? Number(process.env.PORT) : 3001;
const allowPortFallback = process.env.PORT_FALLBACK !== 'false';

function startLocalServer(portToUse) {
  const server = app.listen(portToUse, () => {
    console.log(`Backend listening on http://localhost:${portToUse}`);
    console.log('\nRegistered routes:');
    console.log('  GET  /');
    console.log('  GET  /health');
    console.log('  POST /api/analyze');
    console.log('  POST /api/structure');
    console.log('  POST /api/entrypoint');
    console.log('  POST /api/dependencies');
    console.log('  POST /api/summary');
    console.log('  POST /api/cleanup');
    console.log('  POST /api/critical-files');
    console.log('  POST /api/execution-flow');
    console.log('  POST /api/intelligent-summary');
    console.log('');
  });

  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
      if (allowPortFallback && !process.env.PORT) {
        const nextPort = portToUse + 1;
        console.error(`Port ${portToUse} is in use, retrying on ${nextPort}...`);
        startLocalServer(nextPort);
        return;
      }
      console.error(`Port ${portToUse} is already in use.`);
      console.error('Stop the existing process or set a different PORT before starting.');
      process.exit(1);
    }
    console.error('Server failed to start:', err);
    process.exit(1);
  });
}

// ---------------- START SERVER ----------------
if (process.env.NODE_ENV === 'production') {
  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

} else {
  startLocalServer(basePort);
}

module.exports = app;

