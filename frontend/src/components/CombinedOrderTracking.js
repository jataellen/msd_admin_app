// IntegratedOrderTracking.js - A component that integrates history events into the workflow timeline
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
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  InputAdornment,
  IconButton,
  Tooltip,
  LinearProgress,
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
  Info as InfoIcon,
  DonutLarge as DonutLargeIcon,
  Comment as CommentIcon,
  History as HistoryIcon,
  AddComment as AddCommentIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Event as EventIcon,
  Send as SendIcon,
  Assignment as AssignmentIcon,
  Payment as PaymentIcon,
  Description as DocumentIcon,
  Create as CreateIcon,
  Update as UpdateIcon
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

// Event type definitions with icons and colors
const EVENT_TYPES = {
  'stage_change': { icon: <TimelineIcon />, color: 'primary', label: 'Stage Change' },
  'note': { icon: <CommentIcon />, color: 'secondary', label: 'Note' },
  'creation': { icon: <CreateIcon />, color: 'success', label: 'Created' },
  'update': { icon: <UpdateIcon />, color: 'info', label: 'Updated' },
  'document': { icon: <DocumentIcon />, color: 'warning', label: 'Document' },
  'payment': { icon: <PaymentIcon />, color: 'error', label: 'Payment' },
  'status_change': { icon: <AssignmentIcon />, color: 'info', label: 'Status Change' },
  'default': { icon: <HistoryIcon />, color: 'default', label: 'Event' }
};

