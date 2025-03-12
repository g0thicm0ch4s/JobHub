import { create } from 'zustand';
import { User } from '../types/types';
import { storage } from '../lib/storage';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: storage.getUser(),
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockUser: User = {
        id: crypto.randomUUID(),
        email,
        fullName: email.split('@')[0],
        role: Math.random() > 0.5 ? 'job_seeker' : 'recruiter',
        skills: [],
        experienceYears: 0,
        title: '',
      };

      storage.setUser(mockUser);
      set({ user: mockUser, isLoading: false });
    } catch (error) {
      set({ error: 'Login failed', isLoading: false });
      throw error;
    }
  },

  signup: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockUser: User = {
        id: crypto.randomUUID(),
        email,
        fullName: email.split('@')[0],
        role: 'job_seeker',
        skills: [],
        experienceYears: 0,
        title: '',
      };

      storage.setUser(mockUser);
      set({ user: mockUser, isLoading: false });
    } catch (error) {
      set({ error: 'Signup failed', isLoading: false });
      throw error;
    }
  },

  logout: () => {
    storage.clearUser();
    set({ user: null });
  },
}));