/**
 * exerciseAnalysis.js — Exercise-specific rep counting and form analysis.
 *
 * Architecture:
 * - Each exercise has an Analyzer class implementing a Finite State Machine (FSM)
 * - Smoothing is applied to raw angle measurements to reduce noise
 * - Visibility checks prevent counting when landmarks are unreliable
 * - Hysteresis prevents oscillating around threshold boundaries
 * - Cooldown prevents double-counting within a minimum rep duration
 *
 * Supported exercises: squats, pushups, bicep_curls, jumping_jacks, lunges
 */

import {
  getLandmark, computeAngle, bilateralAngle, createSmoother,
  areLandmarksVisible, overallConfidence, LM,
} from './poseUtils';

// ─── Constants ────────────────────────────────────────────────────────────────

const MIN_REP_COOLDOWN_MS = 500; // Minimum time between rep counts (debounce)
const VIS_THRESHOLD = 0.5;

// ─── Form quality levels ──────────────────────────────────────────────────────
export const FORM_QUALITY = {
  GOOD: 'Good Form',
  NEEDS_IMPROVEMENT: 'Needs Improvement',
  UNABLE: 'Unable to Assess',
};

// ─── Base Analyzer class ──────────────────────────────────────────────────────
class BaseAnalyzer {
  constructor() {
    this.repCount = 0;
    this.phase = 'waiting'; // exercise-specific phases
    this.lastRepTime = 0;
    this.formQuality = FORM_QUALITY.UNABLE;
    this.feedback = [];
    this.smoothers = {};
  }

  getSmoother(key, alpha = 0.25) {
    if (!this.smoothers[key]) this.smoothers[key] = createSmoother(alpha);
    return this.smoothers[key];
  }

  smooth(key, value, alpha = 0.25) {
    return this.getSmoother(key, alpha)(value);
  }

  canCountRep() {
    return Date.now() - this.lastRepTime > MIN_REP_COOLDOWN_MS;
  }

  countRep() {
    if (!this.canCountRep()) return false;
    this.repCount++;
    this.lastRepTime = Date.now();
    return true;
  }

  getState() {
    return {
      repCount: this.repCount,
      phase: this.phase,
      formQuality: this.formQuality,
      feedback: this.feedback,
    };
  }

  reset() {
    this.repCount = 0;
    this.phase = 'waiting';
    this.lastRepTime = 0;
    this.formQuality = FORM_QUALITY.UNABLE;
    this.feedback = [];
    Object.values(this.smoothers).forEach(s => s(null));
    this.smoothers = {};
  }
}

// ─── Squats Analyzer ──────────────────────────────────────────────────────────
/**
 * Camera position: side view or slightly angled front view.
 * Key angles: knee angle, hip angle.
 * FSM: standing (knee > 160°) → descending → bottom (knee < 110°) → ascending → standing
 */
class SquatAnalyzer extends BaseAnalyzer {
  constructor() {
    super();
    this.phase = 'standing';
  }

  static REQUIRED_LM = [LM.LEFT_HIP, LM.LEFT_KNEE, LM.LEFT_ANKLE, LM.RIGHT_HIP, LM.RIGHT_KNEE, LM.RIGHT_ANKLE];
  static STANDING_ANGLE = 155;   // degrees — fully standing
  static BOTTOM_ANGLE = 110;     // degrees — at or below this is "bottom"
  static DESCENT_TRIGGER = 145;  // start descent when knee drops below this
  static ASCENT_TRIGGER = 125;   // leave bottom when above this

