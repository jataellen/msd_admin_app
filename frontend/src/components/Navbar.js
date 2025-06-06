// src/components/Navbar.js - Updated with QuickBooks navigation
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Material UI imports
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box,
  Avatar,
  IconButton,
  useTheme,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Menu,
  MenuItem,
  Tooltip,
  Collapse,
  ListItemButton
} from '@mui/material';

// Material UI icons
import {
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  AccountCircle as AccountCircleIcon,
  Settings as SettingsIcon,
  Assignment as AssignmentIcon,
  BusinessCenter as BusinessCenterIcon,
  Description as DescriptionIcon,
  Receipt as ReceiptIcon,
  ShoppingCart as ShoppingCartIcon,
  People as PeopleIcon,
  SyncAlt as SyncAltIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  HomeRepairService as BuildIcon,
  Inventory2 as InventoryIcon
} from '@mui/icons-material';

// Sidebar/Drawer component
const Sidebar = ({ open, onClose }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  
  // State for nested menu items
  const [quickbooksOpen, setQuickbooksOpen] = useState(false);
  
  const handleQuickbooksToggle = () => {
    setQuickbooksOpen(!quickbooksOpen);
  };
  
  const handleNavigation = (path) => {
    navigate(path);
    onClose();
  };
  
  return (
    <Drawer anchor="left" open={open} onClose={onClose}>
      <Box sx={{ width: 280 }} role="presentation">
        {isAuthenticated && user && (
          <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', bgcolor: 'primary.dark', color: 'white' }}>
            <Avatar sx={{ mb: 1, bgcolor: 'secondary.main', width: 60, height: 60 }}>
              {user.first_name ? user.first_name[0] : user.email[0].toUpperCase()}
            </Avatar>
            <Typography variant="subtitle1">
              {user.first_name || user.email.split('@')[0]}
            </Typography>
            <Typography variant="body2" color="white" sx={{ opacity: 0.8 }}>
              {user.email}
            </Typography>
          </Box>
        )}
        
        <Divider />
        
        <List>
          {isAuthenticated ? (
            <>
              <ListItem button onClick={() => handleNavigation('/')} sx={{ py: 1.5 }}>
                <ListItemIcon>
                  <DashboardIcon />
                </ListItemIcon>
                <ListItemText primary="Dashboard" />
              </ListItem>
              
              <Divider />
              
              <ListItem sx={{ pt: 2, pb: 1 }}>
                <ListItemText 
                  primary="CRM Workflow" 
                  primaryTypographyProps={{ 
                    variant: 'overline',
                    color: 'text.secondary',
                    fontWeight: 'bold'
                  }} 
                />
              </ListItem>
              
              <ListItem button onClick={() => handleNavigation('/tasks')}>
                <ListItemIcon>
                  <AssignmentIcon />
                </ListItemIcon>
                <ListItemText primary="Tasks" />
              </ListItem>
              
              <ListItem button onClick={() => handleNavigation('/orders')}>
                <ListItemIcon>
                  <BusinessCenterIcon />
                </ListItemIcon>
                <ListItemText primary="Orders" />
              </ListItem>
              
              <ListItem button onClick={() => handleNavigation('/quotes')}>
                <ListItemIcon>
                  <DescriptionIcon />
                </ListItemIcon>
                <ListItemText primary="Quotes" />
              </ListItem>
              
              <ListItem button onClick={() => handleNavigation('/purchase-orders')}>
                <ListItemIcon>
                  <ShoppingCartIcon />
                </ListItemIcon>
                <ListItemText primary="Purchase Orders" />
              </ListItem>
              
              <ListItem button onClick={() => handleNavigation('/invoices')}>
                <ListItemIcon>
                  <ReceiptIcon />
                </ListItemIcon>
                <ListItemText primary="Invoices" />
              </ListItem>
              
              <Divider />
              
              <ListItem sx={{ pt: 2, pb: 1 }}>
                <ListItemText 
                  primary="Contacts" 
                  primaryTypographyProps={{ 
                    variant: 'overline',
                    color: 'text.secondary',
                    fontWeight: 'bold'
                  }} 
                />
              </ListItem>
              
              <ListItem button onClick={() => handleNavigation('/customers')}>
                <ListItemIcon>
                  <PeopleIcon />
                </ListItemIcon>
                <ListItemText primary="Customers" />
              </ListItem>
              
              <ListItem button onClick={() => handleNavigation('/employees')}>
                <ListItemIcon>
                  <PersonIcon />
                </ListItemIcon>
                <ListItemText primary="Employees" />
              </ListItem>
              
              <Divider />
              
              <ListItem sx={{ pt: 2, pb: 1 }}>
                <ListItemText 
                  primary="Integrations" 
                  primaryTypographyProps={{ 
                    variant: 'overline',
                    color: 'text.secondary',
                    fontWeight: 'bold'
                  }} 
                />
              </ListItem>
              
              {/* QuickBooks Section with Sub-menu */}
              <ListItemButton onClick={handleQuickbooksToggle}>
                <ListItemIcon>
                  <SyncAltIcon />
                </ListItemIcon>
                <ListItemText primary="QuickBooks" />
                {quickbooksOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </ListItemButton>
              
              <Collapse in={quickbooksOpen} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  <ListItemButton 
                    sx={{ pl: 4 }} 
                    onClick={() => handleNavigation('/quickbooks/setup')}
                  >
                    <ListItemIcon>
                      <BuildIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Setup & Connection" />
                  </ListItemButton>
                  
                  <ListItemButton 
                    sx={{ pl: 4 }} 
                    onClick={() => handleNavigation('/quickbooks/products')}
                  >
                    <ListItemIcon>
                      <InventoryIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Products" />
                  </ListItemButton>
                  
                  <ListItemButton 
                    sx={{ pl: 4 }} 
                    onClick={() => handleNavigation('/quickbooks')}
                  >
                    <ListItemIcon>
                      <SyncAltIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Legacy Dashboard" />
                  </ListItemButton>
                </List>
              </Collapse>
              
              <Divider />
              
              <ListItem button onClick={logout}>
                <ListItemIcon>
                  <LogoutIcon />
                </ListItemIcon>
                <ListItemText primary="Logout" />
              </ListItem>
            </>
          ) : (
            <>
              <ListItem button onClick={() => handleNavigation('/login')}>
                <ListItemIcon>
                  <LoginIcon />
                </ListItemIcon>
                <ListItemText primary="Login" />
              </ListItem>
            </>
          )}
        </List>
      </Box>
    </Drawer>
  );
};

const Navbar = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const theme = useTheme();
  
  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };
  
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleLogout = () => {
    handleMenuClose();
    logout();
  };
  
  return (
    <>
      <AppBar position="static" elevation={2}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
            onClick={toggleDrawer(true)}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography 
            variant="h6" 
            component={Link} 
            to="/" 
            sx={{ flexGrow: 1, textDecoration: 'none', color: 'inherit', fontWeight: 'bold' }}
          >
            MSD Admin
          </Typography>
          
          {isAuthenticated ? (
            <>
              <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
                <Button color="inherit" component={Link} to="/" sx={{ mr: 1 }}>
                  Dashboard
                </Button>
                <Button color="inherit" component={Link} to="/tasks" sx={{ mr: 1 }}>
                  Tasks
                </Button>
                <Button color="inherit" component={Link} to="/orders" sx={{ mr: 1 }}>
                  Orders
                </Button>
                <Button color="inherit" component={Link} to="/customers" sx={{ mr: 1 }}>
                  Customers
                </Button>
                <Button color="inherit" component={Link} to="/quickbooks/products" sx={{ mr: 1 }}>
                  QuickBooks Products
                </Button>
              </Box>
              
              <Tooltip title="Account menu">
                <IconButton
                  color="inherit"
                  onClick={handleMenuOpen}
                  sx={{ ml: 1 }}
                  aria-controls="user-menu"
                  aria-haspopup="true"
                >
                  {user ? (
                    <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.secondary.main }}>
                      {user.first_name ? user.first_name[0] : user.email[0].toUpperCase()}
                    </Avatar>
                  ) : (
                    <AccountCircleIcon />
                  )}
                </IconButton>
              </Tooltip>
              
              <Menu
                id="user-menu"
                anchorEl={anchorEl}
                keepMounted
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
              >
                <MenuItem disabled>
                  <Typography variant="body2" color="text.secondary">
                    Signed in as {user?.email || 'User'}
                  </Typography>
                </MenuItem>
                <Divider />
                <MenuItem component={Link} to="/profile" onClick={handleMenuClose}>
                  <ListItemIcon>
                    <AccountCircleIcon fontSize="small" />
                  </ListItemIcon>
                  Profile
                </MenuItem>
                <MenuItem component={Link} to="/settings" onClick={handleMenuClose}>
                  <ListItemIcon>
                    <SettingsIcon fontSize="small" />
                  </ListItemIcon>
                  Settings
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  Logout
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Button color="inherit" component={Link} to="/login">
              Login
            </Button>
          )}
        </Toolbar>
      </AppBar>
      
      <Sidebar open={drawerOpen} onClose={toggleDrawer(false)} />
    </>
  );
};

export default Navbar;