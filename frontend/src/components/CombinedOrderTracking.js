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
  Update as UpdateIcon,
  Add as AddIcon,
  Task as TaskIcon,
  AttachFile as AttachFileIcon,
  CreditCard as CreditCardIcon,
  LocalShipping as ShippingIcon,
  Build as BuildIcon
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
  'order_creation': { icon: <CreateIcon />, color: 'success', label: 'Order Created' },
  'workflow_status_change': { icon: <AssignmentIcon />, color: 'primary', label: 'Status Change' },
  'stage_completion': { icon: <CheckIcon />, color: 'success', label: 'Stage Complete' },
  'stage_transition': { icon: <ArrowForwardIcon />, color: 'info', label: 'Stage Transition' },
  'stage_change': { icon: <TimelineIcon />, color: 'primary', label: 'Stage Change' },
  'note': { icon: <CommentIcon />, color: 'secondary', label: 'Note' },
  'creation': { icon: <CreateIcon />, color: 'success', label: 'Created' },
  'update': { icon: <UpdateIcon />, color: 'info', label: 'Updated' },
  'document': { icon: <DocumentIcon />, color: 'warning', label: 'Document' },
  'payment': { icon: <PaymentIcon />, color: 'error', label: 'Payment' },
  'status_change': { icon: <AssignmentIcon />, color: 'info', label: 'Status Change' },
  'default': { icon: <HistoryIcon />, color: 'default', label: 'Event' }
};

