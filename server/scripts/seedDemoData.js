require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Workout = require('../src/models/Workout');
const Goal = require('../src/models/Goal');
const Meal = require('../src/models/Meal');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fitlife';

const seedDemoData = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB for demo data seeding...');

    // Demo Users
    const usersData = [
      {
        name: 'Rashmi Joshi',
        email: 'rashmijoshi3699@gmail.com',
        password: 'Rashmi@3699',
        fitnessLevel: 'intermediate',
        age: 23,
        weight: 62,
        height: 168,
        gender: 'female',
        dailyCalorieTarget: 2100,
      },
      {
        name: 'Alex Turner',
        email: 'demo@fitlife.com',
        password: 'Password123!',
        fitnessLevel: 'advanced',
        age: 26,
        weight: 74,
        height: 178,
        gender: 'male',
        dailyCalorieTarget: 2400,
      },
    ];

    for (const uData of usersData) {
      let user = await User.findOne({ email: uData.email });
      if (!user) {
        user = await User.create(uData);
        console.log(`Created user: ${uData.email}`);
      } else {
        // Ensure credentials and profile match
        user.name = uData.name;
        user.password = uData.password;
        user.fitnessLevel = uData.fitnessLevel;
        user.weight = uData.weight;
        user.height = uData.height;
        user.dailyCalorieTarget = uData.dailyCalorieTarget;
        await user.save();
        console.log(`Updated user: ${uData.email}`);
      }

      // Clear existing records for this user to avoid duplicate stacking
      await Workout.deleteMany({ user: user._id });
      await Goal.deleteMany({ user: user._id });
      await Meal.deleteMany({ user: user._id });

      const now = new Date();

      // Helper to generate past dates
      const daysAgo = (days, hours = 9) => {
        const d = new Date(now);
        d.setDate(d.getDate() - days);
        d.setHours(hours, 0, 0, 0);
        return d;
      };

      // 1. Seed Workouts
      const workouts = [
        {
          user: user._id,
          title: 'Upper Body Hypertrophy (Chest & Triceps)',
          type: 'strength',
          duration: 55,
          caloriesBurned: 420,
          date: daysAgo(0, 8),
          notes: 'Felt strong on bench press. Increased incline dumbbell press weight by 2kg.',
          exercises: [
            {
              exerciseName: 'Barbell Bench Press',
              muscleGroup: 'chest',
              sets: [
                { setNumber: 1, reps: 12, weight: 60 },
                { setNumber: 2, reps: 10, weight: 70 },
                { setNumber: 3, reps: 8, weight: 75 },
                { setNumber: 4, reps: 6, weight: 80 },
              ],
            },
            {
              exerciseName: 'Incline Dumbbell Press',
              muscleGroup: 'chest',
              sets: [
                { setNumber: 1, reps: 10, weight: 24 },
                { setNumber: 2, reps: 10, weight: 26 },
                { setNumber: 3, reps: 8, weight: 28 },
              ],
            },
            {
              exerciseName: 'Triceps Rope Pushdown',
              muscleGroup: 'triceps',
              sets: [
                { setNumber: 1, reps: 15, weight: 25 },
                { setNumber: 2, reps: 12, weight: 30 },
                { setNumber: 3, reps: 10, weight: 35 },
              ],
            },
          ],
        },
        {
          user: user._id,
          title: 'Morning 5K Outdoor Run',
          type: 'cardio',
          duration: 28,
          caloriesBurned: 310,
          date: daysAgo(1, 7),
          notes: 'Average pace 5:36 min/km. Great cadence throughout the riverfront loop.',
          exercises: [
            {
              exerciseName: 'Outdoor Running',
              muscleGroup: 'cardio',
              sets: [{ setNumber: 1, distance: 5000, duration: 1680 }],
            },
          ],
        },
        {
          user: user._id,
          title: 'Back & Biceps Power Builder',
          type: 'strength',
          duration: 60,
          caloriesBurned: 460,
          date: daysAgo(2, 17),
          notes: 'Focused on lat contraction and controlled eccentric descent on pull-ups.',
          exercises: [
            {
              exerciseName: 'Deadlift',
              muscleGroup: 'back',
              sets: [
                { setNumber: 1, reps: 8, weight: 90 },
                { setNumber: 2, reps: 6, weight: 110 },
                { setNumber: 3, reps: 5, weight: 120 },
              ],
            },
            {
              exerciseName: 'Lat Pulldown',
              muscleGroup: 'back',
              sets: [
                { setNumber: 1, reps: 12, weight: 55 },
                { setNumber: 2, reps: 10, weight: 65 },
                { setNumber: 3, reps: 8, weight: 70 },
              ],
            },
            {
              exerciseName: 'Barbell Bicep Curl',
              muscleGroup: 'biceps',
              sets: [
                { setNumber: 1, reps: 12, weight: 25 },
                { setNumber: 2, reps: 10, weight: 30 },
                { setNumber: 3, reps: 8, weight: 32.5 },
              ],
            },
          ],
        },
        {
          user: user._id,
          title: 'High Intensity Interval Training (HIIT)',
          type: 'hiit',
          duration: 35,
          caloriesBurned: 380,
          date: daysAgo(3, 18),
          notes: '45s work / 15s rest intervals. Intense circuit, elevated heart rate sustained.',
          exercises: [
            {
              exerciseName: 'Burpees & Kettlebell Swings',
              muscleGroup: 'full_body',
              sets: [
                { setNumber: 1, reps: 20, weight: 16 },
                { setNumber: 2, reps: 20, weight: 16 },
                { setNumber: 3, reps: 20, weight: 16 },
              ],
            },
          ],
        },
        {
          user: user._id,
          title: 'Leg Day & Core Stability',
          type: 'strength',
          duration: 65,
          caloriesBurned: 520,
          date: daysAgo(4, 16),
          notes: 'Squats felt explosive. New 5-rep PR achieved on back squat.',
          exercises: [
            {
              exerciseName: 'Barbell Back Squat',
              muscleGroup: 'quads',
              sets: [
                { setNumber: 1, reps: 10, weight: 70 },
                { setNumber: 2, reps: 8, weight: 90 },
                { setNumber: 3, reps: 6, weight: 100 },
                { setNumber: 4, reps: 5, weight: 105 },
              ],
            },
            {
              exerciseName: 'Romanian Deadlift',
              muscleGroup: 'hamstrings',
              sets: [
                { setNumber: 1, reps: 10, weight: 60 },
                { setNumber: 2, reps: 10, weight: 70 },
                { setNumber: 3, reps: 8, weight: 80 },
              ],
            },
            {
              exerciseName: 'Hanging Leg Raise',
              muscleGroup: 'abs',
              sets: [
                { setNumber: 1, reps: 15 },
                { setNumber: 2, reps: 15 },
                { setNumber: 3, reps: 12 },
              ],
            },
          ],
        },
        {
          user: user._id,
          title: 'Vinyasa Flow & Dynamic Stretching',
          type: 'flexibility',
          duration: 40,
          caloriesBurned: 180,
          date: daysAgo(5, 7),
          notes: 'Hip openers, thoracic mobility drills, and hamstring elongation.',
          exercises: [],
        },
        {
          user: user._id,
          title: 'Shoulders & Arms Sculpt',
          type: 'strength',
          duration: 50,
          caloriesBurned: 390,
          date: daysAgo(6, 17),
          notes: 'Overhead barbell press + superset with lateral raises.',
          exercises: [
            {
              exerciseName: 'Overhead Shoulder Press',
              muscleGroup: 'shoulders',
              sets: [
                { setNumber: 1, reps: 10, weight: 35 },
                { setNumber: 2, reps: 8, weight: 42.5 },
                { setNumber: 3, reps: 6, weight: 47.5 },
              ],
            },
          ],
        },
      ];

      await Workout.insertMany(workouts);
      console.log(`Seeded ${workouts.length} workouts for ${uData.email}`);

      // 2. Seed Goals
      const goals = [
        {
          user: user._id,
          title: 'Bench Press Milestone (80 kg)',
          description: 'Achieve a clean 5-rep set of 80 kg barbell bench press with pause.',
          type: 'custom',
          targetValue: 80,
          currentValue: 75,
          unit: 'kg',
          startDate: daysAgo(20),
          deadline: daysAgo(-15),
          status: 'active',
          progressHistory: [
            { date: daysAgo(20), value: 65, note: 'Baseline starting point' },
            { date: daysAgo(10), value: 70, note: '5 reps with spotter' },
            { date: daysAgo(0), value: 75, note: 'Solid smooth lockout' },
          ],
        },
        {
          user: user._id,
          title: 'Monthly Running Distance',
          description: 'Accumulate 50 km of outdoor and treadmill cardio distance this month.',
          type: 'workout_duration',
          targetValue: 50,
          currentValue: 36,
          unit: 'km',
          startDate: daysAgo(18),
          deadline: daysAgo(-12),
          status: 'active',
          progressHistory: [
            { date: daysAgo(14), value: 12, note: 'Week 1 total' },
            { date: daysAgo(7), value: 25, note: 'Week 2 total' },
            { date: daysAgo(1), value: 36, note: 'Completed 5k run' },
          ],
        },
        {
          user: user._id,
          title: 'Consistency Challenge: 16 Workouts',
          description: 'Log 16 total workouts in 30 days to build habitual discipline.',
          type: 'workout_frequency',
          targetValue: 16,
          currentValue: 12,
          unit: 'sessions',
          startDate: daysAgo(20),
          deadline: daysAgo(-10),
          status: 'active',
          progressHistory: [
            { date: daysAgo(10), value: 6, note: 'Midway point reached' },
            { date: daysAgo(0), value: 12, note: 'On track with 4 sessions to go' },
          ],
        },
        {
          user: user._id,
          title: 'Hydration Target (3 Liters / Day)',
          description: 'Drink at least 3 liters of water consistently for 14 straight days.',
          type: 'custom',
          targetValue: 14,
          currentValue: 14,
          unit: 'days',
          startDate: daysAgo(16),
          deadline: daysAgo(-2),
          status: 'completed',
          progressHistory: [
            { date: daysAgo(16), value: 1, note: 'Started hydration challenge' },
            { date: daysAgo(2), value: 14, note: 'Challenge completed successfully!' },
          ],
        },
      ];

      await Goal.insertMany(goals);
      console.log(`Seeded ${goals.length} goals for ${uData.email}`);

      // 3. Seed Meals (Today's nutritious meal logs)
      const meals = [
        {
          user: user._id,
          name: 'Protein Oatmeal Bowl with Berries & Honey',
          mealType: 'breakfast',
          date: daysAgo(0, 8),
          servingSize: 1,
          servingUnit: 'bowl',
          calories: 450,
          protein: 34,
          carbs: 58,
          fat: 8,
          fiber: 9,
          notes: 'Rolled oats, 1 scoop whey isolate, chia seeds, fresh blueberries, pinch of cinnamon.',
        },
        {
          user: user._id,
          name: 'Grilled Chicken Breast & Brown Rice Quinoa Bowl',
          mealType: 'lunch',
          date: daysAgo(0, 13),
          servingSize: 1,
          servingUnit: 'plate',
          calories: 620,
          protein: 52,
          carbs: 65,
          fat: 14,
          fiber: 7,
          notes: '200g grilled chicken, steamed broccoli, roasted sweet peppers, olive oil drizzle.',
        },
        {
          user: user._id,
          name: 'Greek Yogurt with Almonds & Flaxseeds',
          mealType: 'snack',
          date: daysAgo(0, 16),
          servingSize: 1,
          servingUnit: 'cup',
          calories: 240,
          protein: 22,
          carbs: 14,
          fat: 11,
          fiber: 4,
          notes: 'Non-fat plain Greek yogurt with 15 raw almonds.',
        },
        {
          user: user._id,
          name: 'Pan-Seared Salmon Fillet with Asparagus & Sweet Potato',
          mealType: 'dinner',
          date: daysAgo(0, 20),
          servingSize: 1,
          servingUnit: 'plate',
          calories: 580,
          protein: 44,
          carbs: 45,
          fat: 22,
          fiber: 6,
          notes: 'Rich in Omega-3 healthy fats, baked sweet potato wedges, lemon herb asparagus.',
        },
        // Yesterday's meals
        {
          user: user._id,
          name: 'Scrambled Eggs with Avocado Sourdough Toast',
          mealType: 'breakfast',
          date: daysAgo(1, 8),
          servingSize: 2,
          servingUnit: 'slices',
          calories: 490,
          protein: 28,
          carbs: 38,
          fat: 24,
          fiber: 6,
          notes: '3 eggs scrambled with spinach and crushed red pepper.',
        },
        {
          user: user._id,
          name: 'Turkey Breast Wrap with Hummus & Greens',
          mealType: 'lunch',
          date: daysAgo(1, 13),
          servingSize: 1,
          servingUnit: 'wrap',
          calories: 530,
          protein: 42,
          carbs: 48,
          fat: 16,
          fiber: 5,
          notes: 'Whole wheat tortilla, lean turkey, cucumber, and roasted red pepper hummus.',
        },
        {
          user: user._id,
          name: 'Grass-Fed Beef Stir-Fry with Jasmine Rice',
          mealType: 'dinner',
          date: daysAgo(1, 19),
          servingSize: 1,
          servingUnit: 'bowl',
          calories: 670,
          protein: 48,
          carbs: 72,
          fat: 19,
          fiber: 5,
          notes: 'Lean sirloin strips, snap peas, bell peppers, low-sodium tamari.',
        },
      ];

      await Meal.insertMany(meals);
      console.log(`Seeded ${meals.length} meals for ${uData.email}`);
    }

    console.log('✅ All demo data seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding demo data:', error);
    process.exit(1);
  }
};

seedDemoData();
