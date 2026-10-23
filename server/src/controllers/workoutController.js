const Workout = require('../models/Workout');

// @desc  Get all workouts for current user
// @route GET /api/workouts
// @access Private
const getWorkouts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type, startDate, endDate } = req.query;
    const filter = { user: req.user._id };

    if (type) filter.type = type;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [workouts, total] = await Promise.all([
      Workout.find(filter).sort({ date: -1 }).skip(skip).limit(parseInt(limit)),
      Workout.countDocuments(filter),
    ]);

    res.json({
      workouts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc  Get single workout
// @route GET /api/workouts/:id
// @access Private
const getWorkout = async (req, res, next) => {
  try {
    const workout = await Workout.findOne({ _id: req.params.id, user: req.user._id });
    if (!workout) {
      return res.status(404).json({ error: 'Workout not found' });
    }
    res.json({ workout });
  } catch (error) {
    next(error);
  }
};

// @desc  Create workout
// @route POST /api/workouts
// @access Private
const createWorkout = async (req, res, next) => {
  try {
    const { title, date, duration, caloriesBurned, type, exercises, notes, mood } = req.body;

    if (!title || !duration) {
      return res.status(400).json({ error: 'Title and duration are required' });
    }

    const workout = await Workout.create({
      user: req.user._id,
      title,
      date: date || new Date(),
      duration,
      caloriesBurned: caloriesBurned || 0,
      type: type || 'other',
      exercises: exercises || [],
      notes,
      mood,
    });

    res.status(201).json({ message: 'Workout logged successfully', workout });
  } catch (error) {
    next(error);
  }
};

// @desc  Update workout
// @route PATCH /api/workouts/:id
// @access Private
const updateWorkout = async (req, res, next) => {
  try {
    const workout = await Workout.findOne({ _id: req.params.id, user: req.user._id });
    if (!workout) {
      return res.status(404).json({ error: 'Workout not found' });
    }

    const { title, date, duration, caloriesBurned, type, exercises, notes, mood, isCompleted } = req.body;
    const updates = { title, date, duration, caloriesBurned, type, exercises, notes, mood, isCompleted };
    Object.keys(updates).forEach((k) => updates[k] === undefined && delete updates[k]);

    Object.assign(workout, updates);
    await workout.save();

    res.json({ message: 'Workout updated', workout });
  } catch (error) {
    next(error);
  }
};

// @desc  Delete workout
// @route DELETE /api/workouts/:id
// @access Private
const deleteWorkout = async (req, res, next) => {
  try {
    const workout = await Workout.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!workout) {
      return res.status(404).json({ error: 'Workout not found' });
    }
    res.json({ message: 'Workout deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getWorkouts, getWorkout, createWorkout, updateWorkout, deleteWorkout };
