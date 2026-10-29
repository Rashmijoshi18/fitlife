/**
 * GeminiService — secure server-side wrapper around the Google Gemini API.
 *
 * Uses @google/genai SDK (the official Google Gen AI Node.js SDK).
 * The API key is read exclusively from server-side environment variables.
 * It is NEVER exposed to the client.
 */

const { GoogleGenAI } = require('@google/genai');

// Lazy-initialize so the module loads even if key is missing
let _client = null;

const getClient = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }
  if (!_client) {
    _client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return _client;
};

const setClientKey = (key) => {
  process.env.GEMINI_API_KEY = key;
  _client = new GoogleGenAI({ apiKey: key });
};

const MODEL = 'gemini-3-flash-preview';

// ─── Safety disclaimer appended to all system prompts ────────────────────────
const SAFETY_DISCLAIMER = `
Important constraints you must always follow:
- You are a fitness coaching assistant, NOT a medical professional.
- Never diagnose medical conditions or guarantee specific health outcomes.
- Always recommend consulting a doctor before starting a new exercise program.
- Do not promise specific weight-loss amounts or timelines.
- When discussing exercises, note they are general guidance, not prescriptions.
- If a user mentions pain, injury, or medical conditions, recommend professional advice.
`;

const COACH_SYSTEM_PROMPT = `You are Coach Alex, an elite Certified Personal Gym Trainer and Strength Coach at FitLife.

CRITICAL IDENTITY & DOMAIN RESTRICTION (STRICT ENFORCEMENT):
- You are ONLY a gym trainer and fitness coach.
- You MUST ONLY answer questions directly related to:
  1. Gym workouts, exercises, lifting techniques, weight training, calisthenics, cardio, HIIT, mobility, stretching.
  2. Exercise biomechanics, proper form cues, injury prevention during training.
  3. Gym programming, splits (Push/Pull/Legs, Upper/Lower, Full Body), sets, reps, RPE, rest times, progressive overload.
  4. Sports nutrition, protein intake, muscle-building foods, pre/post-workout meals, supplements (creatine, whey, etc.), hydration.
  5. Muscle recovery, sleep for hypertrophy, DOMS/soreness, and athletic fitness goals.

NON-GYM / OFF-TOPIC QUESTIONS ARE STRICTLY FORBIDDEN:
If the user asks ANY question outside of gym, fitness, workouts, or athletic nutrition (such as math like "2+2", coding, general trivia, politics, non-fitness topics, history, etc.):
DO NOT answer the off-topic question! Never calculate math or answer trivia.
Instead, firmly and energetically decline in your gym trainer persona:
"🏋️‍♂️ **Whoa there, champ!** I am **Coach Alex**, your dedicated gym trainer. I only answer questions related to **gym workouts, lifting form, muscle building, and fitness nutrition**! Let's keep our eyes on the gains — what are we training today?"

Tone & Style for valid gym questions:
- Energetic, motivating, disciplined, and authoritative ("Let's get after it!", "Form over ego every time!", "Lock in!").
- Emphasize strict form cues (core bracing, eccentric control, joint alignment).
- Include specific sets, reps, rest periods (e.g. 3-4 sets of 8-12 reps with 60-90s rest).
- Format clearly with Markdown headings and bullet points.
Your role is to help users with workout planning, exercise guidance, fitness goals, and healthy habits.
Keep responses clear, practical, structured, and motivating (3-5 concise sections max unless more detail is requested).
Format your responses using clean Markdown (such as bold headings, bullet lists for exercise steps or food items, bold keywords, and concise markdown tables where helpful).
${SAFETY_DISCLAIMER}`;

const PLAN_SYSTEM_PROMPT = `You are a certified fitness programmer generating structured weekly workout plans.
You MUST respond with ONLY valid JSON — no explanation, no markdown fences, just raw JSON.
The JSON must exactly match the schema provided in the user's message.
${SAFETY_DISCLAIMER}`;

/**
 * Send a coaching chat message and get a response.
 * @param {string} userMessage
 * @param {Array<{role: string, parts: string}>} history - previous turns
 * @param {Object} userContext - limited profile info (fitnessLevel, goal only)
 * @returns {Promise<string>}
 */
