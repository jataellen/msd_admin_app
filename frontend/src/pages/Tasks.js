// src/pages/Tasks.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

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
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid
} from '@mui/material';

// Material UI icons
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Edit as EditIcon,
} from '@mui/icons-material';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Tab panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`task-tabpanel-${index}`}
      aria-labelledby={`task-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// Status categories based on CRM workflow
const STATUS_CATEGORIES = {
  LEADS: ['New Lead', 'Follow Up', 'Interested', 'Not Interested'],
  QUOTES: ['Active Project', 'Quote Prepared', 'Quote Sent', 'Quote Accepted'],
  MATERIALS: ['Materials Ordering', 'Materials Ordered', 'Partial Received', 'Received', 'Ready for Delivery', 'Delivered'],
  BILLING: ['Invoiced', 'Paid', 'Completed', 'Follow-up Complete']
};

const Tasks = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get initial tab from URL query parameter or default to 'all'
  const searchParams = new URLSearchParams(location.search);
  const initialTab = searchParams.get('tab') || 'all';
  
  // States
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [tabValue, setTabValue] = useState(getTabValueFromName(initialTab));
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskFormData, setTaskFormData] = useState({
    title: '',
    status: 'Open',
    priority: 'Medium',
    assigned_to: '',
    order_id: '',
    due_date: '',
    description: ''
  });
  const [statuses, setStatuses] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [orders, setOrders] = useState([]);
  
  // Function to convert tab name to tab index
  function getTabValueFromName(tabName) {
    const tabMapping = {
      'all': 0,
      'leads': 1,
      'quotes': 2,
      'materials': 3, 
      'billing': 4
    };
    return tabMapping[tabName] || 0;
  }
  
  // Fetch tasks and dropdown options
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch tasks
        const tasksResponse = await axios.get(`${API_URL}/tasks`, {
          withCredentials: true
        });
        
        if (tasksResponse.data && tasksResponse.data.tasks) {
          setTasks(tasksResponse.data.tasks);
        } else {
          setTasks([]);
        }
        
        // Fetch statuses
        const statusesResponse = await axios.get(`${API_URL}/task-statuses`, {
          withCredentials: true
        });
        
        if (statusesResponse.data && statusesResponse.data.statuses) {
          setStatuses(statusesResponse.data.statuses);
        }
        
        // Fetch priorities
        const prioritiesResponse = await axios.get(`${API_URL}/task-priorities`, {
          withCredentials: true
        });
        
        if (prioritiesResponse.data && prioritiesResponse.data.priorities) {
          setPriorities(prioritiesResponse.data.priorities);
        }
        
        // Fetch orders (for dropdown)
        const ordersResponse = await axios.get(`${API_URL}/orders`, {
          withCredentials: true
        });
        
        if (ordersResponse.data && ordersResponse.data.orders) {
          setOrders(ordersResponse.data.orders);
        } else {
          setOrders([]);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load tasks data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
      // Filter tasks based on search term and tab
  useEffect(() => {
    let filtered = [...tasks];
    
    // Apply tab filtering
    if (tabValue === 1) { // Leads
      filtered = filtered.filter(task => STATUS_CATEGORIES.LEADS.includes(task.status));
    } else if (tabValue === 2) { // Quotes
      filtered = filtered.filter(task => STATUS_CATEGORIES.QUOTES.includes(task.status));
    } else if (tabValue === 3) { // Materials
      filtered = filtered.filter(task => STATUS_CATEGORIES.MATERIALS.includes(task.status));
    } else if (tabValue === 4) { // Billing
      filtered = filtered.filter(task => STATUS_CATEGORIES.BILLING.includes(task.status));
    }
    
    // Apply search filtering
    if (searchTerm.trim()) {
      const lowercasedSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(task => 
        (task.title && task.title.toLowerCase().includes(lowercasedSearch)) ||
        (task.description && task.description.toLowerCase().includes(lowercasedSearch)) ||
        (task.assigned_to && task.assigned_to.toLowerCase().includes(lowercasedSearch)) ||
        (task.priority && task.priority.toLowerCase().includes(lowercasedSearch)) ||
        (task.status && task.status.toLowerCase().includes(lowercasedSearch)) ||
        (task.notes && task.notes.toLowerCase().includes(lowercasedSearch))
      );
    }
    
    setFilteredTasks(filtered);
    setPage(1); // Reset to first page on filter change
  }, [searchTerm, tasks, tabValue]);
  
  // Get current page items
  const currentTasks = filteredTasks.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );
  
  // Calculate total pages
  const totalPages = Math.ceil(filteredTasks.length / rowsPerPage);
  
  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    
    // Update URL query parameter
    const tabNames = ['all', 'leads', 'quotes', 'materials', 'billing'];
    navigate(`/tasks?tab=${tabNames[newValue]}`);
  };
  
  // Get priority chip color
  const getPriorityColor = (priority) => {
    if (!priority) return 'default';
    
    switch (priority.toUpperCase()) {
      case 'URGENT':
        return 'error';
      case 'HIGH':
        return 'warning';
      case 'MEDIUM':
        return 'info';
      case 'LOW':
        return 'success';
      default:
        return 'default';
    }
  };
  
  // Get status chip color
  const getStatusColor = (status) => {
    if (!status) return 'default';
    
    if (STATUS_CATEGORIES.LEADS.includes(status)) {
      return 'primary';
    } else if (STATUS_CATEGORIES.QUOTES.includes(status)) {
      return 'secondary';
    } else if (STATUS_CATEGORIES.MATERIALS.includes(status)) {
      return 'info';
    } else if (STATUS_CATEGORIES.BILLING.includes(status)) {
      return 'success';
    } else if (status === 'Open') {
      return 'warning';
    } else if (status === 'In Progress') {
      return 'info';
    } else if (status === 'Completed') {
      return 'success';
    } else if (status === 'Cancelled' || status === 'Blocked') {
      return 'error';
    }
    
    return 'default';
  };
  
  // Handle refresh
  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_URL}/tasks`, {
        withCredentials: true
      });
      
      if (response.data && response.data.tasks) {
        setTasks(response.data.tasks);
      } else {
        setTasks([]);
      }
    } catch (err) {
      console.error('Error refreshing tasks:', err);
      setError('Failed to refresh tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle dialog open for new task
  const handleNewTask = () => {
    setSelectedTask(null);
    setTaskFormData({
      title: '',
      status: 'Open',
      priority: 'Medium',
      assigned_to: '',
      order_id: '',
      due_date: '',
      description: ''
    });
    setOpenDialog(true);
  };
  
  // Handle dialog open for edit task
  const handleEditTask = (task) => {
    setSelectedTask(task);
    setTaskFormData({
      title: task.title || '',
      status: task.status || 'Open',
      priority: task.priority || 'Medium',
      assigned_to: task.assigned_to || '',
      order_id: task.order_id || '',
      due_date: task.due_date ? task.due_date.substring(0, 10) : '', // Format date for input
      description: task.description || ''
    });
    setOpenDialog(true);
  };
  
  // Handle dialog close
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };
  
  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTaskFormData({
      ...taskFormData,
      [name]: value
    });
  };
  
  // Handle form submission
  const handleSubmitTask = async () => {
    try {
      if (!taskFormData.title) {
        alert('Title is required');
        return;
      }
      
      setLoading(true);
      
      // Format data for API
      const apiData = {
        ...taskFormData,
        created_by: 1, // In a real app, this would be the current user's ID
        order_id: taskFormData.order_id ? parseInt(taskFormData.order_id) : null
      };
      
      let response;
      
      if (selectedTask) {
        // Update existing task
        response = await axios.put(
          `${API_URL}/tasks/${selectedTask.task_id}`,
          apiData,
          { withCredentials: true }
        );
        
        // Update the tasks list
        setTasks(tasks.map(task => 
          task.task_id === selectedTask.task_id 
            ? { ...task, ...response.data.task }
            : task
        ));
      } else {
        // Create new task
        response = await axios.post(
          `${API_URL}/tasks`,
          apiData,
          { withCredentials: true }
        );
        
        // Add to tasks list
        setTasks([response.data.task, ...tasks]);
      }
      
      setOpenDialog(false);
    } catch (err) {
      console.error('Error saving task:', err);
      setError('Failed to save task. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Dialog for task creation/editing
  const renderTaskDialog = () => (
    <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
      <DialogTitle>{selectedTask ? 'Edit Task' : 'New Task'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              name="title"
              label="Title"
              value={taskFormData.title}
              onChange={handleInputChange}
              fullWidth
              required
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={taskFormData.status}
                onChange={handleInputChange}
                label="Status"
              >
                {statuses.map(status => (
                  <MenuItem key={status} value={status}>{status}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                name="priority"
                value={taskFormData.priority}
                onChange={handleInputChange}
                label="Priority"
              >
                {priorities.map(priority => (
                  <MenuItem key={priority} value={priority}>{priority}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              name="assigned_to"
              label="Assigned To"
              value={taskFormData.assigned_to}
              onChange={handleInputChange}
              fullWidth
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Related Order</InputLabel>
              <Select
                name="order_id"
                value={taskFormData.order_id}
                onChange={handleInputChange}
                label="Related Order"
              >
                <MenuItem value="">None</MenuItem>
                {orders.map(order => (
                  <MenuItem key={order.order_id} value={order.order_id}>
                    {order.order_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              name="due_date"
              label="Due Date"
              type="date"
              value={taskFormData.due_date}
              onChange={handleInputChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              name="description"
              label="Description"
              value={taskFormData.description}
              onChange={handleInputChange}
              fullWidth
              multiline
              rows={4}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseDialog}>Cancel</Button>
        <Button 
          onClick={handleSubmitTask} 
          variant="contained" 
          color="primary"
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
  
  if (loading && tasks.length === 0) {
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
          Tasks
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
            startIcon={<AddIcon />}
            onClick={handleNewTask}
          >
            New Task
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
      
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search tasks..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 3 }}
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
      
      {loading && tasks.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="task categories"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="All Tasks" />
          <Tab label="Lead Acquisition" />
          <Tab label="Quote Management" />
          <Tab label="Materials & Delivery" />
          <Tab label="Billing & Invoicing" />
        </Tabs>
      </Box>
      
      <TabPanel value={tabValue} index={0}>
        {renderTasksTable(currentTasks)}
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        {renderTasksTable(currentTasks)}
      </TabPanel>
      
      <TabPanel value={tabValue} index={2}>
        {renderTasksTable(currentTasks)}
      </TabPanel>
      
      <TabPanel value={tabValue} index={3}>
        {renderTasksTable(currentTasks)}
      </TabPanel>
      
      <TabPanel value={tabValue} index={4}>
        {renderTasksTable(currentTasks)}
      </TabPanel>
      
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
      
      {renderTaskDialog()}
    </Box>
  );
  
  // Helper function to render tasks table
  function renderTasksTable(tasks) {
    if (tasks.length === 0) {
      return (
        <Alert severity={searchTerm ? "info" : "warning"} sx={{ mt: 2 }}>
          {searchTerm
            ? "No tasks matching your search criteria."
            : "No tasks available for this category."}
        </Alert>
      );
    }
    
    return (
      <Paper sx={{ width: '100%', overflow: 'hidden', mt: 2 }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader aria-label="tasks table">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Assigned To</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Order ID</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.task_id} hover>
                  <TableCell>{task.task_id}</TableCell>
                  <TableCell sx={{ maxWidth: 250, whiteSpace: 'normal', wordBreak: 'break-word' }}>
                    {task.title || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={task.priority || 'N/A'} 
                      color={getPriorityColor(task.priority)}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={task.status || 'N/A'} 
                      color={getStatusColor(task.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{task.assigned_to || 'N/A'}</TableCell>
                  <TableCell>
                    {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {task.order_id ? (
                      <Button 
                        size="small" 
                        variant="outlined" 
                        onClick={() => navigate(`/orders/${task.order_id}`)}
                      >
                        {task.order_id}
                      </Button>
                    ) : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <IconButton 
                      color="primary" 
                      onClick={() => handleEditTask(task)}
                      size="small"
                      title="Edit"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    );
  }
};

export default Tasks;