import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Alert, 
  AlertTitle, 
  IconButton, 
  CircularProgress
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
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
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box maxWidth="lg" sx={{ mx: 'auto' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Employee Dashboard
        </Typography>
        
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            action={
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={() => setError(null)}
              >
                <CloseIcon fontSize="inherit" />
              </IconButton>
            }
          >
            <AlertTitle>Error</AlertTitle>
            {error}
          </Alert>
        )}
        
        <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <Typography variant="h6" gutterBottom>
                Welcome, {user?.firstName}!
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {currentShift 
                  ? 'You are currently clocked in.' 
                  : 'You are not clocked in.'}
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
              <ClockInOutButton 
                isActive={!!currentShift}
                onClockIn={handleClockIn}
                onClockOut={handleClockOut}
              />
            </Grid>
          </Grid>
          
          {currentShift && (
            <Box sx={{ mt: 3, pt: 3, borderTop: 1, borderColor: 'divider' }}>
              <Typography variant="h6" gutterBottom>
                Current Shift
              </Typography>
              <CurrentShiftTimer startTime={currentShift.startTime} />
            </Box>
          )}
        </Paper>
        
        <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Recent Shifts
          </Typography>
          <ShiftHistory shifts={shifts} />
        </Paper>
      </motion.div>
    </Box>
  );
};

export default EmployeeDashboard;