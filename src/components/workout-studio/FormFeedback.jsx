import { FORM_QUALITY } from '../../lib/exerciseAnalysis';
import { CheckCircle, AlertTriangle, Eye } from 'lucide-react';

const FORM_CONFIG = {
  [FORM_QUALITY.GOOD]: {
    icon: CheckCircle,
    bg: 'rgba(16,185,129,0.1)',
    border: 'rgba(16,185,129,0.3)',
    textColor: '#10b981',
  },
  [FORM_QUALITY.NEEDS_IMPROVEMENT]: {
    icon: AlertTriangle,
    bg: 'rgba(245,158,11,0.1)',
    border: 'rgba(245,158,11,0.3)',
    textColor: '#f59e0b',
  },
  [FORM_QUALITY.UNABLE]: {
    icon: Eye,
    bg: 'rgba(139,92,246,0.1)',
    border: 'rgba(139,92,246,0.3)',
    textColor: '#8b5cf6',
  },
};

export const FormFeedback = ({ feedback, formQuality, confidence }) => {
  const config = FORM_CONFIG[formQuality] || FORM_CONFIG[FORM_QUALITY.UNABLE];
  const Icon = config.icon;

  return (
    <div className="rounded-xl p-4" style={{ background: config.bg, border: `1px solid ${config.border}` }}>
      <div className="flex items-start gap-3">
        <Icon size={18} className="shrink-0 mt-0.5" style={{ color: config.textColor }} />
        <div className="flex-1">
          <p className="text-sm font-semibold mb-1" style={{ color: config.textColor }}>{formQuality}</p>
          {feedback && feedback.length > 0 ? (
            <ul className="space-y-1">
              {feedback.slice(0, 2).map((msg, i) => (
                <li key={i} className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  {msg}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Analyzing your movement…</p>
          )}
          {confidence < 0.4 && formQuality !== FORM_QUALITY.UNABLE && (
            <p className="text-xs mt-2" style={{ color: 'var(--color-text-subtle)' }}>
              ⚠ Low landmark confidence — results may be unreliable. Check camera angle and lighting.
            </p>
          )}
        </div>
      </div>
      <p className="text-xs mt-3 pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)', color: 'var(--color-text-subtle)' }}>
        These are general movement coaching cues, not medical assessments.
        Stop immediately if you experience pain, dizziness, or discomfort.
      </p>
    </div>
  );
};
