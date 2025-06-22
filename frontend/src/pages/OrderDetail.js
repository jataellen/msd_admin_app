// src/pages/OrderDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Alert, 
  Button, 
  Container, 
  Breadcrumbs,
  Link,
  Paper,
  Grid,
  Chip,
  Card,
  CardContent,
  CardHeader,
  LinearProgress,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import {
  NavigateNext as NavigateNextIcon,
  Dashboard as DashboardIcon,
  FormatListBulleted as ListIcon,
  NavigateBefore as BackIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Business as BusinessIcon,
  Schedule as ScheduleIcon,
  Timeline as TimelineIcon,
  Assignment as AssignmentIcon,
  Info as InfoIcon
} from '@mui/icons-material';

// Import components
import OrderHeader from '../components/OrderHeader';
import OrderTabs from '../components/OrderTabs';
import StatusDialog from '../components/StatusDialog';
import TaskDialog from '../components/TaskDialog';
import OrderProgress from '../components/OrderProgress';
import OrderDialog from '../components/OrderDialog';

// Import formatters
import { formatDate, formatCurrency, getStatusColor } from '../utils/formatters';

// API URL
const API_URL = 'http://localhost:8000';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // State variables
  const [order, setOrder] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusDialog, setStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [orderStatuses, setOrderStatuses] = useState([]);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [taskDialog, setTaskDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [taskFormData, setTaskFormData] = useState({
    title: '',
    status: 'Open',
    priority: 'Medium',
    assigned_to: '',
    description: '',
    due_date: ''
  });
  const [tabValue, setTabValue] = useState(0);
  const [workflowStages, setWorkflowStages] = useState([]);
  const [workflowStatuses, setWorkflowStatuses] = useState([]);
  const [events, setEvents] = useState([]);
  
  // Fetch order data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch order details
        const response = await axios.get(`${API_URL}/orders/${id}`, {
          withCredentials: true
        });
        
        // Set state with response data
        setOrder(response.data.order);
        setCustomer(response.data.customer);
        setTasks(response.data.tasks || []);
        setTeamMembers(response.data.team_members || []);
        setQuotes(response.data.quotes || []);
        setPurchaseOrders(response.data.purchase_orders || []);
        setInvoices(response.data.invoices || []);
        
        // Set initial status for dialog
        if (response.data.order) {
          setNewStatus(response.data.order.status);
        }
        
        // Fetch order statuses
        const statusesResponse = await axios.get(`${API_URL}/orders/order-statuses`, {
          params: { workflow_type: response.data.order?.workflow_type || '' },
          withCredentials: true
        });
        
        if (statusesResponse.data && statusesResponse.data.statuses) {
          setOrderStatuses(statusesResponse.data.statuses);
        }
        
        // Fetch workflow data
        if (response.data.order) {
          const orderType = response.data.order.workflow_type || response.data.order.type || 'MATERIALS_ONLY';
          
          // Fetch workflow stages and statuses
          const workflowResponse = await axios.get(`${API_URL}/workflow/full-workflow/${orderType}`, {
            withCredentials: true
          });
          
          if (workflowResponse.data && workflowResponse.data.stages) {
            setWorkflowStages(workflowResponse.data.stages);
            
            // Extract all statuses from stages
            const allStatuses = [];
            workflowResponse.data.stages.forEach(stage => {
              if (stage.statuses && Array.isArray(stage.statuses)) {
                stage.statuses.forEach(status => {
                  allStatuses.push(status);
                });
              }
            });
            setWorkflowStatuses(allStatuses);
          }
          
          // Fetch events
          const eventsResponse = await axios.get(`${API_URL}/order-events/${id}`, {
            withCredentials: true
          });
          setEvents(eventsResponse.data || []);
        }
      } catch (err) {
        console.error('Error fetching order details:', err);
        // Only show error if it's not an authentication issue
        if (err.response?.status !== 401 && err.response?.status !== 403) {
          setError('Failed to load order details. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);
  
  // Handle status update
  const handleStatusUpdate = async () => {
    if (!order || newStatus === order.status) {
      setStatusDialog(false);
      return;
    }
    
    setUpdateLoading(true);
    
    try {
      // Update order status API call
      await axios.put(
        `${API_URL}/orders/${id}`,
        { status: newStatus },
        { withCredentials: true }
      );
      
      // Update order in state
      setOrder({ ...order, status: newStatus });
      
      // Close dialog
      setStatusDialog(false);
    } catch (err) {
      console.error('Error updating order status:', err);
      setError('Failed to update order status. Please try again.');
    } finally {
      setUpdateLoading(false);
    }
  };
  
  // Handle new task creation
  const handleCreateTask = async () => {
    if (!taskFormData.title) {
      return;
    }
    
    setUpdateLoading(true);
    
    try {
      const response = await axios.post(
        `${API_URL}/tasks`,
        {
          ...taskFormData,
          order_id: parseInt(id),
          created_by: 1
        },
        { withCredentials: true }
      );
      
      setTasks([response.data.task, ...tasks]);
      
      setTaskFormData({
        title: '',
        status: 'Open',
        priority: 'Medium',
        assigned_to: '',
        description: '',
        due_date: ''
      });
      setTaskDialog(false);
    } catch (err) {
      console.error('Error creating task:', err);
      setError('Failed to create task. Please try again.');
    } finally {
      setUpdateLoading(false);
    }
  };
  
  // Handle order update from edit dialog
  const handleOrderUpdated = (updatedOrder) => {
    // Refresh the order data to get the latest information
    window.location.reload();
    setEditDialog(false);
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Helper functions for progress calculation
  const isStatusCompleted = (statusId) => {
    if (!order || !order.completed_statuses || !Array.isArray(order.completed_statuses)) return false;
    return order.completed_statuses.includes(statusId);
  };

  const findStatusById = (statusId) => {
    return workflowStatuses.find(status => status.id === statusId);
  };

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

  const calculateProgress = () => {
    if (!workflowStatuses.length) return 0;
    
    let completedCount = 0;
    const completedList = [];
    for (const status of workflowStatuses) {
      if (isStatusCompleted(status.id)) {
        completedCount++;
        completedList.push(status.id);
      }
    }
    
    return Math.round((completedCount / workflowStatuses.length) * 100);
  };

  const getMostRecentEvent = () => {
    if (!events.length) return null;
    return events.reduce((mostRecent, event) => {
      const eventDate = new Date(event.created_at);
      const mostRecentDate = new Date(mostRecent.created_at);
      return eventDate > mostRecentDate ? event : mostRecent;
    });
  };

  // Loading state
  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '70vh' 
        }}
      >
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" sx={{ mt: 3 }}>
          Loading Order Details...
        </Typography>
      </Box>
    );
  }
  
  // Error state
  if (error) {
    return (
      <Box sx={{ m: 3 }}>
        <Alert 
          severity="error" 
          sx={{ mt: 2 }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={() => navigate('/orders')}
              startIcon={<BackIcon />}
            >
              Back to Orders
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }
  
  // Order not found
  if (!order) {
    return (
      <Box sx={{ m: 3 }}>
        <Alert 
          severity="warning" 
          sx={{ mt: 2 }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={() => navigate('/orders')}
              startIcon={<BackIcon />}
            >
              Back to Orders
            </Button>
          }
        >
          Order not found.
        </Alert>
      </Box>
    );
  }
  
  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs 
        separator={<NavigateNextIcon fontSize="small" />} 
        aria-label="breadcrumb"
        sx={{ mb: 3 }}
      >
        <Link
          underline="hover"
          color="inherit"
          sx={{ display: 'flex', alignItems: 'center' }}
          href="/"
        >
          <DashboardIcon sx={{ mr: 0.5 }} fontSize="small" />
          Dashboard
        </Link>
        <Link
          underline="hover"
          color="inherit"
          sx={{ display: 'flex', alignItems: 'center' }}
          href="/orders"
        >
          <ListIcon sx={{ mr: 0.5 }} fontSize="small" />
          Orders
        </Link>
        <Typography 
          color="text.primary"
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          {order.order_number || order.order_name}
        </Typography>
      </Breadcrumbs>
      
      {/* Order Header */}
      <OrderHeader 
        order={order}
        customer={customer}
        onStatusUpdate={() => setStatusDialog(true)}
        onEdit={() => setEditDialog(true)}
        onAddTask={() => setTaskDialog(true)}
      />
      
      {/* Order Progress */}
      <OrderProgress
        order={order}
        progress={calculateProgress()}
        currentStatus={findStatusById(order.current_status)}
        currentStage={findStageForStatus(order.current_status)}
        lastActivity={getMostRecentEvent()?.created_at}
        onCompleteStep={() => {
          const nextStatus = workflowStatuses.find(
            (s, index) => workflowStatuses[index - 1]?.id === order.current_status
          );
          if (nextStatus) {
            setNewStatus(nextStatus.id);
            setStatusDialog(true);
          }
        }}
        onAddNote={() => setTaskDialog(true)}
        formatDate={formatDate}
      />
      
      {/* Customer and details section */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card variant="outlined">
            <CardHeader 
              title="Customer" 
              avatar={<BusinessIcon color="primary" />}
              action={
                customer && (
                  <IconButton 
                    size="small"
                    onClick={() => navigate(`/customers/${customer.customer_id}`)}
                  >
                    <InfoIcon fontSize="small" />
                  </IconButton>
                )
              }
            />
            <Divider />
            <CardContent>
              {customer ? (
                <Box>
                  <Typography variant="h6">
                    {customer.name || 'N/A'}
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <List dense disablePadding>
                      <ListItem disableGutters>
                        <ListItemText 
                          primary="Email" 
                          secondary={customer.email || 'N/A'} 
                        />
                      </ListItem>
                      <ListItem disableGutters>
                        <ListItemText 
                          primary="Phone" 
                          secondary={customer.phone || 'N/A'} 
                        />
                      </ListItem>
                    </List>
                  </Box>
                </Box>
              ) : (
                <Typography color="text.secondary">
                  Customer information not available.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Card variant="outlined">
            <CardHeader 
              title="Order Details" 
              avatar={<InfoIcon color="primary" />}
            />
            <Divider />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <List dense disablePadding>
                    <ListItem disableGutters>
                      <ListItemText 
                        primary="Project Location" 
                        secondary={[
                          order.project_address,
                          order.project_city,
                          order.project_state,
                          order.project_zip
                        ].filter(Boolean).join(', ') || 'N/A'} 
                      />
                    </ListItem>
                    <ListItem disableGutters>
                      <ListItemText 
                        primary="Created" 
                        secondary={formatDate(order.created_at)} 
                      />
                    </ListItem>
                  </List>
                </Grid>
                <Grid item xs={12} md={6}>
                  <List dense disablePadding>
                    <ListItem disableGutters>
                      <ListItemText 
                        primary="Order Type" 
                        secondary={order.workflow_type || 'N/A'} 
                      />
                    </ListItem>
                    <ListItem disableGutters>
                      <ListItemText 
                        primary="Last Updated" 
                        secondary={formatDate(order.updated_at)} 
                      />
                    </ListItem>
                  </List>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Tabs Section */}
      <OrderTabs 
        tabValue={tabValue}
        handleTabChange={handleTabChange}
        order={order}
        tasks={tasks}
        quotes={quotes}
        purchaseOrders={purchaseOrders}
        invoices={invoices}
        teamMembers={teamMembers}
        events={events}
        orderId={id}
        navigate={navigate}
        onAddTask={() => setTaskDialog(true)}
        onAddNote={() => setTaskDialog(true)}
      />
      
      {/* Dialogs */}
      <StatusDialog 
        open={statusDialog}
        onClose={() => setStatusDialog(false)}
        statuses={orderStatuses}
        currentStatus={newStatus}
        onStatusChange={(e) => setNewStatus(e.target.value)}
        onUpdate={handleStatusUpdate}
        loading={updateLoading}
        orderStatus={order.status}
      />
      
      <TaskDialog 
        open={taskDialog}
        onClose={() => setTaskDialog(false)}
        formData={taskFormData}
        onChange={(field, value) => 
          setTaskFormData({...taskFormData, [field]: value})
        }
        onCreate={handleCreateTask}
        loading={updateLoading}
      />
      
      <OrderDialog
        open={editDialog}
        onClose={() => setEditDialog(false)}
        onOrderCreated={handleOrderUpdated}
        order={order}
        mode="edit"
      />
    </Container>
  );
};

export default OrderDetail;