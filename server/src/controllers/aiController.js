const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const geminiService = require('../services/geminiService');
const WorkoutPlan = require('../models/WorkoutPlan');

// ─── Rate limiter for AI endpoints ───────────────────────────────────────────
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { error: 'Too many AI requests. Please wait a moment before trying again.' },
});

// ─── Input validators ─────────────────────────────────────────────────────────
const chatValidators = [
  body('message').isString().trim().isLength({ min: 1, max: 2000 }).withMessage('Message must be 1-2000 characters'),
  body('history').optional().isArray({ max: 20 }).withMessage('History must be an array of up to 20 messages'),
];

const planValidators = [
  body('goal').optional().isString(),
  body('fitnessGoal').optional().isString(),
  body('fitnessLevel').optional().isString(),
  body('daysPerWeek').optional().toInt(),
  body('durationMinutes').optional().toInt(),
  body('sessionDurationMinutes').optional().toInt(),
  body('equipment').optional().custom((val) => {
    if (typeof val === 'string' || Array.isArray(val)) return true;
    throw new Error('Equipment must be a string or array');
  }),
  body('preferredDays').optional().isArray(),
  body('restDays').optional().isArray(),
  body('limitations').optional().isString().isLength({ max: 500 }),
];

const fs = require('fs');
const path = require('path');

