import React from 'react';
import { Box, Container, Typography, Grid, Link } from '@mui/material';

const Footer = () => {
  const year = new Date().getFullYear();
  
  return (
    <Box component="footer" sx={{ bgcolor: 'primary.dark', color: 'white', py: 3, mt: 'auto' }}>
      <Container maxWidth="lg">
        <Grid container spacing={3} justifyContent="space-between" alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
              ClockIn
            </Typography>
            <Typography variant="body2" color="rgba(255,255,255,0.7)">
              Modern Time Tracking System
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
            <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, mb: 2 }}>
              <Link href="#" color="inherit" sx={{ mx: 1 }}>Privacy</Link>
              <Link href="#" color="inherit" sx={{ mx: 1 }}>Terms</Link>
              <Link href="#" color="inherit" sx={{ mx: 1 }}>Support</Link>
            </Box>
            <Typography variant="body2">
              &copy; {year} ClockIn. All rights reserved.
            </Typography>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Footer;