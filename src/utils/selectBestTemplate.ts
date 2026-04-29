import type { ShareTemplate } from '../components/share/shareTypes';

interface TemplateSelectionInput {
  hasPR: boolean;
  intensity: 'low' | 'medium' | 'high';
  volume: number;
  muscleGroup: string;
}

export function selectBestTemplate(sessionData: TemplateSelectionInput): ShareTemplate {
  if (sessionData.hasPR) return 'overlay';
  if (sessionData.intensity === 'high') return 'session';
  return 'pr';
}
