import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Chip, 
  Button, 
  Divider, 
  Grid,
  useTheme,
  Card,
  CardContent,
  Avatar,
  LinearProgress
} from '@mui/material';
import {
  Edit as EditIcon,
  Assignment as AssignmentIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  Description as DescriptionIcon,
  Notes as NotesIcon,
  AccountBox as ManagerIcon,
  FileCopy as ContractIcon,
  Info as InfoIcon,
  Timeline as TimelineIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import { formatDate, getStageColor, getPriorityColor } from '../utils/formatters';

const OrderHeader = ({ order, isMobile, onEdit, onAddTask }) => {
  const theme = useTheme();
  
  return (
    <>
      {/* Main Header Card */}
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 2,
          background: theme.palette.background.paper,
          borderLeft: `5px solid ${theme.palette[getStageColor(order.current_stage)]?.main || theme.palette.primary.main}`,
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row', 
          justifyContent: 'space-between', 
          alignItems: isMobile ? 'flex-start' : 'flex-start',
          mb: 3
        }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography 
                variant="h4" 
                component="h1" 
                gutterBottom={false}
                sx={{ fontWeight: 'bold', fontSize: '3rem', marginBottom: '20px' }}
              >
                {order.order_name}
              </Typography>
            </Box>
            
            {/* Stage and Priority moved here, right under the title */}
            <Box sx={{ mt: 1, mb: 1.5 }}>
              <Chip 
                label={order.current_stage} 
                color={getStageColor(order.current_stage)}
                sx={{ fontSize: '0.85rem', fontWeight: 500, px: 1 }}
              />
              {order.priority && (
                <Chip 
                  label={order.priority} 
                  color={getPriorityColor(order.priority)}
                  variant="outlined"
                  sx={{ ml: 1, fontSize: '0.85rem' }}
                />
              )}
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5, flexWrap: 'wrap' }}>
              <Typography 
                variant="subtitle1" 
                color="text.secondary"
                sx={{ display: 'flex', alignItems: 'center', mr: 2, my: 0.5 }}
              >
                <AssignmentIcon fontSize="small" sx={{ mr: 0.5 }} />
                Order #{order.order_id}
              </Typography>
              <Typography 
                variant="subtitle1" 
                color="text.secondary" 
                sx={{ display: 'flex', alignItems: 'center', mr: 2, my: 0.5 }}
              >
                <CalendarIcon fontSize="small" sx={{ mr: 0.5 }} />
                Created: {formatDate(order.created_at)}
              </Typography>
              
              {order.location && (
                <Typography 
                  variant="subtitle1" 
                  color="text.secondary" 
                  sx={{ display: 'flex', alignItems: 'center', mr: 2, my: 0.5 }}
                >
                  <LocationIcon fontSize="small" sx={{ mr: 0.5 }} />
                  {order.location}
                </Typography>
              )}
              
              {order.order_manager_id && (
                <Typography 
                  variant="subtitle1" 
                  color="text.secondary" 
                  sx={{ display: 'flex', alignItems: 'center', mr: 2, my: 0.5 }}
                >
                  <ManagerIcon fontSize="small" sx={{ mr: 0.5 }} />
                  Manager ID: {order.order_manager_id}
                </Typography>
              )}
              
              {order.contract_number && (
                <Typography 
                  variant="subtitle1" 
                  color="text.secondary" 
                  sx={{ display: 'flex', alignItems: 'center', my: 0.5 }}
                >
                  <ContractIcon fontSize="small" sx={{ mr: 0.5 }} />
                  Contract: {order.contract_number}
                </Typography>
              )}
            </Box>
          </Box>
          
          {/* Action buttons positioned in the top right */}
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: isMobile ? 'row' : 'column',
              alignItems: isMobile ? 'flex-start' : 'flex-end',
              gap: 1,
              minWidth: isMobile ? 'auto' : '170px',
              mt: isMobile ? 2 : 0,
              flexShrink: 0
            }}
          >
            <Button 
              variant="outlined" 
              color="primary"
              startIcon={<EditIcon />}
              onClick={onEdit}
              fullWidth={!isMobile}
              sx={{ borderRadius: 2 }}
            >
              Edit
            </Button>
          </Box>
        </Box>
        
        {/* Divider between header and details */}
        <Divider sx={{ mb: 3 }} />
        
        {/* Description & Notes - Improved layout */}
        {(order.description || order.notes) ? (
          <Grid container spacing={3}>
            {/* Description */}
            {order.description && (
              <Grid item xs={12} md={order.notes ? 6 : 12}>
                <Box 
                  sx={{ 
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: theme.palette.background.default,
                    borderLeft: `4px solid ${theme.palette.primary.main}`,
                    height: '100%',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                    <DescriptionIcon 
                      fontSize="small" 
                      sx={{ mr: 1, color: theme.palette.primary.main }} 
                    />
                    <Typography variant="subtitle1" fontWeight="medium">
                      Description
                    </Typography>
                  </Box>
                  <Typography variant="body1">
                    {order.description}
                  </Typography>
                </Box>
              </Grid>
            )}
            
            {/* Notes */}
            {order.notes && (
              <Grid item xs={12} md={order.description ? 6 : 12}>
                <Box 
                  sx={{ 
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: theme.palette.background.default,
                    borderLeft: `4px solid ${theme.palette.secondary.main}`,
                    height: '100%',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                    <NotesIcon 
                      fontSize="small" 
                      sx={{ mr: 1, color: theme.palette.secondary.main }} 
                    />
                    <Typography variant="subtitle1" fontWeight="medium">
                      Notes
                    </Typography>
                  </Box>
                  <Typography variant="body1">
                    {order.notes}
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        ) : (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            py: 3,
            backgroundColor: theme.palette.grey[50],
            borderRadius: 2
          }}>
            <InfoIcon sx={{ color: theme.palette.grey[400], fontSize: 40, mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              No description or notes available for this order
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Progress Card - Completely Separate */}
      <Card 
        elevation={2} 
        sx={{ 
          borderRadius: 2, 
          mb: 3,
          transition: 'all 0.3s'
        }}
      >
        <CardContent sx={{ p: 2 }}>
          {/* Modified Grid layout to ensure full width progress bar */}
          <Box sx={{ width: '100%' }}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: isMobile ? 'flex-start' : 'center',
              justifyContent: 'space-between', 
              mb: 2 
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: isMobile ? 2 : 0 }}>
                <Avatar sx={{ bgcolor: theme.palette.info.light, width: 40, height: 40, mr: 2 }}>
                  <TimelineIcon fontSize="small" />
                </Avatar>
                <Typography variant="h6" color="text.secondary">
                  Progress
                </Typography>

                <Typography 
                  variant="h5" 
                  component="div" 
                  sx={{ 
                    fontWeight: 'bold', 
                    color: theme.palette.info.main,
                    mr: 3,
                    ml: 1
                  }}
                >
                  {order.progress_percentage !== null && order.progress_percentage !== undefined 
                    ? `${order.progress_percentage}%` 
                    : '0%'}
                </Typography>
              </Box>
              
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                justifyContent: 'space-between',
                width: isMobile ? '100%' : 'auto'
              }}>
                
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ display: 'flex', alignItems: 'center' }}
                >
                  <AccessTimeIcon fontSize="small" sx={{ mr: 0.5 }} />
                  Last Updated: {formatDate(order.updated_at)}
                </Typography>
              </Box>
            </Box>
            
            {/* Progress bar now takes full width of its container */}
            <LinearProgress 
              variant="determinate" 
              value={order.progress_percentage || 0} 
              color="info" 
              sx={{ 
                height: 10, 
                borderRadius: 5, 
                backgroundColor: theme.palette.grey[200],
                width: '100%'
              }}
            />
          </Box>
        </CardContent>
      </Card>
    </>
  );
};

export default OrderHeader;