import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Paper,
  Divider,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  Button,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Badge,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid
} from '@mui/material';

// Material UI icons
import {
  History as HistoryIcon,
  Person as PersonIcon,
  Comment as CommentIcon,
  Timeline as TimelineIcon,
  CheckCircle as CompleteIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Description as DocumentIcon,
  Payment as PaymentIcon,
  ArrowRight as ArrowRightIcon,
  LocalShipping as DeliveryIcon,
  Assignment as OrderIcon,
  Event as EventIcon,
  Info as InfoIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Send as SendIcon,
  List as ListIcon
} from '@mui/icons-material';

// Constants for event types
const EVENT_TYPES = {
  'creation': { icon: <OrderIcon />, color: 'primary', label: 'Created' },
  'update': { icon: <EditIcon />, color: 'info', label: 'Updated' },
  'stage_change': { icon: <TimelineIcon />, color: 'primary', label: 'Stage Changed' },
  'status_change': { icon: <TimelineIcon />, color: 'warning', label: 'Status Changed' },
  'note': { icon: <CommentIcon />, color: 'secondary', label: 'Note Added' },
  'document': { icon: <DocumentIcon />, color: 'info', label: 'Document' },
  'payment': { icon: <PaymentIcon />, color: 'success', label: 'Payment' },
  'delivery': { icon: <DeliveryIcon />, color: 'warning', label: 'Delivery' }
};

// API URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Helper function to format UUID for display
const formatUserDisplay = (user) => {
  if (!user) return 'Unknown';
  
  if (typeof user === 'object' && user.email) {
    return user.email;
  }
  
  // If it's a UUID, show truncated version
  if (typeof user === 'string' && user.includes('-') && user.length > 30) {
    return `User ${user.split('-')[0]}`;
  }
  
  return user.toString();
};

