# MSD Admin App - Supabase Auth Database Setup

This guide sets up the database to work with Supabase's existing authentication system.

## Key Differences from Custom Auth

1. **No custom `users` table** - We use Supabase's `auth.users` table
2. **User profiles table** - Extends `auth.users` with app-specific fields
3. **All user references** - Point to `auth.users(id)` instead of custom table

## Setup Steps

### 1. Create the Database Schema

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Open `create_database_supabase_auth.sql`
4. Copy and paste the entire contents
5. Click **Run**

This creates all tables while respecting Supabase's auth system.

### 2. Add RLS Policies and Functions

1. Still in SQL Editor
2. Open `create_rls_policies_and_functions.sql`
3. Copy and paste the contents
4. Click **Run**

### 3. Create Test Users (Important!)

Since we're using Supabase Auth, you need to create users through Supabase first:

#### Option A: Using Supabase Dashboard
1. Go to **Authentication** → **Users**
2. Click **Add user** → **Create new user**
3. Create users with these credentials:
   - Email: `admin@msdapp.com`, Password: `password123`
   - Email: `shaun@msdapp.com`, Password: `password123`
   - Email: `lauren@msdapp.com`, Password: `password123`
   - Email: `luc@msdapp.com`, Password: `password123`
4. Note down the User UID for each user

#### Option B: Using SQL (Recommended)
Run this in SQL Editor to create users programmatically:

```sql
-- Create test users
SELECT auth.admin_create_user(
  '{"email": "admin@msdapp.com", "password": "password123", "email_confirm": true}'
);

SELECT auth.admin_create_user(
  '{"email": "shaun@msdapp.com", "password": "password123", "email_confirm": true}'
);

SELECT auth.admin_create_user(
  '{"email": "lauren@msdapp.com", "password": "password123", "email_confirm": true}'
);

SELECT auth.admin_create_user(
  '{"email": "luc@msdapp.com", "password": "password123", "email_confirm": true}'
);
```

### 4. Load Seed Data

1. Get the User UIDs from the previous step
2. Open `seed_data_supabase_auth.sql`
3. Replace the placeholder UUID with your actual user IDs:
   ```sql
   -- Replace this line:
   ('92a09eef-0889-46f5-b2a3-f948ce383fc0', 'Admin User', 'admin'),
   
   -- With your actual user IDs:
   ('your-admin-user-id', 'Admin User', 'admin'),
   ('your-shaun-user-id', 'Shaun Manager', 'manager'),
   -- etc...
   ```
4. Also update the `employees` table inserts to link to the correct user IDs
5. Run the modified seed data SQL

### 5. Set Up Your Application

Update your backend authentication to use Supabase:

```python
# In your auth.py or similar
from supabase import create_client, Client

supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

# Login example
def login(email: str, password: str):
    response = supabase.auth.sign_in_with_password({
        "email": email,
        "password": password
    })
    return response.user, response.session
```

### 6. Update Python Models

The models need to reference `auth.users` instead of a custom users table:

```python
class Employee(BaseModel):
    employee_id: UUID
    user_id: Optional[UUID]  # References auth.users(id)
    full_name: str
    email: str
    # ... other fields
```

## RLS Policy Considerations

Since we're using Supabase Auth, the RLS policies use these functions:

- `auth.uid()` - Gets the current user's ID
- `auth.jwt()` - Gets the full JWT claims

You may need to update the RLS policies based on how you store roles:

```sql
-- Example: Check if user is admin based on user_profiles table
CREATE OR REPLACE FUNCTION auth.is_admin() 
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
$$ LANGUAGE SQL STABLE;
```

## Testing the Setup

1. **Test Authentication**:
   ```bash
   curl -X POST 'YOUR_SUPABASE_URL/auth/v1/token?grant_type=password' \
     -H "apikey: YOUR_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{"email": "admin@msdapp.com", "password": "password123"}'
   ```

2. **Verify User Profile**:
   - Check the `user_profiles` table
   - Should see entries for your created users

3. **Check Employee Records**:
   - Verify employees are linked to users correctly
   - Test users should be able to query their own employee record

## Common Issues

### "User not found" errors
- Make sure you created users in Supabase Auth first
- Verify email confirmation is enabled

### RLS policy violations
- Check that user_profiles entries exist for all auth users
- Verify the role is set correctly in user_profiles

### Foreign key constraints
- Always create auth.users entries before referencing them
- Use NULL for user_id in employees table if user doesn't exist yet

## Next Steps

1. Configure your application to use Supabase Auth
2. Update API endpoints to get user from JWT
3. Test the complete authentication flow
4. Set up email templates in Supabase for password reset, etc.