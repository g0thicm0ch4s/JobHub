import { create } from 'zustand';
import { Job } from '../types/types';
import { storage } from '../lib/storage';

interface JobsState {
  jobs: Job[];
  isLoading: boolean;
  error: string | null;
  createJob: (job: Omit<Job, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  fetchJobs: () => Promise<void>;
}

export const useJobsStore = create<JobsState>((set, get) => ({
  jobs: [],
  isLoading: false,
  error: null,

  createJob: async (jobData) => {
    set({ isLoading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newJob: Job = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        status: 'published',
        ...jobData,
      };

      set(state => ({
        jobs: [...state.jobs, newJob],
        isLoading: false,
      }));
    } catch (error) {
      set({ error: 'Failed to create job', isLoading: false });
      throw error;
    }
  },

  fetchJobs: async () => {
    set({ isLoading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate fetching jobs
      const mockJobs: Job[] = Array.from({ length: 5 }, (_, i) => ({
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        title: `Software Engineer ${i + 1}`,
        company: `Tech Company ${i + 1}`,
        description: 'Lorem ipsum dolor sit amet...',
        requiredSkills: ['JavaScript', 'React', 'Node.js'],
        salaryRange: '$100k - $150k',
        location: 'Remote',
        recruiterId: 'mock-recruiter-id',
        status: 'published',
      }));

      set({ jobs: mockJobs, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch jobs', isLoading: false });
      throw error;
    }
  },
}));