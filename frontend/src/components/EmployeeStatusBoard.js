import React from 'react';

const EmployeeStatusBoard = ({ employees }) => {
  // Group employees by department
  const departmentGroups = employees.reduce((groups, employee) => {
    const dept = employee.department || 'Unassigned';
    if (!groups[dept]) {
      groups[dept] = [];
    }
    groups[dept].push(employee);
    return groups;
  }, {});

  // Sort departments alphabetically
  const sortedDepartments = Object.keys(departmentGroups).sort();

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Employee Status</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sortedDepartments.map(department => (
          <div key={department} className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium mb-3 border-b pb-2">{department}</h3>
            
            <ul className="space-y-3">
              {departmentGroups[department].map(employee => (
                <li key={employee._id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="relative">
                      {/* Employee avatar or initials */}
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-semibold">
                        {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                      </div>
                      
                      {/* Status indicator */}
                      <span className={`absolute bottom-0 right-0 block h-3 w-3 rounded-full ring-2 ring-white ${employee.isActive ? 'bg-green-400' : 'bg-gray-300'}`}></span>
                    </div>
                    
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{employee.firstName} {employee.lastName}</p>
                      <p className="text-xs text-gray-500">{employee.jobTitle || 'Employee'}</p>
                    </div>
                  </div>
                  
                  <div>
                    {employee.isActive ? (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        Inactive
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmployeeStatusBoard;