/**
 * repCounting.test.js
 * Unit tests for exercise rep-counting Finite State Machines (FSM),
 * angle calculation logic, hysteresis thresholds, and debouncing.
 */

// Implementation of the mathematical 3-point angle calculation for verification
function calculateAngle(a, b, c) {
  const radians =
    Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180.0) {
    angle = 360.0 - angle;
  }
  return angle;
}

// FSM Test Harness for Squat
class SquatFSMTest {
  constructor() {
    this.state = 'standing';
    this.repCount = 0;
    this.lastRepTime = 0;
    this.minCooldownMs = 800;
  }

  processAngle(kneeAngle, timestamp = Date.now()) {
    let repCounted = false;
    let feedback = '';

    if (this.state === 'standing') {
      if (kneeAngle < 140) {
        this.state = 'descending';
      }
    } else if (this.state === 'descending') {
      if (kneeAngle <= 95) {
        this.state = 'bottom';
        feedback = 'Great depth!';
      } else if (kneeAngle > 155) {
        // Stood back up without reaching depth
        this.state = 'standing';
        feedback = 'Squat deeper for full rep';
      }
    } else if (this.state === 'bottom') {
      if (kneeAngle > 110) {
        this.state = 'ascending';
      }
    } else if (this.state === 'ascending') {
      if (kneeAngle >= 160) {
        if (timestamp - this.lastRepTime >= this.minCooldownMs) {
          this.repCount++;
          repCounted = true;
          this.lastRepTime = timestamp;
          feedback = 'Rep counted!';
        }
        this.state = 'standing';
      }
    }

    return { state: this.state, repCount: this.repCount, repCounted, feedback };
  }
}

// FSM Test Harness for Pushup
class PushupFSMTest {
  constructor() {
    this.state = 'up';
    this.repCount = 0;
    this.lastRepTime = 0;
    this.minCooldownMs = 800;
  }

  processAngle(elbowAngle, timestamp = Date.now()) {
    let repCounted = false;

    if (this.state === 'up') {
      if (elbowAngle < 145) {
        this.state = 'descending';
      }
    } else if (this.state === 'descending') {
      if (elbowAngle <= 90) {
        this.state = 'bottom';
      } else if (elbowAngle > 160) {
        this.state = 'up';
      }
    } else if (this.state === 'bottom') {
      if (elbowAngle > 115) {
        this.state = 'ascending';
      }
    } else if (this.state === 'ascending') {
      if (elbowAngle >= 160) {
        if (timestamp - this.lastRepTime >= this.minCooldownMs) {
          this.repCount++;
          repCounted = true;
          this.lastRepTime = timestamp;
        }
        this.state = 'up';
      }
    }

    return { state: this.state, repCount: this.repCount, repCounted };
  }
}

describe('Angle Calculation Biomechanics', () => {
  it('should calculate 90 degrees for perpendicular vectors', () => {
    const a = { x: 0, y: 1 };
    const b = { x: 0, y: 0 };
    const c = { x: 1, y: 0 };
    const angle = calculateAngle(a, b, c);
    expect(Math.round(angle)).toBe(90);
  });

  it('should calculate 180 degrees for straight line (full extension)', () => {
    const a = { x: 0, y: -1 };
    const b = { x: 0, y: 0 };
    const c = { x: 0, y: 1 };
    const angle = calculateAngle(a, b, c);
    expect(Math.round(angle)).toBe(180);
  });

  it('should calculate 45 degrees correctly', () => {
    const a = { x: 1, y: 1 };
    const b = { x: 0, y: 0 };
    const c = { x: 1, y: 0 };
    const angle = calculateAngle(a, b, c);
    expect(Math.round(angle)).toBe(45);
  });
});

describe('Squat FSM Rep Counting', () => {
  let fsm;

  beforeEach(() => {
    fsm = new SquatFSMTest();
  });

  it('should start in standing state with 0 reps', () => {
    expect(fsm.state).toBe('standing');
    expect(fsm.repCount).toBe(0);
  });

  it('should transition from standing -> descending -> bottom -> ascending -> standing and count 1 rep', () => {
    let t = 1000;
    // 1. Standing (170°)
    fsm.processAngle(170, t);
    expect(fsm.state).toBe('standing');

    // 2. Descending (130°)
    fsm.processAngle(130, t += 200);
    expect(fsm.state).toBe('descending');

    // 3. Bottom depth reached (85°)
    fsm.processAngle(85, t += 200);
    expect(fsm.state).toBe('bottom');

    // 4. Ascending (120°)
    fsm.processAngle(120, t += 200);
    expect(fsm.state).toBe('ascending');

    // 5. Full standing lockout (165°)
    const res = fsm.processAngle(165, t += 300);
    expect(res.state).toBe('standing');
    expect(res.repCount).toBe(1);
    expect(res.repCounted).toBe(true);
  });

  it('should NOT count a rep if depth was not reached (shallow squat)', () => {
    let t = 1000;
    fsm.processAngle(170, t);
    fsm.processAngle(135, t += 200); // starts descending
    expect(fsm.state).toBe('descending');

    // Stops at 110 degrees (shallow) and goes back up
    fsm.processAngle(160, t += 200);
    expect(fsm.state).toBe('standing');
    expect(fsm.repCount).toBe(0);
  });

  it('should prevent double counting due to cooldown debounce', () => {
    let t = 1000;
    // Complete full rep 1
    fsm.processAngle(170, t);
    fsm.processAngle(130, t += 100);
    fsm.processAngle(85, t += 100);
    fsm.processAngle(120, t += 100);
    fsm.processAngle(165, t += 100);
    expect(fsm.repCount).toBe(1);

    // Immediate second cycle within cooldown (100ms < 800ms)
    fsm.processAngle(130, t += 50);
    fsm.processAngle(85, t += 50);
    fsm.processAngle(120, t += 50);
    const res = fsm.processAngle(165, t += 50);
    expect(res.repCount).toBe(1); // blocked by cooldown
  });
});

describe('Pushup FSM Rep Counting', () => {
  let fsm;

  beforeEach(() => {
    fsm = new PushupFSMTest();
  });

  it('should complete a full pushup cycle', () => {
    let t = 2000;
    fsm.processAngle(175, t);
    expect(fsm.state).toBe('up');

    fsm.processAngle(140, t += 300);
    expect(fsm.state).toBe('descending');

    fsm.processAngle(85, t += 300); // bottom
    expect(fsm.state).toBe('bottom');

    fsm.processAngle(125, t += 300);
    expect(fsm.state).toBe('ascending');

    const res = fsm.processAngle(165, t += 300);
    expect(res.repCount).toBe(1);
    expect(res.state).toBe('up');
  });
});
