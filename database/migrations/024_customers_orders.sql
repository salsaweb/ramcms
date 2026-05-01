-- =====================================================
-- Obrys CRM — Customers & Orders Schema
-- Migration 024
-- =====================================================

-- =====================================================
-- STEP 1: ENUMS
-- =====================================================

DO $$ BEGIN
    CREATE TYPE order_type AS ENUM ('pilot', 'method');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM (
        'draft',
        'submitted',
        'in_progress',
        'in_review',
        'delivered',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- STEP 2: ORDERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS orders (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Classification
    type            order_type NOT NULL,
    status          order_status NOT NULL DEFAULT 'draft',

    -- Relationship — customer is a contact with contact_type = 'customer'
    customer_id     UUID REFERENCES contacts(id) ON DELETE SET NULL,

    -- Timestamps
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_saved_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Location & description
    property_address TEXT,
    description      TEXT,

    -- Assets: { "keys": ["r2-key-1"], "urls": ["https://..."] }
    assets           JSONB NOT NULL DEFAULT '{"keys":[],"urls":[]}',

    -- Scheduling
    deadline         DATE,
    rush_flag        BOOLEAN NOT NULL DEFAULT FALSE,

    -- Audit
    created_by       UUID REFERENCES users(id) ON DELETE SET NULL
);

-- =====================================================
-- STEP 3: INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_orders_customer    ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status      ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_type        ON orders(type);
CREATE INDEX IF NOT EXISTS idx_orders_deadline    ON orders(deadline);
CREATE INDEX IF NOT EXISTS idx_orders_rush        ON orders(rush_flag);
CREATE INDEX IF NOT EXISTS idx_orders_created_at  ON orders(created_at DESC);

-- =====================================================
-- STEP 4: last_saved_at TRIGGER
-- =====================================================

CREATE OR REPLACE FUNCTION update_order_last_saved_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_saved_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'orders_last_saved_at') THEN
        CREATE TRIGGER orders_last_saved_at
            BEFORE UPDATE ON orders
            FOR EACH ROW EXECUTE FUNCTION update_order_last_saved_at();
    END IF;
END $$;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE orders IS 'Service orders linked to CRM customers (contacts). Type is pilot or method.';
COMMENT ON COLUMN orders.assets IS 'JSONB blob: {"keys":["r2-key"],"urls":["https://cdn/..."]}';
COMMENT ON COLUMN orders.customer_id IS 'FK to contacts.id — contact must have contact_type = customer';
