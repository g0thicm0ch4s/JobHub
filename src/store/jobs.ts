import { create } from 'zustand';
import { Job } from '../types/types';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './auth';

interface JobsState {
  jobs: Job[];
  isLoading: boolean;
  error: string | null;
  createJob: (job: Omit<Job, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  updateJob: (jobId: string, updates: Partial<Job>) => Promise<void>;
  deleteJob: (jobId: string) => Promise<void>;
  fetchJobs: () => Promise<void>;
}

export const useJobsStore = create<JobsState>((set, get) => ({
  jobs: [],
  isLoading: false,
  error: null,

  createJob: async (jobData) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('jobs')
        .insert([{
          title: jobData.title,
          company: jobData.company,
          description: jobData.description,
          required_skills: jobData.requiredSkills,
          salary_range: jobData.salaryRange,
          location: jobData.location,
          recruiter_id: jobData.recruiterId,
          job_description_url: jobData.jobDescriptionUrl,
          status: 'published'
        }])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Transform database job to app Job type
      const newJob: Job = {
        id: data.id,
        createdAt: data.created_at,
        title: data.title,
        company: data.company,
        description: data.description,
        requiredSkills: data.required_skills,
        salaryRange: data.salary_range,
        location: data.location,
        recruiterId: data.recruiter_id,
        status: data.status
      };

      set(state => ({
        jobs: [...state.jobs, newJob],
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create job';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  fetchJobs: async () => {
    set({ isLoading: true, error: null });
    try {
      console.log('Fetching jobs with job description URLs...');
      
      const { data, error } = await supabase
        .from('jobs')
        .select('*') // Make sure we're selecting all fields including job_description_url
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      console.log('Raw jobs data from database:', data);

      // Transform database jobs to app Job type
      const jobs: Job[] = data.map(job => {
        console.log(`Job ${job.id} job_description_url:`, job.job_description_url);
        
        return {
          id: job.id,
          createdAt: job.created_at,
          title: job.title,
          company: job.company,
          description: job.description,
          requiredSkills: job.required_skills || [],
          salaryRange: job.salary_range,
          location: job.location,
          recruiterId: job.recruiter_id,
          status: job.status,
          jobDescriptionUrl: job.job_description_url // Make sure this mapping is correct
        };
      });

      console.log('Transformed jobs:', jobs);
      set({ jobs, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch jobs';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  updateJob: async (jobId: string, updates: Partial<Job>) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .rpc('update_job', {
          job_id: jobId,
          job_title: updates.title,
          job_company: updates.company,
          job_description: updates.description,
          job_skills: updates.requiredSkills,
          job_salary: updates.salaryRange,
          job_location: updates.location,
          job_description_url: updates.jobDescriptionUrl,
        });

      if (error) {
        throw new Error(error.message);
      }

      // Update local state
      set(state => ({
        jobs: state.jobs.map(job => 
          job.id === jobId 
            ? {
                id: data.id,
                createdAt: data.created_at,
                title: data.title,
                company: data.company,
                description: data.description,
                requiredSkills: data.required_skills || [],
                salaryRange: data.salary_range,
                location: data.location,
                recruiterId: data.recruiter_id,
                status: data.status,
              }
            : job
        ),
        isLoading: false,
      }));
    } catch (error) {
      console.error('Update job error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update job';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  deleteJob: async (jobId: string) => {
    set({ isLoading: true, error: null });
    try {
      console.log('Deleting job with RPC:', jobId);

      // Use RPC function to delete job
      const { data, error } = await supabase
        .rpc('delete_user_job', {
          p_job_id: jobId
        });

      if (error) {
        console.error('RPC delete error:', error);
        throw new Error(error.message);
      }

      console.log('Job deletion result:', data);

      // Update local state - remove the deleted job
      set(state => ({
        jobs: state.jobs.filter(job => job.id !== jobId),
        isLoading: false,
      }));

      console.log('Job deleted successfully from local state');

    } catch (error) {
      console.error('Delete job error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete job';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },
}));