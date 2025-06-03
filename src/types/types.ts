export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'job_seeker' | 'recruiter' | 'admin';
  resumeUrl?: string;
  skills: string[];
  experienceYears: number;
  title: string;
  company?: string;
}

export interface Job {
  id: string;
  createdAt: string;
  title: string;
  company: string;
  description: string;
  requiredSkills: string[];
  salaryRange: string;
  location: string;
  recruiterId: string;
  status: 'draft' | 'published' | 'closed';
  jobDescriptionUrl?: string;
}

export interface Application {
  id: string;
  createdAt: string;
  jobId: string;
  applicantId: string;
  status: 'pending' | 'reviewing' | 'interviewed' | 'rejected' | 'accepted';
  coverLetter?: string;
}