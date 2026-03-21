const fs = require('fs');
const path = require('path');

/**
 * Recursively walk a directory and return a flat list of relative file paths.
 * Skips node_modules, .git, and other common noise directories.
 */
function walkDir(dir, baseDir, results = []) {
  const SKIP = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'coverage', '__pycache__']);
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    if (SKIP.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
    if (entry.isDirectory()) {
      results.push({ type: 'directory', path: relPath, name: entry.name });
      walkDir(fullPath, baseDir, results);
    } else {
      results.push({ type: 'file', path: relPath, name: entry.name });
    }
  }
  return results;
}

/**
 * analyzeFolderStructure(localPath)
 * Returns an array of { type, path, name } entries for the repo.
 */
function analyzeFolderStructure(localPath) {
  if (!fs.existsSync(localPath)) {
    throw new Error(`Path does not exist: ${localPath}`);
  }
  return walkDir(localPath, localPath);
}

/**
 * detectEntryPoint(localPath)
 * Tries to detect the entry point of the project at localPath.
 * Priority: package.json main/bin → common convention files → fallback.
 */
function detectEntryPoint(localPath) {
  if (!fs.existsSync(localPath)) {
    throw new Error(`Path does not exist: ${localPath}`);
  }

  const packageJsonPath = path.join(localPath, 'package.json');
  let packageJson = null;

  if (fs.existsSync(packageJsonPath)) {
    try {
      packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    } catch {
      packageJson = null;
    }
  }

  // 1. Check package.json "main"
  if (packageJson && typeof packageJson.main === 'string' && packageJson.main.trim()) {
    const mainFile = path.join(localPath, packageJson.main.trim());
    if (fs.existsSync(mainFile)) {
      return {
        entrypoint: packageJson.main.trim(),
        source: 'package.json main field',
        confidence: 'high',
      };
    }
  }

  // 2. Check package.json "bin"
  if (packageJson && packageJson.bin) {
    const bin = packageJson.bin;
    if (typeof bin === 'string' && bin.trim()) {
      return {
        entrypoint: bin.trim(),
        source: 'package.json bin field',
        confidence: 'high',
      };
    }
    if (typeof bin === 'object' && bin !== null) {
      const first = Object.values(bin)[0];
      if (typeof first === 'string') {
        return {
          entrypoint: first.trim(),
          source: 'package.json bin field (first entry)',
          confidence: 'high',
        };
      }
    }
  }

  // 3. Common convention files
  const conventions = [
    'index.js', 'src/index.js', 'app.js', 'src/app.js',
    'server.js', 'src/server.js', 'main.js', 'src/main.js',
    'index.ts', 'src/index.ts', 'app.ts', 'src/app.ts',
    'index.py', 'main.py', 'app.py',
  ];

  for (const candidate of conventions) {
    if (fs.existsSync(path.join(localPath, candidate))) {
      return {
        entrypoint: candidate,
        source: 'common convention',
        confidence: 'medium',
      };
    }
  }

  return {
    entrypoint: null,
    source: 'not detected',
    confidence: 'low',
  };
}

module.exports = {
  analyzeFolderStructure,
  detectEntryPoint,
};
