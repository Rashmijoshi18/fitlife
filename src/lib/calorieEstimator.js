/**
 * calorieEstimator.js — MET-based calorie estimation for supported exercises.
 *
 * Formula: Calories = MET × 3.5 × bodyWeightKg / 200 × durationMinutes
 *
 * MET values are approximate estimates for typical moderate intensity.
 * Actual energy expenditure varies with individual physiology, exercise technique,
 * rest periods, and effort level. These estimates are for guidance only.
 *
 * Reference: Compendium of Physical Activities (Ainsworth et al.)
 */

// MET values by exercise ID and intensity
const MET_VALUES = {
  squats: {
    beginner: 3.5,
    intermediate: 5.0,
    advanced: 6.0,
  },
  pushups: {
    beginner: 3.8,
    intermediate: 5.5,
    advanced: 7.0,
  },
  bicep_curls: {
    beginner: 3.0,
    intermediate: 4.0,
    advanced: 5.0,
  },
  jumping_jacks: {
    beginner: 7.0,
    intermediate: 8.0,
    advanced: 9.0,
  },
  lunges: {
    beginner: 4.0,
    intermediate: 5.5,
    advanced: 6.5,
  },
  default: {
    beginner: 4.0,
    intermediate: 5.5,
    advanced: 7.0,
  },
};

/**
 * Estimate calories burned.
 *
 * @param {object} params
 * @param {string} params.exerciseId - Exercise identifier
 * @param {number} params.activeDurationSeconds - Active workout time in seconds (excluding pauses)
 * @param {number} params.bodyWeightKg - User body weight in kg
 * @param {string} params.fitnessLevel - beginner / intermediate / advanced
 * @returns {{ estimatedCalories: number, met: number, note: string }}
 */
export const estimateCalories = ({ exerciseId, activeDurationSeconds, bodyWeightKg, fitnessLevel = 'beginner' }) => {
  const weight = Math.max(20, Math.min(250, Number(bodyWeightKg) || 70));
  const durationMinutes = Math.max(0, Number(activeDurationSeconds) || 0) / 60;
  const level = ['beginner', 'intermediate', 'advanced'].includes(fitnessLevel) ? fitnessLevel : 'beginner';

  const metTable = MET_VALUES[exerciseId] || MET_VALUES.default;
  const met = metTable[level];

  // Calories = MET × 3.5 × bodyWeightKg / 200 × durationMinutes
  const calories = Math.round(met * 3.5 * weight / 200 * durationMinutes);

  return {
    estimatedCalories: Math.max(0, calories),
    met,
    note: 'Calorie estimate based on MET value for typical exercise intensity. Actual expenditure varies with individual factors.',
  };
};

/**
 * Get a user-readable intensity description based on MET value.
 */
export const getIntensityLabel = (met) => {
  if (met < 3.5) return 'light';
  if (met < 6) return 'moderate';
  if (met < 9) return 'vigorous';
  return 'very vigorous';
};
