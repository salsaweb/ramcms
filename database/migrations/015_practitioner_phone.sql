-- =====================================================
-- Janzu Community Portal - Practitioner Phone
-- =====================================================

-- Add phone number to practitioners
ALTER TABLE practitioners ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
