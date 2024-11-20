// src/components/Navbar.js
import React, { useState, useEffect } from 'react';
import {
  AppBar, Toolbar, Typography, Button, IconButton, Drawer, List, ListItem, ListItemIcon,
  ListItemText, Badge, Menu, MenuItem, Box, Avatar, Divider, useMediaQuery
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import NotificationsIcon from '@mui/icons-material/Notifications';
import LogoutIcon from '@mui/icons-material/Logout';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Navbar() {
  const [openDrawer, setOpenDrawer] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [avatarMenuAnchor, setAvatarMenuAnchor] = useState(null); // for avatar dropdown
  const isSmallScreen = useMediaQuery('(max-width:600px)');
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const authData = JSON.parse(localStorage.getItem('authData'));
  const userInitials = authData 
    ? `${authData.firstName[0] || ''}${authData.lastName[0] || ''}`.toUpperCase()
    : '';

  const handleDrawerOpen = () => setOpenDrawer(true);
  const handleDrawerClose = () => setOpenDrawer(false);
  const handleLogout = () => {
    logout();
    setAvatarMenuAnchor(null); // Close the dropdown after logout
  };

  const handleNotificationClick = (event) => setAnchorEl(event.currentTarget);
  const handleNotificationClose = () => setAnchorEl(null);
  const handleClearNotifications = () => {
    setNotifications([]);
    handleNotificationClose();
  };

  const handleReportNavigation = (type) => {
    navigate(`/user-report?type=${type}`);
    handleDrawerClose();
  };

  const handleAvatarClick = (event) => setAvatarMenuAnchor(event.currentTarget);
  const handleAvatarMenuClose = () => setAvatarMenuAnchor(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (authData && authData.id) {
        try {
          const response = await fetch(`/api/notifications/${authData.id}`);
          const data = await response.json();
          setNotifications(data.notifications);
        } catch (error) {
          console.error('Error fetching notifications:', error);
        }
      }
    };
    fetchNotifications();
  }, [authData]);

  return (
    <React.Fragment>
      <AppBar position="static" sx={{ backgroundColor: '#1976d2', padding: '0 20px' }}>
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton edge="start" color="inherit" aria-label="menu" onClick={handleDrawerOpen} sx={{ mr: 1 }}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Report Application
            </Typography>
          </Box>

          {!isSmallScreen && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Button color="inherit" component={Link} to="/" sx={{ mx: 1 }}>
                <HomeIcon sx={{ mr: 0.5 }} />
                Home
              </Button>
              <Button color="inherit" onClick={() => handleReportNavigation('complaint')} sx={{ mx: 1 }}>
                <ReportProblemIcon sx={{ mr: 0.5 }} />
                Complaint
              </Button>
              <Button color="inherit" onClick={() => handleReportNavigation('emergency')} sx={{ mx: 1 }}>
                <LocalHospitalIcon sx={{ mr: 0.5 }} />
                Emergency
              </Button>
              <IconButton color="inherit" onClick={handleNotificationClick} sx={{ mx: 1 }}>
                <Badge badgeContent={notifications.length} color="secondary">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleNotificationClose}
              >
                {notifications.length === 0 ? (
                  <MenuItem>No new notifications</MenuItem>
                ) : (
                  notifications.map((notification) => (
                    <MenuItem key={notification.id}>{notification.message}</MenuItem>
                  ))
                )}
                <MenuItem onClick={handleClearNotifications}>Clear all</MenuItem>
              </Menu>
              {isAuthenticated && (
                <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                  <Avatar
                    sx={{ bgcolor: 'secondary.main', cursor: 'pointer' }}
                    onClick={handleAvatarClick} // Open dropdown on avatar click
                  >
                    {userInitials}
                  </Avatar>
                  <Menu
                    anchorEl={avatarMenuAnchor}
                    open={Boolean(avatarMenuAnchor)}
                    onClose={handleAvatarMenuClose}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'right',
                    }}
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                  >
                    <MenuItem onClick={handleLogout}>
                      <LogoutIcon sx={{ mr: 1 }} />
                      Logout
                    </MenuItem>
                  </Menu>
                </Box>
              )}
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Drawer anchor="left" open={openDrawer} onClose={handleDrawerClose}>
        <Box sx={{ width: 250 }} role="presentation">
          <List>
            <ListItem button component={Link} to="/" onClick={handleDrawerClose}>
              <ListItemIcon>
                <HomeIcon />
              </ListItemIcon>
              <ListItemText primary="Home" />
            </ListItem>
            <Divider />
            <ListItem button onClick={() => handleReportNavigation('complaint')}>
              <ListItemIcon>
                <ReportProblemIcon />
              </ListItemIcon>
              <ListItemText primary="Complaint Report" />
            </ListItem>
            <ListItem button onClick={() => handleReportNavigation('emergency')}>
              <ListItemIcon>
                <LocalHospitalIcon />
              </ListItemIcon>
              <ListItemText primary="Emergency Report" />
            </ListItem>
            <Divider />
            <ListItem button onClick={handleNotificationClick}>
              <ListItemIcon>
                <NotificationsIcon />
              </ListItemIcon>
              <ListItemText primary="Notifications" />
              <Badge badgeContent={notifications.length} color="secondary" />
            </ListItem>
            <ListItem onClick={handleLogout}>
               <ListItemIcon>
                 <LogoutIcon />
               </ListItemIcon>
               <ListItemText primary="Logout" />
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </React.Fragment>
  );
}

export default Navbar;
