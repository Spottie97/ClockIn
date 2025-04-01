import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  IconButton, 
  Box, 
  Menu, 
  MenuItem, 
  Avatar, 
  Divider,
  Container
} from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleMenuClose();
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <AppBar position="static">
      <Container maxWidth="lg">
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography 
            variant="h6" 
            component={RouterLink} 
            to="/"
            sx={{ 
              textDecoration: 'none', 
              color: 'inherit', 
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            ClockIn
          </Typography>
          
          {/* Mobile menu button */}
          <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              size="large"
              edge="end"
              color="inherit"
              aria-label="menu"
              onClick={handleMobileMenuToggle}
            >
              <MenuIcon />
            </IconButton>
          </Box>
          
          {/* Desktop menu */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
            {user ? (
              <>
                <Typography variant="body1" sx={{ mr: 2 }}>
                  Hello, {user.firstName}
                </Typography>
                <IconButton
                  size="large"
                  edge="end"
                  aria-label="account of current user"
                  aria-controls="menu-appbar"
                  aria-haspopup="true"
                  onClick={handleProfileMenuOpen}
                  color="inherit"
                >
                  <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                    {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                  </Avatar>
                </IconButton>
                <Menu
                  id="menu-appbar"
                  anchorEl={anchorEl}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                >
                  <MenuItem onClick={() => { navigate('/profile'); handleMenuClose(); }}>
                    Profile
                  </MenuItem>
                  <MenuItem onClick={() => { navigate('/dashboard'); handleMenuClose(); }}>
                    Dashboard
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={handleLogout}>Logout</MenuItem>
                </Menu>
              </>
            ) : (
              <Box>
                <Button 
                  color="inherit" 
                  component={RouterLink} 
                  to="/login"
                  variant="outlined"
                  sx={{ mr: 1, borderColor: 'white', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}
                >
                  Login
                </Button>
                <Button 
                  color="secondary" 
                  component={RouterLink} 
                  to="/register"
                  variant="contained"
                >
                  Register
                </Button>
              </Box>
            )}
          </Box>
          
          {/* Mobile menu */}
          <Menu
            id="mobile-menu"
            anchorEl={document.getElementById('mobile-menu-button')}
            open={mobileMenuOpen}
            onClose={() => setMobileMenuOpen(false)}
            PaperProps={{
              sx: {
                width: '100%',
                maxWidth: '100%',
                top: '56px !important',
                left: '0 !important'
              }
            }}
          >
            {user ? (
              [
                <MenuItem key="profile" onClick={() => { navigate('/profile'); setMobileMenuOpen(false); }}>
                  Profile
                </MenuItem>,
                <MenuItem key="dashboard" onClick={() => { navigate('/dashboard'); setMobileMenuOpen(false); }}>
                  Dashboard
                </MenuItem>,
                <Divider key="divider" />,
                <MenuItem key="logout" onClick={() => { handleLogout(); setMobileMenuOpen(false); }}>
                  Logout
                </MenuItem>
              ]
            ) : (
              [
                <MenuItem key="login" onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}>
                  Login
                </MenuItem>,
                <MenuItem key="register" onClick={() => { navigate('/register'); setMobileMenuOpen(false); }}>
                  Register
                </MenuItem>
              ]
            )}
          </Menu>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;