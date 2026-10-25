const express = require('express');
const { protect } = require('../middleware/auth');
const {
  aiChat,
  generatePlan,
  getCurrentPlan,
  getPlanHistory,
  updateDayStatus,
  sessionSummary,
  configureApiKey,
  getAiStatus,
} = require('../controllers/aiController');

const router = express.Router();

// Status check (public so client can display live model indicator)
router.get('/status', getAiStatus);

router.use(protect);

// API key configuration
router.post('/set-key', configureApiKey);

// Chat
router.post('/coach', aiChat);

// Weekly plans
router.get('/weekly-plan/current', getCurrentPlan);
router.get('/weekly-plan', getCurrentPlan);
router.get('/weekly-plans', getPlanHistory);
router.post('/weekly-plan', generatePlan);
router.patch('/weekly-plan/:planId/day/:dayParam', updateDayStatus);

// Session summary
router.post('/session-summary', sessionSummary);

module.exports = router;
