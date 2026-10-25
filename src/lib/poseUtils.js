/**
 * poseUtils.js — utilities for MediaPipe landmark processing.
 * 
 * MediaPipe Pose Landmarker produces 33 landmarks:
 * https://developers.google.com/mediapipe/solutions/vision/pose_landmarker
 *
 * Key landmark indices (0-indexed):
 *  0=nose, 11=left_shoulder, 12=right_shoulder
 * 13=left_elbow, 14=right_elbow
 * 15=left_wrist, 16=right_wrist
 * 23=left_hip, 24=right_hip
 * 25=left_knee, 26=right_knee
 * 27=left_ankle, 28=right_ankle
 * 29=left_heel, 30=right_heel
 * 31=left_foot_index, 32=right_foot_index
 */

export const LM = {
  NOSE: 0,
  LEFT_EYE_INNER: 1, LEFT_EYE: 2, LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4, RIGHT_EYE: 5, RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7, RIGHT_EAR: 8,
  LEFT_SHOULDER: 11, RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13, RIGHT_ELBOW: 14,
  LEFT_WRIST: 15, RIGHT_WRIST: 16,
  LEFT_PINKY: 17, RIGHT_PINKY: 18,
  LEFT_INDEX: 19, RIGHT_INDEX: 20,
  LEFT_THUMB: 21, RIGHT_THUMB: 22,
  LEFT_HIP: 23, RIGHT_HIP: 24,
  LEFT_KNEE: 25, RIGHT_KNEE: 26,
  LEFT_ANKLE: 27, RIGHT_ANKLE: 28,
  LEFT_HEEL: 29, RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31, RIGHT_FOOT_INDEX: 32,
};

// Skeletal connections for drawing
export const POSE_CONNECTIONS = [
  // Torso
  [LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER],
  [LM.LEFT_SHOULDER, LM.LEFT_HIP],
  [LM.RIGHT_SHOULDER, LM.RIGHT_HIP],
  [LM.LEFT_HIP, LM.RIGHT_HIP],
  // Left arm
  [LM.LEFT_SHOULDER, LM.LEFT_ELBOW],
  [LM.LEFT_ELBOW, LM.LEFT_WRIST],
  // Right arm
  [LM.RIGHT_SHOULDER, LM.RIGHT_ELBOW],
  [LM.RIGHT_ELBOW, LM.RIGHT_WRIST],
  // Left leg
  [LM.LEFT_HIP, LM.LEFT_KNEE],
  [LM.LEFT_KNEE, LM.LEFT_ANKLE],
  [LM.LEFT_ANKLE, LM.LEFT_FOOT_INDEX],
  // Right leg
  [LM.RIGHT_HIP, LM.RIGHT_KNEE],
  [LM.RIGHT_KNEE, LM.RIGHT_ANKLE],
  [LM.RIGHT_ANKLE, LM.RIGHT_FOOT_INDEX],
];

/**
 * Get a landmark from an array by index, returns null if missing/low-visibility.
 */
export const getLandmark = (landmarks, idx, minVisibility = 0.4) => {
  const lm = landmarks?.[idx];
  if (!lm) return null;
  if (lm.visibility !== undefined && lm.visibility < minVisibility) return null;
  return lm;
};

/**
 * Compute the angle at vertex B formed by the vectors B→A and B→C.
 * All points must be { x, y } or { x, y, z }.
 * Returns angle in degrees [0, 180].
 */
export const computeAngle = (A, B, C) => {
  if (!A || !B || !C) return null;
  const v1 = { x: A.x - B.x, y: A.y - B.y };
  const v2 = { x: C.x - B.x, y: C.y - B.y };
  const dot = v1.x * v2.x + v1.y * v2.y;
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
  if (mag1 === 0 || mag2 === 0) return null;
  const cosAngle = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
  return (Math.acos(cosAngle) * 180) / Math.PI;
};

