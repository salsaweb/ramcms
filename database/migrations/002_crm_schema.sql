-- =====================================================
-- Enterprise CMS+CRM - CRM Module Migration (FIXED)
-- Based on Agile CRM functionality
-- =====================================================

-- =====================================================
-- STEP 1: CREATE ENUMS FIRST
-- =====================================================

DO $$ BEGIN
    CREATE TYPE company_type AS ENUM ('prospect', 'customer', 'partner', 'vendor', 'competitor');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE contact_type AS ENUM ('lead', 'customer', 'partner', 'vendor');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'qualified', 'unqualified', 'lost');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE deal_stage AS ENUM ('prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_type AS ENUM ('call', 'email', 'meeting', 'deadline', 'follow_up', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE activity_type AS ENUM ('note', 'email', 'call', 'meeting', 'task_completed', 'deal_stage_change', 'status_change', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- STEP 2: CREATE COMPANIES TABLE (No FK dependencies)
-- =====================================================

CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic Information
    name VARCHAR(255) NOT NULL,
    website VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    
    -- Company Details
    company_type company_type DEFAULT 'prospect',
    industry VARCHAR(100),
    employee_count INTEGER,
    annual_revenue DECIMAL(15, 2),
    
    -- Address
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    
    -- Social
    linkedin_url VARCHAR(255),
    twitter_handle VARCHAR(100),
    
    -- CRM Metadata
    tags TEXT[],
    custom_fields JSONB DEFAULT '{}',
    
    -- Assignment
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Tracking
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
CREATE INDEX IF NOT EXISTS idx_companies_owner ON companies(owner_id);
CREATE INDEX IF NOT EXISTS idx_companies_type ON companies(company_type);
CREATE INDEX IF NOT EXISTS idx_companies_tags ON companies USING GIN(tags);

-- =====================================================
-- STEP 3: CREATE CONTACTS TABLE (References companies)
-- =====================================================

CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic Information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50),
    mobile VARCHAR(50),
    website VARCHAR(255),
    
    -- Contact Type & Status
    contact_type contact_type DEFAULT 'lead',
    lead_status lead_status DEFAULT 'new',
    
    -- Job Information
    job_title VARCHAR(100),
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    
    -- Address
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    
    -- Social & Communication
    linkedin_url VARCHAR(255),
    twitter_handle VARCHAR(100),
    facebook_url VARCHAR(255),
    
    -- CRM Metadata
    lead_score INTEGER DEFAULT 0,
    tags TEXT[],
    custom_fields JSONB DEFAULT '{}',
    
    -- Assignment & Ownership
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Tracking
    last_contacted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT email_or_phone_required CHECK (email IS NOT NULL OR phone IS NOT NULL OR mobile IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_company ON contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_contacts_owner ON contacts(owner_id);
CREATE INDEX IF NOT EXISTS idx_contacts_assigned ON contacts(assigned_to);
CREATE INDEX IF NOT EXISTS idx_contacts_type ON contacts(contact_type);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(lead_status);
CREATE INDEX IF NOT EXISTS idx_contacts_tags ON contacts USING GIN(tags);

-- =====================================================
-- STEP 4: CREATE DEALS TABLE (References contacts, companies)
-- =====================================================

CREATE TABLE IF NOT EXISTS deals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic Information
    name VARCHAR(255) NOT NULL,
    description TEXT,
    amount DECIMAL(15, 2) NOT NULL,
    
    -- Stage & Probability
    stage deal_stage DEFAULT 'prospecting',
    probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
    
    -- Relationships
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    
    -- Dates
    expected_close_date DATE,
    closed_date DATE,
    
    -- Assignment
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Metadata
    tags TEXT[],
    custom_fields JSONB DEFAULT '{}',
    
    -- Tracking
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT amount_positive CHECK (amount >= 0)
);

CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage);
CREATE INDEX IF NOT EXISTS idx_deals_contact ON deals(contact_id);
CREATE INDEX IF NOT EXISTS idx_deals_company ON deals(company_id);
CREATE INDEX IF NOT EXISTS idx_deals_owner ON deals(owner_id);
CREATE INDEX IF NOT EXISTS idx_deals_close_date ON deals(expected_close_date);

-- =====================================================
-- STEP 5: CREATE TASKS TABLE (References all entities)
-- =====================================================

CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic Information
    title VARCHAR(255) NOT NULL,
    description TEXT,
    task_type task_type DEFAULT 'other',
    
    -- Priority & Status
    priority task_priority DEFAULT 'medium',
    status task_status DEFAULT 'pending',
    
    -- Relationships
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
    
    -- Assignment
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Dates
    due_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Tracking
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_contact ON tasks(contact_id);
CREATE INDEX IF NOT EXISTS idx_tasks_company ON tasks(company_id);
CREATE INDEX IF NOT EXISTS idx_tasks_deal ON tasks(deal_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);

