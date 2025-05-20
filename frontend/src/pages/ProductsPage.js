// src/pages/ProductsPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Card,
  CardContent,
  Grid,
  Tooltip,
  Divider,
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
  Add as AddIcon,
  Info as InfoIcon,
  Sync as SyncIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon
} from '@mui/icons-material';

// API URL
const API_URL = 'http://localhost:8000';

const ProductsPage = () => {
  // State variables
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'active', 'inactive'
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(null);
  
  const navigate = useNavigate();
  
  // Fetch products
  useEffect(() => {
    fetchProducts();
  }, []);
  
  // Filter products based on search term and active filter
  useEffect(() => {
    let filtered = [...products];
    
    // Apply active filter
    if (activeFilter === 'active') {
      filtered = filtered.filter(product => product.Active === true);
    } else if (activeFilter === 'inactive') {
      filtered = filtered.filter(product => product.Active === false);
    }
    
    // Apply search filter
    if (searchTerm.trim()) {
      const lowercasedSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(product => 
        (product.Name && product.Name.toLowerCase().includes(lowercasedSearch)) ||
        (product.Description && product.Description.toLowerCase().includes(lowercasedSearch)) ||
        (product.Type && product.Type.toLowerCase().includes(lowercasedSearch))
      );
    }
    
    setFilteredProducts(filtered);
    setPage(1); // Reset to first page on filter change
  }, [searchTerm, products, activeFilter]);
  
  // Fetch products from API
  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_URL}/quickbooks/products`, {
        withCredentials: true
      });
      
      if (response.data && response.data.products) {
        setProducts(response.data.products);
        setFilteredProducts(response.data.products);
      } else {
        setProducts([]);
        setFilteredProducts([]);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle sync products with QuickBooks
  const handleSyncProducts = async () => {
    setSyncing(true);
    setSyncSuccess(null);
    
    try {
      const response = await axios.post(
        `${API_URL}/quickbooks/sync/products`,
        {},
        { withCredentials: true }
      );
      
      if (response.data && response.data.success) {
        setSyncSuccess({
          success: true,
          message: response.data.message || 'Products synced successfully!'
        });
        
        // Refresh products after sync
        setTimeout(() => {
          fetchProducts();
        }, 2000);
      } else {
        setSyncSuccess({
          success: false,
          message: response.data?.message || 'Sync failed'
        });
      }
    } catch (err) {
      console.error('Error syncing products:', err);
      setSyncSuccess({
        success: false,
        message: err.response?.data?.detail || 'Failed to sync products. Please try again.'
      });
    } finally {
      setSyncing(false);
    }
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return 'N/A';
    return `$${parseFloat(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  // Get current page items
  const currentProducts = filteredProducts.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );
  
  // Calculate total pages
  const totalPages = Math.ceil(filteredProducts.length / rowsPerPage);
  
  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  // Toggle view mode
  const toggleViewMode = () => {
    setViewMode(viewMode === 'grid' ? 'list' : 'grid');
  };
  
  // Render grid view
  const renderGridView = () => {
    return (
      <Grid container spacing={2}>
        {currentProducts.map((product) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={product.Id}>
            <Card 
              elevation={2} 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Typography variant="h6" component="div" sx={{ fontWeight: 'medium', mb: 1 }}>
                    {product.Name}
                  </Typography>
                  
                  <Chip 
                    label={product.Active ? 'Active' : 'Inactive'} 
                    color={product.Active ? 'success' : 'default'}
                    size="small"
                    variant={product.Active ? 'filled' : 'outlined'}
                  />
                </Box>
                
                <Divider sx={{ mb: 2 }} />
                
                <Box sx={{ mb: 1.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    Type
                  </Typography>
                  <Typography variant="body1">
                    {product.Type || 'N/A'}
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 1.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    Price
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'medium', color: 'primary.main' }}>
                    {formatCurrency(product.UnitPrice)}
                  </Typography>
                </Box>
                
                {product.Description && (
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="body2" color="text.secondary">
                      Description
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}>
                      {product.Description}
                    </Typography>
                  </Box>
                )}
              </CardContent>
              
              <Box sx={{ p: 2, pt: 0, mt: 'auto' }}>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="caption" color="text.secondary" display="block">
                  Last synced: {formatDate(product.last_synced_at)}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  QuickBooks ID: {product.Id}
                </Typography>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };
  
  // Render list view (table)
  const renderListView = () => {
    return (
      <TableContainer component={Paper} sx={{ boxShadow: 2, borderRadius: 2 }}>
        <Table aria-label="products table">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Price</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Last Synced</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>QuickBooks ID</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {currentProducts.map((product) => (
              <TableRow key={product.Id} hover>
                <TableCell>{product.Name}</TableCell>
                <TableCell>{product.Type || 'N/A'}</TableCell>
                <TableCell>{formatCurrency(product.UnitPrice)}</TableCell>
                <TableCell>
                  <Chip 
                    label={product.Active ? 'Active' : 'Inactive'} 
                    color={product.Active ? 'success' : 'default'}
                    size="small"
                    variant={product.Active ? 'filled' : 'outlined'}
                  />
                </TableCell>
                <TableCell sx={{ maxWidth: 300, whiteSpace: 'normal', wordBreak: 'break-word' }}>
                  {product.Description || 'N/A'}
                </TableCell>
                <TableCell>{formatDate(product.last_synced_at)}</TableCell>
                <TableCell>{product.Id}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };
  
  return (
    <Box sx={{ maxWidth: '100%', overflowX: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Products
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Sync with QuickBooks">
            <Button 
              variant="outlined" 
              color="primary" 
              startIcon={<SyncIcon />}
              onClick={handleSyncProducts}
              disabled={syncing}
            >
              {syncing ? 'Syncing...' : 'Sync Products'}
            </Button>
          </Tooltip>
          
          <Tooltip title="Refresh list">
            <Button 
              variant="outlined" 
              color="primary" 
              startIcon={<RefreshIcon />}
              onClick={fetchProducts}
              disabled={loading}
            >
              Refresh
            </Button>
          </Tooltip>
          
          <Tooltip title={viewMode === 'grid' ? 'Switch to list view' : 'Switch to grid view'}>
            <IconButton onClick={toggleViewMode} color="primary">
              {viewMode === 'grid' ? <ViewListIcon /> : <ViewModuleIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={fetchProducts}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}
      
      {syncSuccess && (
        <Alert 
          severity={syncSuccess.success ? 'success' : 'error'} 
          sx={{ mb: 3 }}
          onClose={() => setSyncSuccess(null)}
        >
          {syncSuccess.message}
        </Alert>
      )}
      
      {/* Filters & Search */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              placeholder="Search products..."
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
          
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel id="status-filter-label">Status</InputLabel>
              <Select
                labelId="status-filter-label"
                id="status-filter"
                value={activeFilter}
                label="Status"
                onChange={(e) => setActiveFilter(e.target.value)}
              >
                <MenuItem value="all">All Products</MenuItem>
                <MenuItem value="active">Active Only</MenuItem>
                <MenuItem value="inactive">Inactive Only</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Statistics Cards */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Card sx={{ bgcolor: 'primary.50', border: 1, borderColor: 'primary.200' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Total Products
                </Typography>
                <Typography variant="h3">
                  {products.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Card sx={{ bgcolor: 'success.50', border: 1, borderColor: 'success.200' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Active Products
                </Typography>
                <Typography variant="h3">
                  {products.filter(p => p.Active === true).length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Card sx={{ bgcolor: 'grey.100', border: 1, borderColor: 'grey.300' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Inactive Products
                </Typography>
                <Typography variant="h3">
                  {products.filter(p => p.Active === false).length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
      
      {loading && products.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '30vh' }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {filteredProducts.length === 0 ? (
            <Alert 
              severity={searchTerm ? 'info' : 'warning'} 
              sx={{ mt: 2 }}
            >
              {searchTerm
                ? "No products matching your search criteria."
                : "No products available. Use the 'Sync Products' button to import products from QuickBooks."}
            </Alert>
          ) : (
            <>
              {/* Products Display (Grid or List view) */}
              <Box sx={{ mb: 3 }}>
                {viewMode === 'grid' ? renderGridView() : renderListView()}
              </Box>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <Pagination 
                    count={totalPages} 
                    page={page}
                    onChange={handleChangePage}
                    color="primary"
                  />
                </Box>
              )}
            </>
          )}
        </>
      )}
    </Box>
  );
};

export default ProductsPage;