  analyze(landmarks) {
    if (!areLandmarksVisible(landmarks, SquatAnalyzer.REQUIRED_LM, VIS_THRESHOLD)) {
      this.formQuality = FORM_QUALITY.UNABLE;
      this.feedback = ['Position yourself so your full body is visible in the camera.'];
      return this.getState();
    }

    // Get bilateral knee angle
    const rawKneeAngle = bilateralAngle(
      landmarks,
      LM.LEFT_HIP, LM.LEFT_KNEE, LM.LEFT_ANKLE,
      LM.RIGHT_HIP, LM.RIGHT_KNEE, LM.RIGHT_ANKLE,
    );

    if (rawKneeAngle === null) {
      this.formQuality = FORM_QUALITY.UNABLE;
      return this.getState();
    }

    const kneeAngle = this.smooth('knee', rawKneeAngle);

    // Hip angle for form assessment
    const rawHipAngle = bilateralAngle(
      landmarks,
      LM.LEFT_SHOULDER, LM.LEFT_HIP, LM.LEFT_KNEE,
      LM.RIGHT_SHOULDER, LM.RIGHT_HIP, LM.RIGHT_KNEE,
    );
    const hipAngle = rawHipAngle !== null ? this.smooth('hip', rawHipAngle) : null;

    // FSM transitions
    const prevPhase = this.phase;
    if (this.phase === 'standing' && kneeAngle < SquatAnalyzer.DESCENT_TRIGGER) {
      this.phase = 'descending';
    } else if (this.phase === 'descending' && kneeAngle <= SquatAnalyzer.BOTTOM_ANGLE) {
      this.phase = 'bottom';
    } else if (this.phase === 'bottom' && kneeAngle > SquatAnalyzer.ASCENT_TRIGGER) {
      this.phase = 'ascending';
    } else if (this.phase === 'ascending' && kneeAngle >= SquatAnalyzer.STANDING_ANGLE) {
      this.phase = 'standing';
      this.countRep(); // Rep completed on return to standing
    }

    // Form analysis
    const feedbackList = [];
    let quality = FORM_QUALITY.GOOD;

    if (this.phase === 'bottom' || this.phase === 'ascending' || this.phase === 'descending') {
      // Check knee tracking
      const leftKnee = getLandmark(landmarks, LM.LEFT_KNEE, 0.4);
      const leftAnkle = getLandmark(landmarks, LM.LEFT_ANKLE, 0.4);
      const rightKnee = getLandmark(landmarks, LM.RIGHT_KNEE, 0.4);
      const rightAnkle = getLandmark(landmarks, LM.RIGHT_ANKLE, 0.4);

      if (leftKnee && leftAnkle && rightKnee && rightAnkle) {
        const leftKneeDrift = Math.abs(leftKnee.x - leftAnkle.x);
        const rightKneeDrift = Math.abs(rightKnee.x - rightAnkle.x);
        if (leftKneeDrift > 0.08 || rightKneeDrift > 0.08) {
          feedbackList.push('Keep your knees aligned with your feet.');
          quality = FORM_QUALITY.NEEDS_IMPROVEMENT;
        }
      }

      // Check depth (encourage reaching bottom)
      if (this.phase === 'descending' && kneeAngle > 130) {
        feedbackList.push('Try to reach a comfortable, controlled squat depth.');
      }

      // Upright torso
      if (hipAngle !== null && hipAngle < 50) {
        feedbackList.push('Try to keep a more upright torso.');
        quality = FORM_QUALITY.NEEDS_IMPROVEMENT;
      }
    }

    if (feedbackList.length === 0 && this.phase !== 'waiting') {
      feedbackList.push(
        this.phase === 'standing' ? 'Good posture — ready for next rep!' :
        this.phase === 'bottom' ? 'Great depth! Now push back up.' :
        'Keep going — nice form!'
      );
    }

    this.formQuality = quality;
    this.feedback = feedbackList.slice(0, 2);
    return this.getState();
  }
}

// ─── Push-up Analyzer ─────────────────────────────────────────────────────────
/**
 * Camera position: side view.
 * Key angles: elbow angle, body alignment.
 * FSM: up (elbow > 155°) → descending → bottom (elbow < 90°) → ascending → up
 */
class PushupAnalyzer extends BaseAnalyzer {
  constructor() { super(); this.phase = 'up'; }

  static REQUIRED_LM = [LM.LEFT_SHOULDER, LM.LEFT_ELBOW, LM.LEFT_WRIST, LM.RIGHT_SHOULDER, LM.RIGHT_ELBOW, LM.RIGHT_WRIST];
  static UP_ANGLE = 150;
  static BOTTOM_ANGLE = 90;
  static DESCENT_TRIGGER = 140;
  static ASCENT_TRIGGER = 110;

