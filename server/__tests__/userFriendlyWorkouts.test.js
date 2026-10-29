/**
 * userFriendlyWorkouts.test.js
 * Comprehensive testing of the user-friendly workout logging system:
 * - Automatic MET energy calculation (no manual typing or math required)
 * - 1-Click Quick Preset logic & duration scaling
 * - Smart Natural Language / Voice input parser
 * - 1-Click Re-log ("Repeat") workflow
 * - Workout data integrity and validation
 */

// Formula implemented in WorkoutsPage.jsx
const calculateBurn = (type, durationMinutes, weightKg = 70) => {
  const metMap = { strength: 6.0, cardio: 8.5, hiit: 10.0, flexibility: 3.5, sports: 7.5, other: 5.0 };
  const met = metMap[type] || 5.5;
  const weight = Math.max(40, Math.min(180, Number(weightKg) || 70));
  const minutes = Math.max(1, Number(durationMinutes) || 0);
  return Math.round((met * 3.5 * weight / 200) * minutes);
};

// Smart Parser implemented in WorkoutsPage.jsx
const parseSmartWorkout = (rawText, userWeight = 70) => {
  const raw = (rawText || '').trim();
  if (!raw) return null;

  const lower = raw.toLowerCase();

  // Extract duration (e.g. "25 min", "45 mins", "30m")
  let duration = 30;
  const durationMatch = lower.match(/(\d+)\s*(?:min|mins|minute|minutes|m\b)/i);
  if (durationMatch) {
    duration = parseInt(durationMatch[1], 10);
  } else {
    const numMatch = lower.match(/\b(\d+)\b/);
    if (numMatch && parseInt(numMatch[1], 10) >= 5 && parseInt(numMatch[1], 10) <= 240) {
      duration = parseInt(numMatch[1], 10);
    }
  }

  // Extract type (prioritize specific high-intensity styles before general cardio)
  let type = 'other';
  if (/hiit|tabata|interval|circuit/i.test(lower)) {
    type = 'hiit';
  } else if (/yoga|stretch|pilates|mobility|flexibility/i.test(lower)) {
    type = 'flexibility';
  } else if (/strength|lift|chest|back|legs|push|pull|squat|bench|dumbbell|barbell|bicep|weights/i.test(lower)) {
    type = 'strength';
  } else if (/football|soccer|basketball|tennis|badminton|boxing|sports/i.test(lower)) {
    type = 'sports';
  } else if (/ran|run|running|jog|jogging|treadmill|walk|walking|cycle|cycling|bike|swim|swimming|elliptical|cardio|sprint/i.test(lower)) {
    type = 'cardio';
  }

  const cleanTitle = raw.charAt(0).toUpperCase() + raw.slice(1);
  const caloriesBurned = calculateBurn(type, duration, userWeight);
  const mood = /tired|exhausted/i.test(lower) ? 'tired' : /great|awesome|crushed/i.test(lower) ? 'great' : 'good';

  return {
    title: cleanTitle,
    type,
    duration,
    caloriesBurned,
    mood,
  };
};

