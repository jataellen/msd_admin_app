// src/pages/OrderTrackingPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate} from 'react-router-dom';
import axios from 'axios';

// Material UI imports
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';

// Material UI icons
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon,
  Assignment as AssignmentIcon,
  Check as CheckIcon,
  Add as AddIcon,
  Edit as EditIcon
} from '@mui/icons-material';

// API URL
// const API_URL = process.env.REACT_APP_API_URL || 'https://msdadminapp-production.up.railway.app';
const API_URL = 'http://localhost:8000';
// Workflow stages for different order types
const WORKFLOW_STAGES = {
  "MATERIALS_ONLY": [
    "Quote Requested",
    "Quote Provided",
    "Quote Accepted",
    "Purchase Order Created",
    "Supplier Confirmed",
    "Materials Received",
    "Customer Notified",
    "Materials Delivered/Picked Up",
    "Invoice Sent",
    "Payment Received",
    "Order Completed",
  ],
  "MATERIALS_AND_INSTALLATION": [
    "Initial Inquiry",
    "Site Visit Scheduled",
    "Site Visit Completed",
    "Quote Created",
    "Quote Sent",
    "Quote Accepted",
    "Work Order Created",
    "Work Order Signed",
    "Deposit Received",
    "Detailed Measurement",
    "Purchase Orders Created",
    "Materials Ordered",
    "Installation Scheduled",
    "Materials Received",
    "Installation Begun",
    "Installation Completed",
    "Final Invoice Sent",
    "Payment Received",
    "Review Requested",
    "Order Completed",
  ],
};

