import {
  DEFAULT_EXERCISES,
} from './mockData';

const STORAGE_KEYS = {
  USERS: 'fitlife_db_users',
  WORKOUTS: 'fitlife_db_workouts',
  GOALS: 'fitlife_db_goals',
  MEALS: 'fitlife_db_meals',
  EXERCISES: 'fitlife_db_exercises',
  PLANS: 'fitlife_db_workout_plans',
  INITIALIZED: 'fitlife_db_initialized_v2',
};

const getStored = (key, fallback = []) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const setStored = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
};

export const initMockDatabase = () => {
  if (typeof window === 'undefined') return;

  const initialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
  if (!initialized) {
    // Purge any legacy dummy/mock seeded entries from localStorage
    const existingWorkouts = getStored(STORAGE_KEYS.WORKOUTS, []);
    const cleanWorkouts = existingWorkouts.filter(
      (w) => !String(w._id).startsWith('wkt_') && w.user !== 'usr_demo'
    );
    setStored(STORAGE_KEYS.WORKOUTS, cleanWorkouts);

    const existingGoals = getStored(STORAGE_KEYS.GOALS, []);
    const cleanGoals = existingGoals.filter(
      (g) => !String(g._id).startsWith('gol_') && g.user !== 'usr_demo'
    );
    setStored(STORAGE_KEYS.GOALS, cleanGoals);

    const existingMeals = getStored(STORAGE_KEYS.MEALS, []);
    const cleanMeals = existingMeals.filter(
      (m) => !String(m._id).startsWith('mel_') && m.user !== 'usr_demo'
    );
    setStored(STORAGE_KEYS.MEALS, cleanMeals);

    const existingUsers = getStored(STORAGE_KEYS.USERS, []);
    const cleanUsers = existingUsers.filter(
      (u) => u._id !== 'usr_demo' && u.email !== 'demo@fitlife.com'
    );
    setStored(STORAGE_KEYS.USERS, cleanUsers);

    setStored(STORAGE_KEYS.EXERCISES, DEFAULT_EXERCISES);
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
  }
};

const createMockError = (status, errorMsg, config) => {
  const err = new Error(errorMsg);
  err.isAxiosError = true;
  err.response = {
    status,
    statusText: status === 401 ? 'Unauthorized' : status === 409 ? 'Conflict' : 'Bad Request',
    data: { error: errorMsg },
    headers: {},
    config,
  };
  return Promise.reject(err);
};

const createMockSuccess = (data, status = 200, config = {}) => {
  return Promise.resolve({
    data,
    status,
    statusText: 'OK',
    headers: {},
    config,
  });
};

const getCurrentUserId = () => {
  try {
    const raw = localStorage.getItem('fitlife_user');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed._id || parsed.id || null;
  } catch {
    return null;
  }
};

export const shouldUseMock = () => {
  if (typeof window === 'undefined') return false;

  const apiUrl = import.meta.env.VITE_API_URL || '';
  const isHttps = window.location.protocol === 'https:';
  const isHostedDomain = !['localhost', '127.0.0.1'].includes(window.location.hostname);

  // If deployed on Vercel/HTTPS and API URL is either not set or pointing to localhost,
  // browsers will completely block mixed-content/connection-refused requests. Use mock.
  if (isHostedDomain || isHttps) {
    if (!apiUrl || apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1')) {
      return true;
    }
  }

  // Explicit opt-in via env
  if (import.meta.env.VITE_USE_MOCK === 'true') {
    return true;
  }

  return false;
};

