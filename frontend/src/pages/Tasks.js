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
  Grid,
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Stack,
  Divider,
  Badge,
  Tooltip,
  useTheme,
  Collapse,
  LinearProgress
} from '@mui/material';

// Material UI icons
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Assignment as AssignmentIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  ArrowForward as ArrowForwardIcon,
  KeyboardArrowDown as ExpandMoreIcon,
  KeyboardArrowUp as ExpandLessIcon,
  FilterList as FilterListIcon,
  Business as BusinessIcon,
  Description as DescriptionIcon,
  LocalShipping as LocalShippingIcon,
  AttachMoney as AttachMoneyIcon,
  Person as PersonIcon,
} from '@mui/icons-material';

// API URL
const API_URL = 'http://localhost:8000';

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
  const theme = useTheme();
  
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
  const [showFilters, setShowFilters] = useState(false);
  
  // New states for task organization
  const [todaysTasks, setTodaysTasks] = useState([]);
  const [overdueTasks, setOverdueTasks] = useState([]);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    assignedTo: '',
    dateRange: 'all'
  });
  
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
          
          // Process tasks for today, overdue, and upcoming
          processTasksByDate(tasksResponse.data.tasks);
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
  
  // Function to process tasks by date
  const processTasksByDate = (tasksData) => {
    // Process tasks for today, overdue and upcoming
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    // Filter tasks for today
    const todaysTasks = tasksData.filter(task => {
      if (!task.due_date) return false;
      const dueDate = new Date(task.due_date);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate.getTime() === today.getTime() && task.status !== 'Completed';
    });
    
    // Filter overdue tasks
    const overdueTasks = tasksData.filter(task => {
      if (!task.due_date) return false;
      const dueDate = new Date(task.due_date);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate < today && task.status !== 'Completed';
    });
    
    // Filter upcoming tasks
    const upcomingTasks = tasksData.filter(task => {
      if (!task.due_date) return false;
      const dueDate = new Date(task.due_date);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate > today && dueDate <= nextWeek && task.status !== 'Completed';
    });
    
    setTodaysTasks(todaysTasks);
    setOverdueTasks(overdueTasks);
    setUpcomingTasks(upcomingTasks);
  };
  
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
    
    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter(task => task.status === filters.status);
    }
    
    // Apply priority filter
    if (filters.priority) {
      filtered = filtered.filter(task => task.priority === filters.priority);
    }
    
    // Apply assigned to filter
    if (filters.assignedTo) {
      filtered = filtered.filter(task => 
        task.assigned_to && task.assigned_to.toLowerCase().includes(filters.assignedTo.toLowerCase())
      );
    }
    
    // Apply date range filter
    if (filters.dateRange !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (filters.dateRange === 'today') {
        filtered = filtered.filter(task => {
          if (!task.due_date) return false;
          const dueDate = new Date(task.due_date);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate.getTime() === today.getTime();
        });
      } else if (filters.dateRange === 'overdue') {
        filtered = filtered.filter(task => {
          if (!task.due_date) return false;
          const dueDate = new Date(task.due_date);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate < today && task.status !== 'Completed';
        });
      } else if (filters.dateRange === 'upcoming') {
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        filtered = filtered.filter(task => {
          if (!task.due_date) return false;
          const dueDate = new Date(task.due_date);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate > today && dueDate <= nextWeek;
        });
      } else if (filters.dateRange === 'this-week') {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday
        
        filtered = filtered.filter(task => {
          if (!task.due_date) return false;
          const dueDate = new Date(task.due_date);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate >= startOfWeek && dueDate <= endOfWeek;
        });
      }
    }
    
    // Apply search filter
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
  }, [searchTerm, tasks, tabValue, filters]);
  
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
  
  // Handle filter change
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
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
        processTasksByDate(response.data.tasks);
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
        
        // Process tasks by date again
        processTasksByDate([response.data.task, ...tasks]);
      }
      
      setOpenDialog(false);
    } catch (err) {
      console.error('Error saving task:', err);
      setError('Failed to save task. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  // Render task summary section
  const renderTaskSummary = () => {
    return (
      <Paper 
        elevation={0}
        sx={{ 
          p: 3, 
          mb: 4,
          borderRadius: 3,
          backgroundImage: 'linear-gradient(to right, #f5f7fa, #ffffff)',
          boxShadow: '0 8px 20px rgba(0,0,0,0.05)'
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mb: 3,
          borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
          pb: 2
        }}>
          <AssignmentIcon 
            sx={{ 
              mr: 1.5, 
              color: theme.palette.primary.main, 
              fontSize: 28 
            }} 
          />
          <Typography 
            variant="h5" 
            component="h2"
            sx={{ 
              fontWeight: 600, 
              color: theme.palette.text.primary 
            }}
          >
            Task Summary
          </Typography>
          
          <Box sx={{ flexGrow: 1 }} />
          
          <Typography 
            variant="subtitle1" 
            sx={{ 
              fontWeight: 500,
              display: { xs: 'none', md: 'block' },
              color: theme.palette.text.secondary
            }}
          >
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Typography>
        </Box>
        
        <Grid container spacing={3}>
          {/* Overdue Tasks */}
          <Grid item xs={12} md={4}>
            <Card 
              variant="outlined" 
              sx={{ 
                borderRadius: 2,
                borderColor: overdueTasks.length > 0 ? theme.palette.error.main : theme.palette.divider,
                borderWidth: overdueTasks.length > 0 ? 2 : 1,
                boxShadow: overdueTasks.length > 0 ? '0 4px 12px rgba(211, 47, 47, 0.15)' : 'none',
                height: '100%',
                bgcolor: overdueTasks.length > 0 ? 'rgba(244, 67, 54, 0.03)' : 'white',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: overdueTasks.length > 0 ? '0 6px 16px rgba(211, 47, 47, 0.2)' : '0 4px 10px rgba(0,0,0,0.07)'
                }
              }}
            >
              <CardContent>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  mb: 2 
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <WarningIcon 
                      color="error" 
                      sx={{ 
                        mr: 1,
                        animation: overdueTasks.length > 0 ? 'pulse 2s infinite' : 'none',
                        '@keyframes pulse': {
                          '0%': {
                            opacity: 1,
                          },
                          '50%': {
                            opacity: 0.6,
                          },
                          '100%': {
                            opacity: 1,
                          },
                        },
                      }} 
                    />
                    <Typography 
                      variant="h6" 
                      component="h3"
                      sx={{ fontWeight: 600, mr: 1}}
                    >
                      Overdue Tasks
                    </Typography>
                  </Box>
                  
                <Avatar 
                    sx={{ 
                    width: 32, 
                    height: 32,
                    bgcolor: theme.palette.error.main,
                    boxShadow: '0 2px 8px rgba(211, 47, 47, 0.3)'
                    }}
                >
                    {overdueTasks.length}
                </Avatar>
                  
                </Box>
                
                <List 
                  dense 
                  sx={{ 
                    maxHeight: 240, 
                    overflow: 'auto',
                    pr: 1,
                    pb: 0
                  }}
                >
                  {overdueTasks.length > 0 ? (
                    overdueTasks.slice(0, 5).map((task) => (
                      <ListItem 
                        key={task.task_id}
                        button
                        onClick={() => handleEditTask(task)}
                        sx={{ 
                          borderLeft: '3px solid',
                          borderLeftColor: theme.palette.error.main,
                          borderRadius: '4px',
                          pl: 2, 
                          mb: 1,
                          bgcolor: 'rgba(244, 67, 54, 0.04)',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            bgcolor: 'rgba(244, 67, 54, 0.08)',
                            transform: 'translateX(4px)'
                          }
                        }}
                      >
                        <ListItemText
                          primary={
                            <Typography 
                              variant="subtitle2" 
                              sx={{ 
                                fontWeight: 600,
                                color: theme.palette.text.primary 
                              }}
                            >
                              {task.title}
                            </Typography>
                          }
                          secondary={
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              flexWrap: 'wrap', 
                              mt: 0.5,
                              gap: 1
                            }}>
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  color: theme.palette.error.main,
                                  fontWeight: 500,
                                  display: 'flex',
                                  alignItems: 'center'
                                }}
                              >
                                <ScheduleIcon sx={{ fontSize: 14, mr: 0.5 }} />
                                Due: {formatDate(task.due_date)}
                              </Typography>
                              
                              {task.priority && (
                                <Chip 
                                  label={task.priority} 
                                  color={getPriorityColor(task.priority)}
                                  size="small"
                                  variant="outlined"
                                  sx={{ 
                                    height: 20, 
                                    '& .MuiChip-label': { 
                                      px: 1,
                                      fontSize: '0.7rem',
                                      fontWeight: 500
                                    },
                                    borderRadius: 1
                                  }}
                                />
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                    ))
                  ) : (
                    <Box sx={{ 
                      py: 3, 
                      px: 2, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <CheckCircleIcon sx={{ 
                        fontSize: 40, 
                        color: theme.palette.success.main,
                        mb: 1
                      }} />
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          textAlign: 'center',
                          fontWeight: 500,
                          color: theme.palette.success.main
                        }}
                      >
                        No overdue tasks!
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          textAlign: 'center',
                          color: theme.palette.text.secondary,
                          mt: 1
                        }}
                      >
                        You're all caught up!
                      </Typography>
                    </Box>
                  )}
                </List>
                
                {overdueTasks.length > 5 && (
                  <Box sx={{ mt: 1, textAlign: 'center' }}>
                    <Button 
                      color="error"
                      variant="text"
                      size="small" 
                      onClick={() => handleFilterChange('dateRange', 'overdue')}
                      endIcon={<ArrowForwardIcon />}
                      sx={{
                        mt: 1,
                        fontWeight: 500
                      }}
                    >
                      View All ({overdueTasks.length}) Overdue Tasks
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          {/* Today's Tasks */}
          <Grid item xs={12} md={4}>
            <Card 
              variant="outlined" 
              sx={{ 
                borderRadius: 2,
                height: '100%',
                borderColor: theme.palette.primary.main,
                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.15)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 6px 16px rgba(25, 118, 210, 0.2)'
                }
              }}
            >
              <CardContent>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  mb: 2 
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AssignmentIcon 
                      color="primary" 
                      sx={{ mr: 1 }} 
                    />
                    <Typography 
                      variant="h6" 
                      component="h3"
                      sx={{ fontWeight: 600, mr: 1 }}
                    >
                      Today's Tasks
                    </Typography>
                  </Box>
                  
                <Avatar 
                    sx={{ 
                    width: 32, 
                    height: 32,
                    bgcolor: theme.palette.primary.main,
                    boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)'
                    }}
                >
                    {todaysTasks.length}
                </Avatar>
                  
                </Box>
                
                <List 
                  dense 
                  sx={{ 
                    maxHeight: 240, 
                    overflow: 'auto',
                    pr: 1,
                    pb: 0
                  }}
                >
                  {todaysTasks.length > 0 ? (
                    todaysTasks.slice(0, 5).map((task) => (
                      <ListItem 
                        key={task.task_id}
                        button
                        onClick={() => handleEditTask(task)}
                        sx={{ 
                          borderLeft: '3px solid',
                          borderLeftColor: theme.palette.primary.main,
                          borderRadius: '4px',
                          pl: 2, 
                          mb: 1,
                          bgcolor: 'rgba(25, 118, 210, 0.04)',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            bgcolor: 'rgba(25, 118, 210, 0.08)',
                            transform: 'translateX(4px)'
                          }
                        }}
                      >
                        <ListItemText
                          primary={
                            <Typography 
                              variant="subtitle2" 
                              sx={{ 
                                fontWeight: 600,
                                color: theme.palette.text.primary 
                              }}
                            >
                              {task.title}
                            </Typography>
                          }
                          secondary={
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              flexWrap: 'wrap', 
                              mt: 0.5,
                              gap: 1
                            }}>
                              {task.assigned_to && (
                                <Tooltip title="Assigned to">
                                  <Chip 
                                    icon={<PersonIcon sx={{ fontSize: '1rem !important' }} />}
                                    label={task.assigned_to} 
                                    size="small"
                                    variant="outlined"
                                    sx={{ 
                                      height: 20, 
                                      '& .MuiChip-label': { 
                                        px: 1,
                                        fontSize: '0.7rem',
                                        fontWeight: 500
                                      },
                                      borderRadius: 1
                                    }}
                                  />
                                </Tooltip>
                              )}
                              
                              {task.priority && (
                                <Chip 
                                  label={task.priority} 
                                  color={getPriorityColor(task.priority)}
                                  size="small"
                                  variant="outlined"
                                  sx={{ 
                                    height: 20, 
                                    '& .MuiChip-label': { 
                                      px: 1,
                                      fontSize: '0.7rem',
                                      fontWeight: 500
                                    },
                                    borderRadius: 1
                                  }}
                                />
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                    ))
                  ) : (
                    <Box sx={{ 
                      py: 3, 
                      px: 2, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <CheckCircleIcon sx={{ 
                        fontSize: 40, 
                        color: theme.palette.success.main,
                        mb: 1
                      }} />
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          textAlign: 'center',
                          fontWeight: 500,
                          color: theme.palette.success.main
                        }}
                      >
                        No tasks due today
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          textAlign: 'center',
                          color: theme.palette.text.secondary,
                          mt: 1
                        }}
                      >
                        Enjoy your day!
                      </Typography>
                    </Box>
                  )}
                </List>
                
                {todaysTasks.length > 5 && (
                  <Box sx={{ mt: 1, textAlign: 'center' }}>
                    <Button 
                      color="primary"
                      variant="text"
                      size="small" 
                      onClick={() => handleFilterChange('dateRange', 'today')}
                      endIcon={<ArrowForwardIcon />}
                      sx={{
                        mt: 1,
                        fontWeight: 500
                      }}
                    >
                      View All ({todaysTasks.length}) Today's Tasks
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          {/* Upcoming Tasks */}
          <Grid item xs={12} md={4}>
            <Card 
              variant="outlined" 
              sx={{ 
                borderRadius: 2,
                height: '100%',
                borderColor: theme.palette.info.main,
                boxShadow: '0 4px 12px rgba(2, 136, 209, 0.15)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 6px 16px rgba(2, 136, 209, 0.2)'
                }
              }}
            >
              <CardContent>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  mb: 2 
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ScheduleIcon 
                      color="info" 
                      sx={{ mr: 1 }} 
                    />
                    <Typography 
                      variant="h6" 
                      component="h3"
                      sx={{ fontWeight: 600, mr: 1 }}
                    >
                      Upcoming Tasks
                    </Typography>
                  </Box>
                  
                    <Avatar 
                      sx={{ 
                        width: 32, 
                        height: 32,
                        bgcolor: theme.palette.info.main,
                        boxShadow: '0 2px 8px rgba(2, 136, 209, 0.3)'
                      }}
                    >
                      {upcomingTasks.length}
                    </Avatar>
                  
                </Box>
                
                <List 
                  dense 
                  sx={{ 
                    maxHeight: 240, 
                    overflow: 'auto',
                    pr: 1,
                    pb: 0
                  }}
                >
                  {upcomingTasks.length > 0 ? (
                    upcomingTasks.slice(0, 5).map((task) => (
                      <ListItem 
                        key={task.task_id}
                        button
                        onClick={() => handleEditTask(task)}
                        sx={{ 
                          borderLeft: '3px solid',
                          borderLeftColor: theme.palette.info.main,
                          borderRadius: '4px',
                          pl: 2, 
                          mb: 1,
                          bgcolor: 'rgba(2, 136, 209, 0.04)',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            bgcolor: 'rgba(2, 136, 209, 0.08)',
                            transform: 'translateX(4px)'
                          }
                        }}
                      >
                        <ListItemText
                          primary={
                            <Typography 
                              variant="subtitle2" 
                              sx={{ 
                                fontWeight: 600,
                                color: theme.palette.text.primary 
                              }}
                            >
                              {task.title}
                            </Typography>
                          }
                          secondary={
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                color: theme.palette.info.main,
                                fontWeight: 500,
                                display: 'flex',
                                alignItems: 'center'
                              }}
                            >
                              <ScheduleIcon sx={{ fontSize: 14, mr: 0.5 }} />
                              Due: {formatDate(task.due_date)}
                            </Typography>
                          }
                        />
                      </ListItem>
                    ))
                  ) : (
                    <Box sx={{ 
                      py: 3, 
                      px: 2, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <ScheduleIcon sx={{ 
                        fontSize: 40, 
                        color: theme.palette.info.main,
                        mb: 1
                      }} />
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          textAlign: 'center',
                          fontWeight: 500,
                          color: theme.palette.info.main
                        }}
                      >
                        No upcoming tasks
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          textAlign: 'center',
                          color: theme.palette.text.secondary,
                          mt: 1
                        }}
                      >
                        Your schedule is clear for the week
                      </Typography>
                    </Box>
                  )}
                </List>
                
                {upcomingTasks.length > 5 && (
                  <Box sx={{ mt: 1, textAlign: 'center' }}>
                    <Button 
                      color="info"
                      variant="text"
                      size="small" 
                      onClick={() => handleFilterChange('dateRange', 'upcoming')}
                      endIcon={<ArrowForwardIcon />}
                      sx={{
                        mt: 1,
                        fontWeight: 500
                      }}
                    >
                      View All ({upcomingTasks.length}) Upcoming Tasks
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
    );
  };
  
  // Render workflow status section
  const renderWorkflowStatus = () => {
    // Calculate task counts by status category
    const leadTaskCount = tasks.filter(task => STATUS_CATEGORIES.LEADS.includes(task.status)).length;
    const quoteTaskCount = tasks.filter(task => STATUS_CATEGORIES.QUOTES.includes(task.status)).length;
    const materialTaskCount = tasks.filter(task => STATUS_CATEGORIES.MATERIALS.includes(task.status)).length;
    const billingTaskCount = tasks.filter(task => STATUS_CATEGORIES.BILLING.includes(task.status)).length;
    
    // Calculate stats for each category
    const categoryStats = {
      LEADS: {},
      QUOTES: {},
      MATERIALS: {},
      BILLING: {}
    };
    
    // Calculate counts for each status in each category
    Object.keys(STATUS_CATEGORIES).forEach(category => {
      STATUS_CATEGORIES[category].forEach(status => {
        categoryStats[category][status] = tasks.filter(task => task.status === status).length;
      });
    });

    return (
      <Paper 
        elevation={0}
        sx={{ 
          p: 3, 
          mb: 4,
          borderRadius: 3,
          boxShadow: '0 8px 20px rgba(0,0,0,0.05)',
          background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)'
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mb: 3,
          borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
          pb: 2
        }}>
          <AssignmentIcon 
            sx={{ 
              mr: 1.5, 
              color: theme.palette.primary.main, 
              fontSize: 28 
            }} 
          />
          <Typography 
            variant="h5" 
            component="h2"
            sx={{ 
              fontWeight: 600, 
              color: theme.palette.text.primary 
            }}
          >
            Workflow Status
          </Typography>
        </Box>
        
        <Grid container spacing={3}>
          {/* Lead Acquisition */}
          <Grid item xs={12} sm={6} lg={3}>
            <Card 
              elevation={0}
              sx={{ 
                borderRadius: 2,
                height: '100%',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                position: 'relative',
                overflow: 'hidden',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.08)'
                }
              }}
            >
              <Box 
                sx={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  right: 0, 
                  height: '5px', 
                  bgcolor: theme.palette.primary.main 
                }} 
              />
              <CardContent sx={{ p: 2, pt: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <BusinessIcon 
                    sx={{ 
                      color: theme.palette.primary.main,
                      mr: 1,
                      fontSize: 24
                    }} 
                  />
                  <Typography 
                    variant="h6" 
                    component="h3"
                    sx={{ fontWeight: 600 }}
                  >
                    Lead Acquisition
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      fontWeight: 700, 
                      color: theme.palette.primary.main,
                      textAlign: 'center',
                      mb: 1
                    }}
                  >
                    {leadTaskCount}
                  </Typography>
                  
                  <LinearProgress 
                    variant="determinate"
                    value={Math.min(100, ((leadTaskCount) / 10) * 100)}
                    sx={{ 
                      height: 8, 
                      borderRadius: 4,
                      mb: 1,
                      bgcolor: 'rgba(25, 118, 210, 0.1)'
                    }}
                  />
                </Box>
                
                <Divider sx={{ mb: 2 }} />
                
                <List dense disablePadding>
                  {Object.entries(categoryStats.LEADS).map(([status, count]) => (
                    count > 0 && (
                      <ListItem 
                        key={status} 
                        button 
                        onClick={() => handleFilterChange('status', status)}
                        sx={{ 
                          py: 0.75,
                          borderRadius: 1,
                          '&:hover': {
                            bgcolor: 'rgba(25, 118, 210, 0.04)'
                          }
                        }}
                      >
                        <ListItemText 
                          primary={
                            <Typography 
                              variant="body2"
                              sx={{ fontWeight: 500 }}
                            >
                              {status}
                            </Typography>
                          } 
                        />
                        <Chip 
                          label={count} 
                          size="small" 
                          color="primary"
                          sx={{ 
                            fontWeight: 500,
                            minWidth: 30
                          }}
                        />
                      </ListItem>
                    )
                  ))}
                </List>
                
                <Button 
                  fullWidth 
                  variant="contained" 
                  size="medium" 
                  color="primary"
                  onClick={() => setTabValue(1)}
                  sx={{ 
                    mt: 2,
                    boxShadow: '0 4px 10px rgba(25, 118, 210, 0.25)',
                    fontWeight: 500,
                    textTransform: 'none',
                    borderRadius: 2
                  }}
                >
                  View All Lead Tasks
                </Button>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Quote Management */}
          <Grid item xs={12} sm={6} lg={3}>
            <Card 
              elevation={0}
              sx={{ 
                borderRadius: 2,
                height: '100%',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                position: 'relative',
                overflow: 'hidden',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.08)'
                }
              }}
            >
              <Box 
                sx={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  right: 0, 
                  height: '5px', 
                  bgcolor: theme.palette.secondary.main 
                }} 
              />
              <CardContent sx={{ p: 2, pt: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <DescriptionIcon 
                    sx={{ 
                      color: theme.palette.secondary.main,
                      mr: 1,
                      fontSize: 24
                    }} 
                  />
                  <Typography 
                    variant="h6" 
                    component="h3"
                    sx={{ fontWeight: 600 }}
                  >
                    Quote Management
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      fontWeight: 700, 
                      color: theme.palette.secondary.main,
                      textAlign: 'center',
                      mb: 1
                    }}
                  >
                    {quoteTaskCount}
                  </Typography>
                  
                  <LinearProgress 
                    variant="determinate"
                    value={Math.min(100, ((quoteTaskCount) / 8) * 100)}
                    sx={{ 
                      height: 8, 
                      borderRadius: 4,
                      mb: 1,
                      bgcolor: 'rgba(156, 39, 176, 0.1)',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: theme.palette.secondary.main
                      }
                    }}
                  />
                </Box>
                
                <Divider sx={{ mb: 2 }} />
                
                <List dense disablePadding>
                  {Object.entries(categoryStats.QUOTES).map(([status, count]) => (
                    count > 0 && (
                      <ListItem 
                        key={status} 
                        button 
                        onClick={() => handleFilterChange('status', status)}
                        sx={{ 
                          py: 0.75,
                          borderRadius: 1,
                          '&:hover': {
                            bgcolor: 'rgba(156, 39, 176, 0.04)'
                          }
                        }}
                      >
                        <ListItemText 
                          primary={
                            <Typography 
                              variant="body2"
                              sx={{ fontWeight: 500 }}
                            >
                              {status}
                            </Typography>
                          } 
                        />
                        <Chip 
                          label={count} 
                          size="small" 
                          color="secondary"
                          sx={{ 
                            fontWeight: 500,
                            minWidth: 30
                          }}
                        />
                      </ListItem>
                    )
                  ))}
                </List>
                
                <Button 
                  fullWidth 
                  variant="contained" 
                  size="medium" 
                  color="secondary"
                  onClick={() => setTabValue(2)}
                  sx={{ 
                    mt: 2,
                    boxShadow: '0 4px 10px rgba(156, 39, 176, 0.25)',
                    fontWeight: 500,
                    textTransform: 'none',
                    borderRadius: 2
                  }}
                >
                  View All Quote Tasks
                </Button>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Materials Management */}
          <Grid item xs={12} sm={6} lg={3}>
            <Card 
              elevation={0}
              sx={{ 
                borderRadius: 2,
                height: '100%',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                position: 'relative',
                overflow: 'hidden',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.08)'
                }
              }}
            >
              <Box 
                sx={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  right: 0, 
                  height: '5px', 
                  bgcolor: theme.palette.info.main 
                }} 
              />
              <CardContent sx={{ p: 2, pt: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <LocalShippingIcon 
                    sx={{ 
                      color: theme.palette.info.main,
                      mr: 1,
                      fontSize: 24
                    }} 
                  />
                  <Typography 
                    variant="h6" 
                    component="h3"
                    sx={{ fontWeight: 600 }}
                  >
                    Materials
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      fontWeight: 700, 
                      color: theme.palette.info.main,
                      textAlign: 'center',
                      mb: 1
                    }}
                  >
                    {materialTaskCount}
                  </Typography>
                  
                  <LinearProgress 
                    variant="determinate"
                    value={Math.min(100, ((materialTaskCount) / 12) * 100)}
                    sx={{ 
                      height: 8, 
                      borderRadius: 4,
                      mb: 1,
                      bgcolor: 'rgba(2, 136, 209, 0.1)',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: theme.palette.info.main
                      }
                    }}
                  />
                </Box>
                
                <Divider sx={{ mb: 2 }} />
                
                <List dense disablePadding>
                  {Object.entries(categoryStats.MATERIALS).map(([status, count]) => (
                    count > 0 && (
                      <ListItem 
                        key={status} 
                        button 
                        onClick={() => handleFilterChange('status', status)}
                        sx={{ 
                          py: 0.75,
                          borderRadius: 1,
                          '&:hover': {
                            bgcolor: 'rgba(2, 136, 209, 0.04)'
                          }
                        }}
                      >
                        <ListItemText 
                          primary={
                            <Typography 
                              variant="body2"
                              sx={{ fontWeight: 500 }}
                            >
                              {status}
                            </Typography>
                          } 
                        />
                        <Chip 
                          label={count} 
                          size="small" 
                          color="info"
                          sx={{ 
                            fontWeight: 500,
                            minWidth: 30
                          }}
                        />
                      </ListItem>
                    )
                  ))}
                </List>
                
                <Button 
                  fullWidth 
                  variant="contained" 
                  size="medium" 
                  color="info"
                  onClick={() => setTabValue(3)}
                  sx={{ 
                    mt: 2,
                    boxShadow: '0 4px 10px rgba(2, 136, 209, 0.25)',
                    fontWeight: 500,
                    textTransform: 'none',
                    borderRadius: 2
                  }}
                >
                  View All Material Tasks
                </Button>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Billing & Follow-up */}
          <Grid item xs={12} sm={6} lg={3}>
            <Card 
              elevation={0}
              sx={{ 
                borderRadius: 2,
                height: '100%',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                position: 'relative',
                overflow: 'hidden',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.08)'
                }
              }}
            >
              <Box 
                sx={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  right: 0, 
                  height: '5px', 
                  bgcolor: theme.palette.success.main 
                }} 
              />
              <CardContent sx={{ p: 2, pt: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AttachMoneyIcon 
                    sx={{ 
                      color: theme.palette.success.main,
                      mr: 1,
                      fontSize: 24
                    }} 
                  />
                  <Typography 
                    variant="h6" 
                    component="h3"
                    sx={{ fontWeight: 600 }}
                  >
                    Billing & Follow-up
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      fontWeight: 700, 
                      color: theme.palette.success.main,
                      textAlign: 'center',
                      mb: 1
                    }}
                  >
                    {billingTaskCount}
                  </Typography>
                  
                  <LinearProgress 
                    variant="determinate"
                    value={Math.min(100, ((billingTaskCount) / 15) * 100)}
                    sx={{ 
                      height: 8, 
                      borderRadius: 4,
                      mb: 1,
                      bgcolor: 'rgba(76, 175, 80, 0.1)',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: theme.palette.success.main
                      }
                    }}
                  />
                </Box>
                
                <Divider sx={{ mb: 2 }} />
                
                <List dense disablePadding>
                  {Object.entries(categoryStats.BILLING).map(([status, count]) => (
                    count > 0 && (
                      <ListItem 
                        key={status} 
                        button 
                        onClick={() => handleFilterChange('status', status)}
                        sx={{ 
                          py: 0.75,
                          borderRadius: 1,
                          '&:hover': {
                            bgcolor: 'rgba(76, 175, 80, 0.04)'
                          }
                        }}
                      >
                        <ListItemText 
                          primary={
                            <Typography 
                              variant="body2"
                              sx={{ fontWeight: 500 }}
                            >
                              {status}
                            </Typography>
                          } 
                        />
                        <Chip 
                          label={count} 
                          size="small" 
                          color="success"
                          sx={{ 
                            fontWeight: 500,
                            minWidth: 30
                          }}
                        />
                      </ListItem>
                    )
                  ))}
                </List>
                
                <Button 
                  fullWidth 
                  variant="contained" 
                  size="medium" 
                  color="success"
                  onClick={() => setTabValue(4)}
                  sx={{ 
                    mt: 2,
                    boxShadow: '0 4px 10px rgba(76, 175, 80, 0.25)',
                    fontWeight: 500,
                    textTransform: 'none',
                    borderRadius: 2
                  }}
                >
                  View All Billing Tasks
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
    );
  };
  
  // Render detailed tasks list
  const renderTasksList = () => {
    return (
      <Paper 
        elevation={0}
        sx={{ 
          p: 3, 
          mb: 4,
          borderRadius: 3,
          boxShadow: '0 8px 20px rgba(0,0,0,0.05)',
          background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)'
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start', 
          mb: 3,
          pb: 2,
          borderBottom: '1px solid rgba(0, 0, 0, 0.06)'
        }}>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
            All Tasks
          </Typography>
          
          <Box>
            <Button
              variant="outlined"
              startIcon={<FilterListIcon />}
              onClick={() => setShowFilters(!showFilters)}
              sx={{ mr: 1 }}
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
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
        
        <Collapse in={showFilters}>
          <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(0, 0, 0, 0.02)', borderRadius: 2 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 500 }}>
              Filters
            </Typography>
            
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filters.status}
                    label="Status"
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <MenuItem value="">All Statuses</MenuItem>
                    {statuses.map((status) => (
                      <MenuItem key={status} value={status}>{status}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={filters.priority}
                    label="Priority"
                    onChange={(e) => handleFilterChange('priority', e.target.value)}
                  >
                    <MenuItem value="">All Priorities</MenuItem>
                    {priorities.map((priority) => (
                      <MenuItem key={priority} value={priority}>{priority}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Assigned To"
                  value={filters.assignedTo}
                  onChange={(e) => handleFilterChange('assignedTo', e.target.value)}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Date Range</InputLabel>
                  <Select
                    value={filters.dateRange}
                    label="Date Range"
                    onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                  >
                    <MenuItem value="all">All Dates</MenuItem>
                    <MenuItem value="today">Due Today</MenuItem>
                    <MenuItem value="this-week">Due This Week</MenuItem>
                    <MenuItem value="overdue">Overdue</MenuItem>
                    <MenuItem value="upcoming">Upcoming (Next 7 Days)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    onClick={() => setFilters({
                      status: '',
                      priority: '',
                      assignedTo: '',
                      dateRange: 'all'
                    })}
                    sx={{ mr: 1 }}
                  >
                    Clear Filters
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Collapse>
        
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            placeholder="Search tasks..."
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
        </Box>
        
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
        
        {loading && filteredTasks.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredTasks.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" gutterBottom>
              No tasks found
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              {searchTerm || filters.status || filters.priority || filters.assignedTo || filters.dateRange !== 'all'
                ? "Try adjusting your filters or search term."
                : "Your task list is empty. Click 'New Task' to create your first task."}
            </Typography>
            {(searchTerm || filters.status || filters.priority || filters.assignedTo || filters.dateRange !== 'all') && (
              <Button 
                variant="outlined" 
                sx={{ mt: 2 }}
                onClick={() => {
                  setSearchTerm('');
                  setFilters({
                    status: '',
                    priority: '',
                    assignedTo: '',
                    dateRange: 'all'
                  });
                }}
              >
                Clear Filters
              </Button>
            )}
          </Box>
        ) : (
          <>
            <TabPanel value={tabValue} index={0}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Title</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Priority</TableCell>
                      <TableCell>Assigned To</TableCell>
                      <TableCell>Due Date</TableCell>
                      <TableCell>Order ID</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentTasks.map((task) => (
                      <TableRow key={task.task_id} hover>
                        <TableCell>{task.title}</TableCell>
                        <TableCell>
                          <Chip 
                            label={task.status || 'N/A'} 
                            color={getStatusColor(task.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={task.priority || 'N/A'} 
                            color={getPriorityColor(task.priority)}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>{task.assigned_to || 'N/A'}</TableCell>
                        <TableCell>{formatDate(task.due_date)}</TableCell>
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
            </TabPanel>
            
            <TabPanel value={tabValue} index={1}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Title</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Priority</TableCell>
                      <TableCell>Assigned To</TableCell>
                      <TableCell>Due Date</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentTasks.map((task) => (
                      <TableRow key={task.task_id} hover>
                        <TableCell>{task.title}</TableCell>
                        <TableCell>
                          <Chip 
                            label={task.status} 
                            color={getStatusColor(task.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={task.priority} 
                            color={getPriorityColor(task.priority)}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>{task.assigned_to || 'N/A'}</TableCell>
                        <TableCell>{formatDate(task.due_date)}</TableCell>
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
            </TabPanel>
            
            <TabPanel value={tabValue} index={2}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Title</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Priority</TableCell>
                      <TableCell>Assigned To</TableCell>
                      <TableCell>Due Date</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentTasks.map((task) => (
                      <TableRow key={task.task_id} hover>
                        <TableCell>{task.title}</TableCell>
                        <TableCell>
                          <Chip 
                            label={task.status} 
                            color={getStatusColor(task.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={task.priority} 
                            color={getPriorityColor(task.priority)}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>{task.assigned_to || 'N/A'}</TableCell>
                        <TableCell>{formatDate(task.due_date)}</TableCell>
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
            </TabPanel>
            
            <TabPanel value={tabValue} index={3}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Title</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Priority</TableCell>
                      <TableCell>Assigned To</TableCell>
                      <TableCell>Due Date</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentTasks.map((task) => (
                      <TableRow key={task.task_id} hover>
                        <TableCell>{task.title}</TableCell>
                        <TableCell>
                          <Chip 
                            label={task.status} 
                            color={getStatusColor(task.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={task.priority} 
                            color={getPriorityColor(task.priority)}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>{task.assigned_to || 'N/A'}</TableCell>
                        <TableCell>{formatDate(task.due_date)}</TableCell>
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
            </TabPanel>
            
            <TabPanel value={tabValue} index={4}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Title</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Priority</TableCell>
                      <TableCell>Assigned To</TableCell>
                      <TableCell>Due Date</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentTasks.map((task) => (
                      <TableRow key={task.task_id} hover>
                        <TableCell>{task.title}</TableCell>
                        <TableCell>
                          <Chip 
                            label={task.status} 
                            color={getStatusColor(task.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={task.priority} 
                            color={getPriorityColor(task.priority)}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>{task.assigned_to || 'N/A'}</TableCell>
                        <TableCell>{formatDate(task.due_date)}</TableCell>
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
          </>
        )}
      </Paper>
    );
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
              <InputLabel id="task-status-label">Status</InputLabel>
              <Select
                labelId="task-status-label"
                id="task-status"
                name="status"
                value={taskFormData.status}
                label="Status"
                onChange={handleInputChange}
              >
                {statuses.map(status => (
                  <MenuItem key={status} value={status}>{status}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel id="task-priority-label">Priority</InputLabel>
              <Select
                labelId="task-priority-label"
                id="task-priority"
                name="priority"
                value={taskFormData.priority}
                label="Priority"
                onChange={handleInputChange}
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
              <InputLabel id="order-id-label">Related Order</InputLabel>
              <Select
                labelId="order-id-label"
                id="order_id"
                name="order_id"
                value={taskFormData.order_id}
                label="Related Order"
                onChange={handleInputChange}
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
          disabled={loading || !taskFormData.title}
        >
          {loading ? <CircularProgress size={24} /> : selectedTask ? 'Update Task' : 'Create Task'}
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
    <Box sx={{ 
      flexGrow: 1,
      backgroundColor: '#f9fafc', 
      minHeight: '100vh'
    }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Task Management
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
      
      {/* Task Summary Section */}
      {renderTaskSummary()}
      
      {/* Workflow Status Section */}
      {renderWorkflowStatus()}
      
      {/* Task List Section */}
      {renderTasksList()}
      
      {/* Task Creation/Editing Dialog */}
      {renderTaskDialog()}
    </Box>
  );
};

export default Tasks;