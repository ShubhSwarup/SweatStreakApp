import client from './client';
import type { WorkoutTemplate, PopulatedWorkoutTemplate, TemplatePayload } from '../types/api';

interface TemplatesResponse {
  success: boolean;
  data: WorkoutTemplate[];
  pagination: { total: number; page: number; pages: number; limit: number };
}

export async function getTemplates(params?: {
  type?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const { data } = await client.get('/api/templates', { params });
  const body = data as TemplatesResponse;
  return { templates: body.data, pagination: body.pagination };
}

export async function getTemplateById(id: string): Promise<PopulatedWorkoutTemplate> {
  const { data } = await client.get(`/api/templates/${id}`);
  return (data as { success: boolean; data: PopulatedWorkoutTemplate }).data;
}

export async function createTemplate(payload: TemplatePayload): Promise<WorkoutTemplate> {
  const { data } = await client.post('/api/templates', payload);
  return (data as { success: boolean; data: WorkoutTemplate }).data;
}

export async function updateTemplate(id: string, payload: TemplatePayload): Promise<WorkoutTemplate> {
  const { data } = await client.put(`/api/templates/${id}`, payload);
  return (data as { success: boolean; data: WorkoutTemplate }).data;
}

export async function deleteTemplate(id: string): Promise<void> {
  await client.delete(`/api/templates/${id}`);
}
