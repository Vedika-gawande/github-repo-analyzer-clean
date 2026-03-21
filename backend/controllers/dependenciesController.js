const { mapDependencies } = require('../services/dependencyMapper');

async function analyzeDependencies(req, res) {
  try {
    const { localPath } = req.body || {};
    if (!localPath) {
      return res.status(400).json({ error: 'localPath is required' });
    }
    const result = mapDependencies(localPath);
    return res.json({
      success: true,
      localPath,
      ...result,
    });
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Failed to map dependencies' });
  }
}

module.exports = { analyzeDependencies };
