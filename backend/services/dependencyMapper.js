const fs = require('fs');
const path = require('path');

/**
 * mapDependencies(localPath)
 * Reads package.json from localPath and returns a structured dependency map.
 * Returns { dependencies, devDependencies, peerDependencies, allDependencies }
 */
function mapDependencies(localPath) {
  if (!fs.existsSync(localPath)) {
    throw new Error(`Path does not exist: ${localPath}`);
  }

  const packageJsonPath = path.join(localPath, 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    return {
      hasManifest: false,
      dependencies: {},
      devDependencies: {},
      peerDependencies: {},
      allDependencies: {},
    };
  }

  let packageJson;
  try {
    packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  } catch (err) {
    throw new Error(`Failed to parse package.json: ${err.message}`);
  }

  const deps = packageJson.dependencies || {};
  const devDeps = packageJson.devDependencies || {};
  const peerDeps = packageJson.peerDependencies || {};

  // Merge all into one map (production takes priority over dev)
  const allDependencies = { ...devDeps, ...peerDeps, ...deps };

  return {
    hasManifest: true,
    packageName: packageJson.name || null,
    packageVersion: packageJson.version || null,
    dependencies: deps,
    devDependencies: devDeps,
    peerDependencies: peerDeps,
    allDependencies,
  };
}

module.exports = {
  mapDependencies,
};
