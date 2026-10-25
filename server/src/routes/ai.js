const express = require('express');
const { protect } = require('../middleware/auth');
const {
  aiChat,
  generatePlan,
  getCurrentPlan,
  getPlanHistory,
  updateDayStatus,
  sessionSummary,
} = require('../controllers/aiController');

const router = express.Router();
router.use(protect);

// Chat
router.post('/coach', aiChat);

// Weekly plans
router.get('/weekly-plan', getCurrentPlan);
router.get('/weekly-plans', getPlanHistory);
router.post('/weekly-plan', generatePlan);
router.patch('/weekly-plan/:planId/day/:dayOfWeek', updateDayStatus);

// Session summary
router.post('/session-summary', sessionSummary);

module.exports = router;
