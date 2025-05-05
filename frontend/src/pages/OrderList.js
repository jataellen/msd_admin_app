// src/pages/OrderList.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

// Material UI imports
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  CircularProgress,
  Alert,
  Pagination,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
} from '@mui/material';

// Material UI icons
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  VisibilityOutlined as ViewIcon
} from '@mui/icons-material';

// const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
// const API_URL = 'https://msdadminapp-production.up.railway.app';
const API_URL = 'http://localhost:8000';

const OrderList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Parse URL query parameters
  const searchParams = new URLSearchParams(location.search);
  const initialStatus = searchParams.get('status') || '';
  
  // State variables
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [priorityFilter, setPriorityFilter] = useState('');
  const [orderStatuses, setOrderStatuses] = useState([]);
  const [orderPriorities, setOrderPriorities] = useState([]);
  const [statusCounts, setStatusCounts] = useState({});
  
  // Fetch orders and dropdown options
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch orders
        const ordersResponse = await axios.get(`${API_URL}/orders`, {
          withCredentials: true
        });
        
        if (ordersResponse.data && ordersResponse.data.orders) {
          setOrders(ordersResponse.data.orders);
        } else {
          setOrders([]);
        }
        
        // Fetch order statuses
        const statusesResponse = await axios.get(`${API_URL}/orders/order-statuses`, {
          withCredentials: true
        });
        
        if (statusesResponse.data && statusesResponse.data.statuses) {
          setOrderStatuses(statusesResponse.data.statuses);
        }
        
        // Fetch order priorities
        const prioritiesResponse = await axios.get(`${API_URL}/order-priorities`, {
          withCredentials: true
        });
        
        if (prioritiesResponse.data && prioritiesResponse.data.priorities) {
          setOrderPriorities(prioritiesResponse.data.priorities);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load orders data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Calculate status counts
  useEffect(() => {
    if (!orders.length) return;
    
    const counts = {};
    orderStatuses.forEach(status => {
      counts[status] = orders.filter(order => order.status === status).length;
    });
    
    setStatusCounts(counts);
  }, [orders, orderStatuses]);
  
  // Apply filters and search
  useEffect(() => {
    let filtered = [...orders];
    
    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(order => order.status === statusFilter);
    }
    
    // Apply priority filter
    if (priorityFilter) {
      filtered = filtered.filter(order => order.priority === priorityFilter);
    }
    
    // Apply search filter
    if (searchTerm.trim()) {
      const lowercasedSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(order => 
        (order.order_name && order.order_name.toLowerCase().includes(lowercasedSearch)) ||
        (order.description && order.description.toLowerCase().includes(lowercasedSearch)) ||
        (order.location && order.location.toLowerCase().includes(lowercasedSearch)) ||
        (order.contract_number && order.contract_number.toLowerCase().includes(lowercasedSearch))
      );
    }
    
    setFilteredOrders(filtered);
    setPage(1); // Reset to first page on filter change
  }, [orders, statusFilter, priorityFilter, searchTerm]);
  
  // Current page items
  const currentOrders = filteredOrders.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );
  
  // Calculate total pages
  const totalPages = Math.ceil(filteredOrders.length / rowsPerPage);
  
  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  // Handle refresh
  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_URL}/orders`, {
        withCredentials: true
      });
      
      if (response.data && response.data.orders) {
        setOrders(response.data.orders);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error('Error refreshing orders:', err);
      setError('Failed to refresh orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle status filter change
  const handleStatusFilterChange = (event) => {
    const newStatus = event.target.value;
    setStatusFilter(newStatus);
    
    // Update URL to reflect filter
    const params = new URLSearchParams(location.search);
    if (newStatus) {
      params.set('status', newStatus);
    } else {
      params.delete('status');
    }
    
    navigate({
      pathname: location.pathname,
      search: params.toString()
    });
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
  
  if (loading && orders.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box sx={{ maxWidth: '100%', overflowX: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Orders
        </Typography>
        
        <Box>
          <Button 
            variant="outlined" 
            color="primary" 
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
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
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={handleRefresh}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}
      
      {/* Status Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {orderStatuses.map((status) => (
          <Grid item xs={6} sm={4} md={2} key={status}>
            <Card 
              variant={statusFilter === status ? "elevation" : "outlined"} 
              elevation={statusFilter === status ? 4 : 1}
              sx={{ 
                cursor: 'pointer',
                bgcolor: statusFilter === status ? `${getStatusColor(status)}.50` : 'inherit',
                borderColor: statusFilter === status ? `${getStatusColor(status)}.main` : 'inherit',
              }}
              onClick={() => handleStatusFilterChange({ target: { value: statusFilter === status ? '' : status } })}
            >
              <CardContent sx={{ py: 1, px: 2, '&:last-child': { pb: 1 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    {status}
                  </Typography>
                  <Chip 
                    label={statusCounts[status] || 0} 
                    color={getStatusColor(status)} 
                    size="small"
                    sx={{ minWidth: 30 }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      {/* Filters and Search */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search orders..."
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
                      aria-label="clear search"
                    >
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel id="status-filter-label">Status</InputLabel>
              <Select
                labelId="status-filter-label"
                id="status-filter"
                value={statusFilter}
                label="Status"
                onChange={handleStatusFilterChange}
                displayEmpty
              >
                <MenuItem value="">All Statuses</MenuItem>
                {orderStatuses.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status} ({statusCounts[status] || 0})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel id="priority-filter-label">Priority</InputLabel>
              <Select
                labelId="priority-filter-label"
                id="priority-filter"
                value={priorityFilter}
                label="Priority"
                onChange={(e) => setPriorityFilter(e.target.value)}
                displayEmpty
              >
                <MenuItem value="">All Priorities</MenuItem>
                {orderPriorities.map((priority) => (
                  <MenuItem key={priority} value={priority}>{priority}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>
      
      {loading && orders.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}
      
      {currentOrders.length > 0 ? (
        <Paper sx={{ width: '100%', overflow: 'hidden', mb: 3 }}>
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader aria-label="orders table">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Order Name</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Budget</TableCell>
                  <TableCell>Start Date</TableCell>
                  <TableCell>Target Date</TableCell>
                  <TableCell>Progress</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {currentOrders.map((order) => (
                  <TableRow key={order.order_id} hover>
                    <TableCell>{order.order_id}</TableCell>
                    <TableCell sx={{ maxWidth: 250, whiteSpace: 'normal', wordBreak: 'break-word' }}>
                      {order.order_name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={order.status || 'N/A'} 
                        color={getStatusColor(order.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={order.priority || 'N/A'} 
                        color={getPriorityColor(order.priority)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{formatCurrency(order.budget)}</TableCell>
                    <TableCell>{formatDate(order.start_date)}</TableCell>
                    <TableCell>{formatDate(order.target_completion_date)}</TableCell>
                    <TableCell>
                      {order.progress_percentage !== null && order.progress_percentage !== undefined ? 
                        `${order.progress_percentage}%` : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        color="primary"
                        size="small"
                        onClick={() => navigate(`/orders/${order.order_id}`)}
                        title="View Order Details"
                      >
                        <ViewIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <Pagination 
                count={totalPages} 
                page={page}
                onChange={handleChangePage}
                color="primary"
              />
            </Box>
          )}
        </Paper>
      ) : (
        <Alert severity={searchTerm || statusFilter || priorityFilter ? "info" : "warning"} sx={{ mt: 2 }}>
          {searchTerm || statusFilter || priorityFilter
            ? "No orders matching your search criteria."
            : "No orders available."}
        </Alert>
      )}
    </Box>
  );
};

export default OrderList;