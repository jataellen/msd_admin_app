// OrderForm.js - React component for creating/editing orders (Updated for current_stage)

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Box, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Checkbox, 
  FormGroup, 
  FormControlLabel, 
  Button, 
  Typography, 
  Paper, 
  Divider,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent
} from '@mui/material';

const API_URL =  'http://localhost:8000';

const OrderForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  
  // Form state
  const [formData, setFormData] = useState({
    order_name: '',
    customer_id: '',
    workflow_type: 'MATERIALS_ONLY',
    type: 'MATERIALS_ONLY',
    description: '',
    location: '',
    priority: 'Medium',
    budget: '',
    start_date: '',
    target_completion_date: '',
    contract_number: '',
    notes: '',
    selected_stages: [],
    current_stage: ''
  });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [stagesLoading, setStagesLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [workflowStages, setWorkflowStages] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [customers, setCustomers] = useState([]);
  
  // Fetch necessary data on component mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch priorities
        const prioritiesResponse = await axios.get(`${API_URL}/orders/order-priorities`, {
          withCredentials: true
        });
        
        if (prioritiesResponse.data && prioritiesResponse.data.priorities) {
          setPriorities(prioritiesResponse.data.priorities);
        }
        
        // Fetch customers (mock implementation for now)
        setCustomers([
          { customer_id: 1, company_name: 'ABC Construction' },
          { customer_id: 2, company_name: 'XYZ Builders' },
          { customer_id: 3, company_name: 'City Development Ltd.' }
        ]);
        
        // If in edit mode, fetch order data
        if (isEditMode) {
          const orderResponse = await axios.get(`${API_URL}/orders/${id}`, {
            withCredentials: true
          });
          
          if (orderResponse.data && orderResponse.data.order) {
            const order = orderResponse.data.order;
            setFormData({
              order_name: order.order_name || '',
              customer_id: order.customer_id || '',
              workflow_type: order.type || 'MATERIALS_ONLY',
              type: order.type || 'MATERIALS_ONLY',
              description: order.description || '',
              location: order.location || '',
              priority: order.priority || 'Medium',
              budget: order.budget || '',
              start_date: order.start_date || '',
              target_completion_date: order.target_completion_date || '',
              contract_number: order.contract_number || '',
              notes: order.notes || '',
              current_stage: order.current_stage || '',
              selected_stages: order.selected_stages || []
            });
            
            // Fetch workflow stages based on order type
            await fetchWorkflowStages(order.type || 'MATERIALS_ONLY');
          }
        } else {
          // For new orders, fetch default workflow stages
          await fetchWorkflowStages('MATERIALS_ONLY');
        }
      } catch (err) {
        console.error('Error fetching initial data:', err);
        setError('Failed to load form data. Please try again.');
      }
    };
    
    fetchInitialData();
  }, [id, isEditMode]);
  
  // Fetch workflow stages when workflow type changes
  const fetchWorkflowStages = async (type) => {
    setStagesLoading(true);
    try {
      const response = await axios.get(
        `${API_URL}/orders/workflow-stages/${type}`,
        { withCredentials: true }
      );
      
      if (response.data && response.data.stages) {
        setWorkflowStages(response.data.stages);
        
        // If not in edit mode, set default current_stage to first stage
        if (!isEditMode && response.data.stages.length > 0) {
          setFormData(prev => ({
            ...prev,
            current_stage: response.data.stages[0]
          }));
        }
      }
    } catch (err) {
      console.error('Error fetching workflow stages:', err);
      setError('Failed to load workflow stages. Please try again.');
    } finally {
      setStagesLoading(false);
    }
  };
  
  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle workflow type change
  const handleWorkflowTypeChange = async (e) => {
    const { value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      workflow_type: value,
      type: value
    }));
    
    // Fetch new workflow stages
    await fetchWorkflowStages(value);
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.order_name || !formData.customer_id || !formData.current_stage) {
      setError('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      let response;
      
      const submitData = {
        ...formData,
        customer_id: parseInt(formData.customer_id),
        budget: formData.budget ? parseFloat(formData.budget) : null
      };
      
      if (isEditMode) {
        // Update existing order
        response = await axios.put(
          `${API_URL}/orders/${id}`,
          submitData,
          { withCredentials: true }
        );
        
        setSuccess('Order updated successfully');
      } else {
        // Create new order
        response = await axios.post(
          `${API_URL}/orders`,
          submitData,
          { withCredentials: true }
        );
        
        setSuccess('Order created successfully');
      }
      
      // Navigate to order detail after a short delay
      if (response.data) {
        setTimeout(() => {
          navigate(`/orders/${response.data.order_id || response.data.id || id}`);
        }, 1500);
      }
    } catch (err) {
      console.error('Error saving order:', err);
      setError(err.response?.data?.detail || 'Failed to save order. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        {isEditMode ? 'Edit Order' : 'Create New Order'}
      </Typography>
      
      <Divider sx={{ mb: 3 }} />
      
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
        <Grid container spacing={2}>
          {/* Basic Information */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Basic Information
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Order Name"
              name="order_name"
              value={formData.order_name}
              onChange={handleInputChange}
              required
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth required>
              <InputLabel>Customer</InputLabel>
              <Select
                name="customer_id"
                value={formData.customer_id}
                onChange={handleInputChange}
                label="Customer"
              >
                {customers.map((customer) => (
                  <MenuItem key={customer.customer_id} value={customer.customer_id}>
                    {customer.company_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Order Type</InputLabel>
              <Select
                name="type"
                value={formData.type}
                onChange={handleWorkflowTypeChange}
                label="Order Type"
              >
                <MenuItem value="MATERIALS_ONLY">Materials Only</MenuItem>
                <MenuItem value="MATERIALS_AND_INSTALLATION">Materials & Installation</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                label="Priority"
              >
                {priorities.map((priority) => (
                  <MenuItem key={priority} value={priority}>
                    {priority}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              multiline
              rows={2}
            />
          </Grid>
          
          {/* Additional Details */}
          <Grid item xs={12} sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Additional Details
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Budget"
              name="budget"
              type="number"
              value={formData.budget}
              onChange={handleInputChange}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Start Date"
              name="start_date"
              type="date"
              value={formData.start_date}
              onChange={handleInputChange}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Target Completion Date"
              name="target_completion_date"
              type="date"
              value={formData.target_completion_date}
              onChange={handleInputChange}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Contract Number"
              name="contract_number"
              value={formData.contract_number}
              onChange={handleInputChange}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth required>
              <InputLabel>Current Stage</InputLabel>
              <Select
                name="current_stage"
                value={formData.current_stage}
                onChange={handleInputChange}
                label="Current Stage"
                disabled={stagesLoading}
              >
                {stagesLoading ? (
                  <MenuItem value="">Loading stages...</MenuItem>
                ) : (
                  workflowStages.map((stage) => (
                    <MenuItem key={stage} value={stage}>
                      {stage}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              multiline
              rows={3}
            />
          </Grid>
          
          <Grid item xs={12} sx={{ mt: 2 }}>
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading || stagesLoading}
              sx={{ py: 1.5 }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : isEditMode ? (
                'Update Order'
              ) : (
                'Create Order'
              )}
            </Button>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};

export default OrderForm;