/**
 * Achievements & Personal Records (PR) Calculation Engine
 * Accurately analyzes the user's real workout logs without dummy data.
 */

export const calculateWorkoutStats = (workouts = []) => {
  let totalReps = 0;
  let totalVolumeKg = 0;
  let totalCalories = 0;
  let totalDurationMinutes = 0;
  let aiWorkoutsCount = 0;

  let maxRepsRecord = { reps: 0, exercise: 'None', date: null };
  let maxWeightRecord = { weight: 0, exercise: 'None', date: null };
  let maxCaloriesRecord = { calories: 0, title: 'None', date: null };
  let maxDurationRecord = { duration: 0, title: 'None', date: null };

  const exerciseSet = new Set();
  const dateSet = new Set();
  const dayDates = [];

  workouts.forEach((w) => {
    const wCalories = Number(w.caloriesBurned) || 0;
    const wDuration = Number(w.duration) || 0;
    const wDate = w.date || w.createdAt;

    totalCalories += wCalories;
    totalDurationMinutes += wDuration;

    if (wDate) {
      const dStr = new Date(wDate).toISOString().slice(0, 10);
      dateSet.add(dStr);
      dayDates.push(new Date(dStr).getTime());
    }

    if (w.title && (w.title.includes('AI') || (w.notes && w.notes.includes('AI')))) {
      aiWorkoutsCount += 1;
    }

    if (wCalories > maxCaloriesRecord.calories) {
      maxCaloriesRecord = { calories: wCalories, title: w.title || 'Workout', date: wDate };
    }

    if (wDuration > maxDurationRecord.duration) {
      maxDurationRecord = { duration: wDuration, title: w.title || 'Workout', date: wDate };
    }

    // Inspect exercises inside workout
    if (Array.isArray(w.exercises)) {
      w.exercises.forEach((ex) => {
        const exName = ex.name || 'Exercise';
        exerciseSet.add(exName);

        if (Array.isArray(ex.sets)) {
          ex.sets.forEach((set) => {
            const reps = Number(set.reps) || 0;
            const weight = Number(set.weight) || 0;

            totalReps += reps;
            totalVolumeKg += reps * weight * 2; // Pair load

            if (reps > maxRepsRecord.reps) {
              maxRepsRecord = { reps, exercise: exName, date: wDate };
            }

            if (weight > maxWeightRecord.weight) {
              maxWeightRecord = { weight, exercise: exName, date: wDate };
            }
          });
        }
      });
    }

    // Fallback parsing from notes if exercises array was flat
    if ((!w.exercises || w.exercises.length === 0) && w.notes) {
      const repMatch = w.notes.match(/(\d+)\s*reps?/i);
      const wtMatch = w.notes.match(/(\d+(\.\d+)?)\s*kg/i);
      if (repMatch) {
        const r = parseInt(repMatch[1], 10);
        totalReps += r;
        if (r > maxRepsRecord.reps) {
          maxRepsRecord = { reps: r, exercise: w.title || 'Exercise', date: wDate };
        }
      }
      if (wtMatch) {
        const wt = parseFloat(wtMatch[1]);
        if (wt > maxWeightRecord.weight) {
          maxWeightRecord = { weight: wt, exercise: w.title || 'Exercise', date: wDate };
        }
      }
    }
  });

  // Calculate Streak
  let streak = 0;
  if (dateSet.size > 0) {
    const sortedDays = Array.from(dateSet).sort().reverse();
    const todayStr = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    if (sortedDays[0] === todayStr || sortedDays[0] === yesterday) {
      streak = 1;
      let prevDate = new Date(sortedDays[0]);
      for (let i = 1; i < sortedDays.length; i++) {
        const currDate = new Date(sortedDays[i]);
        const diffDays = Math.round((prevDate - currDate) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          streak += 1;
          prevDate = currDate;
        } else {
          break;
        }
      }
    }
  }

  return {
    totalWorkouts: workouts.length,
    totalReps,
    totalVolumeKg: Math.round(totalVolumeKg),
    totalCalories: Math.round(totalCalories),
    totalDurationMinutes,
    aiWorkoutsCount,
    distinctDaysCount: dateSet.size,
    streakDays: streak,
    distinctExercisesCount: exerciseSet.size,
    maxRepsRecord,
    maxWeightRecord,
    maxCaloriesRecord,
    maxDurationRecord,
  };
};

