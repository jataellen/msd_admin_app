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
  Divider,
  Tabs,
  Tab
} from '@mui/material';

// Material UI icons
import {
  ArrowBack as ArrowBackIcon,
  Timeline as TimelineIcon,
  History as HistoryIcon
} from '@mui/icons-material';

// Import custom components
import OrderTracking from '../components/OrderTracking';
import OrderHistoryTimeline from '../components/OrderHistoryTimeline';

const API_URL = 'http://localhost:8000';

// Tab panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`order-tabpanel-${index}`}
      aria-labelledby={`order-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const OrderTrackingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // State variables
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  
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
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Handle navigation back to orders list
  const handleBackToOrders = () => {
    navigate('/orders');
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
          Back to Orders
        </Button>
        
        <Typography variant="h4" component="h1" gutterBottom>
          Order Tracking: {order.order_name}
        </Typography>
        
        <Typography variant="subtitle1" color="text.secondary">
          Order #{order.order_id} • {order.type === 'MATERIALS_AND_INSTALLATION' ? 'Materials & Installation' : 'Materials Only'}
        </Typography>
      </Box>
      
      {/* Tabs */}
      <Paper sx={{ mb: 3 }} elevation={0} variant="outlined">
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          aria-label="order tracking tabs"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            icon={<TimelineIcon />} 
            label="Workflow Tracking" 
            id="order-tab-0" 
            aria-controls="order-tabpanel-0" 
            iconPosition="start"
          />
          <Tab 
            icon={<HistoryIcon />} 
            label="Order History" 
            id="order-tab-1" 
            aria-controls="order-tabpanel-1" 
            iconPosition="start"
          />
        </Tabs>
        
        <TabPanel value={tabValue} index={0}>
          <OrderTracking orderId={id} orderData={order} />
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <OrderHistoryTimeline orderId={id} />
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default OrderTrackingPage;