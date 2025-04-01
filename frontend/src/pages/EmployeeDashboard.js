import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

// Components
import ClockInOutButton from '../components/ClockInOutButton';
import ShiftHistory from '../components/ShiftHistory';
import CurrentShiftTimer from '../components/CurrentShiftTimer';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [currentShift, setCurrentShift] = useState(null);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchShifts();
  }, []);

  const fetchShifts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/shifts/employee');
      
      // Sort shifts by date (newest first)
      const sortedShifts = response.data.sort((a, b) => 
        new Date(b.startTime) - new Date(a.startTime)
      );
      
      // Check if there's an active shift (no endTime)
      const active = sortedShifts.find(shift => !shift.endTime);
      
      setShifts(sortedShifts);
      setCurrentShift(active || null);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching shifts:', err);
      setError('Failed to load your shifts. Please try again.');
      setLoading(false);
    }
  };

  const handleClockIn = async () => {
    try {
      // Request camera access for verification
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      
      // Here you would typically:
      // 1. Take a snapshot from the video stream
      // 2. Upload the image to your server along with clock-in data
      // For this example, we'll just simulate it
      
      // Stop the camera stream after taking the snapshot
      stream.getTracks().forEach(track => track.stop());
      
      // Create a new shift
      const response = await axios.post('/api/shifts', {
        startTime: new Date(),
        // Include verification data like image URL, geolocation, etc.
      });
      
      setCurrentShift(response.data);
      fetchShifts(); // Refresh the shifts list
    } catch (err) {
      console.error('Error clocking in:', err);
      setError('Failed to clock in. Please try again.');
    }
  };

  const handleClockOut = async () => {
    if (!currentShift) return;
    
    try {
      // Similar to clock-in, you might want to capture verification data
      
      // Update the current shift with end time
      await axios.patch(`/api/shifts/${currentShift._id}`, {
        endTime: new Date(),
        // Include verification data
      });
      
      setCurrentShift(null);
      fetchShifts(); // Refresh the shifts list
    } catch (err) {
      console.error('Error clocking out:', err);
      setError('Failed to clock out. Please try again.');
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
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold mb-6">Employee Dashboard</h1>
        
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
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold mb-2">Welcome, {user?.firstName}!</h2>
              <p className="text-gray-600">
                {currentShift 
                  ? 'You are currently clocked in.' 
                  : 'You are not clocked in.'}
              </p>
            </div>
            
            <ClockInOutButton 
              isActive={!!currentShift}
              onClockIn={handleClockIn}
              onClockOut={handleClockOut}
            />
          </div>
          
          {currentShift && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-medium mb-2">Current Shift</h3>
              <CurrentShiftTimer startTime={currentShift.startTime} />
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Shifts</h2>
          <ShiftHistory shifts={shifts} />
        </div>
      </motion.div>
    </div>
  );
};

export default EmployeeDashboard;