  analyze(landmarks) {
    if (!areLandmarksVisible(landmarks, PushupAnalyzer.REQUIRED_LM, VIS_THRESHOLD)) {
      this.formQuality = FORM_QUALITY.UNABLE;
      this.feedback = ['Position your body sideways to the camera for push-up tracking.'];
      return this.getState();
    }

    const rawElbowAngle = bilateralAngle(
      landmarks,
      LM.LEFT_SHOULDER, LM.LEFT_ELBOW, LM.LEFT_WRIST,
      LM.RIGHT_SHOULDER, LM.RIGHT_ELBOW, LM.RIGHT_WRIST,
    );

    if (rawElbowAngle === null) {
      this.formQuality = FORM_QUALITY.UNABLE;
      return this.getState();
    }
    const elbowAngle = this.smooth('elbow', rawElbowAngle);

    // FSM
    if (this.phase === 'up' && elbowAngle < PushupAnalyzer.DESCENT_TRIGGER) {
      this.phase = 'descending';
    } else if (this.phase === 'descending' && elbowAngle <= PushupAnalyzer.BOTTOM_ANGLE) {
      this.phase = 'bottom';
    } else if (this.phase === 'bottom' && elbowAngle > PushupAnalyzer.ASCENT_TRIGGER) {
      this.phase = 'ascending';
    } else if (this.phase === 'ascending' && elbowAngle >= PushupAnalyzer.UP_ANGLE) {
      this.phase = 'up';
      this.countRep();
    }

    // Form analysis — body line (hip alignment)
    const feedbackList = [];
    let quality = FORM_QUALITY.GOOD;

    const leftShoulder = getLandmark(landmarks, LM.LEFT_SHOULDER, 0.4);
    const leftHip = getLandmark(landmarks, LM.LEFT_HIP, 0.4);
    const leftAnkle = getLandmark(landmarks, LM.LEFT_ANKLE, 0.4);

    if (leftShoulder && leftHip && leftAnkle) {
      // Check if hip is sagging (y much higher than shoulder-ankle line) or piking
      const expectedHipY = leftShoulder.y + (leftAnkle.y - leftShoulder.y) * 0.5;
      const hipDeviation = Math.abs(leftHip.y - expectedHipY);
      if (hipDeviation > 0.08) {
        feedbackList.push('Try to maintain a straight body line — avoid sagging or piking your hips.');
        quality = FORM_QUALITY.NEEDS_IMPROVEMENT;
      }
    }

    if (feedbackList.length === 0 && this.phase !== 'waiting') {
      feedbackList.push(
        this.phase === 'up' ? 'Great position! Arms fully extended.' :
        this.phase === 'bottom' ? 'Good depth! Push back up.' :
        'Looking good!'
      );
    }

    this.formQuality = quality;
    this.feedback = feedbackList.slice(0, 2);
    return this.getState();
  }
}

// ─── Bicep Curl Analyzer ──────────────────────────────────────────────────────
/**
 * Camera position: front or side view.
 * Key angle: elbow flexion.
 * FSM: extended (elbow > 150°) → flexing → curled (elbow < 50°) → extending → extended
 */
class BicepCurlAnalyzer extends BaseAnalyzer {
  constructor() { super(); this.phase = 'extended'; }

  static REQUIRED_LM = [LM.LEFT_SHOULDER, LM.LEFT_ELBOW, LM.LEFT_WRIST, LM.RIGHT_SHOULDER, LM.RIGHT_ELBOW, LM.RIGHT_WRIST];
  static EXTENDED_ANGLE = 145;
  static CURLED_ANGLE = 55;
  static FLEX_TRIGGER = 130;
  static EXTEND_TRIGGER = 70;

