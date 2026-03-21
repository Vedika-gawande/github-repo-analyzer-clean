/**
 * Identify important/critical files from a repo analysis.
 *
 * Placeholder implementation: will be wired to your analysis outputs later.
 */

function highlightCritical({ entryPoint } = {}) {
  // TODO: Rank files by impact (entry points, config files, core modules).
  const criticalFiles = [];

  if (entryPoint && typeof entryPoint.detected === 'string') {
    criticalFiles.push(entryPoint.detected);
  }

  return {
    criticalFiles,
  };
}

module.exports = {
  highlightCritical,
};

