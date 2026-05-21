-- =====================================================
-- Janzu Community Portal - Events & RSVPs
-- =====================================================

BEGIN;

-- 1. Create Event Enums
DO $$ BEGIN
    CREATE TYPE event_type AS ENUM ('workshop', 'retreat', 'class', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE event_status AS ENUM ('draft', 'published', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create Events Table
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type event_type NOT NULL DEFAULT 'other',
    status event_status NOT NULL DEFAULT 'published',
    
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    address TEXT, -- Fallback if location_id isn't used
    
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    
    price_guide VARCHAR(100),
    max_attendees INTEGER,
    image_url TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create RSVPs Table
DO $$ BEGIN
    CREATE TYPE rsvp_status AS ENUM ('attending', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS event_rsvps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status rsvp_status NOT NULL DEFAULT 'attending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- A user can only register once for a specific event
    CONSTRAINT unique_event_user_rsvp UNIQUE (event_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);
CREATE INDEX IF NOT EXISTS idx_rsvps_event ON event_rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_rsvps_user ON event_rsvps(user_id);

COMMENT ON TABLE events IS 'Community events, retreats, and workshops';
COMMENT ON TABLE event_rsvps IS 'Attendance roster for events';

-- 4. Triggers
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'events_updated_at') THEN
        CREATE TRIGGER events_updated_at
            BEFORE UPDATE ON events
            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    END IF;
END $$;

-- 5. Insert Permissions into RBAC
INSERT INTO permissions (name, description, resource, action) VALUES
    ('events.create', 'Create a new event', 'events', 'create'),
    ('events.read', 'Read upcoming events', 'events', 'read'),
    ('events.update', 'Update own event', 'events', 'update'),
    ('events.delete', 'Delete/Cancel own event', 'events', 'delete'),
    ('events.manage', 'Approve/Manage all events', 'events', 'manage'),
    ('rsvps.create', 'Attend an event', 'rsvps', 'create'),
    ('rsvps.read', 'View attendees (if owner/admin)', 'rsvps', 'read')
ON CONFLICT (name) DO NOTHING;

-- 6. Seed Permissions into Roles
DO $$ 
DECLARE 
  v_admin_role_id INT := 1;
  v_practitioner_role_id INT := 3;
BEGIN
  -- Admin gets all permissions
  IF EXISTS (SELECT 1 FROM roles WHERE id = v_admin_role_id) THEN
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT v_admin_role_id, id FROM permissions WHERE resource IN ('events', 'rsvps')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Practitioners can create/manage their own events and attend others
  IF EXISTS (SELECT 1 FROM roles WHERE id = v_practitioner_role_id) THEN
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT v_practitioner_role_id, id FROM permissions 
    WHERE (resource = 'events' AND action IN ('create', 'read', 'update', 'delete'))
       OR (resource = 'rsvps' AND action IN ('create', 'read'))
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Let's also give basic users the ability to read events and RSVP.
-- Check if a generic 'member' or 'participant' role exists.
-- From earlier phases, "participant" is usually not a formal DB role unless Admin assigns it.
-- But let's verify if `users` can get default roles. If a role 'user' exists, grant to them.
DO $$ 
DECLARE 
  v_user_role_id INT := 4; -- or whatever standard user ID is, we will map by name
  v_role_id INT;
BEGIN
  SELECT id INTO v_role_id FROM roles WHERE name = 'user' OR name = 'member' LIMIT 1;
  IF v_role_id IS NOT NULL THEN
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT v_role_id, id FROM permissions 
    WHERE (resource = 'events' AND action IN ('read'))
       OR (resource = 'rsvps' AND action IN ('create'))
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

COMMIT;
