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
  VisibilityOutlined as ViewIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';

// API URL
const API_URL = 'http://localhost:8000';

const OrderList = ({ initialFilter = '', viewMode = 'standard' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Parse URL query parameters
  const searchParams = new URLSearchParams(location.search);
  const urlFilter = searchParams.get('current_stage') || initialFilter;
  
  // State variables
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [stageFilter, setStageFilter] = useState(urlFilter);
  const [priorityFilter, setPriorityFilter] = useState('');
  const [orderStages, setOrderStages] = useState([]);
  const [orderPriorities, setOrderPriorities] = useState([]);
  const [stageCounts, setStageCounts] = useState({});
  
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
        
        // Fetch order stages
        const stagesResponse = await axios.get(`${API_URL}/orders/order-stages`, {
          withCredentials: true
        });
        
        if (stagesResponse.data && stagesResponse.data.stages) {
          setOrderStages(stagesResponse.data.stages);
        }
        
        // Fetch order priorities
        const prioritiesResponse = await axios.get(`${API_URL}/orders/order-priorities`, {
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
  
  // Calculate stage counts
  useEffect(() => {
    if (!orders.length) return;
    
    const counts = {};
    orderStages.forEach(stage => {
      counts[stage] = orders.filter(order => order.current_stage === stage).length;
    });
    
    setStageCounts(counts);
  }, [orders, orderStages]);
  
  // Apply filters and search
  useEffect(() => {
    let filtered = [...orders];
    
    // Apply stage filter
    if (stageFilter) {
      filtered = filtered.filter(order => order.current_stage === stageFilter);
    }
    
    // Apply priority filter
    if (priorityFilter) {
      filtered = filtered.filter(order => order.priority === priorityFilter);
    }
    
    // Apply search filter
    if (searchTerm.trim()) {
      const lowercasedSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(order => 
        (order.project_address && order.project_address.toLowerCase().includes(lowercasedSearch)) ||
        (order.description && order.description.toLowerCase().includes(lowercasedSearch)) ||
        (order.project_city && order.project_city.toLowerCase().includes(lowercasedSearch)) ||
        (order.work_order_number && order.work_order_number.toLowerCase().includes(lowercasedSearch))
      );
    }
    
    setFilteredOrders(filtered);
    setPage(1); // Reset to first page on filter change
  }, [orders, stageFilter, priorityFilter, searchTerm]);
  
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
  
  // Handle stage filter change
  const handleStageFilterChange = (event) => {
    const newStage = event.target.value;
    setStageFilter(newStage);
    
    // Update URL to reflect filter
    const params = new URLSearchParams(location.search);
    if (newStage) {
      params.set('current_stage', newStage);
    } else {
      params.delete('current_stage');
    }
    
    navigate({
      pathname: location.pathname,
      search: params.toString()
    });
  };
  
  // Handle navigation based on view mode
  const handleViewOrder = (orderId) => {
    if (viewMode === 'tracking') {
      navigate(`/order-tracking/${orderId}`);
    } else {
      navigate(`/orders/${orderId}`);
    }
  };
  
  // Get stage chip color
  const getStageColor = (stage) => {
    if (!stage) return 'default';
    
    // Define color mapping based on stage keywords
    if (stage.includes('LEAD_ACQUISITION') || stage.includes('Lead Acquisition')) {
      return 'warning';  // Typically amber/yellow - attention-grabbing for new leads
    } else if (stage.includes('QUOTATION') || stage.includes('Quotation')) {
      return 'info';     // Typically blue - professional, communicative
    } else if (stage.includes('PROCUREMENT') || stage.includes('Procurement')) {
      return 'secondary'; // Typically purple/gray - transitional stage
    } else if (stage.includes('FULFILLMENT') || stage.includes('Fulfillment')) {
      return 'primary';   // Typically main brand color - important action stage
    } else if (stage.includes('FINALIZATION') || stage.includes('Finalization')) {
      return 'success';   // Typically green - completion, success
    } else {
      return 'default';   // Typically gray - neutral
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
  
  // Render the page title based on view mode
  const renderPageTitle = () => {
    if (viewMode === 'tracking') {
      return "Order Tracking";
    }
    return "Orders";
  };
  
  // Render the action button based on view mode
  const renderActionButton = (order) => {
  
  return (
    <Button 
      size="small" 
      variant="contained"
      color="primary"
      onClick={() => handleViewOrder(order.order_id)}
      sx={{ 
        borderRadius: 6, 
        px: 2,
        py: 0.5,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        fontSize: '0.75rem',
        fontWeight: 500,
        minWidth: 0
      }}
      
    >
      View
    </Button>
  );
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
          {renderPageTitle()}
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
          
          {viewMode === 'standard' && (
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<AddIcon />}
              onClick={() => navigate('/orders/add')}
            >
              New Order
            </Button>
          )}
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
      
      {/* Stage Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {orderStages.map((stage) => (
          <Grid item xs={6} sm={4} md={2} key={stage}>
            <Card 
              variant={stageFilter === stage ? "elevation" : "outlined"} 
              elevation={stageFilter === stage ? 4 : 1}
              sx={{ 
                cursor: 'pointer',
                bgcolor: stageFilter === stage ? `${getStageColor(stage)}.50` : 'inherit',
                borderColor: stageFilter === stage ? `${getStageColor(stage)}.main` : 'inherit'
              }}
              onClick={() => handleStageFilterChange({ target: { value: stageFilter === stage ? '' : stage } })}
            >
              <CardContent sx={{ py: 1, px: 2, '&:last-child': { pb: 1 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    {stage}
                  </Typography>
                  <Chip 
                    label={stageCounts[stage] || 0} 
                    color={getStageColor(stage)} 
                    size="small"
                    sx={{ minWidth: 30, ml: 1}}
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
              <InputLabel id="stage-filter-label" shrink={true} >Current Stage</InputLabel>
              <Select
                labelId="stage-filter-label"
                id="stage-filter"
                value={stageFilter}
                label="Current Stage"
                onChange={handleStageFilterChange}
                displayEmpty
              >
                <MenuItem value="">All Stages</MenuItem>
                {orderStages.map((stage) => (
                  <MenuItem key={stage} value={stage}>
                    {stage} ({stageCounts[stage] || 0})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel id="priority-filter-label" shrink={true} >Priority</InputLabel>
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
                  <TableCell>Project Address</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Stage</TableCell>
                  
                  
                  
                  <TableCell>Progress</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {currentOrders.map((order) => (
                  <TableRow key={order.order_id} hover>
                    <TableCell>{order.order_number || order.order_id}</TableCell>
                    <TableCell sx={{ maxWidth: 250, whiteSpace: 'normal', wordBreak: 'break-word' }}>
                      {order.project_address || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={order.priority || 'N/A'} 
                        color={getPriorityColor(order.priority)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={order.workflow_status || 'N/A'} 
                        color={getStageColor(order.workflow_status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={order.current_stage || 'N/A'} 
                        color={getStageColor(order.current_stage)}
                        size="small"
                      />
                    </TableCell>
                    
                    
                    
                    <TableCell>
                      {order.progress_percentage !== null && order.progress_percentage !== undefined ? 
                        `${order.progress_percentage}%` : 'N/A'}
                    </TableCell>
                    
                    <TableCell>
                      {renderActionButton(order)}
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
        <Alert severity={searchTerm || stageFilter || priorityFilter ? "info" : "warning"} sx={{ mt: 2 }}>
          {searchTerm || stageFilter || priorityFilter
            ? "No orders matching your search criteria."
            : "No orders available."}
        </Alert>
      )}
    </Box>
  );
};

export default OrderList;