import type { CaptionMode, ShareData, ShareTemplate } from '../components/share/shareTypes';

export function generateCaption(
  type: ShareTemplate,
  data: ShareData,
  mode: CaptionMode = 'minimal',
): string {
  if (type === 'pr') {
    const repsText = data.prNewReps != null ? ` × ${data.prNewReps}` : '';
    switch (mode) {
      case 'minimal':
        return `${data.prNewValue}kg${repsText} 🔓`;
      case 'motivational':
        if (data.prOldValue != null) {
          return `New PR unlocked! ${data.prOldValue}kg → ${data.prNewValue}kg. Progress is showing 🔥`;
        }
        return `New PR unlocked! ${titleCase(data.prExercise)} is moving up fast 🔥`;
      case 'aggressive':
        return `${data.prNewValue}kg${repsText}. Not slowing down.`;
      case 'funny':
        return `Accidentally hit a ${data.prNewValue}kg PR today 😅 oops`;
      default:
        return `${data.prNewValue}kg${repsText} 🔓`;
    }
  }

  if (type === 'session') {
    switch (mode) {
      case 'minimal':
        return `${data.workoutName.toLowerCase()} ✓`;
      case 'motivational':
        return `Consistency wins. Day ${data.streak} 💪`;
      case 'aggressive':
        return `${Math.round(data.volume)}kg moved. Next.`;
      case 'funny':
        return `Destroyed ${data.workoutName.toLowerCase()}, now I can't lift my arms 🫠`;
      default:
        return `${data.workoutName.toLowerCase()} ✓`;
    }
  }

  if (type === 'overlay') {
    switch (mode) {
      case 'minimal':
        return overlayMinimalCaption(data);
      case 'motivational':
        return 'Earned this one 🔥';
      case 'aggressive':
        return 'Built different';
      case 'funny':
        return 'RIP my muscles 💀';
      default:
        return overlayMinimalCaption(data);
    }
  }

  return 'New personal record 🔥';
}

function titleCase(s: string): string {
  return s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

function overlayMinimalCaption(data: ShareData): string {
  const repsText = data.prNewReps != null ? ` × ${data.prNewReps}` : '';
  return `${data.prNewValue}kg${repsText}`;
}
