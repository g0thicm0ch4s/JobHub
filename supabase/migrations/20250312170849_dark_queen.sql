/*
  # Initial Schema Setup for Job Search Platform

  1. Tables
    - profiles: Store user profiles for job seekers, recruiters, and admins
    - jobs: Store job listings
    - applications: Track job applications and their status

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('job_seeker', 'recruiter', 'admin')),
  resume_url text,
  skills text[],
  experience_years integer DEFAULT 0,
  title text,
  company text
);

-- Create jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  title text NOT NULL,
  company text NOT NULL,
  description text NOT NULL,
  required_skills text[],
  salary_range text NOT NULL,
  location text NOT NULL,
  recruiter_id uuid REFERENCES profiles(id),
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed'))
);

-- Create applications table
CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  job_id uuid REFERENCES jobs(id),
  applicant_id uuid REFERENCES profiles(id),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'interviewed', 'rejected', 'accepted')),
  cover_letter text
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read their own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Jobs policies
CREATE POLICY "Anyone can read published jobs"
  ON jobs
  FOR SELECT
  TO authenticated
  USING (status = 'published');

CREATE POLICY "Recruiters can manage their own jobs"
  ON jobs
  FOR ALL
  TO authenticated
  USING (recruiter_id = auth.uid());

-- Applications policies
CREATE POLICY "Job seekers can read their own applications"
  ON applications
  FOR SELECT
  TO authenticated
  USING (applicant_id = auth.uid());

CREATE POLICY "Job seekers can create applications"
  ON applications
  FOR INSERT
  TO authenticated
  WITH CHECK (applicant_id = auth.uid());

CREATE POLICY "Recruiters can read applications for their jobs"
  ON applications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = applications.job_id
      AND jobs.recruiter_id = auth.uid()
    )
  );

CREATE POLICY "Recruiters can update application status"
  ON applications
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = applications.job_id
      AND jobs.recruiter_id = auth.uid()
    )
  );