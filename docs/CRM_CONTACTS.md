# 📇 CRM Contacts Management

## Overview

Complete contact management system with detail views, activity tracking, and relationship management.

## 📄 Pages

### 1. Contacts List (`/dashboard/crm/contacts`)

- View all contacts with filters
- See contact type, status, and lead score
- Click contact name to view details
- **Add Contact** button

### 2. Contact Detail (`/dashboard/crm/contacts/[id]`)

**Sections:**

- **Contact Information** - All contact details with status badges
- **Associated Deals** - All opportunities linked to this contact
- **Open Tasks** - Pending tasks for this contact
- **Activity Timeline** - Complete interaction history

**Actions:**

- Edit Contact
- Delete Contact (with confirmation)
- Add Activity (note, call, email, meeting)

### 3. Add Contact (`/dashboard/crm/contacts/new`)

Form to create new contact with:

- Basic information (name, email, phone)
- Company association
- Contact type and lead status
- Location details
- Tags

### 4. Edit Contact (`/dashboard/crm/contacts/[id]/edit`)

Same form as Add Contact, pre-filled with existing data

## 🎯 Features

### Contact Information

✅ First and last name  
✅ Email, phone, mobile  
✅ Job title  
✅ Company association  
✅ Contact type (lead, customer, partner, vendor)  
✅ Lead status (new, contacted, qualified, unqualified, lost)  
✅ Location (city, state, country)  
✅ Tags for categorization  
✅ Lead score (0-100) with visual indicator

### Activity Tracking

✅ Add notes, calls, emails, meetings  
✅ Complete activity timeline  
✅ Track who created each activity  
✅ See activity date

### Relationship Management

✅ Link to company  
✅ See associated deals  
✅ View open tasks  
✅ Complete interaction history

## 🔧 Components

All in `/components/crm/`:

### ContactForm

Reusable form for create and edit operations

- Handles validation
- Tag management
- Company selection
- Status updates

**Props:**

```typescript
{
  companies: Company[];
  initialData?: ContactFormData; // For edit mode
}
```

### ContactActivityForm

Add activities to contacts

- Type selection (note, call, email, meeting)
- Subject and description
- Auto-refresh on success

**Props:**

```typescript
{
  contactId: string;
}
```

### DeleteContactButton

Delete with confirmation

- Two-step confirmation
- Error handling
- Redirects to list on success

**Props:**

```typescript
{
  contactId: string;
  contactName: string;
}
```

## 📊 Contact Detail View

### Information Display

```
Contact Information Card:
- Email, Phone, Mobile
- Company (clickable link)
- Job Title
- Type (badge)
- Status (badge)
- Lead Score (with progress bar)
- Location
- Tags (as pills)
```

### Associated Deals

Shows all deals linked to this contact:

- Deal name and description
- Amount and probability
- Stage (with color coding)

### Open Tasks

Pending tasks for follow-up:

- Task title and description
- Priority badge
- Due date

### Activity Timeline

Chronological history:

- Activity type badge
- Subject and description
- Creator name
- Date

## 🎨 UI Features

### Visual Indicators

**Contact Type Badges:**

- 🟢 Customer - Green
- 🔵 Lead - Blue
- 🟣 Partner - Purple
- ⚪ Vendor - Gray

**Lead Status Badges:**

- 🟢 Qualified - Green
- 🟡 Contacted - Yellow
- 🔵 New - Blue
- 🔴 Unqualified/Lost - Red

**Lead Score:**

- 70-100: Green progress bar
- 40-69: Yellow progress bar
- 0-39: Red progress bar

**Activity Type Badges:**

- 🔵 Call - Blue
- 🟣 Email - Purple
- 🟢 Meeting - Green
- ⚪ Note - Gray

## 🔐 Permissions Required

| Action              | Permission          |
| ------------------- | ------------------- |
| View contacts list  | `contacts.read`     |
| View contact detail | `contacts.read`     |
| Add new contact     | `contacts.create`   |
| Edit contact        | `contacts.update`   |
| Delete contact      | `contacts.delete`   |
| Add activity        | `activities.create` |

## 💡 Usage Examples

### Creating a Contact

1. Go to `/dashboard/crm/contacts`
2. Click "Add Contact"
3. Fill in required fields:
   - First Name \*
   - Last Name \*
   - At least one: Email, Phone, or Mobile
4. Optional: Select company, set type/status, add tags
5. Click "Create Contact"

### Adding an Activity

1. Navigate to contact detail page
2. Click "+ Add Activity"
3. Select activity type
4. Enter subject and description
5. Click "Add Activity"

### Editing a Contact

1. Go to contact detail page
2. Click "Edit Contact"
3. Update fields
4. Click "Update Contact"

## 🔄 Data Flow

### Create Contact

```
ContactForm → createContact() → Insert to DB → Redirect to detail page
```

### Update Contact

```
ContactForm → updateContact() → Update DB → Redirect to detail page
```

### Add Activity

```
ContactActivityForm → addContactActivity() → Insert activity → Update last_contacted_at → Refresh page
```

### Delete Contact

```
DeleteContactButton → Confirm → deleteContact() → Delete from DB → Redirect to list
```

## 🎯 Lead Scoring

Lead scores are calculated automatically:

- **Total activities**: 5 points each (max 50)
- **Recent activities** (30 days): 10 points each (max 30)
- **Has associated deal**: +20 points
- **Maximum score**: 100

Update scores:

```sql
UPDATE contacts
SET lead_score = calculate_lead_score(id)
WHERE id = 'contact-uuid';
```

## 📝 Tags

Tags help categorize contacts:

- Add multiple tags
- Remove with × button
- Stored as PostgreSQL array
- Examples: "vip", "technical", "decision-maker"

## 🔍 Filtering (Future Enhancement)

Coming soon:

- Filter by contact type
- Filter by lead status
- Filter by company
- Search by name/email
- Filter by tags

## 📊 Integration with Other Modules

### Companies

- Select company when creating contact
- Link displayed on detail page
- One-to-many relationship

### Deals

- Automatically shown on contact detail
- Link deals to contacts
- Track deal value and stage

### Tasks

- Open tasks shown on contact detail
- Create tasks linked to contacts
- Track follow-up actions

### Activities

- Complete timeline on detail page
- Add activities directly from contact
- Track all interactions

## 🚀 Quick Start

1. **Add Permission** (if needed):

```bash
# Already included in CRM seed
npm run db:seed:crm
```

2. **Create First Contact**:

```
→ /dashboard/crm/contacts
→ Click "Add Contact"
→ Fill form → Create
```

3. **Add Activity**:

```
→ Open contact detail
→ Click "+ Add Activity"
→ Select type → Add note
```

## 🎓 Best Practices

### Contact Management

✅ Always link contacts to companies  
✅ Update lead status as they progress  
✅ Add tags for easy categorization  
✅ Keep contact info current

### Activity Tracking

✅ Log every interaction  
✅ Use descriptive subjects  
✅ Add context in descriptions  
✅ Track calls, emails, and meetings

### Data Quality

✅ Require at least email or phone  
✅ Validate email format  
✅ Keep job titles updated  
✅ Use consistent tag naming

## 🔮 Future Enhancements

**Coming Soon:**

- [ ] Bulk import from CSV
- [ ] Export to CSV
- [ ] Advanced filtering
- [ ] Duplicate detection
- [ ] Email integration
- [ ] Call logging integration
- [ ] Custom fields
- [ ] Contact merge
- [ ] Contact ownership transfer
- [ ] Activity reminders

---

**The contact management system is fully functional and production-ready!** 🎉
