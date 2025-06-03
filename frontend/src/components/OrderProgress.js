// OrderProgress.js - Extracted progress overview component
import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Button,
  Stack
} from '@mui/material';
import {
  ArrowForward as ArrowForwardIcon,
  AddComment as AddCommentIcon,
  RadioButtonChecked as ActiveIcon
} from '@mui/icons-material';

const OrderProgress = ({ 
  order, 
  progress, 
  currentStatus, 
  currentStage, 
  lastActivity,
  onCompleteStep,
  onAddNote,
  formatDate
}) => {
  if (!order) return null;

  return (
    <Card 
      variant="outlined" 
      sx={{ 
        mb: 3, 
        borderRadius: 2,
        border: '2px solid',
        borderColor: 'primary.light',
        overflow: 'visible'
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
              Order Progress
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Currently in <strong>{currentStage?.name || 'Unknown'}</strong> stage
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }}>
              {progress}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Complete
            </Typography>
          </Box>
        </Box>
        
        <LinearProgress 
          variant="determinate" 
          value={progress} 
          sx={{ 
            height: 12, 
            borderRadius: 6,
            backgroundColor: 'grey.200',
            mb: 3,
            '& .MuiLinearProgress-bar': {
              borderRadius: 6,
              background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)'
            }
          }} 
        />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Current Status
            </Typography>
            <Chip 
              icon={<ActiveIcon />}
              label={currentStatus?.name || 'Not Started'} 
              color="primary"
              sx={{ fontWeight: 600 }}
            />
          </Box>
          
          {lastActivity && (
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Last Activity
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {formatDate ? formatDate(lastActivity) : lastActivity}
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
      
      {/* Action Buttons */}
      {(onCompleteStep || onAddNote) && (
        <Box sx={{ 
          px: 3, 
          pb: 2, 
          display: 'flex', 
          gap: 1,
          borderTop: '1px solid',
          borderColor: 'divider',
          pt: 2
        }}>
          {onCompleteStep && (
            <Button
              variant="contained"
              startIcon={<ArrowForwardIcon />}
              onClick={onCompleteStep}
              size="small"
            >
              Complete Current Step
            </Button>
          )}
          {onAddNote && (
            <Button
              variant="outlined"
              startIcon={<AddCommentIcon />}
              onClick={onAddNote}
              size="small"
            >
              Add Note
            </Button>
          )}
        </Box>
      )}
    </Card>
  );
};

export default OrderProgress;