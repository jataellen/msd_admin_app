// OrderForm.js - React component for creating/editing orders (Updated for current_stage)

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Box, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Checkbox, 
  FormGroup, 
  FormControlLabel, 
  Button, 
  Typography, 
  Paper, 
  Divider,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  IconButton,
  InputAdornment,
  Tooltip,
  Stack,
  Avatar,
  Chip,
  alpha,
  useTheme,
  Stepper,
  Step,
  StepLabel,
  Container
} from '@mui/material';
import { 
  Add as AddIcon, 
  Refresh as RefreshIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Description as DescriptionIcon,
  LocationOn as LocationIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
  Assignment as AssignmentIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Home as HomeIcon,
  Engineering as EngineeringIcon,
  LocalShipping as ShippingIcon,
  Build as BuildIcon,
  Inventory as InventoryIcon,
  PriorityHigh as PriorityIcon,
  Notes as NotesIcon
} from '@mui/icons-material';
import CustomerDialog from '../components/CustomerDialog';

const API_URL =  'http://localhost:8000';

const OrderForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isEditMode = Boolean(id);
  
  // Form state
  const [formData, setFormData] = useState({
    order_name: '',
    customer_id: '',
    workflow_type: 'MATERIALS_ONLY',
    type: 'MATERIALS_ONLY',
    description: '',
    location: '',
    priority: 'Medium',
    budget: '',
    start_date: '',
    target_completion_date: '',
    contract_number: '',
    notes: '',
    selected_stages: [],
    current_stage: ''
  });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [stagesLoading, setStagesLoading] = useState(true);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [workflowStages, setWorkflowStages] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  
  // Fetch necessary data on component mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch priorities
        const prioritiesResponse = await axios.get(`${API_URL}/orders/order-priorities`, {
          withCredentials: true
        });
        
        if (prioritiesResponse.data && prioritiesResponse.data.priorities) {
          setPriorities(prioritiesResponse.data.priorities);
        }
        
        // Fetch customers from API
        await fetchCustomers();
        
        // If in edit mode, fetch order data
        if (isEditMode) {
          const orderResponse = await axios.get(`${API_URL}/orders/${id}`, {
            withCredentials: true
          });
          
          if (orderResponse.data && orderResponse.data.order) {
            const order = orderResponse.data.order;
            setFormData({
              order_name: order.order_name || '',
              customer_id: order.customer_id || '',
              workflow_type: order.type || 'MATERIALS_ONLY',
              type: order.type || 'MATERIALS_ONLY',
              description: order.description || '',
              location: order.location || '',
              priority: order.priority || 'Medium',
              budget: order.budget || '',
              start_date: order.start_date || '',
              target_completion_date: order.target_completion_date || '',
              contract_number: order.contract_number || '',
              notes: order.notes || '',
              current_stage: order.current_stage || '',
              selected_stages: order.selected_stages || []
            });
            
            // Fetch workflow stages based on order type
            await fetchWorkflowStages(order.type || 'MATERIALS_ONLY');
          }
        } else {
          // For new orders, fetch default workflow stages
          await fetchWorkflowStages('MATERIALS_ONLY');
        }
      } catch (err) {
        console.error('Error fetching initial data:', err);
        setError('Failed to load form data. Please try again.');
      }
    };
    
    fetchInitialData();
  }, [id, isEditMode]);
  
  // Fetch customers from API
  const fetchCustomers = async () => {
    setCustomersLoading(true);
    try {
      const response = await axios.get(`${API_URL}/customers`, {
        withCredentials: true
      });
      
      if (response.data) {
        setCustomers(response.data);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
      // Don't show error for customers, just log it
    } finally {
      setCustomersLoading(false);
    }
  };

  // Handle customer creation
  const handleCustomerCreated = (newCustomer) => {
    // Add new customer to the list
    setCustomers(prev => [...prev, newCustomer]);
    
    // Select the new customer
    setFormData(prev => ({
      ...prev,
      customer_id: newCustomer.customer_id
    }));
    
    // Show success message
    setSuccess(`Customer "${newCustomer.name}" created successfully`);
    
    // Clear success message after 3 seconds
    setTimeout(() => setSuccess(null), 3000);
  };

  // Fetch workflow stages when workflow type changes
  const fetchWorkflowStages = async (type) => {
    setStagesLoading(true);
    try {
      const response = await axios.get(
        `${API_URL}/orders/workflow-stages/${type}`,
        { withCredentials: true }
      );
      
      if (response.data && response.data.stages) {
        setWorkflowStages(response.data.stages);
        
        // If not in edit mode, set default current_stage to first stage
        if (!isEditMode && response.data.stages.length > 0) {
          setFormData(prev => ({
            ...prev,
            current_stage: response.data.stages[0]
          }));
        }
      }
    } catch (err) {
      console.error('Error fetching workflow stages:', err);
      setError('Failed to load workflow stages. Please try again.');
    } finally {
      setStagesLoading(false);
    }
  };
  
  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle workflow type change
  const handleWorkflowTypeChange = async (e) => {
    const { value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      workflow_type: value,
      type: value
    }));
    
    // Fetch new workflow stages
    await fetchWorkflowStages(value);
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.order_name || !formData.customer_id || !formData.current_stage) {
      setError('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      let response;
      
      const submitData = {
        ...formData,
        customer_id: parseInt(formData.customer_id),
        budget: formData.budget ? parseFloat(formData.budget) : null
      };
      
      if (isEditMode) {
        // Update existing order
        response = await axios.put(
          `${API_URL}/orders/${id}`,
          submitData,
          { withCredentials: true }
        );
        
        setSuccess('Order updated successfully');
      } else {
        // Create new order
        response = await axios.post(
          `${API_URL}/orders`,
          submitData,
          { withCredentials: true }
        );
        
        setSuccess('Order created successfully');
      }
      
      // Navigate to order detail after a short delay
      if (response.data) {
        setTimeout(() => {
          navigate(`/orders/${response.data.order_id || response.data.id || id}`);
        }, 1500);
      }
    } catch (err) {
      console.error('Error saving order:', err);
      setError(err.response?.data?.detail || 'Failed to save order. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box sx={{ 
      backgroundColor: theme.palette.grey[50],
      minHeight: '100vh',
      pb: 4
    }}>
      {/* Header */}
      <Box sx={{ 
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
        color: 'white',
        py: 4,
        px: 3,
        mb: 4
      }}>
        <Container maxWidth="lg">
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={3}>
              <IconButton 
                onClick={() => navigate('/orders')}
                sx={{ 
                  color: 'white',
                  bgcolor: alpha(theme.palette.common.white, 0.1),
                  '&:hover': {
                    bgcolor: alpha(theme.palette.common.white, 0.2)
                  }
                }}
              >
                <ArrowBackIcon />
              </IconButton>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {isEditMode ? 'Edit Order' : 'Create New Order'}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9, mt: 0.5 }}>
                  {isEditMode ? 'Update order details and information' : 'Fill in the details to create a new work order'}
                </Typography>
              </Box>
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg">
        {/* Alerts */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3, borderRadius: 2 }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert 
            severity="success" 
            sx={{ mb: 3, borderRadius: 2 }}
            onClose={() => setSuccess(null)}
          >
            {success}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Basic Information Section */}
            <Grid item xs={12}>
              <Paper sx={{ 
                p: 3, 
                borderRadius: 3,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                border: `1px solid ${theme.palette.grey[200]}`
              }}>
                <Box sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  mb: 3
                }}>
                  <Avatar sx={{ 
                    bgcolor: theme.palette.primary.main,
                    width: 48,
                    height: 48
                  }}>
                    <AssignmentIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Basic Information
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Essential order details and customer information
                    </Typography>
                  </Box>
                </Box>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Order Name"
                      name="order_name"
                      value={formData.order_name}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g., Kitchen Renovation - Smith"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <AssignmentIcon sx={{ color: theme.palette.grey[400] }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        },
                      }}
                    />
                  </Grid>
          
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <FormControl fullWidth required>
                        <InputLabel>Customer</InputLabel>
                        <Select
                          name="customer_id"
                          value={formData.customer_id}
                          onChange={handleInputChange}
                          label="Customer"
                          disabled={customersLoading}
                          startAdornment={
                            <InputAdornment position="start">
                              <PersonIcon sx={{ color: theme.palette.grey[400], ml: 1.5 }} />
                            </InputAdornment>
                          }
                          sx={{
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderRadius: 2,
                            },
                          }}
                        >
                          {customersLoading ? (
                            <MenuItem value="">Loading customers...</MenuItem>
                          ) : customers.length === 0 ? (
                            <MenuItem value="" disabled>
                              No customers found. Click + to add one.
                            </MenuItem>
                          ) : (
                            customers.map((customer) => (
                              <MenuItem key={customer.customer_id} value={customer.customer_id}>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                  {customer.customer_type === 'COMMERCIAL' ? 
                                    <BusinessIcon fontSize="small" color="primary" /> : 
                                    <HomeIcon fontSize="small" color="success" />
                                  }
                                  <span>
                                    {customer.name}
                                    {customer.contact_first_name && customer.contact_last_name && 
                                      ` (${customer.contact_first_name} ${customer.contact_last_name})`
                                    }
                                  </span>
                                </Stack>
                              </MenuItem>
                            ))
                          )}
                        </Select>
                      </FormControl>
                      <Stack spacing={0.5}>
                        <Tooltip title="Add New Customer">
                          <IconButton
                            color="primary"
                            onClick={() => setCustomerDialogOpen(true)}
                            sx={{ 
                              border: '2px solid',
                              borderColor: theme.palette.primary.main,
                              borderRadius: 2,
                              '&:hover': {
                                backgroundColor: theme.palette.primary.main,
                                color: 'white'
                              }
                            }}
                          >
                            <AddIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Refresh">
                          <IconButton
                            size="small"
                            onClick={fetchCustomers}
                            disabled={customersLoading}
                          >
                            <RefreshIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Order Type</InputLabel>
                      <Select
                        name="type"
                        value={formData.type}
                        onChange={handleWorkflowTypeChange}
                        label="Order Type"
                        startAdornment={
                          <InputAdornment position="start">
                            <BuildIcon sx={{ color: theme.palette.grey[400], ml: 1.5 }} />
                          </InputAdornment>
                        }
                        sx={{
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderRadius: 2,
                          },
                        }}
                      >
                        <MenuItem value="MATERIALS_ONLY">
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <InventoryIcon fontSize="small" />
                            <span>Materials Only</span>
                          </Stack>
                        </MenuItem>
                        <MenuItem value="MATERIALS_AND_INSTALLATION">
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <EngineeringIcon fontSize="small" />
                            <span>Materials & Installation</span>
                          </Stack>
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Priority</InputLabel>
                      <Select
                        name="priority"
                        value={formData.priority}
                        onChange={handleInputChange}
                        label="Priority"
                        startAdornment={
                          <InputAdornment position="start">
                            <PriorityIcon sx={{ color: theme.palette.grey[400], ml: 1.5 }} />
                          </InputAdornment>
                        }
                        sx={{
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderRadius: 2,
                          },
                        }}
                      >
                        {priorities.map((priority) => (
                          <MenuItem key={priority} value={priority}>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Chip 
                                size="small" 
                                label={priority} 
                                color={
                                  priority === 'High' ? 'error' : 
                                  priority === 'Medium' ? 'warning' : 
                                  'default'
                                }
                              />
                            </Stack>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      multiline
                      rows={3}
                      placeholder="Provide a detailed description of the work to be done..."
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        },
                      }}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          
            {/* Project Details Section */}
            <Grid item xs={12}>
              <Paper sx={{ 
                p: 3, 
                borderRadius: 3,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                border: `1px solid ${theme.palette.grey[200]}`
              }}>
                <Box sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  mb: 3
                }}>
                  <Avatar sx={{ 
                    bgcolor: theme.palette.success.main,
                    width: 48,
                    height: 48
                  }}>
                    <LocationIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Project Details
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Location, timeline, and budget information
                    </Typography>
                  </Box>
                </Box>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Project Location"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="123 Main St, City, State"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LocationIcon sx={{ color: theme.palette.grey[400] }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        },
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Budget"
                      name="budget"
                      type="number"
                      value={formData.budget}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <MoneyIcon sx={{ color: theme.palette.grey[400] }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        },
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Start Date"
                      name="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={handleInputChange}
                      InputLabelProps={{ shrink: true }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <CalendarIcon sx={{ color: theme.palette.grey[400] }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        },
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Target Completion Date"
                      name="target_completion_date"
                      type="date"
                      value={formData.target_completion_date}
                      onChange={handleInputChange}
                      InputLabelProps={{ shrink: true }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <CalendarIcon sx={{ color: theme.palette.grey[400] }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        },
                      }}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Additional Information Section */}
            <Grid item xs={12}>
              <Paper sx={{ 
                p: 3, 
                borderRadius: 3,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                border: `1px solid ${theme.palette.grey[200]}`
              }}>
                <Box sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  mb: 3
                }}>
                  <Avatar sx={{ 
                    bgcolor: theme.palette.info.main,
                    width: 48,
                    height: 48
                  }}>
                    <NotesIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Additional Information
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Contract details and workflow settings
                    </Typography>
                  </Box>
                </Box>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Contract Number"
                      name="contract_number"
                      value={formData.contract_number}
                      onChange={handleInputChange}
                      placeholder="CNT-2024-001"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        },
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth required>
                      <InputLabel>Initial Workflow Stage</InputLabel>
                      <Select
                        name="current_stage"
                        value={formData.current_stage}
                        onChange={handleInputChange}
                        label="Initial Workflow Stage"
                        disabled={stagesLoading}
                        sx={{
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderRadius: 2,
                          },
                        }}
                      >
                        {stagesLoading ? (
                          <MenuItem value="">Loading stages...</MenuItem>
                        ) : (
                          workflowStages.map((stage) => (
                            <MenuItem key={stage} value={stage}>
                              {stage.replace(/_/g, ' ')}
                            </MenuItem>
                          ))
                        )}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Internal Notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      multiline
                      rows={4}
                      placeholder="Any additional notes or special instructions..."
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        },
                      }}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Action Buttons */}
            <Grid item xs={12}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                mt: 2
              }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/orders')}
                  sx={{ 
                    borderRadius: 2,
                    px: 4,
                    py: 1.5,
                    textTransform: 'none',
                    fontWeight: 500
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading || stagesLoading}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                  sx={{ 
                    borderRadius: 2,
                    px: 4,
                    py: 1.5,
                    textTransform: 'none',
                    fontWeight: 500,
                    minWidth: 180,
                    boxShadow: 'none',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }
                  }}
                >
                  {loading ? 'Saving...' : isEditMode ? 'Update Order' : 'Create Order'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>

        {/* Customer Dialog */}
        <CustomerDialog
          open={customerDialogOpen}
          onClose={() => setCustomerDialogOpen(false)}
          onCustomerCreated={handleCustomerCreated}
        />
      </Container>
    </Box>
  );
};

export default OrderForm;