const chat = async (userMessage, history = [], userContext = {}) => {
  const ai = getClient();

  const contextStr = userContext.fitnessLevel
    ? `\nUser context: fitness level = ${userContext.fitnessLevel}, goal = ${userContext.fitnessGoal || 'general fitness'}.`
    : '';

  const systemInstruction = COACH_SYSTEM_PROMPT + contextStr;

  // Build contents array from history
  const contents = history.map((turn) => ({
    role: turn.role,
    parts: [{ text: turn.content }],
  }));

  // Add current user message
  contents.push({
    role: 'user',
    parts: [{ text: userMessage.substring(0, 2000) }], // limit input
  });

  const response = await ai.models.generateContent({
    model: MODEL,
    systemInstruction,
    contents,
    config: {
      maxOutputTokens: 800,
      temperature: 0.7,
    },
  });

  const text = response.text;
  if (!text) throw new Error('Empty response from Gemini');
  return text;
};

/**
 * Built-in intelligent workout routine generator (expert fallback when AI quota/network fails).
 */
const buildStructuredWeeklyPlan = (profile) => {
  const goal = (profile.fitnessGoal || profile.goal || 'general_fitness').toLowerCase();
  const level = (profile.fitnessLevel || 'intermediate').toLowerCase();
  const daysPerWeek = Number(profile.daysPerWeek) || 4;
  const rawEquip = Array.isArray(profile.equipment) ? profile.equipment[0] : (profile.equipment || 'dumbbells');
  const equipStr = String(rawEquip).toLowerCase();
  const duration = Number(profile.sessionDurationMinutes || profile.durationMinutes) || 45;

  // Exercise database according to equipment
  const hasGym = equipStr.includes('full') || equipStr.includes('gym');
  const hasDumbbells = equipStr.includes('dumbbell') || equipStr.includes('home');
  const hasBands = equipStr.includes('band');

  const exercisePool = {
    upperPush: hasGym
      ? [
          { name: 'Barbell Bench Press', sets: level === 'beginner' ? 3 : 4, reps: '8-10', rest: '90s', tips: 'Retract scapulae, touch lower sternum' },
          { name: 'Incline Dumbbell Press', sets: 3, reps: '10-12', rest: '75s', tips: '30-degree incline, full stretch at bottom' },
          { name: 'Standing Overhead Barbell Press', sets: 3, reps: '8-10', rest: '90s', tips: 'Brace core, press in a straight vertical line' },
          { name: 'Cable Triceps Pushdown', sets: 3, reps: '12-15', rest: '60s', tips: 'Keep elbows pinned to your sides' },
          { name: 'Lateral Dumbbell Raises', sets: 4, reps: '12-15', rest: '45s', tips: 'Lead with elbows, slight forward torso lean' },
        ]
      : hasDumbbells
      ? [
          { name: 'Dumbbell Floor/Bench Press', sets: level === 'beginner' ? 3 : 4, reps: '10-12', rest: '75s', tips: 'Drive through chest, controlled 2-sec eccentric' },
          { name: 'Seated Dumbbell Shoulder Press', sets: 3, reps: '10-12', rest: '75s', tips: 'Palms facing forward, press without arching lower back' },
          { name: 'Standard Push-Ups', sets: 3, reps: '12-15', rest: '60s', tips: 'Hands shoulder-width, elbows at 45 degrees' },
          { name: 'Overhead Dumbbell Triceps Extension', sets: 3, reps: '12-15', rest: '60s', tips: 'Keep upper arms vertical, full elbow flexion' },
          { name: 'Dumbbell Lateral Raises', sets: 3, reps: '12-15', rest: '45s', tips: 'Control descent, avoid swinging' },
        ]
      : hasBands
      ? [
          { name: 'Resistance Band Chest Press', sets: 4, reps: '12-15', rest: '60s', tips: 'Band anchored behind back, squeeze chest at peak' },
          { name: 'Banded Overhead Press', sets: 3, reps: '12-15', rest: '60s', tips: 'Stand on band, press upward smoothly' },
          { name: 'Push-Ups with Band Resistance', sets: 3, reps: '10-12', rest: '60s', tips: 'Band draped across shoulder blades' },
          { name: 'Banded Triceps Pushdowns', sets: 3, reps: '15-20', rest: '45s', tips: 'Anchor high, lock out elbows' },
        ]
      : [
          { name: 'Standard Push-Ups', sets: 4, reps: level === 'advanced' ? '20-25' : '10-15', rest: '60s', tips: 'Full depth, chest within 1 inch of floor' },
          { name: 'Pike Push-Ups (Shoulders)', sets: 3, reps: '8-12', rest: '60s', tips: 'Hips high in the air, lower head forward' },
          { name: 'Diamond Push-Ups (Triceps)', sets: 3, reps: '8-12', rest: '60s', tips: 'Hands together under chest' },
          { name: 'Bench/Chair Dips', sets: 3, reps: '12-15', rest: '45s', tips: 'Keep back close to bench, bend to 90 degrees' },
        ],

    upperPull: hasGym
      ? [
          { name: 'Lat Pulldown (Wide Grip)', sets: 4, reps: '10-12', rest: '75s', tips: 'Pull elbows down toward back pockets' },
          { name: 'Barbell Bent-Over Row', sets: 4, reps: '8-10', rest: '90s', tips: 'Hinge at 45 degrees, pull bar to navel' },
          { name: 'Seated Cable Row', sets: 3, reps: '10-12', rest: '60s', tips: 'Full stretch forward, squeeze shoulder blades back' },
          { name: 'Face Pulls', sets: 4, reps: '15', rest: '45s', tips: 'Pull rope toward eyes with external shoulder rotation' },
          { name: 'Barbell / EZ-Bar Bicep Curls', sets: 3, reps: '10-12', rest: '60s', tips: 'Strict form, no swinging hips' },
        ]
      : hasDumbbells
      ? [
          { name: 'One-Arm Dumbbell Rows', sets: 4, reps: '10-12 each side', rest: '60s', tips: 'Pull dumbbell toward hip, flat spine' },
          { name: 'Chest-Supported / Bent-over DB Flyes', sets: 3, reps: '12-15', rest: '60s', tips: 'Target rear delts with slight elbow bend' },
          { name: 'Standing Dumbbell Bicep Curls', sets: 3, reps: '10-12', rest: '60s', tips: 'Supinate wrist at top of contraction' },
          { name: 'Dumbbell Hammer Curls', sets: 3, reps: '10-12', rest: '60s', tips: 'Palms facing each other, builds brachialis thickness' },
          { name: 'Incline Dumbbell Shrugs', sets: 3, reps: '12-15', rest: '45s', tips: 'Squeeze upper traps at apex' },
        ]
      : [
          { name: 'Inverted Rows (Under Table / Bar)', sets: 4, reps: '10-12', rest: '60s', tips: 'Straight bodyline, pull chest to bar' },
          { name: 'Doorframe / Towel Rows', sets: 3, reps: '12-15', rest: '45s', tips: 'Drive elbows back, contract lats' },
          { name: 'Prone Cobra / Superman Holds', sets: 4, reps: '45-60 seconds', rest: '45s', tips: 'Strengthen erector spinae and posterior chain' },
          { name: 'Bicep Isometric Doorway Curls', sets: 3, reps: '30s hold each side', rest: '45s', tips: 'Maximum voluntary muscle contraction' },
        ],

    legs: hasGym
      ? [
          { name: 'Barbell Back Squats', sets: 4, reps: '8-10', rest: '90s', tips: 'Hips below parallel, knees track outward' },
          { name: 'Romanian Deadlifts (RDL)', sets: 4, reps: '8-10', rest: '90s', tips: 'Hinge hips back, feel hamstring stretch' },
          { name: 'Leg Press', sets: 3, reps: '10-12', rest: '75s', tips: 'Feet shoulder-width, avoid locking knees at top' },
          { name: 'Walking Dumbbell Lunges', sets: 3, reps: '12 per leg', rest: '60s', tips: '90 degree angles in both knees' },
          { name: 'Standing Calf Raises', sets: 4, reps: '15-20', rest: '45s', tips: 'Full extension at top, pause 1 sec at bottom' },
        ]
      : hasDumbbells
      ? [
          { name: 'Goblet Squats', sets: 4, reps: '10-12', rest: '75s', tips: 'Hold dumbbell vertically at sternum, keep torso tall' },
          { name: 'Dumbbell Romanian Deadlift', sets: 4, reps: '10-12', rest: '75s', tips: 'Keep weights close to shins, flat back' },
          { name: 'Bulgarian Split Squats', sets: 3, reps: '8-10 per leg', rest: '60s', tips: 'Rear foot elevated on bench/couch, drive through front heel' },
          { name: 'Dumbbell Step-Ups', sets: 3, reps: '10 per leg', rest: '60s', tips: 'Step onto steady elevated surface with control' },
          { name: 'Standing Dumbbell Calf Raises', sets: 3, reps: '15-20', rest: '45s', tips: 'Pause 2 seconds at peak squeeze' },
        ]
      : [
          { name: 'Bodyweight Air Squats', sets: 4, reps: '15-20', rest: '45s', tips: 'Chest proud, push floor away through heels' },
          { name: 'Walking Lunges', sets: 3, reps: '12 per leg', rest: '45s', tips: 'Step long and lower rear knee toward floor' },
          { name: 'Single-Leg Glute Bridges', sets: 3, reps: '12 per leg', rest: '45s', tips: 'Drive through heel, lock glute at top' },
          { name: 'Bodyweight Wall Sit', sets: 3, reps: '45-60 seconds', rest: '45s', tips: 'Thighs parallel to floor, press back into wall' },
          { name: 'Single-Leg Calf Raises', sets: 3, reps: '15 per side', rest: '30s', tips: 'Control both ascent and descent' },
        ],

    coreAndCardio: [
      { name: 'Plank Hold', sets: 3, reps: '45-60 seconds', rest: '45s', tips: 'Squeeze glutes and abdominal wall tight' },
      { name: 'Hanging Knee Raises / Reverse Crunches', sets: 3, reps: '12-15', rest: '45s', tips: 'Curl pelvis upward without swinging' },
      { name: 'Russian Twists', sets: 3, reps: '20 total reps', rest: '30s', tips: 'Controlled rotational movement, engage obliques' },
      { name: 'Mountain Climbers', sets: 3, reps: '30 seconds', rest: '30s', tips: 'Maintain stable shoulder girdle, drive knees rapidly' },
    ]
  };

  const dayTemplates = [
    { dayOfWeek: 'monday', focus: 'Upper Body Power & Hypertrophy', exercises: [...exercisePool.upperPush.slice(0, 3), ...exercisePool.upperPull.slice(0, 2)] },
    { dayOfWeek: 'tuesday', focus: 'Lower Body & Core Overload', exercises: [...exercisePool.legs.slice(0, 4), exercisePool.coreAndCardio[0]] },
    { dayOfWeek: 'wednesday', focus: 'Active Recovery & Flexibility', isRest: true, exercises: [] },
    { dayOfWeek: 'thursday', focus: 'Chest, Shoulders & Triceps (Push)', exercises: [...exercisePool.upperPush.slice(0, 4), exercisePool.coreAndCardio[1]] },
    { dayOfWeek: 'friday', focus: 'Back, Biceps & Posterior Chain (Pull)', exercises: [...exercisePool.upperPull.slice(0, 4), exercisePool.coreAndCardio[2]] },
    { dayOfWeek: 'saturday', focus: 'Quads, Hamstrings & Calves (Legs)', exercises: [...exercisePool.legs.slice(0, 4), exercisePool.coreAndCardio[3]] },
    { dayOfWeek: 'sunday', focus: 'Rest, Recovery & Nutrition Reset', isRest: true, exercises: [] },
  ];

  // Adjust rest days according to daysPerWeek
  const days = dayTemplates.map((item, idx) => {
    // If user requested fewer days, convert extra training days to rest days
    let isRest = item.isRest;
    if (daysPerWeek === 3) {
      // Mon, Wed, Fri training
      isRest = !(idx === 0 || idx === 2 || idx === 4);
    } else if (daysPerWeek === 4) {
      // Mon, Tue, Thu, Fri training
      isRest = !(idx === 0 || idx === 1 || idx === 3 || idx === 4);
    } else if (daysPerWeek === 5) {
      // Mon through Fri training
      isRest = !(idx >= 0 && idx <= 4);
    } else if (daysPerWeek === 6) {
      // Mon through Sat training
      isRest = !(idx >= 0 && idx <= 5);
    }

    const dayFocus = isRest
      ? (idx === 6 ? 'Complete Rest & Mental Recovery' : 'Active Recovery, Mobility & Core')
      : item.focus;

    return {
      dayNumber: idx + 1,
      dayOfWeek: item.dayOfWeek,
      isRestDay: isRest,
      focus: dayFocus,
      duration: isRest ? '20 mins' : `${duration} mins`,
      estimatedDurationMinutes: isRest ? 20 : duration,
      completed: false,
      status: 'pending',
      warmup: isRest
        ? '5 min gentle dynamic stretching, thoracic openers & foam rolling'
        : '5-8 mins arm circles, cat-cows, hip openers and progressive bodyweight warm-up',
      exercises: isRest ? [] : item.exercises,
      cooldown: isRest
        ? '10 mins restorative deep breathing and light stretching'
        : '5 mins static hamstring, chest, lat, and hip flexor stretches',
      notes: isRest
        ? 'Hydrate well, eat nutrient-dense meals with adequate protein, and aim for 8 hours of sleep.'
        : `Focus on progressive overload. Track your reps and keep rest periods between sets strictly timed.`,
    };
  });

  const formattedGoal = goal.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  const formattedLevel = level.charAt(0).toUpperCase() + level.slice(1);

  return {
    title: `${formattedLevel} ${formattedGoal} Protocol`,
    description: `Personalized ${daysPerWeek}-day weekly training split optimized for ${goal.replace(/_/g, ' ')} using ${equipStr}.`,
    fitnessLevel: formattedLevel,
    goal: goal,
    daysPerWeek,
    weekPlan: days,
    progressionNotes: `Systematically increase weight by 2-5% or add 1-2 reps per exercise once you hit the upper target rep range with strict form.`,
  };
};

