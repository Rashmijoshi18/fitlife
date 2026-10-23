const Meal = require('../models/Meal');

// @desc  Get meals (optionally filtered by date)
// @route GET /api/meals
// @access Private
const getMeals = async (req, res, next) => {
  try {
    const { date, startDate, endDate, page = 1, limit = 50 } = req.query;
    const filter = { user: req.user._id };

    if (date) {
      const d = new Date(date);
      const nextDay = new Date(d);
      nextDay.setDate(d.getDate() + 1);
      filter.date = { $gte: d, $lt: nextDay };
    } else if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [meals, total] = await Promise.all([
      Meal.find(filter).sort({ date: -1 }).skip(skip).limit(parseInt(limit)),
      Meal.countDocuments(filter),
    ]);

    res.json({ meals, pagination: { page: parseInt(page), total } });
  } catch (error) {
    next(error);
  }
};

// @desc  Create meal
// @route POST /api/meals
// @access Private
const createMeal = async (req, res, next) => {
  try {
    const { name, mealType, date, servingSize, servingUnit, calories, protein, carbs, fat, fiber, notes } = req.body;

    if (!name || !mealType || calories === undefined) {
      return res.status(400).json({ error: 'Name, mealType, and calories are required' });
    }

    const meal = await Meal.create({
      user: req.user._id,
      name,
      mealType,
      date: date || new Date(),
      servingSize,
      servingUnit,
      calories,
      protein,
      carbs,
      fat,
      fiber,
      notes,
    });

    res.status(201).json({ message: 'Meal logged', meal });
  } catch (error) {
    next(error);
  }
};

// @desc  Update meal
// @route PATCH /api/meals/:id
// @access Private
const updateMeal = async (req, res, next) => {
  try {
    const meal = await Meal.findOne({ _id: req.params.id, user: req.user._id });
    if (!meal) {
      return res.status(404).json({ error: 'Meal not found' });
    }

    const updates = req.body;
    Object.keys(updates).forEach((k) => updates[k] === undefined && delete updates[k]);
    Object.assign(meal, updates);
    await meal.save();

    res.json({ message: 'Meal updated', meal });
  } catch (error) {
    next(error);
  }
};

// @desc  Delete meal
// @route DELETE /api/meals/:id
// @access Private
const deleteMeal = async (req, res, next) => {
  try {
    const meal = await Meal.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!meal) {
      return res.status(404).json({ error: 'Meal not found' });
    }
    res.json({ message: 'Meal deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getMeals, createMeal, updateMeal, deleteMeal };
