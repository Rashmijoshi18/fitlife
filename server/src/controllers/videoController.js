const { query, validationResult } = require('express-validator');
const youtubeService = require('../services/youtubeService');

/**
 * @route GET /api/videos/search?exercise=squats&level=beginner
 * @desc  Search YouTube for exercise demonstration videos
 * @access Private
 */
const searchVideos = [
  query('exercise').isString().trim().isLength({ min: 1, max: 100 }).withMessage('Exercise name is required (max 100 chars)'),
  query('level').optional().isIn(['beginner', 'intermediate', 'advanced']),

  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { exercise, level = 'beginner' } = req.query;

      const result = await youtubeService.searchExerciseVideos(exercise, level);

      res.json(result);
    } catch (error) {
      console.error('[Video Search]', error.message);
      // Return fallback gracefully
      const fallbackUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(req.query.exercise + ' exercise tutorial')}`;
      res.json({ videos: [], fallbackUrl, usingFallback: true });
    }
  },
];

module.exports = { searchVideos };
