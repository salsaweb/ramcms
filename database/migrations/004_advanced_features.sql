-- =====================================================
-- Advanced Contact Features Migration
-- Custom field builder, auto-merge rules, email notifications
-- =====================================================

-- =====================================================
-- CUSTOM FIELD ENHANCEMENTS
-- =====================================================

-- Add new field types to existing custom fields
ALTER TABLE contact_custom_fields 
ADD COLUMN IF NOT EXISTS validation_rules JSONB,
ADD COLUMN IF NOT EXISTS default_value TEXT,
ADD COLUMN IF NOT EXISTS help_text TEXT,
ADD COLUMN IF NOT EXISTS field_group VARCHAR(100);

-- Create index on field_group
CREATE INDEX IF NOT EXISTS idx_custom_fields_group ON contact_custom_fields(field_group);

-- =====================================================
-- FILE UPLOADS FOR CUSTOM FIELDS
-- =====================================================

CREATE TABLE IF NOT EXISTS contact_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    field_name VARCHAR(100), -- Links to custom field if applicable
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100),
    file_size INTEGER, -- in bytes
    file_url TEXT NOT NULL,
    storage_path TEXT,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB -- Additional file metadata
);

CREATE INDEX IF NOT EXISTS idx_contact_files_contact ON contact_files(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_files_field ON contact_files(field_name);

-- =====================================================
-- AUTO-MERGE RULES
-- =====================================================

CREATE TABLE IF NOT EXISTS duplicate_merge_rules (
    id SERIAL PRIMARY KEY,
    rule_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT FALSE,
    min_similarity_score INTEGER DEFAULT 90 CHECK (min_similarity_score >= 50 AND min_similarity_score <= 100),
    required_matches JSONB NOT NULL, -- {"email": true, "phone": false, "name": true}
    auto_merge_enabled BOOLEAN DEFAULT FALSE,
    master_selection_rule VARCHAR(50) DEFAULT 'most_recent' CHECK (
        master_selection_rule IN ('most_recent', 'oldest', 'highest_score', 'most_complete', 'manual')
    ),
    notification_enabled BOOLEAN DEFAULT TRUE,
    notify_users UUID[], -- Array of user IDs to notify
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_merge_rules_active ON duplicate_merge_rules(is_active) WHERE is_active = TRUE;

-- =====================================================
-- EMAIL NOTIFICATION QUEUE
-- =====================================================

CREATE TYPE notification_type AS ENUM (
    'duplicate_found',
    'duplicate_merged', 
    'reminder_due',
    'reminder_overdue',
    'contact_assigned',
    'deal_won',
    'deal_lost',
    'task_assigned',
    'custom'
);

DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM (
        'duplicate_found',
        'duplicate_merged', 
        'reminder_due',
        'reminder_overdue',
        'contact_assigned',
        'deal_won',
        'deal_lost',
        'task_assigned',
        'custom'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'failed', 'cancelled');

DO $$ BEGIN
    CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'failed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS email_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notification_type notification_type NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    subject VARCHAR(500) NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT,
    status notification_status DEFAULT 'pending',
    priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
    scheduled_for TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    error_message TEXT,
    metadata JSONB, -- Additional context (contact_id, deal_id, etc.)
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_status ON email_notifications(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON email_notifications(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON email_notifications(notification_type);

-- =====================================================
-- NOTIFICATION PREFERENCES
-- =====================================================

CREATE TABLE IF NOT EXISTS user_notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    reminder_email_enabled BOOLEAN DEFAULT TRUE,
    reminder_advance_minutes INTEGER DEFAULT 60, -- Send reminder X minutes before due
    duplicate_email_enabled BOOLEAN DEFAULT TRUE,
    assignment_email_enabled BOOLEAN DEFAULT TRUE,
    deal_email_enabled BOOLEAN DEFAULT TRUE,
    daily_digest_enabled BOOLEAN DEFAULT FALSE,
    daily_digest_time TIME DEFAULT '09:00:00',
    email_frequency VARCHAR(50) DEFAULT 'immediate' CHECK (
        email_frequency IN ('immediate', 'hourly', 'daily', 'weekly', 'never')
    ),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CALL ANALYTICS AGGREGATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS call_analytics_daily (
    id SERIAL PRIMARY KEY,
    analytics_date DATE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    total_calls INTEGER DEFAULT 0,
    inbound_calls INTEGER DEFAULT 0,
    outbound_calls INTEGER DEFAULT 0,
    answered_calls INTEGER DEFAULT 0,
    voicemail_calls INTEGER DEFAULT 0,
    missed_calls INTEGER DEFAULT 0,
    total_duration_seconds INTEGER DEFAULT 0,
    avg_duration_seconds INTEGER DEFAULT 0,
    unique_contacts_called INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(analytics_date, user_id)
);

CREATE INDEX IF NOT EXISTS idx_call_analytics_date ON call_analytics_daily(analytics_date DESC);
CREATE INDEX IF NOT EXISTS idx_call_analytics_user ON call_analytics_daily(user_id, analytics_date DESC);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to check if duplicate should auto-merge
CREATE OR REPLACE FUNCTION should_auto_merge_duplicate(
    p_contact_id_1 UUID,
    p_contact_id_2 UUID,
    p_similarity_score DECIMAL,
    p_matched_fields JSONB
)
RETURNS TABLE(
    should_merge BOOLEAN,
    rule_id INTEGER,
    master_contact_id UUID
) AS $$
DECLARE
    v_rule RECORD;
    v_matches_criteria BOOLEAN;
    v_master_id UUID;
BEGIN
    -- Loop through active auto-merge rules
    FOR v_rule IN 
        SELECT * FROM duplicate_merge_rules 
        WHERE is_active = TRUE 
        AND auto_merge_enabled = TRUE
        AND p_similarity_score >= min_similarity_score
        ORDER BY min_similarity_score DESC
    LOOP
        -- Check if matched_fields meet required_matches
        v_matches_criteria := TRUE;
        
        IF (v_rule.required_matches->>'email')::BOOLEAN = TRUE 
            AND (p_matched_fields->>'email_match')::BOOLEAN != TRUE THEN
            v_matches_criteria := FALSE;
        END IF;
        
        IF (v_rule.required_matches->>'phone')::BOOLEAN = TRUE 
            AND (p_matched_fields->>'phone_match')::BOOLEAN != TRUE THEN
            v_matches_criteria := FALSE;
        END IF;
        
        IF (v_rule.required_matches->>'name')::BOOLEAN = TRUE 
            AND (p_matched_fields->>'name_match')::BOOLEAN != TRUE THEN
            v_matches_criteria := FALSE;
        END IF;
        
        -- If criteria met, determine master
        IF v_matches_criteria THEN
            CASE v_rule.master_selection_rule
                WHEN 'most_recent' THEN
                    SELECT id INTO v_master_id 
                    FROM contacts 
                    WHERE id IN (p_contact_id_1, p_contact_id_2)
                    ORDER BY created_at DESC 
                    LIMIT 1;
                WHEN 'oldest' THEN
                    SELECT id INTO v_master_id 
                    FROM contacts 
                    WHERE id IN (p_contact_id_1, p_contact_id_2)
                    ORDER BY created_at ASC 
                    LIMIT 1;
                WHEN 'highest_score' THEN
                    SELECT id INTO v_master_id 
                    FROM contacts 
                    WHERE id IN (p_contact_id_1, p_contact_id_2)
                    ORDER BY lead_score DESC 
                    LIMIT 1;
                WHEN 'most_complete' THEN
                    -- Select contact with more non-null fields
                    WITH completeness AS (
                        SELECT 
                            id,
                            (CASE WHEN email IS NOT NULL THEN 1 ELSE 0 END +
                             CASE WHEN phone IS NOT NULL THEN 1 ELSE 0 END +
                             CASE WHEN mobile IS NOT NULL THEN 1 ELSE 0 END +
                             CASE WHEN job_title IS NOT NULL THEN 1 ELSE 0 END +
                             CASE WHEN company_id IS NOT NULL THEN 1 ELSE 0 END) as score
                        FROM contacts
                        WHERE id IN (p_contact_id_1, p_contact_id_2)
                    )
                    SELECT id INTO v_master_id FROM completeness ORDER BY score DESC LIMIT 1;
                ELSE
                    v_master_id := NULL; -- Manual selection required
            END CASE;
            
            RETURN QUERY SELECT TRUE, v_rule.id, v_master_id;
            RETURN;
        END IF;
    END LOOP;
    
    -- No rules matched
    RETURN QUERY SELECT FALSE, NULL::INTEGER, NULL::UUID;
END;
$$ LANGUAGE plpgsql;

-- Function to aggregate daily call analytics
CREATE OR REPLACE FUNCTION aggregate_call_analytics(p_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
BEGIN
    INSERT INTO call_analytics_daily (
        analytics_date,
        user_id,
        total_calls,
        inbound_calls,
        outbound_calls,
        answered_calls,
        voicemail_calls,
        missed_calls,
        total_duration_seconds,
        avg_duration_seconds,
        unique_contacts_called
    )
    SELECT 
        DATE(call_datetime) as analytics_date,
        called_by as user_id,
        COUNT(*) as total_calls,
        COUNT(*) FILTER (WHERE direction = 'inbound') as inbound_calls,
        COUNT(*) FILTER (WHERE direction = 'outbound') as outbound_calls,
        COUNT(*) FILTER (WHERE outcome = 'answered') as answered_calls,
        COUNT(*) FILTER (WHERE outcome = 'voicemail') as voicemail_calls,
        COUNT(*) FILTER (WHERE outcome IN ('no_answer', 'busy')) as missed_calls,
        COALESCE(SUM(duration_seconds), 0)::INTEGER as total_duration_seconds,
        COALESCE(AVG(duration_seconds), 0)::INTEGER as avg_duration_seconds,
        COUNT(DISTINCT contact_id) as unique_contacts_called
    FROM call_logs
    WHERE DATE(call_datetime) = p_date
    AND called_by IS NOT NULL
    GROUP BY DATE(call_datetime), called_by
    ON CONFLICT (analytics_date, user_id) 
    DO UPDATE SET
        total_calls = EXCLUDED.total_calls,
        inbound_calls = EXCLUDED.inbound_calls,
        outbound_calls = EXCLUDED.outbound_calls,
        answered_calls = EXCLUDED.answered_calls,
        voicemail_calls = EXCLUDED.voicemail_calls,
        missed_calls = EXCLUDED.missed_calls,
        total_duration_seconds = EXCLUDED.total_duration_seconds,
        avg_duration_seconds = EXCLUDED.avg_duration_seconds,
        unique_contacts_called = EXCLUDED.unique_contacts_called;
END;
$$ LANGUAGE plpgsql;

-- Function to get pending email notifications
CREATE OR REPLACE FUNCTION get_pending_notifications(p_limit INTEGER DEFAULT 100)
RETURNS TABLE(
    notification_id UUID,
    notification_type notification_type,
    recipient_email VARCHAR,
    subject VARCHAR,
    body_html TEXT,
    priority INTEGER,
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        id,
        email_notifications.notification_type,
        email_notifications.recipient_email,
        email_notifications.subject,
        email_notifications.body_html,
        email_notifications.priority,
        email_notifications.metadata
    FROM email_notifications
    WHERE status = 'pending'
    AND scheduled_for <= NOW()
    AND retry_count < max_retries
    ORDER BY priority DESC, scheduled_for ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER merge_rules_updated_at
    BEFORE UPDATE ON duplicate_merge_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER notification_prefs_updated_at
    BEFORE UPDATE ON user_notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- DEFAULT DATA
-- =====================================================

-- Create default auto-merge rule (disabled by default)
INSERT INTO duplicate_merge_rules (
    rule_name,
    description,
    is_active,
    min_similarity_score,
    required_matches,
    auto_merge_enabled,
    master_selection_rule,
    notification_enabled
) VALUES (
    'High Confidence Email Match',
    'Auto-merge contacts with matching email addresses and high similarity',
    FALSE, -- Disabled by default for safety
    95,
    '{"email": true, "phone": false, "name": false}'::jsonb,
    FALSE,
    'most_recent',
    TRUE
) ON CONFLICT DO NOTHING;

-- Create notification preferences for existing users
INSERT INTO user_notification_preferences (user_id)
SELECT id FROM users
ON CONFLICT (user_id) DO NOTHING;

COMMENT ON TABLE contact_files IS 'Store file uploads for contact custom fields';
COMMENT ON TABLE duplicate_merge_rules IS 'Rules for automatic duplicate detection and merging';
COMMENT ON TABLE email_notifications IS 'Queue for email notifications';
COMMENT ON TABLE user_notification_preferences IS 'User email notification preferences';
COMMENT ON TABLE call_analytics_daily IS 'Daily aggregated call analytics by user';