const getFitnessCoachReply = (rawMessage) => {
  const msg = (rawMessage || '').toLowerCase();

  // 1. Banana and Egg specific combination
  if (msg.includes('banana') && msg.includes('egg')) {
    return `### 🍌 Eggs & Banana: Optimal Fitness Fuel

**Yes, absolutely!** Eating bananas with eggs is one of the most effective, nutrient-dense natural food combinations for gym-goers.

#### Why This Combo Works So Well:
- **Fast & Sustained Energy (Banana):** Bananas provide easily digestible carbohydrates (fructose & glucose) along with **potassium** (~400mg) which prevents muscle cramps and replenishes glycogen stores.
- **Complete High-Quality Protein (Eggs):** Whole eggs offer an unbeatable biological value (BV 100), delivering **6–7g of complete protein per egg** rich in leucine to stimulate muscle protein synthesis (MPS).
- **Essential Healthy Fats:** Choline and healthy fats in the yolk support sustained hormonal health and cognitive drive during training.

#### ⏱️ Best Timing for Gym:
- **Pre-Workout (45–60 mins before):** 1 ripe banana + 2 boiled or poached eggs (or egg whites if you prefer lighter digestion). The banana delivers immediate workout stamina without stomach heaviness.
- **Post-Workout (within 45 mins):** 1–2 bananas + 2–3 whole eggs. Rapidly restores depleted glycogen and kickstarts immediate muscle recovery.

*Pro-tip: If eating less than 30 minutes before intense training, eat the banana first and save the eggs for post-workout to avoid delayed gastric emptying from fats.*`;
  }

  // 2. Banana alone
  if (msg.includes('banana')) {
    return `### 🍌 Bananas for Fitness & Workout Performance

Bananas are nature's ideal pre- and post-workout carbohydrate source:

- **Quick Glycogen Replenishment:** Contains roughly 27g of carbohydrates per medium banana, quickly absorbed by muscle cells.
- **Cramp Prevention:** Rich in **potassium** and **magnesium**, key electrolytes lost through sweat during heavy sets.
- **Gentle on Digestion:** Low in fat and moderate in fiber, so it won't cause gastrointestinal distress before lifting or running.
- **Ideal Timing:** Eat 1 medium banana 30–45 minutes prior to your session for an immediate energy boost.`;
  }

  // 3. Eggs alone
  if (msg.includes('egg')) {
    return `### 🥚 Eggs: The Gold Standard Protein

Eggs are often called the gold standard of natural muscle-building nutrition:

- **Complete Amino Acid Profile:** One large egg has ~6.5g protein containing all 9 essential amino acids with high bioavailability.
- **Leucine Rich:** Contains ~0.5g leucine per egg, the primary trigger for muscle protein synthesis (MPS).
- **Yolk Benefits:** The yolk contains vital fat-soluble vitamins (A, D, E, K), zinc, and choline for nervous system recovery.
- **Gym Recommendation:** 3–4 eggs daily (2 whole + 2 whites, or all whole depending on your daily caloric targets).`;
  }

  // 4. Pre-workout meal / what to eat before workout
  if (msg.includes('before') || msg.includes('pre-workout') || msg.includes('pre workout') || msg.includes('prior to workout')) {
    return `### ⚡ Pre-Workout Fueling Protocol

What you eat before training determines your strength output, muscular stamina, and mental focus:

#### 🕒 Timing Windows
- **2 to 3 Hours Before:** Balanced meal containing complex carbs, lean protein, and low fat.
  - *Example:* Grilled chicken breast or tofu, brown rice or sweet potato, steamed vegetables.
- **45 to 60 Minutes Before:** Fast-acting carbs with moderate, easily digestible protein.
  - *Example:* Oatmeal with half a scoop of whey, or 1 banana with 2 boiled egg whites.
- **15 to 30 Minutes Before:** Simple fast carbs only if needed.
  - *Example:* 1 banana or a handful of raisins/dates.

#### 🚫 Foods to Avoid Immediately Before Gym:
- Heavy deep-fried or high-fat foods (slows gastric emptying and causes sluggishness).
- Excess cruciferous fiber (can cause bloating and abdominal discomfort during heavy bracing).`;
  }

  // 5. Post-workout meal / what to eat after workout
  if (msg.includes('after') || msg.includes('post-workout') || msg.includes('post workout')) {
    return `### 🔄 Post-Workout Recovery Blueprint

Post-workout nutrition is designed to shift your body from a catabolic (breakdown) state into an anabolic (growth) state:

#### 🎯 The Anabolic Formula: Protein + Carbohydrates
- **Protein (25–35g):** Required to repair micro-tears in muscle fibers.
  - *Top Choices:* Whey isolate, egg whites + whole egg, chicken breast, paneer/tofu, Greek yogurt.
- **Carbohydrates (30–60g):** Replenishes muscle glycogen depleted during intense resistance training.
  - *Top Choices:* White rice, baked potato, ripe bananas, dextrose/maltodextrin, whole oats.

#### ⏱️ The Timing Window:
Aim to eat within **45 to 90 minutes** post-training. While the "30-minute anabolic window" isn't as urgent as once thought, prompt fueling ensures optimal glycogen synthesis and reduces muscle soreness (DOMS).`;
  }

  // 6. Protein & Macro intake
  if (msg.includes('protein') || msg.includes('macro') || msg.includes('calories') || msg.includes('chicken') || msg.includes('paneer')) {
    return `### 🥩 Daily Protein & Macronutrient Strategy

To build lean muscle and speed up recovery:

#### 1. Daily Protein Target
- **Optimal Range:** **1.6g to 2.2g of protein per kilogram of bodyweight** (0.8g–1.0g per lb).
- *Example:* A 70kg (154 lbs) individual should aim for **110g to 140g of protein daily**.

#### 2. Best Whole-Food Protein Sources
| Source | Serving | Protein Content |
| :--- | :--- | :--- |
| **Chicken Breast** | 100g cooked | ~31g protein |
| **Whole Eggs** | 2 large eggs | ~13g protein |
| **Paneer / Cottage Cheese** | 100g | ~18g protein |
| **Whey Protein** | 1 scoop (30g) | ~24g protein |
| **Tofu / Soy Chunks** | 100g | ~15g–52g protein |
| **Lentils / Chickpeas** | 1 cup cooked | ~18g protein |

#### 3. Distribution
Spread your protein evenly across **3 to 4 meals** (approx. 25–40g per meal) to maximize muscle protein synthesis throughout the day.`;
  }

  // 7. Creatine / Supplements
  if (msg.includes('creatine') || msg.includes('supplement') || msg.includes('caffeine') || msg.includes('whey')) {
    return `### 🧪 Evidence-Based Fitness Supplements

For beginner to intermediate lifters, only a few supplements have proven gold-standard efficacy:

1. **Creatine Monohydrate (5g daily):**
   - The most scientifically validated sports supplement in existence.
   - Increases intracellular phosphocreatine stores, giving you 1-2 extra reps on heavy compound lifts.
   - *How to take:* 3–5g every day with water. No loading phase or cycling required.
2. **Whey Protein:**
   - Convenient high-bioavailability protein source to help you hit daily targets.
3. **Caffeine (100–200mg, 30 min before gym):**
   - Boosts central nervous system output, alertness, and power production.
4. **Hydration / Electrolytes:**
   - A pinch of salt in your pre-workout water can dramatically improve muscular pumps and hydration.`;
  }

  // 8. Bicep curl / arms
  if (msg.includes('bicep') || msg.includes('curl') || msg.includes('arm')) {
    return `### 💪 Bicep Growth & Form Mechanics

To build peaked, well-developed biceps without elbow strain:

#### 1. Form Execution
- **Elbow Anchoring:** Pin your elbows slightly in front of your ribcage and keep them motionless. Do not swing your hips or use momentum.
- **Supination:** As you curl the dumbbell, rotate your pinky finger upward toward your outer shoulder at the peak.
- **Controlled Eccentric:** Take **2 to 3 seconds** to lower the weight. The lowering phase generates the highest micro-trauma for hypertrophy.

#### 2. Complete Arm Routine
- **Incline Dumbbell Curls:** 3 sets of 10–12 reps (targets the long head in a stretched position).
- **Standing Barbell / EZ-Bar Curls:** 3 sets of 8–10 reps (primary overload movement).
- **Hammer Curls:** 3 sets of 12 reps (targets the brachialis for arm thickness).`;
  }

  // 9. Squat form & lower body
  if (msg.includes('squat') || msg.includes('leg') || msg.includes('lunge')) {
    return `### 🦵 Squat & Lower Body Mastery

#### 1. Five Checklist Steps for Proper Squats:
1. **Foot Placement:** Shoulder-width apart, toes flared slightly outward (15–30°).
2. **Brace Your Core:** Take a deep diaphragmatic breath into your belly and brace your abs like you're about to take a punch.
3. **Hip Hinge Initiation:** Break at the hips and knees simultaneously. Push your knees out in the direction of your toes.
4. **Depth:** Lower until your hip crease is level with or just below the top of your knee cap (parallel depth).
5. **Ascent:** Drive through mid-foot and heel, keeping your chest proud and spine neutral.

#### 2. Avoiding Common Mistakes:
- Don't let your heels lift off the ground (elevate heels slightly on plates if ankle mobility is limited).
- Avoid knee caving by actively pushing outward against the floor.`;
  }

  // 10. Push-up & Chest
  if (msg.includes('pushup') || msg.includes('push up') || msg.includes('push-up') || msg.includes('chest') || msg.includes('bench')) {
    return `### 🏋️ Chest & Push-Up Mechanics

#### 1. Perfect Push-Up Form:
- **Hand Width:** Just slightly wider than shoulder-width, fingers spread for maximum floor grip.
- **Elbow Angle:** Keep elbows at roughly a **45-degree angle** to your torso (resembling an arrow 🏹, never a 'T' shape which strains shoulders).
- **Plank Stability:** Squeeze your glutes, lock your quads, and pull your belly button toward your spine to maintain a rigid straight line.
- **Range of Motion:** Lower down until your chest is 1 inch from the floor, then press to full lockout with active scapular protraction.

#### 2. Progression for Beginners:
- If standard push-ups are tough, start with **Incline Push-ups** (hands on an elevated bench) rather than knee push-ups to maintain proper core tension.`;
  }

  // 11. Weight loss / fat loss / cut
  if (msg.includes('weight loss') || msg.includes('fat loss') || msg.includes('lose weight') || msg.includes('cutting') || msg.includes('belly fat')) {
    return `### 🔥 Sustainable Fat Loss Blueprint

Fat loss requires a disciplined, science-backed approach combining calorie balance, resistance training, and recovery:

1. **Caloric Deficit:** Consume **300 to 500 kcal** below your Total Daily Energy Expenditure (TDEE). This produces steady loss of ~0.5kg (1 lb) per week while preserving muscle mass.
2. **Lift Weights 3–4 Days/Week:** Lifting signals your body to burn stored adipose fat for fuel rather than breaking down muscle tissue.
3. **High Protein Intake:** Consume at least **1.8g protein per kg of bodyweight**. Protein has the highest thermic effect of food (TEF) and keeps you satiated.
4. **Non-Exercise Activity (NEAT):** Aim for **8,000 to 10,000 steps daily**. Daily walking burns more cumulative calories over a week than grueling HIIT sessions.`;
  }

  // 12. Beginner workout split / routine
  if (msg.includes('split') || msg.includes('plan') || msg.includes('routine') || msg.includes('beginner') || msg.includes('schedule')) {
    return `### 📅 Beginner Weekly Workout Architecture

For anyone in their first 6–12 months of gym training, a **3-Day Full-Body Split** delivers the fastest strength gains and muscle growth:

| Day | Focus | Core Exercises | Sets x Reps |
| :--- | :--- | :--- | :--- |
| **Monday** | Full Body (A) | Goblet Squat, DB Bench Press, Bent-over DB Row | 3 x 8-12 |
| **Tuesday** | Rest / Recovery | 30 min walk, mobility stretches | Active Rest |
| **Wednesday** | Full Body (B) | Romanian Deadlift, Overhead DB Press, Lat Pulldown | 3 x 8-12 |
| **Thursday** | Rest / Recovery | Hydration, light core & foam rolling | Active Rest |
| **Friday** | Full Body (C) | Walking Lunges, Push-ups, Bicep Curls, Plank | 3 x 10-15 |
| **Weekend** | Rest / Fun | Outdoor activities, sports, recharge | Rest |

*Key Principle: Aim for **Progressive Overload** by adding either 1 extra rep or slightly more weight each week while keeping strict form.*`;
  }

  // 13. Rest / Recovery / Soreness
  if (msg.includes('rest') || msg.includes('recover') || msg.includes('sore') || msg.includes('sleep')) {
    return `### 💤 Muscle Recovery & DOMS (Delayed Onset Muscle Soreness)

Muscles are stimulated in the gym, but they actually grow and repair during rest:

- **Sleep:** Aim for **7.5 to 9 hours** of quality sleep. Over 80% of natural Growth Hormone (GH) is released during slow-wave deep sleep.
- **Handling Muscle Soreness:** Light active recovery (e.g. 20-minute walk, light stationary bike, dynamic stretching) increases blood flow to flush metabolic byproducts much faster than sitting still.
- **Hydration:** Dehydrated muscles recover up to 50% slower. Drink **3 to 4 liters** of water daily, especially around workout hours.
- **Rest Days:** Never train the exact same muscle group with high intensity on consecutive days. Give each muscle group **48 hours** before training it again.`;
  }

  // 14. Fallback contextual reply based on user's query
  return `### 🏋️ Coach Guidance on "${rawMessage.trim().substring(0, 45)}"

Great question! Here is personalized guidance based on your fitness goals:

- **Consistency First:** Fitness results are built on repeating basic habits day after day. Focus on showing up regularly.
- **Form Over Weight:** Always master the mechanics and range of motion before increasing resistance or volume.
- **Nutrition Pairing:** Balance your daily intake with lean proteins, complex carbohydrates, and wholesome healthy fats.
- **Progressive Overload:** Track your sets and reps so you can systematically challenge your muscles over time.

*Would you like more details on exercise selection, specific meal recipes, or a customized weekly breakdown?*`;
};

