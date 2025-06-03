// OrderTrackingPage.js - React component for the order tracking view
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';

// Material UI icons
import {
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';

// Import custom component
import CombinedOrderTracking from './CombinedOrderTracking';

const API_URL = 'http://localhost:8000';

const OrderTrackingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // State variables
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch order data
  useEffect(() => {
    const fetchOrderData = async () => {
      if (!id) {
        setError('No order ID provided');
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const response = await axios.get(`${API_URL}/orders/${id}`, {
          withCredentials: true
        });
        
        if (response.data && response.data.order) {
          setOrder(response.data.order);
        } else {
          setError('Order data not found');
        }
      } catch (err) {
        console.error('Error fetching order data:', err);
        setError('Failed to load order data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrderData();
  }, [id]);
  
  // Handle navigation back to orders list
  const handleBackToOrders = () => {
    navigate('/order-tracking');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Alert 
        severity="error" 
        sx={{ mt: 2 }}
        action={
          <Button color="inherit" size="small" onClick={handleBackToOrders}>
            Back to Orders
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }
  
  if (!order) {
    return (
      <Alert 
        severity="warning" 
        sx={{ mt: 2 }}
        action={
          <Button color="inherit" size="small" onClick={handleBackToOrders}>
            Back to Orders
          </Button>
        }
      >
        Order not found.
      </Alert>
    );
  }
  
  return (
    <Box sx={{ maxWidth: '100%' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBackToOrders}
          sx={{ mb: 2 }}
        >
          Back to Order Tracking
        </Button>
        
        <Typography variant="h4" component="h1" gutterBottom>
          Order Tracking: {order.order_name || `Order #${order.order_id}`}
        </Typography>
        
        <Typography variant="subtitle1" color="text.secondary">
          Order #{order.order_id} • {order.type === 'MATERIALS_AND_INSTALLATION' ? 'Materials & Installation' : 'Materials Only'}
        </Typography>
      </Box>
      
      {/* Combined Order Tracking Component */}
      <Paper sx={{ mb: 3 }} elevation={0} variant="outlined">
        <Box sx={{ p: 3 }}>
          <CombinedOrderTracking orderId={parseInt(id)} orderData={order} />
        </Box>
      </Paper>
    </Box>
  );
};

export default OrderTrackingPage;