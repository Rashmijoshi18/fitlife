const Goal = require('../models/Goal');

// @desc  Get user goals
// @route GET /api/goals
// @access Private
const getGoals = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = { user: req.user._id };
    if (status) filter.status = status;

    const goals = await Goal.find(filter).sort({ createdAt: -1 });
    res.json({ goals });
  } catch (error) {
    next(error);
  }
};

// @desc  Create goal
// @route POST /api/goals
// @access Private
const createGoal = async (req, res, next) => {
  try {
    const { title, description, type, targetValue, unit, startDate, targetDate } = req.body;

    if (!title || !type || !targetValue || !unit) {
      return res.status(400).json({ error: 'Title, type, targetValue, and unit are required' });
    }

    const goal = await Goal.create({
      user: req.user._id,
      title,
      description,
      type,
      targetValue,
      unit,
      startDate: startDate || new Date(),
      targetDate,
    });

    res.status(201).json({ message: 'Goal created', goal });
  } catch (error) {
    next(error);
  }
};

// @desc  Update goal
// @route PATCH /api/goals/:id
// @access Private
const updateGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, user: req.user._id });
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const { title, description, targetValue, currentValue, unit, targetDate, status } = req.body;
    
    // Add progress entry if currentValue is being updated
    if (currentValue !== undefined && currentValue !== goal.currentValue) {
      goal.progressHistory.push({
        date: new Date(),
        value: currentValue,
        note: req.body.progressNote,
      });
      goal.currentValue = currentValue;
    }

    if (title !== undefined) goal.title = title;
    if (description !== undefined) goal.description = description;
    if (targetValue !== undefined) goal.targetValue = targetValue;
    if (unit !== undefined) goal.unit = unit;
    if (targetDate !== undefined) goal.targetDate = targetDate;
    if (status !== undefined) goal.status = status;

    // Auto-complete if target reached
    if (goal.currentValue >= goal.targetValue && goal.status === 'active') {
      goal.status = 'completed';
    }

    await goal.save();
    res.json({ message: 'Goal updated', goal });
  } catch (error) {
    next(error);
  }
};

// @desc  Delete goal
// @route DELETE /api/goals/:id
// @access Private
const deleteGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    res.json({ message: 'Goal deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getGoals, createGoal, updateGoal, deleteGoal };
