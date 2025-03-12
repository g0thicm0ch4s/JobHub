import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Briefcase, User, Bell } from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { useJobsStore } from '../store/jobs';

export function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { jobs, fetchJobs, isLoading } = useJobsStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isSuccessMessageVisible, setIsSuccessMessageVisible] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleApplyClick = (job) => {
    setSelectedJob(job);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedJob(null);
  };

  const handleFormSubmit = (event) => {
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
                <button className="p-2 rounded-full hover:bg-gray-100">
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
                      </div>
                      <div className="mt-2 sm:mt-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {job.salaryRange}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {job.requiredSkills.map((skill) => (
                            <span
                              key={skill}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <button
                          onClick={() => handleApplyClick(job)}
                          className="mt-2 sm:mt-0 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-4 py-2 rounded-md shadow-md hover:from-indigo-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
                        >
                          Apply
                        </button>
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
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Apply for {selectedJob?.title}
                      </h3>
                      <div className="mt-2">
                        <form onSubmit={handleFormSubmit}>
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">
                              Full Name
                            </label>
                            <input
                              type="text"
                              required
                              className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            />
                          </div>
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">
                              Email
                            </label>
                            <input
                              type="email"
                              required
                              className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            />
                          </div>
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">
                              Resume
                            </label>
                            <input
                              type="file"
                              required
                              className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            />
                          </div>
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={handleModalClose}
                              className="mr-2 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                            >
                              Submit
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}