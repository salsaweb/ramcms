-- =====================================================
-- Janzu Community Portal - Client/Participant Extension
-- =====================================================

-- Add user_id to contacts to explicitly link a CRM contact to a Platform User (Participant)
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);

-- Optional: We might want a table to track sessions or similar later, but for now we just link the contact
