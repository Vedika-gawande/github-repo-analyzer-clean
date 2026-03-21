const express = require('express');
const { analyzeEntryPoint } = require('../controllers/entrypointController');

const router = express.Router();

router.post('/', analyzeEntryPoint);

module.exports = router;
