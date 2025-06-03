import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { PDFMatchingService } from '../services/pdfMatching';

export interface Application {
  id: string;
  createdAt: string;
  jobId: string;
  applicantId: string;
  status: 'pending' | 'reviewing' | 'interviewed' | 'rejected' | 'accepted';
  coverLetter?: string;
  resumeUrl?: string;
  applicantName: string;
  applicantEmail: string;
  jobTitle: string;
  company: string;
  matchScore?: number;
  lastMatchedAt?: string;
}

interface ApplicationsState {
  applications: Application[];
  jobApplications: Application[];
  userApplications: { [jobId: string]: Application };
  isLoading: boolean;
  error: string | null;
  submitApplication: (applicationData: {
    jobId: string;
    coverLetter: string;
    resumeFile: File;
  }) => Promise<void>;
  updateApplication: (applicationId: string, applicationData: {
    coverLetter: string;
    resumeFile?: File;
  }) => Promise<void>;
  fetchMyApplications: () => Promise<void>;
  fetchJobApplications: (jobId: string) => Promise<void>;
  updateApplicationStatus: (applicationId: string, status: Application['status']) => Promise<void>;
  hasAppliedToJob: (jobId: string) => boolean;
  getUserApplicationForJob: (jobId: string) => Application | null;
  runMatching: (jobId: string) => Promise<void>;
  isMatching: boolean;
}