// ─── AI Chat ─────────────────────────────────────────────────────────────────

/**
 * @route POST /api/ai/coach
 * @desc  AI coaching chat message
 * @access Private
 */
const aiChat = [
  aiLimiter,
  ...chatValidators,
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { message, history = [] } = req.body;

      // Strict Domain Guard: Only answer gym, workout, fitness & sports nutrition queries
      const isMathOrOffTopic = /^[\d\s\+\-\*\/\^\(\)\.\=\%]+$/.test(message.trim()) ||
        /\b(calculate|equation|solve|math|algebra|geometry|python|javascript|java|c\+\+|coding|programming|president|election|capital of|movie|celebrity|bitcoin|crypto)\b/i.test(message);

      const gymKeywords = /\b(gym|workout|workouts|exercise|exercises|lift|lifting|lifter|weight|weights|dumbbell|barbell|kettlebell|cable|machine|smith|bench|press|squat|squats|deadlift|deadlifts|pullup|pull-up|chin-up|pushup|push-up|dip|dips|curl|curls|lunge|lunges|plank|row|rows|lat|lats|chest|pecs|back|shoulder|shoulders|delts|bicep|biceps|tricep|triceps|forearm|quads|hamstrings|calves|glutes|abs|core|obliques|cardio|running|runner|jog|jogging|treadmill|cycling|bike|swim|swimming|hiit|tabata|crossfit|calisthenics|bodybuilding|hypertrophy|strength|endurance|stamina|reps|rep|sets|set|rpe|rir|failure|overload|progressive|volume|intensity|split|ppl|push-pull-legs|warmup|warm-up|cooldown|stretch|stretching|mobility|flexibility|recovery|sore|soreness|doms|rest|sleep|protein|creatine|whey|pre-workout|post-workout|carbs|fats|calories|diet|meal|meals|nutrition|hydration|water|banana|egg|eggs|chicken|rice|oats|fish|meat|supplements|supplement|bulk|bulking|cut|cutting|shred|lean|bmi|fat loss|weight loss|muscle|gains|gain|physique|fitness|athlete|training|trainer|coach|fitlife)\b/i;

      const isGreeting = /^(hi|hello|hey|coach|alex|good morning|good evening|howdy|what's up|sup|help)[\s!\.\?]*$/i.test(message.trim());

      if (isMathOrOffTopic || (!gymKeywords.test(message) && !isGreeting)) {
        const reply = `### 🏋️‍♂️ Coach Alex: Gym Floor Focus Only!

**Whoa there, champ!** I am **Coach Alex**, your dedicated gym trainer and strength coach.

I **only** answer questions related to:
- 🏋️ **Gym Workouts & Lifting** (Push/Pull/Legs splits, sets, reps, progressive overload)
- 🎯 **Exercise Form & Technique** (Squats, bench press, deadlifts, pull-ups)
- 🥩 **Fitness & Muscle Nutrition** (Protein targets, pre/post-workout meals, creatine, calories)
- 💤 **Recovery & Mobility** (Rest days, preventing injury, dynamic warm-ups)

I don't do math (like "2+2"), coding, or non-fitness chit-chat — we keep 100% of our energy focused on your **strength and gains**! 

*Tell me: what muscle group or workout are we hitting today?*`;

        return res.json({ reply, source: 'gym-trainer-guard' });
      }

      // 1. If Gemini API key is configured, use official Google Gemini API
      if (process.env.GEMINI_API_KEY) {
        try {
          const userContext = {
            fitnessLevel: req.user.fitnessLevel || 'beginner',
            fitnessGoal: req.user.fitnessGoal || 'general fitness',
          };

          const sanitizedHistory = history
            .filter((h) => h && ['user', 'model'].includes(h.role) && typeof h.content === 'string')
            .slice(-10)
            .map((h) => ({ role: h.role, content: h.content.substring(0, 1000) }));

          const reply = await geminiService.chat(message, sanitizedHistory, userContext);
          return res.json({ reply, source: 'gemini-live' });
        } catch (geminiError) {
          console.warn('[Gemini Live Error, using intelligent coaching fallback]:', geminiError.message);
          const reply = getFitnessCoachReply(message);
          return res.json({ reply, source: 'fallback', warning: geminiError.message });
        }
      }

      // 2. If Gemini key not set, return specific contextual coaching response
      const reply = getFitnessCoachReply(message);
      return res.json({ reply, source: 'smart-coach' });
    } catch (error) {
      console.error('[AI Chat]', error.message);
      next(error);
    }
  },
];

