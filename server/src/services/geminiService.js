/**
 * GeminiService — secure server-side wrapper around the Google Gemini API.
 *
 * Uses @google/genai SDK (the official Google Gen AI Node.js SDK).
 * The API key is read exclusively from server-side environment variables.
 * It is NEVER exposed to the client.
 */

const { GoogleGenAI } = require('@google/genai');

// Lazy-initialize so the module loads even if key is missing
let _client = null;

const getClient = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }
  if (!_client) {
    _client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return _client;
};

const setClientKey = (key) => {
  process.env.GEMINI_API_KEY = key;
  _client = new GoogleGenAI({ apiKey: key });
};

const MODEL = 'gemini-3-flash-preview';

// ─── Safety disclaimer appended to all system prompts ────────────────────────
const SAFETY_DISCLAIMER = `
Important constraints you must always follow:
- You are a fitness coaching assistant, NOT a medical professional.
- Never diagnose medical conditions or guarantee specific health outcomes.
- Always recommend consulting a doctor before starting a new exercise program.
- Do not promise specific weight-loss amounts or timelines.
- When discussing exercises, note they are general guidance, not prescriptions.
- If a user mentions pain, injury, or medical conditions, recommend professional advice.
`;

const COACH_SYSTEM_PROMPT = `You are FitLife Coach, a knowledgeable and encouraging AI fitness assistant.
Your role is to help users with workout planning, exercise guidance, fitness goals, and healthy habits.
Keep responses clear, practical, structured, and motivating (3-5 concise sections max unless more detail is requested).
Format your responses using clean Markdown (such as bold headings, bullet lists for exercise steps or food items, bold keywords, and concise markdown tables where helpful).
${SAFETY_DISCLAIMER}`;

const PLAN_SYSTEM_PROMPT = `You are a certified fitness programmer generating structured weekly workout plans.
You MUST respond with ONLY valid JSON — no explanation, no markdown fences, just raw JSON.
The JSON must exactly match the schema provided in the user's message.
${SAFETY_DISCLAIMER}`;

/**
 * Send a coaching chat message and get a response.
 * @param {string} userMessage
 * @param {Array<{role: string, parts: string}>} history - previous turns
 * @param {Object} userContext - limited profile info (fitnessLevel, goal only)
 * @returns {Promise<string>}
 */
const chat = async (userMessage, history = [], userContext = {}) => {
  const ai = getClient();

  const contextStr = userContext.fitnessLevel
    ? `\nUser context: fitness level = ${userContext.fitnessLevel}, goal = ${userContext.fitnessGoal || 'general fitness'}.`
    : '';

  const systemInstruction = COACH_SYSTEM_PROMPT + contextStr;

  // Build contents array from history
  const contents = history.map((turn) => ({
    role: turn.role,
    parts: [{ text: turn.content }],
  }));

  // Add current user message
  contents.push({
    role: 'user',
    parts: [{ text: userMessage.substring(0, 2000) }], // limit input
  });

  const response = await ai.models.generateContent({
    model: MODEL,
    systemInstruction,
    contents,
    config: {
      maxOutputTokens: 800,
      temperature: 0.7,
    },
  });

  const text = response.text;
  if (!text) throw new Error('Empty response from Gemini');
  return text;
};

/**
 * Generate a structured weekly workout plan.
 * Returns a validated JavaScript object.
 */
