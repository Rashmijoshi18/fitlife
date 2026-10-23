const mongoose = require('mongoose');

const mealSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Meal name is required'],
      trim: true,
      maxlength: [100, 'Meal name cannot exceed 100 characters'],
    },
    mealType: {
      type: String,
      enum: ['breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout'],
      required: [true, 'Meal type is required'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
    },
    servingSize: {
      type: Number,
      default: 1,
      min: [0.1, 'Serving size must be positive'],
    },
    servingUnit: {
      type: String,
      default: 'serving',
      maxlength: 30,
    },
    // All nutritional values are user-entered estimates
    calories: {
      type: Number,
      required: [true, 'Calories are required'],
      min: [0, 'Calories cannot be negative'],
    },
    protein: { type: Number, default: 0, min: 0 }, // grams
    carbs: { type: Number, default: 0, min: 0 }, // grams
    fat: { type: Number, default: 0, min: 0 }, // grams
    fiber: { type: Number, default: 0, min: 0 }, // grams
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
  },
  { timestamps: true }
);

mealSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('Meal', mealSchema);
