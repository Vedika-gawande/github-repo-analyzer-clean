const express = require('express');
const analyzeController = require('../controllers/analyzeController');
const { analyzeFolderStructure, detectEntryPoint } = require('../services/parser');
const { mapDependencies } = require('../services/dependencyMapper');

const router = express.Router();

// Route 1: Clone + analyze a GitHub repo
router.post('/analyze', analyzeController.analyzeRepo);

// Route 2: Analyze folder structure of a locally cloned repo
router.post('/structure', (req, res) => {
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
});

// Route 3: Detect the entry point of a locally cloned repo
router.post('/entrypoint', (req, res) => {
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
});

// Route 4: Map dependencies from a locally cloned repo's package.json
router.post('/dependencies', (req, res) => {
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
});

module.exports = router;

