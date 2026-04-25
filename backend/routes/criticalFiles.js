// routes/criticalFiles.js
const express = require('express');
const { identifyCriticalFiles } = require('../controllers/criticalFilesController');
const router = express.Router();
router.post('/', identifyCriticalFiles);
module.exports = router;