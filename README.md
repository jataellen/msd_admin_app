# MSD Admin App

A comprehensive order management system for materials and installation workflows.

## Project Structure

```
msd_admin_app/
├── backend/                    # FastAPI backend server
│   ├── database_schema.sql     # Complete database schema
│   ├── reset_and_seed_orders_complete.sql  # Demo data setup
│   ├── main.py                 # FastAPI application entry point
│   ├── database.py             # Supabase database connection
│   ├── auth.py                 # Authentication utilities
│   ├── models/                 # Pydantic data models
│   ├── routes/                 # API route handlers
│   ├── resources/              # Business logic and constants
│   ├── clients/                # External service clients (QuickBooks)
│   ├── migrations/             # Database migration files
│   └── requirements.txt        # Python dependencies
├── frontend/                   # React frontend application  
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Page-level components
│   │   ├── context/            # React context providers
│   │   ├── services/           # API service layers
│   │   └── utils/              # Utility functions
│   ├── package.json            # Node.js dependencies
│   └── README.md               # Frontend documentation
└── flow.txt                    # Business workflow documentation
```

## Features

### Order Management
- **Dual Workflow Support**: Materials Only vs Materials & Installation
- **Status Tracking**: Complete workflow status progression
- **Event Timeline**: Comprehensive order history with events
- **Customer Management**: Residential and commercial customers

### Workflow Stages
1. **Lead Acquisition** - Initial customer contact and site visits
2. **Quotation** - Quote preparation and approval process  
3. **Procurement** - Purchase orders and material sourcing
4. **Fulfillment** - Delivery and installation management
5. **Finalization** - Invoicing and project completion

### Integrations
- **QuickBooks** - Product catalog and accounting integration
- **Supabase** - Database, authentication, and real-time updates

## Technology Stack

### Backend
- **FastAPI** - Modern Python web framework
- **Supabase** - PostgreSQL database with real-time capabilities
- **Pydantic** - Data validation and serialization
- **Python 3.11+** - Runtime environment

### Frontend  
- **React 18** - Modern UI framework
- **Material-UI** - Component library
- **Axios** - HTTP client for API calls
- **Context API** - State management

### Database
- **PostgreSQL** - Primary database with Supabase
- **Row Level Security** - Authentication-based data access
- **Triggers** - Automatic timestamp updates
- **Enums** - Type-safe status management

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 16+
- Supabase account and project

### Backend Setup
```bash
cd backend
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Set up database schema
# Run database_schema.sql in your Supabase SQL Editor

# Seed demo data (optional)
# Run reset_and_seed_orders_complete.sql in Supabase

# Start the server
python -m uvicorn main:app --reload
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

## API Documentation

When the backend is running, visit:
- **API Docs**: http://localhost:8000/docs (Swagger UI)
- **Alternative Docs**: http://localhost:8000/redoc

## Database Management

### Schema Management
- Use `database_schema.sql` for fresh database setup
- Use migration files in `migrations/` for incremental updates

### Demo Data
- Run `reset_and_seed_orders_complete.sql` to populate with realistic demo orders
- Creates 5 orders at different workflow stages with complete event histories

## Development Workflow

### Adding New Features
1. Update database schema in `database_schema.sql`
2. Create migration files in `migrations/` for existing databases
3. Update Pydantic models in `backend/models/`
4. Add API routes in `backend/routes/`
5. Create/update React components in `frontend/src/`

### Database Changes
1. Update `database_schema.sql` with new schema
2. Create incremental migration in `migrations/`
3. Test with demo data using seed scripts
4. Update models and API endpoints

## Configuration

### Environment Variables
```bash
# Backend (.env)
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_JWT_SECRET=your_jwt_secret
SUPABASE_BUCKET=your_storage_bucket

# QuickBooks (optional)
QB_CLIENT_ID=your_quickbooks_app_id
QB_CLIENT_SECRET=your_quickbooks_app_secret
```

## Contributing

1. Create feature branches from `main`
2. Follow existing code organization patterns
3. Update documentation for new features
4. Test with demo data before submitting PRs

## License

Private project - All rights reserved