// src/components/Dashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Material UI imports
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Chip,
  IconButton,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tooltip,
  Stack,
  Avatar,
  Badge,
  useTheme,
  useMediaQuery
} from '@mui/material';

// Material UI icons
import {
  Assignment as AssignmentIcon,
  Business as BusinessIcon,
  Description as DescriptionIcon,
  LocalShipping as LocalShippingIcon,
  AttachMoney as AttachMoneyIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  Warning as WarningIcon,
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CheckCircleIcon,
  Flag as FlagIcon,
  Schedule as ScheduleIcon,
  CalendarToday as CalendarTodayIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  Timeline as TimelineIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  AssignmentTurnedIn as CompletedIcon,
  AttachMoney as RevenueIcon,
  MoneyOff as OutstandingIcon,
  MoreVert as MoreVertIcon,
  PersonAdd as PersonAddIcon,
  AddShoppingCart as AddOrderIcon
} from '@mui/icons-material';

// Import CustomerDialog and OrderDialog components
import CustomerDialog from './CustomerDialog';
import OrderDialog from './OrderDialog';

// API URL
const API_URL = 'http://localhost:8000';

// Task status categories based on CRM workflow
const STATUS_CATEGORIES = {
  LEADS: ['New Lead', 'Follow Up', 'Interested', 'Not Interested'],
  QUOTES: ['Active Project', 'Quote Prepared', 'Quote Sent', 'Quote Accepted'],
  MATERIALS: ['Materials Ordering', 'Materials Ordered', 'Partial Received', 'Received', 'Ready for Delivery', 'Delivered'],
  BILLING: ['Invoiced', 'Paid', 'Completed', 'Follow-up Complete']
};