export const useApplicationsStore = create<ApplicationsState>((set, get) => ({
  applications: [],
  jobApplications: [],
  userApplications: {},
  isLoading: false,
  error: null,
  isMatching: false,

  submitApplication: async (applicationData) => {
    set({ isLoading: true, error: null });
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('User not authenticated');

      console.log('Submitting application for user:', user.id);

      // CRITICAL: Ensure profile exists before applying
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileCheckError && profileCheckError.code === 'PGRST116') {
        // Profile doesn't exist, create one
        console.log('Creating missing profile for applicant...');
        
        const { error: createProfileError } = await supabase
          .from('profiles')
          .insert([{
            id: user.id,
            email: user.email || '',
            full_name: user.email?.split('@')[0] || 'Job Seeker',
            role: 'job_seeker',
            skills: [],
            experience_years: 0,
            title: '',
          }]);

        if (createProfileError) {
          console.error('Failed to create profile:', createProfileError);
          throw new Error('Failed to create user profile. Please contact support.');
        }
        
        console.log('Profile created successfully');
      } else if (existingProfile) {
        console.log('Profile already exists:', existingProfile);
      }

      // Verify the job exists
      const { data: jobExists, error: jobError } = await supabase
        .from('jobs')
        .select('id, recruiter_id')
        .eq('id', applicationData.jobId)
        .single();

      if (jobError || !jobExists) {
        throw new Error('Job not found');
      }

      // Check if user has already applied
      const { data: existingApplication, error: checkError } = await supabase
        .from('applications')
        .select('id')
        .eq('job_id', applicationData.jobId)
        .eq('applicant_id', user.id)
        .single();

      if (existingApplication) {
        throw new Error('You have already applied to this job');
      }

      // Upload resume
      const fileBuffer = await applicationData.resumeFile.arrayBuffer();
      const fileName = `${user.id}/${Date.now()}_${applicationData.resumeFile.name}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, fileBuffer, {
          contentType: 'application/pdf',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Resume upload failed: ${uploadError.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('resumes')
        .getPublicUrl(fileName);

      // Submit application using RPC for reliability
      const { data: insertData, error: insertError } = await supabase
        .rpc('submit_application', {
          p_job_id: applicationData.jobId,
          p_cover_letter: applicationData.coverLetter || null,
          p_resume_url: publicUrl
        });

      if (insertError) {
        // Clean up uploaded file if database insert fails
        await supabase.storage.from('resumes').remove([fileName]);
        throw new Error(`Application submission failed: ${insertError.message}`);
      }

      console.log('Application submitted successfully');
      set({ isLoading: false });
    } catch (error) {
      console.error('Submit application error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit application';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  updateApplication: async (applicationId: string, applicationData) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('User not authenticated');

      let resumeUrl: string | undefined;

      // Upload new resume if provided
      if (applicationData.resumeFile) {
        console.log('Uploading new resume...');
        const fileBuffer = await applicationData.resumeFile.arrayBuffer();
        const fileName = `${user.id}/${Date.now()}_${applicationData.resumeFile.name}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('resumes')
          .upload(fileName, fileBuffer, {
            contentType: 'application/pdf',
            upsert: false
          });

        if (uploadError) {
          console.error('Resume upload error:', uploadError);
          throw new Error(`Resume upload failed: ${uploadError.message}`);
        }

        const { data: { publicUrl } } = supabase.storage
          .from('resumes')
          .getPublicUrl(fileName);

        resumeUrl = publicUrl;
        console.log('New resume uploaded:', resumeUrl);
      }

      console.log('Updating application with RPC...');
      console.log('Application ID:', applicationId);
      console.log('Cover letter:', applicationData.coverLetter);
      console.log('Resume URL:', resumeUrl);

      // Use RPC function to update application
      const { data, error } = await supabase
        .rpc('update_user_application', {
          p_application_id: applicationId,
          p_cover_letter: applicationData.coverLetter,
          p_resume_url: resumeUrl
        });

      if (error) {
        console.error('RPC update error:', error);
        throw new Error(`Application update failed: ${error.message}`);
      }

      console.log('Application update result:', data);

      // Get job details for the updated application
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select('title, company')
        .eq('id', data.job_id)
        .single();

      if (jobError) {
        console.error('Job fetch error:', jobError);
      }

      // Update local state
      const updatedApplication: Application = {
        id: data.id,
        createdAt: data.created_at,
        jobId: data.job_id,
        applicantId: data.applicant_id,
        status: data.status,
        coverLetter: data.cover_letter,
        resumeUrl: data.resume_url,
        applicantName: '',
        applicantEmail: '',
        jobTitle: jobData?.title || '',
        company: jobData?.company || '',
        matchScore: data.match_score,
        lastMatchedAt: data.last_matched_at,
      };

      set(state => ({
        userApplications: {
          ...state.userApplications,
          [data.job_id]: updatedApplication
        },
        applications: state.applications.map(app => 
          app.id === applicationId ? updatedApplication : app
        ),
        isLoading: false
      }));

      console.log('Local state updated successfully');

    } catch (error) {
      console.error('Update application error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update application';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  fetchMyApplications: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          jobs (
            title,
            company
          )
        `)
        .eq('applicant_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);

      const applications: Application[] = data.map(app => ({
        id: app.id,
        createdAt: app.created_at,
        jobId: app.job_id,
        applicantId: app.applicant_id,
        status: app.status,
        coverLetter: app.cover_letter,
        resumeUrl: app.resume_url,
        applicantName: '',
        applicantEmail: '',
        jobTitle: app.jobs?.title || '',
        company: app.jobs?.company || '',
        matchScore: app.match_score,
        lastMatchedAt: app.last_matched_at,
      }));

      // Create userApplications map for quick lookup
      const userApplications: { [jobId: string]: Application } = {};
      applications.forEach(app => {
        userApplications[app.jobId] = app;
      });

      set({ applications, userApplications, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch applications';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  fetchJobApplications: async (jobId: string) => {
    set({ isLoading: true, error: null });
    try {
      console.log('=== FETCHING JOB APPLICATIONS ===');
      console.log('Job ID:', jobId);

      // Get applications first
      const { data: applications, error: appError } = await supabase
        .from('applications')
        .select('*')
        .eq('job_id', jobId)
        .order('match_score', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (appError) {
        throw new Error(`Failed to fetch applications: ${appError.message}`);
      }

      // Get job details
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('title, company')
        .eq('id', jobId)
        .single();

      const jobApplications: Application[] = [];

      // Fetch profiles individually for better reliability
      for (const app of applications || []) {
        console.log('Fetching profile for applicant:', app.applicant_id);
        
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', app.applicant_id)
          .single();

        console.log(`Profile result:`, { profile, profileError });

        // Also check if profile exists at all
        const { data: profileCheck } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .eq('id', app.applicant_id);
        
        console.log(`Profile check (bypassing single()):`, profileCheck);

        jobApplications.push({
          id: app.id,
          createdAt: app.created_at,
          jobId: app.job_id,
          applicantId: app.applicant_id,
          status: app.status,
          coverLetter: app.cover_letter,
          resumeUrl: app.resume_url,
          applicantName: profile?.full_name || 'Profile Not Found',
          applicantEmail: profile?.email || 'Email Not Found',
          jobTitle: job?.title || 'Unknown Job',
          company: job?.company || 'Unknown Company',
          matchScore: app.match_score,
          lastMatchedAt: app.last_matched_at,
        });
      }

      console.log('Final processed applications:', jobApplications);
      set({ jobApplications, isLoading: false });

    } catch (error) {
      console.error('fetchJobApplications error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch job applications';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  updateApplicationStatus: async (applicationId: string, status: Application['status']) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status })
        .eq('id', applicationId);

      if (error) throw new Error(error.message);

      // Update local state
      set(state => ({
        jobApplications: state.jobApplications.map(app =>
          app.id === applicationId ? { ...app, status } : app
        ),
        isLoading: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update application status';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  hasAppliedToJob: (jobId: string) => {
    const state = get();
    return jobId in state.userApplications;
  },

  getUserApplicationForJob: (jobId: string) => {
    const state = get();
    return state.userApplications[jobId] || null;
  },

  runMatching: async (jobId: string) => {
    set({ isMatching: true, error: null });
    try {
      console.log('Starting matching process for job:', jobId);

      // Get job details including job description PDF
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (jobError || !job) {
        throw new Error('Failed to fetch job details');
      }

      // Get applications for this job
      const { data: applications, error: appsError } = await supabase
        .from('applications')
        .select('*')
        .eq('job_id', jobId);

      if (appsError) {
        throw new Error('Failed to fetch applications');
      }

      console.log(`Found ${applications?.length || 0} applications to process`);

      // Start with the basic job description text
      let jobDescriptionText = job.description || '';

      // Try to extract text from job description PDF if available
      if (job.job_description_url) {
        try {
          console.log('Job description PDF found, extracting text...');
          const pdfText = await PDFMatchingService.extractTextFromPDF(job.job_description_url);
          if (pdfText && pdfText.trim().length > 0) {
            jobDescriptionText += ' ' + pdfText;
            console.log('Job description PDF text extracted and added successfully');
          } else {
            console.log('PDF text extraction returned empty, using job description text only');
          }
        } catch (error) {
          console.warn('Failed to extract job description PDF text, falling back to description text only');
          // Continue with just the text description - no error thrown
        }
      } else {
        console.log('No job description PDF available, using job description text only');
      }

      // Ensure we have some job description text to work with
      if (!jobDescriptionText || jobDescriptionText.trim().length === 0) {
        console.warn('No job description text available (neither PDF nor text field)');
        jobDescriptionText = `${job.title} ${job.company} ${job.location || ''} ${(job.required_skills || []).join(' ')}`.trim();
        console.log('Using job metadata as fallback description:', jobDescriptionText);
      }

      console.log('Final job description text length:', jobDescriptionText.length);

      // Process each application
      const results = [];
      for (const application of applications || []) {
        try {
          console.log(`Processing application ${application.id}...`);

          if (!application.resume_url) {
            console.log('No resume URL for application, assigning default low score...');
            
            // Assign a low default score for applications without resumes
            const { error: updateError } = await supabase
              .from('applications')
              .update({ 
                match_score: 10.0, // Low score for missing resume
                last_matched_at: new Date().toISOString()
              })
              .eq('id', application.id);

            if (updateError) {
              console.error('Failed to update match score for no-resume application:', updateError);
            }

            results.push({
              applicationId: application.id,
              score: 10.0,
              breakdown: {
                skillsMatch: 0,
                keywordMatch: 0,
                experienceMatch: 0,
                overallMatch: 10.0
              }
            });
            
            continue;
          }

          // Extract text from resume PDF
          console.log('Extracting text from resume PDF...');
          let resumeText = '';
          
          try {
            resumeText = await PDFMatchingService.extractTextFromPDF(application.resume_url);
            console.log('Resume text extracted successfully, length:', resumeText.length);
          } catch (error) {
            console.warn('Failed to extract resume text, using filename fallback:', error);
            // Use filename as fallback
            const filename = application.resume_url.split('/').pop() || '';
            resumeText = filename.replace(/[_-]/g, ' ').replace('.pdf', '');
          }

          // Calculate match score using job description text and resume
          const matchResult = PDFMatchingService.calculateMatchScore(
            jobDescriptionText,
            resumeText,
            job.required_skills || []
          );

          console.log(`Match score for application ${application.id}:`, matchResult.score);

          // Update application with match score
          const { error: updateError } = await supabase
            .from('applications')
            .update({ 
              match_score: matchResult.score,
              last_matched_at: new Date().toISOString()
            })
            .eq('id', application.id);

          if (updateError) {
            console.error('Failed to update match score:', updateError);
          } else {
            console.log(`Match score updated for application ${application.id}: ${matchResult.score}`);
          }

          results.push({
            applicationId: application.id,
            score: matchResult.score,
            breakdown: matchResult.breakdown
          });

        } catch (error) {
          console.error(`Error processing application ${application.id}:`, error);
          
          // Assign a minimal score on error
          try {
            await supabase
              .from('applications')
              .update({ 
                match_score: 5.0, // Very low score for errors
                last_matched_at: new Date().toISOString()
              })
              .eq('id', application.id);
          } catch (updateError) {
            console.error('Failed to update error score:', updateError);
          }
          
          // Continue with other applications
        }
      }

      console.log('Matching results:', results);

      // Refresh the applications list to show updated scores
      await get().fetchJobApplications(jobId);

      console.log('Matching process completed successfully');
      set({ isMatching: false });

    } catch (error) {
      console.error('Matching process error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to run matching';
      set({ error: errorMessage, isMatching: false });
      throw error;
    }
  },
})); 