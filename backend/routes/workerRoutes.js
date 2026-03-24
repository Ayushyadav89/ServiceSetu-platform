// routes/workerRoutes.js
const express = require('express');
const { getAvailableWorkers, getWorkerById } = require('../controllers/workerController');
const router = express.Router();

router.get('/available', getAvailableWorkers);
router.get('/:id', getWorkerById);

module.exports = router;
