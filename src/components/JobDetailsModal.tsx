import React from 'react';
import { X, MapPin, DollarSign, Building, FileText, Download, User } from 'lucide-react';
import { Job } from '../types/types';
import { useAuthStore } from '../store/auth';
import { useApplicationsStore } from '../store/applications';

interface JobDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job | null;
  onApply: (job: Job) => void;
  onUpdateApplication: (job: Job) => void;
}

export function JobDetailsModal({ isOpen, onClose, job, onApply, onUpdateApplication }: JobDetailsModalProps) {
  const { user } = useAuthStore();
  const { hasAppliedToJob, getUserApplicationForJob } = useApplicationsStore();

  // Add debug logging
  console.log('JobDetailsModal - job object:', job);
  console.log('JobDetailsModal - jobDescriptionUrl:', job?.jobDescriptionUrl);

  const handleDownloadJobDescription = (jobDescriptionUrl: string, jobTitle: string) => {
    const link = document.createElement('a');
    link.href = jobDescriptionUrl;
    link.download = `${jobTitle.replace(/[^a-zA-Z0-9]/g, '_')}_job_description.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen || !job) return null;

  const userApplication = getUserApplicationForJob(job.id);
  const hasApplied = hasAppliedToJob(job.id);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white px-6 pt-6 pb-4">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{job.title}</h2>
                <div className="flex items-center text-gray-600 mb-4">
                  <Building className="h-5 w-5 mr-2" />
                  <span className="text-lg">{job.company}</span>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {job.location}
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-1" />
                    {job.salaryRange}
                  </div>
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-1" />
                    Posted {new Date(job.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Application Status */}
            {hasApplied && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-blue-800">Application Status</h3>
                    <p className="text-sm text-blue-600">
                      {userApplication?.status?.replace('_', ' ').toUpperCase()} • Applied on {new Date(userApplication?.createdAt || '').toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    userApplication?.status === 'accepted' ? 'bg-green-100 text-green-800' :
                    userApplication?.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    userApplication?.status === 'interviewed' ? 'bg-purple-100 text-purple-800' :
                    userApplication?.status === 'reviewing' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {userApplication?.status?.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
            )}

            {/* Content */}
            <div className="max-h-96 overflow-y-auto">
              {/* Job Description */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Job Description</h3>
                <div className="prose prose-sm max-w-none text-gray-700">
                  <p className="whitespace-pre-wrap">{job.description}</p>
                </div>
              </div>

              {/* Job Description PDF - Enhanced with more debugging */}
              {job.jobDescriptionUrl ? (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Detailed Job Description</h3>
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FileText className="h-8 w-8 text-red-500 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Job Description (PDF)</p>
                          <p className="text-xs text-gray-500">Click to view detailed job requirements</p>
                          {/* Debug info */}
                          <p className="text-xs text-gray-400">URL: {job.jobDescriptionUrl}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => window.open(job.jobDescriptionUrl, '_blank')}
                          className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          View
                        </button>
                        <button
                          onClick={() => handleDownloadJobDescription(job.jobDescriptionUrl!, job.title)}
                          className="flex items-center px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-6">
                  <p className="text-sm text-gray-500">No PDF job description available for this position.</p>
                </div>
              )}

              {/* Required Skills */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Required Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {job.requiredSkills.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Job Details */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Job Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-1">Company</h4>
                    <p className="text-gray-700">{job.company}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-1">Location</h4>
                    <p className="text-gray-700">{job.location}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-1">Salary Range</h4>
                    <p className="text-gray-700">{job.salaryRange}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-1">Posted Date</h4>
                    <p className="text-gray-700">{new Date(job.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {user?.role === 'job_seeker' && (
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Close
                </button>
                {hasApplied ? (
                  <button
                    onClick={() => onUpdateApplication(job)}
                    className="px-6 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
                  >
                    Update Application
                  </button>
                ) : (
                  <button
                    onClick={() => onApply(job)}
                    className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
                  >
                    Apply Now
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 