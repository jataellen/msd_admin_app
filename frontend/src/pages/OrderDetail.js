// src/pages/OrderDetail/index.js - Main component file
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
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  NavigateNext as NavigateNextIcon,
  Dashboard as DashboardIcon,
  FormatListBulleted as ListIcon,
  NavigateBefore as BackIcon
} from '@mui/icons-material';

// Import Page Components
import OrderHeader from '../components/OrderHeader';
import OrderTabs from '../components/OrderTabs';
import StatusDialog from '../components/StatusDialog';
import TaskDialog from '../components/TaskDialog';

// API URL - Should be in env file in a real app
const API_URL = 'http://localhost:8000';

const OrderDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
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
    const [tabValue, setTabValue] = useState(0);
    const [statusDialog, setStatusDialog] = useState(false);
    const [newStatus, setNewStatus] = useState('');
    const [orderStatuses, setOrderStatuses] = useState([]);
    const [updateLoading, setUpdateLoading] = useState(false);
    const [taskDialog, setTaskDialog] = useState(false);
    const [taskFormData, setTaskFormData] = useState({
      title: '',
      status: 'Open',
      priority: 'Medium',
      assigned_to: '',
      description: '',
      due_date: ''
    });
    
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
        } catch (err) {
          console.error('Error fetching order details:', err);
          setError('Failed to load order details. Please try again.');
        } finally {
          setLoading(false);
        }
      };
      
      fetchData();
    }, [id]);
    
    // Handle tab change
    const handleTabChange = (event, newValue) => {
      setTabValue(newValue);
    };
    
    // Set initial tab based on location state if provided
    useEffect(() => {
      if (location.state && location.state.activeTab !== undefined) {
        setTabValue(location.state.activeTab);
      }
    }, [location.state]);
    
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
        // Show validation error
        return;
      }
      
      setUpdateLoading(true);
      
      try {
        const response = await axios.post(
          `${API_URL}/tasks`,
          {
            ...taskFormData,
            order_id: parseInt(id),
            created_by: 1 // In real app, this would be the current user's ID
          },
          { withCredentials: true }
        );
        
        // Add new task to the list
        setTasks([response.data.task, ...tasks]);
        
        // Reset form and close dialog
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
        {/* Breadcrumbs navigation */}
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
            {order.order_name}
          </Typography>
        </Breadcrumbs>
        
        {/* Header */}
        <OrderHeader 
          order={order}
          isMobile={isMobile}
          onStatusChange={() => setStatusDialog(true)}
          onEdit={() => navigate(`/orders/${id}/edit`)}
          onAddTask={() => setTaskDialog(true)}
        />
        
        {/* Tabs section */}
        <OrderTabs 
          tabValue={tabValue}
          handleTabChange={handleTabChange}
          order={order}
          tasks={tasks}
          quotes={quotes}
          purchaseOrders={purchaseOrders}
          invoices={invoices}
          teamMembers={teamMembers}
          orderId={id}
          navigate={navigate}
          onAddTask={() => setTaskDialog(true)}
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
      </Container>
    );
  };
  
  export default OrderDetail;