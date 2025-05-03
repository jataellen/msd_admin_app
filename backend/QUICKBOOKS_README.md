# QuickBooks Integration

This directory contains code for integrating with QuickBooks Online. The current implementation uses mock data for development and testing purposes, while maintaining the code structure needed for a real integration in the future.

## Mock Integration

The mock integration is contained in the following files:

- `mock_quickbooks_data.py`: Contains sample data structures that mimic QuickBooks API responses
- `routes/quickbooks_routes.py`: API routes for QuickBooks integration using mock data

This allows you to develop and test the frontend components without an active QuickBooks connection.

## Using the Mock Integration

The mock integration provides the following endpoints:

- GET `/quickbooks/products`: Get all products from QuickBooks (mock)
- GET `/quickbooks/invoices`: Get all invoices with optional filtering (mock)
- GET `/quickbooks/invoice/{invoice_id}/items`: Get line items for a specific invoice (mock)
- GET `/quickbooks/customers`: Get all customers with QuickBooks ID info (mock)
- POST `/quickbooks/sync/products`: Trigger a mock sync of products
- POST `/quickbooks/sync/invoices`: Trigger a mock sync of invoices
- POST `/quickbooks/push/invoice/{project_id}`: Create a mock invoice for a project
- POST `/quickbooks/link-customer/{customer_id}`: Link a customer to a QuickBooks customer ID (mock)
- POST `/quickbooks/schedule-sync`: Schedule a regular sync with QuickBooks (mock)

## Converting to Real Integration

When you're ready to implement the real QuickBooks integration, you'll need to:

1. Register your application with QuickBooks Developer
2. Set up OAuth authentication flow
3. Replace mock data with real API calls
4. Update database operations to store and retrieve real data

### Required Environment Variables

For the real integration, you'll need to set the following environment variables:

```
QB_CLIENT_ID=your_client_id
QB_CLIENT_SECRET=your_client_secret
QB_REDIRECT_URI=your_redirect_uri
QB_ENVIRONMENT=sandbox_or_production
QB_COMPANY_ID=your_company_id
QB_REFRESH_TOKEN=your_refresh_token
```

### OAuth Implementation

The real integration will require implementing the OAuth flow:

1. Redirect users to QuickBooks authorization URL
2. Handle the callback with authorization code
3. Exchange code for access and refresh tokens
4. Store tokens securely
5. Refresh tokens automatically when needed

### Dependencies

To use the real QuickBooks API integration, you'll need to install:

```bash
pip install intuitlib
pip install python-quickbooks
```

## Reference Documentation

For the real integration, refer to:

- [QuickBooks API Developer Guide](https://developer.intuit.com/app/developer/qbo/docs/develop)
- [QuickBooks Python SDK](https://github.com/intuit/QuickBooks-V3-Python-SDK)
- [Intuit OAuth Library](https://github.com/intuit/oauth-pythonclient)