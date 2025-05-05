// src/services/orderEventsService.js
import axios from 'axios';

const API_URL = 'http://localhost:8000';

// Service for interacting with order events API
const orderEventsService = {
  // Get all events for an order
  getOrderEvents: async (orderId, limit = 50, skip = 0, eventType = null) => {
    try {
      let url = `${API_URL}/order-events/${orderId}?limit=${limit}&skip=${skip}`;
      
      if (eventType) {
        url += `&event_type=${eventType}`;
      }
      
      const response = await axios.get(url, { withCredentials: true });
      
      // Process the events to add display information
      if (response.data && Array.isArray(response.data)) {
        return response.data.map(event => {
          // Add a display name for the user
          if (event.user_email) {
            event.created_by_display = event.user_email;
          } else {
            // If we don't have the email, just use "User" + shortened UUID 
            const shortId = event.created_by ? event.created_by.substring(0, 8) : 'Unknown';
            event.created_by_display = `User ${shortId}`;
          }
          return event;
        });
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching order events:', error);
      throw error;
    }
  },

  // Create a new generic event
  createEvent: async (eventData) => {
    try {
      const response = await axios.post(
        `${API_URL}/order-events/`,
        eventData,
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating order event:', error);
      throw error;
    }
  },

  // Record a stage change
  recordStageChange: async (orderId, previousStage, newStage, notes = null) => {
    try {
      const response = await axios.post(
        `${API_URL}/order-events/${orderId}/stage-change`,
        { 
          previous_stage: previousStage, 
          new_stage: newStage, 
          notes 
        },
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      console.error('Error recording stage change:', error);
      throw error;
    }
  },

  // Add a note to an order
  addNote: async (orderId, note) => {
    try {
      const response = await axios.post(
        `${API_URL}/order-events/${orderId}/note`,
        { note },
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      console.error('Error adding note:', error);
      throw error;
    }
  },

  // Record a document event
  recordDocumentEvent: async (orderId, documentType, documentName, action, documentId = null) => {
    try {
      const response = await axios.post(
        `${API_URL}/order-events/${orderId}/document`,
        { 
          document_type: documentType, 
          document_name: documentName, 
          action, 
          document_id: documentId 
        },
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      console.error('Error recording document event:', error);
      throw error;
    }
  },

  // Record a payment event
  recordPaymentEvent: async (orderId, amount, paymentType, paymentMethod, reference = null) => {
    try {
      const response = await axios.post(
        `${API_URL}/order-events/${orderId}/payment`,
        { 
          amount, 
          payment_type: paymentType, 
          payment_method: paymentMethod, 
          reference 
        },
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      console.error('Error recording payment event:', error);
      throw error;
    }
  },
  
  // Format an event for display
  formatEventForDisplay: (event) => {
    if (!event) return null;
    
    // Add a display name for created_by (which is a UUID)
    let createdByDisplay = 'Unknown User';
    
    if (event.user_email) {
      createdByDisplay = event.user_email;
    } else if (event.created_by) {
      // If we don't have user_email, just use a shortened UUID
      createdByDisplay = `User ${event.created_by.substring(0, 8)}`;
    }
    
    return {
      ...event,
      created_by_display: createdByDisplay
    };
  }
};

export default orderEventsService;