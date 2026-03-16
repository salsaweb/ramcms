# 🚀 Advanced CRM Features - Complete Implementation Guide

## 📋 Table of Contents

1. [Installation](#installation)
2. [Custom Field Builder](#custom-field-builder)
3. [Auto-Merge Rules](#auto-merge-rules)
4. [Call Analytics Dashboard](#call-analytics-dashboard)
5. [Email Notifications](#email-notifications)
6. [Advanced Field Types](#advanced-field-types)
7. [Usage Examples](#usage-examples)
8. [Troubleshooting](#troubleshooting)

---

## 🔧 Installation

### Step 1: Run Database Migration

```bash
# Add to package.json scripts
npm run db:migrate:advanced

# Or run directly
psql $DATABASE_URL -f database/migrations/004_advanced_features.sql
```

**What this creates:**

- ✅ 5 new tables (contact_files, duplicate_merge_rules, email_notifications, user_notification_preferences, call_analytics_daily)
- ✅ 3 new SQL functions (should_auto_merge_duplicate, aggregate_call_analytics, get_pending_notifications)
- ✅ 2 new enum types (notification_type, notification_status)
- ✅ Enhanced contact_custom_fields table with 4 new columns
- ✅ Default auto-merge rule (disabled for safety)
- ✅ Notification preferences for all existing users

### Step 2: Verify Installation

```sql
-- Check new tables
SELECT table_name
FROM information_schema.tables
WHERE table_name IN (
  'contact_files',
  'duplicate_merge_rules',
  'email_notifications',
  'user_notification_preferences',
  'call_analytics_daily'
);

-- Check functions
SELECT routine_name
FROM information_schema.routines
WHERE routine_name IN (
  'should_auto_merge_duplicate',
  'aggregate_call_analytics',
  'get_pending_notifications'
);
```

### Step 3: Restart Application

```bash
npm run dev
```

### Step 4: Access New Features

**Custom Fields:** `/dashboard/crm/settings/custom-fields`  
**Merge Rules:** `/dashboard/crm/settings/merge-rules`  
**Call Analytics:** `/dashboard/crm/analytics`

---

## 🏗️ Custom Field Builder

### Overview

Visual interface to create custom fields without writing code.

**Location:** `/dashboard/crm/settings/custom-fields`

### Supported Field Types

| Type            | Description            | Use Case                 |
| --------------- | ---------------------- | ------------------------ |
| **text**        | Single line input      | URLs, short text         |
| **textarea**    | Multi-line input       | Notes, descriptions      |
| **number**      | Numeric values         | Quantities, scores       |
| **date**        | Date picker            | Deadlines, anniversaries |
| **boolean**     | Checkbox               | Yes/no questions         |
| **select**      | Single choice dropdown | Categories, status       |
| **multiselect** | Multiple choices       | Tags, skills, interests  |
| **file**        | Document upload        | Contracts, certificates  |

### Creating a Custom Field

**Example 1: Simple Text Field**

```
1. Navigate to Custom Fields page
2. Fill form:
   - Field Name: linkedin_url
   - Field Label: LinkedIn Profile
   - Field Type: text
   - Field Group: Social Media
   - Help Text: Full LinkedIn profile URL
   - Required: No
   - Active: Yes
3. Click "Create Field"
```

**Example 2: Multi-Select Field**

```
Field Name: product_interests
Field Label: Product Interests
Field Type: multiselect
Options: ["CRM", "Marketing Automation", "Analytics", "Support Tools"]
Field Group: Sales Preferences
Help Text: Select all products the contact is interested in
Required: No
Active: Yes
```

**Example 3: File Upload Field**

```
Field Name: signed_nda
Field Label: Signed NDA
Field Type: file
Validation Rules: {"max_size": 5242880, "allowed_types": ["pdf"]}
Field Group: Legal
Help Text: Upload signed non-disclosure agreement
Required: No (can make required for enterprise contacts)
Active: Yes
```

### Field Storage

**Schema Definitions:**

- Table: `contact_custom_fields`
- Stores: field_name, field_label, field_type, options, validation, etc.

**Contact Values:**

- Column: `contacts.custom_fields` (JSONB)
- Format: `{"field_name": "value", "product_interests": ["CRM", "Analytics"]}`

**Files:**

- Table: `contact_files`
- Stores: file metadata, URLs, upload info

### Managing Fields

**Activate/Deactivate:**

- Click "Activate" or "Deactivate" button
- Inactive fields hidden from forms
- Data preserved when deactivated

**Delete:**

- Click "Delete" button
- Confirms before deletion
- ⚠️ Removes field definition and all values

**Reordering:**

- Set `display_order` value
- Lower numbers appear first
- Groups displayed alphabetically

---

## 🤖 Auto-Merge Rules

### Overview

Automatically detect and optionally merge duplicate contacts based on configurable rules.

**Location:** `/dashboard/crm/settings/merge-rules`

### ⚠️ Safety First

**Default State:** All rules created inactive with auto-merge disabled

**Recommended Workflow:**

1. Create rule with notifications only
2. Monitor notifications for 1-2 weeks
3. Review merge suggestions
4. Adjust similarity threshold
5. Enable auto-merge only when confident

### Rule Components

#### 1. Similarity Score (50-100%)

**Calculation:**

- Email match: 40 points
- Phone match: 30 points
- Name match: 30 points

**Recommended Thresholds:**

- 98-100%: Very safe (perfect match)
- 95-97%: Safe (high confidence)
- 90-94%: Review recommended
- 85-89%: High false positive risk
- <85%: Not recommended

#### 2. Required Matches

Force specific fields to match:

- **Email:** Exact email address (recommended)
- **Phone:** Exact phone number
- **Name:** Case-insensitive first + last name

**Best Practice:**

```json
{
  "email": true, // Always require email
  "phone": false, // Optional phone match
  "name": false // Optional name match
}
```

#### 3. Master Selection Rules

**most_recent:** Newer contact becomes master

- Use when: Recent data is more accurate
- Example: Latest import has updated info

**oldest:** Older contact becomes master

- Use when: Original record has historical value
- Example: Preserve original contact owner

**highest_score:** Contact with higher lead score

- Use when: Lead quality determines priority
- Example: Keep most qualified lead

**most_complete:** Contact with more filled fields

- Use when: Data completeness matters
- Example: Maximize information retention

**manual:** Requires human selection

- Use when: Complex decisions needed
- Example: High-value accounts

### Creating a Rule

**Conservative Rule (Recommended Start):**

```
Rule Name: High Confidence Email Match
Description: Auto-detect duplicates with matching emails
Min Similarity: 98%
Required Matches:
  ✅ Email
  ❌ Phone
  ❌ Name
Master Selection: Most Complete
Auto-Merge: ❌ Disabled
Notifications: ✅ Enabled
Active: ✅ Yes
```

**Aggressive Rule (Use with Caution):**

```
Rule Name: Email-Only Auto-Merge
Description: Automatically merge contacts with matching emails
Min Similarity: 95%
Required Matches:
  ✅ Email
  ❌ Phone
  ❌ Name
Master Selection: Most Recent
Auto-Merge: ✅ Enabled (⚠️ Automatic!)
Notifications: ✅ Enabled
Active: ✅ Yes
```

### Testing Auto-Merge

**Before Enabling:**

1. Create test duplicates:

```sql
INSERT INTO contacts (first_name, last_name, email, owner_id)
VALUES
  ('Test', 'User', 'test@example.com', 'your-user-id'),
  ('Test', 'User', 'test@example.com', 'your-user-id');
```

2. Run duplicate detection:

```sql
SELECT * FROM detect_duplicate_contacts();
```

3. Check if rule triggers:

```sql
SELECT * FROM should_auto_merge_duplicate(
  'contact1-id',
  'contact2-id',
  100, -- Perfect match
  '{"email_match": true, "phone_match": false, "name_match": true}'::jsonb
);
```

4. Monitor notifications:

```sql
SELECT * FROM email_notifications
WHERE notification_type = 'duplicate_found'
ORDER BY created_at DESC;
```

5. Review merge history:

```sql
SELECT * FROM contact_merge_history
ORDER BY merged_at DESC;
```

---

## 📊 Call Analytics Dashboard

### Overview

Comprehensive call performance metrics and team analytics.

**Location:** `/dashboard/crm/analytics`

### Key Metrics

**Total Calls:** Count of all calls in period  
**Answer Rate:** % of calls answered  
**Avg Duration:** Average call length  
**Total Time:** Cumulative time on calls

### Data Collection

**Automatic:** Calls logged via CallLogForm  
**Manual:** Import from phone system  
**Aggregation:** Daily rollup at midnight

### Running Daily Aggregation

**Manual Trigger:**

```sql
SELECT aggregate_call_analytics(CURRENT_DATE);
```

**Automated (Cron Job):**

```bash
# Add to crontab
0 1 * * * psql $DATABASE_URL -c "SELECT aggregate_call_analytics(CURRENT_DATE);"
```

**Backfill Historical:**

```sql
-- Aggregate last 30 days
DO $$
DECLARE
  d DATE;
BEGIN
  FOR d IN SELECT generate_series(
    CURRENT_DATE - INTERVAL '30 days',
    CURRENT_DATE,
    '1 day'::interval
  )::date
  LOOP
    PERFORM aggregate_call_analytics(d);
  END LOOP;
END $$;
```

### Understanding Charts

**Daily Call Volume:**

- Bar chart showing calls per day
- Helps identify busy periods
- Spot trends and patterns

**Average Duration:**

- Track call efficiency
- Longer = more engagement
- Shorter = quick touches

**7-Day Trend:**

- Week-over-week comparison
- Color-coded by answer rate:
  - 🟢 Green: 70%+ (excellent)
  - 🟡 Yellow: 40-69% (good)
  - 🔴 Red: <40% (needs work)

**Top Callers:**

- Leaderboard by volume
- Individual stats:
  - Total calls
  - Answered calls
  - Answer rate %
  - Total time
  - Avg duration
- Identify top performers
- Coach low performers

### Exporting Data

**SQL Query for CSV:**

```sql
COPY (
  SELECT
    analytics_date,
    u.name as user_name,
    total_calls,
    answered_calls,
    ROUND(100.0 * answered_calls / NULLIF(total_calls, 0), 2) as answer_rate,
    total_duration_seconds / 60 as total_minutes,
    avg_duration_seconds as avg_duration
  FROM call_analytics_daily cad
  INNER JOIN users u ON cad.user_id = u.id
  WHERE analytics_date >= CURRENT_DATE - INTERVAL '30 days'
  ORDER BY analytics_date DESC, total_calls DESC
) TO '/tmp/call_analytics.csv' CSV HEADER;
```

---

## 📧 Email Notifications

### Overview

Automated email alerts for CRM events.

### Notification Types

| Type             | When Triggered                     | Recipients             |
| ---------------- | ---------------------------------- | ---------------------- |
| duplicate_found  | High-confidence duplicate detected | Admins                 |
| duplicate_merged | Contacts auto-merged               | Contact owner + admins |
| reminder_due     | Reminder within X minutes          | Assigned user          |
| reminder_overdue | Reminder past due                  | Assigned user          |
| contact_assigned | Ownership transferred              | New owner              |
| deal_won         | Deal closed won                    | Deal owner + team      |
| deal_lost        | Deal closed lost                   | Deal owner             |
| task_assigned    | Task assigned to user              | Assigned user          |

### User Preferences

**Location:** `user_notification_preferences` table

**Default Settings:**

```json
{
  "reminder_email_enabled": true,
  "reminder_advance_minutes": 60,
  "duplicate_email_enabled": true,
  "assignment_email_enabled": true,
  "deal_email_enabled": true,
  "daily_digest_enabled": false,
  "daily_digest_time": "09:00:00",
  "email_frequency": "immediate"
}
```

**Email Frequencies:**

- **immediate:** Send as events occur
- **hourly:** Batch every hour
- **daily:** Once per day digest
- **weekly:** Weekly summary
- **never:** Disable all emails

### Implementing Email Sender

**Example using Nodemailer:**

```typescript
import nodemailer from "nodemailer";
import { supabaseAdmin } from "@/lib/supabase/admin";

async function processEmailQueue() {
  // Get pending notifications
  const { data: notifications } = await supabaseAdmin.rpc(
    "get_pending_notifications",
    { p_limit: 50 },
  );

  const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  for (const notification of notifications || []) {
    try {
      await transporter.sendMail({
        from: process.env.FROM_EMAIL,
        to: notification.recipient_email,
        subject: notification.subject,
        html: notification.body_html,
      });

      // Mark as sent
      await supabaseAdmin
        .from("email_notifications")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
        })
        .eq("id", notification.notification_id);
    } catch (error) {
      // Mark as failed
      await supabaseAdmin
        .from("email_notifications")
        .update({
          status: "failed",
          failed_at: new Date().toISOString(),
          error_message: error.message,
          retry_count: notification.retry_count + 1,
        })
        .eq("id", notification.notification_id);
    }
  }
}

// Run every minute
setInterval(processEmailQueue, 60000);
```

### Creating Notifications

**Example: Reminder Due**

```typescript
import { supabaseAdmin } from "@/lib/supabase/admin";

async function sendReminderNotification(reminder: any) {
  const { data: user } = await supabaseAdmin
    .from("users")
    .select("email, name")
    .eq("id", reminder.assigned_to)
    .single();

  if (!user?.email) return;

  await supabaseAdmin.from("email_notifications").insert({
    notification_type: "reminder_due",
    recipient_email: user.email,
    recipient_user_id: reminder.assigned_to,
    subject: `Reminder: ${reminder.reminder_title}`,
    body_html: `
      <h2>Upcoming Reminder</h2>
      <p>Hi ${user.name},</p>
      <p>You have a reminder due soon:</p>
      <h3>${reminder.reminder_title}</h3>
      <p>${reminder.reminder_description}</p>
      <p><strong>Due:</strong> ${new Date(reminder.reminder_datetime).toLocaleString()}</p>
      <p><a href="${process.env.APP_URL}/dashboard/crm/reminders">View Reminders</a></p>
    `,
    body_text: `Reminder: ${reminder.reminder_title}\nDue: ${reminder.reminder_datetime}`,
    priority: 7,
    metadata: {
      reminder_id: reminder.id,
      reminder_type: reminder.reminder_type,
    },
  });
}
```

---

## 🎯 Advanced Field Types

### Multi-Select Fields

**Use Cases:**

- Product interests
- Marketing channels
- Skills/certifications
- Communication preferences
- Service tiers

**Configuration:**

```json
{
  "field_name": "communication_preferences",
  "field_label": "How should we contact you?",
  "field_type": "multiselect",
  "field_options": ["Email", "Phone", "SMS", "LinkedIn", "Physical Mail"]
}
```

**Storage:**

```json
{
  "communication_preferences": ["Email", "Phone", "LinkedIn"]
}
```

**Querying:**

```sql
-- Find contacts who prefer email
SELECT * FROM contacts
WHERE custom_fields->>'communication_preferences' LIKE '%Email%';

-- Using JSONB array contains
SELECT * FROM contacts
WHERE custom_fields->'communication_preferences' @> '["Email"]'::jsonb;
```

### File Upload Fields

**Use Cases:**

- Signed contracts
- Certificates/licenses
- Product proposals
- Compliance documents
- ID verification

**Implementation:**

1. **Upload Handler (API Route):**

```typescript
// app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File;
  const contactId = formData.get("contactId") as string;
  const fieldName = formData.get("fieldName") as string;

  if (!file) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Save to storage (example: local disk)
  const filename = `${Date.now()}-${file.name}`;
  const filepath = path.join(process.cwd(), "uploads", filename);
  await writeFile(filepath, buffer);

  // Or upload to S3/Cloudinary
  // const url = await uploadToS3(buffer, filename);

  // Store in database
  const { data } = await supabaseAdmin
    .from("contact_files")
    .insert({
      contact_id: contactId,
      field_name: fieldName,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      file_url: `/uploads/${filename}`,
      storage_path: filepath,
      uploaded_by: session.user.id,
    })
    .select()
    .single();

  return NextResponse.json({ success: true, file: data });
}
```

2. **Client Component:**

```typescript
'use client';

export function FileUploadField({ contactId, fieldName }: Props) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('contactId', contactId);
    formData.append('fieldName', fieldName);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    setUploading(false);

    if (result.success) {
      // Update contact custom_fields
      await updateContact(contactId, {
        custom_fields: {
          [fieldName]: result.file.file_url
        }
      });
    }
  };

  return (
    <input
      type="file"
      onChange={handleUpload}
      disabled={uploading}
    />
  );
}
```

---

## 💡 Usage Examples

### Example 1: Lead Qualification Workflow

**Custom Fields:**

```
- budget_range (select): ["< $10k", "$10k-$50k", "$50k+"]
- decision_maker (boolean)
- decision_timeline (select): ["Immediate", "1-3 months", "3-6 months", "6+ months"]
- pain_points (multiselect): ["Cost", "Efficiency", "Scalability", "Support"]
```

**Auto-Merge Rule:**

```
Rule: Email Match for Leads
Similarity: 90%
Required: Email only
Auto-Merge: Disabled
Notifications: Enabled to sales team
```

**Call Logging:**

```
- Log all discovery calls
- Track duration and outcome
- Set follow-up reminders
- Review analytics weekly
```

### Example 2: Enterprise Account Management

**Custom Fields:**

```
- contract_value (number)
- contract_end_date (date)
- renewal_probability (select): ["High", "Medium", "Low"]
- decision_committee (multiselect): ["CEO", "CFO", "CTO", "Procurement"]
- signed_contract (file)
- executive_sponsor (text)
```

**Auto-Merge Rule:**

```
Rule: High-Value Account Protection
Similarity: 98%
Required: Email + Phone
Auto-Merge: Disabled
Master: Manual selection
Notifications: Enabled to account owners
```

### Example 3: Marketing Campaign Tracking

**Custom Fields:**

```
- campaign_source (select): ["Website", "LinkedIn", "Event", "Referral", "Cold Call"]
- content_downloaded (multiselect): ["Whitepaper", "Case Study", "Demo Video"]
- engagement_score (number)
- last_campaign_date (date)
```

---

## 🔧 Troubleshooting

### Issue: Custom fields not appearing

**Solution:**

```sql
-- Check if field is active
SELECT * FROM contact_custom_fields WHERE is_active = true;

-- Activate field
UPDATE contact_custom_fields
SET is_active = true
WHERE field_name = 'your_field';
```

### Issue: Auto-merge not triggering

**Check:**

1. Rule is active: `is_active = true`
2. Similarity score meets threshold
3. Required matches are met
4. Check function:

```sql
SELECT * FROM should_auto_merge_duplicate(
  'contact1-id',
  'contact2-id',
  95,
  '{"email_match": true}'::jsonb
);
```

### Issue: Email notifications not sending

**Check:**

1. Queue has pending notifications:

```sql
SELECT * FROM email_notifications WHERE status = 'pending';
```

2. User preferences allow emails:

```sql
SELECT * FROM user_notification_preferences
WHERE user_id = 'user-id';
```

3. Process email queue manually
4. Check SMTP configuration

### Issue: Call analytics showing no data

**Solution:**

```sql
-- Run aggregation for today
SELECT aggregate_call_analytics(CURRENT_DATE);

-- Backfill last week
DO $$
DECLARE d DATE;
BEGIN
  FOR d IN SELECT generate_series(
    CURRENT_DATE - 7, CURRENT_DATE, '1 day'
  )::date LOOP
    PERFORM aggregate_call_analytics(d);
  END LOOP;
END $$;
```

---

## 🎉 Success Checklist

- [ ] Migration completed successfully
- [ ] Custom fields page loads
- [ ] Created test custom field
- [ ] Auto-merge rules page loads
- [ ] Created conservative merge rule
- [ ] Call analytics shows data
- [ ] Email notifications configured
- [ ] File upload tested
- [ ] Multi-select field working
- [ ] Tested duplicate detection
- [ ] Reviewed all documentation

---

**🎊 Congratulations! All advanced features are now live!**

For support, check the troubleshooting section or review SQL function source code in the migration file.
