const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const Exercise = require('../src/models/Exercise');

const exercises = [
  // Chest
  { name: 'Barbell Bench Press', muscleGroup: 'chest', equipment: 'barbell', difficulty: 'intermediate', type: 'strength', instructions: 'Lie on a flat bench. Grip the barbell slightly wider than shoulder-width. Lower to your chest, press back up explosively.', tips: ['Keep feet flat on the floor', 'Maintain natural arch in lower back', 'Keep wrists straight'] },
  { name: 'Push-Up', muscleGroup: 'chest', equipment: 'bodyweight', difficulty: 'beginner', type: 'strength', instructions: 'Start in plank position, hands just outside shoulder width. Lower your chest to the floor, then push back up.', tips: ['Keep your core tight', 'Don\'t let hips sag', 'Full range of motion'] },
  { name: 'Dumbbell Flyes', muscleGroup: 'chest', equipment: 'dumbbell', difficulty: 'intermediate', type: 'strength', instructions: 'Lie on a flat bench, hold dumbbells above your chest. Lower them in a wide arc, feel the stretch, then return.', tips: ['Slight bend in elbows throughout', 'Control the descent', 'Don\'t go too heavy'] },
  { name: 'Incline Dumbbell Press', muscleGroup: 'chest', equipment: 'dumbbell', difficulty: 'intermediate', type: 'strength', instructions: 'Set bench to 30–45 degrees. Press dumbbells from chest level upward, angling slightly inward at the top.', tips: ['Keep elbows at 45 degrees to body', 'Full range of motion'] },

  // Back
  { name: 'Deadlift', muscleGroup: 'back', equipment: 'barbell', difficulty: 'advanced', type: 'strength', instructions: 'Stand with bar over mid-foot. Hinge at hips, grip bar, drive through floor while keeping back neutral. Lock out at the top.', tips: ['Keep bar close to your body', 'Brace your core before lifting', 'Don\'t round your lower back'] },
  { name: 'Pull-Up', muscleGroup: 'back', equipment: 'bodyweight', difficulty: 'intermediate', type: 'strength', instructions: 'Hang from bar with overhand grip, shoulder-width apart. Pull your chin above the bar, lower with control.', tips: ['Engage lats before pulling', 'Avoid swinging', 'Full dead hang at bottom'] },
  { name: 'Barbell Row', muscleGroup: 'back', equipment: 'barbell', difficulty: 'intermediate', type: 'strength', instructions: 'Hinge forward ~45 degrees. Pull bar to lower chest/upper abdomen, squeeze shoulder blades at top.', tips: ['Keep back neutral', 'Drive elbows back', 'Control the descent'] },
  { name: 'Lat Pulldown', muscleGroup: 'back', equipment: 'cable', difficulty: 'beginner', type: 'strength', instructions: 'Grip bar wider than shoulder width. Pull bar to upper chest, lean back slightly, squeeze lats.', tips: ['Don\'t use momentum', 'Lead with elbows', 'Full stretch at top'] },
  { name: 'Dumbbell Row', muscleGroup: 'back', equipment: 'dumbbell', difficulty: 'beginner', type: 'strength', instructions: 'Support one knee and hand on bench. Pull dumbbell from hanging position to hip level, elbow drives back.', tips: ['Keep back parallel to floor', 'Don\'t rotate torso excessively'] },

  // Shoulders
  { name: 'Overhead Press', muscleGroup: 'shoulders', equipment: 'barbell', difficulty: 'intermediate', type: 'strength', instructions: 'Stand with barbell at upper chest. Press overhead until arms are fully extended, lower with control.', tips: ['Keep core braced', 'Don\'t hyperextend lower back', 'Bar path is slightly back at top'] },
  { name: 'Lateral Raise', muscleGroup: 'shoulders', equipment: 'dumbbell', difficulty: 'beginner', type: 'strength', instructions: 'Stand with dumbbells at sides. Raise arms to shoulder height, slight bend at elbows. Lower slowly.', tips: ['Don\'t shrug', 'Lead with elbows', 'Control the negative'] },
  { name: 'Face Pull', muscleGroup: 'shoulders', equipment: 'cable', difficulty: 'beginner', type: 'strength', instructions: 'Set cable at face height with rope attachment. Pull rope to face level, externally rotating shoulders.', tips: ['Great for shoulder health', 'Keep elbows high', 'Use moderate weight'] },

  // Biceps
  { name: 'Barbell Curl', muscleGroup: 'biceps', equipment: 'barbell', difficulty: 'beginner', type: 'strength', instructions: 'Stand with barbell, underhand grip. Curl bar to shoulder height, keeping elbows at sides.', tips: ['Don\'t swing', 'Full extension at bottom', 'Squeeze at the top'] },
  { name: 'Hammer Curl', muscleGroup: 'biceps', equipment: 'dumbbell', difficulty: 'beginner', type: 'strength', instructions: 'Neutral grip (palms facing each other). Curl dumbbells alternately or together to shoulder height.', tips: ['Works brachialis too', 'Keep wrists neutral throughout'] },
  { name: 'Concentration Curl', muscleGroup: 'biceps', equipment: 'dumbbell', difficulty: 'beginner', type: 'strength', instructions: 'Seated, elbow braced against inner thigh. Curl dumbbell slowly to shoulder, lower with control.', tips: ['Full range of motion', 'No momentum', 'Feel the peak contraction'] },

  // Triceps
  { name: 'Tricep Dip', muscleGroup: 'triceps', equipment: 'bodyweight', difficulty: 'intermediate', type: 'strength', instructions: 'Support on parallel bars or bench. Lower until upper arms parallel to floor, press back up.', tips: ['Keep elbows pointing back', 'Lean slightly forward for chest focus, upright for triceps'] },
  { name: 'Skull Crusher', muscleGroup: 'triceps', equipment: 'barbell', difficulty: 'intermediate', type: 'strength', instructions: 'Lie on bench, arms straight up. Lower bar to forehead by bending elbows, press back up.', tips: ['Keep upper arms stationary', 'Use lighter weight first', 'Spotter recommended'] },
  { name: 'Tricep Pushdown', muscleGroup: 'triceps', equipment: 'cable', difficulty: 'beginner', type: 'strength', instructions: 'Stand at cable machine, push bar down by extending elbows, keep upper arms stationary.', tips: ['Lean slightly forward', 'Keep elbows at sides', 'Full extension at bottom'] },

  // Legs
  { name: 'Barbell Back Squat', muscleGroup: 'legs', equipment: 'barbell', difficulty: 'advanced', type: 'strength', instructions: 'Bar on upper traps. Squat down keeping chest up, knees tracking toes. Drive through heels to stand.', tips: ['Depth to at least parallel', 'Brace core throughout', 'Knees out on the way up'] },
  { name: 'Romanian Deadlift', muscleGroup: 'legs', equipment: 'barbell', difficulty: 'intermediate', type: 'strength', instructions: 'Hold bar at hip level. Hinge back and down, keeping back straight, feel hamstring stretch. Drive hips forward to stand.', tips: ['Keep bar close to legs', 'Don\'t round lower back', 'Stop before losing neutral spine'] },
  { name: 'Leg Press', muscleGroup: 'legs', equipment: 'machine', difficulty: 'beginner', type: 'strength', instructions: 'Sit in machine, feet shoulder-width on platform. Press platform away by extending knees, lower with control.', tips: ['Don\'t lock out knees hard', 'Keep lower back against pad', 'Control the descent'] },
  { name: 'Lunges', muscleGroup: 'legs', equipment: 'bodyweight', difficulty: 'beginner', type: 'strength', instructions: 'Step forward with one leg, lower knee toward floor. Push through front heel to return. Alternate legs.', tips: ['Keep torso upright', 'Front knee over ankle', 'Can add dumbbells for progression'] },
  { name: 'Leg Curl', muscleGroup: 'legs', equipment: 'machine', difficulty: 'beginner', type: 'strength', instructions: 'Lie face down on machine. Curl weight toward glutes by flexing hamstrings, lower slowly.', tips: ['Don\'t lift hips', 'Full range of motion', 'Squeeze at top'] },
  { name: 'Calf Raise', muscleGroup: 'legs', equipment: 'machine', difficulty: 'beginner', type: 'strength', instructions: 'Stand on edge of platform, heels hanging. Rise up on toes, lower heels below platform level.', tips: ['Full range of motion', 'Slow and controlled', 'Can do seated or standing'] },

  // Glutes
  { name: 'Hip Thrust', muscleGroup: 'glutes', equipment: 'barbell', difficulty: 'intermediate', type: 'strength', instructions: 'Upper back on bench, barbell over hips. Drive hips up to ceiling, squeeze glutes at top.', tips: ['Chin to chest at top', 'Drive through heels', 'Full hip extension'] },
  { name: 'Glute Bridge', muscleGroup: 'glutes', equipment: 'bodyweight', difficulty: 'beginner', type: 'strength', instructions: 'Lie on back, knees bent. Drive hips up, squeezing glutes. Hold briefly at top.', tips: ['Keep core tight', 'Feet flat on floor', 'Great activation exercise'] },

  // Core
  { name: 'Plank', muscleGroup: 'core', equipment: 'bodyweight', difficulty: 'beginner', type: 'strength', instructions: 'Forearms on floor, body in straight line. Hold position maintaining neutral spine.', tips: ['Don\'t hold breath', 'Squeeze glutes and core', 'Keep hips level'] },
  { name: 'Crunch', muscleGroup: 'core', equipment: 'bodyweight', difficulty: 'beginner', type: 'strength', instructions: 'Lie on back, knees bent. Curl shoulders off floor contracting abs, lower with control.', tips: ['Don\'t pull neck', 'Full contraction at top', 'Exhale on the way up'] },
  { name: 'Russian Twist', muscleGroup: 'core', equipment: 'bodyweight', difficulty: 'intermediate', type: 'strength', instructions: 'Seated, lean back slightly, feet off floor. Rotate torso side to side, optionally holding weight.', tips: ['Keep spine straight', 'Slow controlled rotation', 'Don\'t rush'] },
  { name: 'Hanging Leg Raise', muscleGroup: 'core', equipment: 'bodyweight', difficulty: 'advanced', type: 'strength', instructions: 'Hang from bar. Raise legs to 90 degrees (or higher), lower with control without swinging.', tips: ['Posterior pelvic tilt at top', 'No momentum', 'Bend knees to regress'] },
  { name: 'Cable Crunch', muscleGroup: 'core', equipment: 'cable', difficulty: 'intermediate', type: 'strength', instructions: 'Kneel at cable machine, rope overhead. Pull elbows to knees by crunching abs.', tips: ['Round the lower back', 'Weight on abs not arms', 'Full stretch at top'] },

  // Cardio
  { name: 'Treadmill Run', muscleGroup: 'cardio', equipment: 'machine', difficulty: 'beginner', type: 'cardio', instructions: 'Set speed and incline. Maintain comfortable pace with upright posture and light grip on handles.', tips: ['Warm up at slow pace', 'Land mid-foot', 'Stay hydrated'] },
  { name: 'Jump Rope', muscleGroup: 'cardio', equipment: 'other', difficulty: 'beginner', type: 'cardio', instructions: 'Hold rope handles at hip height. Swing rope overhead and jump over it with both feet, maintaining rhythm.', tips: ['Start slow', 'Land softly on balls of feet', 'Keep jumps small'] },
  { name: 'Burpee', muscleGroup: 'cardio', equipment: 'bodyweight', difficulty: 'intermediate', type: 'cardio', instructions: 'From standing, drop to plank, do a push-up, jump feet forward, then jump up with arms overhead.', tips: ['Scale by removing push-up', 'Maintain form over speed', 'Great conditioning exercise'] },
  { name: 'Mountain Climbers', muscleGroup: 'cardio', equipment: 'bodyweight', difficulty: 'beginner', type: 'cardio', instructions: 'Start in push-up position. Drive knees alternately toward chest as fast as possible while keeping hips down.', tips: ['Keep hips level', 'Engage core', 'Control breathing'] },
  { name: 'Rowing Machine', muscleGroup: 'cardio', equipment: 'machine', difficulty: 'beginner', type: 'cardio', instructions: 'Sit in rower, feet strapped. Drive through legs first, lean back, pull handle to lower chest. Return in reverse.', tips: ['60% legs, 20% back, 20% arms', 'Smooth consistent pace', 'Monitor stroke rate'] },

  // Full body
  { name: 'Clean and Press', muscleGroup: 'full_body', equipment: 'barbell', difficulty: 'advanced', type: 'strength', instructions: 'Pull barbell from floor explosively to shoulders in one motion, then press overhead. Lower and repeat.', tips: ['Technical lift — learn properly', 'Explosive hip drive', 'Catch bar in front rack position'] },
  { name: 'Kettlebell Swing', muscleGroup: 'full_body', equipment: 'other', difficulty: 'intermediate', type: 'strength', instructions: 'Hinge at hips to swing kettlebell back between legs, drive hips forward explosively to swing it to chest height.', tips: ['Hinge not squat', 'Keep back flat', 'Hike the bell back like a hike pass'] },
  { name: 'Box Jump', muscleGroup: 'full_body', equipment: 'other', difficulty: 'intermediate', type: 'cardio', instructions: 'Stand before box, drop slightly, then jump onto box landing softly with bent knees. Step back down.', tips: ['Land softly — absorb impact', 'Start lower box', 'Step down never jump down'] },
];

const seedExercises = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fitlife';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    await Exercise.deleteMany({});
    const inserted = await Exercise.insertMany(exercises);
    console.log(`✅ Seeded ${inserted.length} exercises`);

    mongoose.disconnect();
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedExercises();