  analyze(landmarks) {
    if (!areLandmarksVisible(landmarks, BicepCurlAnalyzer.REQUIRED_LM, VIS_THRESHOLD)) {
      this.formQuality = FORM_QUALITY.UNABLE;
      this.feedback = ['Position yourself facing the camera with your arms visible.'];
      return this.getState();
    }

    const rawAngle = bilateralAngle(
      landmarks,
      LM.LEFT_SHOULDER, LM.LEFT_ELBOW, LM.LEFT_WRIST,
      LM.RIGHT_SHOULDER, LM.RIGHT_ELBOW, LM.RIGHT_WRIST,
    );
    if (rawAngle === null) { this.formQuality = FORM_QUALITY.UNABLE; return this.getState(); }
    const elbowAngle = this.smooth('elbow', rawAngle);

    if (this.phase === 'extended' && elbowAngle < BicepCurlAnalyzer.FLEX_TRIGGER) {
      this.phase = 'flexing';
    } else if (this.phase === 'flexing' && elbowAngle <= BicepCurlAnalyzer.CURLED_ANGLE) {
      this.phase = 'curled';
    } else if (this.phase === 'curled' && elbowAngle > BicepCurlAnalyzer.EXTEND_TRIGGER) {
      this.phase = 'extending';
    } else if (this.phase === 'extending' && elbowAngle >= BicepCurlAnalyzer.EXTENDED_ANGLE) {
      this.phase = 'extended';
      this.countRep();
    }

    // Form: check upper arm stays relatively stable (elbow doesn't swing forward much)
    const feedbackList = [];
    let quality = FORM_QUALITY.GOOD;

    const leftShoulder = getLandmark(landmarks, LM.LEFT_SHOULDER, 0.4);
    const leftElbow = getLandmark(landmarks, LM.LEFT_ELBOW, 0.4);
    const rightShoulder = getLandmark(landmarks, LM.RIGHT_SHOULDER, 0.4);
    const rightElbow = getLandmark(landmarks, LM.RIGHT_ELBOW, 0.4);

    if (leftShoulder && leftElbow && rightShoulder && rightElbow) {
      const leftElbowFwd = leftElbow.x - leftShoulder.x;
      const rightElbowFwd = rightElbow.x - rightShoulder.x;
      if (Math.abs(leftElbowFwd) > 0.12 || Math.abs(rightElbowFwd) > 0.12) {
        feedbackList.push('Keep your upper arms relatively stable — avoid swinging.');
        quality = FORM_QUALITY.NEEDS_IMPROVEMENT;
      }
    }

    if (feedbackList.length === 0) {
      feedbackList.push(
        this.phase === 'extended' ? 'Arms extended — curl up!' :
        this.phase === 'curled' ? 'Peak contraction! Lower slowly.' :
        'Great control!'
      );
    }

    this.formQuality = quality;
    this.feedback = feedbackList.slice(0, 2);
    return this.getState();
  }
}

// ─── Jumping Jacks Analyzer ───────────────────────────────────────────────────
/**
 * Camera position: front view.
 * Uses: shoulder-to-wrist distance (arm raise) + ankle-to-ankle distance (leg spread).
 * FSM: closed → opening → open → closing → closed
 */
class JumpingJacksAnalyzer extends BaseAnalyzer {
  constructor() { super(); this.phase = 'closed'; }

  static REQUIRED_LM = [LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER, LM.LEFT_WRIST, LM.RIGHT_WRIST, LM.LEFT_ANKLE, LM.RIGHT_ANKLE];

  analyze(landmarks) {
    if (!areLandmarksVisible(landmarks, JumpingJacksAnalyzer.REQUIRED_LM, 0.4)) {
      this.formQuality = FORM_QUALITY.UNABLE;
      this.feedback = ['Face the camera with your full body visible.'];
      return this.getState();
    }

    const leftShoulder = getLandmark(landmarks, LM.LEFT_SHOULDER, 0.4);
    const rightShoulder = getLandmark(landmarks, LM.RIGHT_SHOULDER, 0.4);
    const leftWrist = getLandmark(landmarks, LM.LEFT_WRIST, 0.4);
    const rightWrist = getLandmark(landmarks, LM.RIGHT_WRIST, 0.4);
    const leftAnkle = getLandmark(landmarks, LM.LEFT_ANKLE, 0.4);
    const rightAnkle = getLandmark(landmarks, LM.RIGHT_ANKLE, 0.4);

    if (!leftShoulder || !rightShoulder || !leftWrist || !rightWrist || !leftAnkle || !rightAnkle) {
      this.formQuality = FORM_QUALITY.UNABLE;
      return this.getState();
    }

    // Arm spread: wrist-to-wrist distance normalized by shoulder width
    const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x);
    const armSpread = Math.abs(rightWrist.x - leftWrist.x) / Math.max(shoulderWidth, 0.01);

    // Leg spread: ankle-to-ankle distance normalized by shoulder width
    const legSpread = Math.abs(rightAnkle.x - leftAnkle.x) / Math.max(shoulderWidth, 0.01);

    // Arms raised: wrists above shoulders in y-axis (y increases downward in normalized coords)
    const armsRaised = leftWrist.y < leftShoulder.y - 0.05 && rightWrist.y < rightShoulder.y - 0.05;

    const smoothArmSpread = this.smooth('arm', armSpread);
    const smoothLegSpread = this.smooth('leg', legSpread);

