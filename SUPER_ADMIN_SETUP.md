# Super Admin System Setup

This document explains how to set up and use the super admin system in BabyShoot AI.

## Overview

The super admin system provides administrative capabilities for managing themes, users, and system settings. There are three user roles:

- **User**: Regular users who can create photoshoots
- **Admin**: Can manage themes and view system analytics  
- **Super Admin**: Full access to all admin features including user management

## Database Setup

1. Run the database migration to add the role system:

```sql
-- This migration is in: supabase/migrations/20250928_add_admin_role.sql
-- It adds the role column and necessary RLS policies
```

2. Apply the migration to your Supabase database.

## Making a User Super Admin

### Method 1: Using the Script (Recommended)

```bash
# Make a user super admin by email
node scripts/make-super-admin.js user@example.com
```

### Method 2: Direct Database Update

```sql
UPDATE users 
SET role = 'super_admin' 
WHERE email = 'your-email@example.com';
```

## Features

### Super Admin Dashboard (`/admin`)

- **System Overview**: View total users, sessions, and themes
- **Quick Actions**: Access to all admin functions
- **Recent Activity**: Monitor recent photoshoot sessions
- **Theme Preview**: View active themes

### Theme Management (`/admin/themes`)

**Capabilities:**
- ✅ Create new themes with custom AI prompts
- ✅ Edit existing theme details and prompts
- ✅ Toggle theme active/inactive status
- ✅ Organize themes by category and session type
- ✅ Support for child, family, or universal themes

**Theme Properties:**
- Name and description
- AI generation prompt
- Category (newborn, toddler, family, etc.)
- Session type (child, family, both)
- Active status

### User Management (`/admin/users`) - Super Admin Only

**Capabilities:**
- ✅ View all registered users
- ✅ Change user roles (user → admin → super admin)
- ✅ View user statistics and join dates
- ✅ Protected against self-demotion

## Access Control

### Route Protection

All admin routes are protected by middleware that checks user roles:

```typescript
// Admin access required
await requireAdmin(userId)

// Super admin access required  
await requireSuperAdmin(userId)
```

### Database Security

Row Level Security (RLS) policies ensure:
- Admins can only access admin-specific data
- Users can only access their own data
- Theme management is restricted to admins
- User management is restricted to super admins

### UI Integration

- Admin button appears in dashboard header for admin users
- Role-based navigation and feature access
- Visual indicators for admin status

## API Endpoints

### Theme Management
- `POST /api/admin/themes` - Create new theme
- `PUT /api/admin/themes/[id]` - Update theme
- `POST /api/admin/themes/toggle` - Toggle theme status
- `DELETE /api/admin/themes/[id]` - Soft delete theme

### User Management (Super Admin Only)
- `POST /api/admin/users/update-role` - Update user role

## Security Considerations

1. **Role Hierarchy**: Super Admin > Admin > User
2. **Self-Protection**: Users cannot demote themselves
3. **Audit Trail**: All admin actions should be logged
4. **Access Validation**: Every admin action validates permissions
5. **Database Policies**: RLS ensures data isolation

## Usage Examples

### Creating a New Theme

1. Navigate to `/admin/themes`
2. Click "Add New Theme"
3. Fill in theme details:
   - Name: "Magical Unicorn Adventure"
   - Description: "Whimsical unicorn-themed photoshoot"
   - Category: "fantasy"
   - Session Type: "child"
   - AI Prompt: "magical unicorn setting with rainbow colors, sparkles, and enchanted forest background"
4. Save the theme

### Managing User Roles

1. Navigate to `/admin/users` (Super Admin only)
2. Find the user in the table
3. Use the role dropdown to change their role
4. Changes take effect immediately

## Troubleshooting

### Admin Button Not Showing
- Check user role in database: `SELECT role FROM users WHERE email = 'your-email'`
- Ensure migration was applied correctly
- Verify RLS policies are active

### Permission Denied Errors
- Confirm user has correct role for the action
- Check if RLS policies are properly configured
- Verify admin utility functions are working

### Theme Not Appearing for Users
- Check if theme `is_active = true`
- Verify theme `session_type` matches user's session type
- Ensure theme has all required fields

## Development Notes

- Admin routes are in `/app/admin/`
- Admin components are in `/components/admin/`
- Admin utilities are in `/lib/admin-utils.ts`
- All admin APIs require authentication and role validation

## Future Enhancements

Potential additions to the admin system:
- Analytics dashboard with charts and metrics
- Bulk theme operations
- User activity monitoring
- System configuration settings
- Email notification management
- Content moderation tools
