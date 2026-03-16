# 🚀 Advanced CRM Features Documentation

## Overview

This document covers the latest advanced features added to the Enterprise CRM system including custom field builder, email notifications, multi-select/file upload fields, auto-merge rules, and call analytics dashboard.

## ✨ New Features

### 1. 🏗️ Custom Field Builder UI

**Location:** `/dashboard/crm/settings/custom-fields`

**Capabilities:**

- Visual field builder interface
- Support for 8 field types
- Drag-and-drop ordering (planned)
- Field groups for organization
- Validation rules
- Help text and default values
- Active/inactive toggle
- Required field marking

**Field Types Supported:**

1. **Text** - Single line input
2. **Textarea** - Multi-line input
3. **Number** - Numeric values
4. **Date** - Date picker
5. **Boolean** - Checkbox (yes/no)
6. **Select** - Dropdown (single choice)
7. **Multi-Select** - Multiple choices ✨ NEW
8. **File Upload** - Document/image upload ✨ NEW

**Creating a Custom Field:**

```
1. Navigate to CRM Settings → Custom Fields
2. Fill out form:
   - Field Name: internal_key (lowercase, underscores)
   - Field Label: Display Name
   - Field Type: Select type
   - Field Group: Optional category
   - Help Text: Instructions for users
   - Display Order: Sort position
   - Options: For select/multi-select (JSON array)
   - Required: Toggle if mandatory
   - Active: Toggle visibility
3. Click "Create Field"
4. Field immediately available on contact forms
```

**Field Storage:**

- Definitions: `contact_custom_fields` table
- Values: `contacts.custom_fields` JSONB column
- Files: `contact_files` table with references

**Example Field Definition:**

```json
{
  "field_name": "deal_size_preference",
  "field_label": "Preferred Deal Size",
  "field_type": "multiselect",
  "field_options": ["Small (<$50k)", "Medium ($50k-$250k)", "Large (>$250k)"],
  "field_group": "Sales Preferences",
  "is_required": false,
  "is_active": true,
  "display_order": 10
}
```

### 2. 📧 Email Reminder Notifications

**System:** `email_notifications` table + queue processor

**Notification Types:**

- 📅 **Reminder Due** - When reminder datetime approaches
- ⏰ **Reminder Overdue** - Past due reminders
- 🔄 **Duplicate Found** - High-confidence duplicates detected
- ✅ **Duplicate Merged** - Contacts successfully merged
- 👤 **Contact Assigned** - Ownership transferred
- 💰 **Deal Won** - Deal closed won
- ❌ **Deal Lost** - Deal closed lost
- 📋 **Task Assigned** - Task assigned to user
- 🔔 **Custom** - Custom notifications

**User Preferences:**
Located in `user_notification_preferences`:

```javascript
{
  reminder_email_enabled: true,
  reminder_advance_minutes: 60, // Notify 1 hour before
  duplicate_email_enabled: true,
  assignment_email_enabled: true,
  deal_email_enabled: true,
  daily_digest_enabled: false,
  daily_digest_time: '09:00:00',
  email_frequency: 'immediate' // or hourly, daily, weekly
}
```

**Email Queue Processing:**

```sql
-- Get pending notifications
SELECT * FROM get_pending_notifications(100);

-- Mark as sent
UPDATE email_notifications
SET status = 'sent', sent_at = NOW()
WHERE id = 'notification-id';

-- Handle failures
UPDATE email_notifications
SET status = 'failed',
    failed_at = NOW(),
    error_message = 'SMTP error',
    retry_count = retry_count + 1
WHERE id = 'notification-id';
```

**Notification Priority:**

- 10 = Critical (immediate)
- 7-9 = High
- 4-6 = Medium (default)
- 1-3 = Low
- 0 = Bulk

### 3. 🎯 Advanced Custom Field Types

#### Multi-Select Fields

**Purpose:** Allow users to select multiple options from a predefined list

**Configuration:**

```json
{
  "field_type": "multiselect",
  "field_options": [
    "Email Marketing",
    "Social Media",
    "Direct Mail",
    "Events",
    "Referrals",
    "Cold Calling"
  ]
}
```

**Storage:** Array in JSONB

```json
{
  "marketing_channels": ["Email Marketing", "Social Media", "Referrals"]
}
```

**Use Cases:**

- Marketing channels
- Product interests
- Communication preferences
- Skills/certifications
- Industry segments

#### File Upload Fields

**Purpose:** Attach documents, contracts, presentations to contacts

**Configuration:**

```json
{
  "field_type": "file",
  "validation_rules": {
    "max_size": 10485760, // 10MB
    "allowed_types": ["pdf", "doc", "docx", "jpg", "png"],
    "max_files": 5
  }
}
```

**File Storage:**
Table: `contact_files`

