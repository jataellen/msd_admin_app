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
  Grid,
  LinearProgress,
  Avatar,
  Tooltip,
  Badge,
  IconButton
} from '@mui/material';

// Material UI icons
import {
  Check as CheckIcon,
  Timeline as TimelineIcon,
  ArrowForward as ArrowForwardIcon,
  AccessTime as AccessTimeIcon,
  Person as PersonIcon,
  Note as NoteIcon,
  RadioButtonUnchecked as CircleIcon,
  Info as InfoIcon
} from '@mui/icons-material';

const API_URL = 'http://localhost:8000';

// Status type colors mapping
const STATUS_COLORS = {
  completed: {
    background: '#e8f5e9',
    color: '#2e7d32',
    borderColor: '#a5d6a7',
    chipBackground: '#4caf50',
    chipColor: '#fff'
  },
  current: {
    background: '#e3f2fd',
    color: '#1976d2',
    borderColor: '#90caf9',
    chipBackground: '#2196f3',
    chipColor: '#fff'
  },
  pending: {
    background: '#fff',
    color: '#757575',
    borderColor: '#e0e0e0',
    chipBackground: '#f5f5f5',
    chipColor: '#757575'
  }
};

const OrderTracking = ({ orderId, orderData }) => {
  // State variables
  const [order, setOrder] = useState(orderData || null);
  const [loading, setLoading] = useState(!orderData);
  const [error, setError] = useState(null);
  const [workflowStages, setWorkflowStages] = useState([]);
  const [workflowStatuses, setWorkflowStatuses] = useState([]);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [statusNote, setStatusNote] = useState('');
  const [updating, setUpdating] = useState(false);
  
  // Fetch order and workflow data if not provided
  useEffect(() => {
    if (orderData) {
      setOrder(orderData);
      const orderType = orderData.type || 'MATERIALS_ONLY';
      fetchWorkflowData(orderType);
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
        const orderType = response.data.order.type || 'MATERIALS_ONLY';
        fetchWorkflowData(orderType);
      } else {
        throw new Error('Invalid order data received from server');
      }
    } catch (err) {
      console.error('Error fetching order:', err);
      setError('Failed to load order data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch workflow data
  const fetchWorkflowData = async (type) => {
    try {
      // Default to MATERIALS_ONLY if type is undefined
      const orderType = type || 'MATERIALS_ONLY';
      
      // Get the full workflow data
      const response = await axios.get(`${API_URL}/workflow/full-workflow/${orderType}`, {
        withCredentials: true
      });
      
      if (!response.data || !response.data.stages || !Array.isArray(response.data.stages)) {
        throw new Error('Invalid workflow data structure received');
      }
      
      setWorkflowStages(response.data.stages);
      
      // Extract all statuses from all stages
      const allStatuses = [];
      response.data.stages.forEach(stage => {
        if (stage.statuses && Array.isArray(stage.statuses)) {
          stage.statuses.forEach(status => {
            allStatuses.push(status);
          });
        }
      });
      
      setWorkflowStatuses(allStatuses);
      
    } catch (err) {
      console.error('Error fetching workflow data:', err);
      setError('Failed to load workflow data. Please contact support.');
    }
  };
  
  // Find the status object by ID
  const findStatusById = (statusId) => {
    return workflowStatuses.find(status => status.id === statusId);
  };
  
  // Find the stage that contains a specific status
  const findStageForStatus = (statusId) => {
    for (const stage of workflowStages) {
      if (stage.statuses && Array.isArray(stage.statuses)) {
        if (stage.statuses.some(status => status.id === statusId)) {
          return stage;
        }
      }
    }
    return null;
  };
  
  // Check if a status is completed
  const isStatusCompleted = (statusId) => {
    if (!order || !order.completed_statuses || !Array.isArray(order.completed_statuses)) return false;
    
    return order.completed_statuses.includes(statusId);
  };
  
  // Get status completion info
  const getStatusCompletionInfo = (statusId) => {
    if (!order || !order.status_history || !Array.isArray(order.status_history)) return null;
    
    // Find the most recent entry for this status in the history
    const entries = order.status_history.filter(entry => entry.status === statusId);
    if (entries.length > 0) {
      // Sort by completion date descending and return the most recent
      return entries.sort((a, b) => 
        new Date(b.completed_at) - new Date(a.completed_at)
      )[0];
    }
    
    return null;
  };
  
  // Check if status is current
  const isCurrentStatus = (statusId) => {
    if (!order || !order.current_status) return false;
    
    return order.current_status === statusId;
  };
  
  // Get all statuses for a stage
  const getStatusesForStage = (stageId) => {
    const stage = workflowStages.find(s => s.id === stageId);
    if (stage && stage.statuses && Array.isArray(stage.statuses)) {
      return stage.statuses;
    }
    return [];
  };
  
  // Check if a stage has any completed statuses
  const hasStageAnyCompletedStatus = (stageId) => {
    const statuses = getStatusesForStage(stageId);
    return statuses.some(status => isStatusCompleted(status.id));
  };
  
  // Check if a stage has all statuses completed
  const isStageFullyCompleted = (stageId) => {
    const statuses = getStatusesForStage(stageId);
    return statuses.length > 0 && statuses.every(status => isStatusCompleted(status.id));
  };
  
  // Check if a stage is current (i.e., contains the current status)
  const isStageCurrentlyActive = (stageId) => {
    if (!order || !order.current_status) return false;
    
    const stage = workflowStages.find(s => s.id === stageId);
    if (!stage || !stage.statuses || !Array.isArray(stage.statuses)) return false;
    
    return stage.statuses.some(status => status.id === order.current_status);
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // Calculate active step for the stepper
  const getActiveStep = () => {
    if (!order || !workflowStages.length) return 0;
    
    // Find the index of the stage containing the current status
    for (let i = 0; i < workflowStages.length; i++) {
      if (isStageCurrentlyActive(workflowStages[i].id)) {
        return i;
      }
    }
    
    // If no active stage found, find the last stage with any completed status
    for (let i = workflowStages.length - 1; i >= 0; i--) {
      if (hasStageAnyCompletedStatus(workflowStages[i].id)) {
        return i + 1;  // Point to the next stage
      }
    }
    
    return 0;  // Default to first stage
  };
  
  // Handle opening status update dialog
  const handleStatusUpdate = (statusId) => {
    setSelectedStatus(statusId);
    setStatusNote('');
    setStatusDialogOpen(true);
  };
  
  // Handle submitting status update
  const handleSubmitStatusUpdate = async () => {
    if (!selectedStatus || !order) return;
    
    setUpdating(true);
    
    try {
      const response = await axios.post(
        `${API_URL}/orders/${order.order_id}/update-status`,
        {
          new_status: selectedStatus,
          notes: statusNote || null
        },
        { withCredentials: true }
      );
      
      if (response.data) {
        setOrder(response.data);
        setStatusDialogOpen(false);
        // Refresh order to get latest data
        fetchOrder();
      } else {
        throw new Error('Invalid response data after status update');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update status. Please try again.');
    } finally {
      setUpdating(false);
    }
  };
  
  // Calculate progress percentage
  const calculateProgress = () => {
    if (!workflowStatuses.length) return 0;
    
    let completedCount = 0;
    
    for (const status of workflowStatuses) {
      if (isStatusCompleted(status.id)) {
        completedCount++;
      }
    }
    
    return Math.round((completedCount / workflowStatuses.length) * 100);
  };
  
  // Get next available statuses
  const getNextAvailableStatuses = () => {
    if (!order || !order.current_status || !workflowStatuses.length) return [];
    
    // Find the current status index
    const currentStatusIndex = workflowStatuses.findIndex(
      status => status.id === order.current_status
    );
    
    if (currentStatusIndex === -1 || currentStatusIndex >= workflowStatuses.length - 1) {
      return [];
    }
    
    // Return the next 3 statuses after the current one
    return workflowStatuses
      .slice(currentStatusIndex + 1, currentStatusIndex + 4)
      .map(status => status);
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
      <Alert severity="error">
        Order data is not available. Please check the order ID and try again.
      </Alert>
    );
  }
  
  if (workflowStages.length === 0) {
    return (
      <Alert severity="error">
        Workflow data could not be loaded. Please reload the page or contact support.
      </Alert>
    );
  }
  
  const activeStep = getActiveStep();
  const progress = calculateProgress();
  const nextAvailableStatuses = getNextAvailableStatuses();
  
  // Find the current status object
  const currentStatus = findStatusById(order.current_status) || 
                      { id: 'NOT_STARTED', name: 'Not Started' };
  
  // Find the current stage 
  const currentStage = findStageForStatus(order.current_status) || 
                     { id: 'UNKNOWN', name: 'Unknown Stage' };
  
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
                {currentStage.name}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Current Status
              </Typography>
              <Typography variant="h6" noWrap sx={{ fontWeight: 500 }}>
                {currentStatus.name}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Completed Statuses
              </Typography>
              <Typography variant="h5" color="success.main" sx={{ fontWeight: 600 }}>
                {(order.completed_statuses || []).length} / {workflowStatuses.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Current Status */}
      <Paper elevation={0} variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <TimelineIcon color="info" sx={{ mr: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 500 }}>
            Current Status
          </Typography>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Current Stage: <strong>{currentStage.name}</strong>
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Chip 
            label={currentStatus.name} 
            color="primary"
            size="large"
          />
          
          {nextAvailableStatuses.length > 0 && (
            <>
              <Typography variant="body1">
                Next available statuses:
              </Typography>
              
              {nextAvailableStatuses.map(status => (
                <Chip
                  key={status.id}
                  label={status.name}
                  color="info"
                  variant="outlined"
                  onClick={() => handleStatusUpdate(status.id)}
                  clickable
                />
              ))}
            </>
          )}
        </Box>
      </Paper>
      
      {/* Workflow Stepper */}
      <Paper elevation={0} variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <TimelineIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 500 }}>
            Workflow Progress
          </Typography>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        <Stepper activeStep={activeStep} orientation="vertical">
          {workflowStages.map((stage, index) => {
            const isStageActive = isStageCurrentlyActive(stage.id);
            const isFullyCompleted = isStageFullyCompleted(stage.id);
            const hasAnyCompleted = hasStageAnyCompletedStatus(stage.id);
            
            return (
              <Step 
                key={stage.id} 
                completed={isFullyCompleted}
                expanded={true}
              >
                <StepLabel>
                  <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                    {stage.name}
                  </Typography>
                </StepLabel>
                
                <StepContent>
                  <Box sx={{ mb: 2 }}>
                    {/* Display all statuses in this stage */}
                    {stage.statuses && stage.statuses.map(status => {
                      const isCompleted = isStatusCompleted(status.id);
                      const isCurrent = isCurrentStatus(status.id);
                      const completionInfo = getStatusCompletionInfo(status.id);
                      
                      return (
                        <Box 
                          key={status.id} 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'flex-start', 
                            mb: 1.5,
                            p: 1,
                            borderRadius: 1,
                            backgroundColor: isCurrent ? 'primary.50' : 'transparent',
                            border: isCurrent ? '1px solid' : 'none',
                            borderColor: 'primary.200'
                          }}
                        >
                          <Box sx={{ mr: 2, mt: 0.5 }}>
                            {isCompleted ? (
                              <CheckIcon color="success" fontSize="small" />
                            ) : isCurrent ? (
                              <TimelineIcon color="primary" fontSize="small" />
                            ) : (
                              <div style={{ width: 20, height: 20 }}></div>
                            )}
                          </Box>
                          
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography 
                              variant="body1" 
                              sx={{ 
                                fontWeight: isCurrent ? 600 : isCompleted ? 500 : 400,
                                color: isCompleted ? 'success.main' : isCurrent ? 'primary.main' : 'text.primary'
                              }}
                            >
                              {status.name}
                            </Typography>
                            
                            {isCompleted && completionInfo && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                Completed {formatDate(completionInfo.completed_at)}
                              </Typography>
                            )}
                            
                            {isCompleted && completionInfo?.notes && (
                              <Box sx={{ mt: 0.5, p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                  <strong>Notes:</strong> {completionInfo.notes}
                                </Typography>
                              </Box>
                            )}
                            
                            {isCurrent && (
                              <Box sx={{ mt: 1 }}>
                                <Button
                                  variant="contained"
                                  size="small"
                                  color="primary"
                                  onClick={() => handleStatusUpdate(status.id)}
                                  startIcon={<CheckIcon />}
                                >
                                  Complete & Continue
                                </Button>
                              </Box>
                            )}
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                </StepContent>
              </Step>
            );
          })}
        </Stepper>
      </Paper>
      
      {/* Status completion dialog */}
      <Dialog
        open={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Complete Status: {findStatusById(selectedStatus)?.name || selectedStatus}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ my: 1 }}>
            <Typography variant="body2" paragraph>
              Are you sure you want to mark this status as completed?
              This will advance the order to the next status in the workflow.
            </Typography>
            
            <TextField
              autoFocus
              label="Notes (optional)"
              fullWidth
              multiline
              rows={4}
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              variant="outlined"
              margin="normal"
              placeholder="Add any notes about this status completion..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmitStatusUpdate}
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