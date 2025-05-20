// src/pages/QuickBooksCallback.js
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Button,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import { CheckCircleOutline as CheckCircleOutlineIcon } from '@mui/icons-material';

const API_URL = 'http://localhost:8000';

const QuickBooksCallback = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [companyId, setCompanyId] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Process the callback on component mount
  useEffect(() => {
    const processCallback = async () => {
      try {
        // Get the query parameters from the URL
        const queryParams = new URLSearchParams(location.search);
        const code = queryParams.get('code');
        const realmId = queryParams.get('realmId');
        const state = queryParams.get('state');
        
        // Validate required parameters
        if (!code || !realmId) {
          throw new Error('Missing required parameters in callback URL');
        }
        
        // Call the backend to process the callback
        const response = await axios.get(`${API_URL}/quickbooks/auth/callback`, {
          params: {
            code,
            realmId,
            state
          },
          withCredentials: true
        });
        
        // Handle the response
        if (response.data && response.data.company_id) {
          setCompanyId(response.data.company_id);
          setSuccess(true);
        } else {
          throw new Error('Invalid response from server');
        }
      } catch (err) {
        console.error('Error processing QuickBooks callback:', err);
        setError(err.response?.data?.detail || err.message || 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    processCallback();
  }, [location]);
  
  // Redirect to setup page after a delay if successful
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        navigate('/quickbooks/setup');
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [success, navigate]);
  
  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '50vh',
        textAlign: 'center',
        p: 3
      }}>
        <CircularProgress size={60} thickness={5} />
        <Typography variant="h6" sx={{ mt: 3 }}>
          Processing QuickBooks Authorization...
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Please wait while we complete the connection to your QuickBooks account.
        </Typography>
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={() => navigate('/quickbooks/setup')}
            >
              Return to Setup
            </Button>
          }
        >
          {error}
        </Alert>
        
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h5" color="error" gutterBottom>
            QuickBooks Authorization Failed
          </Typography>
          <Typography variant="body1" paragraph>
            We couldn't complete the connection to your QuickBooks account.
            Please try again or contact support if the problem persists.
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => navigate('/quickbooks/setup')}
            sx={{ mt: 2 }}
          >
            Return to QuickBooks Setup
          </Button>
        </Paper>
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Alert severity="success" sx={{ mb: 3 }}>
        QuickBooks authorization successful! You will be redirected to the setup page in a few seconds.
      </Alert>
      
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5" color="success.main" gutterBottom>
          QuickBooks Connection Successful!
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
          <CheckCircleOutlineIcon color="success" sx={{ fontSize: 80 }} />
        </Box>
        
        <Typography variant="body1" paragraph>
          Your QuickBooks account has been successfully connected.
          Company ID: <strong>{companyId}</strong>
        </Typography>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          You will be redirected to the QuickBooks setup page in a few seconds.
          If you're not redirected automatically, please click the button below.
        </Typography>
        
        <Stepper activeStep={2} sx={{ my: 3 }}>
          <Step completed>
            <StepLabel>Authorization Initiated</StepLabel>
          </Step>
          <Step completed>
            <StepLabel>Access Granted</StepLabel>
          </Step>
          <Step completed>
            <StepLabel>Connection Established</StepLabel>
          </Step>
        </Stepper>
        
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => navigate('/quickbooks/setup')}
          sx={{ mt: 2 }}
        >
          Go to QuickBooks Setup
        </Button>
      </Paper>
    </Box>
  );
};

export default QuickBooksCallback;