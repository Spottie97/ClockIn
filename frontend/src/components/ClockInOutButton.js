import React from 'react';
import { Button } from '@mui/material';
import { AccessTime as ClockInIcon, ExitToApp as ClockOutIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';

const ClockInOutButton = ({ isActive, onClockIn, onClockOut }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Button
        variant="contained"
        color={isActive ? 'error' : 'success'}
        size="large"
        onClick={isActive ? onClockOut : onClockIn}
        startIcon={isActive ? <ClockOutIcon /> : <ClockInIcon />}
        sx={{
          py: 1.5,
          px: 3,
          fontWeight: 'bold',
          boxShadow: 3
        }}
      >
        {isActive ? 'Clock Out' : 'Clock In'}
      </Button>
    </motion.div>
  );
};

export default ClockInOutButton;