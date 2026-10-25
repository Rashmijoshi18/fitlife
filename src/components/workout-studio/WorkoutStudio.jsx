import { useState, useRef, useEffect, useCallback } from 'react';
import { ExerciseSelector } from './ExerciseSelector';
import { WorkoutControls } from './WorkoutControls';
import { RepCounter } from './RepCounter';
import { FormFeedback } from './FormFeedback';
import { WorkoutSummaryModal } from './WorkoutSummaryModal';
import { createAnalyzer, EXERCISES, FORM_QUALITY } from '../../lib/exerciseAnalysis';
import { estimateCalories } from '../../lib/calorieEstimator';
import { drawPose, overallConfidence, LM } from '../../lib/poseUtils';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { AlertTriangle, Shield, Camera } from 'lucide-react';

const MEDIAPIPE_WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.1/wasm';
const MEDIAPIPE_WASM_FALLBACK = 'https://unpkg.com/@mediapipe/tasks-vision@1.1.1/wasm';
const POSE_MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';

// Session states
const SESSION = {
  IDLE: 'idle',
  SELECTING: 'selecting',
  LOADING: 'loading',
  CALIBRATING: 'calibrating',
  ACTIVE: 'active',
  PAUSED: 'paused',
  ENDED: 'ended',
};

export const WorkoutStudio = () => {
  const { user } = useAuth();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const animFrameRef = useRef(null);
  const analyzerRef = useRef(null);
  const activeSecondsRef = useRef(0);
  const lastTickRef = useRef(null);
  const timerIntervalRef = useRef(null);

  const [session, setSession] = useState(SESSION.IDLE);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [modelError, setModelError] = useState(null);
  const [poseState, setPoseState] = useState({ repCount: 0, phase: 'waiting', formQuality: FORM_QUALITY.UNABLE, feedback: [] });
  const [calories, setCalories] = useState(0);
  const [activeSeconds, setActiveSeconds] = useState(0);
  const [confidence, setConfidence] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [privacyAcknowledged, setPrivacyAcknowledged] = useState(
    () => sessionStorage.getItem('fitlife_camera_privacy_ack') === '1'
  );

  const prevRepCountRef = useRef(0);

  // Play audio chime when rep is counted
  const playRepChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08); // A5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.28);
    } catch {}
  }, []);

  useEffect(() => {
    if (poseState.repCount > prevRepCountRef.current && session === SESSION.ACTIVE) {
      playRepChime();
    }
    prevRepCountRef.current = poseState.repCount;
  }, [poseState.repCount, session, playRepChime]);

  // Cleanup everything on unmount
  useEffect(() => {
    return () => {
      stopEverything();
    };
  }, []);

  const stopEverything = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (detectorRef.current) {
      try { detectorRef.current.close(); } catch {}
      detectorRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    lastTickRef.current = null;
  }, []);

  const startTimer = useCallback(() => {
    lastTickRef.current = Date.now();
    timerIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const delta = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;
      activeSecondsRef.current += delta;
      setActiveSeconds(Math.floor(activeSecondsRef.current));
    }, 1000);
  }, []);

  const pauseTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    lastTickRef.current = null;
  }, []);

  const startDetectionLoop = useCallback(() => {
    const detect = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const detector = detectorRef.current;

      if (!video || !canvas || !detector || video.paused || video.ended || video.readyState < 2) {
        animFrameRef.current = requestAnimationFrame(detect);
        return;
      }

      const ctx = canvas.getContext('2d');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      // Draw mirrored video
      ctx.save();
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.restore();

      // Run pose detection
      const timestamp = performance.now();
      let result;
      try {
        result = detector.detectForVideo(video, timestamp);
      } catch {
        animFrameRef.current = requestAnimationFrame(detect);
        return;
      }

      if (result?.landmarks?.[0]) {
        const landmarks = result.landmarks[0];

        // Mirror X coordinates for front-facing camera
        const mirroredLandmarks = landmarks.map((lm) => ({ ...lm, x: 1 - lm.x }));

        // Compute overall confidence
        const keyLMs = analyzerRef.current ? [LM.LEFT_HIP, LM.LEFT_KNEE, LM.LEFT_SHOULDER] : [];
        const conf = overallConfidence(mirroredLandmarks, keyLMs);
        setConfidence(conf);

        // Analyze pose for current exercise
        if (analyzerRef.current) {
          const state = analyzerRef.current.analyze(mirroredLandmarks);
          setPoseState({ ...state });

          // Update calorie estimate
          const cal = estimateCalories({
            exerciseId: selectedExercise?.id,
            activeDurationSeconds: activeSecondsRef.current,
            bodyWeightKg: user?.weight || 70,
            fitnessLevel: user?.fitnessLevel || 'beginner',
          });
          setCalories(cal.estimatedCalories);
        }

        // Draw skeleton
        const qualityColor =
          analyzerRef.current?.formQuality === FORM_QUALITY.GOOD ? 'rgba(16, 185, 129, 0.85)' :
          analyzerRef.current?.formQuality === FORM_QUALITY.NEEDS_IMPROVEMENT ? 'rgba(245, 158, 11, 0.85)' :
          'rgba(139, 92, 246, 0.6)';

        drawPose(ctx, mirroredLandmarks, canvas.width, canvas.height, { qualityColor });
      } else {
        setConfidence(0);
        setPoseState((prev) => ({
          ...prev,
          formQuality: FORM_QUALITY.UNABLE,
          feedback: ['No pose detected. Ensure your full body is in frame.'],
        }));
      }

      animFrameRef.current = requestAnimationFrame(detect);
    };

    animFrameRef.current = requestAnimationFrame(detect);
  }, [selectedExercise, user]);

  // Request camera and start detection
  const startWorkout = useCallback(async (exercise) => {
    setSelectedExercise(exercise);
    setSession(SESSION.LOADING);
    setCameraError(null);
    setModelError(null);
    activeSecondsRef.current = 0;
    setActiveSeconds(0);
    setCalories(0);
    analyzerRef.current = createAnalyzer(exercise.id);

    // 1. Request camera
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: false,
      });
    } catch (err) {
      let msg = 'Camera permission denied. Please allow camera access and try again.';
      if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No camera found. Please connect a webcam and try again.';
      } else if (err.name === 'NotReadableError') {
        msg = 'Camera is in use by another application. Please close it and try again.';
      }
      setCameraError(msg);
      setSession(SESSION.IDLE);
      return;
    }

    streamRef.current = stream;

    // Safe attachment to video element (wait for DOM if needed)
    let video = videoRef.current;
    if (!video) {
      await new Promise((r) => setTimeout(r, 60));
      video = videoRef.current;
    }

    if (video) {
      video.srcObject = stream;
      await new Promise((resolve) => {
        video.onloadedmetadata = () => resolve();
        setTimeout(resolve, 1200);
      });
      try {
        await video.play();
      } catch (playErr) {
        console.warn('Video play warning:', playErr);
      }
    }

    // 2. Load MediaPipe model
    try {
      const { PoseLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');
      let vision;
      try {
        vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_URL);
      } catch (e1) {
        console.warn('[MediaPipe] jsdelivr failed, trying unpkg fallback...', e1);
        vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_FALLBACK);
      }

      try {
        detectorRef.current = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: POSE_MODEL_URL, delegate: 'GPU' },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
      } catch (gpuErr) {
        console.warn('[MediaPipe GPU load failed, falling back to CPU]', gpuErr);
        detectorRef.current = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: POSE_MODEL_URL, delegate: 'CPU' },
          runningMode: 'VIDEO',
          numPoses: 1,
        });
      }
    } catch (err) {
      console.error('[MediaPipe model loading failed]', err);
      setModelError('Failed to load pose detection model. Please check your internet connection and try again.');
      stream.getTracks().forEach((t) => t.stop());
      setSession(SESSION.IDLE);
      return;
    }

    setSession(SESSION.CALIBRATING);
    setTimeout(() => {
      setSession(SESSION.ACTIVE);
      startDetectionLoop();
      startTimer();
    }, 2000); // 2s calibration window
  }, [startDetectionLoop, startTimer]);

  const handlePause = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    pauseTimer();
    setSession(SESSION.PAUSED);
  }, [pauseTimer]);

  const handleResume = useCallback(() => {
    setSession(SESSION.ACTIVE);
    startDetectionLoop();
    startTimer();
  }, [startDetectionLoop, startTimer]);

  const handleEnd = useCallback(async () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    pauseTimer();

    const finalSeconds = activeSecondsRef.current;
    const finalCal = estimateCalories({
      exerciseId: selectedExercise?.id,
      activeDurationSeconds: finalSeconds,
      bodyWeightKg: user?.weight || 70,
      fitnessLevel: user?.fitnessLevel || 'beginner',
    });

    const summary = {
      exerciseName: selectedExercise?.name || 'Workout',
      exerciseId: selectedExercise?.id,
      totalReps: analyzerRef.current?.repCount || 0,
      activeDurationSeconds: Math.floor(finalSeconds),
      activeDurationMinutes: Math.round(finalSeconds / 60),
      estimatedCalories: finalCal.estimatedCalories,
      formQuality: analyzerRef.current?.formQuality || FORM_QUALITY.UNABLE,
    };

    setSummaryData(summary);

    // Save to MongoDB workout history
    if (Math.floor(finalSeconds) >= 60) {
      try {
        await api.post('/workouts', {
          title: `AI Studio: ${selectedExercise?.name}`,
          duration: Math.max(1, Math.round(finalSeconds / 60)),
          caloriesBurned: finalCal.estimatedCalories,
          type: 'other',
          exercises: [{
            exerciseName: selectedExercise?.name,
            sets: [{
              setNumber: 1,
              reps: analyzerRef.current?.repCount || 0,
              duration: Math.floor(finalSeconds),
            }],
          }],
          notes: `AI-tracked session. Estimated ${finalCal.estimatedCalories} kcal burned.`,
          isCompleted: true,
        });
        toast.success('Workout saved to your history!');
      } catch (err) {
        console.warn('[WorkoutStudio] Could not save workout:', err.message);
      }
    }

    stopEverything();
    setSession(SESSION.ENDED);
    setShowSummary(true);
  }, [selectedExercise, user, pauseTimer, stopEverything]);

  const handleRestart = useCallback(() => {
    stopEverything();
    setSession(SESSION.IDLE);
    setPoseState({ repCount: 0, phase: 'waiting', formQuality: FORM_QUALITY.UNABLE, feedback: [] });
    setCalories(0);
    setActiveSeconds(0);
    setConfidence(0);
    setSelectedExercise(null);
    setShowSummary(false);
    setSummaryData(null);
  }, [stopEverything]);

  const acknowledgePrivacy = () => {
    sessionStorage.setItem('fitlife_camera_privacy_ack', '1');
    setPrivacyAcknowledged(true);
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  // Privacy notice
  if (!privacyAcknowledged) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="card max-w-md w-full text-center" style={{ padding: '2rem' }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'var(--color-accent-dim)' }}>
            <Shield size={28} style={{ color: 'var(--color-accent)' }} />
          </div>
          <h2 className="text-xl font-bold mb-3">Camera & Privacy Notice</h2>
          <div className="text-sm space-y-3 text-left mb-6" style={{ color: 'var(--color-text-muted)' }}>
            <p>🎥 <strong className="text-white">Webcam use:</strong> This feature uses your device's camera to detect body landmarks in real time. No video is recorded, stored, or sent to any server.</p>
            <p>🧠 <strong className="text-white">On-device AI:</strong> All pose analysis happens locally in your browser using MediaPipe. Camera frames are never transmitted externally.</p>
            <p>📊 <strong className="text-white">Data saved:</strong> Only your rep count, duration, and estimated calories are saved to your FitLife account after you end a workout.</p>
            <p>⚕️ <strong className="text-white">Health disclaimer:</strong> This app provides general fitness guidance, not medical advice. Stop immediately if you feel pain or discomfort.</p>
          </div>
          <button className="btn btn-primary w-full" onClick={acknowledgePrivacy}>
            <Camera size={16} /> I Understand — Let's Start
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Errors */}
      {cameraError && (
        <div className="flex items-start gap-3 p-4 rounded-xl mb-4"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Camera Error</p>
            <p className="text-sm opacity-90">{cameraError}</p>
          </div>
        </div>
      )}
      {modelError && (
        <div className="flex items-start gap-3 p-4 rounded-xl mb-4"
          style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b' }}>
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Model Loading Error</p>
            <p className="text-sm opacity-90">{modelError}</p>
          </div>
        </div>
      )}

      {/* Exercise Selection */}
      {session === SESSION.IDLE && (
        <ExerciseSelector exercises={EXERCISES} onSelect={(ex) => startWorkout(ex)} />
      )}

      {/* Camera + Detection View (mounted whenever session is not IDLE) */}
      {[SESSION.LOADING, SESSION.CALIBRATING, SESSION.ACTIVE, SESSION.PAUSED].includes(session) && (
        <div className="space-y-4">
          {/* Calibrating overlay */}
          {session === SESSION.CALIBRATING && (
            <div className="card text-center" style={{ background: 'rgba(16,185,129,0.08)', borderColor: 'var(--color-accent)' }}>
              <p className="font-bold text-emerald-400 mb-1">📐 Camera Calibration</p>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                {selectedExercise?.cameraGuidance}
              </p>
              <p className="text-xs mt-2" style={{ color: 'var(--color-text-subtle)' }}>
                Starting in 2 seconds…
              </p>
            </div>
          )}

          {/* Camera + Overlay */}
          <div className="relative rounded-xl overflow-hidden" style={{ background: '#000', aspectRatio: '16/9' }}>
            <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" muted playsInline />
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover" />

            {/* Loading state overlay inside camera box */}
            {session === SESSION.LOADING && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gray-950/90 z-20">
                <div className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin"
                  style={{ borderColor: 'var(--color-accent)' }} />
                <p className="font-semibold text-white">
                  Loading camera & pose detection model…
                </p>
                <p className="text-sm" style={{ color: 'var(--color-text-subtle)' }}>
                  This may take 10–20 seconds on first load
                </p>
              </div>
            )}

            {/* Paused overlay */}
            {session === SESSION.PAUSED && (
              <div className="absolute inset-0 flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.6)' }}>
                <div className="text-center">
                  <p className="text-4xl mb-2">⏸</p>
                  <p className="text-xl font-bold">Paused</p>
                  <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
                    Stop immediately if you feel any pain or discomfort.
                  </p>
                </div>
              </div>
            )}

            {/* Confidence indicator */}
            {session === SESSION.ACTIVE && (
              <div className="absolute top-3 left-3">
                <div className="px-2 py-1 rounded-lg text-xs font-semibold"
                  style={{
                    background: confidence > 0.6 ? 'rgba(16,185,129,0.8)' : 'rgba(245,158,11,0.8)',
                    color: '#000',
                  }}>
                  {confidence > 0.6 ? '✓ Tracking' : '⚠ Partial'}
                </div>
              </div>
            )}
          </div>

          {/* Live stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <RepCounter repCount={poseState.repCount} phase={poseState.phase} exerciseName={selectedExercise?.name} />
            <div className="card text-center" style={{ padding: '1rem' }}>
              <p className="text-2xl font-black">
                {Math.floor(activeSeconds / 60)}:{String(activeSeconds % 60).padStart(2, '0')}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>Active Time</p>
            </div>
            <div className="card text-center" style={{ padding: '1rem' }}>
              <p className="text-2xl font-black" style={{ color: '#f59e0b' }}>{calories}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>kcal (est.)</p>
            </div>
            <div className="card text-center" style={{ padding: '1rem' }}>
              <p className="text-sm font-bold capitalize" style={{
                color: poseState.formQuality === FORM_QUALITY.GOOD ? '#10b981' :
                  poseState.formQuality === FORM_QUALITY.NEEDS_IMPROVEMENT ? '#f59e0b' : '#8b5cf6'
              }}>
                {poseState.formQuality}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>Form Status</p>
            </div>
          </div>

          {/* Form feedback */}
          <FormFeedback feedback={poseState.feedback} formQuality={poseState.formQuality} confidence={confidence} />

          {/* Controls */}
          <WorkoutControls
            session={session}
            onPause={handlePause}
            onResume={handleResume}
            onEnd={handleEnd}
            onRestart={handleRestart}
          />
        </div>
      )}

      {/* Summary Modal */}
      {showSummary && summaryData && (
        <WorkoutSummaryModal
          data={summaryData}
          exercise={selectedExercise}
          onClose={handleRestart}
          user={user}
        />
      )}
    </div>
  );
};
