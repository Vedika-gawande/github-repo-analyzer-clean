const express = require('express');
const { analyzeStructure } = require('../controllers/structureController');

const router = express.Router();

router.post('/', analyzeStructure);

module.exports = router;