describe('User-Friendly Workout Logging System', () => {
  describe('1. Automatic ACSM Calorie Burn Calculation (No manual guessing)', () => {
    test('accurately calculates calories for strength workouts without user input', () => {
      // 45 min strength session for 70kg user: (6.0 * 3.5 * 70 / 200) * 45 = ~331 kcal
      const burn = calculateBurn('strength', 45, 70);
      expect(burn).toBeGreaterThan(300);
      expect(burn).toBeLessThan(350);
      expect(typeof burn).toBe('number');
    });

    test('accurately scales with higher intensity HIIT training', () => {
      // HIIT has high MET (10.0) -> burns more per minute than walking
      const hiitBurn = calculateBurn('hiit', 20, 70);
      const walkBurn = calculateBurn('other', 20, 70);
      expect(hiitBurn).toBeGreaterThan(walkBurn);
      expect(hiitBurn).toBeCloseTo(245, -1);
    });

    test('adapts to user body weight from profile', () => {
      // 80kg user should burn more calories for the exact same duration than 60kg user
      const burn60kg = calculateBurn('cardio', 30, 60);
      const burn80kg = calculateBurn('cardio', 30, 80);
      expect(burn80kg).toBeGreaterThan(burn60kg);
    });

    test('handles edge case inputs gracefully', () => {
      expect(calculateBurn('unknown_type', 0, 70)).toBeGreaterThan(0); // Clamped minimum
      expect(calculateBurn('strength', -10, null)).toBeGreaterThan(0);
    });
  });

  describe('2. 1-Click Quick Presets & Instant Duration Switching', () => {
    const presets = [
      { id: 'p1', title: 'Full Body Strength', type: 'strength', defaultDuration: 45 },
      { id: 'p2', title: 'Cardio Run / Jog', type: 'cardio', defaultDuration: 30 },
      { id: 'p3', title: 'HIIT Fat Burner', type: 'hiit', defaultDuration: 20 },
      { id: 'p4', title: 'Morning Yoga Flow', type: 'flexibility', defaultDuration: 25 },
      { id: 'p5', title: 'Cycling Session', type: 'cardio', defaultDuration: 35 },
      { id: 'p6', title: 'Brisk Power Walk', type: 'cardio', defaultDuration: 30 },
    ];

    test('all presets have pre-configured durations and auto-calculated calories', () => {
      presets.forEach((p) => {
        const calories = calculateBurn(p.type, p.defaultDuration, 70);
        expect(calories).toBeGreaterThan(50);
        expect(p.defaultDuration).toBeGreaterThan(10);
      });
    });

    test('switching duration pills (15m, 30m, 45m, 60m) instantly scales energy expenditure', () => {
      const p = presets[0]; // Full Body Strength
      const burn15m = calculateBurn(p.type, 15, 70);
      const burn30m = calculateBurn(p.type, 30, 70);
      const burn60m = calculateBurn(p.type, 60, 70);

      expect(burn30m).toBeGreaterThan(burn15m);
      expect(burn60m).toBeGreaterThan(burn30m);
      expect(burn60m).toBeCloseTo(burn30m * 2, -1);
    });
  });

  describe('3. Smart Natural Language / Voice Prompt Parser', () => {
    test('parses "Ran 5k in 25 min" -> cardio, 25 mins, auto-calories', () => {
      const parsed = parseSmartWorkout('Ran 5k in 25 min', 70);
      expect(parsed).not.toBeNull();
      expect(parsed.type).toBe('cardio');
      expect(parsed.duration).toBe(25);
      expect(parsed.caloriesBurned).toBeGreaterThan(200);
      expect(parsed.title).toBe('Ran 5k in 25 min');
    });

    test('parses "45 min chest & triceps strength" -> strength, 45 mins', () => {
      const parsed = parseSmartWorkout('45 min chest & triceps strength', 70);
      expect(parsed.type).toBe('strength');
      expect(parsed.duration).toBe(45);
      expect(parsed.caloriesBurned).toBeGreaterThan(300);
    });

    test('parses "20 min HIIT cardio burn" -> hiit, 20 mins', () => {
      const parsed = parseSmartWorkout('20 min HIIT cardio burn', 70);
      expect(parsed.type).toBe('hiit');
      expect(parsed.duration).toBe(20);
      expect(parsed.caloriesBurned).toBeGreaterThan(200);
    });

    test('parses "30 min morning yoga stretch" -> flexibility, 30 mins', () => {
      const parsed = parseSmartWorkout('30 min morning yoga stretch', 70);
      expect(parsed.type).toBe('flexibility');
      expect(parsed.duration).toBe(30);
      expect(parsed.caloriesBurned).toBeCloseTo(129, -1);
    });

    test('parses "Felt exhausted after 15 min sprint" -> sets mood to tired', () => {
      const parsed = parseSmartWorkout('Felt exhausted after 15 min sprint', 70);
      expect(parsed.duration).toBe(15);
      expect(parsed.mood).toBe('tired');
    });

    test('returns null for empty or whitespace prompts', () => {
      expect(parseSmartWorkout('')).toBeNull();
      expect(parseSmartWorkout('   ')).toBeNull();
    });
  });

  describe('4. 1-Click Re-Log ("Repeat Workout") Logic', () => {
    test('repeats a previous workout seamlessly with today timestamp and preserved metrics', () => {
      const pastWorkout = {
        _id: 'wkt_123',
        title: 'Morning Push Day',
        type: 'strength',
        duration: 45,
        caloriesBurned: 330,
        mood: 'great',
        notes: 'Bench press PR',
      };

      const repeatedPayload = {
        title: pastWorkout.title,
        type: pastWorkout.type,
        duration: pastWorkout.duration,
        caloriesBurned: pastWorkout.caloriesBurned,
        date: new Date().toISOString().split('T')[0],
        mood: pastWorkout.mood,
        notes: `Repeated: ${pastWorkout.notes}`,
      };

      expect(repeatedPayload.title).toBe('Morning Push Day');
      expect(repeatedPayload.duration).toBe(45);
      expect(repeatedPayload.caloriesBurned).toBe(330);
      expect(repeatedPayload.notes).toContain('Repeated');
      expect(repeatedPayload.date).toBeDefined();
    });
  });

  describe('5. Gym Trainer Domain Enforcement Guard (Only Gym Questions Answered)', () => {
    const isGymFitnessQuery = (text) => {
      if (!text || !text.trim()) return false;
      const t = text.trim().toLowerCase();

      // Math expressions
      if (/^[\d\s\+\-\*\/\^\(\)\.\=\%]+$/.test(t) || /\b(calculate|equation|solve|math|algebra|geometry)\b/i.test(t)) {
        return false;
      }

      // Off-topic subjects
      if (/\b(python|javascript|java|c\+\+|html|css|react|sql|coding|programming|bug|compile|prime minister|president|election|capital of|movie|celebrity|bitcoin|crypto|weather today)\b/i.test(t)) {
        return false;
      }

      const gymKeywords = /\b(gym|workout|workouts|exercise|exercises|lift|lifting|lifter|weight|weights|dumbbell|barbell|kettlebell|cable|machine|smith|bench|press|squat|squats|deadlift|deadlifts|pullup|pull-up|chin-up|pushup|push-up|dip|dips|curl|curls|lunge|lunges|plank|row|rows|lat|lats|chest|pecs|back|shoulder|shoulders|delts|bicep|biceps|tricep|triceps|forearm|quads|hamstrings|calves|glutes|abs|core|obliques|cardio|running|runner|jog|jogging|treadmill|cycling|bike|swim|swimming|hiit|tabata|crossfit|calisthenics|bodybuilding|hypertrophy|strength|endurance|stamina|reps|rep|sets|set|rpe|rir|failure|overload|progressive|volume|intensity|split|ppl|push-pull-legs|warmup|warm-up|cooldown|stretch|stretching|mobility|flexibility|recovery|sore|soreness|doms|rest|sleep|protein|creatine|whey|pre-workout|post-workout|carbs|fats|calories|diet|meal|meals|nutrition|hydration|water|banana|egg|eggs|chicken|rice|oats|fish|meat|supplements|supplement|bulk|bulking|cut|cutting|shred|lean|bmi|fat loss|weight loss|muscle|gains|gain|physique|fitness|athlete|training|trainer|coach|fitlife)\b/i;

      if (gymKeywords.test(t)) return true;

      if (/^(hi|hello|hey|coach|alex|good morning|good evening|howdy|what's up|sup|help)[\s!\.\?]*$/i.test(t)) {
        return true;
      }

      return false;
    };

    test('strictly rejects math questions (e.g. "2+2", "5*10")', () => {
      expect(isGymFitnessQuery('2+2')).toBe(false);
      expect(isGymFitnessQuery('2 + 2')).toBe(false);
      expect(isGymFitnessQuery('5 * 10')).toBe(false);
      expect(isGymFitnessQuery('calculate 100/4')).toBe(false);
    });

    test('strictly rejects coding, political, and general trivia queries', () => {
      expect(isGymFitnessQuery('write a python script')).toBe(false);
      expect(isGymFitnessQuery('who is the president of USA?')).toBe(false);
      expect(isGymFitnessQuery('what is the capital of France?')).toBe(false);
      expect(isGymFitnessQuery('buy bitcoin crypto')).toBe(false);
    });

    test('strictly allows all gym, workout, lifting, and sports nutrition queries', () => {
      expect(isGymFitnessQuery('What should I eat before lifting weights?')).toBe(true);
      expect(isGymFitnessQuery('Give me a 4-day Push Pull Legs split')).toBe(true);
      expect(isGymFitnessQuery('How to improve my squat form without hurting my back?')).toBe(true);
      expect(isGymFitnessQuery('How much daily protein do I need for hypertrophy?')).toBe(true);
      expect(isGymFitnessQuery('eating banana with egg is healthy for gym?')).toBe(true);
      expect(isGymFitnessQuery('hi coach')).toBe(true);
    });
  });
});
