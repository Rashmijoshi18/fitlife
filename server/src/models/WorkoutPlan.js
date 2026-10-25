const mongoose = require('mongoose');

const exerciseItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    sets: { type: Number, min: 1 },
    reps: { type: String }, // "8-12" or "30 seconds"
    duration: { type: Number }, // seconds, for time-based
    restSeconds: { type: Number, default: 60 },
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    notes: { type: String, maxlength: 300 },
    muscleGroup: { type: String },
    equipment: { type: String, default: 'bodyweight' },
  },
  { _id: false }
);

const dayPlanSchema = new mongoose.Schema(
  {
    dayOfWeek: {
      type: String,
      required: true,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    },
    isRestDay: { type: Boolean, default: false },
    focus: { type: String, maxlength: 100 }, // e.g. "Upper Body Push"
    estimatedDurationMinutes: { type: Number, min: 1, max: 180 },
    warmUp: [exerciseItemSchema],
    exercises: [exerciseItemSchema],
    coolDown: [exerciseItemSchema],
    notes: { type: String, maxlength: 500 },
    // Session tracking
    status: {
      type: String,
      enum: ['pending', 'completed', 'skipped', 'rescheduled'],
      default: 'pending',
    },
    completedAt: { type: Date },
  },
  { _id: false }
);

const workoutPlanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    weekStartDate: {
      type: Date,
      required: true,
    },
    // User profile snapshot used to generate this plan
    profileSnapshot: {
      fitnessGoal: { type: String },
      fitnessLevel: { type: String },
      equipment: [{ type: String }],
      sessionDurationMinutes: { type: Number },
      preferredDays: [{ type: String }],
      restDays: [{ type: String }],
      limitations: { type: String },
    },
    days: [dayPlanSchema],
    progressionNotes: { type: String, maxlength: 1000 },
    isActive: { type: Boolean, default: true },
    generatedBy: { type: String, default: 'gemini' },
  },
  { timestamps: true }
);

workoutPlanSchema.index({ user: 1, weekStartDate: -1 });
workoutPlanSchema.index({ user: 1, isActive: 1 });

module.exports = mongoose.model('WorkoutPlan', workoutPlanSchema);
