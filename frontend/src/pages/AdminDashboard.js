import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

// Components
import EmployeeStatusBoard from '../components/EmployeeStatusBoard';
import ShiftApprovalList from '../components/ShiftApprovalList';
import ReportGenerator from '../components/ReportGenerator';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('status');
  const [employees, setEmployees] = useState([]);
  const [pendingShifts, setPendingShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch employees with their current status
      const employeesResponse = await axios.get('/api/users/employees');
      
      // Fetch pending shifts that need approval
      const shiftsResponse = await axios.get('/api/shifts/pending');
      
      setEmployees(employeesResponse.data);
      setPendingShifts(shiftsResponse.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
      setLoading(false);
    }
  };

  const handleShiftApproval = async (shiftId, isApproved) => {
    try {
      await axios.patch(`/api/shifts/${shiftId}/approve`, { approved: isApproved });
      
      // Update the pending shifts list
      setPendingShifts(prevShifts => 
        prevShifts.filter(shift => shift._id !== shiftId)
      );
    } catch (err) {
      console.error('Error approving/rejecting shift:', err);
      setError('Failed to process the shift. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{error}</span>
            <button 
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
              onClick={() => setError(null)}
            >
              <span className="sr-only">Dismiss</span>
              <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        
        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('status')}
              className={`${activeTab === 'status' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} 
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Employee Status
              {employees.filter(emp => emp.isActive).length > 0 && (
                <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  {employees.filter(emp => emp.isActive).length}
                </span>
              )}
            </button>
            
            <button
              onClick={() => setActiveTab('approval')}
              className={`${activeTab === 'approval' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} 
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Shift Approval
              {pendingShifts.length > 0 && (
                <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  {pendingShifts.length}
                </span>
              )}
            </button>
            
            <button
              onClick={() => setActiveTab('reports')}
              className={`${activeTab === 'reports' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} 
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Reports
            </button>
          </nav>
        </div>
        
        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {activeTab === 'status' && (
            <EmployeeStatusBoard employees={employees} />
          )}
          
          {activeTab === 'approval' && (
            <ShiftApprovalList 
              shifts={pendingShifts} 
              onApprove={(id) => handleShiftApproval(id, true)}
              onReject={(id) => handleShiftApproval(id, false)}
            />
          )}
          
          {activeTab === 'reports' && (
            <ReportGenerator />
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AdminDashboard;