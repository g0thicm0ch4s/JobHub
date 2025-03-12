export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          created_at: string
          email: string
          full_name: string
          role: 'job_seeker' | 'recruiter' | 'admin'
          resume_url?: string
          skills: string[]
          experience_years: number
          title: string
          company?: string
        }
        Insert: {
          id: string
          created_at?: string
          email: string
          full_name: string
          role: 'job_seeker' | 'recruiter' | 'admin'
          resume_url?: string
          skills?: string[]
          experience_years?: number
          title?: string
          company?: string
        }
        Update: {
          id?: string
          created_at?: string
          email?: string
          full_name?: string
          role?: 'job_seeker' | 'recruiter' | 'admin'
          resume_url?: string
          skills?: string[]
          experience_years?: number
          title?: string
          company?: string
        }
      }
      jobs: {
        Row: {
          id: string
          created_at: string
          title: string
          company: string
          description: string
          required_skills: string[]
          salary_range: string
          location: string
          recruiter_id: string
          status: 'draft' | 'published' | 'closed'
        }
        Insert: {
          id?: string
          created_at?: string
          title: string
          company: string
          description: string
          required_skills: string[]
          salary_range: string
          location: string
          recruiter_id: string
          status?: 'draft' | 'published' | 'closed'
        }
        Update: {
          id?: string
          created_at?: string
          title?: string
          company?: string
          description?: string
          required_skills?: string[]
          salary_range?: string
          location?: string
          recruiter_id?: string
          status?: 'draft' | 'published' | 'closed'
        }
      }
      applications: {
        Row: {
          id: string
          created_at: string
          job_id: string
          applicant_id: string
          status: 'pending' | 'reviewing' | 'interviewed' | 'rejected' | 'accepted'
          cover_letter?: string
        }
        Insert: {
          id?: string
          created_at?: string
          job_id: string
          applicant_id: string
          status?: 'pending' | 'reviewing' | 'interviewed' | 'rejected' | 'accepted'
          cover_letter?: string
        }
        Update: {
          id?: string
          created_at?: string
          job_id?: string
          applicant_id?: string
          status?: 'pending' | 'reviewing' | 'interviewed' | 'rejected' | 'accepted'
          cover_letter?: string
        }
      }
    }
  }
}