// Map workflow status to stage - same logic as backend
const mapWorkflowStatusToStage = (workflowStatus) => {
  if (!workflowStatus) return "LEAD_ACQUISITION";
  
  const status = workflowStatus.toUpperCase();
  
  // LEAD_ACQUISITION stage
  if (['NEW_LEAD', 'QUOTE_REQUESTED', 'SITE_VISIT_SCHEDULED', 'SITE_VISIT_COMPLETED', 'DETAILED_MEASUREMENT_SCHEDULED', 'DETAILED_MEASUREMENT_COMPLETED'].includes(status)) {
    return 'LEAD_ACQUISITION';
  }
  // QUOTATION stage
  else if (['QUOTE_PREPARED', 'QUOTE_SENT', 'QUOTE_APPROVED', 'QUOTE_ACCEPTED'].includes(status)) {
    return 'QUOTATION';
  }
  // PROCUREMENT stage
  else if (['WORK_ORDER_SENT', 'WORK_ORDER_SIGNED', 'MATERIALS_ORDERED', 'MATERIALS_RECEIVED', 'MATERIALS_BACKORDERED', 'WORK_ORDER_CREATED', 'DEPOSIT_REQUESTED', 'DEPOSIT_RECEIVED', 'DEPOSIT_PENDING', 'DETAILED_MEASUREMENT', 'PO_CREATED', 'PO_SENT', 'SUPPLIER_CONFIRMED'].includes(status)) {
    return 'PROCUREMENT';
  }
  // FULFILLMENT stage
  else if (['DELIVERY_SCHEDULED', 'DELIVERY_COMPLETED', 'DELIVERED', 'INSTALLATION_SCHEDULED', 'INSTALLATION_IN_PROGRESS', 'INSTALLATION_COMPLETED', 'DELIVERY_DELAYED', 'INSTALLATION_DELAYED', 'MATERIALS_RECEIVED', 'INSTALLATION_READY', 'FINAL_INSPECTION', 'PARTIAL_RECEIVED', 'CUSTOMER_NOTIFIED', 'READY_FOR_PICKUP', 'IN_TRANSIT'].includes(status)) {
    return 'FULFILLMENT';
  }
  // FINALIZATION stage
  else if (['PAYMENT_RECEIVED', 'ORDER_COMPLETED', 'COMPLETED', 'FOLLOW_UP_SCHEDULED', 'FOLLOW_UP_SENT', 'INVOICE_SENT', 'REVIEW_REQUESTED', 'PENDING_FINAL_PAYMENT'].includes(status)) {
    return 'FINALIZATION';
  }
  // Handle special cases
  else if (['ORDER_CANCELLED', 'QUOTE_REJECTED'].includes(status)) {
    return 'CANCELLED';
  }
  else if (['CUSTOMER_COMMUNICATION_NEEDED', 'AWAITING_CUSTOMER_APPROVAL', 'CHANGE_ORDER_REQUESTED', 'PAYMENT_PENDING'].includes(status)) {
    return 'ON_HOLD';
  }
  else {
    return 'LEAD_ACQUISITION'; // Default fallback
  }
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
      const response = await axios.get(`${API_URL}/order-events/${orderId}`, {
        withCredentials: true
      });
      
      if (response.data) {
        setEvents(response.data);
        setFilteredEvents(response.data);
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
        `${API_URL}/order-events/${orderId}/note`,
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
  
  // Create a chronological timeline that combines workflow statuses and events
  const createChronologicalTimeline = () => {
    const timelineItems = [];
    
    // Add workflow status completions from order history
    if (order && order.status_history && Array.isArray(order.status_history)) {
      order.status_history.forEach(statusCompletion => {
        const status = findStatusById(statusCompletion.status);
        if (status) {
          timelineItems.push({
            type: 'status_completion',
            timestamp: new Date(statusCompletion.completed_at),
            status: status,
            notes: statusCompletion.notes,
            completed_by: statusCompletion.completed_by,
            data: statusCompletion
          });
        }
      });
    }
    
    // Add events from history
    filteredEvents.forEach(event => {
      timelineItems.push({
        type: 'event',
        timestamp: new Date(event.created_at),
        event: event,
        data: event
      });
    });
    
    // Sort chronologically (oldest first)
    timelineItems.sort((a, b) => a.timestamp - b.timestamp);
    
    return timelineItems;
  };
  
  // Organize events by stage with better timestamp-based assignment
  const organizeEventsByStage = () => {
    const stageMap = {};
    
    // Initialize each stage with an empty events array
    workflowStages.forEach(stage => {
      stageMap[stage.id] = [];
    });
    
    // Build a timeline of status changes from events
    const statusChanges = [];
    filteredEvents.forEach(event => {
      if (event.event_type === 'workflow_status_change' && event.new_stage) {
        statusChanges.push({
          timestamp: new Date(event.created_at),
          status: event.new_stage
        });
      }
    });
    
    // Sort status changes chronologically
    statusChanges.sort((a, b) => a.timestamp - b.timestamp);
    
    // Process each event and assign it to the appropriate stage
    filteredEvents.forEach(event => {
      let stageId = null;
      const eventTimestamp = new Date(event.created_at);
      
      // For order creation events, always put in LEAD_ACQUISITION
      if (event.event_type === 'order_creation') {
        stageId = 'LEAD_ACQUISITION';
      }
      // For workflow_status_change events, find the stage that contains the new status
      else if (event.event_type === 'workflow_status_change' && event.new_stage) {
        // Use the mapping function from backend
        const mappedStage = mapWorkflowStatusToStage(event.new_stage);
        stageId = mappedStage;
      }
      // For other events, find which status was active at that time
      else {
        // Find the most recent status change before this event
        let activeStatus = order?.workflow_status || 'NEW_LEAD'; // Default to initial status
        
        for (const change of statusChanges) {
          if (change.timestamp <= eventTimestamp) {
            activeStatus = change.status;
          } else {
            break;
          }
        }
        
        // Find which stage contains this status using the mapping
        stageId = mapWorkflowStatusToStage(activeStatus);
      }
      
      // Add to the appropriate stage
      if (stageId && stageMap[stageId]) {
        stageMap[stageId].push(event);
      } else if (workflowStages.length > 0) {
        // Fallback to first stage
        stageMap[workflowStages[0].id].push(event);
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
  
  // Create chronological timeline
  const chronologicalTimeline = createChronologicalTimeline();
  
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
          {/* Workflow Timeline with Integrated History */}
          <Stepper activeStep={activeStep} orientation="vertical" sx={{ pb: 2, pt: searchTerm ? 1 : 0 }}>
            {workflowStages.map((stage, index) => {
              const isStageActive = isStageCurrentlyActive(stage.id);
              const isFullyCompleted = isStageFullyCompleted(stage.id);
              const hasAnyCompleted = hasStageAnyCompletedStatus(stage.id);
              
              // Get all timeline items for this stage (status completions + events)
              const stageTimelineItems = [];
              
              // Add status completions for this stage
              if (order && order.status_history && Array.isArray(order.status_history)) {
                order.status_history.forEach(statusCompletion => {
                  const status = findStatusById(statusCompletion.status);
                  if (status && stage.statuses && stage.statuses.some(s => s.id === status.id)) {
                    stageTimelineItems.push({
                      type: 'status_completion',
                      timestamp: new Date(statusCompletion.completed_at),
                      status: status,
                      notes: statusCompletion.notes,
                      completed_by: statusCompletion.completed_by,
                      data: statusCompletion
                    });
                  }
                });
              }
              
              // Add events for this stage
              const stageHistoryEvents = stageEvents[stage.id] || [];
              stageHistoryEvents.forEach(event => {
                stageTimelineItems.push({
                  type: 'event',
                  timestamp: new Date(event.created_at),
                  event: event,
                  data: event
                });
              });
              
              // Sort chronologically
              stageTimelineItems.sort((a, b) => a.timestamp - b.timestamp);
              
              // Get current status in this stage
              const currentStatusInStage = order && stage.statuses?.find(s => s.id === order.workflow_status);
              const hasCurrentStatus = !!currentStatusInStage;
              
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
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography 
                        variant="subtitle1" 
                        sx={{ 
                          fontWeight: isStageActive ? 700 : 600,
                          color: isFullyCompleted ? 'success.main' : isStageActive ? 'primary.main' : 'text.primary'
                        }}
                      >
                        {stage.name}
                      </Typography>
                      {isStageActive && !isFullyCompleted && (
                        <Chip 
                          label="Active" 
                          color="primary" 
                          size="small" 
                          sx={{ ml: 2 }}
                        />
                      )}
                    </Box>
                  </StepLabel>
                  
                  <StepContent sx={{ px: 1, py: 1 }}>
                    <Box sx={{ 
                      ml: 1, 
                      pl: 1, 
                      borderLeft: isStageActive ? '2px solid' : '1px dashed', 
                      borderColor: isStageActive ? 'primary.main' : 'divider'
                    }}>
                      {/* Create merged timeline of statuses and events */}
                      {(() => {
                        const mergedTimeline = [];
                        
                        // Add all statuses - completed ones will show as events, current and outstanding ones will show as status items
                        stage.statuses && stage.statuses.forEach(status => {
                          const isCompleted = isStatusCompleted(status.id);
                          const isCurrent = isCurrentStatus(status.id);
                          
                          // Check if this status has already been passed in the workflow
                          // by checking if there's a later completed status
                          let isAlreadyPassed = false;
                          if (!isCompleted && !isCurrent && order && order.status_history) {
                            // Find the index of this status in the workflow
                            const statusIndex = workflowStatuses.findIndex(s => s.id === status.id);
                            
                            // Check if any status after this one has been completed
                            for (let i = statusIndex + 1; i < workflowStatuses.length; i++) {
                              if (isStatusCompleted(workflowStatuses[i].id)) {
                                isAlreadyPassed = true;
                                break;
                              }
                            }
                          }
                          
                          // Only add uncompleted statuses that haven't been skipped/passed
                          if (!isCompleted && !isAlreadyPassed) {
                            mergedTimeline.push({
                              type: 'status',
                              timestamp: null,
                              status: status,
                              isCompleted: false,
                              isCurrent: isCurrent,
                              completionData: null,
                              sortOrder: 4 // Put uncompleted statuses at the end
                            });
                          }
                        });
                        
                        // Add all events for this stage
                        stageTimelineItems.forEach(item => {
                          mergedTimeline.push({
                            ...item,
                            sortOrder: 2 // Events in the middle
                          });
                        });
                        
                        // Sort by timestamp (completed items) or by sortOrder (pending items)
                        mergedTimeline.sort((a, b) => {
                          // Both have timestamps - sort chronologically
                          if (a.timestamp && b.timestamp) {
                            return a.timestamp - b.timestamp;
                          }
                          // One has timestamp, it comes first
                          if (a.timestamp && !b.timestamp) return -1;
                          if (!a.timestamp && b.timestamp) return 1;
                          // Neither has timestamp, sort by order
                          return a.sortOrder - b.sortOrder;
                        });
                        
                        return mergedTimeline.map((item, index) => {
                          // Render status items
                          if (item.type === 'status') {
                            const { status, isCompleted, isCurrent, completionData } = item;
                            
                            return (
                              <Box 
                                key={`status-${status.id}-${index}`} 
                                sx={{ 
                                  display: 'flex', 
                                  alignItems: 'flex-start', 
                                  py: 1.5,
                                  mb: 1,
                                  borderRadius: 1,
                                  bgcolor: isCompleted ? 'success.50' : isCurrent ? 'primary.50' : 'grey.50',
                                  px: 1,
                                  border: '1px solid',
                                  borderColor: isCompleted ? 'success.200' : isCurrent ? 'primary.200' : 'grey.200',
                                  opacity: !isCompleted && !isCurrent ? 0.7 : 1
                                }}
                              >
                                <Box sx={{ mr: 1.5, mt: 0.5, minWidth: 24 }}>
                                  {isCompleted ? (
                                    <CheckIcon color="success" fontSize="small" />
                                  ) : isCurrent ? (
                                    <TimelineIcon color="primary" fontSize="small" />
                                  ) : (
                                    <CircleIcon sx={{ color: 'grey.400', fontSize: 16 }} />
                                  )}
                                </Box>
                                
                                <Box sx={{ flexGrow: 1 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                                    <Typography 
                                      variant="body2" 
                                      sx={{ 
                                        fontWeight: isCurrent ? 600 : isCompleted ? 500 : 400,
                                        color: isCompleted ? 'success.dark' : isCurrent ? 'primary.dark' : 'grey.600'
                                      }}
                                    >
                                      {status.name}
                                    </Typography>
                                    
                                    {isCompleted && (
                                      <Chip 
                                        label="Completed" 
                                        color="success" 
                                        size="small" 
                                        variant="outlined"
                                        sx={{ height: 20, '& .MuiChip-label': { px: 1, py: 0.25, fontSize: '0.7rem' } }}
                                      />
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
                                    
                                    {!isCompleted && !isCurrent && (
                                      <Chip 
                                        label="Pending" 
                                        size="small" 
                                        variant="outlined"
                                        sx={{ 
                                          height: 20, 
                                          '& .MuiChip-label': { px: 1, py: 0.25, fontSize: '0.7rem' },
                                          color: 'grey.600',
                                          borderColor: 'grey.400'
                                        }}
                                      />
                                    )}
                                  </Box>
                                  
                                  {completionData && (
                                    <Box sx={{ mt: 0.5 }}>
                                      <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <EventIcon sx={{ fontSize: 14 }} />
                                        Completed on {formatDate(completionData.completed_at)}
                                      </Typography>
                                      {completionData.notes && (
                                        <Typography variant="caption" sx={{ 
                                          display: 'block',
                                          mt: 0.5,
                                          p: 1, 
                                          bgcolor: 'grey.50',
                                          borderRadius: 1,
                                          fontStyle: 'italic'
                                        }}>
                                          {completionData.notes}
                                        </Typography>
                                      )}
                                    </Box>
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
                          }
                          
                          // Render status completion events
                          if (item.type === 'status_completion') {
                            const status = item.status;
                            return (
                              <Box 
                                key={`completion-${index}`}
                                sx={{ 
                                  display: 'flex', 
                                  alignItems: 'flex-start', 
                                  py: 1,
                                  mb: 0.5,
                                  ml: 2,
                                  borderLeft: '2px solid',
                                  borderLeftColor: 'success.main',
                                  pl: 2,
                                  bgcolor: 'success.50',
                                  borderRadius: '0 4px 4px 0',
                                }}
                              >
                                <CheckIcon color="success" sx={{ mr: 1, fontSize: 20 }} />
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 500, color: 'success.dark' }}>
                                    {status.name} - Completed
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {formatDate(item.timestamp)}
                                  </Typography>
                                  {item.notes && (
                                    <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontStyle: 'italic' }}>
                                      {item.notes}
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                            );
                          }
                          
                          // Render other events
                          if (item.type === 'event') {
                            const event = item.event;
                            const eventTypeInfo = getEventTypeInfo(event.event_type);
                            
                            // Show workflow_status_change events but format them better
                            if (event.event_type === 'workflow_status_change') {
                              // Find the status info from the stage statuses
                              let statusName = event.new_stage;
                              let validStatus = false;
                              
                              // Look through all stages to find the status
                              for (const stg of workflowStages) {
                                const status = stg.statuses?.find(s => s.id === event.new_stage);
                                if (status) {
                                  statusName = status.name;
                                  validStatus = true;
                                  break;
                                }
                              }
                              
                              // Skip invalid statuses (ones not in this workflow)
                              if (!validStatus) {
                                return null;
                              }
                              
                              return (
                                <Box 
                                  key={`event-${event.event_id || index}`}
                                  sx={{ 
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    py: 1.5,
                                    px: 2,
                                    mb: 1.5,
                                    bgcolor: 'success.50',
                                    borderRadius: 2,
                                    border: '1px solid',
                                    borderColor: 'success.200',
                                    position: 'relative',
                                    '&::before': {
                                      content: '""',
                                      position: 'absolute',
                                      left: -1,
                                      top: 0,
                                      bottom: 0,
                                      width: 4,
                                      bgcolor: 'success.main',
                                      borderRadius: '4px 0 0 4px'
                                    }
                                  }}
                                >
                                  <Avatar
                                    sx={{ 
                                      width: 32, 
                                      height: 32, 
                                      mr: 1.5,
                                      bgcolor: 'success.main',
                                      fontSize: '0.875rem'
                                    }}
                                  >
                                    <CheckIcon sx={{ fontSize: 18 }} />
                                  </Avatar>
                                  <Box sx={{ flex: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.dark' }}>
                                      {statusName}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      Completed on {formatDate(event.created_at)}
                                    </Typography>
                                    {event.description && !event.description.includes('Workflow status changed') && !event.description.includes('Customer requested') && (
                                      <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'text.secondary' }}>
                                        {event.description}
                                      </Typography>
                                    )}
                                  </Box>
                                </Box>
                              );
                            }
                            
                            // Skip stage transition events
                            if (event.event_type === 'stage_transition') {
                              return null;
                            }
                            
                            return (
                              <Box 
                                key={`event-${event.event_id || index}`}
                                sx={{ 
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  py: 1,
                                  px: 1.5,
                                  mb: 1,
                                  ml: 5,
                                  bgcolor: 'grey.50',
                                  borderRadius: 1,
                                  borderLeft: '3px solid',
                                  borderLeftColor: eventTypeInfo.color === 'default' ? 'grey.300' : `${eventTypeInfo.color}.light`,
                                  '&:hover': {
                                    bgcolor: 'grey.100'
                                  }
                                }}
                              >
                                <Avatar 
                                  sx={{ 
                                    width: 28, 
                                    height: 28, 
                                    mr: 1.5,
                                    bgcolor: eventTypeInfo.color === 'default' ? 'grey.300' : `${eventTypeInfo.color}.light`,
                                    color: eventTypeInfo.color === 'default' ? 'grey.700' : `${eventTypeInfo.color}.dark`,
                                    fontSize: '0.75rem'
                                  }}
                                >
                                  {React.cloneElement(eventTypeInfo.icon, { sx: { fontSize: 18 } })}
                                </Avatar>
                                
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="body2" sx={{ mb: 0.25 }}>
                                    {event.description}
                                  </Typography>
                                  
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Chip 
                                      label={eventTypeInfo.label}
                                      size="small"
                                      sx={{ 
                                        height: 18, 
                                        '& .MuiChip-label': { px: 0.75, fontSize: '0.65rem' },
                                        bgcolor: eventTypeInfo.color === 'default' ? 'grey.200' : `${eventTypeInfo.color}.100`,
                                        color: eventTypeInfo.color === 'default' ? 'grey.700' : `${eventTypeInfo.color}.dark`
                                      }}
                                    />
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                      {getUserDisplay(event)} • {formatDate(event.created_at)}
                                    </Typography>
                                  </Box>
                                </Box>
                              </Box>
                            );
                          }
                          
                          return null;
                        });
                      })()}
                      
                      {/* Action buttons for active stage */}
                      {isStageActive && !isFullyCompleted && (
                        <Box sx={{ 
                          mt: 3, 
                          pt: 2, 
                          borderTop: '1px solid',
                          borderColor: 'divider',
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 1
                        }}>
                          <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            startIcon={<ArrowForwardIcon />}
                            onClick={() => {
                              const nextStatuses = getNextAvailableStatuses();
                              if (nextStatuses.length > 0) {
                                handleStatusUpdate(nextStatuses[0].id);
                              }
                            }}
                            sx={{ textTransform: 'none' }}
                          >
                            Complete Current Step
                          </Button>
                          
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<AddCommentIcon />}
                            onClick={() => setNoteDialogOpen(true)}
                            sx={{ textTransform: 'none' }}
                          >
                            Add Note
                          </Button>
                          
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<TaskIcon />}
                            sx={{ textTransform: 'none' }}
                          >
                            Assign Task
                          </Button>
                          
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<AttachFileIcon />}
                            sx={{ textTransform: 'none' }}
                          >
                            Upload Document
                          </Button>
                          
                          {stage.id === 'PROCUREMENT' && (
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<CreditCardIcon />}
                              sx={{ textTransform: 'none' }}
                            >
                              Record Payment
                            </Button>
                          )}
                          
                          {stage.id === 'FULFILLMENT' && (
                            <>
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<ShippingIcon />}
                                sx={{ textTransform: 'none' }}
                              >
                                Schedule Delivery
                              </Button>
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<BuildIcon />}
                                sx={{ textTransform: 'none' }}
                              >
                                Schedule Installation
                              </Button>
                            </>
                          )}
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