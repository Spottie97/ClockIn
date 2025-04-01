import React, { useState, useEffect } from 'react';
import { Box, Typography, Stack } from '@mui/material';
import { Timer as TimerIcon } from '@mui/icons-material';

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
    <Stack direction="row" spacing={2} alignItems="center">
      <TimerIcon color="primary" fontSize="large" />
      <Box>
        <Typography variant="caption" color="text.secondary">
          Duration
        </Typography>
        <Typography 
          variant="h4" 
          component="div" 
          fontFamily="monospace" 
          fontWeight="medium"
          sx={{ letterSpacing: 1 }}
        >
          {duration}
        </Typography>
      </Box>
    </Stack>
  );
};

export default CurrentShiftTimer;