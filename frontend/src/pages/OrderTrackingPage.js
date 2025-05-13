// OrderTrackingPage.js - React component for the order tracking view

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip
} from '@mui/material';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const OrderTrackingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // State
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [workflowStages, setWorkflowStages] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [statusNote, setStatusNote] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  
  // Fetch order data
  useEffect(() => {
    const fetchOrderData = async () => {
      // Validate the id parameter before making any API calls
      if (!id || id === 'undefined' || isNaN(parseInt(id))) {
        console.error('Invalid order ID:', id);
        setError('Invalid order ID. Please select a valid order.');
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        // Use a valid numeric ID for the API call
        const orderId = parseInt(id);
        
        // Fetch order details
        const orderResponse = await axios.get(`${API_URL}/orders/${orderId}`, {
          withCredentials: true
        });
        
        if (orderResponse.data && orderResponse.data.order) {
          setOrder(orderResponse.data.order);
          
          // Fetch workflow stages
          const stagesResponse = await axios.get(
            `${API_URL}/workflow-stages?workflow_type=${orderResponse.data.order.workflow_type}`,
            { withCredentials: true }
          );
          
          if (stagesResponse.data && stagesResponse.data.stages) {
            // Filter to only show selected stages
            const selectedStages = stagesResponse.data.stages.filter(
              stage => orderResponse.data.order.selected_stages.includes(stage.id)
            );
            
            setWorkflowStages(selectedStages);
          }
        }
      } catch (err) {
        console.error('Error fetching order data:', err);
        setError('Failed to load order data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrderData();
  }, [id, navigate]);
  
  // Handle status completion
  const handleCompleteStatus = (status) => {
    setSelectedStatus(status);
    setStatusNote('');
    setDialogOpen(true);
  };
  
  // Handle submit status update
  const handleSubmitStatusUpdate = async () => {
    if (!selectedStatus) return;
    
    // Validate ID before making the API call
    if (!id || id === 'undefined' || isNaN(parseInt(id))) {
      setError('Invalid order ID. Please select a valid order.');
      setDialogOpen(false);
      return;
    }
    
    setUpdateLoading(true);
    
    try {
      // Use a valid numeric ID for the API call
      const orderId = parseInt(id);
      
      const response = await axios.post(
        `${API_URL}/orders/${orderId}/update-status`,
        { 
          new_status: selectedStatus.id,
          notes: statusNote || null
        },
        { withCredentials: true }
      );
      
      // Update local state with new order data
      if (response.data) {
        setOrder(response.data);
      }
      
      setDialogOpen(false);
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update status. Please try again.');
    } finally {
      setUpdateLoading(false);
    }
  };
  
  // Check if a status is completed
  const isStatusCompleted = (statusId) => {
    if (!order || !order.completed_stages) return false;
    
    return order.completed_stages.some(stage => stage.status === statusId);
  };
  
  // Get status completion info
  const getStatusCompletionInfo = (statusId) => {
    if (!order || !order.completed_stages) return null;
    
    return order.completed_stages.find(stage => stage.status === statusId);
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // Get active step index
  const getActiveStep = () => {
    if (!order || !workflowStages.length) return 0;
    
    // Calculate total steps completed
    let stepsCompleted = 0;
    let foundCurrent = false;
    
    for (const stage of workflowStages) {
      for (const status of stage.statuses) {
        // If we've found the current status, return the step count
        if (status.id === order.current_stage) {
          foundCurrent = true;
          return stepsCompleted;
        }
        
        // Otherwise, if it's completed, increment the count
        if (isStatusCompleted(status.id)) {
          stepsCompleted++;
        }
      }
    }
    
    // If we didn't find the current status, return 0
    return 0;
  };
  
  // Flatten statuses into a single list
  const getAllStatuses = () => {
    const statuses = [];
    
    for (const stage of workflowStages) {
      for (const status of stage.statuses) {
        statuses.push({
          ...status,
          stage: stage.name
        });
      }
    }
    
    return statuses;
  };
  
  // Handle navigation back to orders
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
  
  const activeStep = getActiveStep();
  const allStatuses = getAllStatuses();
  
  return (
    <Box sx={{ maxWidth: '100%' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Order Tracking: {order.order_name}
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1">
          Workflow Type: {order.workflow_type === 'MATERIALS_AND_INSTALLATION' ? 'Materials & Installation' : 'Materials Only'}
        </Typography>
        
        {order.current_stage && (
          <Typography variant="subtitle1">
            Current Status: 
            <Chip 
              label={allStatuses.find(s => s.id === order.current_stage)?.name || order.current_stage}
              color="primary"
              sx={{ ml: 1 }}
            />
          </Typography>
        )}
      </Box>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Workflow Progress
        </Typography>
        
        <Divider sx={{ mb: 3 }} />
        
        {allStatuses.length > 0 ? (
          <Stepper activeStep={activeStep} orientation="vertical">
            {allStatuses.map((status, index) => (
              <Step key={status.id} completed={isStatusCompleted(status.id)}>
                <StepLabel>
                  <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                    <Typography variant="body1" fontWeight={500}>
                      {status.name}
                    </Typography>
                    <Chip 
                      label={status.stage}
                      size="small"
                      variant="outlined"
                      sx={{ ml: 1 }}
                    />
                  </Box>
                </StepLabel>
                <StepContent>
                  {isStatusCompleted(status.id) ? (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Completed on: {formatDate(getStatusCompletionInfo(status.id)?.completed_at)}
                      </Typography>
                      
                      {getStatusCompletionInfo(status.id)?.notes && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Notes: {getStatusCompletionInfo(status.id).notes}
                        </Typography>
                      )}
                    </Box>
                  ) : status.id === order.current_stage ? (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Current status
                      </Typography>
                      
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleCompleteStatus(status)}
                      >
                        Complete & Continue
                      </Button>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Not started yet
                    </Typography>
                  )}
                </StepContent>
              </Step>
            ))}
          </Stepper>
        ) : (
          <Alert severity="info">
            No workflow stages found for this order. Please check the order configuration.
          </Alert>
        )}
      </Paper>
      
      {/* Status Update Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Complete Status: {selectedStatus?.name}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Notes (optional)"
            fullWidth
            multiline
            rows={4}
            value={statusNote}
            onChange={(e) => setStatusNote(e.target.value)}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmitStatusUpdate} 
            disabled={updateLoading}
            variant="contained"
          >
            {updateLoading ? <CircularProgress size={24} /> : 'Complete & Continue'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrderTrackingPage;