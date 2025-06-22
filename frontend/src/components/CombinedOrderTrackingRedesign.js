// CombinedOrderTrackingRedesign.js - A cleaner, more intuitive timeline design
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  Tooltip,
  LinearProgress,
  Collapse,
  Card,
  CardContent,
  Stack,
  Fade,
  Zoom,
  Badge,
  Menu,
  MenuItem,
} from '@mui/material';

// Material UI icons
import {
  Check as CheckIcon,
  Timeline as TimelineIcon,
  ArrowForward as ArrowForwardIcon,
  AccessTime as AccessTimeIcon,
  Person as PersonIcon,
  RadioButtonUnchecked as CircleIcon,
  Info as InfoIcon,
  DonutLarge as DonutLargeIcon,
  Comment as CommentIcon,
  History as HistoryIcon,
  AddComment as AddCommentIcon,
  Event as EventIcon,
  Send as SendIcon,
  Assignment as AssignmentIcon,
  Payment as PaymentIcon,
  Description as DocumentIcon,
  Create as CreateIcon,
  Update as UpdateIcon,
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Star as StarIcon,
  NewReleases as NewReleasesIcon,
  FiberManualRecord as DotIcon,
  KeyboardArrowRight as ArrowRightIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonChecked as ActiveIcon,
  RadioButtonChecked,
  PanoramaFishEye as PendingIcon,
  MoreVert as MoreVertIcon,
  PlayArrow as SetCurrentIcon,
  Clear as RemoveIcon,
} from '@mui/icons-material';

const API_URL = 'http://localhost:8000';

