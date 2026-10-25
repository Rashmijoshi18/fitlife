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

  getSmoother(key, alpha = 0.45) {
    if (!this.smoothers[key]) this.smoothers[key] = createSmoother(alpha);
    return this.smoothers[key];
  }

  smooth(key, value, alpha = 0.45) {
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

  static STANDING_ANGLE = 150;   // degrees — fully standing
  static BOTTOM_ANGLE = 115;     // degrees — parallel or deep squat
  static DESCENT_TRIGGER = 140;  // start descent when knee drops below this
  static ASCENT_TRIGGER = 125;   // leave bottom when above this

  analyze(landmarks) {
    const leftHip = getLandmark(landmarks, LM.LEFT_HIP, 0.35);
    const leftKnee = getLandmark(landmarks, LM.LEFT_KNEE, 0.35);
    const leftAnkle = getLandmark(landmarks, LM.LEFT_ANKLE, 0.35);

    const rightHip = getLandmark(landmarks, LM.RIGHT_HIP, 0.35);
    const rightKnee = getLandmark(landmarks, LM.RIGHT_KNEE, 0.35);
    const rightAnkle = getLandmark(landmarks, LM.RIGHT_ANKLE, 0.35);

    const leftLegVis = !!(leftHip && leftKnee && leftAnkle);
    const rightLegVis = !!(rightHip && rightKnee && rightAnkle);

    if (!leftLegVis && !rightLegVis) {
      this.formQuality = FORM_QUALITY.UNABLE;
      this.feedback = ['Position yourself so your legs and hips are visible in the camera.'];
      return this.getState();
    }

    const aL = leftLegVis ? computeAngle(leftHip, leftKnee, leftAnkle) : null;
    const aR = rightLegVis ? computeAngle(rightHip, rightKnee, rightAnkle) : null;

    let rawKneeAngle = null;
    if (aL !== null && aR !== null) {
      rawKneeAngle = Math.min(aL, aR);
    } else {
      rawKneeAngle = aL ?? aR;
    }

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
      if (leftKnee && leftAnkle && rightKnee && rightAnkle) {
        const leftKneeDrift = Math.abs(leftKnee.x - leftAnkle.x);
        const rightKneeDrift = Math.abs(rightKnee.x - rightAnkle.x);
        if (leftKneeDrift > 0.10 || rightKneeDrift > 0.10) {
          feedbackList.push('Keep your knees aligned with your feet.');
          quality = FORM_QUALITY.NEEDS_IMPROVEMENT;
        }
      }

      // Upright torso
      if (hipAngle !== null && hipAngle < 50) {
        feedbackList.push('Try to keep a more upright chest.');
        quality = FORM_QUALITY.NEEDS_IMPROVEMENT;
      }
    }

    if (feedbackList.length === 0 && this.phase !== 'waiting') {
      feedbackList.push(
        this.phase === 'standing' ? 'Good posture — ready for next squat!' :
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
 * FSM: up (elbow > 145°) → descending → bottom (elbow <= 95°) → ascending → up
 */
class PushupAnalyzer extends BaseAnalyzer {
  constructor() { super(); this.phase = 'up'; }

  static UP_ANGLE = 145;
  static BOTTOM_ANGLE = 95;
  static DESCENT_TRIGGER = 135;
  static ASCENT_TRIGGER = 110;

  analyze(landmarks) {
    const leftShoulder = getLandmark(landmarks, LM.LEFT_SHOULDER, 0.35);
    const leftElbow = getLandmark(landmarks, LM.LEFT_ELBOW, 0.35);
    const leftWrist = getLandmark(landmarks, LM.LEFT_WRIST, 0.35);

    const rightShoulder = getLandmark(landmarks, LM.RIGHT_SHOULDER, 0.35);
    const rightElbow = getLandmark(landmarks, LM.RIGHT_ELBOW, 0.35);
    const rightWrist = getLandmark(landmarks, LM.RIGHT_WRIST, 0.35);

    const leftArmVis = !!(leftShoulder && leftElbow && leftWrist);
    const rightArmVis = !!(rightShoulder && rightElbow && rightWrist);

    if (!leftArmVis && !rightArmVis) {
      this.formQuality = FORM_QUALITY.UNABLE;
      this.feedback = ['Position your body sideways to the camera for push-up tracking.'];
      return this.getState();
    }

    const aL = leftArmVis ? computeAngle(leftShoulder, leftElbow, leftWrist) : null;
    const aR = rightArmVis ? computeAngle(rightShoulder, rightElbow, rightWrist) : null;

    let rawElbowAngle = null;
    if (aL !== null && aR !== null) {
      rawElbowAngle = Math.min(aL, aR);
    } else {
      rawElbowAngle = aL ?? aR;
    }

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

    const shoulder = leftShoulder || rightShoulder;
    const hip = getLandmark(landmarks, LM.LEFT_HIP, 0.35) || getLandmark(landmarks, LM.RIGHT_HIP, 0.35);
    const ankle = getLandmark(landmarks, LM.LEFT_ANKLE, 0.35) || getLandmark(landmarks, LM.RIGHT_ANKLE, 0.35);

    if (shoulder && hip && ankle) {
      const expectedHipY = shoulder.y + (ankle.y - shoulder.y) * 0.5;
      const hipDeviation = Math.abs(hip.y - expectedHipY);
      if (hipDeviation > 0.10) {
        feedbackList.push('Maintain a straight body line — avoid sagging hips.');
        quality = FORM_QUALITY.NEEDS_IMPROVEMENT;
      }
    }

    if (feedbackList.length === 0 && this.phase !== 'waiting') {
      feedbackList.push(
        this.phase === 'up' ? 'Arms extended — ready for next push-up!' :
        this.phase === 'bottom' ? 'Good depth! Now push back up.' :
        'Looking strong!'
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
 * Supports: Single-arm curl (dumbbell/bottle), alternating curls, and two-arm simultaneous curls.
 * FSM: extended (elbow > 135°) → flexing → curled (elbow <= 65°) → extending → extended
 */
class BicepCurlAnalyzer extends BaseAnalyzer {
  constructor() {
    super();
    this.phase = 'extended';
    this.leftPhase = 'extended';
    this.rightPhase = 'extended';
    this.lastRepTimeLeft = 0;
    this.lastRepTimeRight = 0;
  }

  static EXTENDED_ANGLE = 135; // degrees — arms comfortably down
  static CURLED_ANGLE = 65;     // degrees — peak bicep contraction (natural for dumbbells/bottles)
  static FLEX_TRIGGER = 115;    // movement starts
  static EXTEND_TRIGGER = 85;   // leaving peak contraction

  analyze(landmarks) {
    const leftShoulder = getLandmark(landmarks, LM.LEFT_SHOULDER, 0.35);
    const leftElbow = getLandmark(landmarks, LM.LEFT_ELBOW, 0.35);
    const leftWrist = getLandmark(landmarks, LM.LEFT_WRIST, 0.35);

    const rightShoulder = getLandmark(landmarks, LM.RIGHT_SHOULDER, 0.35);
    const rightElbow = getLandmark(landmarks, LM.RIGHT_ELBOW, 0.35);
    const rightWrist = getLandmark(landmarks, LM.RIGHT_WRIST, 0.35);

    const leftArmVisible = !!(leftShoulder && leftElbow && leftWrist);
    const rightArmVisible = !!(rightShoulder && rightElbow && rightWrist);

    if (!leftArmVisible && !rightArmVisible) {
      this.formQuality = FORM_QUALITY.UNABLE;
      this.feedback = ['Keep your curling arm and shoulder in the camera frame.'];
      return this.getState();
    }

    const rawLeftAngle = leftArmVisible ? computeAngle(leftShoulder, leftElbow, leftWrist) : null;
    const rawRightAngle = rightArmVisible ? computeAngle(rightShoulder, rightElbow, rightWrist) : null;

    const leftAngle = rawLeftAngle !== null ? this.smooth('leftElbow', rawLeftAngle) : null;
    const rightAngle = rawRightAngle !== null ? this.smooth('rightElbow', rawRightAngle) : null;

    const now = Date.now();
    let repCountedThisFrame = false;

    // Track Left Arm FSM
    if (leftAngle !== null) {
      if (this.leftPhase === 'extended') {
        if (leftAngle <= BicepCurlAnalyzer.CURLED_ANGLE) {
          this.leftPhase = 'curled';
        } else if (leftAngle < BicepCurlAnalyzer.FLEX_TRIGGER) {
          this.leftPhase = 'flexing';
        }
      } else if (this.leftPhase === 'flexing') {
        if (leftAngle <= BicepCurlAnalyzer.CURLED_ANGLE) {
          this.leftPhase = 'curled';
        } else if (leftAngle >= BicepCurlAnalyzer.EXTENDED_ANGLE) {
          this.leftPhase = 'extended';
        }
      } else if (this.leftPhase === 'curled') {
        if (leftAngle >= BicepCurlAnalyzer.EXTENDED_ANGLE) {
          this.leftPhase = 'extended';
          if (now - this.lastRepTimeLeft > 350) {
            this.repCount++;
            this.lastRepTimeLeft = now;
            this.lastRepTime = now;
            repCountedThisFrame = true;
          }
        } else if (leftAngle > BicepCurlAnalyzer.EXTEND_TRIGGER) {
          this.leftPhase = 'extending';
        }
      } else if (this.leftPhase === 'extending') {
        if (leftAngle <= BicepCurlAnalyzer.CURLED_ANGLE) {
          this.leftPhase = 'curled';
        } else if (leftAngle >= BicepCurlAnalyzer.EXTENDED_ANGLE) {
          this.leftPhase = 'extended';
          if (now - this.lastRepTimeLeft > 350) {
            this.repCount++;
            this.lastRepTimeLeft = now;
            this.lastRepTime = now;
            repCountedThisFrame = true;
          }
        }
      }
    }

    // Track Right Arm FSM
    if (rightAngle !== null) {
      if (this.rightPhase === 'extended') {
        if (rightAngle <= BicepCurlAnalyzer.CURLED_ANGLE) {
          this.rightPhase = 'curled';
        } else if (rightAngle < BicepCurlAnalyzer.FLEX_TRIGGER) {
          this.rightPhase = 'flexing';
        }
      } else if (this.rightPhase === 'flexing') {
        if (rightAngle <= BicepCurlAnalyzer.CURLED_ANGLE) {
          this.rightPhase = 'curled';
        } else if (rightAngle >= BicepCurlAnalyzer.EXTENDED_ANGLE) {
          this.rightPhase = 'extended';
        }
      } else if (this.rightPhase === 'curled') {
        if (rightAngle >= BicepCurlAnalyzer.EXTENDED_ANGLE) {
          this.rightPhase = 'extended';
          if (now - this.lastRepTimeRight > 350 && (!repCountedThisFrame || now - this.lastRepTimeLeft > 250)) {
            this.repCount++;
            this.lastRepTimeRight = now;
            this.lastRepTime = now;
            repCountedThisFrame = true;
          }
        } else if (rightAngle > BicepCurlAnalyzer.EXTEND_TRIGGER) {
          this.rightPhase = 'extending';
        }
      } else if (this.rightPhase === 'extending') {
        if (rightAngle <= BicepCurlAnalyzer.CURLED_ANGLE) {
          this.rightPhase = 'curled';
        } else if (rightAngle >= BicepCurlAnalyzer.EXTENDED_ANGLE) {
          this.rightPhase = 'extended';
          if (now - this.lastRepTimeRight > 350 && (!repCountedThisFrame || now - this.lastRepTimeLeft > 250)) {
            this.repCount++;
            this.lastRepTimeRight = now;
            this.lastRepTime = now;
            repCountedThisFrame = true;
          }
        }
      }
    }

    // Determine current phase for UI: reflect active arm
    const phases = [this.leftPhase, this.rightPhase];
    if (phases.includes('curled')) {
      this.phase = 'curled';
    } else if (phases.includes('flexing')) {
      this.phase = 'flexing';
    } else if (phases.includes('extending')) {
      this.phase = 'extending';
    } else {
      this.phase = 'extended';
    }

    const feedbackList = [];
    let quality = FORM_QUALITY.GOOD;

    // Check stability for the active curling arm(s)
    if (leftArmVisible && (this.leftPhase === 'flexing' || this.leftPhase === 'curled')) {
      const leftElbowFwd = Math.abs(leftElbow.x - leftShoulder.x);
      if (leftElbowFwd > 0.16) {
        feedbackList.push('Keep your elbow tucked near your torso.');
        quality = FORM_QUALITY.NEEDS_IMPROVEMENT;
      }
    }
    if (rightArmVisible && (this.rightPhase === 'flexing' || this.rightPhase === 'curled')) {
      const rightElbowFwd = Math.abs(rightElbow.x - rightShoulder.x);
      if (rightElbowFwd > 0.16) {
        feedbackList.push('Keep your elbow tucked near your torso.');
        quality = FORM_QUALITY.NEEDS_IMPROVEMENT;
      }
    }

    if (feedbackList.length === 0) {
      if (this.phase === 'curled') {
        feedbackList.push('Squeeze at the top! Now lower with control.');
      } else if (this.phase === 'flexing') {
        feedbackList.push('Good contraction — curl up!');
      } else if (this.phase === 'extending') {
        feedbackList.push('Controlled negative — extend fully.');
      } else {
        feedbackList.push('Arm extended — ready to curl!');
      }
    }

    this.formQuality = quality;
    this.feedback = feedbackList.slice(0, 2);
    return this.getState();
  }

  reset() {
    super.reset();
    this.leftPhase = 'extended';
    this.rightPhase = 'extended';
    this.lastRepTimeLeft = 0;
    this.lastRepTimeRight = 0;
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

  static STANDING_ANGLE = 150;
  static BOTTOM_ANGLE = 115;
  static DESCENT_TRIGGER = 140;
  static ASCENT_TRIGGER = 125;

  analyze(landmarks) {
    const leftHip = getLandmark(landmarks, LM.LEFT_HIP, 0.35);
    const leftKnee = getLandmark(landmarks, LM.LEFT_KNEE, 0.35);
    const leftAnkle = getLandmark(landmarks, LM.LEFT_ANKLE, 0.35);

    const rightHip = getLandmark(landmarks, LM.RIGHT_HIP, 0.35);
    const rightKnee = getLandmark(landmarks, LM.RIGHT_KNEE, 0.35);
    const rightAnkle = getLandmark(landmarks, LM.RIGHT_ANKLE, 0.35);

    const leftLegVis = !!(leftHip && leftKnee && leftAnkle);
    const rightLegVis = !!(rightHip && rightKnee && rightAnkle);

    if (!leftLegVis && !rightLegVis) {
      this.formQuality = FORM_QUALITY.UNABLE;
      this.feedback = ['Stand sideways to the camera with your legs visible.'];
      return this.getState();
    }

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
