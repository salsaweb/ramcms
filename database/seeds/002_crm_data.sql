-- =====================================================
-- Enterprise CMS+CRM - CRM Module Seed Data
-- =====================================================

-- =====================================================
-- STEP 1: ADD CRM PERMISSIONS
-- =====================================================

-- Contact Management Permissions
INSERT INTO permissions (name, description, resource, action) VALUES
('contacts.create', 'Create new contacts', 'contacts', 'create'),
('contacts.read', 'View contacts', 'contacts', 'read'),
('contacts.update', 'Update contact information', 'contacts', 'update'),
('contacts.delete', 'Delete contacts', 'contacts', 'delete'),
('contacts.import', 'Import contacts from CSV', 'contacts', 'import'),
('contacts.export', 'Export contacts to CSV', 'contacts', 'export')
ON CONFLICT (name) DO NOTHING;

-- Company Management Permissions
INSERT INTO permissions (name, description, resource, action) VALUES
('companies.create', 'Create new companies', 'companies', 'create'),
('companies.read', 'View companies', 'companies', 'read'),
('companies.update', 'Update company information', 'companies', 'update'),
('companies.delete', 'Delete companies', 'companies', 'delete')
ON CONFLICT (name) DO NOTHING;

-- Deal Management Permissions
INSERT INTO permissions (name, description, resource, action) VALUES
('deals.create', 'Create new deals', 'deals', 'create'),
('deals.read', 'View deals', 'deals', 'read'),
('deals.update', 'Update deals', 'deals', 'update'),
('deals.delete', 'Delete deals', 'deals', 'delete'),
('deals.close', 'Close deals (won/lost)', 'deals', 'close')
ON CONFLICT (name) DO NOTHING;

-- Task Management Permissions
INSERT INTO permissions (name, description, resource, action) VALUES
('tasks.create', 'Create new tasks', 'tasks', 'create'),
('tasks.read', 'View tasks', 'tasks', 'read'),
('tasks.update', 'Update tasks', 'tasks', 'update'),
('tasks.delete', 'Delete tasks', 'tasks', 'delete'),
('tasks.assign', 'Assign tasks to users', 'tasks', 'assign')
ON CONFLICT (name) DO NOTHING;

-- Activity/Notes Permissions
INSERT INTO permissions (name, description, resource, action) VALUES
('activities.create', 'Create activities/notes', 'activities', 'create'),
('activities.read', 'View activities', 'activities', 'read'),
('activities.delete', 'Delete activities', 'activities', 'delete')
ON CONFLICT (name) DO NOTHING;

-- Email Template Permissions
INSERT INTO permissions (name, description, resource, action) VALUES
('templates.create', 'Create email templates', 'templates', 'create'),
('templates.read', 'View email templates', 'templates', 'read'),
('templates.update', 'Update email templates', 'templates', 'update'),
('templates.delete', 'Delete email templates', 'templates', 'delete')
ON CONFLICT (name) DO NOTHING;

-- CRM Dashboard Permission
INSERT INTO permissions (name, description, resource, action) VALUES
('crm.access', 'Access CRM module', 'crm', 'access'),
('crm.reports', 'View CRM reports and analytics', 'crm', 'reports')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- STEP 2: CREATE SALES REPRESENTATIVE ROLE
-- =====================================================

INSERT INTO roles (name, description, is_system) VALUES
('sales_rep', 'Sales representative with CRM access', TRUE)
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- STEP 3: ASSIGN CRM PERMISSIONS TO ROLES
-- =====================================================

-- ADMIN: All CRM permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
AND p.resource IN ('contacts', 'companies', 'deals', 'tasks', 'activities', 'templates', 'crm')
ON CONFLICT DO NOTHING;

