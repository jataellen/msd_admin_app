// src/pages/OrdersListPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

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
  TablePagination,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Tooltip
} from '@mui/material';

// Material UI icons
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Add as AddIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  LibraryBooks as LibraryBooksIcon,
  Assignment as AssignmentIcon,
  Build as BuildIcon,
  LocalShipping as LocalShippingIcon,
  Check as CheckIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Define order status options
const ORDER_STATUS_OPTIONS = [
  { value: "DRAFT", label: "Draft" },
  { value: "ACTIVE", label: "Active" },
  { value: "ON_HOLD", label: "On Hold" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" }
];

// Define order type options
const ORDER_TYPE_OPTIONS = [
  { value: "MATERIALS_ONLY", label: "Materials Only" },
  { value: "MATERIALS_AND_INSTALLATION", label: "Materials & Installation" }
];

const OrdersListPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State variables
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    dateRange: 'all'
  });
  const [sortConfig, setSortConfig] = useState({
    key: 'created_at',
    direction: 'desc'
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalOrders, setTotalOrders] = useState(0);
  const [statusCounts, setStatusCounts] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  
  // Fetch orders data
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
      
      const ordersData = response.data || [];
      setOrders(ordersData);
      setTotalOrders(ordersData.length);
      
      // Calculate status counts
      const counts = {};
      ORDER_STATUS_OPTIONS.forEach(option => {
        counts[option.value] = ordersData.filter(order => order.status === option.value).length;
      });
      setStatusCounts(counts);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
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
  
  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPage(0);
  };
  
  // Handle sort
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  // Get filtered and sorted orders
  const getFilteredOrders = () => {
    let filteredData = [...orders];
    
    // Apply search filter
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filteredData = filteredData.filter(order => 
        (order.order_number && order.order_number.toLowerCase().includes(lowerSearchTerm)) ||
        (order.customer_name && order.customer_name.toLowerCase().includes(lowerSearchTerm)) ||
        (order.project_address && order.project_address.toLowerCase().includes(lowerSearchTerm)) ||
        (order.current_stage && order.current_stage.toLowerCase().includes(lowerSearchTerm))
      );
    }
    
    // Apply status filter
    if (filters.status) {
      filteredData = filteredData.filter(order => order.status === filters.status);
    }
    
    // Apply type filter
    if (filters.type) {
      filteredData = filteredData.filter(order => order.type === filters.type);
    }
    
    // Apply date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const oneDay = 24 * 60 * 60 * 1000;
      
      if (filters.dateRange === 'today') {
        filteredData = filteredData.filter(order => {
          const orderDate = new Date(order.created_at);
          return orderDate >= today;
        });
      } else if (filters.dateRange === 'yesterday') {
        const yesterday = new Date(today.getTime() - oneDay);
        filteredData = filteredData.filter(order => {
          const orderDate = new Date(order.created_at);
          return orderDate >= yesterday && orderDate < today;
        });
      } else if (filters.dateRange === 'last7days') {
        const last7Days = new Date(today.getTime() - 7 * oneDay);
        filteredData = filteredData.filter(order => {
          const orderDate = new Date(order.created_at);
          return orderDate >= last7Days;
        });
      } else if (filters.dateRange === 'last30days') {
        const last30Days = new Date(today.getTime() - 30 * oneDay);
        filteredData = filteredData.filter(order => {
          const orderDate = new Date(order.created_at);
          return orderDate >= last30Days;
        });
      }
    }
    
    // Apply sorting
    if (sortConfig.key) {
      filteredData.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        
        // Handle dates for sorting
        if (sortConfig.key === 'created_at' || sortConfig.key === 'updated_at') {
          aValue = new Date(aValue || 0).getTime();
          bValue = new Date(bValue || 0).getTime();
        }
        
        // Handle string sorting
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }
        
        // Handle null values
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return filteredData;
  };
  
  const filteredOrders = getFilteredOrders();
  
  // Get paginated orders
  const paginatedOrders = filteredOrders.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Get status chip color
  const getStatusColor = (status) => {
    switch (status) {
      case 'DRAFT':
        return 'default';
      case 'ACTIVE':
        return 'primary';
      case 'ON_HOLD':
        return 'warning';
      case 'COMPLETED':
        return 'success';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };
  
  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'DRAFT':
        return <AssignmentIcon fontSize="small" />;
      case 'ACTIVE':
        return <BuildIcon fontSize="small" />;
      case 'ON_HOLD':
        return <WarningIcon fontSize="small" />;
      case 'COMPLETED':
        return <CheckIcon fontSize="small" />;
      case 'CANCELLED':
        return <CancelIcon fontSize="small" />;
      default:
        return <AssignmentIcon fontSize="small" />;
    }
  };
  
  // Get sort icon for table headers
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return null;
    }
    
    return sortConfig.direction === 'asc' ? (
      <ArrowUpwardIcon fontSize="small" sx={{ ml: 1 }} />
    ) : (
      <ArrowDownwardIcon fontSize="small" sx={{ ml: 1 }} />
    );
  };
  
  // Handle new order click
  const handleNewOrder = () => {
    navigate('/orders/new');
  };
  
  // Handle view order click
  const handleViewOrder = (orderId) => {
    navigate(`/orders/${orderId}`);
  };
  
  // Handle filter toggle
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };
  
  // Handle clear filters
  const handleClearFilters = () => {
    setFilters({
      status: '',
      type: '',
      dateRange: 'all'
    });
    setSearchTerm('');
    setPage(0);
  };
  
  return (
    <Box sx={{ maxWidth: '100%', mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Orders
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchOrders}
            disabled={loading}
          >
            Refresh
          </Button>
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleNewOrder}
          >
            New Order
          </Button>
        </Box>
      </Box>
      
      {/* Status Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="h6" component="div">
                {totalOrders}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Orders
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        {ORDER_STATUS_OPTIONS.map(option => (
          <Grid item xs={12} sm={6} md={2.4} key={option.value}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                borderLeft: filters.status === option.value ? 4 : 0,
                borderColor: `${getStatusColor(option.value)}.main`,
                bgcolor: filters.status === option.value ? `${getStatusColor(option.value)}.50` : 'inherit'
              }}
              onClick={() => handleFilterChange('status', filters.status === option.value ? '' : option.value)}
            >
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h6" component="div">
                    {statusCounts[option.value] || 0}
                  </Typography>
                  <Chip 
                    size="small" 
                    label={option.label} 
                    color={getStatusColor(option.value)}
                    icon={getStatusIcon(option.value)}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Click to filter
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      {/* Search and Filters */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search orders by number, customer name, address..."
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
        
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<FilterListIcon />}
              onClick={toggleFilters}
            >
              {showFilters ? "Hide Filters" : "Show Filters"}
            </Button>
            
            {(filters.status || filters.type || filters.dateRange !== 'all' || searchTerm) && (
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleClearFilters}
              >
                Clear Filters
              </Button>
            )}
          </Box>
        </Grid>
      </Grid>
      
      {/* Additional Filters */}
      {showFilters && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Additional Filters
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth variant="outlined" size="small">
                <InputLabel id="status-filter-label">Status</InputLabel>
                <Select
                  labelId="status-filter-label"
                  id="status-filter"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  label="Status"
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  {ORDER_STATUS_OPTIONS.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth variant="outlined" size="small">
                <InputLabel id="type-filter-label">Order Type</InputLabel>
                <Select
                  labelId="type-filter-label"
                  id="type-filter"
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  label="Order Type"
                >
                  <MenuItem value="">All Types</MenuItem>
                  {ORDER_TYPE_OPTIONS.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth variant="outlined" size="small">
                <InputLabel id="date-range-filter-label">Date Range</InputLabel>
                <Select
                  labelId="date-range-filter-label"
                  id="date-range-filter"
                  value={filters.dateRange}
                  onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                  label="Date Range"
                >
                  <MenuItem value="all">All Time</MenuItem>
                  <MenuItem value="today">Today</MenuItem>
                  <MenuItem value="yesterday">Yesterday</MenuItem>
                  <MenuItem value="last7days">Last 7 Days</MenuItem>
                  <MenuItem value="last30days">Last 30 Days</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>
      )}
      
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={fetchOrders}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}
      
      {loading && orders.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : filteredOrders.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            No orders found
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            {searchTerm || filters.status || filters.type || filters.dateRange !== 'all'
              ? "Try adjusting your filters or search term."
              : "Click the 'New Order' button to create your first order."}
          </Typography>
          {(searchTerm || filters.status || filters.type || filters.dateRange !== 'all') && (
            <Button 
              variant="outlined" 
              sx={{ mt: 2 }}
              onClick={handleClearFilters}
            >
              Clear Filters
            </Button>
          )}
        </Paper>
      ) : (
        <>
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}
          
          <Paper sx={{ width: '100%', overflow: 'hidden' }}>
            <TableContainer>
              <Table stickyHeader aria-label="orders table">
                <TableHead>
                  <TableRow>
                    <TableCell 
                      sortDirection={sortConfig.key === 'order_number' ? sortConfig.direction : false}
                      onClick={() => handleSort('order_number')}
                      sx={{ cursor: 'pointer' }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        Order #
                        {getSortIcon('order_number')}
                      </Box>
                    </TableCell>
                    <TableCell 
                      sortDirection={sortConfig.key === 'customer_name' ? sortConfig.direction : false}
                      onClick={() => handleSort('customer_name')}
                      sx={{ cursor: 'pointer' }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        Customer
                        {getSortIcon('customer_name')}
                      </Box>
                    </TableCell>
                    <TableCell 
                      sortDirection={sortConfig.key === 'type' ? sortConfig.direction : false}
                      onClick={() => handleSort('type')}
                      sx={{ cursor: 'pointer' }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        Type
                        {getSortIcon('type')}
                      </Box>
                    </TableCell>
                    <TableCell 
                      sortDirection={sortConfig.key === 'current_stage' ? sortConfig.direction : false}
                      onClick={() => handleSort('current_stage')}
                      sx={{ cursor: 'pointer' }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        Current Stage
                        {getSortIcon('current_stage')}
                      </Box>
                    </TableCell>
                    <TableCell 
                      sortDirection={sortConfig.key === 'status' ? sortConfig.direction : false}
                      onClick={() => handleSort('status')}
                      sx={{ cursor: 'pointer' }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        Status
                        {getSortIcon('status')}
                      </Box>
                    </TableCell>
                    <TableCell 
                      sortDirection={sortConfig.key === 'total_amount' ? sortConfig.direction : false}
                      onClick={() => handleSort('total_amount')}
                      sx={{ cursor: 'pointer' }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        Amount
                        {getSortIcon('total_amount')}
                      </Box>
                    </TableCell>
                    <TableCell 
                      sortDirection={sortConfig.key === 'created_at' ? sortConfig.direction : false}
                      onClick={() => handleSort('created_at')}
                      sx={{ cursor: 'pointer' }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        Created
                        {getSortIcon('created_at')}
                      </Box>
                    </TableCell>
                    <TableCell 
                      sortDirection={sortConfig.key === 'updated_at' ? sortConfig.direction : false}
                      onClick={() => handleSort('updated_at')}
                      sx={{ cursor: 'pointer' }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        Last Updated
                        {getSortIcon('updated_at')}
                      </Box>
                    </TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedOrders.map((order) => (
                    <TableRow 
                      key={order.id} 
                      hover 
                      onClick={() => handleViewOrder(order.id)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <LibraryBooksIcon sx={{ mr: 1, color: 'primary.main' }} />
                          {order.order_number}
                        </Box>
                      </TableCell>
                      <TableCell>{order.customer_name}</TableCell>
                      <TableCell>
                        <Chip 
                          label={order.type === 'MATERIALS_AND_INSTALLATION' ? 'M & I' : 'Materials'}
                          color={order.type === 'MATERIALS_AND_INSTALLATION' ? 'secondary' : 'default'}
                          size="small"
                          icon={order.type === 'MATERIALS_AND_INSTALLATION' ? <BuildIcon /> : <LocalShippingIcon />}
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title={order.current_stage}>
                          <Typography
                            variant="body2"
                            sx={{
                              maxWidth: 150,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {order.current_stage}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={ORDER_STATUS_OPTIONS.find(o => o.value === order.status)?.label || order.status}
                          color={getStatusColor(order.status)}
                          size="small"
                          icon={getStatusIcon(order.status)}
                        />
                      </TableCell>
                      <TableCell>
                        {order.total_amount ? `${order.total_amount.toFixed(2)}` : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Tooltip title={formatDate(order.created_at)}>
                          <Typography variant="body2">
                            {new Date(order.created_at).toLocaleDateString()}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Tooltip title={formatDate(order.updated_at)}>
                          <Typography variant="body2">
                            {new Date(order.updated_at).toLocaleDateString()}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="small"
                          variant="contained"
                          color="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewOrder(order.id);
                          }}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={filteredOrders.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Paper>
        </>
      )}
    </Box>
  );
};

export default OrdersListPage;