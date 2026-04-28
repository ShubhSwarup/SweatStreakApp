import type { ShareTemplate, ShareData } from '../components/share/SharePreviewScreen';

export function generateCaption(type: ShareTemplate, data: ShareData): string {
  switch (type) {
    case 'pr': {
      const exercise = titleCase(data.prExercise);
      const improvement = data.prOldValue != null
        ? ` (+${+(data.prNewValue - data.prOldValue).toFixed(1)}kg)`
        : '';
      if (data.prNewReps != null) {
        return `PR unlocked 🔓 ${data.prNewValue}kg × ${data.prNewReps} on ${exercise}${improvement}`;
      }
      return `New ${data.prType === '1rm' ? '1RM ' : ''}PR 🔓 ${data.prNewValue}kg on ${exercise}${improvement}`;
    }

    case 'session': {
      const name = data.workoutName;
      return `${name} destroyed 💪 ${formatVolume(data.volume)} total volume`;
    }

    case 'overlay': {
      const repsStr = data.prNewReps != null ? ` × ${data.prNewReps}` : '';
      return `${data.prNewValue}kg${repsStr} 🔥`;
    }

    default:
      return 'New personal record 🔥';
  }
}

function titleCase(s: string): string {
  return s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

function formatVolume(v: number): string {
  return v >= 1000 ? `${(v / 1000).toFixed(1)}t` : `${Math.round(v)}kg`;
}
