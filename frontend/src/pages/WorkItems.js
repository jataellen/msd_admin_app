// src/pages/WorkItems.js
import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

// Material UI imports
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  CircularProgress,
  Alert,
  Pagination,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip
} from '@mui/material';

// Material UI icons
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon,
  AddCircle as AddCircleIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterListIcon,
  ArrowForward as ArrowForwardIcon,
  Today as TodayIcon
} from '@mui/icons-material';

// API URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Status categories based on CRM workflow
const STATUS_CATEGORIES = {
  LEADS: ['New Lead', 'Follow Up', 'Interested', 'Not Interested'],
  QUOTES: ['Active Project', 'Quote Prepared', 'Quote Sent', 'Quote Accepted'],
  MATERIALS: ['Materials Ordering', 'Materials Ordered', 'Partial Received', 'Received', 'Ready for Delivery', 'Delivered'],
  BILLING: ['Invoiced', 'Paid', 'Completed', 'Follow-up Complete']
};

// Form for creating/editing work items
const WorkItemForm = ({ workItem, onSuccess, onCancel, mode = 'create' }) => {
  const { user } = useAuth();
  
  // Form states
  const [description, setDescription] = useState(workItem?.description || '');
  const [status, setStatus] = useState(workItem?.status || '');
  const [priority, setPriority] = useState(workItem?.priority || '');
  const [assignedTo, setAssignedTo] = useState(workItem?.assigned_to || user?.email || '');
  const [lastAction, setLastAction] = useState(workItem?.last_action || '');
  const [nextAction, setNextAction] = useState(workItem?.next_action || '');
  const [notes, setNotes] = useState(workItem?.notes || '');
  const [projectId, setProjectId] = useState(workItem?.project_id || '');
  const [dueDate, setDueDate] = useState(workItem?.due_date || '');
  
  // Loading state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Options
  const [statuses, setStatuses] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [projects, setProjects] = useState([]);
  
  // Fetch options
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        // Fetch statuses and priorities
        const [statusesRes, prioritiesRes, projectsRes] = await Promise.all([
          axios.get(`${API_URL}/statuses`, { withCredentials: true }),
          axios.get(`${API_URL}/priorities`, { withCredentials: true }),
          axios.get(`${API_URL}/projects`, { withCredentials: true })
        ]);
        
        setStatuses(statusesRes.data.statuses || []);
        setPriorities(prioritiesRes.data.priorities || []);
        setProjects(projectsRes.data.projects || []);
      } catch (err) {
        console.error('Error fetching options:', err);
        setError('Failed to load form options');
      }
    };
    
    fetchOptions();
  }, []);
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const workItemData = {
        description,
        status,
        priority,
        assigned_to: assignedTo,
        entered_by: user?.email || 'system',
        last_action: lastAction,
        next_action: nextAction,
        notes,
        due_date: dueDate,
        project_id: projectId || null
      };
      
      let response;
      
      if (mode === 'edit' && workItem) {
        // Update existing work item
        response = await axios.put(
          `${API_URL}/work-items/${workItem.id}`,
          workItemData,
          { withCredentials: true }
        );
      } else {
        // Create new work item
        response = await axios.post(
          `${API_URL}/work-items`,
          workItemData,
          { withCredentials: true }
        );
      }
      
      if (onSuccess) {
        onSuccess(response.data.work_item);
      }
    } catch (err) {
      console.error('Error submitting work item:', err);
      setError(err.response?.data?.detail || 'Failed to save work item');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box component="form" onSubmit={handleSubmit}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            required
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <FormControl fullWidth required>
            <InputLabel>Status</InputLabel>
            <Select
              value={status}
              label="Status"
              onChange={(e) => setStatus(e.target.value)}
              disabled={loading}
            >
              {statuses.map((s) => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <FormControl fullWidth required>
            <InputLabel>Priority</InputLabel>
            <Select
              value={priority}
              label="Priority"
              onChange={(e) => setPriority(e.target.value)}
              disabled={loading}
            >
              {priorities.map((p) => (
                <MenuItem key={p} value={p}>{p}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            required
            label="Assigned To"
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            disabled={loading}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="date"
            label="Due Date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            disabled={loading}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Last Action"
            value={lastAction}
            onChange={(e) => setLastAction(e.target.value)}
            disabled={loading}
            multiline
            rows={2}
          />
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Next Action"
            value={nextAction}
            onChange={(e) => setNextAction(e.target.value)}
            disabled={loading}
            multiline
            rows={2}
          />
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={loading}
            multiline
            rows={3}
          />
        </Grid>
        
        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel>Project</InputLabel>
            <Select
              value={projectId}
              label="Project"
              onChange={(e) => setProjectId(e.target.value)}
              disabled={loading}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {projects.map((project) => (
                <MenuItem key={project.project_id} value={project.project_id}>
                  {project.project_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
            <Button
              type="button"
              variant="outlined"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : mode === 'edit' ? 'Update' : 'Create'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

const WorkItems = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get tab from URL query params
  const queryParams = new URLSearchParams(location.search);
  const tabParam = queryParams.get('tab');
  
  // Work items state
  const [workItems, setWorkItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assignedToFilter, setAssignedToFilter] = useState('');
  const [filteredItems, setFilteredItems] = useState([]);
  
  // Filter options
  const [statuses, setStatuses] = useState([]);
  const [priorities, setPriorities] = useState([]);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  
  // Status tab navigation (0 = All, 1 = Leads, 2 = Quotes, 3 = Materials, 4 = Billing)
  const [currentTab, setCurrentTab] = useState(
    tabParam === 'leads' ? 1 : 
    tabParam === 'quotes' ? 2 : 
    tabParam === 'materials' ? 3 : 
    tabParam === 'billing' ? 4 : 0
  );
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedWorkItem, setSelectedWorkItem] = useState(null);
  
  // Fetch work items and filter options
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch statuses, priorities and work items
        const [statusesRes, prioritiesRes, workItemsRes] = await Promise.all([
          axios.get(`${API_URL}/statuses`, { withCredentials: true }),
          axios.get(`${API_URL}/priorities`, { withCredentials: true }),
          axios.get(`${API_URL}/work-items`, { withCredentials: true })
        ]);
        
        setStatuses(statusesRes.data.statuses || []);
        setPriorities(prioritiesRes.data.priorities || []);
        setWorkItems(workItemsRes.data.work_items || []);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load work items. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Update URL when tab changes
  useEffect(() => {
    const tabName = 
      currentTab === 1 ? 'leads' : 
      currentTab === 2 ? 'quotes' : 
      currentTab === 3 ? 'materials' : 
      currentTab === 4 ? 'billing' : '';
    
    if (tabName) {
      navigate(`/work-items?tab=${tabName}`, { replace: true });
    } else {
      navigate('/work-items', { replace: true });
    }
  }, [currentTab, navigate]);
  
  // Filter work items based on search term and filters
  useEffect(() => {
    let filtered = [...workItems];
    
    // Filter by status tab category
    if (currentTab === 1) {
      filtered = filtered.filter(item => STATUS_CATEGORIES.LEADS.includes(item.status));
    } else if (currentTab === 2) {
      filtered = filtered.filter(item => STATUS_CATEGORIES.QUOTES.includes(item.status));
    } else if (currentTab === 3) {
      filtered = filtered.filter(item => STATUS_CATEGORIES.MATERIALS.includes(item.status));
    } else if (currentTab === 4) {
      filtered = filtered.filter(item => STATUS_CATEGORIES.BILLING.includes(item.status));
    }
    
    // Apply search filter
    if (searchTerm.trim()) {
      const lowercasedSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        (item.description && item.description.toLowerCase().includes(lowercasedSearch)) ||
        (item.assigned_to && item.assigned_to.toLowerCase().includes(lowercasedSearch)) ||
        (item.notes && item.notes.toLowerCase().includes(lowercasedSearch)) ||
        (item.next_action && item.next_action.toLowerCase().includes(lowercasedSearch))
      );
    }
    
    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(item => item.status === statusFilter);
    }
    
    // Apply priority filter
    if (priorityFilter) {
      filtered = filtered.filter(item => item.priority === priorityFilter);
    }
    
    // Apply assigned to filter
    if (assignedToFilter) {
      filtered = filtered.filter(item => item.assigned_to === assignedToFilter);
    }
    
    setFilteredItems(filtered);
    setPage(1); // Reset to first page when filters change
  }, [workItems, searchTerm, statusFilter, priorityFilter, assignedToFilter, currentTab]);
  
  // Get current page items
  const currentItems = filteredItems.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );
  
  // Calculate total pages
  const totalPages = Math.ceil(filteredItems.length / rowsPerPage);
  
  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
    // Clear other filters when changing tabs
    setStatusFilter('');
    setPriorityFilter('');
    setAssignedToFilter('');
  };
  
  // Handle refresh
  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_URL}/work-items`, {
        withCredentials: true
      });
      
      setWorkItems(response.data.work_items || []);
    } catch (err) {
      console.error('Error refreshing work items:', err);
      setError('Failed to refresh work items. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle work item creation
  const handleWorkItemCreated = (newWorkItem) => {
    setWorkItems(prevItems => [newWorkItem, ...prevItems]);
    setCreateDialogOpen(false);
  };
  
  // Handle work item update
  const handleWorkItemUpdated = (updatedWorkItem) => {
    setWorkItems(prevItems => 
      prevItems.map(item => 
        item.id === updatedWorkItem.id ? updatedWorkItem : item
      )
    );
    setEditDialogOpen(false);
    setSelectedWorkItem(null);
  };
  
  // Handle work item deletion
  const handleDeleteWorkItem = async () => {
    if (!selectedWorkItem) return;
    
    setLoading(true);
    
    try {
      await axios.delete(`${API_URL}/work-items/${selectedWorkItem.id}`, {
        withCredentials: true
      });
      
      setWorkItems(prevItems => prevItems.filter(item => item.id !== selectedWorkItem.id));
      setDeleteDialogOpen(false);
      setSelectedWorkItem(null);
    } catch (err) {
      console.error('Error deleting work item:', err);
      setError('Failed to delete work item. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Open edit dialog
  const handleOpenEditDialog = (workItem) => {
    setSelectedWorkItem(workItem);
    setEditDialogOpen(true);
  };
  
  // Open delete dialog
  const handleOpenDeleteDialog = (workItem) => {
    setSelectedWorkItem(workItem);
    setDeleteDialogOpen(true);
  };
  
  // Get priority chip color
  const getPriorityColor = (priority) => {
    if (!priority) return 'default';
    
    switch (priority) {
      case 'Urgent':
        return 'error';
      case 'High':
        return 'warning';
      case 'Medium':
        return 'info';
      case 'Low':
        return 'success';
      default:
        return 'default';
    }
  };
  
  // Get status chip color
  const getStatusColor = (status) => {
    if (!status) return 'default';
    
    // Lead statuses
    if (STATUS_CATEGORIES.LEADS.includes(status)) {
      if (status === 'New Lead') return 'info';
      if (status === 'Interested') return 'success';
      if (status === 'Not Interested') return 'error';
      return 'warning'; // Follow Up
    }
    
    // Quote statuses
    if (STATUS_CATEGORIES.QUOTES.includes(status)) {
      if (status === 'Quote Accepted') return 'success';
      return 'info';
    }
    
    // Materials statuses
    if (STATUS_CATEGORIES.MATERIALS.includes(status)) {
      if (status === 'Delivered') return 'success';
      if (status === 'Ready for Delivery') return 'info';
      return 'warning';
    }
    
    // Billing statuses
    if (STATUS_CATEGORIES.BILLING.includes(status)) {
      if (status === 'Completed' || status === 'Paid') return 'success';
      if (status === 'Follow-up Complete') return 'info';
      return 'warning'; // Invoiced
    }
    
    return 'default';
  };
  
  // Format due date
  const formatDueDate = (dateString) => {
    if (!dateString) return 'No due date';
    
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const isToday = date.getTime() === today.getTime();
    const isTomorrow = date.getTime() === tomorrow.getTime();
    const isPast = date < today;
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {isPast && (
          <Chip 
            label="Overdue" 
            color="error" 
            size="small" 
            sx={{ mr: 1 }}
          />
        )}
        {isToday && (
          <Chip 
            label="Today" 
            color="warning" 
            size="small" 
            sx={{ mr: 1 }}
          />
        )}
        {isTomorrow && (
          <Chip 
            label="Tomorrow" 
            color="info" 
            size="small" 
            sx={{ mr: 1 }}
          />
        )}
        <Typography variant="body2">
          {date.toLocaleDateString()}
        </Typography>
      </Box>
    );
  };
  
  if (loading && workItems.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box sx={{ maxWidth: '100%', overflowX: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Work Items
        </Typography>
        
        <Box>
          <Button 
            variant="outlined" 
            color="primary" 
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
          
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddCircleIcon />}
            onClick={() => setCreateDialogOpen(true)}
            disabled={loading}
          >
            New Work Item
          </Button>
        </Box>
      </Box>
      
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={handleRefresh}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}
      
      {/* Workflow tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={currentTab} 
          onChange={handleTabChange} 
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="All Items" />
          <Tab label="Leads" />
          <Tab label="Quotes" />
          <Tab label="Materials" />
          <Tab label="Billing" />
        </Tabs>
      </Paper>
      
      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search work items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setSearchTerm("")}
                      edge="end"
                      aria-label="clear search"
                    >
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth variant="outlined" size="small">
                  <InputLabel id="status-filter-label">Status</InputLabel>
                  <Select
                    labelId="status-filter-label"
                    id="status-filter"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    label="Status"
                  >
                    <MenuItem value="">
                      <em>All Statuses</em>
                    </MenuItem>
                    {statuses.map((status) => (
                      <MenuItem key={status} value={status}>{status}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <FormControl fullWidth variant="outlined" size="small">
                  <InputLabel id="priority-filter-label">Priority</InputLabel>
                  <Select
                    labelId="priority-filter-label"
                    id="priority-filter"
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    label="Priority"
                  >
                    <MenuItem value="">
                      <em>All Priorities</em>
                    </MenuItem>
                    {priorities.map((priority) => (
                      <MenuItem key={priority} value={priority}>{priority}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <FormControl fullWidth variant="outlined" size="small">
                  <InputLabel id="assigned-to-filter-label">Assigned To</InputLabel>
                  <Select
                    labelId="assigned-to-filter-label"
                    id="assigned-to-filter"
                    value={assignedToFilter}
                    onChange={(e) => setAssignedToFilter(e.target.value)}
                    label="Assigned To"
                  >
                    <MenuItem value="">
                      <em>All Assigned</em>
                    </MenuItem>
                    {/* Get unique assigned_to values */}
                    {[...new Set(workItems.map(item => item.assigned_to).filter(Boolean))].map((email) => (
                      <MenuItem key={email} value={email}>{email}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Paper>
      
      {loading && workItems.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}
      
      {/* Results count */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Showing {filteredItems.length} of {workItems.length} total work items
        </Typography>
      </Box>
      
      {currentItems.length > 0 ? (
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader aria-label="work items table">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Assigned To</TableCell>
                  <TableCell>Next Action</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {currentItems.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>{item.id}</TableCell>
                    <TableCell sx={{ maxWidth: 200, whiteSpace: 'normal', wordBreak: 'break-word' }}>
                      {item.description || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={item.status || 'N/A'} 
                        color={getStatusColor(item.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={item.priority || 'N/A'} 
                        color={getPriorityColor(item.priority)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{item.assigned_to || 'N/A'}</TableCell>
                    <TableCell sx={{ maxWidth: 200, whiteSpace: 'normal', wordBreak: 'break-word' }}>
                      {item.next_action || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {item.due_date ? formatDueDate(item.due_date) : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Edit">
                        <IconButton 
                          color="primary" 
                          size="small" 
                          onClick={() => handleOpenEditDialog(item)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton 
                          color="error" 
                          size="small" 
                          onClick={() => handleOpenDeleteDialog(item)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <Pagination 
                count={totalPages} 
                page={page}
                onChange={handleChangePage}
                color="primary"
              />
            </Box>
          )}
        </Paper>
      ) : (
        <Alert severity={searchTerm || statusFilter || priorityFilter || assignedToFilter ? "info" : "warning"} sx={{ mt: 2 }}>
          {searchTerm || statusFilter || priorityFilter || assignedToFilter
            ? "No work items matching your search criteria."
            : "No work items available."}
        </Alert>
      )}
      
      {/* Create Work Item Dialog */}
      <Dialog 
        open={createDialogOpen} 
        onClose={() => setCreateDialogOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Create New Work Item</DialogTitle>
        <DialogContent dividers>
          <WorkItemForm 
            onSuccess={handleWorkItemCreated}
            onCancel={() => setCreateDialogOpen(false)}
            mode="create"
          />
        </DialogContent>
      </Dialog>
      
      {/* Edit Work Item Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Edit Work Item</DialogTitle>
        <DialogContent dividers>
          {selectedWorkItem && (
            <WorkItemForm 
              workItem={selectedWorkItem}
              onSuccess={handleWorkItemUpdated}
              onCancel={() => setEditDialogOpen(false)}
              mode="edit"
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this work item?
            {selectedWorkItem && (
              <Box component="span" sx={{ fontWeight: 'bold', display: 'block', mt: 1 }}>
                "{selectedWorkItem.description}"
              </Box>
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteWorkItem} 
            color="error" 
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkItems;