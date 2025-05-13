// OrderTracking.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Paper,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Divider,
  Card,
  CardContent,
  Grid
} from '@mui/material';

// Material UI icons
import {
  Check as CheckIcon,
  Timeline as TimelineIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';

const API_URL = 'http://localhost:8000';

const OrderTracking = ({ orderId, orderData }) => {
  // State variables
  const [order, setOrder] = useState(orderData || null);
  const [loading, setLoading] = useState(!orderData);
  const [error, setError] = useState(null);
  const [workflowStages, setWorkflowStages] = useState([]);
  const [stageDialogOpen, setStageDialogOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState(null);
  const [stageNote, setStageNote] = useState('');
  const [updating, setUpdating] = useState(false);
  
  // Fetch order and stages if not provided
  useEffect(() => {
    if (orderData) {
      setOrder(orderData);
      fetchWorkflowStages(orderData.type || 'MATERIALS_ONLY');
    } else if (orderId) {
      fetchOrder();
    }
  }, [orderId, orderData]);
  
  // Fetch order data
  const fetchOrder = async () => {
    if (!orderId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_URL}/orders/${orderId}`, {
        withCredentials: true
      });
      
      if (response.data && response.data.order) {
        setOrder(response.data.order);
        fetchWorkflowStages(response.data.order.type || 'MATERIALS_ONLY');
      }
    } catch (err) {
      console.error('Error fetching order:', err);
      setError('Failed to load order data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch workflow stages
  const fetchWorkflowStages = async (type) => {
    try {
      const response = await axios.get(`${API_URL}/orders/workflow-stages/${type}`, {
        withCredentials: true
      });
      
      if (response.data && response.data.stages) {
        setWorkflowStages(response.data.stages);
      }
    } catch (err) {
      console.error('Error fetching workflow stages:', err);
      setError('Failed to load workflow stages. Please try again.');
    }
  };
  
  // Check if a stage is completed
  const isStageCompleted = (stage) => {
    if (!order || !order.completed_stages) return false;
    
    return order.completed_stages.some(s => s.stage === stage);
  };
  
  // Get stage completion info
  const getStageCompletionInfo = (stage) => {
    if (!order || !order.completed_stages) return null;
    
    return order.completed_stages.find(s => s.stage === stage);
  };
  
  // Check if stage is current
  const isCurrentStage = (stage) => {
    if (!order || !order.current_stage) return false;
    
    return order.current_stage === stage;
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // Calculate active step
  const getActiveStep = () => {
    if (!order || !workflowStages.length) return 0;
    
    // Count completed stages
    let completedCount = 0;
    for (const stage of workflowStages) {
      if (isStageCompleted(stage)) {
        completedCount++;
      } else if (isCurrentStage(stage)) {
        return completedCount;
      }
    }
    
    return completedCount;
  };
  
  // Handle open stage dialog
  const handleStageUpdate = (stage) => {
    setSelectedStage(stage);
    setStageNote('');
    setStageDialogOpen(true);
  };
  
  // Handle submit stage update
  const handleSubmitStageUpdate = async () => {
    if (!selectedStage || !order) return;
    
    setUpdating(true);
    
    try {
      const response = await axios.post(
        `${API_URL}/orders/${order.order_id}/update-stage`,
        {
          stage: selectedStage,
          notes: stageNote || null
        },
        { withCredentials: true }
      );
      
      if (response.data) {
        setOrder(response.data);
      }
      
      setStageDialogOpen(false);
      
      // Refresh order to get latest data
      fetchOrder();
    } catch (err) {
      console.error('Error updating stage:', err);
      setError('Failed to update stage. Please try again.');
    } finally {
      setUpdating(false);
    }
  };
  
  // Calculate progress percentage
  const calculateProgress = () => {
    if (!workflowStages.length) return 0;
    
    const completed = order?.completed_stages?.length || 0;
    return Math.round((completed / workflowStages.length) * 100);
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Alert 
        severity="error" 
        sx={{ mb: 3 }}
        action={
          <Button 
            color="inherit" 
            size="small" 
            onClick={fetchOrder}
          >
            Retry
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }
  
  if (!order) {
    return (
      <Alert severity="warning">
        Order data is not available.
      </Alert>
    );
  }
  
  const activeStep = getActiveStep();
  const progress = calculateProgress();
  
  return (
    <Box>
      {/* Progress Summary */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Progress
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
                <Typography variant="h4" color="primary" sx={{ fontWeight: 600 }}>
                  {progress}%
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  complete
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Current Stage
              </Typography>
              <Typography variant="h6" noWrap sx={{ fontWeight: 500 }}>
                {order.current_stage || 'Not Started'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Last Updated
              </Typography>
              <Typography variant="body1">
                {formatDate(order.updated_at)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Completed Stages
              </Typography>
              <Typography variant="h5" color="success.main" sx={{ fontWeight: 600 }}>
                {order.completed_stages?.length || 0} / {workflowStages.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Workflow Stepper */}
      <Paper elevation={0} variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <TimelineIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 500 }}>
            Workflow Progress
          </Typography>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        {workflowStages.length > 0 ? (
          <Stepper activeStep={activeStep} orientation="vertical">
            {workflowStages.map((stage, index) => (
              <Step key={stage} completed={isStageCompleted(stage)}>
                <StepLabel 
                  optional={
                    isStageCompleted(stage) && (
                      <Typography variant="caption" color="text.secondary">
                        Completed {formatDate(getStageCompletionInfo(stage)?.completed_at)}
                      </Typography>
                    )
                  }
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                    {stage}
                  </Typography>
                </StepLabel>
                
                <StepContent>
                  {isStageCompleted(stage) ? (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                        <CheckIcon color="success" fontSize="small" sx={{ mr: 0.5 }} />
                        Stage completed
                      </Typography>
                      
                      {getStageCompletionInfo(stage)?.notes && (
                        <Box sx={{ mt: 1, p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Notes:</strong> {getStageCompletionInfo(stage).notes}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  ) : isCurrentStage(stage) ? (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        This is the current active stage
                      </Typography>
                      
                      <Button
                        variant="contained"
                        size="small"
                        color="primary"
                        onClick={() => handleStageUpdate(stage)}
                        startIcon={<CheckIcon />}
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
            No workflow stages configured for this order.
          </Alert>
        )}
      </Paper>
      
      {/* Stage completion dialog */}
      <Dialog
        open={stageDialogOpen}
        onClose={() => setStageDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Complete Stage: {selectedStage}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ my: 1 }}>
            <Typography variant="body2" paragraph>
              Are you sure you want to mark this stage as completed?
              This will advance the order to the next stage in the workflow.
            </Typography>
            
            <TextField
              autoFocus
              label="Notes (optional)"
              fullWidth
              multiline
              rows={4}
              value={stageNote}
              onChange={(e) => setStageNote(e.target.value)}
              variant="outlined"
              margin="normal"
              placeholder="Add any notes about this stage completion..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStageDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmitStageUpdate}
            disabled={updating}
            startIcon={updating ? <CircularProgress size={20} /> : null}
          >
            {updating ? 'Updating...' : 'Complete & Continue'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrderTracking;