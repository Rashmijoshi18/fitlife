const express = require('express');
const { getExercises, getExercise } = require('../controllers/exerciseController');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

router.get('/', getExercises);
router.get('/:id', getExercise);

module.exports = router;
