const fs = require('fs/promises');
const path = require('path');
const fsSync = require('fs');
const simpleGit = require('simple-git');
const parseRepoUrl = require('../utils/parseRepoUrl');

const IGNORED_FOLDERS = [
  'node_modules', '.git', 'dist', 'build', '.next',
  '__pycache__', '.venv', 'venv', '.idea', '.vscode',
];

async function cloneRepository(cloneUrl, repoName) {
  const baseTempPath = process.env.VERCEL ? '/tmp' : path.join(__dirname, '..', 'temp');

  if (!fsSync.existsSync(baseTempPath)) {
    fsSync.mkdirSync(baseTempPath, { recursive: true });
  }

  const repoPath = path.join(baseTempPath, repoName);

  // If already cloned, reuse it
  if (fsSync.existsSync(repoPath)) return repoPath;

  try {
    const git = simpleGit();
    await git.clone(cloneUrl, repoPath, ['--depth', '1']);
    return repoPath;
  } catch (error) {
    throw new Error(`Failed to clone repository: ${error.message}`);
  }
}

async function getFolderStructure(repoPath, currentDepth = 0, currentName = '') {
  const MAX_DEPTH = 4;
  if (currentDepth > MAX_DEPTH) return null;

  const name = currentName || path.basename(repoPath);

  try {
    const stats = await fs.stat(repoPath);

    if (stats.isDirectory()) {
      if (IGNORED_FOLDERS.includes(name)) return null;

      const node = { name, type: 'folder', children: [] };

      if (currentDepth < MAX_DEPTH) {
        const items = await fs.readdir(repoPath);
        for (const item of items) {
          const itemPath = path.join(repoPath, item);
          const childNode = await getFolderStructure(itemPath, currentDepth + 1, item);
          if (childNode) node.children.push(childNode);
        }
      }
      return node;
    } else {
      return { name, type: 'file' };
    }
  } catch {
    return null;
  }
}

async function cleanupRepo(repoPath) {
  try {
    await fs.rm(repoPath, { recursive: true, force: true });
  } catch (err) {
    console.warn(`Cleanup warning for ${repoPath}:`, err.message);
  }
}

async function analyzeRepo(req, res) {
  try {
    const { repoUrl } = req.body || {};

    if (!repoUrl) {
      return res.status(400).json({ success: false, error: 'repoUrl is required' });
    }

    let parsed;
    try {
      parsed = parseRepoUrl(repoUrl);
    } catch (e) {
      return res.status(400).json({ success: false, error: e.message || 'Invalid GitHub URL' });
    }

    const { owner, repo } = parsed;
    const cloneUrl = `https://github.com/${owner}/${repo}.git`;

    const localPath = await cloneRepository(cloneUrl, repo);
    const folderStructure = await getFolderStructure(localPath);

    return res.json({
      success: true,
      repoName: repo,
      localPath,
      folderStructure,
    });
  } catch (err) {
    const message = err && err.message ? err.message : 'Server Error';
    return res.status(500).json({ success: false, error: message });
  }
}

// Call this route to manually clean up a cloned repo after analysis is done
async function cleanupRepo_route(req, res) {
  try {
    const { localPath } = req.body || {};
    if (!localPath) return res.status(400).json({ error: 'localPath is required' });

    // Safety: only allow deleting from within the temp directory
    const baseTempPath = process.env.VERCEL ? '/tmp' : path.join(__dirname, '..', 'temp');
    if (!localPath.startsWith(baseTempPath)) {
      return res.status(400).json({ error: 'Invalid path' });
    }

    await cleanupRepo(localPath);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { analyzeRepo, cleanupRepo_route };