const Dashboard = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // State variables
  const [tasks, setTasks] = useState([]);
  const [orders, setOrders] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateFilter, setDateFilter] = useState('today');
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  
  // Summary state variables
  const [todaysTasks, setTodaysTasks] = useState([]);
  const [overdueTasks, setOverdueTasks] = useState([]);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [leadsSummary, setLeadsSummary] = useState({});
  const [quotesSummary, setQuotesSummary] = useState({});
  const [activeSummary, setActiveSummary] = useState({});
  const [billingSummary, setBillingSummary] = useState({});
  const [performanceMetrics, setPerformanceMetrics] = useState({
    activeOrders: 0,
    completedThisMonth: 0,
    onHold: 0,
    pendingInvoices: 0,
    avgCompletionTime: 0,
    totalRevenue: 0,
    outstandingAmount: 0
  });
  
  // Fetch data
  useEffect(() => {
    fetchDashboardData();
  }, []);
  
  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch essential data first
      const [tasksRes, ordersRes] = await Promise.all([
        axios.get(`${API_URL}/tasks`, { withCredentials: true }),
        axios.get(`${API_URL}/orders`, { withCredentials: true })
      ]);
      
      // Process tasks
      const tasksData = tasksRes.data && tasksRes.data.tasks ? tasksRes.data.tasks : [];
      setTasks(tasksData);
      
      // Process orders
      const ordersData = ordersRes.data && ordersRes.data.orders ? ordersRes.data.orders : [];
      setOrders(ordersData);
      
      // Try to fetch QuickBooks data, but don't fail if endpoints don't exist
      let quotesData = [];
      let invoicesData = [];
      
      try {
        const quotesRes = await axios.get(`${API_URL}/quickbooks/invoices`, { withCredentials: true });
        quotesData = quotesRes.data?.invoices || [];
      } catch (err) {
        if (err.response?.status !== 404) {
          console.warn('Failed to fetch quotes data:', err.message);
        }
      }
      
      try {
        const invoicesRes = await axios.get(`${API_URL}/quickbooks/invoices`, { withCredentials: true });
        invoicesData = invoicesRes.data?.invoices || [];
      } catch (err) {
        if (err.response?.status !== 404) {
          console.warn('Failed to fetch invoices data:', err.message);
        }
      }
      
      // Set the data
      setQuotes(quotesData);
      setInvoices(invoicesData);
      
      // Process the data for dashboard metrics
      processDataForDashboard(tasksData, ordersData, quotesData, invoicesData);
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Process data for dashboard metrics
  const processDataForDashboard = (tasksData, ordersData, quotesData, invoicesData) => {
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
    
    // Process order status summaries
    const leadCount = ordersData.filter(order => order.status === 'Lead').length;
    const quotedCount = ordersData.filter(order => order.status === 'Quoted').length;
    const activeCount = ordersData.filter(order => order.status === 'Active').length;
    const onHoldCount = ordersData.filter(order => order.status === 'On Hold').length;
    const completedCount = ordersData.filter(order => order.status === 'Completed').length;
    
    // Calculate task counts by category
    const taskStatusCounts = {};
    STATUS_CATEGORIES.LEADS.forEach(status => {
      taskStatusCounts[status] = tasksData.filter(task => task.status === status).length;
    });
    
    const quoteStatusCounts = {};
    STATUS_CATEGORIES.QUOTES.forEach(status => {
      quoteStatusCounts[status] = tasksData.filter(task => task.status === status).length;
    });
    
    const materialStatusCounts = {};
    STATUS_CATEGORIES.MATERIALS.forEach(status => {
      materialStatusCounts[status] = tasksData.filter(task => task.status === status).length;
    });
    
    const billingStatusCounts = {};
    STATUS_CATEGORIES.BILLING.forEach(status => {
      billingStatusCounts[status] = tasksData.filter(task => task.status === status).length;
    });
    
    setLeadsSummary({
      total: leadCount,
      tasks: taskStatusCounts
    });
    
    setQuotesSummary({
      total: quotedCount,
      tasks: quoteStatusCounts
    });
    
    setActiveSummary({
      total: activeCount,
      onHold: onHoldCount,
      tasks: materialStatusCounts
    });
    
    setBillingSummary({
      total: completedCount,
      tasks: billingStatusCounts
    });
    
    // Calculate performance metrics
    // Total active orders
    const activeOrders = ordersData.filter(order => order.status === 'Active').length;
    
    // Completed this month
    const thisMonth = today.getMonth();
    const thisYear = today.getFullYear();
    const completedThisMonth = ordersData.filter(order => {
      if (order.status !== 'Completed' || !order.actual_completion_date) return false;
      const completionDate = new Date(order.actual_completion_date);
      return completionDate.getMonth() === thisMonth && completionDate.getFullYear() === thisYear;
    }).length;
    
    // Calculate total revenue from invoices
    const totalRevenue = invoicesData
      .filter(invoice => invoice.status === 'Paid')
      .reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0);
    
    // Calculate outstanding amount
    const outstandingAmount = invoicesData
      .filter(invoice => invoice.status !== 'Paid')
      .reduce((sum, invoice) => sum + (invoice.balance_due || 0), 0);
    
    // Calculate average completion time (in days) for orders completed in the past 3 months
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const completedOrders = ordersData.filter(order => 
      order.status === 'Completed' && 
      order.actual_completion_date && 
      new Date(order.actual_completion_date) >= threeMonthsAgo);
      
    let avgCompletionTime = 0;
    
    if (completedOrders.length > 0) {
      const totalDays = completedOrders.reduce((sum, order) => {
        const startDate = new Date(order.start_date);
        const endDate = new Date(order.actual_completion_date);
        const days = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
        return sum + days;
      }, 0);
      
      avgCompletionTime = Math.round(totalDays / completedOrders.length);
    }
    
    // Set performance metrics
    setPerformanceMetrics({
      activeOrders,
      completedThisMonth,
      onHold: onHoldCount,
      pendingInvoices: invoicesData.filter(invoice => invoice.status === 'Open').length,
      avgCompletionTime,
      totalRevenue,
      outstandingAmount
    });
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
  
  // Format currency
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '$0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };
  
  // Handle customer creation
  const handleCustomerCreated = (newCustomer) => {
    setCustomerDialogOpen(false);
    // Optionally navigate to the customers page or show a success message
    if (newCustomer && newCustomer.customer_id) {
      navigate('/customers');
    }
  };

  // Handle order creation
  const handleOrderCreated = (newOrder) => {
    setOrderDialogOpen(false);
    // Navigate to the new order or show a success message
    if (newOrder && newOrder.order_id) {
      navigate(`/orders/${newOrder.order_id}`);
    }
  };
  
  // Render dashboard content
  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '70vh' 
      }}>
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" sx={{ mt: 2, fontWeight: 500, color: 'text.secondary' }}>
          Loading dashboard data...
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ 
      flexGrow: 1,
      backgroundColor: '#f9fafc', 
      minHeight: '100vh',
      px: { xs: 1, sm: 2, md: 3 },
      py: 3
    }}>
      {/* Quick Actions Section */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 4, 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 2
        }}
      >
        <Typography 
          variant="h5" 
          component="h2" 
          sx={{ 
            color: 'white', 
            fontWeight: 600,
            mb: 3 
          }}
        >
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={<PersonAddIcon />}
              onClick={() => setCustomerDialogOpen(true)}
              sx={{
                py: 2,
                backgroundColor: 'white',
                color: '#667eea',
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '1rem',
                boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                '&:hover': {
                  backgroundColor: '#f8f9fa',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.15)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              Add New Customer
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={<AddOrderIcon />}
              onClick={() => setOrderDialogOpen(true)}
              sx={{
                py: 2,
                backgroundColor: 'white',
                color: '#764ba2',
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '1rem',
                boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                '&:hover': {
                  backgroundColor: '#f8f9fa',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.15)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              Add New Order
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Existing Dashboard Content */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'center' }, 
        mb: 4 
      }}>
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom
          sx={{ 
            fontWeight: 700, 
            color: theme.palette.primary.dark,
            mb: { xs: 2, sm: 0 } 
          }}
        >
          Daily Bulletin
        </Typography>
        
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={2}
          width={{ xs: '100%', sm: 'auto' }}
        >
          <FormControl 
            size="small" 
            sx={{ 
              minWidth: 150,
              bgcolor: 'white',
              boxShadow: '0 2px 5px rgba(0,0,0,0.08)',
              borderRadius: 1
            }}
          >
            <InputLabel id="date-filter-label">Date Range</InputLabel>
            <Select
              labelId="date-filter-label"
              id="date-filter"
              value={dateFilter}
              label="Date Range"
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="week">This Week</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
            </Select>
          </FormControl>
          
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={fetchDashboardData}
            sx={{
              boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
              borderRadius: 2,
              px: 3
            }}
          >
            Refresh
          </Button>
        </Stack>
      </Box>
      
      {error && (
        <Alert 
          severity="error" 
          variant="filled"
          sx={{ 
            mb: 3,
            boxShadow: '0 4px 12px rgba(211, 47, 47, 0.2)',
            borderRadius: 2
          }}
          action={
            <Button color="inherit" size="small" onClick={fetchDashboardData}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}
      
      {/* Performance Metrics Section */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 0, 
          mb: 4,
          borderRadius: 3,
          overflow: 'hidden',
          backgroundColor: 'transparent'
        }}
      >
        <Box sx={{ mb: 2 }}>
          <Typography 
            variant="h5" 
            component="h2"
            sx={{ 
              fontWeight: 600, 
              color: theme.palette.text.primary,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <BarChartIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
            Performance Overview
          </Typography>
        </Box>
        
        <Grid container spacing={3}>
          {/* Active Orders */}
          <Grid item xs={12} md={6} lg={3}>
            <Card 
              elevation={0}
              sx={{ 
                borderRadius: 3,
                boxShadow: '0 8px 16px rgba(0,0,0,0.06)',
                height: '100%',
                position: 'relative',
                overflow: 'hidden',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 12px 20px rgba(0,0,0,0.08)'
                }
              }}
            >
              <Box 
                sx={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  right: 0, 
                  height: '4px', 
                  background: 'linear-gradient(90deg, #3f51b5 0%, #2196f3 100%)' 
                }} 
              />
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography 
                      variant="h3" 
                      sx={{ 
                        fontWeight: 700, 
                        color: theme.palette.primary.main,
                        mb: 0.5
                      }}
                    >
                      {performanceMetrics.activeOrders}
                    </Typography>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        fontWeight: 500, 
                        color: theme.palette.text.secondary
                      }}
                    >
                      Active Orders
                    </Typography>
                  </Box>
                  <Avatar 
                    sx={{ 
                      bgcolor: 'rgba(63, 81, 181, 0.1)', 
                      color: theme.palette.primary.main,
                      width: 48,
                      height: 48
                    }}
                  >
                    <TrendingUpIcon />
                  </Avatar>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                  <Chip 
                    label={`${performanceMetrics.onHold} on hold`} 
                    size="small" 
                    color="warning" 
                    variant="outlined"
                    sx={{ borderRadius: 4 }}
                  />
                  <Box sx={{ flexGrow: 1 }} />
                  <Button 
                    size="small" 
                    onClick={() => navigate('/orders?status=Active')}
                    endIcon={<ArrowForwardIcon />}
                    sx={{ 
                      fontWeight: 500, 
                      color: theme.palette.primary.main,
                      fontSize: '0.75rem'
                    }}
                  >
                    View All
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Completed This Month */}
          <Grid item xs={12} md={6} lg={3}>
            <Card 
              elevation={0}
              sx={{ 
                borderRadius: 3,
                boxShadow: '0 8px 16px rgba(0,0,0,0.06)',
                height: '100%',
                position: 'relative',
                overflow: 'hidden',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 12px 20px rgba(0,0,0,0.08)'
                }
              }}
            >
              <Box 
                sx={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  right: 0, 
                  height: '4px', 
                  background: 'linear-gradient(90deg, #43a047 0%, #81c784 100%)' 
                }} 
              />
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography 
                      variant="h3" 
                      sx={{ 
                        fontWeight: 700, 
                        color: theme.palette.success.main,
                        mb: 0.5
                      }}
                    >
                      {performanceMetrics.completedThisMonth}
                    </Typography>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        fontWeight: 500, 
                        color: theme.palette.text.secondary
                      }}
                    >
                      Tasks Completed
                    </Typography>
                  </Box>
                  <Avatar 
                    sx={{ 
                      bgcolor: 'rgba(67, 160, 71, 0.1)', 
                      color: theme.palette.success.main,
                      width: 48,
                      height: 48
                    }}
                  >
                    <CompletedIcon />
                  </Avatar>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                  <Tooltip title="Average completion time for orders">
                    <Chip 
                      label={`${performanceMetrics.avgCompletionTime} days avg. time`} 
                      size="small" 
                      color="info" 
                      variant="outlined"
                      sx={{ borderRadius: 4 }}
                    />
                  </Tooltip>
                  <Box sx={{ flexGrow: 1 }} />
                  <Button 
                    size="small" 
                    onClick={() => navigate('/orders?status=Completed')}
                    endIcon={<ArrowForwardIcon />}
                    sx={{ 
                      fontWeight: 500, 
                      color: theme.palette.success.main,
                      fontSize: '0.75rem'
                    }}
                  >
                    View All
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Total Revenue */}
          <Grid item xs={12} md={6} lg={3}>
            <Card 
              elevation={0}
              sx={{ 
                borderRadius: 3,
                boxShadow: '0 8px 16px rgba(0,0,0,0.06)',
                height: '100%',
                position: 'relative',
                overflow: 'hidden',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 12px 20px rgba(0,0,0,0.08)'
                }
              }}
            >
              <Box 
                sx={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  right: 0, 
                  height: '4px', 
                  background: 'linear-gradient(90deg, #4caf50 0%, #8bc34a 100%)' 
                }} 
              />
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography 
                      variant="h3" 
                      sx={{ 
                        fontWeight: 700, 
                        color: theme.palette.success.dark,
                        mb: 0.5,
                        mr: 1,
                        fontSize: { xs: '1.75rem', sm: '2.25rem' }
                      }}
                    >
                      {formatCurrency(performanceMetrics.totalRevenue)}
                    </Typography>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        fontWeight: 500, 
                        color: theme.palette.text.secondary
                      }}
                    >
                      Total Revenue
                    </Typography>
                  </Box>
                  <Avatar 
                    sx={{ 
                      bgcolor: 'rgba(76, 175, 80, 0.1)', 
                      color: theme.palette.success.dark,
                      width: 48,
                      height: 48
                    }}
                  >
                    <RevenueIcon />
                  </Avatar>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                  <Chip 
                    label={`${performanceMetrics.pendingInvoices} pending invoices`} 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                    sx={{ borderRadius: 4 }}
                  />
                  <Box sx={{ flexGrow: 1 }} />
                  <Button 
                    size="small" 
                    onClick={() => navigate('/invoices')}
                    endIcon={<ArrowForwardIcon />}
                    sx={{ 
                      fontWeight: 500, 
                      color: theme.palette.success.dark,
                      fontSize: '0.75rem'
                    }}
                  >
                    View All
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Outstanding Amount */}
          <Grid item xs={12} md={6} lg={3}>
            <Card 
              elevation={0}
              sx={{ 
                borderRadius: 3,
                boxShadow: '0 8px 16px rgba(0,0,0,0.06)',
                height: '100%',
                position: 'relative',
                overflow: 'hidden',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 12px 20px rgba(0,0,0,0.08)'
                }
              }}
            >
              <Box 
                sx={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  right: 0, 
                  height: '4px', 
                  background: 'linear-gradient(90deg, #ff9800 0%, #ffb74d 100%)' 
                }} 
              />
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography 
                      variant="h3" 
                      sx={{ 
                        fontWeight: 700, 
                        color: theme.palette.warning.dark,
                        mb: 0.5,
                        mr: 1,
                        fontSize: { xs: '1.75rem', sm: '2.25rem' }
                      }}
                    >
                      {formatCurrency(performanceMetrics.outstandingAmount)}
                    </Typography>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        fontWeight: 500, 
                        color: theme.palette.text.secondary
                      }}
                    >
                      Outstanding Amount
                    </Typography>
                  </Box>
                  <Avatar 
                    sx={{ 
                      bgcolor: 'rgba(255, 152, 0, 0.1)', 
                      color: theme.palette.warning.dark,
                      width: 48,
                      height: 48
                    }}
                  >
                    <OutstandingIcon />
                  </Avatar>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                  <Chip 
                    label={`${invoices.filter(i => i.status !== 'Paid').length} unpaid invoices`}
                    size="small" 
                    color="warning" 
                    variant="outlined"
                    sx={{ borderRadius: 4 }}
                  />
                  <Box sx={{ flexGrow: 1 }} />
                  <Button 
                    size="small" 
                    onClick={() => navigate('/invoices?status=unpaid')}
                    endIcon={<ArrowForwardIcon />}
                    sx={{ 
                      fontWeight: 500, 
                      color: theme.palette.warning.dark,
                      fontSize: '0.75rem'
                    }}
                  >
                    View All
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Daily Summary Section */}
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
          <CalendarTodayIcon 
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
            Today's Priorities
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
                        onClick={() => navigate(`/tasks?task_id=${task.task_id}`)}
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
                                Due: {new Date(task.due_date).toLocaleDateString()}
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
                      onClick={() => navigate('/tasks?filter=overdue')}
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
                        onClick={() => navigate(`/tasks?task_id=${task.task_id}`)}
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
                      onClick={() => navigate('/tasks?filter=today')}
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
                        onClick={() => navigate(`/tasks?task_id=${task.task_id}`)}
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
                              Due: {new Date(task.due_date).toLocaleDateString()}
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
                      onClick={() => navigate('/tasks?filter=upcoming')}
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
      
      {/* Workflow Status Section */}
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
          <TimelineIcon 
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
          <Grid item xs={12} sm={6} md={3}>
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
                    {leadsSummary.total || 0}
                  </Typography>
                  
                  <LinearProgress 
                    variant="determinate"
                    value={Math.min(100, ((leadsSummary.total || 0) / 10) * 100)}
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
                  {Object.entries(leadsSummary.tasks || {}).map(([status, count]) => (
                    count > 0 && (
                      <ListItem 
                        key={status} 
                        button 
                        onClick={() => navigate(`/tasks?status=${status}`)}
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
                  onClick={() => navigate('/orders?status=Lead')}
                  sx={{ 
                    mt: 2,
                    boxShadow: '0 4px 10px rgba(25, 118, 210, 0.25)',
                    fontWeight: 500,
                    textTransform: 'none',
                    borderRadius: 2
                  }}
                >
                  View All Leads
                </Button>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Quote Management */}
          <Grid item xs={12} sm={6} md={3}>
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
                    {quotesSummary.total || 0}
                  </Typography>
                  
                  <LinearProgress 
                    variant="determinate"
                    value={Math.min(100, ((quotesSummary.total || 0) / 8) * 100)}
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
                  {Object.entries(quotesSummary.tasks || {}).map(([status, count]) => (
                    count > 0 && (
                      <ListItem 
                        key={status} 
                        button 
                        onClick={() => navigate(`/tasks?status=${status}`)}
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
                  onClick={() => navigate('/quotes')}
                  sx={{ 
                    mt: 2,
                    boxShadow: '0 4px 10px rgba(156, 39, 176, 0.25)',
                    fontWeight: 500,
                    textTransform: 'none',
                    borderRadius: 2
                  }}
                >
                  View All Quotes
                </Button>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Active Projects */}
          <Grid item xs={12} sm={6} md={3}>
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
                    Active Projects
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
                    {activeSummary.total || 0}
                  </Typography>
                  
                  <LinearProgress 
                    variant="determinate"
                    value={Math.min(100, ((activeSummary.total || 0) / 12) * 100)}
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
                  {Object.entries(activeSummary.tasks || {}).map(([status, count]) => (
                    count > 0 && (
                      <ListItem 
                        key={status} 
                        button 
                        onClick={() => navigate(`/tasks?status=${status}`)}
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
                  onClick={() => navigate('/orders?status=Active')}
                  sx={{ 
                    mt: 2,
                    boxShadow: '0 4px 10px rgba(2, 136, 209, 0.25)',
                    fontWeight: 500,
                    textTransform: 'none',
                    borderRadius: 2
                  }}
                >
                  View Active Orders
                </Button>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Billing & Follow-up */}
          <Grid item xs={12} sm={6} md={3}>
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
                    {billingSummary.total || 0}
                  </Typography>
                  
                  <LinearProgress 
                    variant="determinate"
                    value={Math.min(100, ((billingSummary.total || 0) / 15) * 100)}
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
                  {Object.entries(billingSummary.tasks || {}).map(([status, count]) => (
                    count > 0 && (
                      <ListItem 
                        key={status} 
                        button 
                        onClick={() => navigate(`/tasks?status=${status}`)}
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
                  onClick={() => navigate('/invoices')}
                  sx={{ 
                    mt: 2,
                    boxShadow: '0 4px 10px rgba(76, 175, 80, 0.25)',
                    fontWeight: 500,
                    textTransform: 'none',
                    borderRadius: 2
                  }}
                >
                  View All Invoices
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Recent Activities Section */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 3,
          borderRadius: 3,
          boxShadow: '0 8px 20px rgba(0,0,0,0.05)',
          background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)'
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3,
          borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
          pb: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <NotificationsIcon 
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
              Recent Activities
            </Typography>
          </Box>
          
          <Button 
            variant="text" 
            color="primary"
            endIcon={<ArrowForwardIcon />}
            onClick={() => navigate('/activities')}
            sx={{ fontWeight: 500 }}
          >
            View All
          </Button>
        </Box>
        
        <TableContainer 
          sx={{ 
            maxHeight: 400,
            borderRadius: 2,
            '&::-webkit-scrollbar': {
              width: '8px',
              height: '8px',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(0,0,0,0.1)',
              borderRadius: '4px',
            },
          }}
        >
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell 
                  sx={{ 
                    fontWeight: 600, 
                    bgcolor: 'rgba(0,0,0,0.02)', 
                    color: theme.palette.text.primary 
                  }}
                >
                  Order
                </TableCell>
                <TableCell 
                  sx={{ 
                    fontWeight: 600, 
                    bgcolor: 'rgba(0,0,0,0.02)', 
                    color: theme.palette.text.primary 
                  }}
                >
                  Type
                </TableCell>
                <TableCell 
                  sx={{ 
                    fontWeight: 600, 
                    bgcolor: 'rgba(0,0,0,0.02)', 
                    color: theme.palette.text.primary 
                  }}
                >
                  Description
                </TableCell>
                <TableCell 
                  sx={{ 
                    fontWeight: 600, 
                    bgcolor: 'rgba(0,0,0,0.02)', 
                    color: theme.palette.text.primary 
                  }}
                >
                  Status
                </TableCell>
                <TableCell 
                  sx={{ 
                    fontWeight: 600, 
                    bgcolor: 'rgba(0,0,0,0.02)', 
                    color: theme.palette.text.primary 
                  }}
                >
                  Updated
                </TableCell>
                <TableCell 
                  align="right"
                  sx={{ 
                    fontWeight: 600, 
                    bgcolor: 'rgba(0,0,0,0.02)', 
                    color: theme.palette.text.primary 
                  }}
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.slice(0, 5).map((order) => (
                <TableRow 
                  key={order.order_id} 
                  hover
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell 
                    onClick={() => navigate(`/orders/${order.order_id}`)}
                    sx={{ 
                      color: theme.palette.primary.main,
                      fontWeight: 500
                    }}
                  >
                    {order.order_name}
                  </TableCell>
                  <TableCell onClick={() => navigate(`/orders/${order.order_id}`)}>
                    <Chip 
                      label={order.type || "Material"} 
                      size="small" 
                      variant="outlined"
                      sx={{ 
                        borderRadius: 1,
                        fontWeight: 500,
                        fontSize: '0.7rem'
                      }}
                    />
                  </TableCell>
                  <TableCell onClick={() => navigate(`/orders/${order.order_id}`)}>
                    <Typography 
                      noWrap 
                      sx={{ 
                        maxWidth: 200,
                        fontSize: '0.875rem'
                      }}
                    >
                      {order.description || "N/A"}
                    </Typography>
                  </TableCell>
                  <TableCell onClick={() => navigate(`/orders/${order.order_id}`)}>
                    <Chip 
                      label={order.status} 
                      size="small"
                      color={
                        order.status === 'Completed' ? 'success' :
                        order.status === 'Active' ? 'primary' :
                        order.status === 'On Hold' ? 'warning' :
                        order.status === 'Lead' ? 'info' : 'default'
                      }
                      sx={{ 
                        borderRadius: 1,
                        fontWeight: 500,
                        fontSize: '0.7rem'
                      }}
                    />
                  </TableCell>
                  <TableCell onClick={() => navigate(`/orders/${order.order_id}`)}>
                    <Typography 
                      variant="body2" 
                      sx={{ color: theme.palette.text.secondary }}
                    >
                      {new Date(order.updated_at).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Button 
                      size="small" 
                      variant="contained"
                      color="primary"
                      onClick={() => navigate(`/orders/${order.order_id}`)}
                      sx={{ 
                        borderRadius: 6, 
                        px: 2,
                        py: 0.5,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        minWidth: 0
                      }}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      
      {/* Customer Dialog */}
      <CustomerDialog
        open={customerDialogOpen}
        onClose={() => setCustomerDialogOpen(false)}
        onCustomerCreated={handleCustomerCreated}
      />
      
      {/* Order Dialog */}
      <OrderDialog
        open={orderDialogOpen}
        onClose={() => setOrderDialogOpen(false)}
        onOrderCreated={handleOrderCreated}
      />
    </Box>
  );
};

export default Dashboard;