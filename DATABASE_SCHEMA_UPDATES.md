# Database Schema Updates for Alert Workflow

## Alerts Table Updates

The `alerts` table needs the following columns added:

```sql
-- Add status column (default: 'pending')
ALTER TABLE alerts 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' 
CHECK (status IN ('pending', 'assigned', 'completed', 'rejected'));

-- Add assigned_to column (user ID of the field officer)
ALTER TABLE alerts 
ADD COLUMN IF NOT EXISTS assigned_to TEXT;

-- Add assigned_at timestamp
ALTER TABLE alerts 
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITH TIME ZONE;

-- Add completed_at timestamp
ALTER TABLE alerts 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Update existing alerts to have 'pending' status if null
UPDATE alerts SET status = 'pending' WHERE status IS NULL;
```

## Workflow States

1. **pending**: Alert created by citizen, awaiting admin review
2. **assigned**: Admin has accepted and assigned to a field officer
3. **completed**: Field officer has found the person and marked as done
4. **rejected**: Admin has rejected the alert as false positive

## Role Permissions

- **Citizen**: Can only create alerts (via photo upload)
- **Admin/Case Manager**: Can view all alerts, assign to investigators, or reject
- **Investigator**: Can view assigned alerts and mark as completed

