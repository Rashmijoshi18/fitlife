const Exercise = require('../models/Exercise');

// @desc  Get all exercises (with search/filter)
// @route GET /api/exercises
// @access Private
const getExercises = async (req, res, next) => {
  try {
    const { search, muscleGroup, equipment, difficulty, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
      ];
    }
    if (muscleGroup) filter.muscleGroup = muscleGroup;
    if (equipment) filter.equipment = equipment;
    if (difficulty) filter.difficulty = difficulty;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [exercises, total] = await Promise.all([
      Exercise.find(filter).sort({ name: 1 }).skip(skip).limit(parseInt(limit)),
      Exercise.countDocuments(filter),
    ]);

    res.json({ exercises, pagination: { page: parseInt(page), total } });
  } catch (error) {
    next(error);
  }
};

// @desc  Get single exercise
// @route GET /api/exercises/:id
// @access Private
const getExercise = async (req, res, next) => {
  try {
    const exercise = await Exercise.findById(req.params.id);
    if (!exercise) {
      return res.status(404).json({ error: 'Exercise not found' });
    }
    res.json({ exercise });
  } catch (error) {
    next(error);
  }
};

module.exports = { getExercises, getExercise };
