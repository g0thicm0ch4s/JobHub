import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Upload, FileText } from 'lucide-react';
import { useApplicationsStore } from '../store/applications';
import { Job } from '../types/types';

interface ApplicationFormProps {
  job: Job | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function ApplicationForm({ job, onClose, onSuccess }: ApplicationFormProps) {
  const { submitApplication, isLoading } = useApplicationsStore();
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('Selected file:', file.name, file.size, file.type);
      
      // Check file type
      if (file.type !== 'application/pdf') {
        toast.error('Please upload a PDF file');
        e.target.value = ''; // Clear the input
        return;
      }
      
      // Check file size (5MB = 5 * 1024 * 1024 bytes)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        e.target.value = ''; // Clear the input
        return;
      }
      
      setResumeFile(file);
      console.log('File accepted:', file.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!job || !resumeFile) {
      toast.error('Please select a resume file');
      return;
    }

    try {
      await submitApplication({
        jobId: job.id,
        coverLetter,
        resumeFile,
      });
      
      toast.success('Application submitted successfully!');
      onSuccess();
    } catch (error) {
      toast.error('Failed to submit application. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Cover Letter
        </label>
        <textarea
          required
          rows={4}
          value={coverLetter}
          onChange={(e) => setCoverLetter(e.target.value)}
          placeholder="Tell us why you're interested in this position..."
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Resume (PDF only)
        </label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
          <div className="space-y-1 text-center">
            {resumeFile ? (
              <div className="flex items-center space-x-2">
                <FileText className="h-8 w-8 text-indigo-400" />
                <span className="text-sm text-gray-900">{resumeFile.name}</span>
              </div>
            ) : (
              <>
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="resume-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                  >
                    <span>Upload a file</span>
                    <input
                      id="resume-upload"
                      name="resume-upload"
                      type="file"
                      accept=".pdf"
                      required
                      className="sr-only"
                      onChange={handleFileChange}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PDF up to 5MB</p>
              </>
            )}
          </div>
        </div>
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
          disabled={isLoading || !resumeFile}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {isLoading ? 'Submitting...' : 'Submit Application'}
        </button>
      </div>
    </form>
  );
} 