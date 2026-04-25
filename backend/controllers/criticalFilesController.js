const fs = require('fs');
const path = require('path');

/**
 * B1 — Critical File Identification
 * Scans a cloned repo and identifies files that play major roles:
 * auth, DB config, API controllers, env config, entry points, routers.
 */

const ROLE_PATTERNS = [
  {
    role: 'auth',
    label: 'Authentication',
    color: 'red',
    patterns: [
      /auth/i, /login/i, /logout/i, /session/i, /jwt/i, /passport/i,
      /oauth/i, /token/i, /middleware\/auth/i,
    ],
  },
  {
    role: 'database',
    label: 'Database / ORM',
    color: 'blue',
    patterns: [
      /db\./i, /database/i, /mongoose/i, /sequelize/i, /prisma/i,
      /knex/i, /models?\//i, /schema/i, /migration/i, /seed/i,
    ],
  },
  {
    role: 'config',
    label: 'Configuration',
    color: 'amber',
    patterns: [
      /\.env/i, /config\./i, /settings\./i, /constants\./i,
      /environment/i, /dotenv/i, /secrets/i,
    ],
  },
  {
    role: 'controller',
    label: 'API Controller',
    color: 'teal',
    patterns: [
      /controller/i, /handler/i, /resolver/i,
    ],
  },
  {
    role: 'router',
    label: 'Router / Routes',
    color: 'purple',
    patterns: [
      /route/i, /router/i, /endpoint/i, /api\//i,
    ],
  },
  {
    role: 'service',
    label: 'Service / Business Logic',
    color: 'green',
    patterns: [
      /service/i, /processor/i, /manager/i, /helper/i,
    ],
  },
  {
    role: 'entry',
    label: 'Entry Point',
    color: 'gray',
    patterns: [
      /^(src\/)?index\.(js|ts)$/i,
      /^(src\/)?main\.(js|ts)$/i,
      /^(src\/)?app\.(js|ts)$/i,
      /^server\.(js|ts)$/i,
    ],
  },
];

const IGNORED = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'coverage', '__pycache__']);
const CODE_EXTS = new Set(['.js', '.ts', '.jsx', '.tsx', '.py', '.rb', '.go', '.java', '.php', '.cs', '.env', '.json', '.yaml', '.yml']);

function walkFiles(dir, baseDir, results = [], depth = 0) {
  if (depth > 6) return results;
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return results; }

  for (const entry of entries) {
    if (IGNORED.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      walkFiles(fullPath, baseDir, results, depth + 1);
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (CODE_EXTS.has(ext) || entry.name.startsWith('.env')) {
        results.push({ relPath, name: entry.name, fullPath });
      }
    }
  }
  return results;
}

function classifyFile(file) {
  const matches = [];
  for (const roleInfo of ROLE_PATTERNS) {
    const hit = roleInfo.patterns.some((p) => p.test(file.relPath) || p.test(file.name));
    if (hit) {
      matches.push({ role: roleInfo.role, label: roleInfo.label, color: roleInfo.color });
    }
  }
  return matches;
}

function peekFileContent(fullPath, maxLines = 5) {
  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split('\n').filter(l => l.trim()).slice(0, maxLines);
    return lines.join(' ').slice(0, 200);
  } catch {
    return '';
  }
}

async function identifyCriticalFiles(req, res) {
  try {
    const { localPath } = req.body || {};
    if (!localPath) return res.status(400).json({ error: 'localPath is required' });
    if (!fs.existsSync(localPath)) return res.status(400).json({ error: 'localPath does not exist' });

    const allFiles = walkFiles(localPath, localPath);
    const critical = [];

    for (const file of allFiles) {
      const roles = classifyFile(file);
      if (roles.length > 0) {
        const snippet = peekFileContent(file.fullPath);
        critical.push({
          path: file.relPath,
          name: file.name,
          roles,
          primaryRole: roles[0],
          snippet: snippet || null,
        });
      }
    }

    // Sort: entry > auth > database > controller > router > service > config
    const ROLE_ORDER = ['entry', 'auth', 'database', 'controller', 'router', 'service', 'config'];
    critical.sort((a, b) => {
      const ai = ROLE_ORDER.indexOf(a.primaryRole.role);
      const bi = ROLE_ORDER.indexOf(b.primaryRole.role);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });

    // Group by primary role
    const grouped = {};
    for (const f of critical) {
      const key = f.primaryRole.role;
      if (!grouped[key]) grouped[key] = { label: f.primaryRole.label, color: f.primaryRole.color, files: [] };
      grouped[key].files.push({ path: f.path, name: f.name, snippet: f.snippet, allRoles: f.roles.map(r => r.label) });
    }

    return res.json({
      success: true,
      totalScanned: allFiles.length,
      totalCritical: critical.length,
      grouped,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to identify critical files' });
  }
}

module.exports = { identifyCriticalFiles };