import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Chip,
  Box
} from '@mui/material';

const ShiftHistory = ({ shifts }) => {
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

  // Helper function to get status chip
  const getStatusChip = (status) => {
    switch(status) {
      case 'approved':
        return <Chip label="Approved" color="success" size="small" />;
      case 'rejected':
        return <Chip label="Rejected" color="error" size="small" />;
      case 'pending':
        return <Chip label="Pending" color="warning" size="small" />;
      default:
        return <Chip label="Unknown" color="default" size="small" />;
    }
  };

  if (shifts.length === 0) {
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">
          No shifts recorded yet.
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} elevation={0} sx={{ mt: 2 }}>
      <Table sx={{ minWidth: 650 }} size="medium">
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Clock In</TableCell>
            <TableCell>Clock Out</TableCell>
            <TableCell>Duration</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {shifts.map((shift) => (
            <TableRow 
              key={shift._id} 
              hover
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
              <TableCell component="th" scope="row">
                {new Date(shift.startTime).toLocaleDateString()}
              </TableCell>
              <TableCell>{formatDate(shift.startTime)}</TableCell>
              <TableCell>{shift.endTime ? formatDate(shift.endTime) : '—'}</TableCell>
              <TableCell>{calculateDuration(shift.startTime, shift.endTime)}</TableCell>
              <TableCell>{getStatusChip(shift.status)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ShiftHistory;