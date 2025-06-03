import React, { useEffect } from 'react';
import { X, Download, Eye, Zap, TrendingUp, Award } from 'lucide-react';
import { useApplicationsStore } from '../store/applications';
import { Job } from '../types/types';
import { toast } from 'react-hot-toast';

interface ApplicantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job | null;
}

export function ApplicantsModal({ isOpen, onClose, job }: ApplicantsModalProps) {
  const { 
    jobApplications, 
    fetchJobApplications, 
    updateApplicationStatus, 
    runMatching,
    isLoading,
    isMatching 
  } = useApplicationsStore();

  useEffect(() => {
    if (isOpen && job) {
      fetchJobApplications(job.id).catch(error => {
        console.error('Failed to fetch applications:', error);
      });
    }
  }, [isOpen, job, fetchJobApplications]);

  useEffect(() => {
    console.log('ApplicantsModal - jobApplications:', jobApplications);
    jobApplications.forEach((app, index) => {
      console.log(`Application ${index}:`, {
        id: app.id,
        applicantName: app.applicantName,
        applicantEmail: app.applicantEmail,
        applicantId: app.applicantId
      });
    });
  }, [jobApplications]);

  const handleStatusChange = async (applicationId: string, status: string) => {
    try {
      await updateApplicationStatus(applicationId, status as any);
      toast.success('Application status updated');
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleRunMatching = async () => {
    if (!job) return;
    
    const hasResumes = jobApplications.some(app => app.resumeUrl);
    if (!hasResumes) {
      toast.error('No resumes found to analyze');
      return;
    }
    
    try {
      toast.loading('Analyzing resumes and matching with job requirements...', {
        duration: 3000
      });
      
      await runMatching(job.id);
      toast.success('Matching completed! Applications are now sorted by match score.');
    } catch (error) {
      console.error('Matching failed:', error);
      toast.error('Failed to run matching process. Please try again.');
    }
  };

  const handleDownloadResume = (resumeUrl: string, applicantName: string) => {
    const link = document.createElement('a');
    link.href = resumeUrl;
    link.download = `${applicantName}_resume.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getMatchScoreColor = (score?: number) => {
    if (!score) return 'text-gray-400';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getMatchScoreIcon = (score?: number) => {
    if (!score) return null;
    if (score >= 80) return <Award className="h-4 w-4" />;
    if (score >= 60) return <TrendingUp className="h-4 w-4" />;
    return <Eye className="h-4 w-4" />;
  };

  const getMatchScoreBadge = (score?: number) => {
    if (!score) return (
      <div className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
        Not Analyzed
      </div>
    );
    
    let bgColor, textColor, label;
    if (score >= 80) {
      bgColor = 'bg-green-100';
      textColor = 'text-green-800';
      label = 'Excellent Match';
    } else if (score >= 60) {
      bgColor = 'bg-yellow-100';
      textColor = 'text-yellow-800';
      label = 'Good Match';
    } else if (score >= 40) {
      bgColor = 'bg-orange-100';
      textColor = 'text-orange-800';
      label = 'Fair Match';
    } else {
      bgColor = 'bg-red-100';
      textColor = 'text-red-800';
      label = 'Poor Match';
    }
    
    return (
      <div className={`px-3 py-1 ${bgColor} ${textColor} rounded-full text-xs font-medium flex items-center space-x-1`}>
        {getMatchScoreIcon(score)}
        <span>{score}% • {label}</span>
      </div>
    );
  };

  if (!isOpen || !job) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Applicants for {job.title}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {jobApplications.length} applicant{jobApplications.length !== 1 ? 's' : ''}
                  {jobApplications.some(app => app.matchScore) && ' • Sorted by match score'}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleRunMatching}
                  disabled={isMatching || jobApplications.length === 0}
                  className="flex items-center px-4 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  {isMatching ? 'Analyzing PDFs...' : 'Run AI Matching'}
                </button>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-4">Loading applicants...</div>
            ) : jobApplications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No applications received yet
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {jobApplications.map((application) => (
                  <div key={application.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-lg font-medium text-gray-900">
                            {application.applicantName}
                          </h4>
                          {getMatchScoreBadge(application.matchScore)}
                        </div>
                        
                        <p className="text-sm text-gray-500">{application.applicantEmail}</p>
                        <p className="text-xs text-gray-400">
                          Applied on {new Date(application.createdAt).toLocaleDateString()}
                          {application.lastMatchedAt && (
                            <> • Last analyzed {new Date(application.lastMatchedAt).toLocaleDateString()}</>
                          )}
                        </p>
                        
                        {application.coverLetter && (
                          <div className="mt-3">
                            <p className="text-sm font-medium text-gray-700">Cover Letter:</p>
                            <div className="mt-1 bg-gray-50 p-3 rounded border">
                              <p className="text-sm text-gray-600 line-clamp-3">
                                {application.coverLetter}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col space-y-3 ml-6">
                        {/* Status Selector */}
                        <select
                          value={application.status}
                          onChange={(e) => handleStatusChange(application.id, e.target.value)}
                          className={`text-sm border border-gray-300 rounded px-3 py-2 min-w-[120px] ${
                            application.status === 'accepted' ? 'bg-green-50 text-green-800' :
                            application.status === 'rejected' ? 'bg-red-50 text-red-800' :
                            application.status === 'interviewed' ? 'bg-purple-50 text-purple-800' :
                            application.status === 'reviewing' ? 'bg-yellow-50 text-yellow-800' :
                            'bg-blue-50 text-blue-800'
                          }`}
                        >
                          <option value="pending">Pending</option>
                          <option value="reviewing">Reviewing</option>
                          <option value="interviewed">Interviewed</option>
                          <option value="accepted">Accepted</option>
                          <option value="rejected">Rejected</option>
                        </select>

                        {/* Resume Actions */}
                        {application.resumeUrl && (
                          <div className="flex space-x-1">
                            <button
                              onClick={() => handleDownloadResume(application.resumeUrl!, application.applicantName)}
                              className="flex items-center px-3 py-2 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Download
                            </button>
                            <a
                              href={application.resumeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center px-3 py-2 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 