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
  Chip,
  IconButton
} from '@mui/material';

// Material UI icons
import {
  ArrowForward as ArrowForwardIcon,
  Assignment as AssignmentIcon,
  Build as BuildIcon,
  PriorityHigh as PriorityHighIcon,
  LocalShipping as LocalShippingIcon,
  AttachMoney as AttachMoneyIcon
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

const Dashboard = () => {
  const navigate = useNavigate();
  
  // Data states
  const [workItems, setWorkItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Summary states
  const [leadsSummary, setLeadsSummary] = useState([]);
  const [quotesSummary, setQuotesSummary] = useState([]);
  const [materialsSummary, setMaterialsSummary] = useState([]);
  const [billingSummary, setBillingSummary] = useState([]);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  
  // Fetch work items
  useEffect(() => {
    const fetchWorkItems = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await axios.get(`${API_URL}/work-items`, {
          withCredentials: true
        });
        
        setWorkItems(response.data.work_items || []);
      } catch (err) {
        console.error('Error fetching work items:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchWorkItems();
  }, []);
  
  // Calculate summary counts when work items change
  useEffect(() => {
    if (!workItems.length) return;
    
    // Process leads summary
    const leads = STATUS_CATEGORIES.LEADS.map(status => ({
      status,
      count: workItems.filter(item => item.status === status).length
    })).filter(item => item.count > 0);
    setLeadsSummary(leads);
    
    // Process quotes summary
    const quotes = STATUS_CATEGORIES.QUOTES.map(status => ({
      status,
      count: workItems.filter(item => item.status === status).length
    })).filter(item => item.count > 0);
    setQuotesSummary(quotes);
    
    // Process materials summary
    const materials = STATUS_CATEGORIES.MATERIALS.map(status => ({
      status,
      count: workItems.filter(item => item.status === status).length
    })).filter(item => item.count > 0);
    setMaterialsSummary(materials);
    
    // Process billing summary
    const billing = STATUS_CATEGORIES.BILLING.map(status => ({
      status,
      count: workItems.filter(item => item.status === status).length
    })).filter(item => item.count > 0);
    setBillingSummary(billing);
    
    // Get upcoming tasks (due in the next 7 days)
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    const upcoming = workItems
      .filter(item => {
        if (!item.due_date) return false;
        const dueDate = new Date(item.due_date);
        return dueDate >= today && dueDate <= nextWeek;
      })
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
      .slice(0, 5); // Limit to 5 tasks
    
    setUpcomingTasks(upcoming);
  }, [workItems]);
  
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
        CRM Workflow Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        {/* Leads Summary */}
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AssignmentIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" component="h2">
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
                  No active leads
                </Typography>
              )}
            </CardContent>
            <CardActions>
              <Button 
                size="small" 
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/work-items?tab=leads')}
              >
                View All Leads
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        {/* Quotes Summary */}
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <BuildIcon color="secondary" sx={{ mr: 1 }} />
                <Typography variant="h6" component="h2">
                  Project Quotes
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
                  No active quotes
                </Typography>
              )}
            </CardContent>
            <CardActions>
              <Button 
                size="small" 
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/work-items?tab=quotes')}
              >
                View All Quotes
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
                <Typography variant="h6" component="h2">
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
                  No active materials orders
                </Typography>
              )}
            </CardContent>
            <CardActions>
              <Button 
                size="small" 
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/work-items?tab=materials')}
              >
                View Materials
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
                <Typography variant="h6" component="h2">
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
                  No active billing items
                </Typography>
              )}
            </CardContent>
            <CardActions>
              <Button 
                size="small" 
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/work-items?tab=billing')}
              >
                View Billing
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        {/* Upcoming Tasks */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" component="h2" gutterBottom>
              Upcoming Tasks
            </Typography>
            
            <Divider sx={{ mb: 2 }} />
            
            {upcomingTasks.length > 0 ? (
              <Grid container spacing={2}>
                {upcomingTasks.map((task) => (
                  <Grid item xs={12} md={6} key={task.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Typography variant="subtitle1" component="h3" gutterBottom>
                            {task.description}
                          </Typography>
                          <Chip 
                            label={task.priority} 
                            color={getPriorityColor(task.priority)}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {task.next_action}
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
                onClick={() => navigate('/work-items')}
              >
                View All Work Items
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;