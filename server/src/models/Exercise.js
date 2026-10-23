const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Exercise name is required'],
      trim: true,
      unique: true,
    },
    muscleGroup: {
      type: String,
      required: true,
      enum: [
        'chest', 'back', 'shoulders', 'biceps', 'triceps',
        'legs', 'glutes', 'core', 'cardio', 'full_body', 'other',
      ],
    },
    equipment: {
      type: String,
      enum: ['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'bands', 'other'],
      default: 'other',
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    type: {
      type: String,
      enum: ['strength', 'cardio', 'flexibility', 'balance'],
      default: 'strength',
    },
    instructions: { type: String, maxlength: 2000 },
    tips: [{ type: String, maxlength: 500 }],
    videoUrl: { type: String },
    isCustom: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

exerciseSchema.index({ muscleGroup: 1, difficulty: 1 });
exerciseSchema.index({ name: 'text' });

module.exports = mongoose.model('Exercise', exerciseSchema);