// Status type colors mapping
const STATUS_COLORS = {
  completed: {
    background: 'rgba(46, 125, 50, 0.08)',
    color: '#2e7d32',
    borderColor: '#4caf50',
    chipBackground: '#4caf50',
    chipColor: '#fff'
  },
  current: {
    background: 'rgba(25, 118, 210, 0.08)',
    color: '#1976d2',
    borderColor: '#2196f3',
    chipBackground: '#2196f3',
    chipColor: '#fff'
  },
  pending: {
    background: '#fafafa',
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
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
  
  // UI state
  const [expandedStages, setExpandedStages] = useState({});
  const [statusMenuAnchor, setStatusMenuAnchor] = useState(null);
  const [selectedStatusForMenu, setSelectedStatusForMenu] = useState(null);
  const [workflowTypeDialogOpen, setWorkflowTypeDialogOpen] = useState(false);
  const [newWorkflowType, setNewWorkflowType] = useState('');
  
  // Fetch order and workflow data if not provided
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (orderData) {
          setOrder(orderData);
          const orderType = orderData.type || 'MATERIALS_ONLY';
          await Promise.all([
            fetchWorkflowData(orderType),
            fetchEvents()
          ]);
        } else if (orderId) {
          await fetchOrder();
        }
      } finally {
        setLoading(false);
        setInitialLoadComplete(true);
      }
    };
    
    loadData();
  }, [orderId, orderData]);
  
  // Auto-expand active stage
  useEffect(() => {
    if (order && workflowStages.length > 0) {
      const activeStageId = findStageForStatus(order.current_status)?.id;
      if (activeStageId) {
        setExpandedStages(prev => ({ ...prev, [activeStageId]: true }));
      }
    }
  }, [order, workflowStages]);
  
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
        const orderType = response.data.order.workflow_type || 'MATERIALS_ONLY';
        fetchWorkflowData(orderType);
        fetchEvents();
      } else {
        throw new Error('Invalid order data received from server');
      }
    } catch (err) {
      console.error('Error fetching order:', err);
      // Only show error if it's not an authentication issue
      if (err.response?.status !== 401 && err.response?.status !== 403) {
        setError('Failed to load order data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch workflow data
  const fetchWorkflowData = async (type) => {
    try {
      const orderType = type || 'MATERIALS_ONLY';
      
      const response = await axios.get(`${API_URL}/workflow/full-workflow/${orderType}`, {
        withCredentials: true
      });
      
      if (!response.data || !response.data.stages || !Array.isArray(response.data.stages)) {
        throw new Error('Invalid workflow data structure received');
      }
      
      setWorkflowStages(response.data.stages);
      
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
      // Only show error if it's not an authentication issue
      if (err.response?.status !== 401 && err.response?.status !== 403) {
        setError('Failed to load workflow data. Please contact support.');
      }
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
      // Only show error if it's not an authentication issue
      if (err.response?.status !== 401 && err.response?.status !== 403) {
        setError((prevError) => prevError || 'Failed to load order history. Please try again.');
      }
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
    
    const entries = order.status_history.filter(entry => entry.status === statusId);
    if (entries.length > 0) {
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
  
  // Check if a stage is fully completed
  const isStageFullyCompleted = (stageId) => {
    const statuses = getStatusesForStage(stageId);
    return statuses.length > 0 && statuses.every(status => isStatusCompleted(status.id));
  };
  
  // Check if a stage is current (contains current status)
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
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return `${diffMinutes} minutes ago`;
      }
      return `${diffHours} hours ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    }
    
    return date.toLocaleDateString();
  };

  // Format exact date and time
  const formatExactDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
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
      
      setNoteDialogOpen(false);
      setNewNote('');
      
      fetchEvents();
    } catch (err) {
      console.error('Error adding note:', err);
      setError('Failed to add note. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle status menu open
  const handleStatusMenuOpen = (event, statusId) => {
    setStatusMenuAnchor(event.currentTarget);
    setSelectedStatusForMenu(statusId);
  };

  // Handle status menu close
  const handleStatusMenuClose = () => {
    setStatusMenuAnchor(null);
    setSelectedStatusForMenu(null);
  };

  // Set any status as current
  const handleSetCurrentStatus = async (statusId, notes = '') => {
    if (!order) return;
    
    setUpdating(true);
    handleStatusMenuClose();
    
    try {
      const response = await axios.post(
        `${API_URL}/orders/${order.order_id}/set-current-status`,
        {
          status: statusId,
          notes: notes
        },
        { withCredentials: true }
      );
      
      if (response.data) {
        setOrder(response.data);
        fetchOrder();
      }
    } catch (err) {
      console.error('Error setting current status:', err);
      setError('Failed to set current status. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  // Remove status from completed list
  const handleRemoveCompletion = async (statusId, notes = '') => {
    if (!order) return;
    
    setUpdating(true);
    handleStatusMenuClose();
    
    try {
      const response = await axios.post(
        `${API_URL}/orders/${order.order_id}/remove-completed-status`,
        {
          status: statusId,
          notes: notes
        },
        { withCredentials: true }
      );
      
      if (response.data) {
        setOrder(response.data);
        fetchOrder();
      }
    } catch (err) {
      console.error('Error removing completion:', err);
      setError('Failed to remove completion. Please try again.');
    } finally {
      setUpdating(false);
    }
  };
  
  // Toggle stage expansion
  const toggleStageExpansion = (stageId) => {
    setExpandedStages(prev => ({
      ...prev,
      [stageId]: !prev[stageId]
    }));
  };
  
  // Get event type info
  const getEventTypeInfo = (eventType) => {
    return EVENT_TYPES[eventType] || EVENT_TYPES.default;
  };
  
  // Get user display name
  const getUserDisplay = (event) => {
    if (!event) return 'Unknown';
    
    if (event.user_email) return event.user_email;
    
    if (event.created_by && typeof event.created_by === 'string') {
      return `User ${event.created_by.substring(0, 8)}...`;
    }
    
    return 'Unknown User';
  };
  
  // Organize events by stage with better timestamp-based assignment
  const organizeEventsByStage = () => {
    const stageMap = {};
    
    workflowStages.forEach(stage => {
      stageMap[stage.id] = [];
    });
    
    // Extract status changes from workflow_status_change events
    const statusChanges = [];
    filteredEvents.forEach(event => {
      if (event.event_type === 'workflow_status_change' && event.description) {
        // Try to extract the new status from the description
        const matches = event.description.match(/Status changed to (\w+)/);
        if (matches && matches[1]) {
          statusChanges.push({
            timestamp: new Date(event.created_at),
            status: matches[1]
          });
        } else if (event.new_stage) {
          statusChanges.push({
            timestamp: new Date(event.created_at),
            status: event.new_stage
          });
        }
      }
    });
    
    statusChanges.sort((a, b) => a.timestamp - b.timestamp);
    
    filteredEvents.forEach(event => {
      let stageId = null;
      const eventTimestamp = new Date(event.created_at);
      
      // Handle specific event types
      if (event.event_type === 'order_creation') {
        stageId = 'LEAD_ACQUISITION';
      }
      else if (event.event_type === 'workflow_status_change') {
        // Extract status from description if available
        const matches = event.description?.match(/Status changed to (\w+)/);
        if (matches && matches[1]) {
          stageId = mapWorkflowStatusToStage(matches[1]);
        } else if (event.new_stage) {
          stageId = mapWorkflowStatusToStage(event.new_stage);
        } else {
          // Fall back to current order status
          stageId = mapWorkflowStatusToStage(order?.workflow_status || 'NEW_LEAD');
        }
      }
      else if (event.event_type === 'stage_change' && event.new_stage) {
        stageId = mapWorkflowStatusToStage(event.new_stage);
      }
      else {
        // For other events, determine stage based on when they occurred relative to status changes
        let activeStatus = 'NEW_LEAD';
        
        for (const change of statusChanges) {
          if (change.timestamp <= eventTimestamp) {
            activeStatus = change.status;
          } else {
            break;
          }
        }
        
        stageId = mapWorkflowStatusToStage(activeStatus);
      }
      
      // Assign to stage
      if (stageId && stageMap[stageId]) {
        stageMap[stageId].push(event);
      } else if (workflowStages.length > 0) {
        // Default to first stage if mapping fails
        stageMap[workflowStages[0].id].push(event);
      }
    });
    
    // Debug: Show how events are organized by stage
    // Object.keys(stageMap).forEach(stageId => {
    //   if (stageMap[stageId].length > 0) {
    //     console.log(`📋 Stage ${stageId}: ${stageMap[stageId].length} events`);
    //     stageMap[stageId].forEach((event, i) => {
    //       console.log(`  ${i+1}. ${event.created_at} - ${event.description.substring(0, 50)}...`);
    //     });
    //   }
    // });
    
    setStageEvents(stageMap);
  };
  
  // Find the most recent event across all stages
  const getMostRecentEvent = () => {
    let mostRecent = null;
    let mostRecentDate = null;
    
    Object.values(stageEvents).forEach(events => {
      events.forEach(event => {
        const eventDate = new Date(event.created_at);
        if (!mostRecentDate || eventDate > mostRecentDate) {
          mostRecentDate = eventDate;
          mostRecent = event;
        }
      });
    });
    
    return mostRecent;
  };
  
  if (loading || !initialLoadComplete) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: 400,
        p: 4 
      }}>
        <CircularProgress size={48} thickness={4} />
        <Typography variant="body1" sx={{ mt: 2, color: 'text.secondary' }}>
          Loading order tracking data...
        </Typography>
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
  
  if (workflowStages.length === 0 && initialLoadComplete) {
    return (
      <Alert severity="error">
        Workflow data could not be loaded. Please reload the page or contact support.
      </Alert>
    );
  }
  
  if (workflowStages.length === 0) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: 400,
        p: 4 
      }}>
        <CircularProgress size={48} thickness={4} />
        <Typography variant="body1" sx={{ mt: 2, color: 'text.secondary' }}>
          Loading workflow stages...
        </Typography>
      </Box>
    );
  }
  
  const progress = calculateProgress();
  const currentStatus = findStatusById(order.current_status) || 
                      { id: 'NOT_STARTED', name: 'Not Started' };
  const currentStage = findStageForStatus(order.current_status) || 
                     { id: 'UNKNOWN', name: 'Unknown Stage' };
  const mostRecentEvent = getMostRecentEvent();
  
  return (
    <Box>
      {/* Timeline */}
      <Box>
        {workflowStages.map((stage, stageIndex) => {
          const isStageActive = isStageCurrentlyActive(stage.id);
          const isFullyCompleted = isStageFullyCompleted(stage.id);
          const hasAnyCompleted = hasStageAnyCompletedStatus(stage.id);
          const isExpanded = expandedStages[stage.id] !== false; // Default to expanded
          const stageStatuses = getStatusesForStage(stage.id);
          const stageEventsList = stageEvents[stage.id] || [];
          
          // Determine stage state
          let stageState = 'pending';
          if (isFullyCompleted) stageState = 'completed';
          else if (isStageActive) stageState = 'current';
          else if (hasAnyCompleted) stageState = 'in-progress';
          
          return (
            <Box key={stage.id} sx={{ mb: 3 }}>
              {/* Stage Header */}
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  border: '2px solid',
                  borderColor: 
                    stageState === 'completed' ? 'success.main' :
                    stageState === 'current' ? 'primary.main' :
                    stageState === 'in-progress' ? 'warning.main' :
                    'grey.300',
                  backgroundColor: 
                    stageState === 'completed' ? 'success.50' :
                    stageState === 'current' ? 'primary.50' :
                    stageState === 'in-progress' ? 'warning.50' :
                    'grey.50',
                  '&:hover': {
                    backgroundColor: 
                      stageState === 'completed' ? 'success.100' :
                      stageState === 'current' ? 'primary.100' :
                      stageState === 'in-progress' ? 'warning.100' :
                      'grey.100',
                  }
                }}
                onClick={() => toggleStageExpansion(stage.id)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {/* Stage Icon */}
                    <Box sx={{ position: 'relative' }}>
                      {stageState === 'completed' ? (
                        <CheckCircleIcon sx={{ fontSize: 32, color: 'success.main' }} />
                      ) : stageState === 'current' ? (
                          <ActiveIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                      ) : stageState === 'in-progress' ? (
                        <RadioButtonChecked sx={{ fontSize: 32, color: 'warning.main' }} />
                      ) : (
                        <PendingIcon sx={{ fontSize: 32, color: 'grey.400' }} />
                      )}
                    </Box>
                    
                    {/* Stage Name and Progress */}
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {stage.name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        {stageState === 'current' && (
                          <Chip 
                            label="Active" 
                            size="small" 
                            color="primary"
                            sx={{ height: 20, fontSize: '0.75rem' }}
                          />
                        )}
                        <Typography variant="body2" color="text.secondary">
                          {stageStatuses.filter(s => isStatusCompleted(s.id)).length} of {stageStatuses.length} steps complete
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  
                  {/* Expand/Collapse Icon */}
                  <IconButton size="small">
                    {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </Box>
              </Paper>
              
              {/* Stage Content */}
              <Collapse in={isExpanded} timeout="auto">
                <Box sx={{ 
                  ml: 2, 
                  mt: 2,
                  pl: 3,
                  borderLeft: '3px solid',
                  borderColor: 
                    stageState === 'completed' ? 'success.main' :
                    stageState === 'current' ? 'primary.main' :
                    stageState === 'in-progress' ? 'warning.main' :
                    'grey.300'
                }}>
                  {/* Chronologically merged timeline */}
                  <Stack spacing={2}>
                    {(() => {
                      const timelineItems = [];
                      
                      // First, identify all workflow_status_change events and map them to statuses
                      const statusChangeMap = {};
                      stageEventsList
                        .filter(e => e.event_type === 'workflow_status_change')
                        .forEach(event => {
                          // Extract the status from the description
                          const match = event.description?.match(/Status changed to (\w+)/);
                          if (match && match[1]) {
                            const statusId = match[1];
                            // Keep only the first occurrence of each status change
                            if (!statusChangeMap[statusId] || new Date(event.created_at) < new Date(statusChangeMap[statusId].created_at)) {
                              statusChangeMap[statusId] = event;
                            }
                          }
                        });
                      
                      // Add all statuses - both reached and future ones
                      stageStatuses.forEach(status => {
                        const isCompleted = isStatusCompleted(status.id);
                        const isCurrent = isCurrentStatus(status.id);
                        const completionInfo = getStatusCompletionInfo(status.id);
                        
                        // Get the workflow_status_change event for this status
                        const statusChangeEvent = statusChangeMap[status.id];
                        
                        // Validate timestamp - fix year 2025 to 2024
                        let timestamp = null;
                        if (statusChangeEvent) {
                          timestamp = new Date(statusChangeEvent.created_at);
                          
                        }
                        
                        // Add all statuses - future ones will show as grey/pending
                        timelineItems.push({
                          type: 'status',
                          timestamp: timestamp,
                          status,
                          isCompleted,
                          isCurrent,
                          completionInfo,
                          statusChangeEvent,
                          isFuture: !statusChangeEvent && !isCurrent && !isCompleted
                        });
                      });
                      
                      // Add non-workflow_status_change events
                      stageEventsList
                        .filter(event => event.event_type !== 'workflow_status_change')
                        .forEach(event => {
                          // Validate timestamp - fix year 2025 to 2024
                          let timestamp = new Date(event.created_at);
                          
                          
                          timelineItems.push({
                            type: 'event',
                            timestamp: timestamp,
                            event
                          });
                        });
                      
                      // Sort chronologically, with future items at the end in order
                      timelineItems.sort((a, b) => {
                        // Both have timestamps - sort by time
                        if (a.timestamp && b.timestamp) {
                          return a.timestamp - b.timestamp;
                        }
                        // One has timestamp, one doesn't - timestamped items come first
                        if (a.timestamp && !b.timestamp) return -1;
                        if (!a.timestamp && b.timestamp) return 1;
                        // Neither has timestamp (both future) - maintain workflow order
                        if (a.type === 'status' && b.type === 'status' && a.isFuture && b.isFuture) {
                          const aIndex = workflowStatuses.findIndex(s => s.id === a.status.id);
                          const bIndex = workflowStatuses.findIndex(s => s.id === b.status.id);
                          return aIndex - bIndex;
                        }
                        return 0;
                      });
                      
                      return timelineItems.map((item, index) => {
                        if (item.type === 'status') {
                          const { status, isCompleted, isCurrent, completionInfo, isFuture } = item;
                          const relatedEvents = stageEventsList.filter(e => 
                            e.event_type === 'workflow_status_change' && e.new_stage === status.id
                          );
                          const isRecentActivity = mostRecentEvent && relatedEvents.some(e => e.event_id === mostRecentEvent.event_id);
                          
                          return (
                            <Fade in={true} timeout={300 * (index + 1)} key={`status-${status.id}`}>
                              <Card 
                                variant="outlined"
                                sx={{ 
                                  borderRadius: 2,
                                  border: '1px solid',
                                  borderColor: 
                                    isCurrent ? 'primary.main' :
                                    isCompleted ? 'success.light' :
                                    isFuture ? 'grey.200' :
                                    'grey.300',
                                  backgroundColor: 
                                    isCurrent ? 'primary.50' :
                                    isCompleted ? 'success.50' :
                                    isFuture ? 'grey.50' :
                                    'background.paper',
                                  opacity: isFuture ? 0.6 : 1,
                                  position: 'relative',
                                  overflow: 'visible',
                                  ...(isRecentActivity && {
                                    boxShadow: '0 0 0 3px rgba(255, 152, 0, 0.2)',
                                    '&::before': {
                                      content: '""',
                                      position: 'absolute',
                                      top: -8,
                                      right: -8,
                                      width: 16,
                                      height: 16,
                                      bgcolor: 'warning.main',
                                      borderRadius: '50%',
                                            }
                                  })
                                }}
                              >
                                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                    <Box sx={{ mt: 0.5 }}>
                                      {isCompleted ? (
                                        <CheckCircleIcon sx={{ color: 'success.main' }} />
                                      ) : isCurrent ? (
                                        <ActiveIcon sx={{ color: 'primary.main' }} />
                                      ) : (
                                        <CircleIcon sx={{ color: 'grey.400' }} />
                                      )}
                                    </Box>
                                    
                                    <Box sx={{ flex: 1 }}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 600, flex: 1 }}>
                                          {status.name}
                                        </Typography>
                                        
                                        {/* Status options menu */}
                                        <IconButton
                                          size="small"
                                          onClick={(e) => handleStatusMenuOpen(e, status.id)}
                                          sx={{ ml: 'auto' }}
                                        >
                                          <MoreVertIcon fontSize="small" />
                                        </IconButton>
                                      </Box>
                                      
                                      {/* Status chips row */}
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                                        {isCurrent && (
                                          <Chip 
                                            label="Current" 
                                            size="small" 
                                            color="primary"
                                            sx={{ height: 22 }}
                                          />
                                        )}
                                        {isCompleted && (
                                          <Chip 
                                            label="Completed" 
                                            size="small" 
                                            color="success"
                                            sx={{ height: 22 }}
                                          />
                                        )}
                                        {isFuture && (
                                          <Chip 
                                            label="Future" 
                                            size="small" 
                                            sx={{ 
                                              height: 22,
                                              backgroundColor: 'grey.200',
                                              color: 'text.secondary'
                                            }}
                                          />
                                        )}
                                        {isRecentActivity && (
                                          <Chip 
                                            icon={<NewReleasesIcon sx={{ fontSize: 16 }} />}
                                            label="Latest" 
                                            size="small" 
                                            color="warning"
                                            sx={{ height: 22 }}
                                          />
                                        )}
                                      </Box>
                                      
                                      {item.timestamp && (
                                        <Box sx={{ mb: 1 }}>
                                          <Typography variant="body2" color="text.secondary">
                                            {isCompleted ? 'Completed' : 'Changed'} {formatExactDateTime(item.timestamp)}
                                          </Typography>
                                        </Box>
                                      )}
                                      
                                      {isFuture && (
                                        <Box sx={{ mb: 1 }}>
                                          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                            Not yet reached
                                          </Typography>
                                        </Box>
                                      )}
                                      
                                      {completionInfo && completionInfo.notes && (
                                        <Box sx={{ mb: 1 }}>
                                          <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                                            "{completionInfo.notes}"
                                          </Typography>
                                        </Box>
                                      )}
                                      
                                      {isCurrent && (
                                        <Button
                                          variant="contained"
                                          size="small"
                                          startIcon={<CheckIcon />}
                                          onClick={() => handleStatusUpdate(status.id)}
                                          sx={{ mt: 1 }}
                                        >
                                          Mark as Complete
                                        </Button>
                                      )}
                                    </Box>
                                  </Box>
                                </CardContent>
                              </Card>
                            </Fade>
                          );
                        } else {
                          // Render event
                          const { event } = item;
                          const eventTypeInfo = getEventTypeInfo(event.event_type);
                          const isRecentActivity = mostRecentEvent && event.event_id === mostRecentEvent.event_id;
                          
                          return (
                            <Fade in={true} timeout={300} key={`event-${event.event_id || index}`}>
                              <Box 
                                sx={{ 
                                  ml: 4, 
                                  p: 1.5, 
                                  borderRadius: 1,
                                  backgroundColor: 'grey.50',
                                  border: '1px solid',
                                  borderColor: isRecentActivity ? 'warning.light' : 'grey.200',
                                  position: 'relative',
                                  ...(isRecentActivity && {
                                    backgroundColor: 'warning.50'
                                  })
                                }}
                              >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  {React.cloneElement(eventTypeInfo.icon, { 
                                    sx: { fontSize: 18, color: `${eventTypeInfo.color}.main` } 
                                  })}
                                  <Typography variant="body2">
                                    {event.description}
                                  </Typography>
                                  {isRecentActivity && (
                                    <Chip 
                                      label="New" 
                                      size="small" 
                                      color="warning"
                                      sx={{ height: 18, fontSize: '0.7rem' }}
                                    />
                                  )}
                                </Box>
                                <Typography variant="caption" color="text.secondary">
                                  {getUserDisplay(event)} • {formatExactDateTime(event.created_at)}
                                </Typography>
                              </Box>
                            </Fade>
                          );
                        }
                      });
                    })()}
                  </Stack>
                </Box>
              </Collapse>
            </Box>
          );
        })}
      </Box>
      
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

      {/* Status Options Menu */}
      <Menu
        anchorEl={statusMenuAnchor}
        open={Boolean(statusMenuAnchor)}
        onClose={handleStatusMenuClose}
        PaperProps={{
          sx: { minWidth: 200 }
        }}
      >
        {selectedStatusForMenu && (
          <>
            <MenuItem 
              onClick={() => handleSetCurrentStatus(selectedStatusForMenu)}
              sx={{ gap: 1 }}
            >
              <SetCurrentIcon fontSize="small" />
              Set as Current
            </MenuItem>
            
            {isStatusCompleted(selectedStatusForMenu) && (
              <MenuItem 
                onClick={() => handleRemoveCompletion(selectedStatusForMenu)}
                sx={{ gap: 1 }}
              >
                <RemoveIcon fontSize="small" />
                Remove Completion
              </MenuItem>
            )}
            
            <MenuItem 
              onClick={() => {
                handleStatusMenuClose();
                setSelectedStatus(selectedStatusForMenu);
                setStatusNote('');
                setStatusDialogOpen(true);
              }}
              sx={{ gap: 1 }}
            >
              <CheckIcon fontSize="small" />
              Mark as Complete
            </MenuItem>
          </>
        )}
      </Menu>
    </Box>
  );
};

export default CombinedOrderTracking;