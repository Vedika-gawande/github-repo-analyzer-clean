const axios = require('axios');


// eslint-disable-next-line no-console
console.log('GitHub Token loaded:', process.env.GITHUB_TOKEN ? 'YES' : 'NO');

const GITHUB_API_BASE_URL = 'https://api.github.com';

function buildHeaders() {
  const headers = {
    'User-Agent': 'WINGS-VIBE-CODING-APP',
    'Accept': 'application/vnd.github.v3+json',
    'Authorization': `token ${process.env.GITHUB_TOKEN}`,
  };
  return headers;
}

function handleGitHubError(err) {
  const status = err.response && err.response.status;
  if (status === 403) throw new Error('GitHub API rate limit hit. Try again in a minute.');
  if (status === 404) throw new Error('Repository not found. Check the URL.');
  if (status === 401) throw new Error('GitHub auth failed.');
  throw err;
}

async function getRepoInfo(owner, repo) {
  const url = `${GITHUB_API_BASE_URL}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
  try {
    const response = await axios.get(url, { headers: buildHeaders() });
    return response.data;
  } catch (err) {
    handleGitHubError(err);
  }
}

/**
 * Fetch a single text file from the repo (e.g. package.json). Returns null if missing or not a file.
 */
async function getRepoFileContent(owner, repo, path, ref) {
  const safePath = path
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  const url = `${GITHUB_API_BASE_URL}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${safePath}`;

  try {
    const response = await axios.get(url, {
      headers: buildHeaders(),
      params: ref ? { ref } : undefined,
    });
    const data = response.data;
    if (!data || data.type !== 'file' || typeof data.content !== 'string') {
      return null;
    }
    const raw = Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf8');
    return raw;
  } catch (err) {
    if (err.response && err.response.status === 404) {
      return null;
    }
    handleGitHubError(err);
  }
}

module.exports = {
  getRepoInfo,
  getRepoFileContent,
};