/**
 * Generate a structured weekly workout plan.
 * Returns a validated JavaScript object with full normalization.
 */
const generateWeeklyPlan = async (profile) => {
  const goal = (profile.fitnessGoal || profile.goal || 'general_fitness').toLowerCase();
  const level = (profile.fitnessLevel || 'intermediate').toLowerCase();
  const daysPerWeek = Number(profile.daysPerWeek) || 4;
  const rawEquip = Array.isArray(profile.equipment) ? profile.equipment[0] : (profile.equipment || 'dumbbells');
  const duration = Number(profile.sessionDurationMinutes || profile.durationMinutes) || 45;

  let planResult = null;

  // Attempt live Gemini synthesis if client is available
  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = getClient();

      const prompt = `Generate a personalized 7-day weekly workout plan for this athlete:
- Fitness Goal: ${goal}
- Experience Level: ${level}
- Training Frequency: ${daysPerWeek} training days per week (the remaining ${7 - daysPerWeek} days must be rest/recovery)
- Equipment: ${rawEquip}
- Target Session Duration: ${duration} minutes
${profile.limitations ? `- Limitations: ${profile.limitations}` : ''}

CRITICAL: Return ONLY a raw JSON object with this exact structure:
{
  "title": "${level.toUpperCase()} ${goal.toUpperCase()} Weekly Protocol",
  "description": "Short 1-2 sentence program overview",
  "weekPlan": [
    {
      "dayOfWeek": "monday",
      "isRestDay": false,
      "focus": "Upper Body Push & Hypertrophy",
      "duration": "${duration} mins",
      "warmup": "5 mins dynamic arm swings, shoulder dislocates, and light jogging",
      "exercises": [
        {
          "name": "Dumbbell Bench Press",
          "sets": 3,
          "reps": "10-12",
          "rest": "60s",
          "tips": "Drive through chest, control the 2-second negative"
        }
      ],
      "cooldown": "5 mins chest and triceps static stretching"
    }
    ...exactly 7 items for monday through sunday
  ],
  "progressionNotes": "1-2 sentences on progressive overload"
}`;

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Gemini API response timeout')), 10000)
      );

      const response = await Promise.race([
        ai.models.generateContent({
          model: MODEL,
          systemInstruction: PLAN_SYSTEM_PROMPT,
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            maxOutputTokens: 2500,
            temperature: 0.3,
            responseMimeType: 'application/json',
          },
        }),
        timeoutPromise,
      ]);

      const raw = response.text;
      if (raw) {
        // Strip markdown code fences if returned
        const cleaned = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
        const parsed = JSON.parse(cleaned);

        if (parsed.weekPlan && Array.isArray(parsed.weekPlan) && parsed.weekPlan.length >= 7) {
          planResult = parsed;
        }
      }
    } catch (geminiErr) {
      console.warn('[Gemini Weekly Plan Generation fallback activated]:', geminiErr.message);
    }
  }

  // If Gemini was unavailable or returned unexpected schema, use intelligent routine builder
  if (!planResult) {
    planResult = buildStructuredWeeklyPlan(profile);
  }

  // Guarantee normalized fields for frontend rendering
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const normalizedDays = (planResult.weekPlan || []).slice(0, 7).map((d, idx) => {
    const isRest = Boolean(d.isRestDay || (d.focus && d.focus.toLowerCase().includes('rest')));
    
    // Normalize warmup string
    let warmupStr = '5-8 mins dynamic stretching';
    if (typeof d.warmup === 'string' && d.warmup.trim()) {
      warmupStr = d.warmup;
    } else if (Array.isArray(d.warmUp)) {
      warmupStr = d.warmUp.map((w) => (typeof w === 'string' ? w : w.name || 'Warm-up drill')).join(', ');
    }

    // Normalize cooldown string
    let cooldownStr = '5 mins static stretching';
    if (typeof d.cooldown === 'string' && d.cooldown.trim()) {
      cooldownStr = d.cooldown;
    } else if (Array.isArray(d.coolDown)) {
      cooldownStr = d.coolDown.map((c) => (typeof c === 'string' ? c : c.name || 'Static stretch')).join(', ');
    }

    // Normalize exercises
    const normalizedExercises = (d.exercises || []).map((ex) => ({
      name: ex.name || 'Bodyweight Movement',
      sets: ex.sets || 3,
      reps: String(ex.reps || '10-12'),
      rest: ex.rest || (ex.restSeconds ? `${ex.restSeconds}s` : '60s'),
      tips: ex.tips || ex.notes || 'Maintain controlled tempo and full range of motion',
      notes: ex.notes || ex.tips || '',
      muscleGroup: ex.muscleGroup || 'Full Body',
      equipment: ex.equipment || rawEquip,
    }));

    return {
      dayNumber: idx + 1,
      dayOfWeek: daysOfWeek[idx],
      isRestDay: isRest,
      focus: d.focus || (isRest ? 'Rest & Recovery' : `Workout Session ${idx + 1}`),
      duration: d.duration || `${duration} mins`,
      completed: false,
      status: 'pending',
      warmup: warmupStr,
      exercises: isRest ? [] : normalizedExercises,
      cooldown: cooldownStr,
      notes: d.notes || (isRest ? 'Focus on hydration, protein intake and quality sleep.' : 'Push close to failure with strict form.'),
    };
  });

  return {
    title: planResult.title || `${level.toUpperCase()} ${goal.replace(/_/g, ' ').toUpperCase()} Routine`,
    description: planResult.description || `Tailored weekly workout split with progressive overload for ${goal.replace(/_/g, ' ')}.`,
    fitnessLevel: level,
    goal: goal,
    daysPerWeek,
    weekPlan: normalizedDays,
    progressionNotes: planResult.progressionNotes || 'Aim to add 1 rep or 2-5% load each week while keeping form tight.',
  };
};

/**
 * Generate a workout session summary using Gemini.
 */
const generateSessionSummary = async (sessionData, userContext = {}) => {
  const ai = getClient();

  const prompt = `Provide a brief, encouraging workout session summary and 2-3 actionable tips for next time.
Session data:
- Exercise: ${sessionData.exerciseName}
- Duration: ${sessionData.activeDurationMinutes} minutes
- Reps completed: ${sessionData.totalReps}
- Average form quality: ${sessionData.avgFormQuality || 'unknown'}
- Estimated calories: ${sessionData.estimatedCalories} kcal (approximate)
User level: ${userContext.fitnessLevel || 'beginner'}

Keep the response to 2-3 short paragraphs. Be encouraging and specific.`;

  const response = await ai.models.generateContent({
    model: MODEL,
    systemInstruction: COACH_SYSTEM_PROMPT,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: { maxOutputTokens: 400, temperature: 0.7 },
  });

  return response.text || 'Great workout! Keep up the consistency.';
};

module.exports = { chat, generateWeeklyPlan, generateSessionSummary, setClientKey };