```sql
{
  id: uuid,
  contact_id: uuid,
  field_name: varchar, -- Links to custom field
  file_name: varchar,
  file_type: varchar,
  file_size: integer,
  file_url: text, -- Cloud storage URL
  storage_path: text,
  uploaded_by: uuid,
  uploaded_at: timestamptz,
  metadata: jsonb
}
```

**File Upload Flow:**

```
1. User selects file
2. Client validates size/type
3. Upload to cloud storage (S3, Cloudinary, etc.)
4. Create record in contact_files
5. Store file_url in contact.custom_fields
6. Display with download/preview links
```

**Use Cases:**

- Signed contracts
- Proposals submitted
- Product brochures
- Certifications
- ID verification
- Profile photos

### 4. 🤖 Duplicate Auto-Merge Rules

**Location:** `duplicate_merge_rules` table

**Rule Configuration:**

```javascript
{
  rule_name: "High Confidence Email Match",
  description: "Auto-merge contacts with matching emails",
  is_active: false, // Safety: disabled by default
  min_similarity_score: 95, // 95% or higher
  required_matches: {
    email: true,    // Must match
    phone: false,   // Optional
    name: false     // Optional
  },
  auto_merge_enabled: false, // Manual approval required
  master_selection_rule: "most_recent", // or oldest, highest_score, most_complete
  notification_enabled: true,
  notify_users: ["admin-uuid-1", "admin-uuid-2"]
}
```

**Master Selection Rules:**

1. **most_recent** - Newer contact becomes master
2. **oldest** - Older contact becomes master
3. **highest_score** - Contact with higher lead score
4. **most_complete** - Contact with more filled fields
5. **manual** - Requires human selection

**Auto-Merge Process:**

```
1. Duplicate detected with similarity score
2. Check active auto-merge rules (by score desc)
3. Verify required_matches criteria
4. If criteria met:
   a. Determine master based on selection rule
   b. If auto_merge_enabled:
      - Merge automatically
      - Send notification
      - Log in merge_history
   c. If not auto_merge_enabled:
      - Send notification for review
      - Mark duplicate for manual merge
5. If no rules match:
   - Add to pending duplicates
   - Wait for manual review
```

**Safety Features:**

- **Disabled by default** - Must explicitly enable
- **High threshold** - Default 95% similarity
- **Notification system** - Alerts on merges
- **Audit trail** - Complete merge history
- **Reversible** - Merged data stored in history

**SQL Function:**

```sql
SELECT * FROM should_auto_merge_duplicate(
  'contact1-uuid',
  'contact2-uuid',
  92.5, -- similarity score
  '{"email_match": true, "phone_match": false, "name_match": true}'::jsonb
);

-- Returns:
-- should_merge | rule_id | master_contact_id
-- TRUE         | 1       | contact1-uuid
```

### 5. 📊 Call Analytics Dashboard

**Location:** `/dashboard/crm/analytics`

**Key Metrics:**

- **Total Calls** - Last 30 days
- **Answer Rate** - % of answered calls
- **Avg Duration** - Per call average
- **Total Time** - Cumulative on calls

**Breakdowns:**

1. **Call Direction**
   - Inbound vs Outbound
   - Visual progress bars
   - Percentage distribution

2. **Call Outcomes**
   - Answered
   - Voicemail
   - No Answer
   - Busy
   - Failed

3. **Daily Trends**
   - Calls per day (line chart)
   - Duration trends
   - Answer rate over time

4. **Top Callers**
   - User rankings
   - Individual stats:
     - Total calls
     - Answered calls
     - Answer rate (color-coded)
     - Total time
     - Average duration

**Data Aggregation:**

```sql
-- Daily aggregation (run nightly)
SELECT aggregate_call_analytics(CURRENT_DATE);

-- Creates/updates:
call_analytics_daily (
  analytics_date,
  user_id,
  total_calls,
  inbound_calls,
  outbound_calls,
  answered_calls,
  voicemail_calls,
  missed_calls,
  total_duration_seconds,
  avg_duration_seconds,
  unique_contacts_called
)
```

**Performance Indicators:**

```
Answer Rate:
🟢 70%+ = Excellent (green)
🟡 40-69% = Good (yellow)
🔴 <40% = Needs improvement (red)

Call Volume:
📈 Trending up = Good activity
📉 Trending down = Needs attention
```

**Use Cases:**

- Monitor team performance
- Identify top performers
- Track call efficiency
- Optimize call times
- Measure contact rates
- Report to management

## 🗄️ Database Schema Updates

### New Tables

**1. contact_files**

```sql
id, contact_id, field_name, file_name,
file_type, file_size, file_url, storage_path,
uploaded_by, uploaded_at, metadata
```

**2. duplicate_merge_rules**

```sql
id, rule_name, description, is_active,
min_similarity_score, required_matches,
auto_merge_enabled, master_selection_rule,
notification_enabled, notify_users,
created_by, created_at, updated_at
```

**3. email_notifications**

