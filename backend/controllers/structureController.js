const { analyzeFolderStructure } = require('../services/parser');

async function analyzeStructure(req, res) {
  try {
    const { localPath } = req.body || {};
    if (!localPath) {
      return res.status(400).json({ error: 'localPath is required' });
    }
    const structure = analyzeFolderStructure(localPath);
    return res.json({
      success: true,
      localPath,
      totalEntries: structure.length,
      files: structure.filter((e) => e.type === 'file').length,
      directories: structure.filter((e) => e.type === 'directory').length,
      structure,
    });
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Failed to analyze structure' });
  }
}

module.exports = { analyzeStructure };
