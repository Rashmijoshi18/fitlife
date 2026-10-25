const mongoose = require('mongoose');

const exerciseItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    sets: { type: mongoose.Schema.Types.Mixed, default: 3 },
    reps: { type: String, default: '10-12' },
    rest: { type: String, default: '60s' },
    restSeconds: { type: Number, default: 60 },
    duration: { type: mongoose.Schema.Types.Mixed },
    difficulty: { type: String, default: 'beginner' },
    notes: { type: String },
    tips: { type: String },
    muscleGroup: { type: String },
    equipment: { type: String, default: 'bodyweight' },
  },
  { _id: false, strict: false }
);

const dayPlanSchema = new mongoose.Schema(
  {
    dayNumber: { type: Number },
    dayOfWeek: { type: String },
    isRestDay: { type: Boolean, default: false },
    focus: { type: String, default: 'Full Body' },
    duration: { type: String, default: '45 mins' },
    estimatedDurationMinutes: { type: Number, default: 45 },
    completed: { type: Boolean, default: false },
    status: {
      type: String,
      default: 'pending',
    },
    warmup: { type: mongoose.Schema.Types.Mixed, default: '5 mins dynamic stretching' },
    warmUp: { type: mongoose.Schema.Types.Mixed },
    exercises: [exerciseItemSchema],
    cooldown: { type: mongoose.Schema.Types.Mixed, default: '5 mins gentle static stretching' },
    coolDown: { type: mongoose.Schema.Types.Mixed },
    notes: { type: String },
    completedAt: { type: Date },
  },
  { _id: false, strict: false }
);

const workoutPlanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: { type: String },
    description: { type: String },
    goal: { type: String },
    fitnessLevel: { type: String },
    daysPerWeek: { type: Number, default: 4 },
    weekStartDate: {
      type: Date,
      default: Date.now,
    },
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
    progressionNotes: { type: String, maxlength: 2000 },
    isActive: { type: Boolean, default: true },
    generatedBy: { type: String, default: 'gemini' },
  },
  { timestamps: true, strict: false }
);

workoutPlanSchema.index({ user: 1, weekStartDate: -1 });
workoutPlanSchema.index({ user: 1, isActive: 1 });

module.exports = mongoose.model('WorkoutPlan', workoutPlanSchema);
