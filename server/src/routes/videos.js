const express = require('express');
const { protect } = require('../middleware/auth');
const { searchVideos } = require('../controllers/videoController');

const router = express.Router();
router.use(protect);

router.get('/search', searchVideos);

module.exports = router;
