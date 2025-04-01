import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Container, Box, Typography, Button, Paper } from '@mui/material';
import { motion } from 'framer-motion';

const NotFound = () => {
  return (
    <Container component="main" maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          style={{ width: '100%', textAlign: 'center' }}
        >
          <Paper elevation={3} sx={{ py: 6, px: 4, borderRadius: 2 }}>
            <Typography variant="h1" color="primary" sx={{ fontSize: '8rem', fontWeight: 800 }}>
              404
            </Typography>
            <Typography variant="h4" component="h2" gutterBottom sx={{ mt: 2, fontWeight: 600 }}>
              Page Not Found
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              The page you're looking for doesn't exist or has been moved.
            </Typography>
            <Button
              component={RouterLink}
              to="/"
              variant="contained"
              size="large"
              sx={{ mt: 2 }}
            >
              Go back home
            </Button>
          </Paper>
        </motion.div>
      </Box>
    </Container>
  );
};

export default NotFound;