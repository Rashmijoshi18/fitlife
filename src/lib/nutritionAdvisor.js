/**
 * Nutrition & AI Workout Plan Synchronization Engine
 * Calculates scientifically grounded daily calorie, macro, and hydration targets
 * adjusted dynamically for the user's active AI workout plan and training intensity.
 */

export const calculatePlanNutritionTargets = ({
  user = {},
  plan = null,
  dateStr = new Date().toISOString().slice(0, 10),
  dayWorkouts = [],
}) => {
  // 1. User Physical Parameters (with sensible defaults)
  const weight = Number(user.weight) || 70; // kg
  const height = Number(user.height) || 175; // cm
  const age = Number(user.age) || 26; // years
  const gender = user.gender || 'male';
  const fitnessGoal = plan?.goal || user.fitnessGoal || 'general_fitness';

  // 2. Basal Metabolic Rate (Mifflin-St Jeor)
  let bmr = 10 * weight + 6.25 * height - 5 * age;
  if (gender === 'female') {
    bmr -= 161;
  } else {
    bmr += 5;
  }

  // Base sedentary TDEE without workout
  const sedentaryTdee = Math.round(bmr * 1.25);

  // 3. Inspect AI Workout Plan for the given date
  let dayPlan = null;
  let isWorkoutDay = false;
  let focus = 'General Training';
  let estimatedDuration = 45;

  if (plan && Array.isArray(plan.days) && plan.days.length > 0) {
    const targetDate = new Date(dateStr);
    const dayOfWeekIdx = targetDate.getDay(); // 0 is Sun, 1 is Mon...
    // Match plan day: Monday is usually day 0, Sunday is day 6
    const adjustedIdx = dayOfWeekIdx === 0 ? 6 : dayOfWeekIdx - 1;
    dayPlan = plan.days[adjustedIdx] || plan.days[0];

    isWorkoutDay = !dayPlan.isRestDay && (dayPlan.exercises?.length > 0 || !dayPlan.focus?.toLowerCase().includes('recovery'));
    focus = dayPlan.focus || (isWorkoutDay ? 'Active Workout' : 'Rest & Recovery');
    estimatedDuration = Number(dayPlan.estimatedDurationMinutes) || 45;
  } else {
    // If no plan, check if user logged actual workouts today
    if (dayWorkouts.length > 0) {
      isWorkoutDay = true;
      focus = dayWorkouts[0].title || 'Logged Session';
    }
  }

  // 4. Workout Energy Expenditure Adjustment
  let plannedBurn = 0;
  let burnIntensity = 'moderate';

  if (isWorkoutDay) {
    const lowerFocus = focus.toLowerCase();
    const isHeavy = lowerFocus.includes('leg') || lowerFocus.includes('lower') || lowerFocus.includes('full body');
    const kcalPerMinute = isHeavy ? 8.5 : 6.8;
    plannedBurn = Math.round(estimatedDuration * kcalPerMinute);
    burnIntensity = isHeavy ? 'high' : 'moderate';
  }

  // Actual workout burn from real recorded workouts on that day
  const actualBurn = dayWorkouts.reduce((sum, w) => sum + (Number(w.caloriesBurned) || 0), 0);
  const effectiveWorkoutBurn = Math.max(plannedBurn, actualBurn);

  // 5. Goal Deficit / Surplus
  let goalModifier = 0;
  if (fitnessGoal === 'weight_loss' || fitnessGoal === 'fat_loss') {
    goalModifier = -400; // Caloric deficit
  } else if (fitnessGoal === 'muscle_gain' || fitnessGoal === 'strength') {
    goalModifier = +250; // Lean surplus
  }

  // Total Adjusted Calorie Target
  const targetCalories = Math.max(1200, Math.round(sedentaryTdee + effectiveWorkoutBurn + goalModifier));

  // 6. Macro Distribution tailored to Workout Day vs Rest Day
  let proteinPerKg = 1.8;
  let carbPercentage = 0.45;
  let fatPercentage = 0.25;

  if (isWorkoutDay) {
    // Workout Day: Higher Carbs for glycogen replenishment, elevated protein
    proteinPerKg = fitnessGoal === 'muscle_gain' ? 2.2 : 2.0;
    carbPercentage = 0.48;
    fatPercentage = 0.22;
  } else {
    // Rest Day: Moderated Carbs, solid protein for tissue repair, healthy fats for recovery
    proteinPerKg = 1.7;
    carbPercentage = 0.38;
    fatPercentage = 0.30;
  }

  const targetProteinGrams = Math.round(weight * proteinPerKg);
  const proteinKcal = targetProteinGrams * 4;

  const targetCarbsGrams = Math.round((targetCalories * carbPercentage) / 4);
  const carbsKcal = targetCarbsGrams * 4;

  // Remaining calories to Fat
  const remainingKcalForFat = Math.max(0, targetCalories - (proteinKcal + carbsKcal));
  const targetFatGrams = Math.round(remainingKcalForFat / 9);

  // Hydration Target (ml)
  const baseWaterMl = Math.round(weight * 35); // 35ml / kg
  const workoutWaterMl = isWorkoutDay ? 650 : 0;
  const targetWaterMl = baseWaterMl + workoutWaterMl;

  // 7. Contextual AI Meal Suggestions
  let preWorkoutMeal = null;
  let postWorkoutMeal = null;

  if (isWorkoutDay) {
    preWorkoutMeal = {
      name: 'Pre-Workout Fuel: Oatmeal, Banana & Honey with Almond Milk',
      mealType: 'pre_workout',
      calories: 340,
      protein: 12,
      carbs: 64,
      fat: 5,
      timing: '60–90 minutes before your workout session',
      reason: 'Readily available complex carbohydrates to maximize workout energy and prevent fatigue.',
    };

    postWorkoutMeal = {
      name: 'Post-Workout Recovery: Grilled Chicken or Tofu Bowl with Quinoa & Steamed Veggies',
      mealType: 'post_workout',
      calories: 490,
      protein: 42,
      carbs: 52,
      fat: 10,
      timing: 'Within 45–60 minutes after your workout session',
      reason: 'Rapid protein synthesis to rebuild micro-tears and carbs to restock muscle glycogen.',
    };
  } else {
    postWorkoutMeal = {
      name: 'Rest Day Recovery Plate: Salmon or Lentil Salad with Avocado & Walnuts',
      mealType: 'dinner',
      calories: 460,
      protein: 36,
      carbs: 32,
      fat: 20,
      timing: 'Evening dinner',
      reason: 'Anti-inflammatory omega-3 fats and steady protein to accelerate joint and muscular recovery.',
    };
  }

  return {
    isWorkoutDay,
    focus,
    burnIntensity,
    plannedBurn,
    actualBurn,
    effectiveWorkoutBurn,
    estimatedDuration,
    goal: fitnessGoal,
    hasPlan: Boolean(plan),
    dayPlan,
    targets: {
      calories: targetCalories,
      protein: targetProteinGrams,
      carbs: targetCarbsGrams,
      fat: targetFatGrams,
      waterMl: targetWaterMl,
    },
    mealSuggestions: {
      preWorkout: preWorkoutMeal,
      postWorkout: postWorkoutMeal,
    },
  };
};
