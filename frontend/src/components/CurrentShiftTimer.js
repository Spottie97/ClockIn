import React, { useState, useEffect } from 'react';

const CurrentShiftTimer = ({ startTime }) => {
  const [duration, setDuration] = useState('');

  useEffect(() => {
    const startDate = new Date(startTime);
    
    const updateTimer = () => {
      const now = new Date();
      const diffMs = now - startDate;
      
      // Calculate hours, minutes, seconds
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      
      // Format the duration string
      setDuration(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    };
    
    // Update immediately and then every second
    updateTimer();
    const intervalId = setInterval(updateTimer, 1000);
    
    return () => clearInterval(intervalId);
  }, [startTime]);

  return (
    <div className="flex items-center">
      <div className="mr-3">
        <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div>
        <p className="text-sm text-gray-500">Duration</p>
        <p className="text-2xl font-mono font-semibold">{duration}</p>
      </div>
    </div>
  );
};

export default CurrentShiftTimer;