// src/pages/QuickBooksInvoiceGenerator.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

// Material UI imports
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Chip
} from '@mui/material';

// Material UI icons
import {
  Receipt as ReceiptIcon,
  CheckCircle as CheckCircleIcon,
  NavigateBefore as BackIcon
} from '@mui/icons-material';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const QuickBooksInvoiceGenerator = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // State variables
  const [order, setOrder] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  
  // Fetch order data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch order details
        const response = await axios.get(`${API_URL}/orders/${id}`, {
          withCredentials: true
        });
        
        // Set state with response data
        setOrder(response.data.order);
        setCustomer(response.data.customer);
      } catch (err) {
        console.error('Error fetching order details:', err);
        setError('Failed to load order details. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);
  
  // Handle invoice generation
  const handleGenerateInvoice = async () => {
    setGenerating(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await axios.post(
        `${API_URL}/quickbooks/push/invoice/${id}`,
        {},
        { withCredentials: true }
      );
      
      setResult(response.data);
    } catch (err) {
      console.error('Error generating invoice:', err);
      setError(err.response?.data?.detail || 'Failed to generate invoice. Please try again.');
    } finally {
      setGenerating(false);
    }
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return 'N/A';
    return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error && !order) {
    return (
      <Alert 
        severity="error" 
        sx={{ mt: 2 }}
        action={
          <Button 
            color="inherit" 
            size="small" 
            onClick={() => navigate('/orders')}
          >
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
          <Button 
            color="inherit" 
            size="small" 
            onClick={() => navigate('/orders')}
          >
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
      <Typography variant="h4" component="h1" gutterBottom>
        Generate QuickBooks Invoice
      </Typography>
      
      <Button
        variant="outlined"
        startIcon={<BackIcon />}
        onClick={() => navigate(`/orders/${id}`)}
        sx={{ mb: 3 }}
      >
        Back to Order
      </Button>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Order Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <List disablePadding>
              <ListItem disableGutters divider>
                <ListItemText primary="Order Name" secondary={order.order_name} />
              </ListItem>
              <ListItem disableGutters divider>
                <ListItemText primary="Order ID" secondary={order.order_id} />
              </ListItem>
              <ListItem disableGutters divider>
                <ListItemText primary="Status" />
                <Chip 
                  label={order.status} 
                  color={order.status === 'Completed' ? 'success' : 'primary'}
                  size="small"
                />
              </ListItem>
              <ListItem disableGutters divider>
                <ListItemText primary="Customer" secondary={customer ? (customer.company_name || `${customer.first_name} ${customer.last_name}`) : 'N/A'} />
              </ListItem>
              <ListItem disableGutters>
                <ListItemText primary="Budget" secondary={formatCurrency(order.budget)} />
              </ListItem>
            </List>
            
            {customer && !customer.quickbooks_customer_id && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                This customer is not linked to QuickBooks. Please link the customer in QuickBooks integration page first.
              </Alert>
            )}
          </Paper>
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<ReceiptIcon />}
            fullWidth
            onClick={handleGenerateInvoice}
            disabled={generating || !customer || !customer.quickbooks_customer_id}
            sx={{ py: 1.5 }}
          >
            {generating ? <CircularProgress size={24} /> : 'Generate QuickBooks Invoice'}
          </Button>
        </Grid>
        
        <Grid item xs={12} md={6}>
          {result ? (
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                  <Typography variant="h6" color="success.main">
                    Invoice Successfully Created
                  </Typography>
                </Box>
                
                <Divider sx={{ mb: 2 }} />
                
                <List>
                  <ListItem disableGutters divider>
                    <ListItemText primary="Invoice ID" secondary={result.invoice_id} />
                  </ListItem>
                  <ListItem disableGutters divider>
                    <ListItemText primary="Invoice Number" secondary={result.invoice_number} />
                  </ListItem>
                  <ListItem disableGutters>
                    <ListItemText primary="Total Amount" secondary={formatCurrency(result.total_amount)} />
                  </ListItem>
                </List>
                
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  {result.message}
                </Typography>
                
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate(`/orders/${id}`)}
                  >
                    Back to Order
                  </Button>
                  
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => navigate('/quickbooks')}
                  >
                    Go to QuickBooks
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  QuickBooks Invoice Generation
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Typography variant="body1" paragraph>
                  Generate an invoice in QuickBooks for this order. This will:
                </Typography>
                
                <List sx={{ listStyleType: 'disc', pl: 4 }}>
                  <ListItem sx={{ display: 'list-item', p: 0 }}>
                    <Typography variant="body2">
                      Create a new invoice in QuickBooks with all order details
                    </Typography>
                  </ListItem>
                  <ListItem sx={{ display: 'list-item', p: 0 }}>
                    <Typography variant="body2">
                      Link to the customer's QuickBooks record
                    </Typography>
                  </ListItem>
                  <ListItem sx={{ display: 'list-item', p: 0 }}>
                    <Typography variant="body2">
                      Include all line items from the order
                    </Typography>
                  </ListItem>
                  <ListItem sx={{ display: 'list-item', p: 0 }}>
                    <Typography variant="body2">
                      Update the order status in the CRM
                    </Typography>
                  </ListItem>
                </List>
                
                {order.status !== 'Completed' && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Note: This order is not marked as Completed. It's recommended to complete orders before generating invoices.
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default QuickBooksInvoiceGenerator;