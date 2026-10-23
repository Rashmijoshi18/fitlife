const Workout = require('../models/Workout');
const Meal = require('../models/Meal');
const Goal = require('../models/Goal');

// @desc  Get dashboard summary (all stats from real data)
// @route GET /api/progress/summary
// @access Private
const getSummary = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    // Date ranges
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Aggregate workout stats
    const [
      allWorkouts,
      totalWorkoutsAllTime,
      weekWorkouts,
      monthWorkouts,
      todayMeals,
      activeGoals,
    ] = await Promise.all([
      Workout.find({ user: userId }).sort({ date: -1 }).limit(5).select('title date duration caloriesBurned type'),
      Workout.countDocuments({ user: userId }),
      Workout.find({ user: userId, date: { $gte: startOfWeek } }),
      Workout.find({ user: userId, date: { $gte: startOfMonth } }),
      Meal.find({ user: userId, date: { $gte: startOfToday, $lte: endOfToday } }),
      Goal.find({ user: userId, status: 'active' }),
    ]);

    // Calculations
    const totalDuration = allWorkouts.length > 0
      ? weekWorkouts.reduce((sum, w) => sum + w.duration, 0)
      : 0;

    const totalCaloriesBurned = weekWorkouts.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0);

    const todayCalories = todayMeals.reduce((sum, m) => sum + m.calories, 0);
    const todayProtein = todayMeals.reduce((sum, m) => sum + (m.protein || 0), 0);
    const todayCarbs = todayMeals.reduce((sum, m) => sum + (m.carbs || 0), 0);
    const todayFat = todayMeals.reduce((sum, m) => sum + (m.fat || 0), 0);

    // Weekly chart data (last 7 days)
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now);
      day.setDate(now.getDate() - i);
      const dayStart = new Date(day);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);

      const dayWorkouts = weekWorkouts.filter(
        (w) => new Date(w.date) >= dayStart && new Date(w.date) <= dayEnd
      );

      weeklyData.push({
        date: day.toLocaleDateString('en-US', { weekday: 'short' }),
        workouts: dayWorkouts.length,
        duration: dayWorkouts.reduce((sum, w) => sum + w.duration, 0),
        calories: dayWorkouts.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0),
      });
    }

    // Monthly chart data (last 4 weeks)
    const monthlyData = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i + 1) * 7);
      const weekEnd = new Date(now);
      weekEnd.setDate(now.getDate() - i * 7);

      const wks = monthWorkouts.filter(
        (w) => new Date(w.date) >= weekStart && new Date(w.date) <= weekEnd
      );

      monthlyData.push({
        week: `Week ${4 - i}`,
        workouts: wks.length,
        duration: wks.reduce((sum, w) => sum + w.duration, 0),
      });
    }

    res.json({
      summary: {
        totalWorkouts: totalWorkoutsAllTime,
        weekWorkouts: weekWorkouts.length,
        monthWorkouts: monthWorkouts.length,
        weekDuration: totalDuration,
        weekCaloriesBurned: totalCaloriesBurned,
        activeGoals: activeGoals.length,
        completedGoals: await Goal.countDocuments({ user: userId, status: 'completed' }),
      },
      todayNutrition: {
        calories: todayCalories,
        protein: Math.round(todayProtein),
        carbs: Math.round(todayCarbs),
        fat: Math.round(todayFat),
        mealCount: todayMeals.length,
      },
      recentWorkouts: allWorkouts,
      activeGoals: activeGoals.map((g) => ({
        _id: g._id,
        title: g.title,
        currentValue: g.currentValue,
        targetValue: g.targetValue,
        unit: g.unit,
        completionPercentage: g.completionPercentage,
        targetDate: g.targetDate,
      })),
      charts: {
        weekly: weeklyData,
        monthly: monthlyData,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc  Get workout history over time
// @route GET /api/progress/history
// @access Private
const getHistory = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const workouts = await Workout.find({
      user: req.user._id,
      date: { $gte: startDate },
    }).sort({ date: 1 }).select('date duration caloriesBurned type title');

    res.json({ history: workouts });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSummary, getHistory };
