function parseRepoUrl(repoUrl) {
  if (typeof repoUrl !== 'string') {
    throw new Error('repoUrl must be a string');
  }

  const trimmed = repoUrl.trim();

  // Examples:
  // - https://github.com/owner/repo
  // - https://github.com/owner/repo/
  // - git@github.com:owner/repo.git
  // - ssh://git@github.com/owner/repo.git
  const githubHttpRegex = /^https?:\/\/github\.com\/([^/]+)\/([^/#?]+)(?:[/?#]|$)/i;
  const githubGitRegex = /^(?:git@github\.com:|ssh:\/\/git@github\.com\/)([^/]+)\/([^/]+?)(?:\.git)?$/i;
  const fallbackRegex = /^([^/]+)\/([^/]+?)(?:\.git)?$/i;

  let match = trimmed.match(githubHttpRegex);
  if (match) {
    return { owner: match[1], repo: match[2].replace(/\.git$/i, '') };
  }

  match = trimmed.match(githubGitRegex);
  if (match) {
    return { owner: match[1], repo: match[2].replace(/\.git$/i, '') };
  }

  // Allow passing "owner/repo" directly for convenience.
  match = trimmed.match(fallbackRegex);
  if (match) {
    return { owner: match[1], repo: match[2].replace(/\.git$/i, '') };
  }

  throw new Error('Invalid GitHub repo URL');
}

module.exports = parseRepoUrl;

