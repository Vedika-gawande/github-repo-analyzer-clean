const { analyzeFolderStructure, detectEntryPoint } = require('../services/parser');
const { mapDependencies } = require('../services/dependencyMapper');
const { generateSummary } = require('../services/aiProcessor');

async function summarizeRepo(req, res) {
  try {
    const { localPath, repoName } = req.body || {};

    if (!localPath || !repoName) {
      return res.status(400).json({
        success: false,
        error: 'localPath and repoName are required',
      });
    }

    // Run all 3 analyzers in parallel
    const [structure, entryPoint, depsResult] = await Promise.all([
      Promise.resolve(analyzeFolderStructure(localPath)),
      Promise.resolve(detectEntryPoint(localPath)),
      Promise.resolve(mapDependencies(localPath)),
    ]);

    // Build the shape generateSummary expects
    const folderStructure = structure
      .filter((e) => e.type === 'directory')
      .map((e) => ({ name: e.name, description: e.path }));

    const dependencies = Object.entries(depsResult.allDependencies || {}).map(
      ([source, version]) => ({ source, dependencies: [String(version)] }),
    );

    const meta = {
      totalFiles: structure.filter((e) => e.type === 'file').length,
      totalFolders: structure.filter((e) => e.type === 'directory').length,
    };

    const analysisData = {
      repoName,
      folderStructure,
      entryPoint: {
        fileName: entryPoint.entrypoint || 'unknown',
        filePath: entryPoint.entrypoint || 'unknown',
        flowTrace: [],
      },
      dependencies,
      meta,
    };

    const aiResult = await generateSummary(analysisData);

    return res.json({
      success: true,
      repoName,
      summary: aiResult.summary,
      insights: aiResult.insights,
      techStack: aiResult.techStack,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to generate summary',
    });
  }
}

module.exports = { summarizeRepo };