export const getAchievementsList = (stats) => {
  const BADGES = [
    {
      id: 'first_ai',
      title: 'AI Pioneer',
      description: 'Complete your first pose-tracked AI workout',
      category: 'milestone',
      icon: 'Camera',
      color: '#10b981',
      xp: 50,
      target: 1,
      current: stats.aiWorkoutsCount,
      unlocked: stats.aiWorkoutsCount >= 1,
    },
    {
      id: 'rep_starter',
      title: 'Rep Starter',
      description: 'Perform 25 total reps across any exercises',
      category: 'volume',
      icon: 'Zap',
      color: '#3b82f6',
      xp: 50,
      target: 25,
      current: stats.totalReps,
      unlocked: stats.totalReps >= 25,
    },
    {
      id: 'iron_grip',
      title: 'Iron Grip',
      description: 'Complete a workout using 5kg or heavier dumbbells',
      category: 'strength',
      icon: 'Dumbbell',
      color: '#8b5cf6',
      xp: 75,
      target: 5,
      current: stats.maxWeightRecord.weight,
      unit: 'kg',
      unlocked: stats.maxWeightRecord.weight >= 5,
    },
    {
      id: 'century_club',
      title: 'Century Club',
      description: 'Reach 100 total tracked repetitions',
      category: 'volume',
      icon: 'Award',
      color: '#f59e0b',
      xp: 150,
      target: 100,
      current: stats.totalReps,
      unlocked: stats.totalReps >= 100,
    },
    {
      id: 'heavy_lifter',
      title: 'Heavy Lifter',
      description: 'Power through a workout with 10kg+ dumbbells',
      category: 'strength',
      icon: 'Shield',
      color: '#ec4899',
      xp: 150,
      target: 10,
      current: stats.maxWeightRecord.weight,
      unit: 'kg',
      unlocked: stats.maxWeightRecord.weight >= 10,
    },
    {
      id: 'calorie_blazer',
      title: 'Calorie Crusher',
      description: 'Burn 200+ total calories in logged sessions',
      category: 'milestone',
      icon: 'Flame',
      color: '#f97316',
      xp: 100,
      target: 200,
      current: stats.totalCalories,
      unit: 'kcal',
      unlocked: stats.totalCalories >= 200,
    },
    {
      id: 'calorie_inferno',
      title: 'Calorie Inferno',
      description: 'Burn 500+ total calories through training',
      category: 'milestone',
      icon: 'Flame',
      color: '#ef4444',
      xp: 200,
      target: 500,
      current: stats.totalCalories,
      unit: 'kcal',
      unlocked: stats.totalCalories >= 500,
    },
    {
      id: 'consistency_starter',
      title: 'Consistency Habit',
      description: 'Log workouts across 3 distinct days',
      category: 'consistency',
      icon: 'Calendar',
      color: '#06b6d4',
      xp: 100,
      target: 3,
      current: stats.distinctDaysCount,
      unit: 'days',
      unlocked: stats.distinctDaysCount >= 3,
    },
    {
      id: 'movement_explorer',
      title: 'Movement Explorer',
      description: 'Try at least 3 different exercise types',
      category: 'milestone',
      icon: 'Compass',
      color: '#14b8a6',
      xp: 100,
      target: 3,
      current: stats.distinctExercisesCount,
      unit: 'exercises',
      unlocked: stats.distinctExercisesCount >= 3,
    },
    {
      id: 'iron_will',
      title: 'Iron Will',
      description: 'Complete 5 total training sessions',
      category: 'consistency',
      icon: 'Trophy',
      color: '#eab308',
      xp: 150,
      target: 5,
      current: stats.totalWorkouts,
      unit: 'workouts',
      unlocked: stats.totalWorkouts >= 5,
    },
    {
      id: 'tonnage_titan',
      title: 'Tonnage Titan',
      description: 'Accumulate over 500kg of total lifted load',
      category: 'strength',
      icon: 'TrendingUp',
      color: '#6366f1',
      xp: 250,
      target: 500,
      current: stats.totalVolumeKg,
      unit: 'kg',
      unlocked: stats.totalVolumeKg >= 500,
    },
    {
      id: 'rep_master',
      title: 'Rep Grandmaster',
      description: 'Achieve 250 total repetitions',
      category: 'volume',
      icon: 'Sparkles',
      color: '#10b981',
      xp: 300,
      target: 250,
      current: stats.totalReps,
      unlocked: stats.totalReps >= 250,
    },
  ];

  return BADGES.map((b) => {
    const progress = Math.min(100, Math.round((Math.max(0, b.current) / b.target) * 100));
    return {
      ...b,
      progress,
    };
  });
};

export const getActiveChallenges = (stats) => {
  return [
    {
      id: 'challenge_weekly_reps',
      title: 'Weekly 50 Rep Blitz',
      description: 'Crush 50 total reps in AI Studio workouts this week',
      target: 50,
      current: stats.totalReps,
      unit: 'reps',
      rewardXP: 100,
      daysLeft: 5,
      completed: stats.totalReps >= 50,
      progress: Math.min(100, Math.round((stats.totalReps / 50) * 100)),
      tag: 'Weekly Quest',
    },
    {
      id: 'challenge_calorie_sprint',
      title: '300 Calorie Burn Sprint',
      description: 'Burn a cumulative 300 kcal across your sessions',
      target: 300,
      current: stats.totalCalories,
      unit: 'kcal',
      rewardXP: 150,
      daysLeft: 4,
      completed: stats.totalCalories >= 300,
      progress: Math.min(100, Math.round((stats.totalCalories / 300) * 100)),
      tag: 'Endurance',
    },
    {
      id: 'challenge_strength_pair',
      title: 'Dumbbell Power Session',
      description: 'Lift with dumbbells (minimum 4kg) in an AI tracked session',
      target: 4,
      current: stats.maxWeightRecord.weight,
      unit: 'kg',
      rewardXP: 120,
      daysLeft: 6,
      completed: stats.maxWeightRecord.weight >= 4,
      progress: Math.min(100, Math.round((stats.maxWeightRecord.weight / 4) * 100)),
      tag: 'Strength',
    },
  ];
};

export const getUserRank = (earnedXP) => {
  if (earnedXP >= 750) {
    return { title: 'Diamond Titan', level: 4, nextXP: 1200, color: '#06b6d4' };
  }
  if (earnedXP >= 400) {
    return { title: 'Gold Champion', level: 3, nextXP: 750, color: '#f59e0b' };
  }
  if (earnedXP >= 150) {
    return { title: 'Silver Athlete', level: 2, nextXP: 400, color: '#94a3b8' };
  }
  return { title: 'Bronze Explorer', level: 1, nextXP: 150, color: '#d97706' };
};