export const handleMockRequest = async (config) => {
  initMockDatabase();

  const url = (config.url || '').replace(/^[a-z]+:\/\/[^/]+/i, ''); // Strip host if absolute
  const normalizedUrl = url.replace(/^\/?api\/?/, '/'); // normalize '/api/auth' to '/auth'
  const method = (config.method || 'get').toLowerCase();

  let body = {};
  if (config.data) {
    try {
      body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
    } catch {
      body = {};
    }
  }
  const params = config.params || {};

  // 1. AUTH: REGISTER
  if (normalizedUrl === '/auth/register' && method === 'post') {
    const { name, email, password, fitnessLevel = 'beginner', age, weight, height, gender } = body;
    if (!email || !password) {
      return createMockError(400, 'Email and password are required', config);
    }

    const users = getStored(STORAGE_KEYS.USERS, []);
    const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
    if (existing) {
      return createMockError(409, 'An account with this email already exists', config);
    }

    const newUser = {
      _id: 'usr_' + Date.now(),
      name: (name || 'FitLife Member').trim(),
      email: email.toLowerCase().trim(),
      password,
      fitnessLevel,
      age: age ? Number(age) : 25,
      weight: weight ? Number(weight) : 68,
      height: height ? Number(height) : 172,
      gender: gender || 'prefer_not_to_say',
      dailyCalorieTarget: 2100,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    setStored(STORAGE_KEYS.USERS, users);

    const safeUser = { ...newUser };
    delete safeUser.password;

    return createMockSuccess(
      {
        message: 'Account created successfully',
        token: 'mock_jwt_token_' + Date.now(),
        user: safeUser,
      },
      201,
      config
    );
  }

  // 2. AUTH: LOGIN
  if (normalizedUrl === '/auth/login' && method === 'post') {
    const { email, password } = body;
    const users = getStored(STORAGE_KEYS.USERS, []);
    const found = users.find((u) => u.email.toLowerCase() === (email || '').toLowerCase().trim());

    if (!found) {
      return createMockError(401, 'Invalid email or password', config);
    }

    if (found.password && password && found.password !== password) {
      return createMockError(401, 'Invalid email or password', config);
    }

    const safeUser = { ...found };
    delete safeUser.password;

    return createMockSuccess(
      {
        message: 'Logged in successfully',
        token: 'mock_jwt_token_' + Date.now(),
        user: safeUser,
      },
      200,
      config
    );
  }

  // 3. AUTH: ME
  if (normalizedUrl === '/auth/me' && method === 'get') {
    const currentId = getCurrentUserId();
    if (!currentId) {
      return createMockError(401, 'Unauthorized', config);
    }
    const users = getStored(STORAGE_KEYS.USERS, []);
    const user = users.find((u) => u._id === currentId);
    if (!user) {
      return createMockError(401, 'User not found', config);
    }
    const safeUser = { ...user };
    delete safeUser.password;
    return createMockSuccess({ user: safeUser }, 200, config);
  }

  // 4. AUTH: PROFILE UPDATE
  if (normalizedUrl === '/auth/profile' && method === 'patch') {
    const currentId = getCurrentUserId();
    const users = getStored(STORAGE_KEYS.USERS, []);
    const idx = users.findIndex((u) => u._id === currentId);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...body, _id: currentId };
      setStored(STORAGE_KEYS.USERS, users);
      const safe = { ...users[idx] };
      delete safe.password;
      return createMockSuccess({ message: 'Profile updated', user: safe }, 200, config);
    }
    return createMockError(404, 'User not found', config);
  }

  // 5. AUTH: PASSWORD UPDATE
  if (normalizedUrl === '/auth/password' && method === 'patch') {
    const currentId = getCurrentUserId();
    const users = getStored(STORAGE_KEYS.USERS, []);
    const idx = users.findIndex((u) => u._id === currentId);
    if (idx !== -1) {
      users[idx].password = body.newPassword;
      setStored(STORAGE_KEYS.USERS, users);
      return createMockSuccess({ message: 'Password updated successfully' }, 200, config);
    }
    return createMockError(404, 'User not found', config);
  }

  // 6. PROGRESS: SUMMARY
  if (normalizedUrl === '/progress/summary' && method === 'get') {
    const currentId = getCurrentUserId();
    const workouts = getStored(STORAGE_KEYS.WORKOUTS).filter((w) => w.user === currentId);
    const goals = getStored(STORAGE_KEYS.GOALS).filter((g) => g.user === currentId);
    const meals = getStored(STORAGE_KEYS.MEALS).filter((m) => m.user === currentId);

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfToday = startOfToday + 86400000;

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfWeekMs = startOfWeek.getTime();

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    const weekWorkouts = workouts.filter((w) => new Date(w.date).getTime() >= startOfWeekMs);
    const monthWorkouts = workouts.filter((w) => new Date(w.date).getTime() >= startOfMonth);
    const todayMeals = meals.filter((m) => {
      const t = new Date(m.date).getTime();
      return t >= startOfToday && t <= endOfToday;
    });

    const activeGoals = goals.filter((g) => g.status === 'active');
    const completedGoals = goals.filter((g) => g.status === 'completed');

    const weekDuration = weekWorkouts.reduce((acc, w) => acc + (Number(w.duration) || 0), 0);
    const weekCalories = weekWorkouts.reduce((acc, w) => acc + (Number(w.caloriesBurned) || 0), 0);

    const todayCalories = todayMeals.reduce((acc, m) => acc + (Number(m.calories) || 0), 0);
    const todayProtein = todayMeals.reduce((acc, m) => acc + (Number(m.protein) || 0), 0);
    const todayCarbs = todayMeals.reduce((acc, m) => acc + (Number(m.carbs) || 0), 0);
    const todayFat = todayMeals.reduce((acc, m) => acc + (Number(m.fat) || 0), 0);

    // Weekly chart
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const dayEnd = dayStart + 86400000;

      const dayWorkouts = workouts.filter((w) => {
        const wt = new Date(w.date).getTime();
        return wt >= dayStart && wt <= dayEnd;
      });

      weeklyData.push({
        date: d.toLocaleDateString('en-US', { weekday: 'short' }),
        workouts: dayWorkouts.length,
        duration: dayWorkouts.reduce((sum, w) => sum + (Number(w.duration) || 0), 0),
        calories: dayWorkouts.reduce((sum, w) => sum + (Number(w.caloriesBurned) || 0), 0),
      });
    }

    // Monthly chart
    const monthlyData = [];
    for (let i = 3; i >= 0; i--) {
      const wStart = new Date(now);
      wStart.setDate(now.getDate() - (i + 1) * 7);
      const wEnd = new Date(now);
      wEnd.setDate(now.getDate() - i * 7);

      const wks = workouts.filter((w) => {
        const wt = new Date(w.date).getTime();
        return wt >= wStart.getTime() && wt <= wEnd.getTime();
      });

      monthlyData.push({
        week: `Week ${4 - i}`,
        workouts: wks.length,
        duration: wks.reduce((sum, w) => sum + (Number(w.duration) || 0), 0),
      });
    }

    const sortedRecent = [...workouts]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    return createMockSuccess(
      {
        summary: {
          totalWorkouts: workouts.length,
          weekWorkouts: weekWorkouts.length,
          monthWorkouts: monthWorkouts.length,
          weekDuration,
          weekCaloriesBurned: weekCalories,
          activeGoals: activeGoals.length,
          completedGoals: completedGoals.length,
        },
        todayNutrition: {
          calories: todayCalories,
          protein: Math.round(todayProtein),
          carbs: Math.round(todayCarbs),
          fat: Math.round(todayFat),
          mealCount: todayMeals.length,
        },
        recentWorkouts: sortedRecent,
        activeGoals: activeGoals.map((g) => ({
          _id: g._id,
          title: g.title,
          currentValue: g.currentValue,
          targetValue: g.targetValue,
          unit: g.unit,
          completionPercentage: g.completionPercentage || 0,
          targetDate: g.targetDate,
        })),
        charts: {
          weekly: weeklyData,
          monthly: monthlyData,
        },
      },
      200,
      config
    );
  }

  // 7. PROGRESS: HISTORY
  if (normalizedUrl.startsWith('/progress/history') && method === 'get') {
    const currentId = getCurrentUserId();
    const days = parseInt(params.days || 30);
    const cutoff = Date.now() - days * 86400000;
    const workouts = getStored(STORAGE_KEYS.WORKOUTS)
      .filter((w) => w.user === currentId && new Date(w.date).getTime() >= cutoff)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    return createMockSuccess({ history: workouts }, 200, config);
  }

  // 8. WORKOUTS
  if (normalizedUrl === '/workouts' && method === 'get') {
    const currentId = getCurrentUserId();
    let workouts = getStored(STORAGE_KEYS.WORKOUTS).filter((w) => w.user === currentId);
    if (params.type) {
      workouts = workouts.filter((w) => w.type === params.type);
    }
    workouts.sort((a, b) => new Date(b.date) - new Date(a.date));
    return createMockSuccess({ workouts }, 200, config);
  }

  if (normalizedUrl === '/workouts' && method === 'post') {
    const currentId = getCurrentUserId();
    const workouts = getStored(STORAGE_KEYS.WORKOUTS);
    const newWorkout = {
      _id: 'act_' + Date.now(),
      user: currentId,
      title: body.title,
      date: body.date ? new Date(body.date).toISOString() : new Date().toISOString(),
      duration: Number(body.duration) || 30,
      caloriesBurned: Number(body.caloriesBurned) || Math.round((Number(body.duration) || 30) * 7.5),
      type: body.type || 'other',
      notes: body.notes || '',
      mood: body.mood || 'good',
      exercises: body.exercises || [],
      createdAt: new Date().toISOString(),
    };
    workouts.unshift(newWorkout);
    setStored(STORAGE_KEYS.WORKOUTS, workouts);
    return createMockSuccess({ workout: newWorkout }, 201, config);
  }

  const workoutMatch = normalizedUrl.match(/^\/workouts\/([^/?]+)/);
  if (workoutMatch) {
    const id = workoutMatch[1];
    const workouts = getStored(STORAGE_KEYS.WORKOUTS);
    const idx = workouts.findIndex((w) => w._id === id);

    if (method === 'patch') {
      if (idx !== -1) {
        workouts[idx] = { ...workouts[idx], ...body, _id: id };
        setStored(STORAGE_KEYS.WORKOUTS, workouts);
        return createMockSuccess({ workout: workouts[idx] }, 200, config);
      }
      return createMockError(404, 'Workout not found', config);
    }

    if (method === 'delete') {
      if (idx !== -1) {
        workouts.splice(idx, 1);
        setStored(STORAGE_KEYS.WORKOUTS, workouts);
        return createMockSuccess({ message: 'Workout deleted' }, 200, config);
      }
      return createMockError(404, 'Workout not found', config);
    }
  }

  // 9. GOALS
  if (normalizedUrl === '/goals' && method === 'get') {
    const currentId = getCurrentUserId();
    let goals = getStored(STORAGE_KEYS.GOALS).filter((g) => g.user === currentId);
    if (params.status) {
      goals = goals.filter((g) => g.status === params.status);
    }
    goals.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return createMockSuccess({ goals }, 200, config);
  }

  if (normalizedUrl === '/goals' && method === 'post') {
    const currentId = getCurrentUserId();
    const goals = getStored(STORAGE_KEYS.GOALS);
    const target = Number(body.targetValue) || 1;
    const current = Number(body.currentValue) || 0;
    const completion = Math.min(Math.round((current / target) * 100), 100);

    const newGoal = {
      _id: 'gol_' + Date.now(),
      user: currentId,
      title: body.title,
      description: body.description || '',
      type: body.type || 'workout_frequency',
      targetValue: target,
      currentValue: current,
      unit: body.unit || 'sessions',
      targetDate: body.targetDate ? new Date(body.targetDate).toISOString() : '',
      startDate: new Date().toISOString(),
      status: completion >= 100 ? 'completed' : 'active',
      completionPercentage: completion,
      progressHistory: current > 0 ? [{ date: new Date().toISOString(), value: current, note: 'Initial progress' }] : [],
      createdAt: new Date().toISOString(),
    };

    goals.unshift(newGoal);
    setStored(STORAGE_KEYS.GOALS, goals);
    return createMockSuccess({ goal: newGoal }, 201, config);
  }

  const goalMatch = normalizedUrl.match(/^\/goals\/([^/?]+)/);
  if (goalMatch) {
    const id = goalMatch[1];
    const goals = getStored(STORAGE_KEYS.GOALS);
    const idx = goals.findIndex((g) => g._id === id);

    if (method === 'patch') {
      if (idx !== -1) {
        const existing = goals[idx];
        const updated = { ...existing, ...body, _id: id };
        if (body.currentValue !== undefined || body.targetValue !== undefined) {
          const t = Number(updated.targetValue) || 1;
          const c = Number(updated.currentValue) || 0;
          updated.completionPercentage = Math.min(Math.round((c / t) * 100), 100);
          if (updated.completionPercentage >= 100) updated.status = 'completed';
          if (body.progressNote) {
            updated.progressHistory = updated.progressHistory || [];
            updated.progressHistory.push({
              date: new Date().toISOString(),
              value: c,
              note: body.progressNote,
            });
          }
        }
        goals[idx] = updated;
        setStored(STORAGE_KEYS.GOALS, goals);
        return createMockSuccess({ goal: updated }, 200, config);
      }
      return createMockError(404, 'Goal not found', config);
    }

    if (method === 'delete') {
      if (idx !== -1) {
        goals.splice(idx, 1);
        setStored(STORAGE_KEYS.GOALS, goals);
        return createMockSuccess({ message: 'Goal deleted' }, 200, config);
      }
      return createMockError(404, 'Goal not found', config);
    }
  }

  // 10. MEALS
  if (normalizedUrl === '/meals' && method === 'get') {
    const currentId = getCurrentUserId();
    let meals = getStored(STORAGE_KEYS.MEALS).filter((m) => m.user === currentId);
    if (params.date) {
      const qDate = params.date;
      meals = meals.filter((m) => {
        const d = (m.date || '').slice(0, 10);
        return d === qDate;
      });
    }
    meals.sort((a, b) => new Date(b.date) - new Date(a.date));
    return createMockSuccess({ meals }, 200, config);
  }

  if (normalizedUrl === '/meals' && method === 'post') {
    const currentId = getCurrentUserId();
    const meals = getStored(STORAGE_KEYS.MEALS);
    const newMeal = {
      _id: 'mel_' + Date.now(),
      user: currentId,
      name: body.name,
      mealType: body.mealType || 'breakfast',
      date: body.date ? new Date(body.date).toISOString() : new Date().toISOString(),
      servingSize: Number(body.servingSize) || 1,
      servingUnit: body.servingUnit || 'serving',
      calories: Number(body.calories) || 0,
      protein: Number(body.protein) || 0,
      carbs: Number(body.carbs) || 0,
      fat: Number(body.fat) || 0,
      fiber: Number(body.fiber) || 0,
      notes: body.notes || '',
      createdAt: new Date().toISOString(),
    };
    meals.unshift(newMeal);
    setStored(STORAGE_KEYS.MEALS, meals);
    return createMockSuccess({ meal: newMeal }, 201, config);
  }

  const mealMatch = normalizedUrl.match(/^\/meals\/([^/?]+)/);
  if (mealMatch) {
    const id = mealMatch[1];
    const meals = getStored(STORAGE_KEYS.MEALS);
    const idx = meals.findIndex((m) => m._id === id);

    if (method === 'patch') {
      if (idx !== -1) {
        meals[idx] = { ...meals[idx], ...body, _id: id };
        setStored(STORAGE_KEYS.MEALS, meals);
        return createMockSuccess({ meal: meals[idx] }, 200, config);
      }
      return createMockError(404, 'Meal not found', config);
    }

    if (method === 'delete') {
      if (idx !== -1) {
        meals.splice(idx, 1);
        setStored(STORAGE_KEYS.MEALS, meals);
        return createMockSuccess({ message: 'Meal deleted' }, 200, config);
      }
      return createMockError(404, 'Meal not found', config);
    }
  }

  // 11. EXERCISES
  if (normalizedUrl === '/exercises' && method === 'get') {
    let exercises = getStored(STORAGE_KEYS.EXERCISES, DEFAULT_EXERCISES);
    if (!exercises.length) exercises = DEFAULT_EXERCISES;

    if (params.search) {
      const q = params.search.toLowerCase();
      exercises = exercises.filter((e) => e.name.toLowerCase().includes(q));
    }
    if (params.muscleGroup) {
      exercises = exercises.filter((e) => e.muscleGroup === params.muscleGroup);
    }
    if (params.equipment) {
      exercises = exercises.filter((e) => e.equipment === params.equipment);
    }
    if (params.difficulty) {
      exercises = exercises.filter((e) => e.difficulty === params.difficulty);
    }

    const page = parseInt(params.page || 1);
    const limit = parseInt(params.limit || 50);
    const total = exercises.length;
    const paginated = exercises.slice((page - 1) * limit, page * limit);

    return createMockSuccess({ exercises: paginated, pagination: { page, total } }, 200, config);
  }

  const exMatch = normalizedUrl.match(/^\/exercises\/([^/?]+)/);
  if (exMatch && method === 'get') {
    const id = exMatch[1];
    const exercises = getStored(STORAGE_KEYS.EXERCISES, DEFAULT_EXERCISES);
    const exercise = exercises.find((e) => e._id === id);
    if (exercise) {
      return createMockSuccess({ exercise }, 200, config);
    }
    return createMockError(404, 'Exercise not found', config);
  }

  // 12. AI STATUS & SET KEY
  if (normalizedUrl === '/ai/status' && method === 'get') {
    const key = localStorage.getItem('fitlife_gemini_key') || import.meta.env.VITE_GEMINI_API_KEY || '';
    return createMockSuccess({ configured: Boolean(key), model: 'gemini-3-flash-preview' }, 200, config);
  }

  if (normalizedUrl === '/ai/set-key' && method === 'post') {
    const { apiKey } = body;
    if (apiKey) {
      localStorage.setItem('fitlife_gemini_key', apiKey.trim());
    }
    return createMockSuccess({ success: true, configured: true }, 200, config);
  }

  // 13. AI COACH (Gemini direct / mock)
  if (normalizedUrl === '/ai/coach' && method === 'post') {
    const raw = body.message || '';
    const msg = raw.toLowerCase();
    const history = body.history || [];

    // Attempt live Google Gemini call
    const apiKey = localStorage.getItem('fitlife_gemini_key') || import.meta.env.VITE_GEMINI_API_KEY || '';
    if (apiKey) {
      try {
        const contents = [
          ...history.map((h) => ({
            role: h.role === 'model' ? 'model' : 'user',
            parts: [{ text: h.content }],
          })),
          { role: 'user', parts: [{ text: raw }] },
        ];

        const resp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents }),
          }
        );

        if (resp.ok) {
          const data = await resp.json();
          const geminiText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (geminiText) {
            return createMockSuccess({ reply: geminiText, source: 'gemini-live' }, 200, config);
          }
        }
      } catch (geminiFetchErr) {
        console.warn('[FitLife Client] Direct Gemini call error, using local fallback:', geminiFetchErr);
      }
    }

    let reply = `### 🏋️ Coach Guidance on "${raw.trim().substring(0, 45)}"

Great question! Here is personalized guidance based on your fitness goals:

- **Consistency First:** Fitness results are built on repeating basic habits day after day. Focus on showing up regularly.
- **Form Over Weight:** Always master the mechanics and range of motion before increasing resistance or volume.
- **Nutrition Pairing:** Balance your daily intake with lean proteins, complex carbohydrates, and wholesome healthy fats.
- **Progressive Overload:** Track your sets and reps so you can systematically challenge your muscles over time.

*Would you like more details on exercise selection, specific meal recipes, or a customized weekly breakdown?*`;

    if (msg.includes('banana') && msg.includes('egg')) {
      reply = `### 🍌 Eggs & Banana: Optimal Fitness Fuel

**Yes, absolutely!** Eating bananas with eggs is one of the most effective, nutrient-dense natural food combinations for gym-goers.

#### Why This Combo Works So Well:
- **Fast & Sustained Energy (Banana):** Bananas provide easily digestible carbohydrates (fructose & glucose) along with **potassium** (~400mg) which prevents muscle cramps and replenishes glycogen stores.
- **Complete High-Quality Protein (Eggs):** Whole eggs offer an unbeatable biological value (BV 100), delivering **6–7g of complete protein per egg** rich in leucine to stimulate muscle protein synthesis (MPS).
- **Essential Healthy Fats:** Choline and healthy fats in the yolk support sustained hormonal health and cognitive drive during training.

#### ⏱️ Best Timing for Gym:
- **Pre-Workout (45–60 mins before):** 1 ripe banana + 2 boiled or poached eggs (or egg whites if you prefer lighter digestion). The banana delivers immediate workout stamina without stomach heaviness.
- **Post-Workout (within 45 mins):** 1–2 bananas + 2–3 whole eggs. Rapidly restores depleted glycogen and kickstarts immediate muscle recovery.

*Pro-tip: If eating less than 30 minutes before intense training, eat the banana first and save the eggs for post-workout to avoid delayed gastric emptying from fats.*`;
    } else if (msg.includes('banana')) {
      reply = `### 🍌 Bananas for Fitness & Workout Performance

Bananas are nature's ideal pre- and post-workout carbohydrate source:

- **Quick Glycogen Replenishment:** Contains roughly 27g of carbohydrates per medium banana, quickly absorbed by muscle cells.
- **Cramp Prevention:** Rich in **potassium** and **magnesium**, key electrolytes lost through sweat during heavy sets.
- **Gentle on Digestion:** Low in fat and moderate in fiber, so it won't cause gastrointestinal distress before lifting or running.
- **Ideal Timing:** Eat 1 medium banana 30–45 minutes prior to your session for an immediate energy boost.`;
    } else if (msg.includes('egg')) {
      reply = `### 🥚 Eggs: The Gold Standard Protein

Eggs are often called the gold standard of natural muscle-building nutrition:

- **Complete Amino Acid Profile:** One large egg has ~6.5g protein containing all 9 essential amino acids with high bioavailability.
- **Leucine Rich:** Contains ~0.5g leucine per egg, the primary trigger for muscle protein synthesis (MPS).
- **Yolk Benefits:** The yolk contains vital fat-soluble vitamins (A, D, E, K), zinc, and choline for nervous system recovery.
- **Gym Recommendation:** 3–4 eggs daily (2 whole + 2 whites, or all whole depending on your daily caloric targets).`;
    } else if (msg.includes('before') || msg.includes('pre-workout') || msg.includes('pre workout')) {
      reply = `### ⚡ Pre-Workout Fueling Protocol

What you eat before training determines your strength output, muscular stamina, and mental focus:

#### 🕒 Timing Windows
- **2 to 3 Hours Before:** Balanced meal containing complex carbs, lean protein, and low fat (e.g., grilled chicken breast, sweet potato, steamed greens).
- **45 to 60 Minutes Before:** Fast-acting carbs with moderate, easily digestible protein (e.g., oatmeal with half a scoop of whey, or 1 banana with 2 boiled egg whites).
- **15 to 30 Minutes Before:** Simple fast carbs only if needed (e.g., 1 banana or a small handful of dates).

#### 🚫 Foods to Avoid Immediately Before Gym:
- Heavy deep-fried or high-fat foods (slows gastric emptying and causes sluggishness).
- Excess cruciferous fiber (can cause bloating during heavy compound lifts).`;
    } else if (msg.includes('after') || msg.includes('post-workout') || msg.includes('post workout')) {
      reply = `### 🔄 Post-Workout Recovery Blueprint

Post-workout nutrition is designed to shift your body from a catabolic (breakdown) state into an anabolic (growth) state:

#### 🎯 The Anabolic Formula: Protein + Carbohydrates
- **Protein (25–35g):** Required to repair micro-tears in muscle fibers (whey isolate, egg whites, chicken breast, paneer/tofu).
- **Carbohydrates (30–60g):** Replenishes muscle glycogen depleted during intense resistance training (white rice, baked potato, ripe bananas).

#### ⏱️ The Timing Window:
Aim to eat within **45 to 90 minutes** post-training for optimal glycogen synthesis and to reduce muscle soreness.`;
    } else if (msg.includes('protein') || msg.includes('macro') || msg.includes('chicken') || msg.includes('paneer')) {
      reply = `### 🥩 Daily Protein & Macronutrient Strategy

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

#### 3. Distribution
Spread your protein evenly across **3 to 4 meals** (approx. 25–40g per meal) to maximize muscle protein synthesis throughout the day.`;
    } else if (msg.includes('squat') || msg.includes('leg')) {
      reply = `### 🦵 Squat Form Fundamentals
1. **Stance:** Feet shoulder-width apart, toes flared slightly outward (15–30°).
2. **Hips First:** Initiate the movement by sending your hips back, keeping your chest proud.
3. **Knee Alignment:** Push your knees outward in line with your second toe.
4. **Depth:** Aim for thighs parallel to the ground while keeping your spine neutral.
5. **Drive:** Push evenly through your mid-foot and heel on the way up.`;
    } else if (msg.includes('pushup') || msg.includes('push up') || msg.includes('push-up') || msg.includes('chest')) {
      reply = `### 🏋️ Push-up Form Mastery
1. **Hand Placement:** Just outside shoulder width, fingers spread for maximum floor grip.
2. **Elbow Path:** Keep elbows tucked at approximately a 45° angle (arrow shape 🏹, not flared 'T').
3. **Core Tension:** Squeeze your glutes and brace your abs to prevent sagging hips.
4. **Range:** Lower until your chest is 1–2 inches from the floor, then press back up fully.`;
    } else if (msg.includes('bicep') || msg.includes('curl') || msg.includes('arm')) {
      reply = `### 💪 Bicep Growth & Form Mechanics
- **Elbow Anchoring:** Pin your elbows slightly in front of your ribcage and keep them motionless.
- **Supination:** As you curl the dumbbell, rotate your pinky finger upward toward your outer shoulder.
- **Controlled Eccentric:** Take 2 to 3 seconds to lower the weight to maximize hypertrophy.
- **Best Routine:** Incline DB Curls (3x10), Barbell Curls (3x8), Hammer Curls (3x12).`;
    } else if (msg.includes('weight loss') || msg.includes('fat') || msg.includes('diet chart') || msg.includes('diet chaart')) {
      reply = `### 🥗 Beginner Gym Diet & Nutrition Blueprint

Fueling your body with balanced macronutrients is essential for workout performance and recovery:

#### 🍽️ Daily Meal Blueprint
- **Breakfast:** 3 eggs (or tofu scramble) + whole grain oats with berries + 1 glass of water.
- **Mid-Morning Snack:** 1 apple or banana + a handful of almonds/walnuts.
- **Lunch:** Grilled chicken breast (or paneer/tofu/lentils) + brown rice or quinoa + generous green salad.
- **Pre-Workout (1–2h before):** Complex carbs + moderate protein (e.g., oatmeal with whey, or banana with peanut butter).
- **Post-Workout (within 2h):** 25–35g fast-digesting protein with replenishing carbohydrates.
- **Dinner:** Lean protein (fish, chicken, or beans) + steamed vegetables (broccoli, spinach) + sweet potato.

#### 💧 Hydration & Recovery Rules
- **Hydration:** Consume 500ml water before workout and sip 200ml every 15–20 minutes during training.
- **Protein Intake:** Aim for **1.6g – 2.0g** of protein per kg of bodyweight daily.`;
    } else if (msg.includes('plan') || msg.includes('routine') || msg.includes('split')) {
      reply = `### 📅 Recommended Weekly Split
| Day | Focus | Core Exercises |
| :--- | :--- | :--- |
| **Monday** | Full Body A | Squats, Push-ups, Bent-over Rows, Plank |
| **Wednesday** | Full Body B | Romanian Deadlifts, Overhead Press, Lat Pulldowns |
| **Friday** | Full Body C | Lunges, Incline DB Press, Bicep Curls, Core |
| **Tue/Thu/Weekend** | Active Recovery | 30 min brisk walk, mobility work, light stretching |

*Aim for 1.6–2.0g of protein per kg of body weight to support muscle repair.*`;
    }

    return createMockSuccess({ reply }, 200, config);
  }

  // 13. AI WEEKLY PLAN
  if (normalizedUrl === '/ai/weekly-plan' && method === 'post') {
    const currentId = getCurrentUserId();
    const daysPerWeek = Number(body.daysPerWeek) || 4;
    const goal = body.goal || 'general_fitness';
    const level = body.fitnessLevel || 'intermediate';

    const dailyRoutines = [
      {
        focus: 'Upper Body Push (Chest, Shoulders & Triceps)',
        warmup: '5 mins dynamic arm swings, shoulder circles, and light push-ups',
        exercises: [
          { name: 'Dumbbell Bench Press', sets: 4, reps: '10-12', rest: '75s', tips: 'Retract shoulder blades, control the negative' },
          { name: 'Seated Dumbbell Shoulder Press', sets: 3, reps: '10-12', rest: '60s', tips: 'Keep core braced, press in full range' },
          { name: 'Standard Push-ups', sets: 3, reps: '12-15', rest: '45s', tips: 'Maintain rigid plank posture' },
          { name: 'Overhead Tricep Extension', sets: 3, reps: '12-15', rest: '45s', tips: 'Keep elbows tucked and pointed up' },
        ],
      },
      {
        focus: 'Lower Body Power (Quads, Glutes & Hamstrings)',
        warmup: '5 mins leg swings, bodyweight squats, and hip openers',
        exercises: [
          { name: 'Goblet Squats', sets: 4, reps: '10-12', rest: '75s', tips: 'Chest proud, break parallel with hips' },
          { name: 'Dumbbell Romanian Deadlifts', sets: 4, reps: '10-12', rest: '75s', tips: 'Hinge back at the hips, flat spine' },
          { name: 'Walking Dumbbell Lunges', sets: 3, reps: '12 per leg', rest: '60s', tips: 'Keep front knee stacked over mid-foot' },
          { name: 'Standing Calf Raises', sets: 3, reps: '15-20', rest: '45s', tips: 'Hold top squeeze for 2 seconds' },
        ],
      },
      {
        focus: 'Active Recovery & Flexibility',
        warmup: '5 min dynamic flow',
        exercises: [],
      },
      {
        focus: 'Upper Body Pull (Back, Rear Delts & Biceps)',
        warmup: '5 mins band pull-aparts and cat-cow stretches',
        exercises: [
          { name: 'Single-Arm Dumbbell Rows', sets: 4, reps: '10-12 per side', rest: '60s', tips: 'Pull elbow toward hip' },
          { name: 'Bent-Over Dumbbell Flyes', sets: 3, reps: '12-15', rest: '45s', tips: 'Lead with pinkies to hit rear delts' },
          { name: 'Standing Dumbbell Bicep Curls', sets: 3, reps: '10-12', rest: '60s', tips: 'Supinate wrist at peak contraction' },
          { name: 'Dumbbell Hammer Curls', sets: 3, reps: '10-12', rest: '45s', tips: 'Palms facing each other for brachialis' },
        ],
      },
      {
        focus: 'Full Body Conditioning & Core',
        warmup: '5 mins jumping jacks and high knees',
        exercises: [
          { name: 'Dumbbell Thrusters', sets: 3, reps: '10-12', rest: '75s', tips: 'Squat directly into overhead press' },
          { name: 'Plank with Shoulder Taps', sets: 3, reps: '20 taps', rest: '45s', tips: 'Minimize hip sway' },
          { name: 'Russian Twists', sets: 3, reps: '20 total', rest: '30s', tips: 'Rotate with your torso, not just arms' },
          { name: 'Mountain Climbers', sets: 3, reps: '30 seconds', rest: '30s', tips: 'Keep hips low and pace brisk' },
        ],
      },
      {
        focus: 'Cardio, Mobility & Core Reset',
        warmup: '5 min gentle dynamic stretching',
        exercises: [
          { name: 'Plank Hold', sets: 3, reps: '45-60s', rest: '45s', tips: 'Engage glutes and core simultaneously' },
          { name: 'Glute Bridges', sets: 3, reps: '15 reps', rest: '45s', tips: 'Pause 2 seconds at the top' },
        ],
      },
      {
        focus: 'Complete Rest & Recovery',
        warmup: 'Light walk or gentle breathing',
        exercises: [],
      },
    ];

    const generatedDays = [];
    for (let i = 0; i < 7; i++) {
      let isRest = false;
      if (daysPerWeek === 3) isRest = !(i === 0 || i === 2 || i === 4);
      else if (daysPerWeek === 4) isRest = !(i === 0 || i === 1 || i === 3 || i === 4);
      else if (daysPerWeek === 5) isRest = !(i >= 0 && i <= 4);
      else if (daysPerWeek === 6) isRest = !(i >= 0 && i <= 5);

      const routine = dailyRoutines[i] || dailyRoutines[0];
      const dayFocus = isRest ? 'Active Recovery & Stretching' : routine.focus;

      generatedDays.push({
        dayNumber: i + 1,
        focus: dayFocus,
        isRestDay: isRest,
        duration: isRest ? '20 mins' : `${body.durationMinutes || 45} mins`,
        completed: false,
        warmup: isRest ? '5 min gentle dynamic stretching & foam rolling' : routine.warmup,
        exercises: isRest ? [] : routine.exercises,
        cooldown: isRest ? '10 mins restorative deep breathing' : '5 mins hamstring, chest, and hip flexor stretches',
      });
    }

    const newPlan = {
      _id: 'plan_' + Date.now(),
      user: currentId,
      title: `${level.toUpperCase()} ${goal.replace(/_/g, ' ').toUpperCase()} Protocol`,
      goal,
      fitnessLevel: level,
      daysPerWeek,
      days: generatedDays,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const plans = getStored(STORAGE_KEYS.PLANS, []);
    plans.unshift(newPlan);
    setStored(STORAGE_KEYS.PLANS, plans);

    return createMockSuccess({ plan: newPlan }, 201, config);
  }

  if ((normalizedUrl === '/ai/weekly-plan/current' || normalizedUrl === '/ai/weekly-plan') && method === 'get') {
    const currentId = getCurrentUserId();
    const plans = getStored(STORAGE_KEYS.PLANS, []);
    const userPlan = plans.find((p) => p.user === currentId) || plans[0];
    if (userPlan) {
      return createMockSuccess({ plan: userPlan }, 200, config);
    }
    return createMockSuccess({ plan: null }, 200, config);
  }

  const planDayMatch = normalizedUrl.match(/^\/ai\/weekly-plan\/([^/?]+)\/day\/(\d+)/);
  if (planDayMatch && method === 'patch') {
    const planId = planDayMatch[1];
    const dayIndex = parseInt(planDayMatch[2], 10);
    const plans = getStored(STORAGE_KEYS.PLANS, []);
    const pIdx = plans.findIndex((p) => p._id === planId || planId === 'mock-id');
    const targetIdx = pIdx !== -1 ? pIdx : 0;

    if (plans[targetIdx]?.days?.[dayIndex]) {
      plans[targetIdx].days[dayIndex].completed = !!body.completed;
      setStored(STORAGE_KEYS.PLANS, plans);
      return createMockSuccess({ plan: plans[targetIdx] }, 200, config);
    }
    return createMockSuccess({ success: true }, 200, config);
  }

  // 14. AI SESSION SUMMARY
  if (normalizedUrl === '/ai/session-summary' && method === 'post') {
    const reps = body.repCount || 0;
    const ex = (body.exerciseName || 'workout').replace(/_/g, ' ');
    return createMockSuccess({
      summary: `Outstanding effort completing ${reps} reps of ${ex}! Your neuromuscular activation and pacing were consistent. Make sure to hydrate with at least 500ml water and stretch your active muscle groups for 5 minutes.`
    }, 200, config);
  }

  // 15. YOUTUBE VIDEO SEARCH
  if (normalizedUrl.startsWith('/videos/search') && method === 'get') {
    const ex = (params.exercise || 'workout').toLowerCase();
    let videoList = [];

    if (ex.includes('squat')) {
      videoList = [
        {
          id: '9b8Wd0wX5B0',
          title: 'How To Squat Properly (Step by Step Guide)',
          channelTitle: 'Squat University',
          thumbnail: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=500&auto=format&fit=crop&q=60',
          duration: '6:12',
          level: 'All Levels'
        },
        {
          id: 'aclHkVaku9U',
          title: '3 Common Squat Mistakes and How to Fix Them',
          channelTitle: 'Athlean-X',
          thumbnail: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=500&auto=format&fit=crop&q=60',
          duration: '8:45',
          level: 'Beginner'
        }
      ];
    } else if (ex.includes('push')) {
      videoList = [
        {
          id: 'IODxDxX7oi4',
          title: 'The Perfect Push Up | Do It Right!',
          channelTitle: 'Calisthenicmovement',
          thumbnail: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=500&auto=format&fit=crop&q=60',
          duration: '5:30',
          level: 'Form Guide'
        },
        {
          id: 'W4eW2M_H-pU',
          title: 'Push-Up Form Mistakes Everyone Makes',
          channelTitle: 'Fitness FAQs',
          thumbnail: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&auto=format&fit=crop&q=60',
          duration: '7:15',
          level: 'Technique'
        }
      ];
    } else if (ex.includes('curl')) {
      videoList = [
        {
          id: 'ykJmrZ5v0Oo',
          title: 'How To Bicep Curl For Maximum Growth',
          channelTitle: 'Jeremy Ethier',
          thumbnail: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=500&auto=format&fit=crop&q=60',
          duration: '5:50',
          level: 'Biceps'
        }
      ];
    } else if (ex.includes('lunge')) {
      videoList = [
        {
          id: 'QOVaHwm-Q6U',
          title: 'How to Do Lunges Correctly to Prevent Knee Pain',
          channelTitle: 'Bowflex',
          thumbnail: 'https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=500&auto=format&fit=crop&q=60',
          duration: '4:20',
          level: 'Lower Body'
        }
      ];
    } else {
      videoList = [
        {
          id: 'search-fallback',
          title: `${params.exercise || 'Exercise'} Proper Form & Technique Tutorial`,
          channelTitle: 'FitLife Video Library',
          thumbnail: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=500&auto=format&fit=crop&q=60',
          duration: '5:00',
          isFallback: true,
          url: `https://www.youtube.com/results?search_query=${encodeURIComponent((params.exercise || 'exercise') + ' proper form')}`,
          level: 'Technique'
        }
      ];
    }

    return createMockSuccess({ videos: videoList }, 200, config);
  }

  return createMockError(404, `Endpoint ${method.toUpperCase()} ${normalizedUrl} not found`, config);
};
