// CustomerDialog.js - Modal for creating new customers inline
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
  Box,
  Typography,
  Divider,
  IconButton,
  Stack,
  Avatar,
  Chip,
  InputAdornment,
  alpha,
  useTheme,
  Fade,
  CircularProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  Business as BusinessIcon,
  Home as HomeIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Description as NotesIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

const CustomerDialog = ({ open, onClose, onCustomerCreated }) => {
  const theme = useTheme();
  
  const [formData, setFormData] = useState({
    company_name: '',
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
  const [activeSection, setActiveSection] = useState('company'); // For visual feedback

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.company_name) {
      setError('Company name is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `${API_URL}/customers`,
        formData,
        { withCredentials: true }
      );

      if (response.data) {
        // Reset form
        setFormData({
          company_name: '',
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
      console.error('Error creating customer:', err);
      setError(err.response?.data?.detail || 'Failed to create customer');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form and errors
    setFormData({
      company_name: '',
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
      TransitionComponent={Fade}
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden'
        }
      }}
    >
      {/* Header */}
      <Box sx={{ 
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
        color: 'white',
        p: 3,
        position: 'relative'
      }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ 
              bgcolor: alpha(theme.palette.common.white, 0.2),
              width: 40,
              height: 40
            }}>
              <PersonIcon sx={{ fontSize: 24 }} />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Add New Customer
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.85rem' }}>
                Fill in the details to create a new customer record
              </Typography>
            </Box>
          </Stack>
          <IconButton 
            onClick={handleCancel}
            sx={{ 
              color: 'white',
              '&:hover': {
                bgcolor: alpha(theme.palette.common.white, 0.1)
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </Stack>
      </Box>
      
      <DialogContent sx={{ p: 0 }}>
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              m: 3,
              mb: 0,
              borderRadius: 2
            }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        <Box sx={{ p: 3 }}>
          <Grid container spacing={2.5}>
            {/* Company Information Section */}
            <Grid item xs={12}>
              <Box sx={{ 
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                mb: 2,
                p: 2,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.04),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`
              }}>
                <Avatar sx={{ 
                  bgcolor: theme.palette.primary.main,
                  width: 32,
                  height: 32
                }}>
                  <BusinessIcon fontSize="small" />
                </Avatar>
                <Typography variant="body1" sx={{ fontWeight: 600, color: theme.palette.primary.main, fontSize: '0.95rem' }}>
                  Company Information
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={7}>
              <TextField
                fullWidth
                required
                label="Company Name"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                autoFocus
                size="small"
                placeholder="Enter company or business name"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BusinessIcon sx={{ color: theme.palette.grey[400], fontSize: '1.1rem' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    fontSize: '0.9rem',
                    '&:hover fieldset': {
                      borderColor: theme.palette.primary.main,
                    },
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '0.9rem'
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} md={5}>
              <FormControl fullWidth required size="small">
                <InputLabel sx={{ fontSize: '0.9rem' }}>Customer Type</InputLabel>
                <Select
                  name="customer_type"
                  value={formData.customer_type}
                  onChange={handleChange}
                  label="Customer Type"
                  sx={{
                    borderRadius: 2,
                    fontSize: '0.9rem',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderRadius: 2,
                    },
                  }}
                >
                  <MenuItem value="RESIDENTIAL">
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <HomeIcon fontSize="small" color="success" />
                      <span>Residential</span>
                    </Stack>
                  </MenuItem>
                  <MenuItem value="COMMERCIAL">
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <BusinessIcon fontSize="small" color="primary" />
                      <span>Commercial</span>
                    </Stack>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Contact Information Section */}
            <Grid item xs={12}>
              <Box sx={{ 
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                mb: 2,
                p: 2,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.success.main, 0.04),
                border: `1px solid ${alpha(theme.palette.success.main, 0.12)}`
              }}>
                <Avatar sx={{ 
                  bgcolor: theme.palette.success.main,
                  width: 32,
                  height: 32
                }}>
                  <PersonIcon fontSize="small" />
                </Avatar>
                <Typography variant="body1" sx={{ fontWeight: 600, color: theme.palette.success.main, fontSize: '0.95rem' }}>
                  Contact Information
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="First Name"
                name="contact_first_name"
                value={formData.contact_first_name}
                onChange={handleChange}
                placeholder="Contact's first name"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon sx={{ color: theme.palette.grey[400], fontSize: '1.1rem' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    fontSize: '0.9rem',
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '0.9rem'
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="Last Name"
                name="contact_last_name"
                value={formData.contact_last_name}
                onChange={handleChange}
                placeholder="Contact's last name"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    fontSize: '0.9rem',
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '0.9rem'
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="contact@company.com"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon sx={{ color: theme.palette.grey[400], fontSize: '1.1rem' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    fontSize: '0.9rem',
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '0.9rem'
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="Phone Number"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="(555) 123-4567"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon sx={{ color: theme.palette.grey[400], fontSize: '1.1rem' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    fontSize: '0.9rem',
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '0.9rem'
                  }
                }}
              />
            </Grid>

            {/* Address Information Section */}
            <Grid item xs={12}>
              <Box sx={{ 
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                mb: 2,
                p: 2,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.info.main, 0.04),
                border: `1px solid ${alpha(theme.palette.info.main, 0.12)}`
              }}>
                <Avatar sx={{ 
                  bgcolor: theme.palette.info.main,
                  width: 32,
                  height: 32
                }}>
                  <LocationIcon fontSize="small" />
                </Avatar>
                <Typography variant="body1" sx={{ fontWeight: 600, color: theme.palette.info.main, fontSize: '0.95rem' }}>
                  Address Information
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Street Address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="123 Main Street, Apt 4B"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationIcon sx={{ color: theme.palette.grey[400], fontSize: '1.1rem' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    fontSize: '0.9rem',
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '0.9rem'
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="City"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Houston"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    fontSize: '0.9rem',
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '0.9rem'
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                label="State"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="TX"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    fontSize: '0.9rem',
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '0.9rem'
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                label="ZIP Code"
                name="zip_code"
                value={formData.zip_code}
                onChange={handleChange}
                placeholder="12345"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    fontSize: '0.9rem',
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '0.9rem'
                  }
                }}
              />
            </Grid>

            {/* Additional Notes Section */}
            <Grid item xs={12}>
              <Box sx={{ 
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                mb: 2,
                p: 2,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.warning.main, 0.04),
                border: `1px solid ${alpha(theme.palette.warning.main, 0.12)}`
              }}>
                <Avatar sx={{ 
                  bgcolor: theme.palette.warning.main,
                  width: 32,
                  height: 32
                }}>
                  <NotesIcon fontSize="small" />
                </Avatar>
                <Typography variant="body1" sx={{ fontWeight: 600, color: theme.palette.warning.main, fontSize: '0.95rem' }}>
                  Additional Information
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Additional Notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                multiline
                rows={3}
                placeholder="Special requirements, preferences, or other notes about this customer..."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    fontSize: '0.9rem',
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '0.9rem'
                  }
                }}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>

      {/* Actions */}
      <Box sx={{ 
        p: 2, 
        pt: 0,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography variant="caption" color="text.secondary">
          * Required fields
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button 
            onClick={handleCancel} 
            disabled={loading}
            sx={{ 
              borderRadius: 2,
              px: 3,
              textTransform: 'none',
              fontWeight: 500
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading || !formData.company_name}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            sx={{ 
              borderRadius: 2,
              px: 3,
              textTransform: 'none',
              fontWeight: 500,
              minWidth: 150,
              boxShadow: 'none',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }
            }}
          >
            {loading ? 'Creating...' : 'Create Customer'}
          </Button>
        </Stack>
      </Box>
    </Dialog>
  );
};

export default CustomerDialog;