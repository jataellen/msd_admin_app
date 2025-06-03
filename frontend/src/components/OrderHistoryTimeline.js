// OrderHistoryTimeline.js - A component to display the order history timeline
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Divider,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  IconButton
} from '@mui/material';

// Material UI icons
import {
  Timeline as TimelineIcon,
  Comment as CommentIcon,
  History as HistoryIcon,
  AddComment as AddCommentIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Person as PersonIcon,
  Event as EventIcon,
  Send as SendIcon,
  Assignment as AssignmentIcon,
  Payment as PaymentIcon,
  Description as DocumentIcon,
  Create as CreateIcon,
  Update as UpdateIcon
} from '@mui/icons-material';

const API_URL = 'http://localhost:8000';

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

const OrderHistoryTimeline = ({ orderId }) => {
  // State variables
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Fetch events on component mount
  useEffect(() => {
    fetchEvents();
  }, [orderId]);
  
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
  
  // Fetch events from API
  const fetchEvents = async () => {
    if (!orderId) {
      setError('No order ID provided');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
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
      setError('Failed to load order history. Please try again.');
    } finally {
      setLoading(false);
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
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleString();
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
  
  // Loading state
  if (loading && events.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Paper sx={{ p: 3 }} elevation={0} variant="outlined">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <HistoryIcon sx={{ mr: 1 }} color="primary" />
          <Typography variant="h6">Order History</Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<AddCommentIcon />}
            onClick={() => setNoteDialogOpen(true)}
          >
            Add Note
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<HistoryIcon />}
            onClick={fetchEvents}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      {/* Search Bar */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search in history..."
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
      </Box>
      
      {/* Error Display */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={fetchEvents}
            >
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}
      
      {/* Events List */}
      {filteredEvents.length === 0 ? (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            {searchTerm 
              ? "No events found matching your search criteria." 
              : "No history events available for this order."}
          </Typography>
          
          {searchTerm ? (
            <Button 
              variant="text" 
              color="primary"
              startIcon={<ClearIcon />}
              onClick={() => setSearchTerm('')}
              sx={{ mt: 1 }}
            >
              Clear Search
            </Button>
          ) : (
            <Button
              variant="contained"
              startIcon={<AddCommentIcon />}
              onClick={() => setNoteDialogOpen(true)}
              sx={{ mt: 2 }}
            >
              Add First Note
            </Button>
          )}
        </Box>
      ) : (
        <List sx={{ 
          maxHeight: 500, 
          overflow: 'auto',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0,0,0,0.2)',
            borderRadius: '4px',
          }
        }}>
          {filteredEvents.map((event, index) => {
            const eventTypeInfo = getEventTypeInfo(event.event_type);
            
            return (
              <ListItem 
                key={event.event_id || index}
                alignItems="flex-start"
                sx={{ 
                  position: 'relative',
                  borderLeft: '2px solid',
                  borderLeftColor: `${eventTypeInfo.color}.main`,
                  mb: 2,
                  pl: 2,
                  pt: 1,
                  pb: 1.5,
                  bgcolor: 'background.paper',
                  borderRadius: '0 4px 4px 0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  '&:hover': {
                    bgcolor: 'action.hover'
                  }
                }}
              >
                <ListItemAvatar>
                  <Avatar 
                    sx={{ 
                      bgcolor: `${eventTypeInfo.color}.main`,
                    }}
                  >
                    {eventTypeInfo.icon}
                  </Avatar>
                </ListItemAvatar>
                
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                        {event.description}
                      </Typography>
                      
                      <Chip 
                        label={eventTypeInfo.label}
                        color={eventTypeInfo.color}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', fontSize: '0.875rem' }}>
                        <PersonIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary" component="span">
                          {getUserDisplay(event)}
                        </Typography>
                        
                        <Box sx={{ mx: 1, color: 'text.disabled' }}>•</Box>
                        
                        <EventIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary" component="span">
                          {formatDate(event.created_at)}
                        </Typography>
                      </Box>
                      
                      {event.event_type === 'stage_change' && event.previous_stage && event.new_stage && (
                        <Box sx={{ 
                          mt: 1, 
                          p: 1, 
                          bgcolor: 'background.default',
                          borderRadius: 1,
                          fontSize: '0.875rem'
                        }}>
                          <Typography variant="body2">
                            Stage changed from <b>{event.previous_stage}</b> to <b>{event.new_stage}</b>
                          </Typography>
                        </Box>
                      )}
                      
                      {event.metadata && Object.keys(event.metadata).length > 0 && (
                        <Box sx={{ 
                          mt: 1, 
                          p: 1, 
                          bgcolor: 'background.default',
                          borderRadius: 1
                        }}>
                          {Object.entries(event.metadata).map(([key, value]) => (
                            <Typography key={key} variant="body2">
                              <b>{key.replace(/_/g, ' ')}:</b> {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </Typography>
                          ))}
                        </Box>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            );
          })}
        </List>
      )}
      
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
    </Paper>
  );
};

export default OrderHistoryTimeline;