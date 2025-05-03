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
  CardActions,
  Button,
  CircularProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip
} from '@mui/material';

// Material UI icons
import {
  ArrowForward as ArrowForwardIcon,
  Assignment as AssignmentIcon,
  Business as BusinessIcon,
  Description as DescriptionIcon,
  LocalShipping as LocalShippingIcon,
  AttachMoney as AttachMoneyIcon
} from '@mui/icons-material';

// API URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Task status categories
const STATUS_CATEGORIES = {
  LEADS: ['New Lead', 'Follow Up', 'Interested', 'Not Interested'],
  QUOTES: ['Quote Prepared', 'Quote Sent', 'Quote Accepted'],
  MATERIALS: ['Materials Ordering', 'Materials Ordered', 'Partial Received', 'Received', 'Ready for Delivery', 'Delivered'],
  BILLING: ['Invoiced', 'Paid', 'Completed', 'Follow-up Complete']
};

const Dashboard = () => {
  const navigate = useNavigate();
  
  // State variables
  const [tasks, setTasks] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Summary state variables
  const [leadsSummary, setLeadsSummary] = useState([]);
  const [quotesSummary, setQuotesSummary] = useState([]);
  const [materialsSummary, setMaterialsSummary] = useState([]);
  const [billingSummary, setBillingSummary] = useState([]);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [ordersByStatus, setOrdersByStatus] = useState({});
  
  // Fetch tasks and orders
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
        
        // Fetch orders
        const ordersResponse = await axios.get(`${API_URL}/orders`, {
          withCredentials: true
        });
        
        if (ordersResponse.data && ordersResponse.data.orders) {
          setOrders(ordersResponse.data.orders);
        } else {
          setOrders([]);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Process task data for summaries
  useEffect(() => {
    if (!tasks.length) return;
    
    // Process leads summary
    const leads = STATUS_CATEGORIES.LEADS.map(status => ({
      status,
      count: tasks.filter(task => task.status === status).length
    })).filter(item => item.count > 0);
    setLeadsSummary(leads);
    
    // Process quotes summary
    const quotes = STATUS_CATEGORIES.QUOTES.map(status => ({
      status,
      count: tasks.filter(task => task.status === status).length
    })).filter(item => item.count > 0);
    setQuotesSummary(quotes);
    
    // Process materials summary
    const materials = STATUS_CATEGORIES.MATERIALS.map(status => ({
      status,
      count: tasks.filter(task => task.status === status).length
    })).filter(item => item.count > 0);
    setMaterialsSummary(materials);
    
    // Process billing summary
    const billing = STATUS_CATEGORIES.BILLING.map(status => ({
      status,
      count: tasks.filter(task => task.status === status).length
    })).filter(item => item.count > 0);
    setBillingSummary(billing);
    
    // Get upcoming tasks (due in the next 7 days)
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    const upcoming = tasks
      .filter(task => {
        if (!task.due_date) return false;
        const dueDate = new Date(task.due_date);
        return dueDate >= today && dueDate <= nextWeek;
      })
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
      .slice(0, 5); // Limit to 5 tasks
    
    setUpcomingTasks(upcoming);
  }, [tasks]);
  
  // Process order data for summaries
  useEffect(() => {
    if (!orders.length) return;
    
    // Group orders by status
    const statusGroups = {};
    
    orders.forEach(order => {
      if (!statusGroups[order.status]) {
        statusGroups[order.status] = [];
      }
      statusGroups[order.status].push(order);
    });
    
    setOrdersByStatus(statusGroups);
  }, [orders]);
  
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
  
  // Get order status color
  const getOrderStatusColor = (status) => {
    if (!status) return 'default';
    
    switch (status) {
      case 'Lead':
        return 'info';
      case 'Quoted':
        return 'secondary';
      case 'Active':
        return 'primary';
      case 'On Hold':
        return 'warning';
      case 'Completed':
        return 'success';
      case 'Cancelled':
        return 'error';
      default:
        return 'default';
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Alert 
        severity="error" 
        sx={{ mt: 2 }}
        action={
          <Button color="inherit" size="small" onClick={() => window.location.reload()}>
            Retry
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }
  
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Construction CRM Dashboard
      </Typography>
      
      {/* Orders Summary Section */}
      <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4, mb: 2 }}>
        Orders Overview
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Active Orders */}
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <BusinessIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" component="h3">
                  Active Orders
                </Typography>
              </Box>
              
              <Divider sx={{ mb: 2 }} />
              
              {ordersByStatus['Active'] && ordersByStatus['Active'].length > 0 ? (
                <Box>
                  <Typography variant="h4" color="primary" gutterBottom>
                    {ordersByStatus['Active'].length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Orders currently in progress
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No active orders
                </Typography>
              )}
            </CardContent>
            <CardActions>
              <Button 
                size="small" 
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/orders?status=Active')}
              >
                View Active Orders
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        {/* Quoted Orders */}
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <DescriptionIcon color="secondary" sx={{ mr: 1 }} />
                <Typography variant="h6" component="h3">
                  Quoted Orders
                </Typography>
              </Box>
              
              <Divider sx={{ mb: 2 }} />
              
              {ordersByStatus['Quoted'] && ordersByStatus['Quoted'].length > 0 ? (
                <Box>
                  <Typography variant="h4" color="secondary" gutterBottom>
                    {ordersByStatus['Quoted'].length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Orders waiting for approval
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No quoted orders
                </Typography>
              )}
            </CardContent>
            <CardActions>
              <Button 
                size="small" 
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/orders?status=Quoted')}
              >
                View Quoted Orders
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        {/* Lead Orders */}
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AssignmentIcon color="info" sx={{ mr: 1 }} />
                <Typography variant="h6" component="h3">
                  New Leads
                </Typography>
              </Box>
              
              <Divider sx={{ mb: 2 }} />
              
              {ordersByStatus['Lead'] && ordersByStatus['Lead'].length > 0 ? (
                <Box>
                  <Typography variant="h4" color="info.main" gutterBottom>
                    {ordersByStatus['Lead'].length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    New potential orders
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No new leads
                </Typography>
              )}
            </CardContent>
            <CardActions>
              <Button 
                size="small" 
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/orders?status=Lead')}
              >
                View Leads
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        {/* Completed Orders */}
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AttachMoneyIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6" component="h3">
                  Completed Orders
                </Typography>
              </Box>
              
              <Divider sx={{ mb: 2 }} />
              
              {ordersByStatus['Completed'] && ordersByStatus['Completed'].length > 0 ? (
                <Box>
                  <Typography variant="h4" color="success.main" gutterBottom>
                    {ordersByStatus['Completed'].length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Successfully completed orders
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No completed orders
                </Typography>
              )}
            </CardContent>
            <CardActions>
              <Button 
                size="small" 
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/orders?status=Completed')}
              >
                View Completed Orders
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
      
      {/* Tasks Section */}
      <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4, mb: 2 }}>
        Task Status
      </Typography>
      
      <Grid container spacing={3}>
        {/* Leads Summary */}
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AssignmentIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" component="h3">
                  Lead Acquisition
                </Typography>
              </Box>
              
              <Divider sx={{ mb: 2 }} />
              
              {leadsSummary.length > 0 ? (
                <List dense>
                  {leadsSummary.map((item) => (
                    <ListItem key={item.status}>
                      <ListItemText primary={item.status} />
                      <ListItemSecondaryAction>
                        <Chip label={item.count} color="primary" size="small" />
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No active lead tasks
                </Typography>
              )}
            </CardContent>
            <CardActions>
              <Button 
                size="small" 
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/tasks?tab=leads')}
              >
                View Lead Tasks
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        {/* Quotes Summary */}
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <DescriptionIcon color="secondary" sx={{ mr: 1 }} />
                <Typography variant="h6" component="h3">
                  Quote Management
                </Typography>
              </Box>
              
              <Divider sx={{ mb: 2 }} />
              
              {quotesSummary.length > 0 ? (
                <List dense>
                  {quotesSummary.map((item) => (
                    <ListItem key={item.status}>
                      <ListItemText primary={item.status} />
                      <ListItemSecondaryAction>
                        <Chip label={item.count} color="secondary" size="small" />
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No active quote tasks
                </Typography>
              )}
            </CardContent>
            <CardActions>
              <Button 
                size="small" 
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/tasks?tab=quotes')}
              >
                View Quote Tasks
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        {/* Materials Summary */}
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LocalShippingIcon color="info" sx={{ mr: 1 }} />
                <Typography variant="h6" component="h3">
                  Materials & Delivery
                </Typography>
              </Box>
              
              <Divider sx={{ mb: 2 }} />
              
              {materialsSummary.length > 0 ? (
                <List dense>
                  {materialsSummary.map((item) => (
                    <ListItem key={item.status}>
                      <ListItemText primary={item.status} />
                      <ListItemSecondaryAction>
                        <Chip label={item.count} color="info" size="small" />
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No active material tasks
                </Typography>
              )}
            </CardContent>
            <CardActions>
              <Button 
                size="small" 
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/tasks?tab=materials')}
              >
                View Material Tasks
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        {/* Billing Summary */}
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AttachMoneyIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6" component="h3">
                  Billing & Follow-up
                </Typography>
              </Box>
              
              <Divider sx={{ mb: 2 }} />
              
              {billingSummary.length > 0 ? (
                <List dense>
                  {billingSummary.map((item) => (
                    <ListItem key={item.status}>
                      <ListItemText primary={item.status} />
                      <ListItemSecondaryAction>
                        <Chip label={item.count} color="success" size="small" />
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No active billing tasks
                </Typography>
              )}
            </CardContent>
            <CardActions>
              <Button 
                size="small" 
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/tasks?tab=billing')}
              >
                View Billing Tasks
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
      
      {/* Upcoming Tasks */}
      <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4, mb: 2 }}>
        Upcoming Tasks
      </Typography>
      
      <Paper sx={{ p: 3 }}>
        {upcomingTasks.length > 0 ? (
          <Grid container spacing={2}>
            {upcomingTasks.map((task) => (
              <Grid item xs={12} md={6} key={task.task_id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="subtitle1" component="h3" gutterBottom>
                        {task.title}
                      </Typography>
                      <Chip 
                        label={task.priority} 
                        color={getPriorityColor(task.priority)}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {task.description}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                      <Chip 
                        label={task.status} 
                        size="small"
                      />
                      <Typography variant="body2">
                        Due: {new Date(task.due_date).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </CardContent>
                  {task.order_id && (
                    <CardActions>
                      <Button 
                        size="small" 
                        onClick={() => navigate(`/orders/${task.order_id}`)}
                      >
                        View Related Order
                      </Button>
                    </CardActions>
                  )}
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Typography variant="body1" sx={{ py: 2 }}>
            No upcoming tasks for the next 7 days.
          </Typography>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button 
            variant="contained" 
            color="primary"
            endIcon={<ArrowForwardIcon />}
            onClick={() => navigate('/tasks')}
          >
            View All Tasks
          </Button>
        </Box>
      </Paper>
      
      {/* Recent Orders */}
      <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4, mb: 2 }}>
        Recent Orders
      </Typography>
      
      <Paper sx={{ p: 3 }}>
        {orders.length > 0 ? (
          <Grid container spacing={2}>
            {orders.slice(0, 4).map((order) => (
              <Grid item xs={12} md={6} key={order.order_id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="subtitle1" component="h3" gutterBottom>
                        {order.order_name}
                      </Typography>
                      <Chip 
                        label={order.status} 
                        color={getOrderStatusColor(order.status)}
                        size="small"
                      />
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {order.description?.substring(0, 120)}
                      {order.description?.length > 120 ? '...' : ''}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                      <Typography variant="body2">
                        {order.progress_percentage ? `Progress: ${order.progress_percentage}%` : 'Not started'}
                      </Typography>
                      {order.target_completion_date && (
                        <Typography variant="body2">
                          Target: {new Date(order.target_completion_date).toLocaleDateString()}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button 
                      size="small" 
                      onClick={() => navigate(`/orders/${order.order_id}`)}
                    >
                      View Order Details
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Typography variant="body1" sx={{ py: 2 }}>
            No orders available.
          </Typography>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button 
            variant="contained" 
            color="primary"
            endIcon={<ArrowForwardIcon />}
            onClick={() => navigate('/orders')}
          >
            View All Orders
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default Dashboard;