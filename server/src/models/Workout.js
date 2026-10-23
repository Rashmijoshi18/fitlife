const mongoose = require('mongoose');

const exerciseSetSchema = new mongoose.Schema(
  {
    setNumber: { type: Number, required: true },
    reps: { type: Number, min: 0 },
    weight: { type: Number, min: 0 }, // kg
    duration: { type: Number, min: 0 }, // seconds
    distance: { type: Number, min: 0 }, // meters
    notes: { type: String, maxlength: 200 },
  },
  { _id: false }
);

const workoutExerciseSchema = new mongoose.Schema(
  {
    exerciseName: { type: String, required: true, trim: true },
    exerciseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise' },
    muscleGroup: { type: String },
    sets: [exerciseSetSchema],
    notes: { type: String, maxlength: 500 },
  },
  { _id: false }
);

const workoutSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Workout title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    date: {
      type: Date,
      required: [true, 'Workout date is required'],
      default: Date.now,
    },
    duration: {
      type: Number, // minutes
      required: [true, 'Workout duration is required'],
      min: [1, 'Duration must be at least 1 minute'],
      max: [600, 'Duration cannot exceed 600 minutes'],
    },
    caloriesBurned: {
      type: Number,
      min: 0,
      default: 0,
    },
    type: {
      type: String,
      enum: ['strength', 'cardio', 'flexibility', 'hiit', 'sports', 'other'],
      default: 'other',
    },
    exercises: [workoutExerciseSchema],
    notes: {
      type: String,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
    mood: {
      type: String,
      enum: ['great', 'good', 'okay', 'tired', 'bad'],
    },
    isCompleted: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Index for common queries
workoutSchema.index({ user: 1, date: -1 });
workoutSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Workout', workoutSchema);
