import { create } from 'zustand';
import * as templatesApi from '../api/templates';
import type { WorkoutTemplate, PopulatedWorkoutTemplate, TemplatePayload } from '../types/api';

interface Pagination {
  total: number;
  page: number;
  pages: number;
  limit: number;
}

interface TemplateState {
  userTemplates: WorkoutTemplate[];
  systemTemplates: WorkoutTemplate[];
  selectedTemplate: PopulatedWorkoutTemplate | null;
  userPagination: Pagination | null;
  systemPagination: Pagination | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
}

interface TemplateActions {
  fetchUserTemplates: (page?: number, reset?: boolean) => Promise<void>;
  fetchSystemTemplates: (page?: number, reset?: boolean) => Promise<void>;
  fetchTemplateById: (id: string) => Promise<void>;
  createTemplate: (payload: TemplatePayload) => Promise<WorkoutTemplate | null>;
  updateTemplate: (id: string, payload: TemplatePayload) => Promise<WorkoutTemplate | null>;
  deleteTemplate: (id: string) => Promise<void>;
  clearSelectedTemplate: () => void;
  clearError: () => void;
  reset: () => void;
}

export const useTemplateStore = create<TemplateState & TemplateActions>((set, get) => ({
  userTemplates: [],
  systemTemplates: [],
  selectedTemplate: null,
  userPagination: null,
  systemPagination: null,
  isLoading: false,
  isSaving: false,
  error: null,

  fetchUserTemplates: async (page = 1, reset = false) => {
    set({ isLoading: true, error: null });
    try {
      const result = await templatesApi.getTemplates({ type: 'user', page, limit: 20 });
      set(state => ({
        userTemplates: reset ? result.templates : [...state.userTemplates, ...result.templates],
        userPagination: result.pagination,
        isLoading: false,
      }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch templates';
      set({ isLoading: false, error: msg });
    }
  },

  fetchSystemTemplates: async (page = 1, reset = false) => {
    set({ isLoading: true, error: null });
    try {
      const result = await templatesApi.getTemplates({ type: 'system', page, limit: 20 });
      set(state => ({
        systemTemplates: reset ? result.templates : [...state.systemTemplates, ...result.templates],
        systemPagination: result.pagination,
        isLoading: false,
      }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch templates';
      set({ isLoading: false, error: msg });
    }
  },

  fetchTemplateById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const template = await templatesApi.getTemplateById(id);
      set({ selectedTemplate: template, isLoading: false });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch template';
      set({ isLoading: false, error: msg });
    }
  },

  createTemplate: async (payload) => {
    set({ isSaving: true, error: null });
    try {
      const template = await templatesApi.createTemplate(payload);
      set(state => ({
        userTemplates: [template, ...state.userTemplates],
        isSaving: false,
      }));
      return template;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create template';
      set({ isSaving: false, error: msg });
      return null;
    }
  },

  updateTemplate: async (id, payload) => {
    set({ isSaving: true, error: null });
    try {
      const updated = await templatesApi.updateTemplate(id, payload);
      set(state => ({
        userTemplates: state.userTemplates.map(t => (t._id === id ? updated : t)),
        // Invalidate selected template so it is re-fetched next visit
        selectedTemplate: state.selectedTemplate?._id === id ? null : state.selectedTemplate,
        isSaving: false,
      }));
      return updated;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update template';
      set({ isSaving: false, error: msg });
      return null;
    }
  },

  deleteTemplate: async (id) => {
    set({ isSaving: true, error: null });
    try {
      await templatesApi.deleteTemplate(id);
      set(state => ({
        userTemplates: state.userTemplates.filter(t => t._id !== id),
        isSaving: false,
      }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete template';
      set({ isSaving: false, error: msg });
    }
  },

  clearSelectedTemplate: () => set({ selectedTemplate: null }),
  clearError: () => set({ error: null }),
  reset: () => set({ userTemplates: [], systemTemplates: [], selectedTemplate: null, userPagination: null, systemPagination: null, isLoading: false, isSaving: false, error: null }),
}));
