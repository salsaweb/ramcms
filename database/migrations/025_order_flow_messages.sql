-- =====================================================
-- Obrys CRM — Order Flow and Messages Schema
-- Migration 025
-- =====================================================

-- =====================================================
-- STEP 1: ADD WORK ASSETS TO ORDERS
-- =====================================================

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS work_assets JSONB NOT NULL DEFAULT '{"keys":[],"urls":[]}';

COMMENT ON COLUMN orders.work_assets IS 'Assets uploaded by the admin for the completed order work.';

-- =====================================================
-- STEP 2: CREATE ORDER MESSAGES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS order_messages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    sender_id       UUID REFERENCES users(id) ON DELETE SET NULL,
    message         TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- STEP 3: INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_order_messages_order_id ON order_messages(order_id);
CREATE INDEX IF NOT EXISTS idx_order_messages_created_at ON order_messages(created_at ASC);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE order_messages IS 'Communication messages between admins and customers regarding a specific order.';
COMMENT ON COLUMN order_messages.sender_id IS 'FK to users table. Represents either the admin user or the customer user.';
