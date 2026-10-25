/**
 * YouTubeService — searches YouTube Data API v3 for exercise demonstration videos.
 * Falls back to a safe YouTube search URL when no API key is configured.
 */

const https = require('https');

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

/**
 * Make a simple HTTPS GET request and return parsed JSON.
 */
const httpsGet = (url) =>
  new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('Invalid JSON from YouTube API')); }
      });
    }).on('error', reject);
  });

/**
 * Simple in-memory cache (key = searchTerm, value = { results, expiresAt })
 */
const cache = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Search YouTube for exercise demonstration videos.
 * @param {string} exerciseName
 * @param {string} experienceLevel - beginner / intermediate / advanced
 * @returns {Promise<{videos: Array, fallbackUrl: string, usingFallback: boolean}>}
 */
const searchExerciseVideos = async (exerciseName, experienceLevel = 'beginner') => {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const sanitized = exerciseName.replace(/[^a-z0-9 ]/gi, '').trim().substring(0, 80);
  const query = `${sanitized} exercise tutorial proper form ${experienceLevel}`;
  const fallbackUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

  if (!apiKey) {
    return { videos: [], fallbackUrl, usingFallback: true };
  }

  const cacheKey = `${sanitized}_${experienceLevel}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const params = new URLSearchParams({
    part: 'snippet',
    q: query,
    type: 'video',
    videoCategoryId: '17', // Sports
    maxResults: '5',
    safeSearch: 'strict',
    relevanceLanguage: 'en',
    key: apiKey,
  });

  const url = `${YOUTUBE_API_BASE}/search?${params}`;

  let searchData;
  try {
    searchData = await httpsGet(url);
  } catch (err) {
    console.error('[YouTube] Search failed:', err.message);
    return { videos: [], fallbackUrl, usingFallback: true };
  }

  if (searchData.error) {
    console.error('[YouTube] API error:', searchData.error.message);
    return { videos: [], fallbackUrl, usingFallback: true };
  }

  // Get video IDs for duration lookup
  const items = searchData.items || [];
  const videoIds = items.map((i) => i.id?.videoId).filter(Boolean);

  let durationMap = {};
  if (videoIds.length > 0) {
    try {
      const detailsParams = new URLSearchParams({
        part: 'contentDetails,statistics',
        id: videoIds.join(','),
        key: apiKey,
      });
      const detailsData = await httpsGet(`${YOUTUBE_API_BASE}/videos?${detailsParams}`);
      (detailsData.items || []).forEach((v) => {
        durationMap[v.id] = {
          duration: parseDuration(v.contentDetails?.duration),
          viewCount: v.statistics?.viewCount,
        };
      });
    } catch {
      // Duration details are optional
    }
  }

  const videos = items.map((item) => {
    const videoId = item.id?.videoId;
    if (!videoId) return null;
    const snippet = item.snippet || {};
    const details = durationMap[videoId] || {};
    return {
      videoId,
      title: snippet.title || '',
      channelName: snippet.channelTitle || '',
      thumbnail: snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || '',
      publishedAt: snippet.publishedAt || '',
      duration: details.duration || null,
      viewCount: details.viewCount ? parseInt(details.viewCount).toLocaleString() : null,
      watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
    };
  }).filter(Boolean);

  const result = { videos, fallbackUrl, usingFallback: false };
  cache.set(cacheKey, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });
  return result;
};

/**
 * Parse ISO 8601 duration (PT4M13S) to human-readable string.
 */
const parseDuration = (iso) => {
  if (!iso) return null;
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return null;
  const h = parseInt(match[1] || 0);
  const m = parseInt(match[2] || 0);
  const s = parseInt(match[3] || 0);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
};

module.exports = { searchExerciseVideos };
