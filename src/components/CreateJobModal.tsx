import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { X, Upload, FileText } from 'lucide-react';
import { useJobsStore } from '../store/jobs';
import { useAuthStore } from '../store/auth';
import { supabase } from '../lib/supabase';

interface CreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateJobModal({ isOpen, onClose }: CreateJobModalProps) {
  const { createJob, isLoading } = useJobsStore();
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requiredSkills: '',
    salaryRange: '',
    location: '',
  });
  const [jobDescriptionFile, setJobDescriptionFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Please upload a PDF file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('File size must be less than 10MB');
        return;
      }
      setJobDescriptionFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    try {
      let jobDescriptionUrl: string | undefined;

      // Upload job description PDF if provided
      if (jobDescriptionFile) {
        console.log('Uploading job description PDF...', jobDescriptionFile.name);
        
        const fileName = `${user.id}/${Date.now()}_${jobDescriptionFile.name}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('job-descriptions')
          .upload(fileName, jobDescriptionFile, {
            contentType: 'application/pdf',
            upsert: false
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw new Error(`Job description upload failed: ${uploadError.message}`);
        }

        console.log('Upload successful:', uploadData);

        const { data: { publicUrl } } = supabase.storage
          .from('job-descriptions')
          .getPublicUrl(fileName);

        jobDescriptionUrl = publicUrl;
        console.log('Public URL generated:', jobDescriptionUrl);
      }

      console.log('Creating job with data:', {
        title: formData.title,
        company: user.company || 'Unknown Company',
        description: formData.description,
        requiredSkills: formData.requiredSkills.split(',').map(skill => skill.trim()),
        salaryRange: formData.salaryRange,
        location: formData.location,
        recruiterId: user.id,
        jobDescriptionUrl,
      });

      await createJob({
        title: formData.title,
        company: user.company || 'Unknown Company',
        description: formData.description,
        requiredSkills: formData.requiredSkills.split(',').map(skill => skill.trim()),
        salaryRange: formData.salaryRange,
        location: formData.location,
        recruiterId: user.id,
        jobDescriptionUrl,
      });
      
      toast.success('Job posted successfully!');
      setFormData({
        title: '',
        description: '',
        requiredSkills: '',
        salaryRange: '',
        location: '',
      });
      setJobDescriptionFile(null);
      onClose();
    } catch (error) {
      console.error('Create job error:', error);
      toast.error('Failed to create job. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Post New Job
              </h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Job Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Job Description (Text)
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the role..."
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Detailed Job Description (PDF - Optional)
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    {jobDescriptionFile ? (
                      <div className="flex items-center space-x-2">
                        <FileText className="h-8 w-8 text-indigo-400" />
                        <span className="text-sm text-gray-900">{jobDescriptionFile.name}</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600">
                          <label
                            htmlFor="job-description-upload"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                          >
                            <span>Upload job description</span>
                            <input
                              id="job-description-upload"
                              name="job-description-upload"
                              type="file"
                              accept=".pdf"
                              className="sr-only"
                              onChange={handleFileChange}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">PDF up to 10MB</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Required Skills (comma separated)
                </label>
                <input
                  type="text"
                  required
                  placeholder="JavaScript, React, Node.js"
                  value={formData.requiredSkills}
                  onChange={(e) => setFormData({ ...formData, requiredSkills: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Salary Range
                </label>
                <input
                  type="text"
                  required
                  placeholder="$100k - $150k"
                  value={formData.salaryRange}
                  onChange={(e) => setFormData({ ...formData, salaryRange: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Location
                </label>
                <input
                  type="text"
                  required
                  placeholder="Remote, New York, etc."
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isLoading ? 'Posting...' : 'Post Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 