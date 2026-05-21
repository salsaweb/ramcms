-- =====================================================
-- Janzu Community Portal - Session Feedback
-- =====================================================

CREATE TABLE IF NOT EXISTS session_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    practitioner_id UUID NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,
    
    -- Specific Questions
    feeling_in_arms TEXT NOT NULL,
    overall_experience TEXT NOT NULL,
    felt_supported VARCHAR(50) NOT NULL, -- 'Yes', 'Not enough', 'Other'
    felt_supported_details TEXT,
    additional_comments TEXT NOT NULL,
    continue_process VARCHAR(100) NOT NULL, -- 'I would like to receive another session', 'No, thank you'
    interested_in_learning BOOLEAN NOT NULL DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure feedback can only be submitted once per session
    CONSTRAINT unique_session_feedback UNIQUE (session_id)
);

-- Indexes for querying by practitioner
CREATE INDEX IF NOT EXISTS idx_session_feedback_practitioner ON session_feedback(practitioner_id);
CREATE INDEX IF NOT EXISTS idx_session_feedback_client ON session_feedback(client_id);

COMMENT ON TABLE session_feedback IS 'Post-session qualitative feedback from Janzu clients.';
