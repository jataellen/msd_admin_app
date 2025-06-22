// OrderDialog.js - Standard online form style order creation
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Typography,
  Divider,
  Box,
  Autocomplete,
  Stack,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import {
  Person as PersonIcon,
  Assignment as ProjectIcon,
  Schedule as TimelineIcon,
  Description as NotesIcon,
  PersonAdd as PersonAddIcon
} from '@mui/icons-material';
import CustomerDialog from './CustomerDialog';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

const OrderDialog = ({ open, onClose, onOrderCreated, order = null, mode = 'create' }) => {
  const [formData, setFormData] = useState({
    order_name: '',
    customer_id: '',
    project_address: '',
    project_city: '',
    project_state: '',
    project_zip: '',
    description: '',
    priority: 'MEDIUM',
    estimated_value: '',
    start_date: '',
    estimated_completion_date: '',
    notes: '',
    site_visit_required: false
  });

  // Initialize form data when order prop changes (edit mode)
  useEffect(() => {
    if (order && mode === 'edit') {
      setFormData({
        order_name: order.order_name || '',
        customer_id: order.customer_id || '',
        project_address: order.project_address || '',
        project_city: order.project_city || '',
        project_state: order.project_state || '',
        project_zip: order.project_zip || '',
        description: order.scope_of_work || '',
        priority: order.priority || 'MEDIUM',
        estimated_value: order.estimated_total ? order.estimated_total.toString() : '',
        start_date: order.installation_start_date || '',
        estimated_completion_date: order.installation_end_date || '',
        notes: order.notes || '',
        site_visit_required: false // Default for existing orders
      });
    } else if (!order || mode === 'create') {
      // Reset to empty form for create mode
      setFormData({
        order_name: '',
        customer_id: '',
        project_address: '',
        project_city: '',
        project_state: '',
        project_zip: '',
        description: '',
        priority: 'MEDIUM',
        estimated_value: '',
        start_date: '',
        estimated_completion_date: '',
        notes: '',
        site_visit_required: false
      });
    }
  }, [order, mode, open]);

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);

  // Fetch customers when dialog opens
  useEffect(() => {
    if (open) {
      fetchCustomers();
    }
  }, [open]);

  const fetchCustomers = async () => {
    setCustomersLoading(true);
    try {
      const response = await axios.get(`${API_URL}/customers`, {
        withCredentials: true
      });
      setCustomers(response.data || []);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('Failed to load customers');
    } finally {
      setCustomersLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCustomerChange = (event, newValue) => {
    setFormData(prev => ({
      ...prev,
      customer_id: newValue ? newValue.customer_id : ''
    }));
  };

  const handleCustomerCreated = (newCustomer) => {
    setCustomerDialogOpen(false);
    
    // Refresh customers list
    fetchCustomers();
    
    // Auto-select the newly created customer
    if (newCustomer && newCustomer.customer_id) {
      setFormData(prev => ({
        ...prev,
        customer_id: newCustomer.customer_id
      }));
    }
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.customer_id) {
      setError('Please select a customer');
      return;
    }
    if (!formData.description) {
      setError('Project description is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Map frontend fields to backend/database expected fields
      const submitData = {
        order_name: formData.order_name || `${customers.find(c => c.customer_id === formData.customer_id)?.name || 'Customer'} Order`,
        customer_id: formData.customer_id,
        project_address: formData.project_address || '',
        project_city: formData.project_city || '',
        project_state: formData.project_state || '',
        project_zip: formData.project_zip || '',
        scope_of_work: formData.description || null,
        estimated_total: formData.estimated_value ? parseFloat(formData.estimated_value) : null,
        priority: formData.priority,
        notes: formData.notes || null,
        workflow_type: mode === 'edit' ? order?.workflow_type : 'MATERIALS_ONLY',
        workflow_status: mode === 'edit' ? order?.workflow_status : 'NEW_LEAD'
      };

      // Only include site_visit_required for new orders
      if (mode === 'create') {
        submitData.site_visit_required = formData.site_visit_required;
      }

      console.log(`${mode === 'edit' ? 'Updating' : 'Creating'} order data:`, submitData);

      const response = mode === 'edit' 
        ? await axios.put(`${API_URL}/orders/${order.order_id}/`, submitData, { withCredentials: true })
        : await axios.post(`${API_URL}/orders/`, submitData, { withCredentials: true });

      if (response.data) {
        // Reset form only for create mode
        if (mode === 'create') {
          setFormData({
            order_name: '',
            customer_id: '',
            project_address: '',
            project_city: '',
            project_state: '',
            project_zip: '',
            description: '',
            priority: 'MEDIUM',
            estimated_value: '',
            start_date: '',
            estimated_completion_date: '',
            notes: '',
            site_visit_required: false
          });
        }
        
        // Notify parent component
        onOrderCreated(response.data);
        onClose();
      }
    } catch (err) {
      console.error(`Error ${mode === 'edit' ? 'updating' : 'creating'} order:`, err);
      const errorDetail = err.response?.data?.detail;
      if (typeof errorDetail === 'string') {
        setError(errorDetail);
      } else if (Array.isArray(errorDetail)) {
        setError(`Validation error: ${errorDetail.map(d => d.msg || d.message || String(d)).join(', ')}`);
      } else if (errorDetail && typeof errorDetail === 'object') {
        setError(`Error: ${JSON.stringify(errorDetail)}`);
      } else {
        setError(`Failed to ${mode === 'edit' ? 'update' : 'create'} order`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form and errors
    setFormData({
      customer_id: '',
      project_address: '',
      project_city: '',
      project_state: '',
      project_zip: '',
      description: '',
      priority: 'MEDIUM',
      estimated_value: '',
      start_date: '',
      estimated_completion_date: '',
      notes: '',
      site_visit_required: false
    });
    setError(null);
    onClose();
  };

  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split('T')[0];

  return (
    <Dialog 
      open={open} 
      onClose={handleCancel} 
      maxWidth="md" 
      fullWidth
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h5" component="div">
          {mode === 'edit' ? 'Edit Order' : 'Create New Order'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Please fill out all required fields marked with *
        </Typography>
      </DialogTitle>
      
      <DialogContent sx={{ pt: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Box component="form" noValidate>
          {/* Customer Selection Section */}
          <Box sx={{ mb: 4 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <PersonIcon sx={{ color: 'primary.main' }} />
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, mb: 0 }}>
                Customer Information
              </Typography>
            </Stack>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1, minWidth: 300 }}>
                    <Autocomplete
                      options={customers}
                      getOptionLabel={(option) => `${option.name} - ${option.customer_type}`}
                      loading={customersLoading}
                      onChange={handleCustomerChange}
                      value={customers.find(c => c.customer_id === formData.customer_id) || null}
                      filterOptions={(options, { inputValue }) => {
                        return options.filter(option => 
                          option.name.toLowerCase().includes(inputValue.toLowerCase()) ||
                          option.customer_type.toLowerCase().includes(inputValue.toLowerCase())
                        );
                      }}
                      isOptionEqualToValue={(option, value) => option.customer_id === value?.customer_id}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          required
                          label="Search & Select Customer"
                          placeholder="Type to search customers..."
                          helperText="Type customer name to search or create a new one"
                        />
                      )}
                    />
                  </Box>
                  <Button
                    variant="outlined"
                    startIcon={<PersonAddIcon />}
                    onClick={() => setCustomerDialogOpen(true)}
                    sx={{ 
                      mt: 0,
                      minWidth: 'auto',
                      px: 2,
                      py: 1.75,
                      borderRadius: 1,
                      textTransform: 'none',
                      fontWeight: 500,
                      fontSize: '0.875rem'
                    }}
                  >
                    New Customer
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>

          {/* Project Details Section */}
          <Box sx={{ mb: 4 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <ProjectIcon sx={{ color: 'success.main' }} />
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, mb: 0 }}>
                Project Details
              </Typography>
            </Stack>
            <Divider sx={{ mb: 2 }} />
            
            <TextField
              fullWidth
              label="Order Name"
              name="order_name"
              value={formData.order_name}
              onChange={handleChange}
              placeholder="e.g., Kitchen Renovation, Office Buildout"
              helperText="Optional - will default to 'Customer Name + Order' if left blank"
              autoFocus
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              required
              label="Project Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              multiline
              rows={3}
              placeholder="Describe the work to be performed..."
              helperText="Provide a clear description of the project scope"
              sx={{ mb: 2 }}
            />
            
            <Grid container spacing={2}>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Project Address"
                  name="project_address"
                  value={formData.project_address}
                  onChange={handleChange}
                  placeholder="123 Main Street, Suite 100"
                  helperText="Where will the work be performed? (can be added later)"
                />
              </Grid>

              <Grid item xs={12} md={5}>
                <TextField
                  fullWidth
                  label="City"
                  name="project_city"
                  value={formData.project_city}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth sx={{ minWidth: 140 }}>
                  <InputLabel>Province</InputLabel>
                  <Select
                    name="project_state"
                    value={formData.project_state}
                    onChange={handleChange}
                    label="Province"
                  >
                    <MenuItem value="AB">AB</MenuItem>
                    <MenuItem value="BC">BC</MenuItem>
                    <MenuItem value="MB">MB</MenuItem>
                    <MenuItem value="NB">NB</MenuItem>
                    <MenuItem value="NL">NL</MenuItem>
                    <MenuItem value="NT">NT</MenuItem>
                    <MenuItem value="NS">NS</MenuItem>
                    <MenuItem value="NU">NU</MenuItem>
                    <MenuItem value="ON">ON</MenuItem>
                    <MenuItem value="PE">PE</MenuItem>
                    <MenuItem value="QC">QC</MenuItem>
                    <MenuItem value="SK">SK</MenuItem>
                    <MenuItem value="YT">YT</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Postal Code"
                  name="project_zip"
                  value={formData.project_zip}
                  onChange={handleChange}
                  placeholder="A1A 1A1"
                  inputProps={{ 
                    maxLength: 7,
                    style: { textTransform: 'uppercase' }
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Priority Level</InputLabel>
                  <Select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    label="Priority Level"
                  >
                    <MenuItem value="LOW">Low Priority</MenuItem>
                    <MenuItem value="MEDIUM">Medium Priority</MenuItem>
                    <MenuItem value="HIGH">High Priority</MenuItem>
                    <MenuItem value="URGENT">Urgent</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Estimated Value (CAD)"
                  name="estimated_value"
                  type="number"
                  value={formData.estimated_value}
                  onChange={handleChange}
                  placeholder="0.00"
                  helperText="Estimated project value in Canadian dollars"
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>
                  }}
                />
              </Grid>
              
              {mode === 'create' && (
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.site_visit_required}
                        onChange={(e) => setFormData(prev => ({...prev, site_visit_required: e.target.checked}))}
                        color="primary"
                      />
                    }
                    label="Site visit required"
                    sx={{ mt: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                    Check this if a site visit is needed before starting the project
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Box>

          {/* Timeline Section */}
          <Box sx={{ mb: 4 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <TimelineIcon sx={{ color: 'info.main' }} />
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, mb: 0 }}>
                Project Timeline
              </Typography>
            </Stack>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Start Date"
                  name="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={handleChange}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  inputProps={{
                    min: today
                  }}
                  helperText="When should work begin?"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Estimated Completion"
                  name="estimated_completion_date"
                  type="date"
                  value={formData.estimated_completion_date}
                  onChange={handleChange}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  inputProps={{
                    min: formData.start_date || today
                  }}
                  helperText="Expected completion date"
                />
              </Grid>
            </Grid>
          </Box>

          {/* Additional Information Section */}
          <Box sx={{ mb: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <NotesIcon sx={{ color: 'warning.main' }} />
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, mb: 0 }}>
                Additional Information
              </Typography>
            </Stack>
            <Divider sx={{ mb: 2 }} />
            
            <TextField
              fullWidth
              label="Notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              multiline
              rows={4}
              placeholder="Any special requirements, conditions, or important details..."
              helperText="This information will be visible to the team working on this order"
            />
          </Box>
        </Box>
      </DialogContent>

      <Divider />
      
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button 
          onClick={handleCancel} 
          disabled={loading}
          size="large"
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || !formData.customer_id || !formData.description}
          size="large"
        >
          {loading ? 
            (mode === 'edit' ? 'Updating Order...' : 'Creating Order...') : 
            (mode === 'edit' ? 'Update Order' : 'Create Order')
          }
        </Button>
      </DialogActions>
      
      {/* Customer Dialog */}
      <CustomerDialog
        open={customerDialogOpen}
        onClose={() => setCustomerDialogOpen(false)}
        onCustomerCreated={handleCustomerCreated}
      />
    </Dialog>
  );
};

export default OrderDialog;