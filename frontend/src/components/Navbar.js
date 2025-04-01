import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-blue-600 text-white shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-xl font-bold">ClockIn</Link>
          
          {user ? (
            <div className="flex items-center space-x-4">
              <span>Hello, {user.firstName}</span>
              <button 
                onClick={handleLogout}
                className="bg-white text-blue-600 px-4 py-2 rounded hover:bg-gray-100 transition"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="space-x-2">
              <Link 
                to="/login" 
                className="bg-white text-blue-600 px-4 py-2 rounded hover:bg-gray-100 transition"
              >
                Login
              </Link>
              <Link 
                to="/register" 
                className="bg-transparent border border-white text-white px-4 py-2 rounded hover:bg-white hover:text-blue-600 transition"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;