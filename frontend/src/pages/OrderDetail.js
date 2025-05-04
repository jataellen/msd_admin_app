// src/pages/OrderDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

// Material UI imports
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  IconButton,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';

// Material UI icons
import {
  Edit as EditIcon,
  Add as AddIcon,
  Assignment as AssignmentIcon,
  Description as DescriptionIcon,
  ShoppingCart as ShoppingCartIcon,
  Receipt as ReceiptIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  Schedule as ScheduleIcon,
  Timeline as TimelineIcon,
  Info as InfoIcon,
  Sync as SyncIcon  // Add this line
} from '@mui/icons-material';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Tab panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`order-tabpanel-${index}`}
      aria-labelledby={`order-tab-${index}`}
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

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
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
        const statusesResponse = await axios.get(`${API_URL}/order-statuses`, {
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
  
  // Handle status update
  const handleStatusUpdate = async () => {
    if (!order || newStatus === order.status) {
      setStatusDialog(false);
      return;
    }
    
    setUpdateLoading(true);
    
    try {
    //   const response = await axios.put(
    //     `${API_URL}/orders/${id}`,
    //     { status: newStatus },
    //     { withCredentials: true }
    //   );
      
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
  
  // Format currency
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return 'N/A';
    return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };
  
  // Get status chip color
  const getStatusColor = (status) => {
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
  
  // Get priority chip color
  const getPriorityColor = (priority) => {
    if (!priority) return 'default';
    
    switch (priority) {
      case 'Critical':
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
          <Button 
            color="inherit" 
            size="small" 
            onClick={() => navigate('/orders')}
          >
            Back to Orders
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }
  
  if (!order) {
    return (
      <Alert 
        severity="warning" 
        sx={{ mt: 2 }}
        action={
          <Button 
            color="inherit" 
            size="small" 
            onClick={() => navigate('/orders')}
          >
            Back to Orders
          </Button>
        }
      >
        Order not found.
      </Alert>
    );
  }
  
  return (
    <Box sx={{ maxWidth: '100%' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            {order.order_name}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Chip 
              label={order.status} 
              color={getStatusColor(order.status)}
              sx={{ mr: 1 }}
            />
            
            {order.priority && (
              <Chip 
                label={order.priority} 
                color={getPriorityColor(order.priority)}
                variant="outlined"
                sx={{ mr: 1 }}
              />
            )}
            
            <Button 
              size="small" 
              startIcon={<EditIcon />}
              onClick={() => setStatusDialog(true)}
            >
              Change Status
            </Button>
          </Box>
          <Typography variant="subtitle1" color="textSecondary">
            Order #{order.order_id} | Created: {formatDate(order.created_at)}
          </Typography>
        </Box>
        
        <Box>
          <Button 
            variant="outlined" 
            color="primary"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/orders/${id}/edit`)}
            sx={{ mr: 1 }}
          >
            Edit
          </Button>
          
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => setTaskDialog(true)}
            startIcon={<AddIcon />}
          >
            Add Task
          </Button>
        </Box>
      </Box>
      
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <BusinessIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" component="h2">
                  Budget
                </Typography>
              </Box>
              <Typography variant="h5" color="primary">
                {formatCurrency(order.budget)}
              </Typography>
              {order.budget_spent && (
                <Box sx={{ mt: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="textSecondary">
                      Spent:
                    </Typography>
                    <Typography variant="body2">
                      {formatCurrency(order.budget_spent)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="textSecondary">
                      Remaining:
                    </Typography>
                    <Typography variant="body2">
                      {formatCurrency(order.budget_remaining)}
                    </Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ScheduleIcon color="secondary" sx={{ mr: 1 }} />
                <Typography variant="h6" component="h2">
                  Timeline</Typography>
              </Box>
              <Box sx={{ mt: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="textSecondary">
                    Start Date:
                  </Typography>
                  <Typography variant="body2">
                    {formatDate(order.start_date)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="textSecondary">
                    Target Completion:
                  </Typography>
                  <Typography variant="body2">
                    {formatDate(order.target_completion_date)}
                  </Typography>
                </Box>
                {order.actual_completion_date && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="textSecondary">
                      Actual Completion:
                    </Typography>
                    <Typography variant="body2">
                      {formatDate(order.actual_completion_date)}
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TimelineIcon color="info" sx={{ mr: 1 }} />
                <Typography variant="h6" component="h2">
                  Progress
                </Typography>
              </Box>
              <Typography variant="h5" color="info.main">
                {order.progress_percentage !== null && order.progress_percentage !== undefined ? 
                  `${order.progress_percentage}%` : '0%'}
              </Typography>
              <Box sx={{ mt: 2 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={order.progress_percentage || 0} 
                  color="info"
                  sx={{ height: 10, borderRadius: 5 }}
                />
              </Box>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                Last Updated: {formatDate(order.updated_at)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AssignmentIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6" component="h2">
                  Tasks
                </Typography>
              </Box>
              <Typography variant="h5" color="success.main">
                {tasks.length}
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="textSecondary">
                    Open:
                  </Typography>
                  <Typography variant="body2">
                    {tasks.filter(task => task.status === 'Open').length}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="textSecondary">
                    In Progress:
                  </Typography>
                  <Typography variant="body2">
                    {tasks.filter(task => task.status === 'In Progress').length}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="textSecondary">
                    Completed:
                  </Typography>
                  <Typography variant="body2">
                    {tasks.filter(task => task.status === 'Completed').length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Customer and details section */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card variant="outlined">
            <CardHeader 
              title="Customer" 
              avatar={<BusinessIcon color="primary" />}
              action={
                <IconButton 
                  size="small"
                  onClick={() => customer && navigate(`/customers/${customer.customer_id}`)}
                >
                  <InfoIcon fontSize="small" />
                </IconButton>
              }
            />
            <Divider />
            <CardContent>
              {customer ? (
                <Box>
                  <Typography variant="h6">
                    {customer.company_name || 'N/A'}
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <List dense disablePadding>
                      <ListItem disableGutters>
                        <ListItemText 
                          primary="Contact" 
                          secondary={`${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'N/A'} 
                        />
                      </ListItem>
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
                      {customer.payment_terms && (
                        <ListItem disableGutters>
                          <ListItemText 
                            primary="Payment Terms" 
                            secondary={customer.payment_terms} 
                          />
                        </ListItem>
                      )}
                    </List>
                  </Box>
                </Box>
              ) : (
                <Typography color="textSecondary">
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
                        primary="Location" 
                        secondary={order.location || 'N/A'} 
                      />
                    </ListItem>
                    <ListItem disableGutters>
                      <ListItemText 
                        primary="Contract Number" 
                        secondary={order.contract_number || 'N/A'} 
                      />
                    </ListItem>
                    <ListItem disableGutters>
                      <ListItemText 
                        primary="Contract Signed Date" 
                        secondary={formatDate(order.contract_signed_date)} 
                      />
                    </ListItem>
                  </List>
                </Grid>
                <Grid item xs={12} md={6}>
                  <List dense disablePadding>
                    <ListItem disableGutters>
                      <ListItemText 
                        primary="Order Manager" 
                        secondary={order.order_manager_id ? `ID: ${order.order_manager_id}` : 'N/A'} 
                      />
                    </ListItem>
                    <ListItem disableGutters>
                      <ListItemText 
                        primary="Last Status Update" 
                        secondary={formatDate(order.last_status_update)} 
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
              </Grid>
              
              {order.description && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Description
                  </Typography>
                  <Typography variant="body2">
                    {order.description}
                  </Typography>
                </Box>
              )}
              
              {order.notes && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Notes
                  </Typography>
                  <Typography variant="body2">
                    {order.notes}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Tabs section */}
      <Paper sx={{ width: '100%', mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="order tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Tasks" icon={<AssignmentIcon />} iconPosition="start" />
            <Tab label="Quotes" icon={<DescriptionIcon />} iconPosition="start" />
            <Tab label="Purchase Orders" icon={<ShoppingCartIcon />} iconPosition="start" />
            <Tab label="Invoices" icon={<ReceiptIcon />} iconPosition="start" />
            <Tab label="Team" icon={<PeopleIcon />} iconPosition="start" />
          </Tabs>
        </Box>
        
        {/* Tasks Tab */}
        <TabPanel value={tabValue} index={0}>
          {tasks.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Title</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Assigned To</TableCell>
                    <TableCell>Due Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tasks.map((task) => (
                    <TableRow key={task.task_id} hover>
                      <TableCell>{task.task_id}</TableCell>
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
                          size="small" 
                          onClick={() => navigate(`/tasks/${task.task_id}`)}
                          title="View Task"
                        >
                          <InfoIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography color="textSecondary">
                No tasks found for this order.
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />} 
                sx={{ mt: 2 }}
                onClick={() => setTaskDialog(true)}
              >
                Add Task
              </Button>
            </Box>
          )}
        </TabPanel>
        
        {/* Quotes Tab */}
        <TabPanel value={tabValue} index={1}>
          {quotes.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Version</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Issue Date</TableCell>
                    <TableCell>Valid Until</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {quotes.map((quote) => (
                    <TableRow key={quote.quote_id} hover>
                      <TableCell>{quote.quote_id}</TableCell>
                      <TableCell>v{quote.version}</TableCell>
                      <TableCell>
                        <Chip 
                          label={quote.status} 
                          color={quote.status === 'Accepted' ? 'success' : 
                                quote.status === 'Sent' ? 'info' : 
                                quote.status === 'Rejected' ? 'error' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatDate(quote.issue_date)}</TableCell>
                      <TableCell>{formatDate(quote.valid_until)}</TableCell>
                      <TableCell>{formatCurrency(quote.total_amount)}</TableCell>
                      <TableCell>
                        <IconButton 
                          size="small" 
                          onClick={() => navigate(`/quotes/${quote.quote_id}`)}
                          title="View Quote"
                        >
                          <InfoIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography color="textSecondary">
                No quotes found for this order.
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />} 
                sx={{ mt: 2 }}
                onClick={() => navigate(`/quotes/add?order_id=${id}`)}
              >
                Create Quote
              </Button>
            </Box>
          )}
        </TabPanel>
        
        {/* Purchase Orders Tab */}
        <TabPanel value={tabValue} index={2}>
          {purchaseOrders.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>PO Number</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Supplier</TableCell>
                    <TableCell>Issue Date</TableCell>
                    <TableCell>Expected Delivery</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {purchaseOrders.map((po) => (
                    <TableRow key={po.po_id} hover>
                      <TableCell>{po.po_id}</TableCell>
                      <TableCell>{po.po_number || `PO-${po.po_id}`}</TableCell>
                      <TableCell>
                        <Chip 
                          label={po.status} 
                          color={po.status === 'Delivered' ? 'success' : 
                                po.status === 'Ordered' ? 'info' : 
                                po.status === 'Cancelled' ? 'error' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{po.supplier_id}</TableCell>
                      <TableCell>{formatDate(po.issue_date)}</TableCell>
                      <TableCell>{formatDate(po.expected_delivery_date)}</TableCell>
                      <TableCell>{formatCurrency(po.total_amount)}</TableCell>
                      <TableCell>
                        <IconButton 
                          size="small" 
                          onClick={() => navigate(`/purchase-orders/${po.po_id}`)}
                          title="View Purchase Order"
                        >
                          <InfoIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography color="textSecondary">
                No purchase orders found for this order.
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />} 
                sx={{ mt: 2 }}
                onClick={() => navigate(`/purchase-orders/add?order_id=${id}`)}
              >
                Create Purchase Order
              </Button>
            </Box>
          )}
        </TabPanel>
        
        {/* Invoices Tab */}
        <TabPanel value={tabValue} index={3}>
          {invoices.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Invoice #</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date Issued</TableCell>
                    <TableCell>Due Date</TableCell>
                    <TableCell>Total Amount</TableCell>
                    <TableCell>Balance Due</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.invoice_id} hover>
                      <TableCell>{invoice.invoice_id}</TableCell>
                      <TableCell>{invoice.invoice_number || `INV-${invoice.invoice_id}`}</TableCell>
                      <TableCell>
                        <Chip 
                          label={invoice.status} 
                          color={invoice.status === 'Paid' ? 'success' : 
                                invoice.status === 'Open' ? 'warning' : 
                                invoice.status === 'Overdue' ? 'error' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatDate(invoice.date_issued)}</TableCell>
                      <TableCell>{formatDate(invoice.due_date)}</TableCell>
                      <TableCell>{formatCurrency(invoice.total_amount)}</TableCell>
                      <TableCell>{formatCurrency(invoice.balance_due)}</TableCell>
                      <TableCell>
                        <IconButton 
                          size="small" 
                          onClick={() => navigate(`/invoices/${invoice.invoice_id}`)}
                          title="View Invoice"
                        >
                          <InfoIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography color="textSecondary">
                No invoices found for this order.
              </Typography>
              {order.status === 'Completed' && (
                <Button 
                  variant="contained" 
                  startIcon={<AddIcon />} 
                  sx={{ mt: 2 }}
                  onClick={() => navigate(`/invoices/add?order_id=${id}`)}
                >
                  Create Invoice
                </Button>
              )}
              <Button 
                variant="outlined" 
                startIcon={<SyncIcon />} 
                sx={{ mt: 2, ml: order.status === 'Completed' ? 1 : 0 }}
                onClick={() => navigate(`/quickbooks/push/invoice/${id}`)}
              >
                Generate QuickBooks Invoice
              </Button>
            </Box>
          )}
        </TabPanel>
        
        {/* Team Tab */}
        <TabPanel value={tabValue} index={4}>
          {teamMembers.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {teamMembers.map((member) => (
                    <TableRow key={member.id} hover>
                      <TableCell>{member.employee_id}</TableCell>
                      <TableCell>{`${member.first_name || ''} ${member.last_name || ''}`.trim() || 'N/A'}</TableCell>
                      <TableCell>{member.role || 'N/A'}</TableCell>
                      <TableCell>{member.email || 'N/A'}</TableCell>
                      <TableCell>{member.phone || 'N/A'}</TableCell>
                      <TableCell>
                        <IconButton 
                          size="small" 
                          onClick={() => navigate(`/employees/${member.employee_id}`)}
                          title="View Employee"
                        >
                          <InfoIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography color="textSecondary">
                No team members assigned to this order.
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />} 
                sx={{ mt: 2 }}
                onClick={() => navigate(`/orders/${id}/team/add`)}
              >
                Add Team Member
              </Button>
            </Box>
          )}
        </TabPanel>
      </Paper>
      
      {/* Change Status Dialog */}
      <Dialog open={statusDialog} onClose={() => setStatusDialog(false)}>
        <DialogTitle>Update Order Status</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel id="status-select-label">Status</InputLabel>
            <Select
              labelId="status-select-label"
              id="status-select"
              value={newStatus}
              label="Status"
              onChange={(e) => setNewStatus(e.target.value)}
            >
              {orderStatuses.map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleStatusUpdate}
            color="primary" 
            variant="contained"
            disabled={updateLoading || newStatus === order.status}
          >
            {updateLoading ? <CircularProgress size={24} /> : 'Update Status'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Create Task Dialog */}
      <Dialog open={taskDialog} onClose={() => setTaskDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add Task to Order</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Task Title"
                fullWidth
                required
                value={taskFormData.title}
                onChange={(e) => setTaskFormData({...taskFormData, title: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="task-status-label">Status</InputLabel>
                <Select
                  labelId="task-status-label"
                  id="task-status"
                  value={taskFormData.status}
                  label="Status"
                  onChange={(e) => setTaskFormData({...taskFormData, status: e.target.value})}
                >
                  <MenuItem value="Open">Open</MenuItem>
                  <MenuItem value="In Progress">In Progress</MenuItem>
                  <MenuItem value="Blocked">Blocked</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="task-priority-label">Priority</InputLabel>
                <Select
                  labelId="task-priority-label"
                  id="task-priority"
                  value={taskFormData.priority}
                  label="Priority"
                  onChange={(e) => setTaskFormData({...taskFormData, priority: e.target.value})}
                >
                  <MenuItem value="Low">Low</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="High">High</MenuItem>
                  <MenuItem value="Urgent">Urgent</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Assigned To"
                fullWidth
                value={taskFormData.assigned_to}
                onChange={(e) => setTaskFormData({...taskFormData, assigned_to: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Due Date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={taskFormData.due_date}
                onChange={(e) => setTaskFormData({...taskFormData, due_date: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={4}
                value={taskFormData.description}
                onChange={(e) => setTaskFormData({...taskFormData, description: e.target.value})}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTaskDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateTask}
            color="primary" 
            variant="contained"
            disabled={updateLoading || !taskFormData.title}
          >
            {updateLoading ? <CircularProgress size={24} /> : 'Create Task'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrderDetail;