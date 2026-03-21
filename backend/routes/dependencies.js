const express = require('express');
const { analyzeDependencies } = require('../controllers/dependenciesController');

const router = express.Router();

router.post('/', analyzeDependencies);

module.exports = router;