const generateWeeklyPlan = async (profile) => {
  const ai = getClient();

  const schema = {
    weekPlan: {
      description: 'Array of 7 day objects, one per day Monday through Sunday',
      type: 'array',
      items: {
        dayOfWeek: 'string (monday/tuesday/wednesday/thursday/friday/saturday/sunday)',
        isRestDay: 'boolean',
        focus: 'string (e.g. "Upper Body Push") or null if rest day',
        estimatedDurationMinutes: 'number or null if rest day',
        warmUp: 'array of exercise objects (name, sets, reps, restSeconds, notes)',
        exercises: 'array of exercise objects (name, sets, reps, duration?, restSeconds, muscleGroup, equipment, notes)',
        coolDown: 'array of exercise objects',
        notes: 'string with coaching notes for this day',
      },
    },
    progressionNotes: 'string with weekly progression advice',
  };

  const prompt = `Generate a personalized weekly workout plan for the following user profile:
- Fitness goal: ${profile.fitnessGoal || 'general fitness'}
- Experience level: ${profile.fitnessLevel || 'beginner'}
- Available equipment: ${(profile.equipment || ['bodyweight']).join(', ')}
- Preferred workout days: ${(profile.preferredDays || ['monday', 'wednesday', 'friday']).join(', ')}
- Rest days: ${(profile.restDays || ['tuesday', 'thursday', 'saturday', 'sunday']).join(', ')}
- Session duration: ${profile.sessionDurationMinutes || 45} minutes
${profile.limitations ? `- Limitations/notes: ${profile.limitations.substring(0, 200)}` : ''}

CRITICAL: Return ONLY a JSON object matching this schema exactly:
${JSON.stringify(schema, null, 2)}

Rules:
- Include exactly 7 days (Monday through Sunday)
- Rest days have isRestDay: true and minimal/no exercises
- Non-rest days must have: warmUp (2-3 exercises), exercises (4-8 exercises), coolDown (2-3 stretches)
- Each exercise object must have: name (string), sets (number), reps (string like "10-12" or "30 seconds"), restSeconds (number), notes (string)
- For beginners: max 3-4 sets, start with bodyweight, include rest days
- Avoid consecutive high-intensity days for beginners
- Use only safe, well-established exercises
- Equipment must match what the user has available`;

  const response = await ai.models.generateContent({
    model: MODEL,
    systemInstruction: PLAN_SYSTEM_PROMPT,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: {
      maxOutputTokens: 4000,
      temperature: 0.3, // lower temp for structured output
      responseMimeType: 'application/json',
    },
  });

  const raw = response.text;
  if (!raw) throw new Error('Empty response from Gemini');

  // Parse and validate the JSON
  let parsed;
  try {
    // Strip markdown fences if present despite instructions
    const cleaned = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('Gemini returned invalid JSON for workout plan');
  }

  // Basic validation
  if (!parsed.weekPlan || !Array.isArray(parsed.weekPlan) || parsed.weekPlan.length !== 7) {
    throw new Error('Gemini returned an invalid plan structure (expected 7-day array)');
  }

  const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  for (const day of parsed.weekPlan) {
    if (!validDays.includes(day.dayOfWeek)) {
      throw new Error(`Invalid day name in plan: ${day.dayOfWeek}`);
    }
    if (!day.isRestDay && (!day.exercises || !Array.isArray(day.exercises))) {
      day.exercises = [];
    }
    if (!day.warmUp) day.warmUp = [];
    if (!day.coolDown) day.coolDown = [];
  }

  return parsed;
};

/**
 * Generate a workout session summary using Gemini.
 */
const generateSessionSummary = async (sessionData, userContext = {}) => {
  const ai = getClient();

  const prompt = `Provide a brief, encouraging workout session summary and 2-3 actionable tips for next time.
Session data:
- Exercise: ${sessionData.exerciseName}
- Duration: ${sessionData.activeDurationMinutes} minutes
- Reps completed: ${sessionData.totalReps}
- Average form quality: ${sessionData.avgFormQuality || 'unknown'}
- Estimated calories: ${sessionData.estimatedCalories} kcal (approximate)
User level: ${userContext.fitnessLevel || 'beginner'}

Keep the response to 2-3 short paragraphs. Be encouraging and specific.`;

  const response = await ai.models.generateContent({
    model: MODEL,
    systemInstruction: COACH_SYSTEM_PROMPT,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: { maxOutputTokens: 400, temperature: 0.7 },
  });

  return response.text || 'Great workout! Keep up the consistency.';
};

module.exports = { chat, generateWeeklyPlan, generateSessionSummary, setClientKey };
