// OrderForm.js - React component for creating/editing orders

import React, { useState, useEffect } from 'react';
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
  Alert
} from '@mui/material';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const OrderForm = ({ onSubmitSuccess }) => {
  // Form state
  const [formData, setFormData] = useState({
    order_name: '',
    customer_id: '',
    workflow_type: 'MATERIALS_ONLY',
    selected_stages: []
  });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [stagesLoading, setStagesLoading] = useState(true);
  const [error, setError] = useState(null);
  const [workflowStages, setWorkflowStages] = useState([]);
  
  // Fetch workflow stages when workflow type changes
  useEffect(() => {
    const fetchWorkflowStages = async () => {
      setStagesLoading(true);
      try {
        const response = await axios.get(
          `${API_URL}/orders/workflow-stages?workflow_type=${formData.workflow_type}`,
          { withCredentials: true }
        );
        
        if (response.data && response.data.stages) {
          setWorkflowStages(response.data.stages);
          
          // Set all stages selected by default
          setFormData(prev => ({
            ...prev,
            selected_stages: response.data.stages.map(stage => stage.id)
          }));
        }
      } catch (err) {
        console.error('Error fetching workflow stages:', err);
        setError('Failed to load workflow stages. Please try again.');
      } finally {
        setStagesLoading(false);
      }
    };
    
    fetchWorkflowStages();
  }, [formData.workflow_type]);
  
  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle workflow type change
  const handleWorkflowTypeChange = (e) => {
    const { value } = e.target;
    
    // Reset selected stages when workflow type changes
    setFormData(prev => ({
      ...prev,
      workflow_type: value,
      selected_stages: []
    }));
  };
  
  // Handle stage checkbox change
  const handleStageChange = (stageId, checked) => {
    setFormData(prev => {
      let newSelectedStages = [...prev.selected_stages];
      
      if (checked) {
        newSelectedStages.push(stageId);
      } else {
        newSelectedStages = newSelectedStages.filter(id => id !== stageId);
      }
      
      return {
        ...prev,
        selected_stages: newSelectedStages
      };
    });
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.order_name || !formData.customer_id) {
      setError('Please fill in all required fields');
      return;
    }
    
    if (formData.selected_stages.length === 0) {
      setError('Please select at least one workflow stage');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(
        `${API_URL}/orders`,
        formData,
        { withCredentials: true }
      );
      
      if (onSubmitSuccess && response.data) {
        onSubmitSuccess(response.data);
      }
    } catch (err) {
      console.error('Error creating order:', err);
      setError(err.response?.data?.detail || 'Failed to create order. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Create New Order
      </Typography>
      
      <Divider sx={{ mb: 3 }} />
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <form onSubmit={handleSubmit}>
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="Order Name"
            name="order_name"
            value={formData.order_name}
            onChange={handleInputChange}
            required
            margin="normal"
          />
          
          <TextField
            fullWidth
            label="Customer ID"
            name="customer_id"
            value={formData.customer_id}
            onChange={handleInputChange}
            required
            margin="normal"
          />
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Workflow Type</InputLabel>
            <Select
              name="workflow_type"
              value={formData.workflow_type}
              onChange={handleWorkflowTypeChange}
              label="Workflow Type"
            >
              <MenuItem value="MATERIALS_ONLY">Materials Only</MenuItem>
              <MenuItem value="MATERIALS_AND_INSTALLATION">Materials & Installation</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        <Typography variant="h6" gutterBottom>
          Select Workflow Stages
        </Typography>
        
        {stagesLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <FormGroup>
            {workflowStages.map(stage => (
              <Box key={stage.id} sx={{ mb: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.selected_stages.includes(stage.id)}
                      onChange={(e) => handleStageChange(stage.id, e.target.checked)}
                      name={stage.id}
                    />
                  }
                  label={<Typography variant="subtitle1">{stage.name}</Typography>}
                />
                
                <Box sx={{ ml: 3 }}>
                  <Typography variant="caption" color="text.secondary">
                    Includes: {stage.statuses.map(status => status.name).join(', ')}
                  </Typography>
                </Box>
              </Box>
            ))}
          </FormGroup>
        )}
        
        <Box sx={{ mt: 3 }}>
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading || stagesLoading}
            sx={{ py: 1.5 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Create Order'}
          </Button>
        </Box>
      </form>
    </Paper>
  );
};

export default OrderForm;