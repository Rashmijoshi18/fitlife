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
  body('fitnessGoal').optional().isString().isIn(['weight_loss', 'muscle_gain', 'strength', 'endurance', 'general_fitness']),
  body('fitnessLevel').optional().isString().isIn(['beginner', 'intermediate', 'advanced']),
  body('equipment').optional().isArray(),
  body('preferredDays').optional().isArray(),
  body('restDays').optional().isArray(),
  body('sessionDurationMinutes').optional().isInt({ min: 15, max: 120 }),
  body('limitations').optional().isString().isLength({ max: 500 }),
];

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

      if (!process.env.GEMINI_API_KEY) {
        return res.status(503).json({
          error: 'AI coaching is not configured. Please add GEMINI_API_KEY to the server environment.',
          setupRequired: true,
        });
      }

      const { message, history = [] } = req.body;

      // Only pass minimal, non-sensitive context
      const userContext = {
        fitnessLevel: req.user.fitnessLevel || 'beginner',
        fitnessGoal: req.user.fitnessGoal || 'general fitness',
      };

      // Sanitize history - keep only role + content, limit content length
      const sanitizedHistory = history
        .filter((h) => h && ['user', 'model'].includes(h.role) && typeof h.content === 'string')
        .slice(-10) // last 10 turns
        .map((h) => ({ role: h.role, content: h.content.substring(0, 1000) }));

      const reply = await geminiService.chat(message, sanitizedHistory, userContext);

      res.json({ reply });
    } catch (error) {
      if (error.message?.includes('not configured')) {
        return res.status(503).json({
          error: 'AI coaching is not available. GEMINI_API_KEY is not set.',
          setupRequired: true,
        });
      }
      if (error.message?.includes('quota') || error.status === 429) {
        return res.status(429).json({ error: 'AI quota exceeded. Please try again later.' });
      }
      console.error('[AI Chat]', error.message);
      next(error);
    }
  },
];

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
        return res.status(400).json({ errors: errors.array() });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(503).json({
          error: 'Plan generation is not configured. Please add GEMINI_API_KEY to the server environment.',
          setupRequired: true,
        });
      }

      const {
        fitnessGoal = 'general_fitness',
        fitnessLevel,
        equipment = ['bodyweight'],
        preferredDays = ['monday', 'wednesday', 'friday'],
        restDays,
        sessionDurationMinutes = 45,
        limitations = '',
      } = req.body;

      const profile = {
        fitnessGoal,
        fitnessLevel: fitnessLevel || req.user.fitnessLevel || 'beginner',
        equipment: equipment.slice(0, 10),
        preferredDays: preferredDays.slice(0, 7),
        restDays: restDays?.slice(0, 7),
        sessionDurationMinutes: Math.min(120, Math.max(15, sessionDurationMinutes)),
        limitations: limitations.substring(0, 500),
      };

      const planData = await geminiService.generateWeeklyPlan(profile);

      // Determine week start (next Monday)
      const now = new Date();
      const dayOfWeek = now.getDay();
      const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() + (dayOfWeek === 1 ? 0 : daysUntilMonday));
      weekStart.setHours(0, 0, 0, 0);

      // Deactivate old active plan
      await WorkoutPlan.updateMany({ user: req.user._id, isActive: true }, { isActive: false });

      // Create new plan
      const plan = await WorkoutPlan.create({
        user: req.user._id,
        weekStartDate: weekStart,
        profileSnapshot: profile,
        days: planData.weekPlan,
        progressionNotes: planData.progressionNotes || '',
        isActive: true,
        generatedBy: 'gemini',
      });

      res.status(201).json({ plan, message: 'Weekly plan generated successfully' });
    } catch (error) {
      if (error.message?.includes('not configured')) {
        return res.status(503).json({
          error: 'AI service not available.',
          setupRequired: true,
        });
      }
      if (error.message?.includes('invalid JSON') || error.message?.includes('invalid plan')) {
        return res.status(502).json({ error: 'AI returned an invalid plan. Please try again.' });
      }
      console.error('[Generate Plan]', error.message);
      next(error);
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
    const plan = await WorkoutPlan.findOne({ user: req.user._id, isActive: true }).sort({ weekStartDate: -1 });
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
      .sort({ weekStartDate: -1 })
      .limit(10)
      .select('weekStartDate profileSnapshot isActive createdAt days.dayOfWeek days.isRestDay days.focus days.status');
    res.json({ plans });
  } catch (error) {
    next(error);
  }
};

// ─── Update Day Status ────────────────────────────────────────────────────────

/**
 * @route PATCH /api/ai/weekly-plan/:planId/day/:dayOfWeek
 * @desc  Update a day's status (completed/skipped/rescheduled)
 * @access Private
 */
const updateDayStatus = async (req, res, next) => {
  try {
    const { planId, dayOfWeek } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'completed', 'skipped', 'rescheduled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const plan = await WorkoutPlan.findOne({ _id: planId, user: req.user._id });
    if (!plan) return res.status(404).json({ error: 'Plan not found' });

    const day = plan.days.find((d) => d.dayOfWeek === dayOfWeek);
    if (!day) return res.status(404).json({ error: 'Day not found in plan' });

    day.status = status;
    if (status === 'completed') day.completedAt = new Date();
    else day.completedAt = undefined;

    await plan.save();
    res.json({ plan, message: `${dayOfWeek} marked as ${status}` });
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

module.exports = { aiChat, generatePlan, getCurrentPlan, getPlanHistory, updateDayStatus, sessionSummary };