/**
 * Average of left and right side angle (use whichever side is more visible).
 */
export const bilateralAngle = (landmarks, lmA_L, lmB_L, lmC_L, lmA_R, lmB_R, lmC_R, minVis = 0.4) => {
  const AL = getLandmark(landmarks, lmA_L, minVis);
  const BL = getLandmark(landmarks, lmB_L, minVis);
  const CL = getLandmark(landmarks, lmC_L, minVis);
  const AR = getLandmark(landmarks, lmA_R, minVis);
  const BR = getLandmark(landmarks, lmB_R, minVis);
  const CR = getLandmark(landmarks, lmC_R, minVis);

  const leftAngle = computeAngle(AL, BL, CL);
  const rightAngle = computeAngle(AR, BR, CR);

  const leftVis = BL?.visibility ?? 0;
  const rightVis = BR?.visibility ?? 0;

  if (leftAngle !== null && rightAngle !== null) {
    return (leftAngle + rightAngle) / 2;
  }
  if (leftAngle !== null) return leftAngle;
  if (rightAngle !== null) return rightAngle;
  return null;
};

/**
 * Exponential moving average smoother for angle values.
 * Usage: create a smoother with createSmoother(alpha) and call smooth(value).
 */
export const createSmoother = (alpha = 0.3) => {
  let prev = null;
  return (value) => {
    if (value === null || value === undefined) return prev;
    if (prev === null) { prev = value; return value; }
    prev = alpha * value + (1 - alpha) * prev;
    return prev;
  };
};

/**
 * Check if a set of landmark indices are all visible above a threshold.
 */
export const areLandmarksVisible = (landmarks, indices, minVisibility = 0.5) => {
  return indices.every((idx) => {
    const lm = landmarks?.[idx];
    return lm && (lm.visibility === undefined || lm.visibility >= minVisibility);
  });
};

/**
 * Compute overall pose confidence as average visibility of key landmarks.
 */
export const overallConfidence = (landmarks, keyIndices) => {
  if (!landmarks || !keyIndices.length) return 0;
  const sum = keyIndices.reduce((acc, idx) => {
    const lm = landmarks[idx];
    return acc + (lm?.visibility ?? 0);
  }, 0);
  return sum / keyIndices.length;
};

/**
 * Clamp value between min and max.
 */
export const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

/**
 * Draw pose skeleton and landmarks on a canvas.
 */
export const drawPose = (ctx, landmarks, width, height, options = {}) => {
  if (!landmarks || !ctx) return;

  const {
    lineColor = 'rgba(16, 185, 129, 0.8)',
    dotColor = '#10b981',
    dotRadius = 4,
    lineWidth = 2,
    qualityColor = null,
  } = options;

  ctx.save();

  const toPixel = (lm) => ({ x: lm.x * width, y: lm.y * height });

  // Draw connections
  ctx.strokeStyle = qualityColor || lineColor;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';

  for (const [startIdx, endIdx] of POSE_CONNECTIONS) {
    const start = landmarks[startIdx];
    const end = landmarks[endIdx];
    if (!start || !end) continue;
    if ((start.visibility ?? 1) < 0.3 || (end.visibility ?? 1) < 0.3) continue;

    const ps = toPixel(start);
    const pe = toPixel(end);
    ctx.beginPath();
    ctx.moveTo(ps.x, ps.y);
    ctx.lineTo(pe.x, pe.y);
    ctx.stroke();
  }

  // Draw landmark dots
  ctx.fillStyle = qualityColor || dotColor;
  for (let i = 0; i < landmarks.length; i++) {
    const lm = landmarks[i];
    if (!lm || (lm.visibility ?? 1) < 0.3) continue;
    const p = toPixel(lm);
    ctx.beginPath();
    ctx.arc(p.x, p.y, dotRadius, 0, 2 * Math.PI);
    ctx.fill();
  }

  ctx.restore();
};
