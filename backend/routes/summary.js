const express = require('express');
const { summarizeRepo } = require('../controllers/summaryController');

const router = express.Router();

router.post('/', summarizeRepo);

module.exports = router;