/**
 * @route POST /api/ai/set-key
 * @desc  Configure and persist Google Gemini API Key
 * @access Private
 */
const configureApiKey = async (req, res, next) => {
  try {
    const { apiKey } = req.body;
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 10) {
      return res.status(400).json({ error: 'Please provide a valid Gemini API key.' });
    }

    const cleanKey = apiKey.trim();
    geminiService.setClientKey(cleanKey);

    // Persist to server/.env
    const envPath = path.resolve(__dirname, '../../.env');
    try {
      let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
      if (envContent.includes('GEMINI_API_KEY=')) {
        envContent = envContent.replace(/GEMINI_API_KEY=.*/g, `GEMINI_API_KEY=${cleanKey}`);
      } else {
        envContent += `\nGEMINI_API_KEY=${cleanKey}\n`;
      }
      fs.writeFileSync(envPath, envContent, 'utf8');
    } catch (fsErr) {
      console.warn('Could not persist key to server/.env:', fsErr.message);
    }

    res.json({
      success: true,
      configured: true,
      message: 'Google Gemini API key configured and activated successfully!',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route GET /api/ai/status
 * @desc  Check if Google Gemini API key is configured
 * @access Private
 */
const getAiStatus = async (req, res) => {
  res.json({
    configured: Boolean(process.env.GEMINI_API_KEY),
    model: 'gemini-3-flash-preview',
  });
};

// ─── Weekly Plan Generation ───────────────────────────────────────────────────

/**
 * @route POST /api/ai/weekly-plan
 * @desc  Generate a new weekly workout plan
 * @access Private
 */
const generatePlan = [
  aiLimiter,
  ...planValidators,
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array(), error: errors.array()[0]?.msg || 'Invalid parameters' });
      }

      const goal = req.body.goal || req.body.fitnessGoal || 'general_fitness';
      const fitnessLevel = req.body.fitnessLevel || req.user?.fitnessLevel || 'intermediate';
      const daysPerWeek = Number(req.body.daysPerWeek) || 4;
      const durationMinutes = Number(req.body.durationMinutes || req.body.sessionDurationMinutes) || 45;

      let equipmentList = [];
      if (Array.isArray(req.body.equipment)) {
        equipmentList = req.body.equipment;
      } else if (typeof req.body.equipment === 'string' && req.body.equipment.trim()) {
        equipmentList = [req.body.equipment.trim()];
      } else {
        equipmentList = ['dumbbells'];
      }

      const profile = {
        goal,
        fitnessGoal: goal,
        fitnessLevel,
        daysPerWeek,
        equipment: equipmentList,
        sessionDurationMinutes: durationMinutes,
        durationMinutes,
        preferredDays: req.body.preferredDays || [],
        restDays: req.body.restDays || [],
        limitations: req.body.limitations ? String(req.body.limitations).substring(0, 500) : '',
      };

      const planData = await geminiService.generateWeeklyPlan(profile);

      // Determine week start (next Monday)
      const now = new Date();
      const dayOfWeek = now.getDay();
      const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() + (dayOfWeek === 1 ? 0 : daysUntilMonday));
      weekStart.setHours(0, 0, 0, 0);

      // Deactivate old active plan for this user
      if (req.user?._id) {
        await WorkoutPlan.updateMany({ user: req.user._id, isActive: true }, { isActive: false });
      }

      // Create new plan
      const plan = await WorkoutPlan.create({
        user: req.user._id,
        title: planData.title,
        description: planData.description,
        goal,
        fitnessLevel,
        daysPerWeek,
        weekStartDate: weekStart,
        profileSnapshot: profile,
        days: planData.weekPlan,
        progressionNotes: planData.progressionNotes || '',
        isActive: true,
        generatedBy: 'gemini',
      });

      res.status(201).json({ plan, message: 'Weekly plan generated successfully' });
    } catch (error) {
      console.error('[Generate Plan]', error.message);
      res.status(500).json({ error: 'Failed to generate weekly plan: ' + error.message });
    }
  },
];

