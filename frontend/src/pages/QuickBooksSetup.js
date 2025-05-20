// src/pages/QuickBooksSetup.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Grid,
  Card,
  CardContent,
  CardActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';

import {
  Sync as SyncIcon,
  Link as LinkIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  Settings as SettingsIcon,
  AccountBox as AccountBoxIcon,
  VpnKey as VpnKeyIcon,
  LockOpen as LockOpenIcon,
  Storage as StorageIcon
} from '@mui/icons-material';

const API_URL = 'http://localhost:8000';

const QuickBooksSetup = () => {
  const [connectionStatus, setConnectionStatus] = useState({
    is_connected: false,
    has_refresh_token: false,
    has_realm_id: false,
    company_name: null,
    last_products_sync: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authUrl, setAuthUrl] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  
  // Fetch connection status on component mount
  useEffect(() => {
    checkConnectionStatus();
  }, []);
  
  // Determine active step based on connection status
  useEffect(() => {
    if (connectionStatus.is_connected) {
      setActiveStep(2); // Connected
    } else if (connectionStatus.has_refresh_token || connectionStatus.has_realm_id) {
      setActiveStep(1); // Partially connected
    } else {
      setActiveStep(0); // Not connected
    }
  }, [connectionStatus]);
  
  // Check QuickBooks connection status
  const checkConnectionStatus = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_URL}/quickbooks/connection/status`, {
        withCredentials: true
      });
      
      setConnectionStatus(response.data);
    } catch (err) {
      console.error('Error checking QuickBooks connection:', err);
      setError('Failed to check QuickBooks connection status. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Get QuickBooks authorization URL
  const getAuthUrl = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_URL}/quickbooks/auth/url`, {
        withCredentials: true
      });
      
      if (response.data && response.data.auth_url) {
        setAuthUrl(response.data.auth_url);
      } else {
        throw new Error('Failed to get QuickBooks authorization URL');
      }
    } catch (err) {
      console.error('Error getting QuickBooks auth URL:', err);
      setError('Failed to get QuickBooks authorization URL. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle authentication with QuickBooks
  const handleAuthenticate = async () => {
    await getAuthUrl();
    
    if (authUrl) {
      // Open QuickBooks authorization page in a new window
      window.open(authUrl, '_blank');
    }
  };
  
  // Handle reconnecting with QuickBooks
  const handleReconnect = () => {
    setConfirmDialogOpen(true);
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  return (
    <Box sx={{ maxWidth: '100%', overflowX: 'auto', pb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          QuickBooks Integration Setup
        </Typography>
        
        <Button 
          variant="outlined" 
          color="primary" 
          startIcon={<SyncIcon />}
          onClick={checkConnectionStatus}
          disabled={loading}
        >
          Refresh Status
        </Button>
      </Box>
      
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={checkConnectionStatus}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}
      
      {/* Connection Status Card */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <SettingsIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">
              QuickBooks Connection Status
            </Typography>
          </Box>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  height: '100%',
                  p: 2,
                  borderRadius: 1,
                  bgcolor: connectionStatus.is_connected ? 'success.50' : 'grey.100'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    {connectionStatus.is_connected ? (
                      <CheckIcon sx={{ color: 'success.main', mr: 1 }} />
                    ) : (
                      <ErrorIcon sx={{ color: 'error.main', mr: 1 }} />
                    )}
                    <Typography variant="subtitle1" fontWeight="medium">
                      Connection Status: {connectionStatus.is_connected ? 'Connected' : 'Not Connected'}
                    </Typography>
                  </Box>
                  
                  {connectionStatus.company_name && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <AccountBoxIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                      <Typography variant="body2">
                        Connected to: <strong>{connectionStatus.company_name}</strong>
                      </Typography>
                    </Box>
                  )}
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <VpnKeyIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                    <Typography variant="body2">
                      OAuth Refresh Token: {connectionStatus.has_refresh_token ? (
                        <span style={{ color: 'green' }}>Available</span>
                      ) : (
                        <span style={{ color: 'red' }}>Missing</span>
                      )}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <StorageIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                    <Typography variant="body2">
                      Company ID: {connectionStatus.has_realm_id ? (
                        <span style={{ color: 'green' }}>Available</span>
                      ) : (
                        <span style={{ color: 'red' }}>Missing</span>
                      )}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                    Last Sync Information
                  </Typography>
                  
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2">
                      <strong>Products Last Sync:</strong> {formatDate(connectionStatus.last_products_sync)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mt: 'auto', pt: 2 }}>
                    {connectionStatus.is_connected ? (
                      <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<LinkIcon />}
                        onClick={handleReconnect}
                      >
                        Reconnect with QuickBooks
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<LinkIcon />}
                        onClick={handleAuthenticate}
                        disabled={loading}
                      >
                        Connect with QuickBooks
                      </Button>
                    )}
                  </Box>
                </Box>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>
      
      {/* Setup Process Stepper */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          QuickBooks Integration Setup Process
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        <Stepper activeStep={activeStep} orientation="vertical">
          <Step>
            <StepLabel>Connect with QuickBooks</StepLabel>
            <StepContent>
              <Typography variant="body2" color="text.secondary" paragraph>
                To integrate with QuickBooks, you need to authorize this application to access your QuickBooks data.
                Click the button below to start the authorization process.
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleAuthenticate}
                  disabled={loading}
                  sx={{ mt: 1, mr: 1 }}
                >
                  Connect with QuickBooks
                </Button>
              </Box>
            </StepContent>
          </Step>
          
          <Step>
            <StepLabel>Complete Authorization</StepLabel>
            <StepContent>
              <Typography variant="body2" color="text.secondary" paragraph>
                After clicking "Connect with QuickBooks", you'll be redirected to the QuickBooks authorization page.
                Follow the prompts to grant access to your QuickBooks account.
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Once you've authorized access, you'll be redirected back to this application.
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Button
                  variant="contained"
                  onClick={checkConnectionStatus}
                  sx={{ mt: 1, mr: 1 }}
                >
                  Check Authorization Status
                </Button>
              </Box>
            </StepContent>
          </Step>
          
          <Step>
            <StepLabel>Start Using QuickBooks Integration</StepLabel>
            <StepContent>
              <Typography variant="body2" color="text.secondary" paragraph>
                Your QuickBooks account is now connected! You can now:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <CheckIcon color="success" />
                  </ListItemIcon>
                  <ListItemText primary="View and sync your QuickBooks products" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckIcon color="success" />
                  </ListItemIcon>
                  <ListItemText primary="Generate invoices in QuickBooks from your orders" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckIcon color="success" />
                  </ListItemIcon>
                  <ListItemText primary="View your invoices and payment status" />
                </ListItem>
              </List>
              <Box sx={{ mb: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  href="/quickbooks/products"
                  sx={{ mt: 1, mr: 1 }}
                >
                  View QuickBooks Products
                </Button>
              </Box>
            </StepContent>
          </Step>
        </Stepper>
      </Paper>
      
      {/* Permissions Card */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Required QuickBooks Permissions
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Typography variant="body2" paragraph>
          This integration requires the following permissions from your QuickBooks account:
        </Typography>
        
        <List>
          <ListItem>
            <ListItemIcon>
              <StorageIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Accounting" 
              secondary="Read and write access to invoices, products, customers, and payments" 
            />
          </ListItem>
        </List>
        
        <Alert severity="info" sx={{ mt: 2 }}>
          Your QuickBooks data remains secure. This application only accesses the data necessary for integration purposes.
          You can revoke access at any time from your QuickBooks account settings.
        </Alert>
      </Paper>
      
      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
      >
        <DialogTitle>Reconnect with QuickBooks?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You are already connected to QuickBooks. Reconnecting will require you to go through the authorization process again.
            Are you sure you want to reconnect?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={() => {
              setConfirmDialogOpen(false);
              handleAuthenticate();
            }} 
            color="primary"
          >
            Reconnect
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QuickBooksSetup;