const OrderTrackingPage = () => {
  const navigate = useNavigate();
  
  // State variables
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [stageUpdateDialog, setStageUpdateDialog] = useState(false);
  const [newStageData, setNewStageData] = useState({
    stage: '',
    notes: ''
  });
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
  
  // Fetch orders
  useEffect(() => {
    fetchOrders();
  }, []);
  
  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_URL}/orders`, {
        withCredentials: true
      });
      
      if (response.data && Array.isArray(response.data)) {
        setOrders(response.data);
      } else if (response.data && response.data.orders) {
        setOrders(response.data.orders);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Filter orders based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredOrders(orders);
      return;
    }
    
    const lowercasedSearch = searchTerm.toLowerCase();
    const filtered = orders.filter(order => 
      (order.order_name && order.order_name.toLowerCase().includes(lowercasedSearch)) ||
      (order.customer_id && order.customer_id.toString().includes(lowercasedSearch)) ||
      (order.status && order.status.toLowerCase().includes(lowercasedSearch)) ||
      (order.current_stage && order.current_stage.toLowerCase().includes(lowercasedSearch)) ||
      (order.location && order.location.toLowerCase().includes(lowercasedSearch))
    );
    
    setFilteredOrders(filtered);
  }, [searchTerm, orders]);
  
  // Handle order selection
  const handleSelectOrder = (order) => {
    setSelectedOrder(order);
    
    // If no current_stage is set, fetch order details to get full data
    if (!order.current_stage || !order.completed_stages) {
      fetchOrderDetails(order.order_id);
    }
  };
  
  // Handle stage update dialog
  const handleOpenStageDialog = (stage) => {
    setNewStageData({
      stage,
      notes: ''
    });
    setStageUpdateDialog(true);
  };
  
  // Handle stage update
  const handleUpdateStage = async () => {
    if (!selectedOrder || !newStageData.stage) {
      setStageUpdateDialog(false);
      return;
    }
    
    setUpdateLoading(true);
    
    try {
      const response = await axios.post(
        `${API_URL}/orders/${selectedOrder.order_id}/update-stage`,
        newStageData,
        { withCredentials: true }
      );
      
      if (response.data) {
        // Update the order in state
        const updatedOrder = response.data;
        setOrders(orders.map(o => o.order_id === updatedOrder.order_id ? updatedOrder : o));
        setSelectedOrder(updatedOrder);
      }
      
      setStageUpdateDialog(false);
    } catch (err) {
      console.error('Error updating stage:', err);
      setError('Failed to update stage. Please try again.');
    } finally {
      setUpdateLoading(false);
    }
  };
  
  // Handle new task creation
  const handleCreateTask = async () => {
    if (!taskFormData.title || !selectedOrder) {
      setTaskDialog(false);
      return;
    }
    
    setUpdateLoading(true);
    
    try {
    //   const response = await axios.post(
    //     `${API_URL}/tasks`,
    //     {
    //       ...taskFormData,
    //       order_id: selectedOrder.order_id,
    //       created_by: 1  // In real app, this would be the current user's ID
    //     },
    //     { withCredentials: true }
    //   );
      
      // Close dialog and reset form
      setTaskDialog(false);
      setTaskFormData({
        title: '',
        status: 'Open',
        priority: 'Medium',
        assigned_to: '',
        description: '',
        due_date: ''
      });
      
      // Fetch updated order data
      fetchOrderDetails(selectedOrder.order_id);
    } catch (err) {
      console.error('Error creating task:', err);
      setError('Failed to create task. Please try again.');
    } finally {
      setUpdateLoading(false);
    }
  };
  
  // Fetch detailed order data
  const fetchOrderDetails = async (orderId) => {
    setLoading(true);
    
    try {
      const response = await axios.get(`${API_URL}/orders/${orderId}`, {
        withCredentials: true
      });
      
      if (response.data) {
        // Update the order in both lists
        const updatedOrder = response.data.order || response.data;
        setOrders(orders.map(o => o.order_id === updatedOrder.order_id ? updatedOrder : o));
        setSelectedOrder(updatedOrder);
      }
    } catch (err) {
      console.error('Error fetching order details:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return 'N/A';
    return `$${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  
  // Get status color
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
  
  // Get priority color
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
  
  // Get workflow stages based on order type
  const getWorkflowStages = (order) => {
    if (!order) return [];
    
    const orderType = order.type || 'MATERIALS_ONLY';
    return WORKFLOW_STAGES[orderType] || WORKFLOW_STAGES['MATERIALS_ONLY'];
  };
  
  // Determine current stage index
  const getCurrentStageIndex = (order) => {
    if (!order || !order.current_stage) return 0;
    
    const stages = getWorkflowStages(order);
    const index = stages.indexOf(order.current_stage);
    return index >= 0 ? index : 0;
  };
  
  // Check if a stage is completed
  const isStageCompleted = (order, stage) => {
    if (!order || !order.completed_stages) return false;
    
    return order.completed_stages.some(s => s.stage === stage);
  };
  
  // Get stage completion info
  const getStageCompletionInfo = (order, stage) => {
    if (!order || !order.completed_stages) return null;
    
    return order.completed_stages.find(s => s.stage === stage);
  };
  
  if (loading && orders.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box sx={{ maxWidth: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Order Tracking
        </Typography>
        
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />}
            onClick={fetchOrders}
            disabled={loading}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
          
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={() => navigate('/orders/add')}
          >
            New Order
          </Button>
        </Box>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        {/* Order List Section */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                placeholder="Search orders"
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
                      >
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Box>
            
            <Typography variant="h6" gutterBottom>
              Orders
            </Typography>
            
            <Divider sx={{ mb: 2 }} />
            
            {loading && !selectedOrder ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : filteredOrders.length === 0 ? (
              <Typography color="text.secondary" align="center" sx={{ p: 3 }}>
                No orders found.
              </Typography>
            ) : (
              <List sx={{ maxHeight: 'calc(100vh - 280px)', overflow: 'auto' }}>
                {filteredOrders.map((order) => (
                  <ListItem 
                    key={order.order_id}
                    button
                    selected={selectedOrder && selectedOrder.order_id === order.order_id}
                    onClick={() => handleSelectOrder(order)}
                    alignItems="flex-start"
                    sx={{ 
                      mb: 1, 
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: (selectedOrder && selectedOrder.order_id === order.order_id) 
                        ? 'action.selected' 
                        : 'background.paper'
                    }}
                  >
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1">
                          {order.order_name}
                        </Typography>
                      }
                      secondary={
                        <React.Fragment>
                          <Typography variant="body2" color="text.secondary">
                            Order #{order.order_id} • {order.type || 'Materials Only'}
                          </Typography>
                          <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                            <Chip 
                              size="small" 
                              label={order.status} 
                              color={getStatusColor(order.status)}
                            />
                            {order.current_stage && (
                              <Chip 
                                size="small"
                                label={order.current_stage}
                                variant="outlined"
                              />
                            )}
                          </Box>
                        </React.Fragment>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
        
        {/* Order Details and Tracking Section */}
        <Grid item xs={12} md={8}>
          {selectedOrder ? (
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                <Box>
                  <Typography variant="h5" gutterBottom>
                    {selectedOrder.order_name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Chip 
                      label={selectedOrder.status} 
                      color={getStatusColor(selectedOrder.status)}
                    />
                    {selectedOrder.priority && (
                      <Chip 
                        label={selectedOrder.priority} 
                        color={getPriorityColor(selectedOrder.priority)}
                        variant="outlined"
                      />
                    )}
                    {selectedOrder.type && (
                      <Chip 
                        label={selectedOrder.type.replace('_', ' & ')} 
                        variant="outlined"
                      />
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Created: {formatDate(selectedOrder.created_at)} • Last Updated: {formatDate(selectedOrder.updated_at)}
                  </Typography>
                </Box>
                
                <Box>
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => navigate(`/orders/${selectedOrder.order_id}/edit`)}
                    sx={{ mr: 1 }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<AssignmentIcon />}
                    onClick={() => setTaskDialog(true)}
                  >
                    Add Task
                  </Button>
                </Box>
              </Box>
              
              {/* Order Summary Cards */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary">
                        Customer
                      </Typography>
                      <Typography variant="body1">
                        ID: {selectedOrder.customer_id || 'N/A'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary">
                        Budget
                      </Typography>
                      <Typography variant="body1">
                        {formatCurrency(selectedOrder.budget)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary">
                        Start Date
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(selectedOrder.start_date)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary">
                        Target Completion
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(selectedOrder.target_completion_date)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              
              {/* Workflow Tracking */}
              <Typography variant="h6" gutterBottom>
                Workflow Progress
              </Typography>
              
              <Divider sx={{ mb: 3 }} />
              
              <Stepper activeStep={getCurrentStageIndex(selectedOrder)} orientation="vertical">
                {getWorkflowStages(selectedOrder).map((stage, index) => (
                  <Step key={stage} completed={isStageCompleted(selectedOrder, stage)}>
                    <StepLabel>
                      <Typography variant="subtitle1">
                        {stage}
                      </Typography>
                    </StepLabel>
                    <StepContent>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          {isStageCompleted(selectedOrder, stage) ? (
                            <>
                              Completed on {formatDate(getStageCompletionInfo(selectedOrder, stage)?.completed_at)}
                              {getStageCompletionInfo(selectedOrder, stage)?.notes && (
                                <Box sx={{ mt: 1 }}>
                                  <Typography variant="body2">
                                    Notes: {getStageCompletionInfo(selectedOrder, stage).notes}
                                  </Typography>
                                </Box>
                              )}
                            </>
                          ) : (
                            selectedOrder.current_stage === stage ? 
                              "Current stage - in progress" : 
                              "Not started yet"
                          )}
                        </Typography>
                      </Box>
                      
                      {(selectedOrder.current_stage === stage && !isStageCompleted(selectedOrder, stage)) && (
                        <Box sx={{ mb: 2 }}>
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleOpenStageDialog(stage)}
                            startIcon={<CheckIcon />}
                          >
                            Complete Stage
                          </Button>
                        </Box>
                      )}
                    </StepContent>
                  </Step>
                ))}
              </Stepper>
              
              {/* Additional Details */}
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Additional Details
                </Typography>
                
                <Divider sx={{ mb: 2 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Location
                        </Typography>
                        <Typography variant="body1">
                          {selectedOrder.location || 'N/A'}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Contract Details
                        </Typography>
                        <Typography variant="body1">
                          {selectedOrder.contract_number ? (
                            <>Contract #: {selectedOrder.contract_number}</>
                          ) : (
                            'No contract information'
                          )}
                        </Typography>
                        {selectedOrder.contract_signed_date && (
                          <Typography variant="body2">
                            Signed on: {formatDate(selectedOrder.contract_signed_date)}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  {selectedOrder.notes && (
                    <Grid item xs={12}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Notes
                          </Typography>
                          <Typography variant="body1">
                            {selectedOrder.notes}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}
                </Grid>
              </Box>
            </Paper>
          ) : (
            <Paper sx={{ p: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <AssignmentIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Select an order to view details
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center">
                Choose an order from the list on the left to view tracking information, or create a new order.
              </Typography>
                              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/orders/add')}
                sx={{ mt: 3 }}
              >
                Create New Order
              </Button>
            </Paper>
          )}
        </Grid>
      </Grid>
      
      {/* Stage Update Dialog */}
      <Dialog
        open={stageUpdateDialog}
        onClose={() => setStageUpdateDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Complete Stage: {newStageData.stage}</DialogTitle>
        <DialogContent>
          <Box sx={{ p: 1 }}>
            <Typography variant="body1" gutterBottom>
              Mark this stage as completed and advance to the next step in the workflow.
            </Typography>
            
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Notes"
              value={newStageData.notes}
              onChange={(e) => setNewStageData({...newStageData, notes: e.target.value})}
              placeholder="Add any relevant notes about this stage"
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStageUpdateDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleUpdateStage}
            disabled={updateLoading}
          >
            {updateLoading ? <CircularProgress size={24} /> : 'Complete & Advance'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Task Dialog */}
      <Dialog
        open={taskDialog}
        onClose={() => setTaskDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Add Task for Order: {selectedOrder?.order_name}</DialogTitle>
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
                <InputLabel>Status</InputLabel>
                <Select
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
                <InputLabel>Priority</InputLabel>
                <Select
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

export default OrderTrackingPage;