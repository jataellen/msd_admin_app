// CustomerDialog.js - Standard online form style customer creation
import React, { useState } from 'react';
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
  Stack
} from '@mui/material';
import {
  Business as BusinessIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  Description as NotesIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = 'http://localhost:8000';

const CustomerDialog = ({ open, onClose, onCustomerCreated }) => {
  const { isAuthenticated, user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    customer_type: 'RESIDENTIAL',
    contact_first_name: '',
    contact_last_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    // Check authentication first
    if (!isAuthenticated) {
      setError('You must be logged in to create a customer');
      return;
    }

    // Validate required field
    if (!formData.name) {
      setError('Name is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('User authenticated:', isAuthenticated);
      console.log('User details:', user);
      
      // For now, only send the essential fields that we know work
      const cleanedData = {
        name: formData.name,
        customer_type: formData.customer_type
      };
      
      // Add notes if provided
      if (formData.notes && formData.notes.trim() !== '') {
        cleanedData.notes = formData.notes;
      }
      
      console.log('Sending customer data:', cleanedData);
      const response = await axios.post(
        `${API_URL}/customers/`,
        cleanedData,
        { withCredentials: true }
      );

      console.log('Customer creation response:', response.data);
      if (response.data) {
        // Reset form
        setFormData({
          name: '',
          customer_type: 'RESIDENTIAL',
          contact_first_name: '',
          contact_last_name: '',
          email: '',
          phone: '',
          address: '',
          city: '',
          state: '',
          zip_code: '',
          notes: ''
        });
        
        // Notify parent component
        onCustomerCreated(response.data);
        onClose();
      }
    } catch (err) {
      console.error('Full error object:', err);
      console.error('Error response:', err.response);
      console.error('Error response data:', err.response?.data);
      console.error('Error message:', err.message);
      
      let errorMessage = 'Failed to create customer';
      if (err.response?.status === 403 || err.response?.status === 401) {
        errorMessage = 'You are not authorized. Please log in and try again.';
      } else if (err.response?.status === 422) {
        // Validation error - show the detailed error
        const details = err.response?.data?.detail;
        if (Array.isArray(details)) {
          errorMessage = `Validation error: ${details.map(d => d.msg || d.message || String(d)).join(', ')}`;
        } else if (typeof details === 'string') {
          errorMessage = `Validation error: ${details}`;
        } else if (details && typeof details === 'object') {
          errorMessage = `Validation error: ${JSON.stringify(details)}`;
        } else {
          errorMessage = 'Validation error: Please check your input data';
        }
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form and errors
    setFormData({
      name: '',
      customer_type: 'RESIDENTIAL',
      contact_first_name: '',
      contact_last_name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      notes: ''
    });
    setError(null);
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleCancel} 
      maxWidth="md" 
      fullWidth
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h5" component="div">
          New Customer Registration
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
          {/* Company Information Section */}
          <Box sx={{ mb: 4 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <BusinessIcon sx={{ color: 'primary.main' }} />
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, mb: 0 }}>
                Company Information
              </Typography>
            </Stack>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  required
                  label={formData.customer_type === 'RESIDENTIAL' ? "Customer Name" : "Company/Business Name"}
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  autoFocus
                  helperText={formData.customer_type === 'RESIDENTIAL' ? 
                    "Enter the customer's full name (e.g., John Smith)" : 
                    "Enter the legal business name"}
                  sx={{ minWidth: 250 }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth required>
                  <InputLabel>Customer Type</InputLabel>
                  <Select
                    name="customer_type"
                    value={formData.customer_type}
                    onChange={handleChange}
                    label="Customer Type"
                  >
                    <MenuItem value="RESIDENTIAL">Residential</MenuItem>
                    <MenuItem value="COMMERCIAL">Commercial</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>

          {/* Contact Information Section */}
          <Box sx={{ mb: 4 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <PersonIcon sx={{ color: 'success.main' }} />
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, mb: 0 }}>
                {formData.customer_type === 'RESIDENTIAL' ? 'Contact Information' : 'Primary Contact'}
              </Typography>
            </Stack>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              {formData.customer_type === 'COMMERCIAL' && (
                <>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Contact First Name"
                      name="contact_first_name"
                      value={formData.contact_first_name}
                      onChange={handleChange}
                      helperText="Primary contact at the business"
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Contact Last Name"
                      name="contact_last_name"
                      value={formData.contact_last_name}
                      onChange={handleChange}
                    />
                  </Grid>
                </>
              )}

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email Address"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  helperText="We'll use this for order confirmations and updates"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="(555) 123-4567"
                  helperText="Include area code"
                />
              </Grid>
            </Grid>
          </Box>

          {/* Service Address Section */}
          <Box sx={{ mb: 4 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <LocationIcon sx={{ color: 'info.main' }} />
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, mb: 0 }}>
                Service Address
              </Typography>
            </Stack>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Street Address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="123 Main Street, Suite 100"
                />
              </Grid>

              <Grid item xs={12} md={5}>
                <TextField
                  fullWidth
                  label="City"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth sx={{ minWidth: 140 }}>
                  <InputLabel>Province</InputLabel>
                  <Select
                    name="state"
                    value={formData.state}
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
                  name="zip_code"
                  value={formData.zip_code}
                  onChange={handleChange}
                  placeholder="A1A 1A1"
                  inputProps={{ 
                    maxLength: 7,
                    style: { textTransform: 'uppercase' }
                  }}
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
              placeholder="Any special instructions, preferences, or important information about this customer..."
              helperText="This information will be visible on orders and quotes"
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
          disabled={loading || !formData.name}
          size="large"
        >
          {loading ? 'Creating Customer...' : 'Create Customer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomerDialog;