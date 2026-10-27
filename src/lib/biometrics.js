/**
 * Clinical & Biometric Health Calculations Engine
 * Accurately computes BMI, BMR, TDEE, Ideal Weight Range, and Hydration
 * based on user's exact height (cm), weight (kg), age, and gender.
 */

export const calculateBiometrics = ({
  weight = 70, // kg
  height = 175, // cm
  age = 25, // years
  gender = 'male',
  fitnessLevel = 'intermediate',
}) => {
  const w = Math.max(20, Math.min(350, Number(weight) || 70));
  const h = Math.max(80, Math.min(260, Number(height) || 175));
  const a = Math.max(10, Math.min(120, Number(age) || 25));

  // 1. Body Mass Index (BMI)
  const heightM = h / 100;
  const bmiValue = Number((w / (heightM * heightM)).toFixed(1));

  let bmiCategory = 'Normal weight';
  let bmiColor = '#10b981'; // emerald
  let bmiDescription = 'Healthy, optimal body composition range.';

  if (bmiValue < 18.5) {
    bmiCategory = 'Underweight';
    bmiColor = '#3b82f6'; // blue
    bmiDescription = 'Below standard weight for height. Caloric surplus recommended.';
  } else if (bmiValue < 25) {
    bmiCategory = 'Normal weight';
    bmiColor = '#10b981'; // emerald
    bmiDescription = 'Optimal body composition. Maintain balance and progressive overload.';
  } else if (bmiValue < 30) {
    bmiCategory = 'Overweight';
    bmiColor = '#f59e0b'; // amber
    bmiDescription = 'Moderate excess mass. A slight caloric deficit will optimize health.';
  } else {
    bmiCategory = 'Obesity class';
    bmiColor = '#ef4444'; // red
    bmiDescription = 'Elevated mass index. Prioritize low-impact cardio & balanced nutrition.';
  }

  // 2. Ideal Weight Range (for BMI 18.5 - 24.9)
  const minIdealWeight = Math.round(18.5 * heightM * heightM);
  const maxIdealWeight = Math.round(24.9 * heightM * heightM);

  // 3. Basal Metabolic Rate (BMR) - Mifflin-St Jeor Equation
  let bmr = Math.round(10 * w + 6.25 * h - 5 * a);
  if (gender === 'female') {
    bmr -= 161;
  } else {
    bmr += 5;
  }

  // 4. Total Daily Energy Expenditure (TDEE) based on activity / fitness level
  const activityMultipliers = {
    beginner: 1.35, // light activity (1-3 days)
    intermediate: 1.55, // moderate activity (3-5 days)
    advanced: 1.725, // heavy training (6-7 days)
  };
  const multiplier = activityMultipliers[fitnessLevel] || 1.45;
  const tdee = Math.round(bmr * multiplier);

  // 5. Water Hydration Target
  const dailyWaterMl = Math.round(w * 35); // 35ml per kg body weight

  // 6. Protein Requirements Range (g)
  const minProteinGrams = Math.round(w * 1.6);
  const optimalProteinGrams = Math.round(w * 2.0);

  return {
    bmi: bmiValue,
    bmiCategory,
    bmiColor,
    bmiDescription,
    idealWeight: { min: minIdealWeight, max: maxIdealWeight },
    bmr,
    tdee,
    dailyWaterMl,
    protein: { min: minProteinGrams, optimal: optimalProteinGrams },
  };
};
