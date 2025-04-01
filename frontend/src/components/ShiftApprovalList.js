import React, { useState } from 'react';

const ShiftApprovalList = ({ shifts, onApprove, onReject }) => {
  const [expandedShift, setExpandedShift] = useState(null);

  // Helper function to format date
  const formatDate = (dateString) => {
    const options = { 
      weekday: 'short',
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Helper function to calculate duration
  const calculateDuration = (startTime, endTime) => {
    if (!endTime) return 'In progress';
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end - start;
    
    // Calculate hours and minutes
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  if (shifts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No shifts pending approval.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Shifts Pending Approval</h2>
      
      <div className="space-y-4">
        {shifts.map((shift) => (
          <div key={shift._id} className="bg-white border rounded-lg overflow-hidden shadow-sm">
            <div className="p-4 flex justify-between items-center cursor-pointer" 
                 onClick={() => setExpandedShift(expandedShift === shift._id ? null : shift._id)}>
              <div>
                <h3 className="font-medium">{shift.employee.firstName} {shift.employee.lastName}</h3>
                <p className="text-sm text-gray-500">{formatDate(shift.startTime)} - {shift.endTime ? formatDate(shift.endTime) : 'In progress'}</p>
              </div>
              
              <div className="flex items-center">
                <span className="mr-4 text-sm font-medium text-gray-600">
                  {calculateDuration(shift.startTime, shift.endTime)}
                </span>
                
                <svg className={`w-5 h-5 text-gray-500 transform transition-transform ${expandedShift === shift._id ? 'rotate-180' : ''}`} 
                     fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            
            {expandedShift === shift._id && (
              <div className="border-t px-4 py-3 bg-gray-50">
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Verification Data</h4>
                  
                  {shift.verificationImage && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-1">Clock-in Photo</p>
                      <img 
                        src={shift.verificationImage} 
                        alt="Verification" 
                        className="h-32 w-32 object-cover rounded border"
                      />
                    </div>
                  )}
                  
                  {shift.location && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Location</p>
                      <p className="text-sm">
                        Lat: {shift.location.latitude}, Long: {shift.location.longitude}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => onApprove(shift._id)}
                    className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Approve
                  </button>
                  
                  <button
                    onClick={() => onReject(shift._id)}
                    className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Reject
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShiftApprovalList;