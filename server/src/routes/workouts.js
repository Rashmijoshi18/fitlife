const express = require('express');
const { getWorkouts, getWorkout, createWorkout, updateWorkout, deleteWorkout } = require('../controllers/workoutController');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

router.route('/').get(getWorkouts).post(createWorkout);
router.route('/:id').get(getWorkout).patch(updateWorkout).delete(deleteWorkout);

module.exports = router;
