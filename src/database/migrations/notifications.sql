-- ============================================
-- NOTIFICATION SYSTEM - DATABASE MIGRATION
-- ============================================

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Recipient
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Content
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    
    -- Delivery
    channels VARCHAR(50)[] DEFAULT ARRAY['in_app'],
    priority VARCHAR(20) DEFAULT 'normal',
    
    -- Status
    read_at TIMESTAMP,
    delivered_at TIMESTAMP,
    delivery_status VARCHAR(20) DEFAULT 'pending',
    
    -- Actions
    action_url VARCHAR(500),
    action_label VARCHAR(100),
    expires_at TIMESTAMP
);

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(delivery_status);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read_at);

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Channel preferences
    email_enabled BOOLEAN DEFAULT true,
    push_enabled BOOLEAN DEFAULT true,
    in_app_enabled BOOLEAN DEFAULT true,
    
    -- Notification type preferences
    preferences JSONB DEFAULT '{
        "waitlist_available": {"email": true, "push": true, "in_app": true},
        "booking_confirmed": {"email": true, "push": false, "in_app": true},
        "class_cancelled": {"email": true, "push": true, "in_app": true},
        "reminder_24h": {"email": true, "push": true, "in_app": false}
    }'::jsonb,
    
    UNIQUE(user_id)
);

-- Create index for notification_preferences
CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_preferences_user_unique ON notification_preferences(user_id);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('notifications', 'notification_preferences');

-- Check indexes
SELECT indexname 
FROM pg_indexes 
WHERE tablename IN ('notifications', 'notification_preferences');
