-- =====================================================
-- Contact Enhancements Migration
-- Advanced filtering, custom fields, ownership tracking
-- =====================================================

-- =====================================================
-- CUSTOM FIELDS DEFINITION TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS contact_custom_fields (
    id SERIAL PRIMARY KEY,
    field_name VARCHAR(100) NOT NULL,
    field_label VARCHAR(255) NOT NULL,
    field_type VARCHAR(50) NOT NULL CHECK (field_type IN ('text', 'number', 'date', 'boolean', 'select', 'textarea')),
    field_options JSONB, -- For select fields
    is_required BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_field_name UNIQUE (field_name)
);

CREATE INDEX IF NOT EXISTS idx_custom_fields_active ON contact_custom_fields(is_active) WHERE is_active = TRUE;

-- =====================================================
-- OWNERSHIP TRANSFER HISTORY
-- =====================================================

CREATE TABLE IF NOT EXISTS contact_ownership_history (
    id SERIAL PRIMARY KEY,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    from_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    to_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    transferred_by UUID REFERENCES users(id) ON DELETE SET NULL,
    transfer_reason TEXT,
    transferred_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ownership_contact ON contact_ownership_history(contact_id);
CREATE INDEX IF NOT EXISTS idx_ownership_to_user ON contact_ownership_history(to_user_id);

-- =====================================================
-- CONTACT DUPLICATES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS contact_duplicates (
    id SERIAL PRIMARY KEY,
    contact_id_1 UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    contact_id_2 UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    similarity_score DECIMAL(5, 2), -- 0-100 percentage
    matched_fields JSONB, -- Which fields matched
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'merged', 'ignored', 'not_duplicate')),
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_duplicate_pair UNIQUE (contact_id_1, contact_id_2),
    CONSTRAINT different_contacts CHECK (contact_id_1 != contact_id_2)
);

CREATE INDEX IF NOT EXISTS idx_duplicates_status ON contact_duplicates(status);
CREATE INDEX IF NOT EXISTS idx_duplicates_contact1 ON contact_duplicates(contact_id_1);
CREATE INDEX IF NOT EXISTS idx_duplicates_contact2 ON contact_duplicates(contact_id_2);

-- =====================================================
-- CONTACT MERGE HISTORY
-- =====================================================

