// routes/executionFlow.js
const express = require('express');
const { explainExecutionFlow } = require('../controllers/executionFlowController');
const router = express.Router();
router.post('/', explainExecutionFlow);
module.exports = router;