-- SALES_REP: Full CRM access except delete companies/deals
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'sales_rep'
AND p.name IN (
    -- Contacts
    'contacts.create', 'contacts.read', 'contacts.update', 'contacts.import', 'contacts.export',
    -- Companies
    'companies.create', 'companies.read', 'companies.update',
    -- Deals
    'deals.create', 'deals.read', 'deals.update', 'deals.close',
    -- Tasks
    'tasks.create', 'tasks.read', 'tasks.update', 'tasks.delete', 'tasks.assign',
    -- Activities
    'activities.create', 'activities.read', 'activities.delete',
    -- Templates
    'templates.create', 'templates.read', 'templates.update',
    -- CRM Access
    'crm.access', 'crm.reports'
)
ON CONFLICT DO NOTHING;

-- EDITOR: Limited CRM access (view contacts/companies, manage tasks)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'editor'
AND p.name IN (
    'contacts.read',
    'companies.read',
    'tasks.create', 'tasks.read', 'tasks.update',
    'activities.read',
    'crm.access'
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- STEP 4: CREATE SAMPLE COMPANIES
-- =====================================================

INSERT INTO companies (id, name, website, email, phone, company_type, industry, employee_count, city, state, country, owner_id)
VALUES
    (
        '10000000-0000-0000-0000-000000000001',
        'Acme Corporation',
        'https://acme.example.com',
        'contact@acme.example.com',
        '+1-555-0100',
        'customer',
        'Technology',
        250,
        'San Francisco',
        'CA',
        'United States',
        '00000000-0000-0000-0000-000000000001'
    ),
    (
        '10000000-0000-0000-0000-000000000002',
        'TechStart Inc',
        'https://techstart.example.com',
        'hello@techstart.example.com',
        '+1-555-0200',
        'prospect',
        'Software',
        50,
        'Austin',
        'TX',
        'United States',
        '00000000-0000-0000-0000-000000000001'
    ),
    (
        '10000000-0000-0000-0000-000000000003',
        'Global Solutions Ltd',
        'https://globalsolutions.example.com',
        'info@globalsolutions.example.com',
        '+44-20-5550-300',
        'customer',
        'Consulting',
        500,
        'London',
        NULL,
        'United Kingdom',
        '00000000-0000-0000-0000-000000000001'
    )
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STEP 5: CREATE SAMPLE CONTACTS
-- =====================================================

INSERT INTO contacts (
    id, first_name, last_name, email, phone, mobile,
    contact_type, lead_status, job_title, company_id,
    city, state, country, lead_score, tags, owner_id, assigned_to
)
VALUES
    (
        '20000000-0000-0000-0000-000000000001',
        'John',
        'Smith',
        'john.smith@acme.example.com',
        '+1-555-0101',
        '+1-555-0102',
        'customer',
        'qualified',
        'CTO',
        '10000000-0000-0000-0000-000000000001',
        'San Francisco',
        'CA',
        'United States',
        85,
        ARRAY['vip', 'technical'],
        '00000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000001'
    ),
    (
        '20000000-0000-0000-0000-000000000002',
        'Sarah',
        'Johnson',
        'sarah.j@techstart.example.com',
        '+1-555-0201',
        NULL,
        'lead',
        'contacted',
        'VP of Marketing',
        '10000000-0000-0000-0000-000000000002',
        'Austin',
        'TX',
        'United States',
        60,
        ARRAY['marketing', 'enterprise'],
        '00000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000001'
    ),
    (
        '20000000-0000-0000-0000-000000000003',
        'David',
        'Chen',
        'david.chen@globalsolutions.example.com',
        '+44-20-5550-301',
        '+44-7700-900001',
        'customer',
        'qualified',
        'CEO',
        '10000000-0000-0000-0000-000000000003',
        'London',
        NULL,
        'United Kingdom',
        90,
        ARRAY['decision-maker', 'vip'],
        '00000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000001'
    )
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STEP 6: CREATE SAMPLE DEALS
-- =====================================================

INSERT INTO deals (
    id, name, description, amount, stage, probability,
    contact_id, company_id, expected_close_date, owner_id, tags
)
VALUES
    (
        '30000000-0000-0000-0000-000000000001',
        'Enterprise License - Acme Corp',
        'Annual enterprise license for 250 users',
        125000.00,
        'negotiation',
        75,
        '20000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000001',
        CURRENT_DATE + INTERVAL '30 days',
        '00000000-0000-0000-0000-000000000001',
        ARRAY['enterprise', 'recurring']
    ),
    (
        '30000000-0000-0000-0000-000000000002',
        'Marketing Platform - TechStart',
        'Implementation of marketing automation platform',
        45000.00,
        'proposal',
        50,
        '20000000-0000-0000-0000-000000000002',
        '10000000-0000-0000-0000-000000000002',
        CURRENT_DATE + INTERVAL '60 days',
        '00000000-0000-0000-0000-000000000001',
        ARRAY['marketing', 'saas']
    ),
    (
        '30000000-0000-0000-0000-000000000003',
        'Consulting Services - Global Solutions',
        'Q1 consulting engagement',
        200000.00,
        'closed_won',
        100,
        '20000000-0000-0000-0000-000000000003',
        '10000000-0000-0000-0000-000000000003',
        CURRENT_DATE - INTERVAL '10 days',
        '00000000-0000-0000-0000-000000000001',
        ARRAY['consulting', 'high-value']
    )
ON CONFLICT (id) DO NOTHING;

-- Update closed deal
UPDATE deals SET closed_date = CURRENT_DATE - INTERVAL '10 days'
WHERE id = '30000000-0000-0000-0000-000000000003';

-- =====================================================
-- STEP 7: CREATE SAMPLE TASKS
-- =====================================================

INSERT INTO tasks (
    title, description, task_type, priority, status,
    contact_id, deal_id, assigned_to, created_by, due_date
)
VALUES
    (
        'Follow up on proposal',
        'Send follow-up email regarding the enterprise license proposal',
        'email',
        'high',
        'pending',
        '20000000-0000-0000-0000-000000000001',
        '30000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000001',
        CURRENT_DATE + INTERVAL '2 days'
    ),
    (
        'Schedule demo call',
        'Set up product demo for TechStart marketing team',
        'call',
        'medium',
        'pending',
        '20000000-0000-0000-0000-000000000002',
        '30000000-0000-0000-0000-000000000002',
        '00000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000001',
        CURRENT_DATE + INTERVAL '5 days'
    ),
    (
        'Send contract',
        'Prepare and send consulting contract to Global Solutions',
        'deadline',
        'urgent',
        'completed',
        '20000000-0000-0000-0000-000000000003',
        '30000000-0000-0000-0000-000000000003',
        '00000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000001',
        CURRENT_DATE - INTERVAL '15 days'
    );

-- Update completed task
UPDATE tasks SET completed_at = CURRENT_DATE - INTERVAL '12 days'
WHERE title = 'Send contract';

-- =====================================================
-- STEP 8: CREATE SAMPLE ACTIVITIES
-- =====================================================

INSERT INTO activities (
    activity_type, subject, description, contact_id, company_id, deal_id, created_by
)
VALUES
    (
        'call',
        'Discovery call with John Smith',
        'Discussed requirements for enterprise license. Very interested in advanced features.',
        '20000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000001',
        '30000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000001'
    ),
    (
        'email',
        'Sent pricing proposal',
        'Sent detailed pricing breakdown for 250 user license',
        '20000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000001',
        '30000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000001'
    ),
    (
        'meeting',
        'Initial meeting with Sarah',
        'Met with Sarah to discuss marketing platform needs. Scheduled follow-up demo.',
        '20000000-0000-0000-0000-000000000002',
        '10000000-0000-0000-0000-000000000002',
        '30000000-0000-0000-0000-000000000002',
        '00000000-0000-0000-0000-000000000001'
    ),
    (
        'note',
        'Contract signed!',
        'David signed the Q1 consulting contract. Deal closed won.',
        '20000000-0000-0000-0000-000000000003',
        '10000000-0000-0000-0000-000000000003',
        '30000000-0000-0000-0000-000000000003',
        '00000000-0000-0000-0000-000000000001'
    );

-- =====================================================
-- STEP 9: CREATE EMAIL TEMPLATES
-- =====================================================

INSERT INTO email_templates (
    name, subject, body, variables, category, created_by, is_shared
)
VALUES
    (
        'Welcome Email',
        'Welcome to our platform, {{first_name}}!',
        'Hi {{first_name}},

Thank you for your interest in our platform. We''re excited to help {{company_name}} achieve its goals.

I wanted to personally reach out to schedule a brief call to discuss your needs and how we can help.

Are you available for a 15-minute call this week?

Best regards,
{{user_name}}',
        ARRAY['first_name', 'company_name', 'user_name'],
        'welcome',
        '00000000-0000-0000-0000-000000000001',
        TRUE
    ),
    (
        'Follow-up Template',
        'Following up on our conversation',
        'Hi {{first_name}},

I wanted to follow up on our conversation from {{last_contact_date}}.

Based on our discussion, I believe our {{product_name}} would be a great fit for {{company_name}}.

Would you like to schedule a demo to see it in action?

Best regards,
{{user_name}}',
        ARRAY['first_name', 'last_contact_date', 'product_name', 'company_name', 'user_name'],
        'follow_up',
        '00000000-0000-0000-0000-000000000001',
        TRUE
    ),
    (
        'Proposal Sent',
        'Proposal for {{company_name}}',
        'Hi {{first_name}},

Thank you for your time today. As discussed, I''ve attached our proposal for {{deal_name}}.

The investment is {{deal_amount}} with an expected timeline of {{timeline}}.

Key benefits include:
- {{benefit_1}}
- {{benefit_2}}
- {{benefit_3}}

Please let me know if you have any questions. I''m happy to jump on a call to discuss.

Best regards,
{{user_name}}',
        ARRAY['first_name', 'company_name', 'deal_name', 'deal_amount', 'timeline', 'benefit_1', 'benefit_2', 'benefit_3', 'user_name'],
        'proposal',
        '00000000-0000-0000-0000-000000000001',
        TRUE
    );

-- =====================================================
-- STEP 10: CREATE DEFAULT PIPELINE
-- =====================================================

INSERT INTO pipelines (name, description, stages, is_default)
VALUES (
    'Standard Sales Pipeline',
    'Default sales pipeline with standard stages',
    '[
        {"name": "prospecting", "probability": 10, "order": 1},
        {"name": "qualification", "probability": 25, "order": 2},
        {"name": "proposal", "probability": 50, "order": 3},
        {"name": "negotiation", "probability": 75, "order": 4},
        {"name": "closed_won", "probability": 100, "order": 5},
        {"name": "closed_lost", "probability": 0, "order": 6}
    ]'::jsonb,
    TRUE
);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

DO $$
DECLARE
    crm_perm_count INTEGER;
    contact_count INTEGER;
    deal_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO crm_perm_count 
    FROM permissions 
    WHERE resource IN ('contacts', 'companies', 'deals', 'tasks', 'activities', 'templates', 'crm');
    RAISE NOTICE 'CRM permissions created: %', crm_perm_count;
    
    SELECT COUNT(*) INTO contact_count FROM contacts;
    RAISE NOTICE 'Sample contacts created: %', contact_count;
    
    SELECT COUNT(*) INTO deal_count FROM deals;
    RAISE NOTICE 'Sample deals created: %', deal_count;
END $$;

COMMENT ON TABLE contacts IS 'Seeded with 3 sample contacts across different companies';
COMMENT ON TABLE companies IS 'Seeded with 3 sample companies (customer, prospect types)';
COMMENT ON TABLE deals IS 'Seeded with 3 sample deals at different stages';
COMMENT ON TABLE tasks IS 'Seeded with 3 sample tasks (pending and completed)';
COMMENT ON TABLE activities IS 'Seeded with 4 sample activities (calls, emails, meetings, notes)';
COMMENT ON TABLE email_templates IS 'Seeded with 3 reusable email templates';