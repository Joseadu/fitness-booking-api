-- ============================================
-- CREATE TEST NOTIFICATION
-- ============================================
-- Replace 'YOUR_USER_ID' with your actual profile ID from Supabase

-- First, get your user ID (run this first to find your ID)
SELECT id, full_name 
FROM profiles 
LIMIT 5;

-- Then, insert a test notification (replace the user_id value)
INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    data,
    channels,
    priority,
    delivery_status,
    delivered_at,
    action_url,
    action_label
) VALUES (
    'YOUR_USER_ID_HERE',  -- ⚠️ REPLACE THIS with your actual user ID
    'waitlist_available',
    '🎉 Spot Available!',
    'A spot has opened up in CrossFit Fundamentals on Monday at 6:00 PM. Book now!',
    '{"class_id": "123", "class_name": "CrossFit Fundamentals", "date": "2026-02-03"}'::jsonb,
    ARRAY['in_app', 'email'],
    'high',
    'sent',
    NOW(),
    '/bookings/available-classes',
    'Book Now'
);

-- Verify the notification was created
SELECT 
    id,
    type,
    title,
    message,
    read_at,
    delivery_status,
    created_at
FROM notifications
ORDER BY created_at DESC
LIMIT 5;

-- ============================================
-- CLEANUP (run this to delete test notifications)
-- ============================================
-- DELETE FROM notifications WHERE type = 'waitlist_available';
