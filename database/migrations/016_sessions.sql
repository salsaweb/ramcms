-- =====================================================
-- Janzu Community Portal - Sessions & Session Requests
-- =====================================================

DO $$ BEGIN
    CREATE TYPE session_status AS ENUM ('requested', 'confirmed', 'completed', 'cancelled', 'no_show');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    practitioner_id UUID NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    location_id UUID, -- Will reference locations table in Phase 7
    
    -- Scheduling
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    
    status session_status NOT NULL DEFAULT 'requested',
    
    -- Practitioner specific notes (private)
    internal_notes TEXT,
    -- Notes for the client (public/shared)
    client_notes TEXT,
    
    -- Optional fields for feedback integration later
    feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
    feedback_comments TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying by practitioner and status
CREATE INDEX IF NOT EXISTS idx_sessions_practitioner ON sessions(practitioner_id);
CREATE INDEX IF NOT EXISTS idx_sessions_client ON sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_scheduled_at ON sessions(scheduled_at);

-- Triggers
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'sessions_updated_at') THEN
        CREATE TRIGGER sessions_updated_at
            BEFORE UPDATE ON sessions
            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    END IF;
END $$;

COMMENT ON TABLE sessions IS 'Tracks Janzu sessions and session requests between practitioners and clients';