CREATE TABLE IF NOT EXISTS contact_merge_history (
    id SERIAL PRIMARY KEY,
    master_contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    merged_contact_id UUID NOT NULL, -- Soft reference, contact may be deleted
    merged_data JSONB, -- Store merged contact data
    merged_by UUID REFERENCES users(id) ON DELETE SET NULL,
    merged_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_merge_master ON contact_merge_history(master_contact_id);

-- =====================================================
-- ACTIVITY REMINDERS
-- =====================================================

CREATE TABLE IF NOT EXISTS activity_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    reminder_type VARCHAR(50) NOT NULL CHECK (reminder_type IN ('follow_up', 'call', 'email', 'meeting', 'deadline', 'custom')),
    reminder_title VARCHAR(255) NOT NULL,
    reminder_description TEXT,
    reminder_datetime TIMESTAMPTZ NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    assigned_to UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reminders_datetime ON activity_reminders(reminder_datetime) WHERE is_completed = FALSE;
CREATE INDEX IF NOT EXISTS idx_reminders_assigned ON activity_reminders(assigned_to) WHERE is_completed = FALSE;
CREATE INDEX IF NOT EXISTS idx_reminders_contact ON activity_reminders(contact_id);
CREATE INDEX IF NOT EXISTS idx_reminders_completed ON activity_reminders(is_completed);

-- =====================================================
-- CALL LOGS
-- =====================================================

CREATE TYPE call_direction AS ENUM ('inbound', 'outbound');
CREATE TYPE call_outcome AS ENUM ('answered', 'voicemail', 'no_answer', 'busy', 'failed');

DO $$ BEGIN
    CREATE TYPE call_direction AS ENUM ('inbound', 'outbound');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE call_outcome AS ENUM ('answered', 'voicemail', 'no_answer', 'busy', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS call_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
    phone_number VARCHAR(50) NOT NULL,
    direction call_direction NOT NULL,
    outcome call_outcome,
    duration_seconds INTEGER, -- Call duration in seconds
    recording_url TEXT, -- External recording URL if applicable
    notes TEXT,
    called_by UUID REFERENCES users(id) ON DELETE SET NULL,
    call_datetime TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_call_logs_contact ON call_logs(contact_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_datetime ON call_logs(call_datetime DESC);
CREATE INDEX IF NOT EXISTS idx_call_logs_user ON call_logs(called_by);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to detect duplicate contacts
CREATE OR REPLACE FUNCTION detect_duplicate_contacts()
RETURNS TABLE(
    contact1_id UUID,
    contact2_id UUID,
    similarity_score DECIMAL,
    matched_fields JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH contact_pairs AS (
        SELECT 
            c1.id as id1,
            c2.id as id2,
            c1.email as email1,
            c2.email as email2,
            c1.phone as phone1,
            c2.phone as phone2,
            c1.first_name as first1,
            c2.first_name as first2,
            c1.last_name as last1,
            c2.last_name as last2
        FROM contacts c1
        CROSS JOIN contacts c2
        WHERE c1.id < c2.id  -- Avoid duplicates and self-comparison
    )
    SELECT 
        id1,
        id2,
        (
            CASE WHEN email1 = email2 AND email1 IS NOT NULL THEN 40 ELSE 0 END +
            CASE WHEN phone1 = phone2 AND phone1 IS NOT NULL THEN 30 ELSE 0 END +
            CASE WHEN LOWER(first1) = LOWER(first2) AND LOWER(last1) = LOWER(last2) THEN 30 ELSE 0 END
        )::DECIMAL as score,
        jsonb_build_object(
            'email_match', email1 = email2 AND email1 IS NOT NULL,
            'phone_match', phone1 = phone2 AND phone1 IS NOT NULL,
            'name_match', LOWER(first1) = LOWER(first2) AND LOWER(last1) = LOWER(last2)
        ) as matches
    FROM contact_pairs
    WHERE (
        (email1 = email2 AND email1 IS NOT NULL) OR
        (phone1 = phone2 AND phone1 IS NOT NULL) OR
        (LOWER(first1) = LOWER(first2) AND LOWER(last1) = LOWER(last2))
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to transfer contact ownership
CREATE OR REPLACE FUNCTION transfer_contact_ownership(
    p_contact_id UUID,
    p_to_user_id UUID,
    p_transferred_by UUID,
    p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_from_user_id UUID;
BEGIN
    -- Get current owner
    SELECT owner_id INTO v_from_user_id
    FROM contacts
    WHERE id = p_contact_id;
    
    -- Update contact owner
    UPDATE contacts
    SET owner_id = p_to_user_id,
        updated_at = NOW()
    WHERE id = p_contact_id;
    
    -- Log transfer
    INSERT INTO contact_ownership_history (
        contact_id,
        from_user_id,
        to_user_id,
        transferred_by,
        transfer_reason
    ) VALUES (
        p_contact_id,
        v_from_user_id,
        p_to_user_id,
        p_transferred_by,
        p_reason
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to get upcoming reminders for a user
CREATE OR REPLACE FUNCTION get_upcoming_reminders(
    p_user_id UUID,
    p_hours_ahead INTEGER DEFAULT 24
)
RETURNS TABLE(
    reminder_id UUID,
    reminder_title VARCHAR,
    reminder_datetime TIMESTAMPTZ,
    reminder_type VARCHAR,
    contact_name VARCHAR,
    company_name VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ar.id,
        ar.reminder_title,
        ar.reminder_datetime,
        ar.reminder_type::VARCHAR,
        CASE 
            WHEN c.id IS NOT NULL THEN c.first_name || ' ' || c.last_name
            ELSE NULL
        END as contact_name,
        co.name
    FROM activity_reminders ar
    LEFT JOIN contacts c ON ar.contact_id = c.id
    LEFT JOIN companies co ON ar.company_id = co.id
    WHERE ar.assigned_to = p_user_id
    AND ar.is_completed = FALSE
    AND ar.reminder_datetime <= NOW() + (p_hours_ahead || ' hours')::INTERVAL
    ORDER BY ar.reminder_datetime ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER custom_fields_updated_at
    BEFORE UPDATE ON contact_custom_fields
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- SEED SOME DEFAULT CUSTOM FIELDS
-- =====================================================

INSERT INTO contact_custom_fields (field_name, field_label, field_type, field_options, display_order) VALUES
('linkedin_connections', 'LinkedIn Connections', 'number', NULL, 1),
('referral_source', 'Referral Source', 'select', '["Website", "LinkedIn", "Referral", "Event", "Cold Call", "Other"]'::jsonb, 2),
('budget_range', 'Budget Range', 'select', '["< $10k", "$10k - $50k", "$50k - $100k", "$100k - $500k", "> $500k"]'::jsonb, 3),
('decision_maker', 'Decision Maker?', 'boolean', NULL, 4),
('next_follow_up', 'Next Follow-up Date', 'date', NULL, 5),
('notes_field', 'Additional Notes', 'textarea', NULL, 6)
ON CONFLICT (field_name) DO NOTHING;

COMMENT ON TABLE contact_custom_fields IS 'Define custom fields for contacts';
COMMENT ON TABLE contact_ownership_history IS 'Track contact ownership transfers';
COMMENT ON TABLE contact_duplicates IS 'Track potential duplicate contacts';
COMMENT ON TABLE contact_merge_history IS 'Track merged contacts';
COMMENT ON TABLE activity_reminders IS 'Schedule reminders for follow-ups';
COMMENT ON TABLE call_logs IS 'Track all phone calls with contacts';