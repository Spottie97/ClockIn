import React from 'react';

const Footer = () => {
  const year = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-800 text-white py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h2 className="text-xl font-bold">ClockIn</h2>
            <p className="text-gray-400">Modern Time Tracking System</p>
          </div>
          
          <div className="text-center md:text-right">
            <p>&copy; {year} ClockIn. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;