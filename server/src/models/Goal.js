const mongoose = require('mongoose');

const progressEntrySchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    value: { type: Number, required: true },
    note: { type: String, maxlength: 300 },
  },
  { _id: false }
);

const goalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Goal title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    type: {
      type: String,
      enum: ['workout_frequency', 'workout_duration', 'weight_loss', 'weight_gain', 'calories_burned', 'custom'],
      required: true,
    },
    targetValue: {
      type: Number,
      required: [true, 'Target value is required'],
      min: [0, 'Target value must be non-negative'],
    },
    currentValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    unit: {
      type: String,
      required: [true, 'Unit is required'],
      maxlength: 30,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    targetDate: {
      type: Date,
      validate: {
        validator: function (v) {
          return !v || v > this.startDate;
        },
        message: 'Target date must be after start date',
      },
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'abandoned'],
      default: 'active',
    },
    progressHistory: [progressEntrySchema],
  },
  { timestamps: true }
);

goalSchema.index({ user: 1, status: 1 });

// Virtual: completion percentage
goalSchema.virtual('completionPercentage').get(function () {
  if (this.targetValue === 0) return 100;
  return Math.min(Math.round((this.currentValue / this.targetValue) * 100), 100);
});

goalSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Goal', goalSchema);
