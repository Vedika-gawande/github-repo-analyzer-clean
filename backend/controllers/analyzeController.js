const fs = require('fs/promises');
const path = require('path');
const githubService = require('../services/githubService');
const parseRepoUrl = require('../utils/parseRepoUrl');

const simpleGit = require('simple-git');
const fsSync = require('fs');

async function cloneRepository(cloneUrl, repoName) {
  // Use /tmp for Vercel, as it's the only writable directory
  const baseTempPath = process.env.VERCEL ? '/tmp' : path.join(__dirname, '..', 'temp');
  
  if (!fsSync.existsSync(baseTempPath)) {
    fsSync.mkdirSync(baseTempPath, { recursive: true });
  }

  const repoPath = path.join(baseTempPath, repoName);
  if (fsSync.existsSync(repoPath)) return repoPath;

  try {
    const git = simpleGit();
    await git.clone(cloneUrl, repoPath);
    return repoPath;
  } catch (error) {
    throw new Error(`Failed to clone repository: ${error.message}`);
  }
}

const IGNORED_FOLDERS = [
  'node_modules', '.git', 'dist', 'build', '.next',
  '__pycache__', '.venv', 'venv', '.idea', '.vscode'
];

async function getFolderStructure(repoPath, currentDepth = 0, currentName = '') {
  const MAX_DEPTH = 4;
  if (currentDepth > MAX_DEPTH) return null;

  const name = currentName || path.basename(repoPath);

  try {
    const stats = await fs.promises.stat(repoPath);

    if (stats.isDirectory()) {
      if (IGNORED_FOLDERS.includes(name)) return null;

      const node = { name, type: 'folder', children: [] };

      if (currentDepth < MAX_DEPTH) {
        const items = await fs.promises.readdir(repoPath);
        for (const item of items) {
          const itemPath = path.join(repoPath, item);
          const childNode = await getFolderStructure(itemPath, currentDepth + 1, item);
          if (childNode) {
            node.children.push(childNode);
          }
        }
      }
      return node;
    } else {
      return { name, type: 'file' };
    }
  } catch (error) {
    return null;
  }
}

async function analyzeRepo(req, res) {
  try {
    const { repoUrl } = req.body || {};

    if (!repoUrl) {
      return res.status(400).json({ success: false, error: 'repoUrl is required' });
    }

    // Call parseRepoUrl → cloneRepository → getFolderStructure in sequence
    let parsed;
    try {
      parsed = parseRepoUrl(repoUrl);
    } catch (e) {
      return res.status(400).json({ success: false, error: e.message || 'Invalid GitHub URL' });
    }

    const { owner, repo } = parsed;
    const repoName = repo;
    const cloneUrl = `https://github.com/${owner}/${repoName}.git`;
    
    // Call sequence
    const localPath = await cloneRepository(cloneUrl, repoName);
    const folderStructure = await getFolderStructure(localPath);

    return res.json({
      success: true,
      repoName,
      localPath,
      folderStructure
    });

  } catch (err) {
    const message = err && err.message ? err.message : 'Server Error';
    return res.status(500).json({ success: false, error: message });
  }
}

module.exports = {
  analyzeRepo,
};
