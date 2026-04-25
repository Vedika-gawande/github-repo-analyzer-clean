// routes/intelligentSummary.js
const express = require('express');
const { intelligentSummary } = require('../controllers/intelligentSummaryController');
const router = express.Router();
router.post('/', intelligentSummary);
module.exports = router;