const CombinedOrderTracking = ({ orderId, orderData }) => {
  // Common state variables
  const [order, setOrder] = useState(orderData || null);
  const [loading, setLoading] = useState(!orderData);
  const [error, setError] = useState(null);
  
  // Tracking-specific state variables
  const [workflowStages, setWorkflowStages] = useState([]);
  const [workflowStatuses, setWorkflowStatuses] = useState([]);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [statusNote, setStatusNote] = useState('');
  const [updating, setUpdating] = useState(false);
  
  // History-specific state variables
  const [events, setEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Map to store events by stage
  const [stageEvents, setStageEvents] = useState({});
  
  // Fetch order and workflow data if not provided
  useEffect(() => {
    if (orderData) {
      setOrder(orderData);
      const orderType = orderData.type || 'MATERIALS_ONLY';
      fetchWorkflowData(orderType);
      fetchEvents();
    } else if (orderId) {
      fetchOrder();
    }
  }, [orderId, orderData]);
  
  // Filter events based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredEvents(events);
      return;
    }
    
    const lowercasedSearch = searchTerm.toLowerCase();
    const filtered = events.filter(event => 
      (event.description && event.description.toLowerCase().includes(lowercasedSearch)) ||
      (event.event_type && event.event_type.toLowerCase().includes(lowercasedSearch)) ||
      (event.previous_stage && event.previous_stage.toLowerCase().includes(lowercasedSearch)) ||
      (event.new_stage && event.new_stage.toLowerCase().includes(lowercasedSearch)) ||
      (event.user_email && event.user_email.toLowerCase().includes(lowercasedSearch))
    );
    
    setFilteredEvents(filtered);
  }, [searchTerm, events]);
  
  // Organize events by stage when data changes
  useEffect(() => {
    if (order && events.length && workflowStages.length) {
      organizeEventsByStage();
    }
  }, [order, events, workflowStages]);
  
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
        fetchEvents();
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
  
  // Fetch events from API
  const fetchEvents = async () => {
    if (!orderId) {
      return;
    }
    
    try {
      const response = await axios.get(`${API_URL}/orders/${orderId}/history`, {
        withCredentials: true
      });
      
      if (response.data && response.data.events) {
        setEvents(response.data.events);
        setFilteredEvents(response.data.events);
      } else {
        setEvents([]);
        setFilteredEvents([]);
      }
    } catch (err) {
      console.error('Error fetching order history:', err);
      setError((prevError) => prevError || 'Failed to load order history. Please try again.');
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
  
  // Add a note to the order
  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    setSubmitting(true);
    
    try {
      await axios.post(
        `${API_URL}/orders/${orderId}/notes`,
        { note: newNote },
        { withCredentials: true }
      );
      
      // Close dialog and reset form
      setNoteDialogOpen(false);
      setNewNote('');
      
      // Refresh events
      fetchEvents();
    } catch (err) {
      console.error('Error adding note:', err);
      setError('Failed to add note. Please try again.');
    } finally {
      setSubmitting(false);
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
  
  // Get event type info
  const getEventTypeInfo = (eventType) => {
    return EVENT_TYPES[eventType] || EVENT_TYPES.default;
  };
  
  // Get user display name
  const getUserDisplay = (event) => {
    if (!event) return 'Unknown';
    
    if (event.user_email) return event.user_email;
    
    // Format UUID for display
    if (event.created_by && typeof event.created_by === 'string') {
      return `User ${event.created_by.substring(0, 8)}...`;
    }
    
    return 'Unknown User';
  };
  
  // Organize events by stage
  const organizeEventsByStage = () => {
    const stageMap = {};
    
    // Initialize each stage with an empty events array
    workflowStages.forEach(stage => {
      stageMap[stage.id] = [];
    });
    
    // Add a "general" category for events not tied to a specific stage
    stageMap['general'] = [];
    
    // Process each event
    filteredEvents.forEach(event => {
      // Try to associate event with a stage
      let stageId = null;
      
      // For stage_change events, use the new stage
      if (event.event_type === 'stage_change' && event.new_stage) {
        // Find stage by name
        const stage = workflowStages.find(s => s.name === event.new_stage);
        if (stage) {
          stageId = stage.id;
        }
      }
      
      // For status_change events, find the stage that contains this status
      if (event.event_type === 'status_change' && event.metadata && event.metadata.status_id) {
        const stage = findStageForStatus(event.metadata.status_id);
        if (stage) {
          stageId = stage.id;
        }
      }
      
      // If we couldn't associate with a specific stage, put in "general"
      if (!stageId) {
        stageMap['general'].push(event);
      } else {
        // Add to the appropriate stage
        stageMap[stageId].push(event);
      }
    });
    
    setStageEvents(stageMap);
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Alert 
        severity="error" 
        sx={{ mb: 2 }}
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
  
  // Any general events that aren't tied to a specific stage
  const generalEvents = stageEvents['general'] || [];
  
  return (
    <Box>
      {/* Progress Summary Bar */}
      <Paper 
        elevation={0} 
        variant="outlined" 
        sx={{ 
          mb: 2, 
          borderRadius: '8px', 
          overflow: 'hidden',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}
      >
        <Box sx={{ p: 2, pb: 1, bgcolor: 'grey.100' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <DonutLargeIcon color="primary" sx={{ mr: 1, fontSize: 20 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
              Order Progress
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ p: 2, pt: 1 }}>
          <Grid container spacing={4} alignItems="center">
            {/* Progress indicator */}
            <Grid item xs={12} sm={3}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ width: '100%', mr: 1 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={progress} 
                    sx={{ 
                      height: 10, 
                      borderRadius: 5,
                      backgroundColor: 'grey.200'
                    }} 
                  />
                </Box>
                <Box sx={{ minWidth: 35 }}>
                  <Typography variant="body2" color="text.secondary">
                    {`${progress}%`}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
            {/* Statuses count */}
            <Grid item xs={12} sm={3}>
              <Typography variant="subtitle2" color="text.secondary">
                Completed Statuses
              </Typography>
              <Typography variant="h6" color="text.primary" sx={{ fontWeight: 500 }}>
                {(order.completed_statuses || []).length} <Typography component="span" variant="body2" color="text.secondary">of {workflowStatuses.length}</Typography>
              </Typography>
            </Grid>
            
            {/* Current Stage */}
            <Grid item xs={12} sm={3}>
              <Typography variant="subtitle2" color="text.secondary">
                Current Stage
              </Typography>
              <Typography variant="body1" color="primary.main" sx={{ fontWeight: 500 }}>
                {currentStage.name}
              </Typography>
            </Grid>
            
            {/* Current Status */}
            <Grid item xs={12} sm={3}>
              <Typography variant="subtitle2" color="text.secondary">
                Current Status
              </Typography>
              <Chip 
                label={currentStatus.name} 
                color="primary"
                size="small"
                variant="filled"
                sx={{ fontWeight: 500, mt: 0.5 }}
              />
            </Grid>
          </Grid>
        </Box>
      </Paper>
      
      {/* Action Bar with Next Actions & Add Note & Search */}
      <Paper elevation={0} variant="outlined" sx={{ p: 2, mb: 2, borderRadius: '8px' }}>
        <Grid container spacing={2} alignItems="center">
          {/* Next Available Actions */}
          <Grid item xs={12} md={5}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <InfoIcon fontSize="small" color="info" />
              <Typography variant="subtitle2" color="text.secondary">
                Next Available Actions:
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, ml: 1 }}>
                {nextAvailableStatuses.length > 0 ? (
                  nextAvailableStatuses.map(status => (
                    <Chip
                      key={status.id}
                      label={status.name}
                      color="info"
                      variant="outlined"
                      size="small"
                      onClick={() => handleStatusUpdate(status.id)}
                      clickable
                    />
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No next actions available
                  </Typography>
                )}
              </Box>
            </Box>
          </Grid>
          
          {/* Search */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search history..."
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => setSearchTerm('')}
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          
          {/* Action Buttons */}
          <Grid item xs={12} md={3} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<AddCommentIcon />}
              onClick={() => setNoteDialogOpen(true)}
              size="small"
            >
              Add Note
            </Button>
            <Button
              variant="outlined"
              startIcon={<HistoryIcon />}
              onClick={() => { fetchOrder(); fetchEvents(); }}
              size="small"
            >
              Refresh
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Integrated Workflow Timeline with History Events */}
      <Paper 
        elevation={0} 
        variant="outlined" 
        sx={{ 
          borderRadius: '8px', 
          overflow: 'hidden',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}
      >
        <Box sx={{ p: 2, pb: 1, bgcolor: 'grey.100' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TimelineIcon color="primary" sx={{ mr: 1, fontSize: 20 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
              Order Timeline & History
            </Typography>
          </Box>
        </Box>
        
        <Divider />
        
        <Box sx={{ maxHeight: 600, overflow: 'auto' }}>
          {/* General events that aren't tied to a specific stage */}
          {generalEvents.length > 0 && (
            <Box sx={{ px: 2, pt: 2, mb: 2 }}>
              <Box sx={{ 
                p: 2, 
                bgcolor: 'grey.50', 
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider'
              }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  General Order Activity
                </Typography>
                
                <Box sx={{ ml: 1 }}>
                  {generalEvents.map((event, index) => {
                    const eventTypeInfo = getEventTypeInfo(event.event_type);
                    
                    return (
                      <Box 
                        key={event.event_id || index}
                        sx={{ 
                          position: 'relative',
                          borderLeft: '2px solid',
                          borderLeftColor: `${eventTypeInfo.color}.main`,
                          pl: 2,
                          py: 1,
                          mb: 2,
                          bgcolor: 'background.paper',
                          borderRadius: '0 4px 4px 0',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                          <Avatar 
                            sx={{ 
                              width: 32, 
                              height: 32, 
                              mr: 1.5,
                              bgcolor: `${eventTypeInfo.color}.main`,
                              fontSize: '0.875rem'
                            }}
                          >
                            {eventTypeInfo.icon}
                          </Avatar>
                          
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {event.description}
                              </Typography>
                              
                              <Chip 
                                label={eventTypeInfo.label}
                                color={eventTypeInfo.color}
                                size="small"
                                variant="outlined"
                                sx={{ height: 20, '& .MuiChip-label': { px: 1, py: 0.25, fontSize: '0.7rem' } }}
                              />
                            </Box>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5, fontSize: '0.75rem' }}>
                              <PersonIcon fontSize="inherit" sx={{ mr: 0.5, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary" component="span">
                                {getUserDisplay(event)}
                              </Typography>
                              
                              <Box sx={{ mx: 0.5, color: 'text.disabled' }}>•</Box>
                              
                              <EventIcon fontSize="inherit" sx={{ mr: 0.5, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary" component="span">
                                {formatDate(event.created_at)}
                              </Typography>
                            </Box>
                            
                            {event.metadata && Object.keys(event.metadata).length > 0 && (
                              <Box sx={{ 
                                mt: 1, 
                                p: 1, 
                                bgcolor: 'background.default',
                                borderRadius: 1,
                                fontSize: '0.75rem'
                              }}>
                                {Object.entries(event.metadata).map(([key, value]) => (
                                  <Typography key={key} variant="caption" display="block">
                                    <strong>{key.replace(/_/g, ' ')}:</strong> {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                  </Typography>
                                ))}
                              </Box>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            </Box>
          )}
          
          {/* Workflow Timeline with Integrated History */}
          <Stepper activeStep={activeStep} orientation="vertical" sx={{ pb: 2, pt: searchTerm ? 1 : 0 }}>
            {workflowStages.map((stage, index) => {
              const isStageActive = isStageCurrentlyActive(stage.id);
              const isFullyCompleted = isStageFullyCompleted(stage.id);
              const hasAnyCompleted = hasStageAnyCompletedStatus(stage.id);
              const stageHistoryEvents = stageEvents[stage.id] || [];
              
              return (
                <Step 
                  key={stage.id} 
                  completed={isFullyCompleted}
                  expanded={true}
                >
                  <StepLabel 
                    StepIconProps={{
                      color: isFullyCompleted ? 'success' : isStageActive ? 'primary' : 'default'
                    }}
                  >
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        fontWeight: isStageActive ? 600 : 500,
                        color: isFullyCompleted ? 'success.main' : isStageActive ? 'primary.main' : 'text.primary'
                      }}
                    >
                      {stage.name}
                    </Typography>
                  </StepLabel>
                  
                  <StepContent sx={{ px: 1, py: 0.5 }}>
                    <Box sx={{ 
                      ml: 1, 
                      pl: 1, 
                      borderLeft: isStageActive ? '2px solid' : '1px dashed', 
                      borderColor: isStageActive ? 'primary.main' : 'divider'
                    }}>
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
                              py: 1,
                              borderBottom: '1px dashed',
                              borderColor: 'divider'
                            }}
                          >
                            <Box sx={{ mr: 1, mt: 0.5, minWidth: 22 }}>
                              {isCompleted ? (
                                <CheckIcon color="success" fontSize="small" />
                              ) : isCurrent ? (
                                <TimelineIcon color="primary" fontSize="small" />
                              ) : (
                                <CircleIcon sx={{ color: 'grey.300', fontSize: 14 }} />
                              )}
                            </Box>
                            
                            <Box sx={{ flexGrow: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    fontWeight: isCurrent ? 600 : isCompleted ? 500 : 400,
                                    color: isCompleted ? 'success.main' : isCurrent ? 'primary.main' : 'text.secondary'
                                  }}
                                >
                                  {status.name}
                                </Typography>
                                
                                {isCompleted && (
                                  <Tooltip title={`Completed on ${formatDate(completionInfo?.completed_at)}`}>
                                    <Chip 
                                      label="Completed" 
                                      color="success" 
                                      size="small" 
                                      variant="outlined"
                                      sx={{ height: 20, '& .MuiChip-label': { px: 1, py: 0.25, fontSize: '0.7rem' } }}
                                    />
                                  </Tooltip>
                                )}
                                
                                {isCurrent && (
                                  <Chip 
                                    label="Current" 
                                    color="primary" 
                                    size="small" 
                                    variant="filled"
                                    sx={{ height: 20, '& .MuiChip-label': { px: 1, py: 0.25, fontSize: '0.7rem' } }}
                                  />
                                )}
                              </Box>
                              
                              {isCompleted && completionInfo?.notes && (
                                <Tooltip title={completionInfo.notes}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                    <NoteIcon sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                                    <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 250 }}>
                                      {completionInfo.notes}
                                    </Typography>
                                  </Box>
                                </Tooltip>
                              )}
                              
                              {isCurrent && (
                                <Button
                                  variant="outlined"
                                  size="small"
                                  color="primary"
                                  onClick={() => handleStatusUpdate(status.id)}
                                  sx={{ mt: 1, textTransform: 'none', px: 1.5, py: 0.25 }}
                                >
                                  Complete & Continue
                                </Button>
                              )}
                            </Box>
                          </Box>
                        );
                      })}
                      
                      {/* Display history events related to this stage */}
                      {stageHistoryEvents.length > 0 && (
                        <Box sx={{ mt: 1, mb: 2, pl: 1 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, mt: 1 }}>
                            Stage History
                          </Typography>
                          
                          {stageHistoryEvents.map((event, index) => {
                            const eventTypeInfo = getEventTypeInfo(event.event_type);
                            
                            return (
                              <Box 
                                key={event.event_id || index}
                                sx={{ 
                                  position: 'relative',
                                  borderLeft: '2px solid',
                                  borderLeftColor: `${eventTypeInfo.color}.main`,
                                  pl: 2,
                                  py: 1,
                                  mb: 2,
                                  bgcolor: 'background.paper',
                                  borderRadius: '0 4px 4px 0',
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                }}
                              >
                                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                  <Avatar 
                                    sx={{ 
                                      width: 32, 
                                      height: 32, 
                                      mr: 1.5,
                                      bgcolor: `${eventTypeInfo.color}.main`,
                                      fontSize: '0.875rem'
                                    }}
                                  >
                                    {eventTypeInfo.icon}
                                  </Avatar>
                                  
                                  <Box sx={{ flex: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        {event.description}
                                      </Typography>
                                      
                                      <Chip 
                                        label={eventTypeInfo.label}
                                        color={eventTypeInfo.color}
                                        size="small"
                                        variant="outlined"
                                        sx={{ height: 20, '& .MuiChip-label': { px: 1, py: 0.25, fontSize: '0.7rem' } }}
                                      />
                                    </Box>
                                    
                                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5, fontSize: '0.75rem' }}>
                                      <PersonIcon fontSize="inherit" sx={{ mr: 0.5, color: 'text.secondary' }} />
                                      <Typography variant="caption" color="text.secondary" component="span">
                                        {getUserDisplay(event)}
                                      </Typography>
                                      
                                      <Box sx={{ mx: 0.5, color: 'text.disabled' }}>•</Box>
                                      
                                      <EventIcon fontSize="inherit" sx={{ mr: 0.5, color: 'text.secondary' }} />
                                      <Typography variant="caption" color="text.secondary" component="span">
                                        {formatDate(event.created_at)}
                                      </Typography>
                                    </Box>
                                    
                                    {event.event_type === 'stage_change' && event.previous_stage && event.new_stage && (
                                      <Box sx={{ 
                                        mt: 1, 
                                        p: 1, 
                                        bgcolor: 'background.default',
                                        borderRadius: 1,
                                        fontSize: '0.75rem'
                                      }}>
                                        <Typography variant="caption">
                                          Stage changed from <b>{event.previous_stage}</b> to <b>{event.new_stage}</b>
                                        </Typography>
                                      </Box>
                                    )}
                                    
                                    {event.metadata && Object.keys(event.metadata).length > 0 && (
                                      <Box sx={{ 
                                        mt: 1, 
                                        p: 1, 
                                        bgcolor: 'background.default',
                                        borderRadius: 1,
                                        fontSize: '0.75rem'
                                      }}>
                                        {Object.entries(event.metadata).map(([key, value]) => (
                                          <Typography key={key} variant="caption" display="block">
                                            <strong>{key.replace(/_/g, ' ')}:</strong> {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                          </Typography>
                                        ))}
                                      </Box>
                                    )}
                                  </Box>
                                </Box>
                              </Box>
                            );
                          })}
                        </Box>
                      )}
                    </Box>
                  </StepContent>
                </Step>
              );
            })}
          </Stepper>
        </Box>
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
      
      {/* Add Note Dialog */}
      <Dialog 
        open={noteDialogOpen} 
        onClose={() => setNoteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Note to Order History</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            multiline
            rows={4}
            label="Note"
            fullWidth
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            margin="dense"
            placeholder="Enter your note about this order..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNoteDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            color="primary"
            startIcon={submitting ? <CircularProgress size={20} /> : <SendIcon />}
            onClick={handleAddNote}
            disabled={!newNote.trim() || submitting}
          >
            {submitting ? 'Adding...' : 'Add Note'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CombinedOrderTracking;