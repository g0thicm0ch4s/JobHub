import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Briefcase, User, Bell, FileText, Eye } from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { useJobsStore } from '../store/jobs';
import { Job } from '../types/types';
import { CreateJobModal } from './CreateJobModal';
import { EditJobModal } from './EditJobModal';
import { toast } from 'react-hot-toast';
import { useApplicationsStore } from '../store/applications';
import { ApplicationForm } from './ApplicationForm';
import { ApplicantsModal } from './ApplicantsModal';
import { ProfileModal } from './ProfileModal';
import { UpdateApplicationModal } from './UpdateApplicationModal';
import { JobDetailsModal } from './JobDetailsModal';

export function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { jobs, fetchJobs, deleteJob, isLoading } = useJobsStore();
  const { 
    fetchMyApplications, 
    hasAppliedToJob, 
    getUserApplicationForJob 
  } = useApplicationsStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isSuccessMessageVisible, setIsSuccessMessageVisible] = useState(false);
  const [isCreateJobModalOpen, setIsCreateJobModalOpen] = useState(false);
  const [isEditJobModalOpen, setIsEditJobModalOpen] = useState(false);
  const [jobToEdit, setJobToEdit] = useState<Job | null>(null);
  const [isApplicantsModalOpen, setIsApplicantsModalOpen] = useState(false);
  const [selectedJobForApplicants, setSelectedJobForApplicants] = useState<Job | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isUpdateApplicationModalOpen, setIsUpdateApplicationModalOpen] = useState(false);
  const [applicationToUpdate, setApplicationToUpdate] = useState<any>(null);
  const [isJobDetailsModalOpen, setIsJobDetailsModalOpen] = useState(false);
  const [selectedJobForDetails, setSelectedJobForDetails] = useState<Job | null>(null);

  useEffect(() => {
    fetchJobs();
    if (user?.role === 'job_seeker') {
      fetchMyApplications();
    }
  }, [fetchJobs, fetchMyApplications, user]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };
  const handleApplyClick = (job: Job) => {
    setSelectedJob(job);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedJob(null);
  };

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log('Form is being submitted');
    // Handle form submission logic here
    console.log('Form submitted for job:', selectedJob);
    setIsSuccessMessageVisible(true);
    console.log('Form submitted for job:', selectedJob);
    handleModalClose();
    setTimeout(() => {
      setIsSuccessMessageVisible(false);
      console.log('Success message hidden');
    }, 3000); // Hide message after 3 seconds
  };

  const handleEditJob = (job: Job) => {
    setJobToEdit(job);
    setIsEditJobModalOpen(true);
  };

  const handleDeleteJob = async (jobId: string) => {
    if (window.confirm('Are you sure you want to delete this job?')) {
      try {
        await deleteJob(jobId);
        toast.success('Job deleted successfully!');
      } catch (error) {
        toast.error('Failed to delete job');
      }
    }
  };

  const handleViewApplicants = (job: Job) => {
    setSelectedJobForApplicants(job);
    setIsApplicantsModalOpen(true);
  };

  const handleUpdateApplicationClick = (job: Job) => {
    const userApplication = getUserApplicationForJob(job.id);
    if (userApplication) {
      setApplicationToUpdate({ job, application: userApplication });
      setIsUpdateApplicationModalOpen(true);
    }
  };

  const handleDownloadJobDescription = (jobDescriptionUrl: string, jobTitle: string) => {
    const link = document.createElement('a');
    link.href = jobDescriptionUrl;
    link.download = `${jobTitle.replace(/[^a-zA-Z0-9]/g, '_')}_job_description.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleViewJobDetails = (job: Job) => {
    setSelectedJobForDetails(job);
    setIsJobDetailsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-indigo-50 to-indigo-100">
      {/* Success Message */}
      {isSuccessMessageVisible && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-green-500 text-white text-center py-2 px-4 rounded shadow-md">
            Application received successfully!
          </div>
        </div>
      )}
      {/* Navigation */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Briefcase className="h-8 w-8 text-indigo-600" />
                <span className="ml-2 text-xl font-bold text-indigo-800">JobHub</span>
              </div>
            </div>
            <div className="flex items-center">
              <button className="p-2 rounded-full hover:bg-gray-100">
                <Bell className="h-6 w-6 text-gray-500" />
              </button>
              <div className="ml-3 relative">
                <button 
                  onClick={() => setIsProfileModalOpen(true)}
                  className="p-2 rounded-full hover:bg-gray-100"
                  title="Edit Profile"
                >
                  <User className="h-6 w-6 text-gray-500" />
                </button>
              </div>
              <button
                onClick={handleLogout}
                className="ml-4 flex items-center text-gray-500 hover:text-gray-700"
              >
                <LogOut className="h-5 w-5" />
                <span className="ml-2">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-10 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="px-4 py-6 sm:px-0 text-center">
          <h1 className="text-3xl font-bold text-indigo-900">
            Welcome, {user?.fullName}!
          </h1>
          <p className="mt-2 text-lg text-gray-700">
            {user?.role === 'job_seeker'
              ? 'Find your dream job today'
              : 'Manage your job postings and candidates'}
          </p>
        </div>

        {/* Role-specific Actions */}
        {user?.role === 'recruiter' && (
          <div className="mt-8 flex justify-end">
            <button
              onClick={() => setIsCreateJobModalOpen(true)}
              className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 font-medium"
            >
              Post New Job
            </button>
          </div>
        )}

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white overflow-hidden shadow-lg rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Briefcase className="h-6 w-6 text-indigo-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {user?.role === 'job_seeker' ? 'Available Jobs' : 'Active Listings'}
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {isLoading ? '...' : jobs.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Job Listings */}
        <div className="mt-10">
          <div className="bg-white shadow-lg overflow-hidden sm:rounded-lg">
            <ul className="divide-y divide-gray-200">
              {isLoading ? (
                <li className="p-4 text-center text-gray-500">Loading jobs...</li>
              ) : jobs.length === 0 ? (
                <li className="p-4 text-center text-gray-500">
                  {user?.role === 'recruiter' ? 'No jobs posted yet' : 'No jobs available'}
                </li>
              ) : jobs.map((job) => (
                <li key={job.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50 transition duration-150 ease-in-out">
                  <div className="flex items-center justify-between">
                    <div className="sm:flex sm:justify-between w-full">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-indigo-600 truncate">
                          {job.title}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {job.company} • {job.location}
                        </p>
                        <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                          {job.description.length > 100 
                            ? `${job.description.substring(0, 100)}...` 
                            : job.description
                          }
                        </p>
                        <button
                          onClick={() => handleViewJobDetails(job)}
                          className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline flex items-center"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Full Details
                          {job.jobDescriptionUrl && " & Download PDF"}
                        </button>
                      </div>
                      <div className="mt-2 sm:mt-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {job.salaryRange}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {job.requiredSkills.slice(0, 3).map((skill) => (
                            <span
                              key={skill}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800"
                            >
                              {skill}
                            </span>
                          ))}
                          {job.requiredSkills.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{job.requiredSkills.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {user?.role === 'job_seeker' ? (
                          hasAppliedToJob(job.id) ? (
                            <div className="flex flex-col space-y-2">
                              <button
                                onClick={() => handleUpdateApplicationClick(job)}
                                className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-md shadow-md hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150 ease-in-out text-sm"
                              >
                                Update Application
                              </button>
                              <span className="text-xs text-gray-500 text-center">
                                Status: {getUserApplicationForJob(job.id)?.status?.replace('_', ' ').toUpperCase()}
                              </span>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleApplyClick(job)}
                              className="mt-2 sm:mt-0 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-4 py-2 rounded-md shadow-md hover:from-indigo-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
                            >
                              Apply
                            </button>
                          )
                        ) : user?.role === 'recruiter' && job.recruiterId === user.id ? (
                          <div className="flex flex-col space-y-2">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditJob(job)}
                                className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1 rounded-md shadow-md hover:from-green-600 hover:to-green-700 text-sm"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteJob(job.id)}
                                className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 rounded-md shadow-md hover:from-red-600 hover:to-red-700 text-sm"
                              >
                                Delete
                              </button>
                            </div>
                            <button
                              onClick={() => handleViewApplicants(job)}
                              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-md shadow-md hover:from-blue-600 hover:to-blue-700 text-sm"
                            >
                              View Applicants
                            </button>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">
                            Posted by {job.company}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Application Modal */}
        {isModalOpen && (
          <div className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>

              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Apply for {selectedJob?.title}
                      </h3>
                      <div className="mt-2">
                        <ApplicationForm 
                          job={selectedJob}
                          onClose={handleModalClose}
                          onSuccess={() => {
                            setIsSuccessMessageVisible(true);
                            handleModalClose();
                            setTimeout(() => setIsSuccessMessageVisible(false), 3000);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Job Modal */}
        <CreateJobModal 
          isOpen={isCreateJobModalOpen} 
          onClose={() => setIsCreateJobModalOpen(false)} 
        />

        {/* Edit Job Modal */}
        <EditJobModal 
          isOpen={isEditJobModalOpen} 
          onClose={() => {
            setIsEditJobModalOpen(false);
            setJobToEdit(null);
          }}
          job={jobToEdit}
        />

        <ApplicantsModal 
          isOpen={isApplicantsModalOpen} 
          onClose={() => {
            setIsApplicantsModalOpen(false);
            setSelectedJobForApplicants(null);
          }}
          job={selectedJobForApplicants}
        />

        <ProfileModal 
          isOpen={isProfileModalOpen} 
          onClose={() => setIsProfileModalOpen(false)} 
        />

        <UpdateApplicationModal 
          isOpen={isUpdateApplicationModalOpen} 
          onClose={() => {
            setIsUpdateApplicationModalOpen(false);
            setApplicationToUpdate(null);
          }}
          jobAndApplication={applicationToUpdate}
          onSuccess={() => {
            setIsSuccessMessageVisible(true);
            setIsUpdateApplicationModalOpen(false);
            setApplicationToUpdate(null);
            setTimeout(() => setIsSuccessMessageVisible(false), 3000);
          }}
        />

        <JobDetailsModal 
          isOpen={isJobDetailsModalOpen} 
          onClose={() => {
            setIsJobDetailsModalOpen(false);
            setSelectedJobForDetails(null);
          }}
          job={selectedJobForDetails}
          onApply={(job) => {
            setIsJobDetailsModalOpen(false);
            handleApplyClick(job);
          }}
          onUpdateApplication={(job) => {
            setIsJobDetailsModalOpen(false);
            handleUpdateApplicationClick(job);
          }}
        />
      </main>
    </div>
  );
}