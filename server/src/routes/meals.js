const express = require('express');
const { getMeals, createMeal, updateMeal, deleteMeal } = require('../controllers/mealController');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

router.route('/').get(getMeals).post(createMeal);
router.route('/:id').patch(updateMeal).delete(deleteMeal);

module.exports = router;
