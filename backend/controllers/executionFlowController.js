const fs = require('fs');
const path = require('path');

/**
 * B2 — Execution Flow Explanation
 * Traces the runtime request flow by reading actual route/controller/service files
 * and building a layered flow map: Request → Router → Controller → Service → DB
 */

const IGNORED = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'coverage']);
const CODE_EXTS = new Set(['.js', '.ts', '.jsx', '.tsx']);

function walkFiles(dir, baseDir, results = [], depth = 0) {
  if (depth > 5) return results;
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return results; }
  for (const entry of entries) {
    if (IGNORED.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
    if (entry.isDirectory()) {
      walkFiles(fullPath, baseDir, results, depth + 1);
    } else if (CODE_EXTS.has(path.extname(entry.name))) {
      results.push({ relPath, name: entry.name, fullPath });
    }
  }
  return results;
}

function readFile(fullPath) {
  try { return fs.readFileSync(fullPath, 'utf8'); } catch { return ''; }
}

/** Extract HTTP method + path from route definitions */
function extractRoutes(content, filePath) {
  const routes = [];
  // Express: router.get('/path', ...) or app.post('/path', ...)
  const routeRegex = /(?:router|app)\.(get|post|put|patch|delete|use)\s*\(\s*['"`]([^'"`]+)['"`]/gi;
  let m;
  while ((m = routeRegex.exec(content)) !== null) {
    routes.push({ method: m[1].toUpperCase(), path: m[2], file: filePath });
  }
  return routes;
}

/** Extract require/import calls to find which modules a file depends on */
function extractImports(content) {
  const imports = [];
  // CommonJS
  const cjsRegex = /require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
  let m;
  while ((m = cjsRegex.exec(content)) !== null) {
    if (!m[1].startsWith('http')) imports.push(m[1]);
  }
  // ESM
  const esmRegex = /from\s+['"`]([^'"`]+)['"`]/g;
  while ((m = esmRegex.exec(content)) !== null) {
    if (!m[1].startsWith('http')) imports.push(m[1]);
  }
  return [...new Set(imports)];
}

/** Detect what "layer" a file belongs to */
function detectLayer(relPath, content) {
  if (/route/i.test(relPath)) return 'router';
  if (/controller|handler/i.test(relPath)) return 'controller';
  if (/service|processor/i.test(relPath)) return 'service';
  if (/model|schema|db\.|database/i.test(relPath)) return 'database';
  if (/middleware/i.test(relPath)) return 'middleware';
  if (/util|helper/i.test(relPath)) return 'utility';
  if (/^(src\/)?server\.(js|ts)$/i.test(relPath) || /^(src\/)?app\.(js|ts)$/i.test(relPath)) return 'entry';
  // Sniff content
  if (/mongoose\.model|sequelize\.define|prisma\./i.test(content)) return 'database';
  if (/express\.Router/i.test(content)) return 'router';
  if (/res\.json|res\.send|req\.body/i.test(content)) return 'controller';
  return 'other';
}

/** Extract exported function names */
function extractExports(content) {
  const names = [];
  // module.exports = { fn1, fn2 }
  const objExport = /module\.exports\s*=\s*\{([^}]+)\}/;
  const m = content.match(objExport);
  if (m) {
    const parts = m[1].split(',').map(s => s.trim().split(':')[0].trim()).filter(Boolean);
    names.push(...parts);
  }
  // exports.fnName = ...
  const namedExport = /exports\.(\w+)\s*=/g;
  let nm;
  while ((nm = namedExport.exec(content)) !== null) names.push(nm[1]);
  return [...new Set(names)];
}

async function explainExecutionFlow(req, res) {
  try {
    const { localPath } = req.body || {};
    if (!localPath) return res.status(400).json({ error: 'localPath is required' });
    if (!fs.existsSync(localPath)) return res.status(400).json({ error: 'localPath does not exist' });

    const allFiles = walkFiles(localPath, localPath);

    const layers = {
      entry: [],
      middleware: [],
      router: [],
      controller: [],
      service: [],
      database: [],
      utility: [],
    };

    const allRoutes = [];

    for (const file of allFiles) {
      const content = readFile(file.fullPath);
      const layer = detectLayer(file.relPath, content);
      const imports = extractImports(content);
      const exports = extractExports(content);
      const routes = extractRoutes(content, file.relPath);
      allRoutes.push(...routes);

      const entry = {
        path: file.relPath,
        name: file.name,
        imports: imports.filter(i => i.startsWith('.')).map(i => path.basename(i)),
        exports,
        routes: routes.length > 0 ? routes : undefined,
      };

      if (layers[layer]) layers[layer].push(entry);
    }

    // Build flow chains: for each route, trace through the layer stack
    const LAYER_ORDER = ['entry', 'middleware', 'router', 'controller', 'service', 'database'];

    const flows = allRoutes.slice(0, 10).map(route => {
      const steps = [];
      for (const layerName of LAYER_ORDER) {
        const layerFiles = layers[layerName];
        if (!layerFiles || layerFiles.length === 0) continue;
        // Find a file in this layer that's plausibly related to the route
        const match = layerFiles.find(f =>
          f.routes?.some(r => r.path === route.path) ||
          f.path.toLowerCase().includes(route.path.replace('/', '').toLowerCase()) ||
          route.file.toLowerCase().includes(f.name.replace(/\.(js|ts)$/, '').toLowerCase())
        ) || (layerName !== 'entry' ? layerFiles[0] : null);

        if (match) {
          steps.push({
            layer: layerName,
            file: match.path,
            exports: match.exports.slice(0, 3),
          });
        }
      }
      return { method: route.method, path: route.path, steps };
    });

    // Summary stats
    const layerSummary = {};
    for (const [name, files] of Object.entries(layers)) {
      if (files.length > 0) layerSummary[name] = files.map(f => f.path);
    }

    return res.json({
      success: true,
      layers: layerSummary,
      routes: allRoutes.slice(0, 20),
      flows: flows.filter(f => f.steps.length > 1),
      totalRoutes: allRoutes.length,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to explain execution flow' });
  }
}

module.exports = { explainExecutionFlow };