// ─── Get Current Plan ─────────────────────────────────────────────────────────

/**
 * @route GET /api/ai/weekly-plan
 * @desc  Get user's current active weekly plan
 * @access Private
 */
const getCurrentPlan = async (req, res, next) => {
  try {
    const plan = await WorkoutPlan.findOne({ user: req.user._id, isActive: true }).sort({ weekStartDate: -1, createdAt: -1 });
    if (!plan) {
      return res.json({ plan: null });
    }
    res.json({ plan });
  } catch (error) {
    next(error);
  }
};

/**
 * @route GET /api/ai/weekly-plans
 * @desc  Get all user's plans (history)
 * @access Private
 */
const getPlanHistory = async (req, res, next) => {
  try {
    const plans = await WorkoutPlan.find({ user: req.user._id })
      .sort({ weekStartDate: -1, createdAt: -1 })
      .limit(10)
      .select('title goal fitnessLevel weekStartDate profileSnapshot isActive createdAt days.dayOfWeek days.isRestDay days.focus days.status days.completed');
    res.json({ plans });
  } catch (error) {
    next(error);
  }
};

// ─── Update Day Status ────────────────────────────────────────────────────────

/**
 * @route PATCH /api/ai/weekly-plan/:planId/day/:dayParam
 * @desc  Update a day's status (completed/pending)
 * @access Private
 */
