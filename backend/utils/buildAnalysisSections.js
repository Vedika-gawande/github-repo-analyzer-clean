/**
 * Build human-readable sections for the analyze API (no raw GitHub payload in the UI).
 */

function buildFolderStructure(repoInfo, hasPackageJson) {
  const items = [];

  items.push({
    heading: 'Repository overview',
    detail: repoInfo.description
      ? `${repoInfo.full_name} — ${repoInfo.description}`
      : `${repoInfo.full_name} — No description provided on GitHub.`,
  });

  items.push({
    heading: 'Branch & layout',
    detail: `The default branch is \`${repoInfo.default_branch}\`. After cloning, your working tree mirrors the latest state of that branch.`,
  });

  if (repoInfo.language) {
    items.push({
      heading: 'Primary language',
      detail: `GitHub reports ${repoInfo.language} as the dominant language. Supporting files may appear in other languages.`,
    });
  }

  if (Array.isArray(repoInfo.topics) && repoInfo.topics.length > 0) {
    items.push({
      heading: 'Tagged areas',
      detail: `Repository topics: ${repoInfo.topics.join(', ')}. These labels hint at features or domains in the project.`,
    });
  }

  if (hasPackageJson) {
    items.push({
      heading: 'Node / JavaScript layout',
      detail:
        'A `package.json` manifest is present. Dependencies, scripts, and the program entry are usually declared there alongside `node_modules` after install.',
    });
  } else {
    items.push({
      heading: 'Project manifest',
      detail:
        'No `package.json` was found at the repository root on the default branch. Entry files may live elsewhere (e.g. other languages or monorepo packages).',
    });
  }

  return items;
}

function buildEntryPoint(repoInfo, packageJson) {
  const rootUrl = `${repoInfo.html_url}/tree/${repoInfo.default_branch}`;

  if (!packageJson || typeof packageJson !== 'object') {
    return {
      primary: rootUrl,
      context: 'Open the repository root on GitHub to locate source files and docs.',
    };
  }

  if (typeof packageJson.main === 'string' && packageJson.main.trim()) {
    return {
      primary: packageJson.main.trim(),
      context: 'Declared in package.json as the "main" entry.',
    };
  }

  if (packageJson.bin) {
    const bin = packageJson.bin;
    if (typeof bin === 'string' && bin.trim()) {
      return {
        primary: bin.trim(),
        context: 'Declared in package.json as "bin".',
      };
    }
    if (typeof bin === 'object' && bin !== null) {
      const keys = Object.keys(bin);
      if (keys.length > 0) {
        const first = keys[0];
        const path = typeof bin[first] === 'string' ? bin[first] : String(bin[first]);
        return {
          primary: path.trim() || rootUrl,
          context: `Declared in package.json under bin["${first}"].`,
        };
      }
    }
  }

  return {
    primary: rootUrl,
    context: 'No "main" or "bin" field in package.json — browse the repo tree for entry files.',
  };
}

function depEntries(depsObj) {
  if (!depsObj || typeof depsObj !== 'object') {
    return [];
  }
  return Object.entries(depsObj).map(([name, version]) => ({
    name,
    version: String(version),
  }));
}

function buildDependencies(packageJson) {
  if (!packageJson || typeof packageJson !== 'object') {
    return {
      hasManifest: false,
      production: [],
      development: [],
    };
  }

  return {
    hasManifest: true,
    production: depEntries(packageJson.dependencies),
    development: depEntries(packageJson.devDependencies),
  };
}

function buildSummary(repoInfo) {
  return {
    fullName: repoInfo.full_name,
    description: repoInfo.description,
    htmlUrl: repoInfo.html_url,
    defaultBranch: repoInfo.default_branch,
    language: repoInfo.language,
    topics: Array.isArray(repoInfo.topics) ? repoInfo.topics : [],
    homepage: repoInfo.homepage || null,
    license:
      (repoInfo.license && (repoInfo.license.spdx_id || repoInfo.license.name)) || null,
  };
}

module.exports = {
  buildFolderStructure,
  buildEntryPoint,
  buildDependencies,
  buildSummary,
};
