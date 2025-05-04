// src/pages/OrderForm.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

// Material UI imports
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Card,
  CardContent,
  CardHeader,
  Divider,
  InputAdornment,
  Stack
} from '@mui/material';

// Material UI icons
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Business as BusinessIcon,
  CalendarMonth as CalendarIcon,
  AttachMoney as MoneyIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';

// const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const API_URL = 'https://msdadminapp-production.up.railway.app';

const OrderForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode = Boolean(id);
  
  // Get any query parameters (for prefilling form)
  const queryParams = new URLSearchParams(location.search);
  const customerId = queryParams.get('customer_id');
  
  // Form state
  const [formData, setFormData] = useState({
    order_name: '',
    description: '',
    location: '',
    customer_id: customerId || '',
    status: 'Lead',
    priority: 'Medium',
    start_date: '',
    target_completion_date: '',
    budget: '',
    order_manager_id: '',
    contract_number: '',
    notes: ''
  });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  
  // Options for dropdowns
  const [customers, setCustomers] = useState([]);
  const [orderStatuses, setOrderStatuses] = useState([]);
  const [orderPriorities, setOrderPriorities] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  
  // Fetch data for dropdowns and existing order if in edit mode
  useEffect(() => {
    const fetchData = async () => {
      setFetchLoading(true);
      setError(null);
      
      try {
        // Fetch all dropdown options in parallel
        const [customersResponse, statusesResponse, prioritiesResponse] = await Promise.all([
          axios.get(`${API_URL}/quickbooks/customers`, { withCredentials: true }),
          axios.get(`${API_URL}/order-statuses`, { withCredentials: true }),
          axios.get(`${API_URL}/order-priorities`, { withCredentials: true })
        ]);
        
        // Set dropdown options
        if (customersResponse.data && customersResponse.data.customers) {
          setCustomers(customersResponse.data.customers);
        }
        
        if (statusesResponse.data && statusesResponse.data.statuses) {
          setOrderStatuses(statusesResponse.data.statuses);
        }
        
        if (prioritiesResponse.data && prioritiesResponse.data.priorities) {
          setOrderPriorities(prioritiesResponse.data.priorities);
        }
        
        // TODO: Fetch employees from actual API once available
        setEmployees([
          { employee_id: 1, first_name: 'John', last_name: 'Doe' },
          { employee_id: 2, first_name: 'Jane', last_name: 'Smith' },
          { employee_id: 3, first_name: 'Alex', last_name: 'Johnson' }
        ]);
        
        // If in edit mode, fetch the existing order
        if (isEditMode) {
          const orderResponse = await axios.get(`${API_URL}/orders/${id}`, {
            withCredentials: true
          });
          
          if (orderResponse.data && orderResponse.data.order) {
            const order = orderResponse.data.order;
            
            // Format dates for form inputs (YYYY-MM-DD format)
            const formattedOrder = {
              ...order,
              start_date: order.start_date ? order.start_date.substring(0, 10) : '',
              target_completion_date: order.target_completion_date ? order.target_completion_date.substring(0, 10) : '',
              budget: order.budget || ''
            };
            
            setFormData(formattedOrder);
            
            // Find and set the selected customer
            if (order.customer_id && customersResponse.data && customersResponse.data.customers) {
              const customer = customersResponse.data.customers.find(c => c.customer_id === order.customer_id);
              if (customer) {
                setSelectedCustomer(customer);
              }
            }
          }
        } else if (customerId && customersResponse.data && customersResponse.data.customers) {
          // If creating a new order with a pre-selected customer, find and set the customer
          const customer = customersResponse.data.customers.find(c => c.customer_id === parseInt(customerId));
          if (customer) {
            setSelectedCustomer(customer);
          }
        }
      } catch (err) {
        console.error('Error fetching form data:', err);
        setError('Failed to load form data. Please try again.');
      } finally {
        setFetchLoading(false);
      }
    };
    
    fetchData();
  }, [id, isEditMode, customerId]);
  
  // Update selected customer when customer_id changes
  useEffect(() => {
    if (formData.customer_id && customers.length > 0) {
      const customer = customers.find(c => c.customer_id === parseInt(formData.customer_id));
      if (customer) {
        setSelectedCustomer(customer);
      }
    }
  }, [formData.customer_id, customers]);
  
  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Clear error for this field if it exists
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Validate the form
  const validateForm = () => {
    const errors = {};
    
    // Required fields
    if (!formData.order_name.trim()) {
      errors.order_name = 'Order name is required';
    }
    
    if (!formData.status) {
      errors.status = 'Status is required';
    }
    
    if (!formData.customer_id) {
      errors.customer_id = 'Customer is required';
    }
    
    // Format validation
    if (formData.budget && (isNaN(parseFloat(formData.budget)) || parseFloat(formData.budget) < 0)) {
      errors.budget = 'Budget must be a positive number';
    }
    
    // Date validation
    if (formData.start_date && formData.target_completion_date) {
      const startDate = new Date(formData.start_date);
      const targetDate = new Date(formData.target_completion_date);
      
      if (targetDate < startDate) {
        errors.target_completion_date = 'Target date cannot be before start date';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Format data for API
      const apiData = {
        ...formData,
        // Parse budget to number if provided
        budget: formData.budget ? parseFloat(formData.budget) : null,
        // Parse manager ID to number if provided
        order_manager_id: formData.order_manager_id ? parseInt(formData.order_manager_id) : null,
        // Parse customer ID to number
        customer_id: parseInt(formData.customer_id)
      };
      
      let response;
      
      if (isEditMode) {
        // Update existing order
        response = await axios.put(
          `${API_URL}/orders/${id}`,
          apiData,
          { withCredentials: true }
        );
        
        setSuccess('Order updated successfully');
      } else {
        // Create new order
        response = await axios.post(
          `${API_URL}/orders`,
          apiData,
          { withCredentials: true }
        );
        
        setSuccess('Order created successfully');
        
        // Navigate to the new order after a short delay
        setTimeout(() => {
          navigate(`/orders/${response.data.order.order_id}`);
        }, 1500);
      }
    } catch (err) {
      console.error('Error saving order:', err);
      setError(err.response?.data?.detail || 'Failed to save order. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle cancel button
  const handleCancel = () => {
    if (isEditMode) {
      navigate(`/orders/${id}`);
    } else {
      navigate('/orders');
    }
  };
  
  if (fetchLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Get customer display name
  const getCustomerDisplayName = (customer) => {
    if (!customer) return '';
    return customer.company_name || `${customer.first_name || ''} ${customer.last_name || ''}`.trim();
  };
  
  return (
    <Box sx={{ maxWidth: '100%' }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            {isEditMode ? 'Edit Order' : 'Create New Order'}
          </Typography>
          
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<CancelIcon />}
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            
            <Button
              variant="contained"
              color="primary"
              startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
              onClick={handleSubmit}
              disabled={loading}
            >
              {isEditMode ? 'Update Order' : 'Create Order'}
            </Button>
          </Stack>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardHeader 
                  title="Basic Information" 
                  avatar={<DescriptionIcon color="primary" />}
                />
                <Divider />
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        name="order_name"
                        label="Order Name"
                        value={formData.order_name}
                        onChange={handleInputChange}
                        fullWidth
                        required
                        error={Boolean(formErrors.order_name)}
                        helperText={formErrors.order_name}
                        inputProps={{ maxLength: 100 }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth required error={Boolean(formErrors.status)}>
                        <InputLabel id="status-label">Status</InputLabel>
                        <Select
                          labelId="status-label"
                          id="status"
                          name="status"
                          value={formData.status}
                          label="Status"
                          onChange={handleInputChange}
                        >
                          {orderStatuses.map((status) => (
                            <MenuItem key={status} value={status}>{status}</MenuItem>
                          ))}
                        </Select>
                        {formErrors.status && <FormHelperText>{formErrors.status}</FormHelperText>}
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel id="priority-label">Priority</InputLabel>
                        <Select
                          labelId="priority-label"
                          id="priority"
                          name="priority"
                          value={formData.priority}
                          label="Priority"
                          onChange={handleInputChange}
                        >
                          {orderPriorities.map((priority) => (
                            <MenuItem key={priority} value={priority}>{priority}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        name="location"
                        label="Location"
                        value={formData.location}
                        onChange={handleInputChange}
                        fullWidth
                        placeholder="E.g., Project site address"
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        name="description"
                        label="Description"
                        value={formData.description}
                        onChange={handleInputChange}
                        fullWidth
                        multiline
                        rows={4}
                        placeholder="Describe the order scope and requirements"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Customer & Team */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardHeader 
                  title="Customer & Team" 
                  avatar={<BusinessIcon color="primary" />}
                />
                <Divider />
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <FormControl fullWidth required error={Boolean(formErrors.customer_id)}>
                        <InputLabel id="customer-label">Customer</InputLabel>
                        <Select
                          labelId="customer-label"
                          id="customer_id"
                          name="customer_id"
                          value={formData.customer_id}
                          label="Customer"
                          onChange={handleInputChange}
                          MenuProps={{ style: { maxHeight: 300 } }}
                        >
                          {customers.map((customer) => (
                            <MenuItem key={customer.customer_id} value={customer.customer_id}>
                              {getCustomerDisplayName(customer)}
                            </MenuItem>
                          ))}
                        </Select>
                        {formErrors.customer_id && <FormHelperText>{formErrors.customer_id}</FormHelperText>}
                      </FormControl>
                    </Grid>
                    
                    {selectedCustomer && (
                      <Grid item xs={12}>
                        <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Selected Customer:
                          </Typography>
                          <Typography variant="body2">
                            <strong>{getCustomerDisplayName(selectedCustomer)}</strong>
                          </Typography>
                          {selectedCustomer.email && (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              Email: {selectedCustomer.email}
                            </Typography>
                          )}
                          {selectedCustomer.phone && (
                            <Typography variant="body2">
                              Phone: {selectedCustomer.phone}
                            </Typography>
                          )}
                        </Box>
                      </Grid>
                    )}
                    
                    <Grid item xs={12}>
                      <FormControl fullWidth>
                        <InputLabel id="manager-label">Order Manager</InputLabel>
                        <Select
                          labelId="manager-label"
                          id="order_manager_id"
                          name="order_manager_id"
                          value={formData.order_manager_id}
                          label="Order Manager"
                          onChange={handleInputChange}
                        >
                          <MenuItem value="">
                            <em>None</em>
                          </MenuItem>
                          {employees.map((employee) => (
                            <MenuItem key={employee.employee_id} value={employee.employee_id}>
                              {`${employee.first_name} ${employee.last_name}`}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Timeline */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardHeader 
                  title="Timeline" 
                  avatar={<CalendarIcon color="primary" />}
                />
                <Divider />
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        name="start_date"
                        label="Start Date"
                        type="date"
                        value={formData.start_date}
                        onChange={handleInputChange}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        inputProps={{ max: '2030-12-31' }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        name="target_completion_date"
                        label="Target Completion Date"
                        type="date"
                        value={formData.target_completion_date}
                        onChange={handleInputChange}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        inputProps={{ max: '2030-12-31' }}
                        error={Boolean(formErrors.target_completion_date)}
                        helperText={formErrors.target_completion_date}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Budget & Contract */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardHeader 
                  title="Budget & Contract" 
                  avatar={<MoneyIcon color="primary" />}
                />
                <Divider />
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        name="budget"
                        label="Budget"
                        type="number"
                        value={formData.budget}
                        onChange={handleInputChange}
                        fullWidth
                        InputProps={{ 
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                          inputProps: { min: 0, step: 0.01 }
                        }}
                        error={Boolean(formErrors.budget)}
                        helperText={formErrors.budget}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        name="contract_number"
                        label="Contract Number"
                        value={formData.contract_number}
                        onChange={handleInputChange}
                        fullWidth
                        placeholder="E.g., CNT-2023-001"
                      />
                    </Grid>
                    
                    {/* TODO: Add file upload for contract documents */}
                    
                    <Grid item xs={12}>
                      <TextField
                        name="notes"
                        label="Notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        fullWidth
                        multiline
                        rows={3}
                        placeholder="Additional notes about this order"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<CancelIcon />}
              onClick={handleCancel}
              sx={{ mr: 2 }}
              disabled={loading}
            >
              Cancel
            </Button>
            
            <Button
              variant="contained"
              color="primary"
              type="submit"
              startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
              disabled={loading}
            >
              {isEditMode ? 'Update Order' : 'Create Order'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default OrderForm;