const updateDayStatus = async (req, res, next) => {
  try {
    const { planId, dayParam, dayOfWeek } = req.params;
    const targetParam = dayParam !== undefined ? dayParam : dayOfWeek;
    const { status, completed } = req.body;

    const plan = await WorkoutPlan.findOne({ _id: planId, user: req.user._id });
    if (!plan) return res.status(404).json({ error: 'Plan not found' });

    let day;
    // Check if numeric index (e.g. "0", "1")
    if (!isNaN(targetParam) && targetParam !== '') {
      const idx = parseInt(targetParam, 10);
      day = plan.days[idx];
    } else if (targetParam) {
      day = plan.days.find((d) =>
        d.dayOfWeek?.toLowerCase() === String(targetParam).toLowerCase()
      );
    }

    if (!day) return res.status(404).json({ error: 'Day not found in plan' });

    if (typeof completed === 'boolean') {
      day.completed = completed;
      day.status = completed ? 'completed' : 'pending';
      day.completedAt = completed ? new Date() : undefined;
    } else if (status) {
      day.status = status;
      day.completed = status === 'completed';
      day.completedAt = status === 'completed' ? new Date() : undefined;
    }

    await plan.save();
    res.json({ plan, message: `Day status updated successfully` });
  } catch (error) {
    next(error);
  }
};