const OrderHistoryTimeline = ({ orderId }) => {
  // State variables
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ 
    total: 0, 
    page: 1, 
    limit: 50,
    pages: 1
  });
  const [filters, setFilters] = useState({
    eventType: '',
    searchTerm: ''
  });
  const [addNoteOpen, setAddNoteOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [noteSubmitting, setNoteSubmitting] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  // Fetch events when component mounts or filters change
  useEffect(() => {
    if (orderId) {
      fetchEvents();
    }
  }, [orderId, filters.eventType, pagination.page]);

  // Function to fetch events from API
const fetchEvents = async () => {
    setLoading(true);
    
    try {
      // Update this URL to match the endpoint in your backend
      let url = `${API_URL}/orders/${orderId}/history?limit=${pagination.limit}&skip=${(pagination.page - 1) * pagination.limit}`;
      
      if (filters.eventType) {
        url += `&event_type=${filters.eventType}`;
      }
      
      const response = await axios.get(url, { withCredentials: true });
      
      if (response.data && response.data.events) {
        // If search term is present, filter the results client-side
        let filteredEvents = response.data.events;
        if (filters.searchTerm) {
          const searchLower = filters.searchTerm.toLowerCase();
          filteredEvents = filteredEvents.filter(event => 
            event.description.toLowerCase().includes(searchLower) ||
            (event.user_email && event.user_email.toLowerCase().includes(searchLower)) ||
            (event.previous_stage && event.previous_stage.toLowerCase().includes(searchLower)) ||
            (event.new_stage && event.new_stage.toLowerCase().includes(searchLower))
          );
        }
        
        setEvents(filteredEvents);
        
        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }
      } else if (Array.isArray(response.data)) {
        // Handle case where API returns array directly
        let filteredEvents = response.data;
        if (filters.searchTerm) {
          const searchLower = filters.searchTerm.toLowerCase();
          filteredEvents = filteredEvents.filter(event => 
            event.description.toLowerCase().includes(searchLower) ||
            (event.user_email && event.user_email.toLowerCase().includes(searchLower)) ||
            (event.previous_stage && event.previous_stage.toLowerCase().includes(searchLower)) ||
            (event.new_stage && event.new_stage.toLowerCase().includes(searchLower))
          );
        }
        
        setEvents(filteredEvents);
        
        // Set pagination based on array length
        setPagination(prev => ({
          ...prev,
          total: filteredEvents.length,
          pages: Math.ceil(filteredEvents.length / prev.limit)
        }));
      } else {
        setEvents([]);
      }
    } catch (err) {
      console.error('Error fetching order events:', err);
      setError('Failed to load order history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Reset pagination when filters change
    if (name !== 'searchTerm') {
      setPagination(prev => ({
        ...prev,
        page: 1
      }));
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Open add note dialog
  const handleOpenAddNote = () => {
    setAddNoteOpen(true);
  };

  // Close add note dialog
  const handleCloseAddNote = () => {
    setAddNoteOpen(false);
    setNewNote('');
  };

  // Submit new note
  const handleSubmitNote = async () => {
    if (!newNote.trim()) return;
    
    setNoteSubmitting(true);
    
    try {
      await axios.post(
        `${API_URL}/orders/${orderId}/notes`,
        { note: newNote },
        { withCredentials: true }
      );
      
      handleCloseAddNote();
      
      // Refresh events to show the new note
      fetchEvents();
    } catch (err) {
      console.error('Error adding note:', err);
      setError('Failed to add note. Please try again.');
    } finally {
      setNoteSubmitting(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Get event icon based on type
  const getEventIcon = (eventType) => {
    return EVENT_TYPES[eventType]?.icon || <EventIcon />;
  };

  // Get event color based on type
  const getEventColor = (eventType) => {
    return EVENT_TYPES[eventType]?.color || 'default';
  };

  // Get event label based on type
  const getEventLabel = (eventType) => {
    return EVENT_TYPES[eventType]?.label || 'Event';
  };

  // Get user display name
  const getUserDisplay = (event) => {
    if (event.user_email) return event.user_email;
    return formatUserDisplay(event.created_by);
  };

  // Render the timeline view
  const renderTimelineView = () => {
    if (loading && events.length === 0) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      );
    }
    
    if (events.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary">
            {filters.eventType || filters.searchTerm
              ? "No events found matching your filters."
              : "No history available for this order yet."}
          </Typography>
        </Box>
      );
    }
    
    return (
      <List>
        {events.map((event, index) => (
          <React.Fragment key={event.event_id}>
            <ListItem
              alignItems="flex-start"
              sx={{
                position: 'relative',
                pl: 4,
                '&:before': {
                  content: '""',
                  position: 'absolute',
                  left: 20,
                  top: 0,
                  bottom: 0,
                  width: 2,
                  bgcolor: index === events.length - 1 ? 'transparent' : 'divider',
                  zIndex: 1
                }
              }}
            >
              <ListItemAvatar>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  badgeContent={
                    <Tooltip title={formatDate(event.created_at)}>
                      <Avatar sx={{ width: 15, height: 15, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
                        <EventIcon sx={{ fontSize: 10 }} />
                      </Avatar>
                    </Tooltip>
                  }
                >
                  <Avatar sx={{ bgcolor: `${getEventColor(event.event_type)}.main`, zIndex: 2 }}>
                    {getEventIcon(event.event_type)}
                  </Avatar>
                </Badge>
              </ListItemAvatar>
              
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                    <Typography variant="subtitle1">
                      {event.description}
                    </Typography>
                    <Chip
                      label={getEventLabel(event.event_type)}
                      size="small"
                      color={getEventColor(event.event_type)}
                      variant="outlined"
                    />
                  </Box>
                }
                secondary={
                  <React.Fragment>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                      <PersonIcon fontSize="small" sx={{ mr: 0.5, fontSize: 14 }} />
                      <Typography component="span" variant="body2" color="text.secondary">
                        {getUserDisplay(event)}
                      </Typography>
                      <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                        {formatDate(event.created_at)}
                      </Typography>
                    </Box>
                    
                    {event.event_type === 'stage_change' && event.previous_stage && event.new_stage && (
                      <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          From: {event.previous_stage}
                        </Typography>
                        <ArrowRightIcon sx={{ mx: 1, fontSize: 16 }} />
                        <Typography variant="body2" color="text.secondary">
                          To: {event.new_stage}
                        </Typography>
                      </Box>
                    )}
                    
                    {event.metadata && Object.keys(event.metadata).length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        {event.event_type === 'payment' && (
                          <Typography variant="body2">
                            Amount: ${event.metadata.amount?.toFixed(2)} • Method: {event.metadata.payment_method?.replace('_', ' ')}
                            {event.metadata.reference && ` • Ref: ${event.metadata.reference}`}
                          </Typography>
                        )}
                        
                        {event.event_type === 'document' && (
                          <Typography variant="body2">
                            {event.metadata.document_type}: {event.metadata.document_name}
                          </Typography>
                        )}
                        
                        {event.event_type === 'update' && (
                          <Box sx={{ mt: 1 }}>
                            {Object.entries(event.metadata || {}).map(([key, value], idx) => {
                              if (key.startsWith('old_') || key.startsWith('new_')) return null;
                              const field = key.replace('_', ' ');
                              return (
                                <Typography key={idx} variant="body2">
                                  {field.charAt(0).toUpperCase() + field.slice(1)}: {value}
                                </Typography>
                              );
                            })}
                          </Box>
                        )}
                      </Box>
                    )}
                  </React.Fragment>
                }
              />
            </ListItem>
          </React.Fragment>
        ))}
      </List>
    );
  };
  
  // Render the list view
  const renderListView = () => {
    if (loading && events.length === 0) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      );
    }
    
    if (events.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary">
            {filters.eventType || filters.searchTerm
              ? "No events found matching your filters."
              : "No history available for this order yet."}
          </Typography>
        </Box>
      );
    }
    
    return (
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} size="small">
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Date/Time</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {events.map((event) => (
              <TableRow
                key={event.event_id}
                hover
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell>
                  <Chip
                    label={getEventLabel(event.event_type)}
                    size="small"
                    color={getEventColor(event.event_type)}
                    icon={getEventIcon(event.event_type)}
                  />
                </TableCell>
                <TableCell>{event.description}</TableCell>
                <TableCell>{formatDate(event.created_at)}</TableCell>
                <TableCell>{getUserDisplay(event)}</TableCell>
                <TableCell>
                  {event.event_type === 'stage_change' && (
                    <Typography variant="body2">
                      {event.previous_stage} → {event.new_stage}
                    </Typography>
                  )}
                  
                  {event.metadata && Object.keys(event.metadata).length > 0 && (
                    <Tooltip 
                      title={
                        <div>
                          {Object.entries(event.metadata).map(([key, value]) => (
                            <div key={key}>{key}: {JSON.stringify(value)}</div>
                          ))}
                        </div>
                      }
                    >
                      <IconButton size="small">
                        <InfoIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <HistoryIcon sx={{ mr: 1 }} />
          <Typography variant="h6">Order History</Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<CommentIcon />}
            onClick={handleOpenAddNote}
            size="small"
          >
            Add Note
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchEvents}
            size="small"
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      {/* Filters */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search in history..."
              size="small"
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: filters.searchTerm && (
                  <InputAdornment position="end">
                    <IconButton 
                      edge="end" 
                      size="small"
                      onClick={() => handleFilterChange('searchTerm', '')}
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel id="event-type-label">Event Type</InputLabel>
              <Select
                labelId="event-type-label"
                value={filters.eventType}
                label="Event Type"
                onChange={(e) => handleFilterChange('eventType', e.target.value)}
              >
                <MenuItem value="">All Events</MenuItem>
                {Object.entries(EVENT_TYPES).map(([type, data]) => (
                  <MenuItem key={type} value={type}>
                    {data.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange}
              variant="fullWidth"
            >
              <Tab icon={<TimelineIcon />} label="Timeline" />
              <Tab icon={<ListIcon />} label="List" />
            </Tabs>
          </Grid>
        </Grid>
      </Box>
      
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={fetchEvents}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}
      
      {/* Event Display */}
      <Box sx={{ mb: 2, maxHeight: 500, overflow: 'auto' }}>
        <TabPanel value={tabValue} index={0}>
          {renderTimelineView()}
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          {renderListView()}
        </TabPanel>
      </Box>
      
      {/* Pagination */}
      {pagination.pages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagination
            count={pagination.pages}
            page={pagination.page}
            onChange={(e, page) => setPagination(prev => ({ ...prev, page }))}
            disabled={loading}
            color="primary"
          />
        </Box>
      )}
      
      {/* Add Note Dialog */}
      <Dialog open={addNoteOpen} onClose={handleCloseAddNote} maxWidth="sm" fullWidth>
        <DialogTitle>Add Note to Order</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Note"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Enter your note about this order..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddNote}>Cancel</Button>
          <Button 
            onClick={handleSubmitNote} 
            variant="contained" 
            color="primary"
            disabled={!newNote.trim() || noteSubmitting}
            startIcon={noteSubmitting ? <CircularProgress size={20} /> : <SendIcon />}
          >
            {noteSubmitting ? 'Saving...' : 'Add Note'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

// TabPanel component for the tabs
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box>
          {children}
        </Box>
      )}
    </div>
  );
}

export default OrderHistoryTimeline;