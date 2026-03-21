const { detectEntryPoint } = require('../services/parser');

async function analyzeEntryPoint(req, res) {
  try {
    const { localPath } = req.body || {};
    if (!localPath) {
      return res.status(400).json({ error: 'localPath is required' });
    }
    const result = detectEntryPoint(localPath);
    return res.json({
      success: true,
      localPath,
      ...result,
    });
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Failed to detect entrypoint' });
  }
}

module.exports = { analyzeEntryPoint };
