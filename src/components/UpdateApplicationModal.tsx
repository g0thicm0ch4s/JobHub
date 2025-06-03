import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Upload, FileText, X } from 'lucide-react';
import { useApplicationsStore } from '../store/applications';
import { Job } from '../types/types';

interface UpdateApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobAndApplication: { job: Job; application: any } | null;
  onSuccess: () => void;
}

export function UpdateApplicationModal({ isOpen, onClose, jobAndApplication, onSuccess }: UpdateApplicationModalProps) {
  const { updateApplication, isLoading } = useApplicationsStore();
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [keepCurrentResume, setKeepCurrentResume] = useState(true);

  useEffect(() => {
    if (jobAndApplication?.application) {
      setCoverLetter(jobAndApplication.application.coverLetter || '');
      setKeepCurrentResume(true);
      setResumeFile(null);
    }
  }, [jobAndApplication]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Please upload a PDF file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setResumeFile(file);
      setKeepCurrentResume(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!jobAndApplication) return;

    try {
      await updateApplication(jobAndApplication.application.id, {
        coverLetter,
        resumeFile: keepCurrentResume ? undefined : resumeFile || undefined,
      });
      
      toast.success('Application updated successfully!');
      onSuccess();
    } catch (error) {
      toast.error('Failed to update application. Please try again.');
    }
  };

  if (!isOpen || !jobAndApplication) return null;

  const { job, application } = jobAndApplication;

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
                Update Application for {job.title}
              </h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-700">
                <strong>Current Status:</strong> {application.status?.replace('_', ' ').toUpperCase()}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Applied on {new Date(application.createdAt).toLocaleDateString()}
              </p>
            </div>
            
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
                  placeholder="Update your cover letter..."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resume
                </label>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      id="keep-current"
                      name="resume-option"
                      checked={keepCurrentResume}
                      onChange={() => {
                        setKeepCurrentResume(true);
                        setResumeFile(null);
                      }}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                    <label htmlFor="keep-current" className="text-sm text-gray-700">
                      Keep current resume
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      id="upload-new"
                      name="resume-option"
                      checked={!keepCurrentResume}
                      onChange={() => setKeepCurrentResume(false)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                    <label htmlFor="upload-new" className="text-sm text-gray-700">
                      Upload new resume
                    </label>
                  </div>

                  {!keepCurrentResume && (
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
                  )}
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
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isLoading ? 'Updating...' : 'Update Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 