const express = require('express');
const { cleanupRepo_route } = require('../controllers/analyzeController');

const router = express.Router();

router.post('/', cleanupRepo_route);

module.exports = router;