-- =====================================================
-- STEP 6: CREATE ACTIVITIES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic Information
    activity_type activity_type NOT NULL,
    subject VARCHAR(255),
    description TEXT,
    
    -- Relationships
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Creator
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Tracking
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_activities_contact ON activities(contact_id);
CREATE INDEX IF NOT EXISTS idx_activities_company ON activities(company_id);
CREATE INDEX IF NOT EXISTS idx_activities_deal ON activities(deal_id);
CREATE INDEX IF NOT EXISTS idx_activities_created ON activities(created_at DESC);

-- =====================================================
-- STEP 7: CREATE EMAIL TEMPLATES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic Information
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    body TEXT NOT NULL,
    
    -- Template Variables
    variables TEXT[],
    
    -- Categorization
    category VARCHAR(100),
    
    -- Ownership
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    is_shared BOOLEAN DEFAULT FALSE,
    
    -- Tracking
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);
CREATE INDEX IF NOT EXISTS idx_email_templates_created_by ON email_templates(created_by);

-- =====================================================
-- STEP 8: CREATE PIPELINES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS pipelines (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    stages JSONB NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STEP 9: CREATE TRIGGERS
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'contacts_updated_at') THEN
        CREATE TRIGGER contacts_updated_at
            BEFORE UPDATE ON contacts
            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'companies_updated_at') THEN
        CREATE TRIGGER companies_updated_at
            BEFORE UPDATE ON companies
            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'deals_updated_at') THEN
        CREATE TRIGGER deals_updated_at
            BEFORE UPDATE ON deals
            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tasks_updated_at') THEN
        CREATE TRIGGER tasks_updated_at
            BEFORE UPDATE ON tasks
            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'email_templates_updated_at') THEN
        CREATE TRIGGER email_templates_updated_at
            BEFORE UPDATE ON email_templates
            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'pipelines_updated_at') THEN
        CREATE TRIGGER pipelines_updated_at
            BEFORE UPDATE ON pipelines
            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    END IF;
END $$;

-- =====================================================
-- STEP 10: CREATE HELPER FUNCTIONS
-- =====================================================

CREATE OR REPLACE FUNCTION get_contact_timeline(p_contact_id UUID)
RETURNS TABLE(
    activity_date TIMESTAMPTZ,
    activity_type VARCHAR,
    description TEXT,
    created_by_name VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.created_at as activity_date,
        a.activity_type::VARCHAR,
        COALESCE(a.subject, a.description) as description,
        u.name as created_by_name
    FROM activities a
    LEFT JOIN users u ON a.created_by = u.id
    WHERE a.contact_id = p_contact_id
    ORDER BY a.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION get_pipeline_value(p_stage deal_stage DEFAULT NULL)
RETURNS DECIMAL AS $$
DECLARE
    total_value DECIMAL;
BEGIN
    IF p_stage IS NULL THEN
        SELECT COALESCE(SUM(amount * (probability / 100.0)), 0)
        INTO total_value
        FROM deals
        WHERE stage NOT IN ('closed_won', 'closed_lost');
    ELSE
        SELECT COALESCE(SUM(amount * (probability / 100.0)), 0)
        INTO total_value
        FROM deals
        WHERE stage = p_stage;
    END IF;
    
    RETURN total_value;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION calculate_lead_score(p_contact_id UUID)
RETURNS INTEGER AS $$
DECLARE
    score INTEGER := 0;
    activity_count INTEGER;
    recent_activities INTEGER;
BEGIN
    -- Count total activities (5 points each, max 50)
    SELECT COUNT(*) INTO activity_count
    FROM activities WHERE contact_id = p_contact_id;
    score := score + LEAST(activity_count * 5, 50);
    
    -- Recent activities in last 30 days (10 points each, max 30)
    SELECT COUNT(*) INTO recent_activities
    FROM activities 
    WHERE contact_id = p_contact_id 
    AND created_at > NOW() - INTERVAL '30 days';
    score := score + LEAST(recent_activities * 10, 30);
    
    -- Has associated deal (20 points)
    IF EXISTS (SELECT 1 FROM deals WHERE contact_id = p_contact_id) THEN
        score := score + 20;
    END IF;
    
    RETURN LEAST(score, 100);
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE contacts IS 'CRM contacts with lead tracking and scoring';
COMMENT ON TABLE companies IS 'Company/Account records with relationship to contacts';
COMMENT ON TABLE deals IS 'Sales opportunities with pipeline management';
COMMENT ON TABLE tasks IS 'Action items linked to contacts, companies, or deals';
COMMENT ON TABLE activities IS 'Activity timeline for all CRM entities';
COMMENT ON TABLE email_templates IS 'Reusable email templates for campaigns';