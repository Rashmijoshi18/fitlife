/**
 * calorieEstimator.js — Scientifically accurate calorie estimation for resistance & bodyweight exercises.
 *
 * Energy expenditure in resistance training combines:
 * 1. Mechanical Work & Anaerobic Glycolysis per Repetition:
 *    Lifting bodyweight mass + external dumbbell weight against gravity.
 * 2. EPOC (Excess Post-exercise Oxygen Consumption):
 *    Rapid ATP-CP replenishment, lactate clearing, and elevated oxygen uptake.
 * 3. Sustained Aerobic Baseline:
 *    Cardiovascular and metabolic baseline expenditure during active time.
 *
 * References:
 * - Compendium of Physical Activities (Ainsworth et al.)
 * - American College of Sports Medicine (ACSM) Resistance Training Energy Expenditure Equations
 */

// Baseline MET values for cardiovascular/metabolic elevation during active time
const MET_VALUES = {
  squats: { beginner: 5.0, intermediate: 6.0, advanced: 7.0 },
  pushups: { beginner: 4.8, intermediate: 6.0, advanced: 7.5 },
  bicep_curls: { beginner: 3.8, intermediate: 4.8, advanced: 5.8 },
  shoulder_press: { beginner: 4.5, intermediate: 5.8, advanced: 7.2 },
  lateral_raises: { beginner: 3.8, intermediate: 5.0, advanced: 6.2 },
  lunges: { beginner: 5.2, intermediate: 6.5, advanced: 7.8 },
  jumping_jacks: { beginner: 7.5, intermediate: 8.5, advanced: 10.0 },
  high_knees: { beginner: 8.0, intermediate: 9.5, advanced: 11.0 },
  glute_bridge: { beginner: 4.2, intermediate: 5.2, advanced: 6.5 },
  default: { beginner: 4.8, intermediate: 6.0, advanced: 7.2 },
};

// Biomechanical parameters for supported exercises
const EXERCISE_BIOMECHANICS = {
  squats: {
    fractionOfBodyweight: 0.75, // ~75% of user bodyweight displaced vertically
    displacementMeters: 0.50,    // Average squat vertical travel distance
    dumbbellMultiplier: 2,       // Pair of dumbbells held (total kg = 2 * dumbbellWeightKg)
    baseRepKcal: 0.45,
  },
  pushups: {
    fractionOfBodyweight: 0.65, // ~65% of bodyweight lifted at chest level
    displacementMeters: 0.35,    // Average pushup vertical travel
    dumbbellMultiplier: 1,       // Single/vest added resistance
    baseRepKcal: 0.42,
  },
  bicep_curls: {
    fractionOfBodyweight: 0.08, // Forearm & hand mass only
    displacementMeters: 0.45,    // Curl arc displacement
    dumbbellMultiplier: 2,       // Pair of dumbbells curled
    baseRepKcal: 0.22,
  },
  shoulder_press: {
    fractionOfBodyweight: 0.10, // Arms & hands lifted overhead
    displacementMeters: 0.50,    // Overhead vertical travel
    dumbbellMultiplier: 2,       // Pair of dumbbells pressed overhead
    baseRepKcal: 0.35,
  },
  lateral_raises: {
    fractionOfBodyweight: 0.08, // Arms abducted
    displacementMeters: 0.40,    // Shoulder level raise
    dumbbellMultiplier: 2,       // Pair of dumbbells raised
    baseRepKcal: 0.25,
  },
  lunges: {
    fractionOfBodyweight: 0.70, // Body mass lifted per lunge drive
    displacementMeters: 0.45,    // Vertical displacement
    dumbbellMultiplier: 2,       // Pair of dumbbells held at sides
    baseRepKcal: 0.44,
  },
  jumping_jacks: {
    fractionOfBodyweight: 1.0,  // Full body ballistic jump
    displacementMeters: 0.15,    // Hop height
    dumbbellMultiplier: 2,       // Light hand weights if used
    baseRepKcal: 0.25,
  },
  high_knees: {
    fractionOfBodyweight: 0.85,  // Ballistic running knee drive
    displacementMeters: 0.25,    // Knee travel
    dumbbellMultiplier: 2,       // Hand weights if used
    baseRepKcal: 0.28,
  },
  glute_bridge: {
    fractionOfBodyweight: 0.60,  // Pelvis & torso drive
    displacementMeters: 0.30,    // Vertical travel
    dumbbellMultiplier: 1,       // Weighted plate/dumbbell on hips
    baseRepKcal: 0.38,
  },
};

/**
 * Calculate energy expenditure per single repetition based on body weight and dumbbell load.
 *
 * @param {string} exerciseId
 * @param {number} dumbbellWeightKg - Weight per dumbbell in kg (0 for bodyweight)
 * @param {number} bodyWeightKg - User weight in kg
 * @returns {number} kcal burned per completed repetition
 */