// ─── Session Summary ──────────────────────────────────────────────────────────

/**
 * @route POST /api/ai/session-summary
 * @desc  Generate an AI summary for a completed workout session
 * @access Private
 */
const sessionSummary = [
  aiLimiter,
  async (req, res, next) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.json({ summary: 'Great workout! Keep up the consistency and track your progress.' });
      }

      const { exerciseName, activeDurationMinutes, totalReps, avgFormQuality, estimatedCalories } = req.body;

      if (!exerciseName) return res.status(400).json({ error: 'exerciseName is required' });

      const summary = await geminiService.generateSessionSummary(
        {
          exerciseName: String(exerciseName).substring(0, 50),
          activeDurationMinutes: Math.min(120, Math.max(0, Number(activeDurationMinutes) || 0)),
          totalReps: Math.min(1000, Math.max(0, Number(totalReps) || 0)),
          avgFormQuality: String(avgFormQuality || 'good').substring(0, 20),
          estimatedCalories: Math.min(2000, Math.max(0, Number(estimatedCalories) || 0)),
        },
        { fitnessLevel: req.user.fitnessLevel || 'beginner' }
      );

      res.json({ summary });
    } catch (error) {
      // Non-critical — return a fallback
      console.error('[Session Summary]', error.message);
      res.json({ summary: 'Great workout! Consistency is key to reaching your fitness goals.' });
    }
  },
];

module.exports = {
  aiChat,
  generatePlan,
  getCurrentPlan,
  getPlanHistory,
  updateDayStatus,
  sessionSummary,
  configureApiKey,
  getAiStatus,
};
