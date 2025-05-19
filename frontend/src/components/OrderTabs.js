// src/pages/OrderDetail/OrderTabs.js
import React from 'react';
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Typography,
  Button,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Chip,
  Tooltip,
  Avatar,
  Card,
  CardHeader,
  CardContent,
  Divider,
  Grid,
  Stack,
  Alert,
  useTheme
} from '@mui/material';

import {
  Assignment as AssignmentIcon,
  Description as DescriptionIcon,
  ShoppingCart as ShoppingCartIcon,
  Receipt as ReceiptIcon,
  People as PeopleIcon,
  Timeline as TimelineIcon,
  History as HistoryIcon,
  Info as InfoIcon,
  Add as AddIcon,
  Sync as SyncIcon,
  CalendarToday as CalendarIcon,
  LocalShipping as ShippingIcon
} from '@mui/icons-material';

// Import components
import TabPanel from './TabPanel';
import OrderTracking from '../components/OrderTracking';
import OrderHistoryTimeline from '../components/OrderHistoryTimeline';

// Import formatters
import { formatDate, formatCurrency, getStatusColor, getPriorityColor } from '../utils/formatters';

const OrderTabs = ({ 
  tabValue, 
  handleTabChange, 
  order, 
  tasks, 
  quotes, 
  purchaseOrders, 
  invoices, 
  teamMembers, 
  orderId, 
  navigate, 
  onAddTask 
}) => {
  const theme = useTheme();

  // Get avatar letter for team members
  const getAvatarLetter = (firstName, lastName) => {
    if (firstName && firstName.length > 0) {
      return firstName.charAt(0);
    } else if (lastName && lastName.length > 0) {
      return lastName.charAt(0);
    }
    return 'U';
  };

  // Get avatar color based on role
  const getAvatarColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'manager':
        return theme.palette.primary.main;
      case 'technician':
        return theme.palette.secondary.main;
      case 'engineer':
        return theme.palette.info.main;
      case 'sales':
        return theme.palette.success.main;
      case 'support':
        return theme.palette.warning.main;
      default:
        return theme.palette.grey[500];
    }
  };

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        width: '100%', 
        mb: 3, 
        borderRadius: 2,
        overflow: 'hidden'
      }}
    >
      <Box sx={{ 
        borderBottom: 1, 
        borderColor: 'divider',
        backgroundColor: theme.palette.grey[50]
      }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="order tabs"
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              minHeight: 64,
              textTransform: 'none',
              fontSize: '0.95rem',
              fontWeight: 500
            }
          }}
        >
          <Tab 
            label="Tasks" 
            icon={<AssignmentIcon />} 
            iconPosition="start" 
            sx={{ py: 2 }}
          />
          <Tab 
            label="Tracking" 
            icon={<TimelineIcon />} 
            iconPosition="start"
            sx={{ py: 2 }}
          />
          <Tab 
            label="History" 
            icon={<HistoryIcon />} 
            iconPosition="start"
            sx={{ py: 2 }}
          />
          <Tab 
            label="Quotes" 
            icon={<DescriptionIcon />} 
            iconPosition="start"
            sx={{ py: 2 }}
          />
          <Tab 
            label="Purchase Orders" 
            icon={<ShoppingCartIcon />} 
            iconPosition="start"
            sx={{ py: 2 }}
          />
          <Tab 
            label="Invoices" 
            icon={<ReceiptIcon />} 
            iconPosition="start"
            sx={{ py: 2 }}
          />
          <Tab 
            label="Team" 
            icon={<PeopleIcon />} 
            iconPosition="start"
            sx={{ py: 2 }}
          />
        </Tabs>
      </Box>
      
      {/* Tasks Tab */}
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 2 
        }}>
          <Typography variant="h6">Task List</Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={onAddTask}
          >
            Add Task
          </Button>
        </Box>
        
        {tasks.length > 0 ? (
          <TableContainer 
            component={Paper} 
            variant="outlined" 
            sx={{ 
              maxHeight: 500,
              borderRadius: 2
            }}
          >
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Title</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Priority</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Assigned To</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Due Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow 
                    key={task.task_id} 
                    hover
                    sx={{
                      '&:last-child td, &:last-child th': { border: 0 },
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover,
                      }
                    }}
                    onClick={() => navigate(`/tasks/${task.task_id}`)}
                  >
                    <TableCell>#{task.task_id}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        {task.title}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={task.status} 
                        color={getStatusColor(task.status)}
                        size="small"
                        sx={{ fontWeight: 500 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={task.priority} 
                        color={getPriorityColor(task.priority)}
                        size="small"
                        variant="outlined"
                        sx={{ fontWeight: 500 }}
                      />
                    </TableCell>
                    <TableCell>{task.assigned_to || 'N/A'}</TableCell>
                    <TableCell>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center'
                      }}>
                        <CalendarIcon 
                          fontSize="small" 
                          sx={{ 
                            mr: 0.5,
                            color: theme.palette.text.secondary,
                            fontSize: '1rem'
                          }} 
                        />
                        {formatDate(task.due_date)}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Task">
                        <IconButton 
                          size="small" 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/tasks/${task.task_id}`);
                          }}
                          sx={{ 
                            bgcolor: theme.palette.grey[100],
                            '&:hover': {
                              bgcolor: theme.palette.grey[200]
                            }
                          }}
                        >
                          <InfoIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Paper 
            variant="outlined" 
            sx={{ 
              p: 4, 
              textAlign: 'center',
              borderRadius: 2,
              backgroundColor: theme.palette.grey[50]
            }}
          >
            <Typography color="text.secondary" gutterBottom>
              No tasks found for this order.
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />} 
              sx={{ mt: 2 }}
              onClick={onAddTask}
            >
              Add First Task
            </Button>
          </Paper>
        )}
      </TabPanel>
      
      {/* Tracking Tab */}
      <TabPanel value={tabValue} index={1}>
        <OrderTracking orderId={parseInt(orderId)} orderData={order} />
      </TabPanel>
      
      {/* History Tab */}
      <TabPanel value={tabValue} index={2}>
        <OrderHistoryTimeline orderId={parseInt(orderId)} />
      </TabPanel>
      
      {/* Quotes Tab */}
      <TabPanel value={tabValue} index={3}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 2 
        }}>
          <Typography variant="h6">Quotes</Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => navigate(`/quotes/add?order_id=${orderId}`)}
          >
            Create Quote
          </Button>
        </Box>
        
        {quotes.length > 0 ? (
          <TableContainer 
            component={Paper} 
            variant="outlined" 
            sx={{ 
              maxHeight: 500,
              borderRadius: 2
            }}
          >
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Version</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Issue Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Valid Until</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {quotes.map((quote) => (
                  <TableRow 
                    key={quote.quote_id} 
                    hover
                    sx={{
                      '&:last-child td, &:last-child th': { border: 0 },
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover,
                      }
                    }}
                    onClick={() => navigate(`/quotes/${quote.quote_id}`)}
                  >
                    <TableCell>#{quote.quote_id}</TableCell>
                    <TableCell>v{quote.version}</TableCell>
                    <TableCell>
                      <Chip 
                        label={quote.status} 
                        color={
                          quote.status === 'Accepted' ? 'success' : 
                          quote.status === 'Sent' ? 'info' : 
                          quote.status === 'Rejected' ? 'error' : 'default'
                        }
                        size="small"
                        sx={{ fontWeight: 500 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center'
                      }}>
                        <CalendarIcon 
                          fontSize="small" 
                          sx={{ 
                            mr: 0.5,
                            color: theme.palette.text.secondary,
                            fontSize: '1rem'
                          }} 
                        />
                        {formatDate(quote.issue_date)}
                      </Box>
                    </TableCell>
                    <TableCell>{formatDate(quote.valid_until)}</TableCell>
                    <TableCell sx={{ fontWeight: 'medium' }}>
                      {formatCurrency(quote.total_amount)}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Quote">
                        <IconButton 
                          size="small" 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/quotes/${quote.quote_id}`);
                          }}
                          sx={{ 
                            bgcolor: theme.palette.grey[100],
                            '&:hover': {
                              bgcolor: theme.palette.grey[200]
                            }
                          }}
                        >
                          <InfoIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Paper 
            variant="outlined" 
            sx={{ 
              p: 4, 
              textAlign: 'center',
              borderRadius: 2,
              backgroundColor: theme.palette.grey[50]
            }}
          >
            <Typography color="text.secondary" gutterBottom>
              No quotes found for this order.
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />} 
              sx={{ mt: 2 }}
              onClick={() => navigate(`/quotes/add?order_id=${orderId}`)}
            >
              Create First Quote
            </Button>
          </Paper>
        )}
      </TabPanel>
      
      {/* Purchase Orders Tab */}
      <TabPanel value={tabValue} index={4}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 2 
        }}>
          <Typography variant="h6">Purchase Orders</Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => navigate(`/purchase-orders/add?order_id=${orderId}`)}
          >
            Create PO
          </Button>
        </Box>
        
        {purchaseOrders.length > 0 ? (
          <TableContainer 
            component={Paper} 
            variant="outlined" 
            sx={{ 
              maxHeight: 500,
              borderRadius: 2
            }}
          >
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>PO Number</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Supplier</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Issue Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Expected Delivery</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {purchaseOrders.map((po) => (
                  <TableRow 
                    key={po.po_id} 
                    hover
                    sx={{
                      '&:last-child td, &:last-child th': { border: 0 },
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover,
                      }
                    }}
                    onClick={() => navigate(`/purchase-orders/${po.po_id}`)}
                  >
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        {po.po_number || `PO-${po.po_id}`}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={po.status} 
                        color={
                          po.status === 'Delivered' ? 'success' : 
                          po.status === 'Ordered' ? 'info' : 
                          po.status === 'Cancelled' ? 'error' : 'default'
                        }
                        size="small"
                        sx={{ fontWeight: 500 }}
                      />
                    </TableCell>
                    <TableCell>{po.supplier_id}</TableCell>
                    <TableCell>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center'
                      }}>
                        <CalendarIcon 
                          fontSize="small" 
                          sx={{ 
                            mr: 0.5,
                            color: theme.palette.text.secondary,
                            fontSize: '1rem'
                          }} 
                        />
                        {formatDate(po.issue_date)}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center'
                      }}>
                        <ShippingIcon 
                          fontSize="small" 
                          sx={{ 
                            mr: 0.5,
                            color: theme.palette.text.secondary,
                            fontSize: '1rem'
                          }} 
                        />
                        {formatDate(po.expected_delivery_date)}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'medium' }}>
                      {formatCurrency(po.total_amount)}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Purchase Order">
                        <IconButton 
                          size="small" 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/purchase-orders/${po.po_id}`);
                          }}
                          sx={{ 
                            bgcolor: theme.palette.grey[100],
                            '&:hover': {
                              bgcolor: theme.palette.grey[200]
                            }
                          }}
                        >
                          <InfoIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Paper 
            variant="outlined" 
            sx={{ 
              p: 4, 
              textAlign: 'center',
              borderRadius: 2,
              backgroundColor: theme.palette.grey[50]
            }}
          >
            <Typography color="text.secondary" gutterBottom>
              No purchase orders found for this order.
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />} 
              sx={{ mt: 2 }}
              onClick={() => navigate(`/purchase-orders/add?order_id=${orderId}`)}
            >
              Create Purchase Order
            </Button>
          </Paper>
        )}
      </TabPanel>
      
      {/* Invoices Tab */}
      <TabPanel value={tabValue} index={5}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 2 
        }}>
          <Typography variant="h6">Invoices</Typography>
          <Stack direction="row" spacing={1}>
            <Button 
              variant="outlined" 
              startIcon={<SyncIcon />}
              onClick={() => navigate(`/quickbooks/push/invoice/${orderId}`)}
            >
              Generate QuickBooks Invoice
            </Button>
            {order.status === 'Completed' && (
              <Button 
                variant="contained" 
                startIcon={<AddIcon />}
                onClick={() => navigate(`/invoices/add?order_id=${orderId}`)}
              >
                Create Invoice
              </Button>
            )}
          </Stack>
        </Box>
        
        {invoices.length > 0 ? (
          <TableContainer 
            component={Paper} 
            variant="outlined" 
            sx={{ 
              maxHeight: 500,
              borderRadius: 2
            }}
          >
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Invoice #</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Date Issued</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Due Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Total Amount</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Balance Due</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow 
                    key={invoice.invoice_id} 
                    hover
                    sx={{
                      '&:last-child td, &:last-child th': { border: 0 },
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover,
                      },
                      ...(invoice.status === 'Overdue' && {
                        backgroundColor: theme.palette.error.light,
                        '&:hover': {
                          backgroundColor: theme.palette.error.light,
                        }
                      })
                    }}
                    onClick={() => navigate(`/invoices/${invoice.invoice_id}`)}
                  >
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        {invoice.invoice_number || `INV-${invoice.invoice_id}`}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={invoice.status} 
                        color={
                          invoice.status === 'Paid' ? 'success' : 
                          invoice.status === 'Open' ? 'warning' : 
                          invoice.status === 'Overdue' ? 'error' : 'default'
                        }
                        size="small"
                        sx={{ fontWeight: 500 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center'
                      }}>
                        <CalendarIcon 
                          fontSize="small" 
                          sx={{ 
                            mr: 0.5,
                            color: theme.palette.text.secondary,
                            fontSize: '1rem'
                          }} 
                        />
                        {formatDate(invoice.date_issued)}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        color: new Date(invoice.due_date) < new Date() && invoice.status !== 'Paid' ? 
                          theme.palette.error.main : 'inherit'
                      }}>
                        <CalendarIcon 
                          fontSize="small" 
                          sx={{ 
                            mr: 0.5,
                            color: new Date(invoice.due_date) < new Date() && invoice.status !== 'Paid' ? 
                              theme.palette.error.main : theme.palette.text.secondary,
                            fontSize: '1rem'
                          }} 
                        />
                        {formatDate(invoice.due_date)}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'medium' }}>
                      {formatCurrency(invoice.total_amount)}
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 'medium',
                      color: invoice.balance_due > 0 ? theme.palette.error.main : theme.palette.success.main
                    }}>
                      {formatCurrency(invoice.balance_due)}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Invoice">
                        <IconButton 
                          size="small" 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/invoices/${invoice.invoice_id}`);
                          }}
                          sx={{ 
                            bgcolor: theme.palette.grey[100],
                            '&:hover': {
                              bgcolor: theme.palette.grey[200]
                            }
                          }}
                        >
                          <InfoIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Paper 
            variant="outlined" 
            sx={{ 
              p: 4, 
              textAlign: 'center',
              borderRadius: 2,
              backgroundColor: theme.palette.grey[50]
            }}
          >
            <Typography color="text.secondary" gutterBottom>
              No invoices found for this order.
            </Typography>
            {order.status === 'Completed' ? (
              <Button 
                variant="contained" 
                startIcon={<AddIcon />} 
                sx={{ mt: 2 }}
                onClick={() => navigate(`/invoices/add?order_id=${orderId}`)}
              >
                Create Invoice
              </Button>
            ) : (
              <Alert 
                severity="info" 
                sx={{ mt: 2, maxWidth: 500, mx: 'auto' }}
              >
                Order must be completed before creating an invoice.
              </Alert>
            )}
          </Paper>
        )}
      </TabPanel>
      
      {/* Team Tab */}
      <TabPanel value={tabValue} index={6}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 2 
        }}>
          <Typography variant="h6">Team Members</Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => navigate(`/orders/${orderId}/team/add`)}
          >
            Add Team Member
          </Button>
        </Box>
        
        {teamMembers.length > 0 ? (
          <Grid container spacing={2}>
            {teamMembers.map((member) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={member.employee_id || member.id}>
                <Card 
                  elevation={1}
                  sx={{ 
                    borderRadius: 2,
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4
                    },
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <CardHeader
                    avatar={
                      <Avatar 
                        sx={{ 
                          bgcolor: getAvatarColor(member.role),
                          width: 56,
                          height: 56,
                          fontSize: '1.5rem',
                          fontWeight: 'bold'
                        }}
                      >
                        {getAvatarLetter(member.first_name, member.last_name)}
                      </Avatar>
                    }
                    title={
                      <Typography variant="h6" component="div">
                        {`${member.first_name || ''} ${member.last_name || ''}`.trim() || 'N/A'}
                      </Typography>
                    }
                    subheader={
                      <Chip 
                        label={member.role || 'Team Member'} 
                        color="primary" 
                        variant="outlined"
                        size="small"
                      />
                    }
                    action={
                      <IconButton 
                        aria-label="settings"
                        onClick={() => navigate(`/employees/${member.employee_id}`)}
                      >
                        <InfoIcon />
                      </IconButton>
                    }
                  />
                  <Divider />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Email
                      </Typography>
                      <Typography variant="body2">
                        {member.email || 'N/A'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Phone
                      </Typography>
                      <Typography variant="body2">
                        {member.phone || 'N/A'}
                      </Typography>
                    </Box>
                  </CardContent>
                  <Box sx={{ p: 2, pt: 0 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      size="small"
                      onClick={() => navigate(`/employees/${member.employee_id}`)}
                      sx={{ borderRadius: 2 }}
                    >
                      View Profile
                    </Button>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Paper 
            variant="outlined" 
            sx={{ 
              p: 4, 
              textAlign: 'center',
              borderRadius: 2,
              backgroundColor: theme.palette.grey[50]
            }}
          >
            <Typography color="text.secondary" gutterBottom>
              No team members assigned to this order.
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />} 
              sx={{ mt: 2 }}
              onClick={() => navigate(`/orders/${orderId}/team/add`)}
            >
              Add Team Member
            </Button>
          </Paper>
        )}
      </TabPanel>
    </Paper>
  );
};

export default OrderTabs;