    const isOpen = smoothArmSpread > 1.8 && smoothLegSpread > 1.4 && armsRaised;
    const isClosed = smoothArmSpread < 1.1 && smoothLegSpread < 0.7;

    if (this.phase === 'closed' && !isClosed) {
      this.phase = 'opening';
    } else if (this.phase === 'opening' && isOpen) {
      this.phase = 'open';
    } else if (this.phase === 'open' && !isOpen) {
      this.phase = 'closing';
    } else if (this.phase === 'closing' && isClosed) {
      this.phase = 'closed';
      this.countRep();
    }

    const feedbackList = [];
    let quality = FORM_QUALITY.GOOD;

    if (this.phase === 'opening' || this.phase === 'open') {
      if (!armsRaised) {
        feedbackList.push('Raise your arms above shoulder height.');
        quality = FORM_QUALITY.NEEDS_IMPROVEMENT;
      }
      if (smoothLegSpread < 1.2) {
        feedbackList.push('Spread your legs wider.');
        quality = FORM_QUALITY.NEEDS_IMPROVEMENT;
      }
    }

    if (feedbackList.length === 0) {
      feedbackList.push(this.phase === 'open' ? 'Full extension — great!' : 'Good rhythm!');
    }

    this.formQuality = quality;
    this.feedback = feedbackList.slice(0, 2);
    return this.getState();
  }
}

// ─── Lunge Analyzer ───────────────────────────────────────────────────────────
/**
 * Camera position: side view.
 * Key angles: front knee angle.
 * FSM: standing → lunging (front knee < 120°) → bottom → returning → standing
 */
class LungeAnalyzer extends BaseAnalyzer {
  constructor() { super(); this.phase = 'standing'; }

  static REQUIRED_LM = [LM.LEFT_HIP, LM.LEFT_KNEE, LM.LEFT_ANKLE, LM.RIGHT_HIP, LM.RIGHT_KNEE, LM.RIGHT_ANKLE];
  static STANDING_ANGLE = 155;
  static BOTTOM_ANGLE = 115;
  static DESCENT_TRIGGER = 145;
  static ASCENT_TRIGGER = 130;

  analyze(landmarks) {
    if (!areLandmarksVisible(landmarks, LungeAnalyzer.REQUIRED_LM, VIS_THRESHOLD)) {
      this.formQuality = FORM_QUALITY.UNABLE;
      this.feedback = ['Stand sideways to the camera with your full legs visible.'];
      return this.getState();
    }

    // Use the lower of the two knee angles (the lunging leg)
    const leftHip = getLandmark(landmarks, LM.LEFT_HIP, 0.4);
    const leftKnee = getLandmark(landmarks, LM.LEFT_KNEE, 0.4);
    const leftAnkle = getLandmark(landmarks, LM.LEFT_ANKLE, 0.4);
    const rightHip = getLandmark(landmarks, LM.RIGHT_HIP, 0.4);
    const rightKnee = getLandmark(landmarks, LM.RIGHT_KNEE, 0.4);
    const rightAnkle = getLandmark(landmarks, LM.RIGHT_ANKLE, 0.4);

    const leftKneeAngle = computeAngle(leftHip, leftKnee, leftAnkle);
    const rightKneeAngle = computeAngle(rightHip, rightKnee, rightAnkle);

    let frontKneeAngle = null;
    if (leftKneeAngle !== null && rightKneeAngle !== null) {
      frontKneeAngle = Math.min(leftKneeAngle, rightKneeAngle);
    } else {
      frontKneeAngle = leftKneeAngle ?? rightKneeAngle;
    }

    if (frontKneeAngle === null) { this.formQuality = FORM_QUALITY.UNABLE; return this.getState(); }
    const kneeAngle = this.smooth('knee', frontKneeAngle);

    if (this.phase === 'standing' && kneeAngle < LungeAnalyzer.DESCENT_TRIGGER) {
      this.phase = 'descending';
    } else if (this.phase === 'descending' && kneeAngle <= LungeAnalyzer.BOTTOM_ANGLE) {
      this.phase = 'bottom';
    } else if (this.phase === 'bottom' && kneeAngle > LungeAnalyzer.ASCENT_TRIGGER) {
      this.phase = 'ascending';
    } else if (this.phase === 'ascending' && kneeAngle >= LungeAnalyzer.STANDING_ANGLE) {
      this.phase = 'standing';
      this.countRep();
    }

    const feedbackList = [];
    let quality = FORM_QUALITY.GOOD;

    if (this.phase !== 'standing') {
      // Check knee over toe (front knee x should stay near front ankle x)
      const minKnee = leftKneeAngle !== null && rightKneeAngle !== null
        ? (leftKneeAngle < rightKneeAngle ? leftKnee : rightKnee)
        : leftKnee ?? rightKnee;
      const minAnkle = leftKneeAngle !== null && rightKneeAngle !== null
        ? (leftKneeAngle < rightKneeAngle ? leftAnkle : rightAnkle)
        : leftAnkle ?? rightAnkle;

      if (minKnee && minAnkle) {
        const kneeForward = minKnee.x - minAnkle.x;
        if (Math.abs(kneeForward) > 0.08) {
          feedbackList.push('Keep your front knee aligned with your ankle.');
          quality = FORM_QUALITY.NEEDS_IMPROVEMENT;
        }
      }
    }

    if (feedbackList.length === 0) {
      feedbackList.push(
        this.phase === 'bottom' ? 'Good depth! Drive back up.' :
        this.phase === 'standing' ? 'Well done — step forward again!' :
        'Good movement control!'
      );
    }

    this.formQuality = quality;
    this.feedback = feedbackList.slice(0, 2);
    return this.getState();
  }
}