```sql
id, notification_type, recipient_email,
recipient_user_id, subject, body_html, body_text,
status, priority, scheduled_for, sent_at,
failed_at, error_message, metadata,
retry_count, max_retries, created_at
```

**4. user_notification_preferences**

```sql
user_id, reminder_email_enabled, reminder_advance_minutes,
duplicate_email_enabled, assignment_email_enabled,
deal_email_enabled, daily_digest_enabled,
daily_digest_time, email_frequency, updated_at
```

**5. call_analytics_daily**

```sql
id, analytics_date, user_id,
total_calls, inbound_calls, outbound_calls,
answered_calls, voicemail_calls, missed_calls,
total_duration_seconds, avg_duration_seconds,
unique_contacts_called, created_at
```

### Enhanced Tables

**contact_custom_fields** - Added columns:

- `validation_rules` JSONB
- `default_value` TEXT
- `help_text` TEXT
- `field_group` VARCHAR(100)

## 🚀 Installation

### 1. Run Migration

```bash
psql $DATABASE_URL -f database/migrations/004_advanced_features.sql
```

This creates:

- 5 new tables
- 3 new SQL functions
- 2 new enum types
- Required indexes
- Default auto-merge rule (disabled)
- Notification preferences for existing users

### 2. Update package.json

```json
{
  "scripts": {
    "db:migrate:advanced": "psql $DATABASE_URL -f database/migrations/004_advanced_features.sql"
  }
}
```

### 3. Restart Application

```bash
npm run dev
```

## 💡 Usage Guide

### Creating Custom Fields

**Text Field:**

```
Field Name: department
Field Label: Department
Field Type: text
Required: No
Active: Yes
```

**Multi-Select Field:**

```
Field Name: product_interests
Field Label: Product Interests
Field Type: multiselect
Options: ["Product A", "Product B", "Product C", "Product D"]
Required: No
Active: Yes
```

**File Upload Field:**

```
Field Name: signed_contract
Field Label: Signed Contract
Field Type: file
Validation: Max 10MB, PDF only
Required: No
Active: Yes
```

### Configuring Auto-Merge Rules

**Safety-First Approach:**

```
1. Create rule with auto_merge_enabled = FALSE
2. Test with notification_enabled = TRUE
3. Monitor for false positives
4. Adjust min_similarity_score as needed
5. Only enable auto_merge after thorough testing
```

**Conservative Rule:**

```javascript
{
  min_similarity_score: 98,
  required_matches: {
    email: true,
    phone: true,
    name: true
  },
  auto_merge_enabled: false, // Manual review required
  master_selection_rule: "manual"
}
```

**Aggressive Rule (use with caution):**

```javascript
{
  min_similarity_score: 85,
  required_matches: {
    email: true,
    phone: false,
    name: false
  },
  auto_merge_enabled: true,
  master_selection_rule: "most_complete"
}
```

### Using Call Analytics

**Daily Monitoring:**

```
1. Check answer rate trend
2. Review top performers
3. Identify low performers
4. Analyze peak call times
5. Optimize team scheduling
```

**Weekly Review:**

```
1. Compare week-over-week
2. Calculate team averages
3. Set performance goals
4. Recognize top callers
5. Coach low performers
```

## 📈 Best Practices

### Custom Fields

✅ **DO:**

- Use clear, descriptive labels
- Group related fields
- Add helpful help text
- Use select fields for consistency
- Test before making required
- Keep field count manageable

❌ **DON'T:**

- Create duplicate standard fields
- Use technical names as labels
- Make all fields required
- Create too many fields
- Change field types after creation

### Auto-Merge Rules

✅ **DO:**

- Start with notifications only
- Use high similarity thresholds (95%+)
- Require email match
- Test thoroughly before enabling
- Monitor merge results
- Keep audit trail

❌ **DON'T:**

- Enable auto-merge without testing
- Use low similarity scores (<90%)
- Skip notifications
- Ignore failed merges
- Delete merge history

### Email Notifications

✅ **DO:**

- Respect user preferences
- Include unsubscribe links
- Use appropriate priorities
- Handle bounces gracefully
- Retry failed sends
- Track open/click rates

❌ **DON'T:**

- Spam users
- Ignore opt-outs
- Send without preference check
- Retry infinitely
- Include sensitive data

## 🔮 Future Enhancements

**Planned:**

- [ ] Visual custom field editor (drag-drop)
- [ ] Conditional field visibility rules
- [ ] Formula fields (calculated)
- [ ] Lookup fields (cross-entity)
- [ ] Real-time email notifications
- [ ] SMS notifications
- [ ] Push notifications (mobile)
- [ ] Advanced analytics (forecasting)
- [ ] Call recording integration
- [ ] AI-powered duplicate detection
- [ ] Bulk operations on custom fields
- [ ] Field history/audit trail

---

**All features are production-ready and fully integrated!** 🎉

Use these features responsibly, especially auto-merge rules.
Always test in a staging environment first.