export const getCaloriesPerRep = (exerciseId, dumbbellWeightKg = 0, bodyWeightKg = 70) => {
  const bio = EXERCISE_BIOMECHANICS[exerciseId] || EXERCISE_BIOMECHANICS.squats;
  const weight = Math.max(30, Math.min(220, Number(bodyWeightKg) || 70));
  const dumbbell = Math.max(0, Math.min(100, Number(dumbbellWeightKg) || 0));

  // Total mass displaced against gravity
  const massLiftedKg = (bio.fractionOfBodyweight * weight) + (bio.dumbbellMultiplier * dumbbell);

  // Mechanical work in Joules = mass (kg) * g (9.81 m/s^2) * height (m)
  const workJoules = massLiftedKg * 9.81 * bio.displacementMeters;

  // Human gross muscular efficiency is ~22% (i.e. ~4.55x metabolic energy needed per unit of mechanical work)
  // 1 kcal = 4184 Joules. Efficiency divisor: 0.22 * 4184 = 920.48
  // Resistance exercise involves anaerobic glycolysis and EPOC (factor ~1.9x)
  const metabolicWorkKcal = (workJoules / 920.48) * 1.9;

  return bio.baseRepKcal + metabolicWorkKcal;
};

/**
 * Estimate accurate total calories burned combining repetition work, external dumbbell weight, and duration.
 *
 * @param {object} params
 * @param {string} params.exerciseId - Exercise identifier (squats, pushups, bicep_curls, etc.)
 * @param {number} params.activeDurationSeconds - Active workout time in seconds
 * @param {number} params.bodyWeightKg - User body weight in kg (defaults to 70)
 * @param {number} [params.dumbbellWeightKg=0] - Weight per dumbbell in kg
 * @param {number} [params.totalReps=0] - Number of completed repetitions
 * @param {string} [params.fitnessLevel='beginner'] - beginner / intermediate / advanced
 * @param {string} [params.formQuality] - Form quality rating
 * @returns {{ estimatedCalories: number, repCalories: number, aerobicCalories: number, kcalPerRep: number, met: number, note: string }}
 */
export const estimateCalories = ({
  exerciseId,
  activeDurationSeconds = 0,
  bodyWeightKg = 70,
  dumbbellWeightKg = 0,
  totalReps = 0,
  fitnessLevel = 'beginner',
  formQuality,
}) => {
  const weight = Math.max(30, Math.min(220, Number(bodyWeightKg) || 70));
  const durationMinutes = Math.max(0, Number(activeDurationSeconds) || 0) / 60;
  const level = ['beginner', 'intermediate', 'advanced'].includes(fitnessLevel) ? fitnessLevel : 'beginner';
  const reps = Math.max(0, Number(totalReps) || 0);
  const dumbbell = Math.max(0, Math.min(100, Number(dumbbellWeightKg) || 0));

  // 1. Aerobic baseline expenditure (elevated cardiovascular burn during active time)
  const metTable = MET_VALUES[exerciseId] || MET_VALUES.default;
  const baseMet = metTable[level] || 5.0;

  // Slight MET increase if lifting external dumbbells
  const loadMetBonus = dumbbell > 0 ? Math.min(2.0, dumbbell * 0.12) : 0;
  const met = baseMet + loadMetBonus;

  // Aerobic baseline burn: MET * 3.5 * weight / 200 * durationMinutes
  const aerobicCalories = (met * 3.5 * weight / 200) * durationMinutes;

  // 2. Repetition work burn (mechanical work + anaerobic cost + EPOC)
  const kcalPerRep = getCaloriesPerRep(exerciseId, dumbbell, weight);

  // Form quality adjustment (clean full range of motion burns ~10% more than incomplete/sagging form)
  let formMultiplier = 1.0;
  if (formQuality === 'Good Form') {
    formMultiplier = 1.1;
  } else if (formQuality === 'Needs Improvement') {
    formMultiplier = 0.95;
  }

  const repCalories = reps * kcalPerRep * formMultiplier;

  // Total Calories = Repetition Work + Active Baseline Burn
  // If no reps have been completed yet, use time-based baseline so counter starts smoothly
  let totalCalories = 0;
  if (reps > 0) {
    totalCalories = repCalories + (aerobicCalories * 0.7); // blended to prevent double counting basal rate
  } else {
    totalCalories = aerobicCalories;
  }

  // Ensure sensible minimum if exercising actively
  if (durationMinutes > 0.15 && totalCalories < 1) {
    totalCalories = 1;
  }

  const finalCalories = Math.round(totalCalories);

  return {
    estimatedCalories: finalCalories,
    repCalories: Math.round(repCalories * 10) / 10,
    aerobicCalories: Math.round(aerobicCalories * 10) / 10,
    kcalPerRep: Math.round(kcalPerRep * 100) / 100,
    met,
    note: `Calculated from ${reps} reps + ${durationMinutes.toFixed(1)}m active time${dumbbell > 0 ? ` with ${dumbbell}kg dumbbells` : ''}.`,
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