// ─── Exercise Registry ────────────────────────────────────────────────────────
export const EXERCISES = [
  {
    id: 'squats',
    name: 'Squats',
    cameraGuidance: 'Stand 2–3m away. Camera at hip height, side or slight front angle.',
    keyLandmarks: [LM.LEFT_HIP, LM.LEFT_KNEE, LM.LEFT_ANKLE, LM.RIGHT_HIP, LM.RIGHT_KNEE, LM.RIGHT_ANKLE],
    phases: ['standing', 'descending', 'bottom', 'ascending'],
    Analyzer: SquatAnalyzer,
  },
  {
    id: 'pushups',
    name: 'Push-ups',
    cameraGuidance: 'Place camera at floor level, 1–2m away from your side.',
    keyLandmarks: [LM.LEFT_SHOULDER, LM.LEFT_ELBOW, LM.LEFT_WRIST, LM.LEFT_HIP, LM.LEFT_ANKLE],
    phases: ['up', 'descending', 'bottom', 'ascending'],
    Analyzer: PushupAnalyzer,
  },
  {
    id: 'bicep_curls',
    name: 'Bicep Curls',
    cameraGuidance: 'Stand facing the camera, 1.5–2m away. Keep elbows visible.',
    keyLandmarks: [LM.LEFT_SHOULDER, LM.LEFT_ELBOW, LM.LEFT_WRIST, LM.RIGHT_SHOULDER, LM.RIGHT_ELBOW, LM.RIGHT_WRIST],
    phases: ['extended', 'flexing', 'curled', 'extending'],
    Analyzer: BicepCurlAnalyzer,
  },
  {
    id: 'jumping_jacks',
    name: 'Jumping Jacks',
    cameraGuidance: 'Face the camera, 2–3m away. Ensure full body is visible.',
    keyLandmarks: [LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER, LM.LEFT_WRIST, LM.RIGHT_WRIST, LM.LEFT_ANKLE, LM.RIGHT_ANKLE],
    phases: ['closed', 'opening', 'open', 'closing'],
    Analyzer: JumpingJacksAnalyzer,
  },
  {
    id: 'lunges',
    name: 'Lunges',
    cameraGuidance: 'Stand sideways to camera, 2–3m away. Keep both legs in frame.',
    keyLandmarks: [LM.LEFT_HIP, LM.LEFT_KNEE, LM.LEFT_ANKLE, LM.RIGHT_HIP, LM.RIGHT_KNEE, LM.RIGHT_ANKLE],
    phases: ['standing', 'descending', 'bottom', 'ascending'],
    Analyzer: LungeAnalyzer,
  },
];

export const getExerciseById = (id) => EXERCISES.find((e) => e.id === id);

/**
 * Create a new analyzer instance for the given exercise ID.
 */
export const createAnalyzer = (exerciseId) => {
  const exercise = getExerciseById(exerciseId);
  if (!exercise) throw new Error(`Unknown exercise: ${exerciseId}`);
  return new exercise.Analyzer();
};
