// src/pages/QuickBooksIntegration.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

// Material UI imports
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';

// Material UI icons
import {
  Refresh as RefreshIcon,
  Sync as SyncIcon,
  Link as LinkIcon,
  Receipt as ReceiptIcon,
  ShoppingCart as ShoppingCartIcon,
  People as PeopleIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';

// API URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const QuickBooksIntegration = () => {
  const { user } = useAuth();
  
  // State variables
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastSync, setLastSync] = useState({ products: null, invoices: null });
  const [syncStatus, setSyncStatus] = useState({ products: null, invoices: null });
  const [products, setProducts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  
  // Dialog state
  const [linkCustomerDialog, setLinkCustomerDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [qbCustomerId, setQbCustomerId] = useState('');
  
  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch QuickBooks data
        const [productsRes, invoicesRes, customersRes] = await Promise.all([
          axios.get(`${API_URL}/quickbooks/products`, { withCredentials: true }),
          axios.get(`${API_URL}/quickbooks/invoices`, { withCredentials: true }),
          axios.get(`${API_URL}/quickbooks/customers`, { withCredentials: true })
        ]);
        
        setProducts(productsRes.data.products || []);
        setInvoices(invoicesRes.data.invoices || []);
        setCustomers(customersRes.data.customers || []);
        
        // Determine last sync times from the data
        const productSyncTimes = productsRes.data.products
          .map(p => p.last_synced_at ? new Date(p.last_synced_at) : null)
          .filter(Boolean);
        
        const invoiceSyncTimes = invoicesRes.data.invoices
          .map(i => i.last_synced_at ? new Date(i.last_synced_at) : null)
          .filter(Boolean);
        
        if (productSyncTimes.length > 0) {
          setLastSync(prev => ({ 
            ...prev, 
            products: new Date(Math.max(...productSyncTimes))
          }));
        }
        
        if (invoiceSyncTimes.length > 0) {
          setLastSync(prev => ({ 
            ...prev, 
            invoices: new Date(Math.max(...invoiceSyncTimes))
          }));
        }
      } catch (err) {
        console.error('Error fetching QuickBooks data:', err);
        setError('Failed to load QuickBooks integration data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Handle product sync
  const handleProductSync = async () => {
    setLoading(true);
    setSyncStatus({ ...syncStatus, products: 'syncing' });
    
    try {
      const response = await axios.post(`${API_URL}/quickbooks/sync/products`, {}, { withCredentials: true });
      
      setSyncStatus({ ...syncStatus, products: 'success' });
      setTimeout(() => setSyncStatus(prev => ({ ...prev, products: null })), 5000);
      
      // Refresh products after a short delay to give the background task time to work
      setTimeout(async () => {
        const productsRes = await axios.get(`${API_URL}/quickbooks/products`, { withCredentials: true });
        setProducts(productsRes.data.products || []);
        
        // Update last sync time
        const productSyncTimes = productsRes.data.products
          .map(p => p.last_synced_at ? new Date(p.last_synced_at) : null)
          .filter(Boolean);
        
        if (productSyncTimes.length > 0) {
          setLastSync(prev => ({ 
            ...prev, 
            products: new Date(Math.max(...productSyncTimes))
          }));
        }
      }, 5000);
    } catch (err) {
      console.error('Error syncing products:', err);
      setSyncStatus({ ...syncStatus, products: 'error' });
      setTimeout(() => setSyncStatus(prev => ({ ...prev, products: null })), 5000);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle invoice sync
  const handleInvoiceSync = async () => {
    setLoading(true);
    setSyncStatus({ ...syncStatus, invoices: 'syncing' });
    
    try {
      const response = await axios.post(`${API_URL}/quickbooks/sync/invoices`, {}, { withCredentials: true });
      
      setSyncStatus({ ...syncStatus, invoices: 'success' });
      setTimeout(() => setSyncStatus(prev => ({ ...prev, invoices: null })), 5000);
      
      // Refresh invoices after a short delay to give the background task time to work
      setTimeout(async () => {
        const invoicesRes = await axios.get(`${API_URL}/quickbooks/invoices`, { withCredentials: true });
        setInvoices(invoicesRes.data.invoices || []);
        
        // Update last sync time
        const invoiceSyncTimes = invoicesRes.data.invoices
          .map(i => i.last_synced_at ? new Date(i.last_synced_at) : null)
          .filter(Boolean);
        
        if (invoiceSyncTimes.length > 0) {
          setLastSync(prev => ({ 
            ...prev, 
            invoices: new Date(Math.max(...invoiceSyncTimes))
          }));
        }
      }, 5000);
    } catch (err) {
      console.error('Error syncing invoices:', err);
      setSyncStatus({ ...syncStatus, invoices: 'error' });
      setTimeout(() => setSyncStatus(prev => ({ ...prev, invoices: null })), 5000);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle linking a customer to QuickBooks
  const handleLinkCustomer = async () => {
    if (!selectedCustomer || !qbCustomerId.trim()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await axios.post(`${API_URL}/quickbooks/link-customer/${selectedCustomer.customer_id}?qb_customer_id=${qbCustomerId}`, {}, { withCredentials: true });
      
      // Update customer in state
      setCustomers(prev => prev.map(c => 
        c.customer_id === selectedCustomer.customer_id
          ? { ...c, quickbooks_customer_id: qbCustomerId }
          : c
      ));
      
      // Close dialog and reset state
      setLinkCustomerDialog(false);
      setSelectedCustomer(null);
      setQbCustomerId('');
    } catch (err) {
      console.error('Error linking customer:', err);
      setError('Failed to link customer to QuickBooks. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Format date 
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // Get status chip color and icon
  const getStatusChip = (status, type) => {
    switch (status) {
      case 'syncing':
        return <Chip icon={<RefreshIcon />} label={`Syncing ${type}...`} color="warning" />;
      case 'success':
        return <Chip icon={<CheckIcon />} label={`${type} sync successful`} color="success" />;
      case 'error':
        return <Chip icon={<ErrorIcon />} label={`${type} sync failed`} color="error" />;
      default:
        return null;
    }
  };
  
  if (loading && !products.length && !invoices.length) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box sx={{ maxWidth: '100%' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        QuickBooks Integration
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Integration Status */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Integration Status
        </Typography>
        
        <Divider sx={{ mb: 2 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <ShoppingCartIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="subtitle1">
                    Products
                  </Typography>
                  
                  {syncStatus.products && (
                    <Box sx={{ ml: 'auto' }}>
                      {getStatusChip(syncStatus.products, 'Products')}
                    </Box>
                  )}
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Last Sync:
                  </Typography>
                  <Typography variant="body2">
                    {lastSync.products ? formatDate(lastSync.products) : 'Never'}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Products:
                  </Typography>
                  <Typography variant="body2">
                    {products.length}
                  </Typography>
                </Box>
              </CardContent>
              <CardActions>
                <Button 
                  startIcon={<SyncIcon />} 
                  onClick={handleProductSync}
                  disabled={loading || syncStatus.products === 'syncing'}
                >
                  Sync Products
                </Button>
              </CardActions>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <ReceiptIcon color="secondary" sx={{ mr: 1 }} />
                  <Typography variant="subtitle1">
                    Invoices
                  </Typography>
                  
                  {syncStatus.invoices && (
                    <Box sx={{ ml: 'auto' }}>
                      {getStatusChip(syncStatus.invoices, 'Invoices')}
                    </Box>
                  )}
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Last Sync:
                  </Typography>
                  <Typography variant="body2">
                    {lastSync.invoices ? formatDate(lastSync.invoices) : 'Never'}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Invoices:
                  </Typography>
                  <Typography variant="body2">
                    {invoices.length}
                  </Typography>
                </Box>
              </CardContent>
              <CardActions>
                <Button 
                  startIcon={<SyncIcon />} 
                  onClick={handleInvoiceSync}
                  disabled={loading || syncStatus.invoices === 'syncing'}
                >
                  Sync Invoices
                </Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Customer Linking */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Customer QuickBooks Linking
          </Typography>
          
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />}
            onClick={async () => {
              setLoading(true);
              try {
                const res = await axios.get(`${API_URL}/quickbooks/customers`, { withCredentials: true });
                setCustomers(res.data.customers || []);
              } catch (err) {
                console.error('Error refreshing customers:', err);
                setError('Failed to refresh customers. Please try again.');
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
        
        <Divider sx={{ mb: 2 }} />
        
        <Alert severity="info" sx={{ mb: 2 }}>
          Link your customers to QuickBooks to enable invoice generation. You will need to find the QuickBooks ID for each customer in your QuickBooks account.
        </Alert>
        
        <Box sx={{ mt: 2 }}>
          <List>
            {customers.slice(0, 10).map((customer) => (
              <ListItem 
                key={customer.customer_id} 
                divider
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  bgcolor: customer.quickbooks_customer_id ? 'success.50' : 'inherit'
                }}
              >
                <ListItemText
                  primary={customer.company_name || `${customer.first_name} ${customer.last_name}`}
                  secondary={customer.email}
                />
                
                <Box>
                  {customer.quickbooks_customer_id ? (
                    <Chip 
                      icon={<CheckIcon />} 
                      label="Linked" 
                      color="success" 
                      variant="outlined"
                      sx={{ mr: 1 }}
                    />
                  ) : (
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<LinkIcon />}
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setLinkCustomerDialog(true);
                      }}
                      sx={{ mr: 1 }}
                    >
                      Link
                    </Button>
                  )}
                </Box>
              </ListItem>
            ))}
          </List>
          
          {customers.length > 10 && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button variant="text">View All Customers</Button>
            </Box>
          )}
          
          {customers.length === 0 && (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No customers found. Add customers to enable QuickBooks integration.
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>
      
      {/* Recent Synced Products */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Recent Synced Products
        </Typography>
        
        <Divider sx={{ mb: 2 }} />
        
        <Box sx={{ mt: 2 }}>
          <List>
            {products.slice(0, 5).map((product) => (
              <ListItem key={product.product_id} divider>
                <ListItemText
                  primary={product.name}
                  secondary={`Price: ${product.default_price.toFixed(2)}`}
                />
                
                <Box>
                  <Chip 
                    label={product.is_active ? 'Active' : 'Inactive'} 
                    color={product.is_active ? 'success' : 'default'} 
                    variant="outlined"
                    size="small"
                  />
                </Box>
              </ListItem>
            ))}
          </List>
          
          {products.length > 5 && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button variant="text">View All Products</Button>
            </Box>
          )}
          
          {products.length === 0 && (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No products synced from QuickBooks yet. Click "Sync Products" to get started.
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>
      
      {/* Recent Invoices */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Recent Invoices
        </Typography>
        
        <Divider sx={{ mb: 2 }} />
        
        <Box sx={{ mt: 2 }}>
          <List>
            {invoices.slice(0, 5).map((invoice) => (
              <ListItem key={invoice.invoice_id} divider>
                <ListItemText
                  primary={`Invoice #${invoice.invoice_number}`}
                  secondary={`Amount: ${invoice.total_amount.toFixed(2)} | Due: ${new Date(invoice.due_date).toLocaleDateString()}`}
                />
                
                <Box>
                  <Chip 
                    label={invoice.status} 
                    color={invoice.status === 'Paid' ? 'success' : invoice.status === 'Open' ? 'warning' : 'default'} 
                    size="small"
                  />
                </Box>
              </ListItem>
            ))}
          </List>
          
          {invoices.length > 5 && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button variant="text">View All Invoices</Button>
            </Box>
          )}
          
          {invoices.length === 0 && (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No invoices synced from QuickBooks yet. Click "Sync Invoices" to get started.
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>
      
      {/* Link Customer Dialog */}
      <Dialog open={linkCustomerDialog} onClose={() => setLinkCustomerDialog(false)}>
        <DialogTitle>Link Customer to QuickBooks</DialogTitle>
        <DialogContent>
          <Box sx={{ p: 1 }}>
            <Typography variant="body1" gutterBottom>
              Enter the QuickBooks Customer ID for:
            </Typography>
            <Typography variant="subtitle1" gutterBottom>
              {selectedCustomer && (selectedCustomer.company_name || `${selectedCustomer.first_name} ${selectedCustomer.last_name}`)}
            </Typography>
            
            <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
              You can find the QuickBooks Customer ID in your QuickBooks account. Go to Customers, select the customer, and look for the ID in the URL or customer details.
            </Alert>
            
            <TextField
              autoFocus
              margin="dense"
              id="qb_customer_id"
              label="QuickBooks Customer ID"
              fullWidth
              variant="outlined"
              value={qbCustomerId}
              onChange={(e) => setQbCustomerId(e.target.value)}
              helperText="Example: 123 or c123 (format may vary based on QuickBooks version)"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLinkCustomerDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleLinkCustomer}
            variant="contained"
            disabled={!qbCustomerId.trim() || loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Link Customer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QuickBooksIntegration;