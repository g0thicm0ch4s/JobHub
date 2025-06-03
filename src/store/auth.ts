import { create } from 'zustand';
import { User } from '../types/types';
import { storage } from '../lib/storage';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (
    email: string, 
    password: string, 
    role: 'job_seeker' | 'recruiter',
    profileData: {
      fullName: string;
      title?: string;
      companyName?: string;
    }
  ) => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: storage.getUser(),
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error('Authentication failed');
      }

      // Fetch user profile from database
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        throw new Error('Failed to fetch user profile');
      }

      const user: User = {
        id: profileData.id,
        email: profileData.email,
        fullName: profileData.full_name,
        role: profileData.role as 'job_seeker' | 'recruiter' | 'admin',
        resumeUrl: profileData.resume_url,
        skills: profileData.skills || [],
        experienceYears: profileData.experience_years || 0,
        title: profileData.title || '',
        company: profileData.company,
      };

      storage.setUser(user);
      set({ user, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  signup: async (email: string, password: string, role: 'job_seeker' | 'recruiter', profileData) => {
    set({ isLoading: true, error: null });
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error('Signup failed');
      }

      // Create user profile with complete data
      const newProfile = {
        id: authData.user.id,
        email,
        full_name: profileData.fullName,
        role,
        skills: [],
        experience_years: 0,
        title: profileData.title || '',
        company: role === 'recruiter' ? profileData.companyName : undefined,
      };

      console.log('Creating profile with data:', newProfile);

      const { error: profileError } = await supabase
        .from('profiles')
        .insert([newProfile]);

      if (profileError) {
        throw new Error(`Failed to create user profile: ${profileError.message}`);
      }

      const user: User = {
        id: newProfile.id,
        email: newProfile.email,
        fullName: newProfile.full_name,
        role: newProfile.role,
        skills: newProfile.skills,
        experienceYears: newProfile.experience_years,
        title: newProfile.title,
        company: newProfile.company,
      };

      storage.setUser(user);
      set({ user, isLoading: false });
    } catch (error) {
      console.error('Signup error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Signup failed';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  updateProfile: async (updates: Partial<User>) => {
    set({ isLoading: true, error: null });
    try {
      const currentUser = get().user;
      if (!currentUser) throw new Error('No user logged in');

      console.log('Updating profile with:', updates);

      const { data, error } = await supabase
        .rpc('update_user_profile', {
          p_full_name: updates.fullName,
          p_title: updates.title,
          p_company: updates.company,
          p_experience_years: updates.experienceYears,
          p_skills: updates.skills,
        });

      if (error) {
        console.error('RPC error:', error);
        throw new Error(error.message);
      }

      console.log('Profile update result:', data);

      // Transform the result to User type
      const updatedUser: User = {
        id: data.id,
        email: data.email,
        fullName: data.full_name,
        role: data.role,
        title: data.title || '',
        company: data.company,
        experienceYears: data.experience_years || 0,
        skills: data.skills || [],
        resumeUrl: data.resume_url,
      };

      storage.setUser(updatedUser);
      set({ user: updatedUser, isLoading: false });
    } catch (error) {
      console.error('Update profile error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  logout: () => {
    supabase.auth.signOut();
    storage.clearUser();
    set({ user: null });
  },
}));