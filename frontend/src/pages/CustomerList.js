// CustomerList.js - Customer management page
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Tooltip,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Avatar,
  Stack,
  Divider,
  alpha,
  useTheme
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
  Home as HomeIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  ShoppingCart as OrdersIcon,
  GroupOutlined as CustomersIcon
} from '@mui/icons-material';
import CustomerDialog from '../components/CustomerDialog';

const API_URL = 'http://localhost:8000';

const CustomerList = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  
  // State
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerType, setCustomerType] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [orderCounts, setOrderCounts] = useState({});

  // Fetch customers
  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (customerType) params.append('customer_type', customerType);
      params.append('limit', rowsPerPage);
      params.append('offset', page * rowsPerPage);
      
      const response = await axios.get(
        `${API_URL}/customers?${params}`,
        { withCredentials: true }
      );
      
      if (response.data) {
        setCustomers(response.data);
        setTotalCustomers(response.data.length); // In real app, backend should return total count
        
        // Fetch order counts for each customer
        const counts = {};
        for (const customer of response.data) {
          try {
            const ordersResponse = await axios.get(
              `${API_URL}/customers/${customer.customer_id}/orders`,
              { withCredentials: true }
            );
            counts[customer.customer_id] = ordersResponse.data.total || 0;
          } catch (err) {
            counts[customer.customer_id] = 0;
          }
        }
        setOrderCounts(counts);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
      // Only show error if it's not an authentication issue
      if (err.response?.status !== 401 && err.response?.status !== 403) {
        setError('Failed to load customers. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch customers on component mount and when filters change
  useEffect(() => {
    fetchCustomers();
  }, [page, rowsPerPage, searchTerm, customerType]);

  // Handle customer creation
  const handleCustomerCreated = (newCustomer) => {
    // Refresh the list
    fetchCustomers();
  };

  // Handle customer deletion
  const handleDeleteCustomer = async (customerId) => {
    if (!window.confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      return;
    }
    
    try {
      await axios.delete(
        `${API_URL}/customers/${customerId}`,
        { withCredentials: true }
      );
      
      // Refresh the list
      fetchCustomers();
    } catch (err) {
      console.error('Error deleting customer:', err);
      if (err.response?.status === 400) {
        alert(err.response.data.detail || 'Cannot delete customer with existing orders');
      } else {
        alert('Failed to delete customer. Please try again.');
      }
    }
  };

  // Handle navigation to customer orders
  const handleViewOrders = (customerId) => {
    navigate(`/orders?customer=${customerId}`);
  };

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Format phone number
  const formatPhone = (phone) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  return (
    <Box sx={{ 
      backgroundColor: theme.palette.grey[50],
      minHeight: '100vh',
      py: 3,
      px: { xs: 2, sm: 3 }
    }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.grey[900] }}>
              Customers
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
              Manage your customer relationships
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              startIcon={<RefreshIcon />}
              onClick={fetchCustomers}
              disabled={loading}
              sx={{ 
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500
              }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCustomerDialogOpen(true)}
              sx={{ 
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500,
                boxShadow: 'none',
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }
              }}
            >
              Add Customer
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            borderRadius: 3,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: `1px solid ${theme.palette.grey[200]}`,
            height: '100%'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="body2" sx={{ color: theme.palette.grey[600], fontWeight: 500 }}>
                    Total Customers
                  </Typography>
                  <Typography variant="h3" sx={{ mt: 1, fontWeight: 700 }}>
                    {totalCustomers}
                  </Typography>
                </Box>
                <Avatar sx={{ 
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                  width: 48,
                  height: 48
                }}>
                  <CustomersIcon />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            borderRadius: 3,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: `1px solid ${theme.palette.grey[200]}`,
            height: '100%'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="body2" sx={{ color: theme.palette.grey[600], fontWeight: 500 }}>
                    Residential
                  </Typography>
                  <Typography variant="h3" sx={{ mt: 1, fontWeight: 700 }}>
                    {customers.filter(c => c.customer_type === 'RESIDENTIAL').length}
                  </Typography>
                </Box>
                <Avatar sx={{ 
                  bgcolor: alpha(theme.palette.success.main, 0.1),
                  color: theme.palette.success.main,
                  width: 48,
                  height: 48
                }}>
                  <HomeIcon />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            borderRadius: 3,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: `1px solid ${theme.palette.grey[200]}`,
            height: '100%'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="body2" sx={{ color: theme.palette.grey[600], fontWeight: 500 }}>
                    Commercial
                  </Typography>
                  <Typography variant="h3" sx={{ mt: 1, fontWeight: 700 }}>
                    {customers.filter(c => c.customer_type === 'COMMERCIAL').length}
                  </Typography>
                </Box>
                <Avatar sx={{ 
                  bgcolor: alpha(theme.palette.info.main, 0.1),
                  color: theme.palette.info.main,
                  width: 48,
                  height: 48
                }}>
                  <BusinessIcon />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            borderRadius: 3,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: `1px solid ${theme.palette.grey[200]}`,
            height: '100%'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="body2" sx={{ color: theme.palette.grey[600], fontWeight: 500 }}>
                    Active Orders
                  </Typography>
                  <Typography variant="h3" sx={{ mt: 1, fontWeight: 700 }}>
                    {Object.values(orderCounts).reduce((sum, count) => sum + count, 0)}
                  </Typography>
                </Box>
                <Avatar sx={{ 
                  bgcolor: alpha(theme.palette.warning.main, 0.1),
                  color: theme.palette.warning.main,
                  width: 48,
                  height: 48
                }}>
                  <OrdersIcon />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content */}
      <Paper sx={{ 
        borderRadius: 3,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        border: `1px solid ${theme.palette.grey[200]}`,
        overflow: 'hidden'
      }}>
        {/* Filters Section */}
        <Box sx={{ 
          p: 3,
          borderBottom: `1px solid ${theme.palette.grey[200]}`,
          bgcolor: theme.palette.grey[50]
        }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              placeholder="Search by name, contact, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: theme.palette.grey[400] }} />
                  </InputAdornment>
                ),
              }}
              sx={{ 
                flexGrow: 1, 
                maxWidth: { sm: 400 },
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: 'white'
                }
              }}
            />
            <FormControl sx={{ minWidth: 180 }}>
              <InputLabel>Customer Type</InputLabel>
              <Select
                value={customerType}
                onChange={(e) => setCustomerType(e.target.value)}
                label="Customer Type"
                sx={{ 
                  borderRadius: 2,
                  bgcolor: 'white'
                }}
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="RESIDENTIAL">
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <HomeIcon fontSize="small" />
                    <span>Residential</span>
                  </Stack>
                </MenuItem>
                <MenuItem value="COMMERCIAL">
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <BusinessIcon fontSize="small" />
                    <span>Commercial</span>
                  </Stack>
                </MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Table Content */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer sx={{ bgcolor: 'white' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: theme.palette.grey[50] }}>
                    <TableCell sx={{ fontWeight: 600, color: theme.palette.grey[700] }}>
                      Customer
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: theme.palette.grey[700] }}>
                      Contact Info
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: theme.palette.grey[700] }}>
                      Location
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, color: theme.palette.grey[700] }}>
                      Orders
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, color: theme.palette.grey[700] }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {customers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Box sx={{ py: 8 }}>
                          <Avatar sx={{ 
                            width: 80, 
                            height: 80, 
                            bgcolor: alpha(theme.palette.grey[400], 0.1),
                            mx: 'auto',
                            mb: 2
                          }}>
                            <CustomersIcon sx={{ fontSize: 40, color: theme.palette.grey[400] }} />
                          </Avatar>
                          <Typography variant="h6" color="textSecondary" gutterBottom>
                            No customers found
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {searchTerm || customerType ? 
                              'Try adjusting your search filters' : 
                              'Get started by adding your first customer'
                            }
                          </Typography>
                          {!searchTerm && !customerType && (
                            <Button
                              variant="contained"
                              startIcon={<AddIcon />}
                              onClick={() => setCustomerDialogOpen(true)}
                              sx={{ mt: 2 }}
                            >
                              Add First Customer
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    customers.map((customer) => (
                      <TableRow 
                        key={customer.customer_id} 
                        hover
                        sx={{ 
                          '&:hover': { 
                            bgcolor: alpha(theme.palette.primary.main, 0.04) 
                          }
                        }}
                      >
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={2}>
                            <Avatar sx={{ 
                              bgcolor: customer.customer_type === 'COMMERCIAL' 
                                ? alpha(theme.palette.info.main, 0.1)
                                : alpha(theme.palette.success.main, 0.1),
                              width: 44,
                              height: 44
                            }}>
                              {customer.customer_type === 'COMMERCIAL' ? 
                                <BusinessIcon sx={{ color: theme.palette.info.main }} /> : 
                                <HomeIcon sx={{ color: theme.palette.success.main }} />
                              }
                            </Avatar>
                            <Box>
                              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                {customer.company_name}
                              </Typography>
                              <Chip 
                                label={customer.customer_type} 
                                size="small"
                                sx={{ 
                                  height: 20,
                                  fontSize: '0.75rem',
                                  bgcolor: customer.customer_type === 'COMMERCIAL' 
                                    ? alpha(theme.palette.info.main, 0.1)
                                    : alpha(theme.palette.success.main, 0.1),
                                  color: customer.customer_type === 'COMMERCIAL' 
                                    ? theme.palette.info.main
                                    : theme.palette.success.main,
                                  border: 'none'
                                }}
                              />
                            </Box>
                          </Stack>
                        </TableCell>
                        
                        <TableCell>
                          <Stack spacing={0.5}>
                            {customer.contact_first_name && customer.contact_last_name && (
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <PersonIcon sx={{ fontSize: 16, color: theme.palette.grey[500] }} />
                                <Typography variant="body2">
                                  {customer.contact_first_name} {customer.contact_last_name}
                                </Typography>
                              </Stack>
                            )}
                            {customer.email && (
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <EmailIcon sx={{ fontSize: 16, color: theme.palette.grey[500] }} />
                                <Typography 
                                  variant="body2" 
                                  component="a"
                                  href={`mailto:${customer.email}`}
                                  sx={{ 
                                    color: theme.palette.primary.main,
                                    textDecoration: 'none',
                                    '&:hover': { textDecoration: 'underline' }
                                  }}
                                >
                                  {customer.email}
                                </Typography>
                              </Stack>
                            )}
                            {customer.phone && (
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <PhoneIcon sx={{ fontSize: 16, color: theme.palette.grey[500] }} />
                                <Typography variant="body2">
                                  {formatPhone(customer.phone)}
                                </Typography>
                              </Stack>
                            )}
                            {!customer.email && !customer.phone && !customer.contact_first_name && (
                              <Typography variant="body2" color="textSecondary">
                                No contact info
                              </Typography>
                            )}
                          </Stack>
                        </TableCell>
                        
                        <TableCell>
                          {customer.city || customer.state ? (
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <LocationIcon sx={{ fontSize: 16, color: theme.palette.grey[500] }} />
                              <Typography variant="body2">
                                {[customer.city, customer.state].filter(Boolean).join(', ')}
                              </Typography>
                            </Stack>
                          ) : (
                            <Typography variant="body2" color="textSecondary">
                              No location
                            </Typography>
                          )}
                        </TableCell>
                        
                        <TableCell align="center">
                          <Chip
                            label={orderCounts[customer.customer_id] || 0}
                            size="small"
                            color={orderCounts[customer.customer_id] > 0 ? "primary" : "default"}
                            sx={{ 
                              minWidth: 32,
                              cursor: 'pointer',
                              '&:hover': {
                                bgcolor: theme.palette.primary.main,
                                color: 'white'
                              }
                            }}
                            onClick={() => handleViewOrders(customer.customer_id)}
                          />
                        </TableCell>
                        
                        <TableCell align="center">
                          <Stack direction="row" spacing={1} justifyContent="center">
                            <Tooltip title="View Orders">
                              <IconButton
                                size="small"
                                onClick={() => handleViewOrders(customer.customer_id)}
                                sx={{ 
                                  color: theme.palette.primary.main,
                                  '&:hover': { 
                                    bgcolor: alpha(theme.palette.primary.main, 0.1) 
                                  }
                                }}
                              >
                                <OrdersIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={orderCounts[customer.customer_id] > 0 ? 
                              "Cannot delete customer with orders" : 
                              "Delete Customer"
                            }>
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteCustomer(customer.customer_id)}
                                  disabled={orderCounts[customer.customer_id] > 0}
                                  sx={{ 
                                    color: theme.palette.error.main,
                                    '&:hover': { 
                                      bgcolor: alpha(theme.palette.error.main, 0.1) 
                                    },
                                    '&:disabled': {
                                      color: theme.palette.grey[300]
                                    }
                                  }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            {/* Pagination */}
            <Box sx={{ 
              borderTop: `1px solid ${theme.palette.grey[200]}`,
              bgcolor: theme.palette.grey[50]
            }}>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={totalCustomers}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                sx={{ 
                  '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                    fontWeight: 500,
                    color: theme.palette.grey[700]
                  }
                }}
              />
            </Box>
          </>
        )}
      </Paper>

      {/* Customer Dialog */}
      <CustomerDialog
        open={customerDialogOpen}
        onClose={() => setCustomerDialogOpen(false)}
        onCustomerCreated={handleCustomerCreated}
      />
    </Box>
  );
};

export default CustomerList;