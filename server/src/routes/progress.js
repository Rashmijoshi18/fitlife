const express = require('express');
const { getSummary, getHistory } = require('../controllers/progressController');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

router.get('/summary', getSummary);
router.get('/history', getHistory);

module.exports = router;
