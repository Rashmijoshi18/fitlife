import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Apple,
  Trash2,
  Edit2,
  X,
  Flame,
  Sparkles,
  Dumbbell,
  Droplets,
  Calendar,
  CheckCircle2,
  Circle,
  ArrowRight,
  UtensilsCrossed,
  Clock,
  Check,
} from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { calculatePlanNutritionTargets } from '../lib/nutritionAdvisor';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout'];
const mealTypeColors = {
  breakfast: '#f59e0b',
  lunch: '#10b981',
  dinner: '#3b82f6',
  snack: '#8b5cf6',
  pre_workout: '#ef4444',
  post_workout: '#06b6d4',
};

// ─── 7-Day Curated Performance Nutrition Plan ──────────────────────────────
const DEFAULT_7_DAY_NUTRITION_PLAN = [
  {
    dayNumber: 1,
    title: 'Upper Body Power Fuel (High Carb / High Protein)',
    focus: 'Upper Body Strength & Muscular Endurance',
    isWorkoutDay: true,
    calorieMultiplier: 1.05,
    fuelingStrategy:
      'Prioritize complex oats 90m before training for sustained bench and row strength. Follow with rapid-absorbing whey protein and simple carbs within 45m post-workout.',
    coachTips:
      'Hydrate with at least 500ml water and electrolytes 30 mins before training. Never lift heavy on an empty stomach if you want maximum pressing power.',
    meals: [
      {
        mealType: 'breakfast',
        name: 'High-Protein Power Oats with Whey, Blueberries & Chia Seeds',
        calories: 480,
        protein: 36,
        carbs: 58,
        fat: 12,
        recipe:
          '70g rolled oats, 1 scoop vanilla whey isolate, 1/2 cup fresh blueberries, 1 tbsp chia seeds, unsweetened almond milk.',
      },
      {
        mealType: 'lunch',
        name: 'Grilled Chicken Breast, Brown Rice & Steamed Broccoli Bowl',
        calories: 620,
        protein: 52,
        carbs: 68,
        fat: 14,
        recipe:
          '200g lean chicken breast, 1 cup cooked brown rice, 150g steamed broccoli with 1 tsp extra virgin olive oil.',
      },
      {
        mealType: 'pre_workout',
        name: 'Banana & Rice Cake with Pure Honey & Sea Salt',
        calories: 240,
        protein: 4,
        carbs: 54,
        fat: 2,
        recipe:
          '1 medium ripe banana sliced over 2 plain rice cakes, drizzled with 1 tbsp raw honey and a pinch of pink salt for muscle pump.',
      },
      {
        mealType: 'post_workout',
        name: 'Whey Protein Isolate Shake & 2 Slices Whole Wheat Toast',
        calories: 380,
        protein: 40,
        carbs: 44,
        fat: 4,
        recipe:
          '1.5 scoops whey isolate with cold water or skim milk, paired with 2 lightly toasted whole wheat slices to restore muscle glycogen.',
      },
      {
        mealType: 'dinner',
        name: 'Wild Salmon Fillet, Roasted Sweet Potato & Grilled Asparagus',
        calories: 560,
        protein: 44,
        carbs: 48,
        fat: 18,
        recipe:
          '170g grilled salmon fillet, 200g roasted diced sweet potato, grilled asparagus spears with sea salt and cracked pepper.',
      },
    ],
  },
  {
    dayNumber: 2,
    title: 'Lower Body Energy & Glycogen Load (Squat & Leg Fuel)',
    focus: 'Lower Body & Core Hypertrophy',
    isWorkoutDay: true,
    calorieMultiplier: 1.12,
    fuelingStrategy:
      'Leg workouts burn the highest glycogen of the week. Front-load complex carbohydrates at breakfast and lunch to avoid mid-workout fatigue on heavy sets.',
    coachTips:
      'Leg day requires extra sodium and water. Drink an extra 600ml of water today and add a pinch of salt to your pre-workout meal to prevent leg cramps.',
    meals: [
      {
        mealType: 'breakfast',
        name: '3 Whole Eggs Scramble with Baby Spinach, Feta & Sourdough',
        calories: 520,
        protein: 34,
        carbs: 42,
        fat: 22,
        recipe:
          '3 whole pasture-raised eggs scrambled with baby spinach and 20g feta cheese, served with 2 slices toasted whole grain sourdough.',
      },
      {
        mealType: 'lunch',
        name: 'Lean Ground Beef (90/10) with Jasmine Rice & Sautéed Peppers',
        calories: 680,
        protein: 50,
        carbs: 76,
        fat: 18,
        recipe:
          '180g lean minced beef seasoned with cumin and paprika, 1.25 cups jasmine rice, sautéed bell peppers and sweet onions.',
      },
      {
        mealType: 'pre_workout',
        name: 'Cream of Rice with 1/2 Scoop Whey & Sliced Banana',
        calories: 310,
        protein: 16,
        carbs: 58,
        fat: 2,
        recipe:
          '50g cream of rice cooked in hot water, stirred with 1/2 scoop chocolate whey and topped with a sliced ripe banana. Super easy on the stomach.',
      },
      {
        mealType: 'post_workout',
        name: 'Post-Leg Anabolic Bowl: 0% Greek Yogurt, Honey & Berries',
        calories: 390,
        protein: 38,
        carbs: 48,
        fat: 5,
        recipe:
          '250g non-fat Greek yogurt, 1.5 tbsp raw honey, 1 cup mixed berries, and 1 scoop vanilla protein powder stirred until creamy.',
      },
      {
        mealType: 'dinner',
        name: 'Herb-Roasted Chicken Breast with Quinoa & Mixed Greens Salad',
        calories: 580,
        protein: 48,
        carbs: 46,
        fat: 20,
        recipe:
          '180g herb-crusted chicken breast, 1 cup cooked fluffy quinoa, 1/4 ripe avocado, and a large mixed greens salad with lemon dressing.',
      },
    ],
  },
  {
    dayNumber: 3,
    title: 'Active Recovery & Tissue Repair (Anti-Inflammatory Plate)',
    focus: 'Mobility, Active Recovery & Joint Health',
    isWorkoutDay: false,
    calorieMultiplier: 0.95,
    fuelingStrategy:
      'Rest days prioritize tissue repair and reducing inflammation. Moderated carbs, high omega-3 fatty acids, and steady amino acid influx.',
    coachTips:
      'Recovery days are when your muscles actually grow. Don\'t starve your body; keep protein at 1.8g-2.0g per kg to ensure muscle tissue repairs.',
    meals: [
      {
        mealType: 'breakfast',
        name: 'Protein Green Smoothie Bowl with Spinach, Mango & Chia',
        calories: 420,
        protein: 32,
        carbs: 52,
        fat: 10,
        recipe:
          '1 scoop protein powder, 1 cup fresh spinach, 1/2 frozen mango, 1 tbsp chia seeds, 250ml unsweetened coconut or almond milk.',
      },
      {
        mealType: 'lunch',
        name: 'Mediterranean Tuna & Chickpea Salad with Extra Virgin Olive Oil',
        calories: 540,
        protein: 44,
        carbs: 46,
        fat: 18,
        recipe:
          '1 can skipjack tuna (drained), 1 cup boiled chickpeas, diced cucumbers, cherry tomatoes, parsley, and 1.5 tbsp extra virgin olive oil.',
      },
      {
        mealType: 'snack',
        name: 'Raw Organic Walnuts & Crisp Green Apple',
        calories: 220,
        protein: 5,
        carbs: 26,
        fat: 14,
        recipe:
          '30g raw walnuts (rich in anti-inflammatory ALA omega-3) paired with 1 crisp fresh apple for sustained micronutrient delivery.',
      },
      {
        mealType: 'dinner',
        name: 'Baked Salmon with Steamed Bok Choy & Ginger Brown Rice',
        calories: 570,
        protein: 42,
        carbs: 44,
        fat: 22,
        recipe:
          '180g wild salmon seasoned with grated fresh ginger and coconut aminos, steamed bok choy, and 3/4 cup brown basmati rice.',
      },
    ],
  },
  {
    dayNumber: 4,
    title: 'Push Day Hypertrophy & Performance Fuel (Chest & Delts)',
    focus: 'Chest, Shoulders & Triceps Intensity',
    isWorkoutDay: true,
    calorieMultiplier: 1.08,
    fuelingStrategy:
      'Fast-digesting pre-workout carbs to maintain bench press power. Immediate post-workout protein to spike leucine and trigger muscle protein synthesis.',
    coachTips:
      'If bench pressing heavy today, ensure your last solid meal was 90-120 minutes prior so blood flow is fully available for your upper body pump.',
    meals: [
      {
        mealType: 'breakfast',
        name: 'Whole Egg & White Omelet with Sourdough & Strawberries',
        calories: 460,
        protein: 38,
        carbs: 46,
        fat: 12,
        recipe:
          '2 whole eggs + 3 egg whites folded with diced tomatoes and bell peppers, 2 slices toasted sourdough, 1/2 cup fresh strawberries.',
      },
      {
        mealType: 'lunch',
        name: 'Grilled Turkey Breast with Sweet Potato Mash & Green Beans',
        calories: 610,
        protein: 54,
        carbs: 64,
        fat: 12,
        recipe:
          '200g lean turkey breast grilled, 220g boiled sweet potato mashed with cinnamon, 150g steamed crisp green beans.',
      },
      {
        mealType: 'pre_workout',
        name: 'Rice Cakes with Peanut Butter, Sliced Banana & Sea Salt',
        calories: 260,
        protein: 8,
        carbs: 42,
        fat: 8,
        recipe:
          '2 rice cakes topped with 1 tbsp creamy peanut butter, 1/2 sliced banana, and a light sprinkle of sea salt 45 mins prior to push workout.',
      },
      {
        mealType: 'post_workout',
        name: 'Rapid Recovery Whey Shake & Large Medjool Dates',
        calories: 360,
        protein: 36,
        carbs: 48,
        fat: 3,
        recipe:
          '1.5 scoops whey isolate in ice-cold water paired with 2 large Medjool dates for an immediate natural glucose spike to shuttle amino acids into delts and chest.',
      },
      {
        mealType: 'dinner',
        name: 'Lean Beef Stir-Fry with Broccoli, Snap Peas & Soba Noodles',
        calories: 590,
        protein: 46,
        carbs: 56,
        fat: 16,
        recipe:
          '170g sirloin strips flash-fried with broccoli florets, snap peas, low-sodium tamari sauce, and 100g cooked buckwheat soba noodles.',
      },
    ],
  },
  {
    dayNumber: 5,
    title: 'Pull Day Strength & Muscle Density (Back & Biceps)',
    focus: 'Back, Biceps & Posterior Chain',
    isWorkoutDay: true,
    calorieMultiplier: 1.08,
    fuelingStrategy:
      'Back workouts demand sustained lat and trap tension. Fuel with complex grains and lean poultry for consistent energy throughout heavy deadlifts and pull-ups.',
    coachTips:
      'Posterior chain lifting stresses your nervous system heavily. Make sure to get adequate complex carbs to replenish central nervous system glycogen.',
    meals: [
      {
        mealType: 'breakfast',
        name: 'Overnight Protein Oats with Chia, Dark Chocolate & Banana',
        calories: 490,
        protein: 36,
        carbs: 62,
        fat: 13,
        recipe:
          '70g rolled oats soaked in almond milk with 1 scoop chocolate whey, 1 tbsp chia seeds, 10g 85% dark chocolate chips, and half a sliced banana.',
      },
      {
        mealType: 'lunch',
        name: 'Lemon-Herb Chicken Breast with Basmati Rice & Roasted Zucchini',
        calories: 630,
        protein: 50,
        carbs: 70,
        fat: 14,
        recipe:
          '190g chicken breast marinated in lemon and rosemary, 1.2 cups fragrant basmati rice, roasted zucchini rounds.',
      },
      {
        mealType: 'pre_workout',
        name: 'Toasted English Muffin with Pure Honey & Black Coffee',
        calories: 220,
        protein: 5,
        carbs: 48,
        fat: 1,
        recipe:
          '1 whole grain English muffin toasted, brushed with 1 tbsp raw honey, served with black coffee for clean pre-pull alertness.',
      },
      {
        mealType: 'post_workout',
        name: 'Anabolic Bicep/Lat Repair Shake: Whey, Skim Milk & Blueberries',
        calories: 370,
        protein: 42,
        carbs: 40,
        fat: 4,
        recipe:
          '1.5 scoops vanilla whey, 250ml cold skim milk, 1 cup frozen blueberries blended into a frothy restorative shake.',
      },
      {
        mealType: 'dinner',
        name: 'Pan-Seared White Fish with Roasted Baby Potatoes & Asparagus',
        calories: 520,
        protein: 44,
        carbs: 48,
        fat: 12,
        recipe:
          '200g cod or halibut seared in 1 tsp olive oil, 200g baby potatoes roasted with garlic, generous serving of grilled asparagus.',
      },
    ],
  },
  {
    dayNumber: 6,
    title: 'Active Mobility & Lean Maintenance (Cardio & Core Fuel)',
    focus: 'Cardio, Mobility & Core Conditioning',
    isWorkoutDay: false,
    calorieMultiplier: 0.96,
    fuelingStrategy:
      'Moderate carbohydrate intake to match lighter energy burn. Increase colorful vegetables and micronutrients to support cardiovascular health.',
    coachTips:
      'Keep hydrated and replenish electrolytes lost during light cardio or mobility sessions. Avoid mindless weekend snacking by eating protein first.',
    meals: [
      {
        mealType: 'breakfast',
        name: 'Greek Yogurt Parfait with Granola, Berries & Flaxseed',
        calories: 430,
        protein: 32,
        carbs: 48,
        fat: 11,
        recipe:
          '220g low-fat Greek yogurt layered with 40g whole grain protein granola, 1/2 cup fresh raspberries, and 1 tbsp ground flaxseeds.',
      },
      {
        mealType: 'lunch',
        name: 'Warm Grilled Chicken Caesar Wrap in Whole Wheat Tortilla',
        calories: 560,
        protein: 46,
        carbs: 44,
        fat: 18,
        recipe:
          '160g sliced grilled chicken, crisp romaine lettuce, 1 tbsp light Caesar dressing, 10g shaved parmesan wrapped in a 10-inch whole wheat tortilla.',
      },
      {
        mealType: 'snack',
        name: 'Hard-Boiled Eggs (2) & Raw Salted Almonds',
        calories: 240,
        protein: 16,
        carbs: 6,
        fat: 17,
        recipe:
          '2 pasture-raised hard-boiled eggs with sea salt & smoked paprika, accompanied by 15g raw almonds.',
      },
      {
        mealType: 'dinner',
        name: 'Spiced Lentil Dahl or Lean Beef Chili with Brown Rice',
        calories: 580,
        protein: 42,
        carbs: 64,
        fat: 14,
        recipe:
          'Savory stewed red lentils and black beans or extra-lean beef chili topped with fresh cilantro, served over 1 cup steamed brown rice.',
      },
    ],
  },
  {
    dayNumber: 7,
    title: 'Complete Rest & Weekly Reset (Digestive Cleanse & Prep)',
    focus: 'Total Rest, Mental Recovery & Weekly Prep',
    isWorkoutDay: false,
    calorieMultiplier: 0.95,
    fuelingStrategy:
      'Allow your digestive tract to rest. Focus on whole foods, high fiber, probiotic foods (kefir/yogurt), and hydration to reset for the next week.',
    coachTips:
      'Sunday is prep day! Chop your veggies, cook your grains, and marinate your protein so your nutrition stays 100% on point all week long.',
    meals: [
      {
        mealType: 'breakfast',
        name: 'Sunday Clean Veggie Frittata with Feta & Avocado Toast',
        calories: 460,
        protein: 30,
        carbs: 34,
        fat: 22,
        recipe:
          'Baked egg frittata with diced bell peppers, red onions, mushrooms, and 20g feta. 1 slice sprouted whole grain toast with 1/4 avocado.',
      },
      {
        mealType: 'lunch',
        name: 'Grilled Salmon Power Salad with Quinoa & Lemon Tahini',
        calories: 540,
        protein: 38,
        carbs: 40,
        fat: 22,
        recipe:
          '160g wild salmon or firm tofu over baby kale, cucumbers, 1/2 cup cooked quinoa, cherry tomatoes, and 1.5 tbsp lemon-tahini dressing.',
      },
      {
        mealType: 'snack',
        name: 'Probiotic Kefir or High-Protein Cottage Cheese with Peach',
        calories: 210,
        protein: 24,
        carbs: 18,
        fat: 3,
        recipe:
          '200g low-fat cottage cheese or kefir cup paired with 1 fresh sliced juicy peach or blueberries.',
      },
      {
        mealType: 'dinner',
        name: 'Slow-Cooked Herb Pot Roast or Chicken Breast with Root Veggies',
        calories: 560,
        protein: 48,
        carbs: 42,
        fat: 16,
        recipe:
          'Tender braised lean beef or chicken breast slow-simmered with carrots, parsnips, and celery in a rich rosemary-bone broth.',
      },
    ],
  },
];

