console.log('--- BACKEND STARTING ---');
require('dotenv').config();
console.log('--- DOTENV LOADED ---');
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));

app.options('*', cors());

console.log('--- ROUTES LOADING ---');
const analyzeRoutes = require('./routes/analyze');
const structureRoutes = require('./routes/structure');
const entrypointRoutes = require('./routes/entrypoint');
const dependenciesRoutes = require('./routes/dependencies');
const summaryRoutes = require('./routes/summary');
console.log('--- ROUTES LOADED ---');

app.use(express.json());

app.get('/', (req, res) => {
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

app.use('/api', analyzeRoutes);
app.use('/api/structure', structureRoutes);
app.use('/api/entrypoint', entrypointRoutes);
app.use('/api/dependencies', dependenciesRoutes);
app.use('/api/summary', summaryRoutes);

const port = process.env.PORT ? Number(process.env.PORT) : 3001;

// Keep existing app.listen for local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Backend listening on http://localhost:${port}`);
    // eslint-disable-next-line no-console
    console.log('\nRegistered routes:');
    // eslint-disable-next-line no-console
    console.log('  GET  /health');
    // eslint-disable-next-line no-console
    console.log('  POST /api/analyze');
    // eslint-disable-next-line no-console
    console.log('  POST /api/structure');
    // eslint-disable-next-line no-console
    console.log('  POST /api/entrypoint');
    // eslint-disable-next-line no-console
    console.log('  POST /api/dependencies');
    // eslint-disable-next-line no-console
    console.log('  POST /api/summary');
    // eslint-disable-next-line no-console
    console.log('');
  });
}

// Export for Vercel serverless
module.exports = app;