// ─── Modal for Manual / Customized Meal Logging ────────────────────────────
const MealModal = ({ onClose, onSaved, existing, initialData }) => {
  const [form, setForm] = useState(
    existing
      ? {
          name: existing.name,
          mealType: existing.mealType,
          date: format(parseISO(existing.date), 'yyyy-MM-dd'),
          servingSize: existing.servingSize,
          servingUnit: existing.servingUnit,
          calories: existing.calories,
          protein: existing.protein || 0,
          carbs: existing.carbs || 0,
          fat: existing.fat || 0,
          notes: existing.notes || '',
        }
      : {
          name: initialData?.name || '',
          mealType: initialData?.mealType || 'breakfast',
          date: initialData?.date || format(new Date(), 'yyyy-MM-dd'),
          servingSize: 1,
          servingUnit: 'serving',
          calories: initialData?.calories || '',
          protein: initialData?.protein || 0,
          carbs: initialData?.carbs || 0,
          fat: initialData?.fat || 0,
          notes: initialData?.notes || '',
        }
  );
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Meal name is required';
    if (!form.calories && form.calories !== 0) e.calories = 'Calories are required';
    else if (Number(form.calories) < 0) e.calories = 'Cannot be negative';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setLoading(true);
    try {
      if (existing) {
        await api.patch(`/meals/${existing._id}`, form);
        toast.success('Meal updated!');
      } else {
        await api.post('/meals', form);
        toast.success('Meal logged!');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div
          className="flex items-center justify-between p-6 border-b"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <h2 className="text-xl font-bold text-white">{existing ? 'Edit Meal' : 'Log Meal'}</h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: '0.25rem' }}>
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div
            className="p-3 rounded-lg text-xs"
            style={{
              background: 'rgba(16,185,129,0.08)',
              border: '1px solid rgba(16,185,129,0.2)',
              color: 'var(--color-text-muted)',
            }}
          >
            ℹ️ Nutritional values are estimates tracked for your fitness journey.
          </div>

          <div className="form-group">
            <label className="form-label">Food/Meal Name *</label>
            <input
              className={`form-input ${errors.name ? 'error' : ''}`}
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Oatmeal with banana & whey"
            />
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Meal Type</label>
              <select
                className="form-input form-select"
                value={form.mealType}
                onChange={(e) => setForm((p) => ({ ...p, mealType: e.target.value }))}
              >
                {MEAL_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace('_', ' ').replace(/^\w/, (c) => c.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input
                type="date"
                className="form-input"
                value={form.date}
                onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Serving Size</label>
              <input
                type="number"
                className="form-input"
                value={form.servingSize}
                onChange={(e) => setForm((p) => ({ ...p, servingSize: e.target.value }))}
                placeholder="1"
                min="0.1"
                step="0.1"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Serving Unit</label>
              <input
                className="form-input"
                value={form.servingUnit}
                onChange={(e) => setForm((p) => ({ ...p, servingUnit: e.target.value }))}
                placeholder="serving / bowl / plate"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="form-group">
              <label className="form-label">Calories (kcal) *</label>
              <input
                type="number"
                className={`form-input ${errors.calories ? 'error' : ''}`}
                value={form.calories}
                onChange={(e) => setForm((p) => ({ ...p, calories: e.target.value }))}
                placeholder="0"
                min="0"
              />
              {errors.calories && <span className="form-error">{errors.calories}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Protein (g)</label>
              <input
                type="number"
                className="form-input"
                value={form.protein}
                onChange={(e) => setForm((p) => ({ ...p, protein: Number(e.target.value) || 0 }))}
                placeholder="0"
                min="0"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Carbs (g)</label>
              <input
                type="number"
                className="form-input"
                value={form.carbs}
                onChange={(e) => setForm((p) => ({ ...p, carbs: Number(e.target.value) || 0 }))}
                placeholder="0"
                min="0"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Fat (g)</label>
              <input
                type="number"
                className="form-input"
                value={form.fat}
                onChange={(e) => setForm((p) => ({ ...p, fat: Number(e.target.value) || 0 }))}
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : existing ? 'Update Meal' : 'Log Meal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main Nutrition Page Component ─────────────────────────────────────────
const NutritionPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [meals, setMeals] = useState([]);
  const [weeklyPlan, setWeeklyPlan] = useState(null);
  const [dayWorkouts, setDayWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMeal, setEditMeal] = useState(null);
  const [modalInitialData, setModalInitialData] = useState(null);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loggingMealId, setLoggingMealId] = useState(null);

  // Selected Day tab (0 to 6, corresponding to Day 1 to Day 7)
  const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
    const todayIndex = new Date().getDay(); // 0 is Sun, 1 is Mon...
    return todayIndex === 0 ? 6 : todayIndex - 1; // 0=Mon, 6=Sun
  });

  // Track completed days in local storage
  const [completedDays, setCompletedDays] = useState(() => {
    try {
      const saved = localStorage.getItem('fitlife_nutrition_days_completed');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Hydration state stored locally per day
  const [waterLoggedMl, setWaterLoggedMl] = useState(() => {
    const saved = localStorage.getItem(`fitlife_water_${selectedDate}`);
    return saved ? Number(saved) : 0;
  });

  useEffect(() => {
    const saved = localStorage.getItem(`fitlife_water_${selectedDate}`);
    setWaterLoggedMl(saved ? Number(saved) : 0);
  }, [selectedDate]);

  const addWater = (ml) => {
    setWaterLoggedMl((prev) => {
      const next = Math.max(0, prev + ml);
      localStorage.setItem(`fitlife_water_${selectedDate}`, String(next));
      toast.success(`Logged +${ml}ml water! 💧`, { duration: 1500 });
      return next;
    });
  };

  const fetchDayData = useCallback(async () => {
    setLoading(true);
    try {
      const [mealsRes, planRes, workoutsRes] = await Promise.all([
        api.get('/meals', { params: { date: selectedDate } }),
        api.get('/ai/weekly-plan/current').catch(() => ({ data: { plan: null } })),
        api.get('/workouts', { params: { limit: 50 } }).catch(() => ({ data: { workouts: [] } })),
      ]);

      setMeals(mealsRes.data.meals || []);
      setWeeklyPlan(planRes.data?.plan || null);

      // Filter workouts on the selected date
      const matchedWorkouts = (workoutsRes.data?.workouts || []).filter((w) => {
        const d = (w.date || w.createdAt || '').slice(0, 10);
        return d === selectedDate;
      });
      setDayWorkouts(matchedWorkouts);
    } catch {
      toast.error('Failed to load nutrition data');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchDayData();
  }, [fetchDayData]);

  const toggleDayCompleted = (dayIdx) => {
    setCompletedDays((prev) => {
      const next = { ...prev, [dayIdx]: !prev[dayIdx] };
      localStorage.setItem('fitlife_nutrition_days_completed', JSON.stringify(next));
      toast.success(
        next[dayIdx]
          ? `Day ${dayIdx + 1} nutrition marked completed! 🎉`
          : `Day ${dayIdx + 1} marked incomplete`
      );
      return next;
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this meal?')) return;
    try {
      await api.delete(`/meals/${id}`);
      toast.success('Meal deleted');
      fetchDayData();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleSaved = () => {
    setShowModal(false);
    setEditMeal(null);
    setModalInitialData(null);
    fetchDayData();
  };

  // ─── 1-Click Instant Quick Log for Curated Meals ────────────────────────────
  const handleQuickLogMeal = async (item, mealIdx) => {
    setLoggingMealId(mealIdx);
    try {
      await api.post('/meals', {
        name: item.name,
        mealType: item.mealType || 'lunch',
        calories: Number(item.calories) || 300,
        protein: Number(item.protein) || 0,
        carbs: Number(item.carbs) || 0,
        fat: Number(item.fat) || 0,
        notes: item.recipe || '',
        date: selectedDate,
      });

      toast.success(`Logged ${item.name.split(':')[0]} (+${item.calories} kcal)! 🎉`, {
        icon: '🥑',
        duration: 3000,
      });
      fetchDayData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to log meal');
    } finally {
      setLoggingMealId(null);
    }
  };

  // ─── Dynamically Adjusted Nutrition Targets ────────────────────────────────
  const advisor = calculatePlanNutritionTargets({
    user,
    plan: weeklyPlan,
    dateStr: selectedDate,
    dayWorkouts,
  });

  const { targets } = advisor;

  // Actual logged totals today
  const totals = meals.reduce(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      protein: acc.protein + (m.protein || 0),
      carbs: acc.carbs + (m.carbs || 0),
      fat: acc.fat + (m.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const caloriesRemaining = targets.calories - Math.round(totals.calories);
  const isOverCalorie = caloriesRemaining < 0;

  const macroData = [
    { name: 'Protein', value: Math.round(totals.protein), color: '#10b981' },
    { name: 'Carbs', value: Math.round(totals.carbs), color: '#3b82f6' },
    { name: 'Fat', value: Math.round(totals.fat), color: '#f59e0b' },
  ].filter((d) => d.value > 0);

  // Group logged meals by meal type
  const groupedLoggedMeals = MEAL_TYPES.reduce((acc, t) => {
    const type_meals = meals.filter((m) => m.mealType === t);
    if (type_meals.length > 0) acc[t] = type_meals;
    return acc;
  }, {});

  // Compute Active 7-Day Nutrition Plan synchronizing with weekly workout plan
  const active7DayPlan = useMemo(() => {
    return DEFAULT_7_DAY_NUTRITION_PLAN.map((dayPlan, idx) => {
      // If user has an active workout plan for this day, adapt focus and title
      const workoutDay = weeklyPlan?.days?.[idx];
      let dayTitle = dayPlan.title;
      let dayFocus = dayPlan.focus;
      let isRest = dayPlan.isWorkoutDay === false;

      if (workoutDay) {
        if (workoutDay.isRestDay || workoutDay.focus?.toLowerCase().includes('rest')) {
          isRest = true;
          dayFocus = 'Active Recovery & Joint Health';
          dayTitle = `Day ${idx + 1}: Rest & Recovery Fuel Protocol`;
        } else if (workoutDay.focus) {
          isRest = false;
          dayFocus = workoutDay.focus;
          dayTitle = `Day ${idx + 1}: ${workoutDay.focus} Fuel Split`;
        }
      }

      // Calibrate planned calories to user's BMR baseline
      const baseDailyCalories = targets.calories || 2350;
      const plannedDayCalories = Math.round(baseDailyCalories * (dayPlan.calorieMultiplier || 1.0));

      return {
        ...dayPlan,
        title: dayTitle,
        focus: dayFocus,
        isWorkoutDay: !isRest,
        plannedCalories: plannedDayCalories,
      };
    });
  }, [weeklyPlan, targets.calories]);

  const currentSelectedDay = active7DayPlan[selectedDayIndex] || active7DayPlan[0];

  // Adherence calculation across the 7 days
  const completedCount = Object.values(completedDays).filter(Boolean).length;
  const weeklyAdherence = Math.round((completedCount / 7) * 100);

  return (
    <div className="fade-in w-full space-y-4">
      {/* ─── Header ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <Apple size={22} className="text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
              AI Weekly Nutrition Planner
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                AI Powered
              </span>
            </h1>
            <p className="text-xs text-gray-400">
              Personalized weekly meal plan & macro targets synchronized with your workout split
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Date Selector */}
          <div className="flex items-center gap-1.5 bg-gray-900 border border-gray-800 rounded-lg px-2.5 py-1 text-xs">
            <Calendar size={13} className="text-emerald-400 shrink-0" />
            <input
              type="date"
              className="bg-transparent text-xs text-white border-0 p-0 focus:outline-none"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
            <button
              onClick={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))}
              className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 uppercase ml-1 px-1.5 py-0.5 rounded bg-emerald-500/10"
            >
              Today
            </button>
          </div>

          <button
            onClick={() => navigate('/weekly-planner')}
            className="btn btn-secondary text-xs flex items-center gap-1.5 py-1.5"
          >
            <Calendar size={14} className="text-purple-400" />
            Workout Plan
          </button>
          <button
            onClick={() => {
              setModalInitialData(null);
              setEditMeal(null);
              setShowModal(true);
            }}
            className="btn btn-primary text-xs flex items-center gap-1.5 py-1.5 shadow-md shadow-emerald-950/40"
          >
            <Plus size={14} /> Custom Meal
          </button>
        </div>
      </div>

      {/* ─── Protocol Summary Banner (Matching Weekly Planner) ───────────── */}
      <div className="card p-5 bg-gradient-to-r from-gray-900 via-gray-900 to-gray-850 border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white">
              {weeklyPlan?.title ? `${weeklyPlan.title} Nutrition Protocol` : '7-Day High Performance Nutrition Protocol'}
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
              {advisor.isWorkoutDay ? 'Active Training Fuel' : 'Tissue Repair & Rest'}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1 max-w-2xl">
            Calibrated for <strong className="text-white">{user?.weight || 70} kg</strong> ·{' '}
            <strong className="text-white">{user?.height || 175} cm</strong> ·{' '}
            Baseline Target: <strong className="text-emerald-400">{targets.calories} kcal</strong> (
            <span className="text-emerald-300 font-semibold">{targets.protein}g P</span> ·{' '}
            <span className="text-blue-300 font-semibold">{targets.carbs}g C</span> ·{' '}
            <span className="text-amber-300 font-semibold">{targets.fat}g F</span>).
          </p>
        </div>

        {/* Weekly Adherence Progress Bar */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <span className="text-xs text-gray-400">Weekly Nutrition Adherence</span>
            <p className="text-xl font-black text-emerald-400 font-mono">{weeklyAdherence}%</p>
          </div>
          <div className="w-28 h-2.5 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
              style={{ width: `${weeklyAdherence}%` }}
            />
          </div>
        </div>
      </div>

      {/* ─── 7-Day Navigation Tabs (DAY 1 to DAY 7) ─────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {active7DayPlan.map((day, idx) => {
          const isSelected = selectedDayIndex === idx;
          const isCompleted = completedDays[idx];
          return (
            <button
              key={idx}
              onClick={() => setSelectedDayIndex(idx)}
              className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? 'bg-emerald-950/40 border-emerald-500 shadow-lg shadow-emerald-950/50'
                  : 'bg-gray-900/60 border-gray-800 hover:border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Day {idx + 1}
                </span>
                {isCompleted ? (
                  <CheckCircle2 size={14} className="text-emerald-400" />
                ) : (
                  <Circle size={14} className="text-gray-600" />
                )}
              </div>

              <div className="my-2">
                <h3
                  className={`text-xs font-bold truncate ${
                    isSelected ? 'text-emerald-300' : 'text-gray-200'
                  }`}
                >
                  {day.focus}
                </h3>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {day.meals.length} meals · ~{day.plannedCalories} kcal
                </p>
              </div>

              {isSelected && <div className="h-0.5 w-full bg-emerald-500 rounded-full mt-1" />}
            </button>
          );
        })}
      </div>

      {/* ─── Selected Day Nutrition Details (Circuit & Layout) ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Meal Circuit & Sets */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-5 bg-gray-900/70 border-gray-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-800">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">
                    Day {selectedDayIndex + 1}: {currentSelectedDay.focus}
                  </h3>
                  {currentSelectedDay.isWorkoutDay ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Training Fuel Day
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      Rest & Repair Day
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Target: <span className="text-emerald-400 font-semibold">~{currentSelectedDay.plannedCalories} kcal</span> ·{' '}
                  <span className="text-emerald-300">{targets.protein}g Protein</span> ·{' '}
                  <span className="text-blue-300">{targets.carbs}g Carbs</span> ·{' '}
                  <span className="text-amber-300">{targets.fat}g Fat</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleDayCompleted(selectedDayIndex)}
                  className={`btn btn-sm flex items-center gap-1.5 ${
                    completedDays[selectedDayIndex]
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'btn-secondary text-xs'
                  }`}
                >
                  {completedDays[selectedDayIndex] ? (
                    <>
                      <CheckCircle2 size={14} className="text-emerald-400" /> Completed
                    </>
                  ) : (
                    <>
                      <Circle size={14} /> Mark Day Done
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Fueling Strategy Callout (Like the Warm-up callout in Weekly Planner) */}
            <div className="mt-4 p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs">
              <strong className="text-emerald-400 flex items-center gap-1 mb-1">
                <Flame size={13} /> Fueling Strategy & Nutrient Timing:
              </strong>
              <span className="text-gray-300 leading-relaxed">{currentSelectedDay.fuelingStrategy}</span>
            </div>

            {/* MEAL CIRCUIT & NUTRITION TIMING */}
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                  <UtensilsCrossed size={14} className="text-emerald-400" />
                  Meal Circuit & Nutrition Timing
                </h4>
                <span className="text-[11px] text-gray-500">1-click Quick Log available</span>
              </div>

              {currentSelectedDay.meals.map((item, mIdx) => (
                <div
                  key={mIdx}
                  className="p-3.5 bg-gray-950/60 hover:bg-gray-950/90 border border-gray-800/80 hover:border-gray-700 rounded-xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-gray-800 text-[11px] font-mono text-gray-300 flex items-center justify-center shrink-0 mt-0.5">
                      {mIdx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md"
                          style={{
                            background: `${mealTypeColors[item.mealType] || '#10b981'}20`,
                            color: mealTypeColors[item.mealType] || '#10b981',
                            border: `1px solid ${mealTypeColors[item.mealType] || '#10b981'}40`,
                          }}
                        >
                          {item.mealType.replace('_', ' ')}
                        </span>
                        <h5 className="text-xs font-bold text-gray-100">{item.name}</h5>
                      </div>

                      {/* Macro Line */}
                      <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-1 font-mono">
                        <span className="text-orange-400 font-bold flex items-center gap-0.5">
                          <Flame size={11} /> {item.calories} kcal
                        </span>
                        <span className="text-emerald-400">P: {item.protein}g</span>
                        <span className="text-blue-400">C: {item.carbs}g</span>
                        <span className="text-amber-400">F: {item.fat}g</span>
                      </div>

                      {/* Recipe & Prep Tip */}
                      {item.recipe && (
                        <p className="text-[10px] text-gray-400 mt-1 italic leading-tight">
                          💡 {item.recipe}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => {
                        setModalInitialData({
                          name: item.name,
                          mealType: item.mealType,
                          calories: item.calories,
                          protein: item.protein,
                          carbs: item.carbs,
                          fat: item.fat,
                          notes: item.recipe || '',
                          date: selectedDate,
                        });
                        setShowModal(true);
                      }}
                      className="p-1.5 px-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs flex items-center gap-1 transition-colors"
                      title="Customize portion or ingredients"
                    >
                      <Edit2 size={12} />
                      <span className="text-[11px]">Edit</span>
                    </button>

                    <button
                      disabled={loggingMealId === mIdx}
                      onClick={() => handleQuickLogMeal(item, mIdx)}
                      className="p-1.5 px-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-400 text-xs flex items-center gap-1.5 border border-emerald-500/25 transition-colors font-semibold"
                      title="1-Click Log to Today's Tracker"
                    >
                      <Plus size={13} />
                      <span className="text-[11px]">
                        {loggingMealId === mIdx ? 'Logging...' : 'Log Meal'}
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Right Column: Macro Distribution & Coach Tips ────────────────── */}
        <div className="space-y-4">
          {/* Daily Calorie & Macro Target Card */}
          <div className="card p-5 space-y-4 border-gray-800 bg-gray-900/80">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white">Daily Target vs Logged</h3>
              <span className={`text-[11px] font-bold ${isOverCalorie ? 'text-red-400' : 'text-emerald-400'}`}>
                {isOverCalorie ? `${Math.abs(caloriesRemaining)} kcal over` : `${caloriesRemaining} kcal left`}
              </span>
            </div>

            <div>
              <p className="text-2xl font-black text-white">
                {Math.round(totals.calories)}{' '}
                <span className="text-xs font-normal text-gray-400">/ {targets.calories} kcal</span>
              </p>
              <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden mt-1.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isOverCalorie ? 'bg-red-500' : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  }`}
                  style={{ width: `${Math.min(100, Math.round((totals.calories / targets.calories) * 100))}%` }}
                />
              </div>
            </div>

            {/* Macro Stats Grid */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-800">
              <div className="p-2.5 rounded-lg bg-gray-950/50 border border-gray-800 text-center">
                <span className="text-[10px] text-gray-400 uppercase font-bold">Protein</span>
                <p className="text-sm font-bold text-emerald-400 mt-0.5">
                  {Math.round(totals.protein)} <span className="text-[10px] text-gray-500">/{targets.protein}g</span>
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-gray-950/50 border border-gray-800 text-center">
                <span className="text-[10px] text-gray-400 uppercase font-bold">Carbs</span>
                <p className="text-sm font-bold text-blue-400 mt-0.5">
                  {Math.round(totals.carbs)} <span className="text-[10px] text-gray-500">/{targets.carbs}g</span>
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-gray-950/50 border border-gray-800 text-center">
                <span className="text-[10px] text-gray-400 uppercase font-bold">Fat</span>
                <p className="text-sm font-bold text-amber-400 mt-0.5">
                  {Math.round(totals.fat)} <span className="text-[10px] text-gray-500">/{targets.fat}g</span>
                </p>
              </div>
            </div>

            {/* Macro Chart */}
            {macroData.length > 0 && (
              <div className="pt-2">
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie
                      data={macroData}
                      cx="50%"
                      cy="50%"
                      innerRadius={42}
                      outerRadius={62}
                      dataKey="value"
                    >
                      {macroData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      formatter={(v) => [`${v}g`]}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={(val) => (
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '11px' }}>
                          {val}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Logged Meals List (Shown when meals > 0) */}
            {meals.length > 0 && (
              <div className="pt-3 border-t border-gray-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock size={12} className="text-emerald-400" />
                    Logged Today ({meals.length})
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400 font-bold">
                    {Math.round(totals.calories)} kcal
                  </span>
                </div>
                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                  {meals.map((meal) => (
                    <div
                      key={meal._id}
                      className="flex items-center justify-between p-2 rounded-lg bg-gray-950/70 border border-gray-800/80 text-xs"
                    >
                      <div className="flex-1 min-w-0 mr-2">
                        <p className="font-semibold text-gray-200 truncate">{meal.name}</p>
                        <div className="flex gap-2 text-[10px] text-gray-400 font-mono mt-0.5">
                          <span className="text-orange-400">{meal.calories} kcal</span>
                          <span className="text-emerald-400">P:{meal.protein}g</span>
                          <span className="text-blue-400">C:{meal.carbs}g</span>
                          <span className="text-amber-400">F:{meal.fat}g</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => {
                            setEditMeal(meal);
                            setShowModal(true);
                          }}
                          className="p-1 text-gray-400 hover:text-white"
                          title="Edit"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => handleDelete(meal._id)}
                          className="p-1 text-gray-400 hover:text-red-400"
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Coach Tips for Today (Star / Sparkles Card matching Weekly Planner) */}
          <div className="card p-5 space-y-3 bg-gradient-to-br from-gray-900 via-gray-900 to-emerald-950/20 border-emerald-500/25">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-emerald-400" />
              <h3 className="font-bold text-sm text-white">Coach Nutrition Tips for Today</h3>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              {currentSelectedDay.coachTips}
            </p>
            <div className="pt-2 border-t border-emerald-500/20 flex items-center justify-between text-[11px] text-gray-400">
              <span className="text-emerald-400 font-semibold">Coach Alex Gym Floor Tip</span>
              <Link to="/ai-coach" className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold">
                Ask Coach Alex <ArrowRight size={11} />
              </Link>
            </div>
          </div>

          {/* Daily Hydration Card */}
          <div className="card p-5 space-y-3 border-cyan-500/20 bg-gray-900/70">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Droplets size={17} className="text-cyan-400" />
                <h3 className="font-bold text-sm text-white">Daily Hydration</h3>
              </div>
              <span className="text-xs font-bold text-cyan-400">
                {Math.min(100, Math.round((waterLoggedMl / targets.waterMl) * 100))}%
              </span>
            </div>

            <div>
              <p className="text-2xl font-black text-white">
                {waterLoggedMl} <span className="text-xs font-normal text-gray-400">/ {targets.waterMl} ml</span>
              </p>
              <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden mt-1.5">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.round((waterLoggedMl / targets.waterMl) * 100))}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => addWater(250)}
                className="btn btn-secondary btn-sm text-xs py-1.5 flex items-center justify-center gap-1"
              >
                <Plus size={13} /> +250ml Glass
              </button>
              <button
                type="button"
                onClick={() => addWater(500)}
                className="btn btn-secondary btn-sm text-xs py-1.5 flex items-center justify-center gap-1"
              >
                <Plus size={13} /> +500ml Bottle
              </button>
            </div>
          </div>

          {/* User Biometrics Footnote */}
          <div className="card p-4 text-xs space-y-2 bg-gray-950/40 border-gray-800">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-400">Calibrated Biometrics:</span>
              <Link to="/profile" className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-0.5">
                Update <ArrowRight size={10} />
              </Link>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <span className="px-2 py-0.5 rounded bg-gray-900 border border-gray-800 font-bold">
                {user?.weight || 70} kg
              </span>
              <span className="px-2 py-0.5 rounded bg-gray-900 border border-gray-800 font-bold">
                {user?.height || 175} cm
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-bold">
                BMR: {Math.round(10 * (Number(user?.weight) || 70) + 6.25 * (Number(user?.height) || 175) - 5 * (Number(user?.age) || 25) + (user?.gender === 'female' ? -161 : 5))} kcal
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Modal for manual entry or editing ──────────────────────────────── */}
      {(showModal || editMeal) && (
        <MealModal
          onClose={() => {
            setShowModal(false);
            setEditMeal(null);
            setModalInitialData(null);
          }}
          onSaved={handleSaved}
          existing={editMeal}
          initialData={modalInitialData}
        />
      )}
    </div>
  );
};

export default NutritionPage;
