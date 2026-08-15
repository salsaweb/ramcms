# Janzu Portal - Project Structure

> Updated to match the current repository layout. The previous `PROJECT_STRUCTURE.md` content was stale and described a different app structure.

## 📌 Overview

This repository is a Next.js app using the App Router, TypeScript, Tailwind CSS, and a modular feature-oriented component layout.

## 📂 Key folders

- `app/` - Next.js App Router pages, layouts, providers, styles, and route groups.
- `components/` - Reusable UI and feature components organized by domain.
- `lib/` - Shared helpers, API utilities, authentication utilities, RBAC logic, validations, and service clients.
- `database/` - SQL migrations and seed data.
- `scripts/` - Utility scripts for migrations and API key generation.
- `i18n/` - Internationalization request utilities and locale messages.
- `hooks/` - Custom React hooks.
- `docs/` - Project documentation files.

## 📊 Project statistics (excluding `.git`, `node_modules`, and `.next`)

- Directories: 116
- Files: 259

## 📁 Root files

- `.env.example` - Environment variable template.
- `.gitignore`
- `README.md`
- `next.config.js`
- `tailwind.config.js`
- `postcss.config.js`
- `tsconfig.json`
- `package.json`
- `package-lock.json`
- `components.json`
- `proxy.ts`
- `setup.sh`
- `next-env.d.ts`

## app/

- `[locale]/layout.tsx` - Localized root layout.
- `[locale]/globals.css` - Global CSS and Tailwind setup.
- `[locale]/auth/` - Authentication routes:
  - `error`
  - `login`
  - `register`
- `[locale]/(dashboard)/layout.tsx` - Dashboard layout wrapper.
- `[locale]/(dashboard)/dashboard/` - Dashboard entry route.
- `[locale]/feedback/` - Feedback route.
- `[locale]/feedback/[sessionId]/` - Dynamic feedback session page.

### app actions

- `app/actions/auth.ts`
- `app/actions/certifications.ts`
- `app/actions/clients.ts`
- `app/actions/feedback.ts`
- `app/actions/locations.ts`
- `app/actions/posts.ts`
- `app/actions/practitioners.ts`
- `app/actions/profile.ts`
- `app/actions/settings.ts`
- `app/actions/user-management.ts`
- `app/actions/users.ts`
- `app/actions/sessions.ts`
- `app/actions/crm/`
  - `companies.ts`
  - `contact-advanced.ts`
  - `contacts.ts`
  - `deals.ts`
  - `tasks.ts`
- `app/actions/media/`
  - `artists.ts`
  - `playlists.ts`
  - `tracks.ts`
- `app/actions/rbac/`
  - `custom-roles.ts`

### app API routes

- `app/api/auth/[...nextauth]/route.ts`
- `app/api/crm/contacts/route.ts`
- `app/api/crm/custom-fields/route.ts`
- `app/api/crm/merge-rules/route.ts`
- `app/api/practitioners/route.ts`

### app providers

- `app/providers/session-provider.tsx`

### top-level app files

- `app/layout.tsx`

## components/

### auth

- `components/auth/janzu-quote.tsx`
- `components/auth/sign-out-button.tsx`

### certifications

- `components/certifications/admin-view.tsx`
- `components/certifications/practitioner-view.tsx`

### clients

- `components/clients/client-form.tsx`

### crm

- `components/crm/advanced-contact-filters.tsx`
- `components/crm/call-analytics-charts.tsx`
- `components/crm/call-log-form.tsx`
- `components/crm/company-form.tsx`
- `components/crm/contact-activity-form.tsx`
- `components/crm/contact-form.tsx`
- `components/crm/custom-field-builder.tsx`
- `components/crm/custom-field-input.tsx`
- `components/crm/custom-fields-list.tsx`
- `components/crm/deal-form.tsx`
- `components/crm/deal-stage-updater.tsx`
- `components/crm/delete-company-button.tsx`
- `components/crm/delete-contact-button.tsx`
- `components/crm/delete-deal-button.tsx`
- `components/crm/delete-task-button.tsx`
- `components/crm/duplicate-merge-actions.tsx`
- `components/crm/merge-rule-builder.tsx`
- `components/crm/merge-rules-list.tsx`
- `components/crm/ownership-transfer-form.tsx`
- `components/crm/reminder-form.tsx`
- `components/crm/task-form.tsx`
- `components/crm/task-status-toggle.tsx`

### dashboard

- `components/dashboard/dashboard-error.tsx`
- `components/dashboard/language-switcher.tsx`

### feedback

- `components/feedback/feedback-form.tsx`
- `components/feedback/feedback-link.tsx`

### layout

- `components/layout/app-sidebar.tsx`
- `components/layout/dashboard-layout.tsx`

### locations

- `components/locations/location-form.tsx`

### media

- `components/media/add-relation-dialog.tsx`
- `components/media/add-tracks-dialog.tsx`
- `components/media/artist-card.tsx`
- `components/media/create-playlist-dialog.tsx`
- `components/media/import-track-dialog.tsx`
- `components/media/playlist-card.tsx`
- `components/media/playlist-editor.tsx`
- `components/media/sortable-track-item.tsx`
- `components/media/track-card.tsx`

### practitioners

- `components/practitioners/practitioner-form.tsx`
- `components/practitioners/resend-invite-button.tsx`

### providers

- `components/providers/theme-provider.tsx`

### rbac

- `components/rbac/create-role-dialog.tsx`
- `components/rbac/permission-manager.tsx`
- `components/rbac/role-actions.tsx`
- `components/rbac/role-card.tsx`

### sessions

- `components/sessions/session-form.tsx`

### settings

- `components/settings/profile-form.tsx`
- `components/settings/system-settings-form.tsx`

### ui

- `components/ui/alert.tsx`
- `components/ui/avatar.tsx`
- `components/ui/badge.tsx`
- `components/ui/breadcrumb.tsx`
- `components/ui/button.tsx`
- `components/ui/card.tsx`
- `components/ui/chart.tsx`
- `components/ui/checkbox.tsx`
- `components/ui/collapsible.tsx`
- `components/ui/command.tsx`
- `components/ui/dialog.tsx`
- `components/ui/dropdown-menu.tsx`
- `components/ui/input-group.tsx`
- `components/ui/input.tsx`
- `components/ui/label.tsx`
- `components/ui/progress.tsx`
- `components/ui/scroll-area.tsx`
- `components/ui/separator.tsx`
- `components/ui/sheet.tsx`
- `components/ui/sidebar.tsx`
- `components/ui/skeleton.tsx`
- `components/ui/sonner.tsx`
- `components/ui/table.tsx`
- `components/ui/tabs.tsx`
- `components/ui/textarea.tsx`
- `components/ui/theme-toggle.tsx`
- `components/ui/tooltip.tsx`

### users

- `components/users/assign-role-form.tsx`
- `components/users/remove-role-button.tsx`
- `components/users/role-permissions-editor.tsx`
- `components/users/user-status-toggle.tsx`

## lib/

### auth

- `lib/auth/password.ts`
- `lib/auth/session.ts`

### api

- `lib/api/auth.ts`
- `lib/api/rate-limit.ts`
- `lib/api/response.ts`

### rbac

- `lib/rbac/guards.ts`
- `lib/rbac/permissions.ts`

### spotify

- `lib/spotify/client.ts`

### supabase

- `lib/supabase/admin.ts`

### utils

- `lib/utils.ts`
- `lib/utils/jsonb.ts`

### validations

- `lib/validations/schemas.ts`

### misc

- `lib/janzuQuotes.ts`

## database/

### migrations

- `001_initial_schema.sql`
- `002_crm_schema.sql`
- `003_contact_enhancements.sql`
- `004_advanced_features.sql`
- `005_add_settings_permission.sql`
- `006_custom_rbac.sql`
- `007_grant_admin_rbac_permissions.sql`
- `008_fix_role_name_constraint.sql`
- `009_api_authentication.sql`
- `010_media_management.sql`
- `011_practitioners_schema.sql`
- `013_system_settings.sql`
- `014_client_user_link.sql`
- `015_practitioner_phone.sql`
- `016_sessions.sql`
- `017_seed_session_permissions.sql`
- `018_session_feedback.sql`
- `019_seed_feedback_permissions.sql`
- `020_certifications.sql`
- `021_locations.sql`

### seeds

- `001_initial_data.sql`
- `002_crm_data.sql`
- `003_add_manage_roles_permission.sql`
- `006_custom_rbac_permissions.sql`
- `007_practitioner_permissions.sql`

## scripts/

- `scripts/generate-api-key.sql`
- `scripts/generate-api-key.ts`
- `scripts/run-migrations.js`

## i18n/

- `i18n/request.ts`
- `i18n/messages/en.json`
- `i18n/messages/es.json`

## hooks/

- `hooks/use-mobile.ts`
- `hooks/use-toast.ts`

## docs/

- `docs/PROJECT_STRUCTURE.md`
- plus other documentation files in the repo.

## Notes

- There is no top-level `actions/`, `api/`, or `providers/` folder outside of `app/` in the current workspace: these are nested under `app/`.
- `components/` is organized by feature area, not by page route.
- `app/[locale]` is the active route grouping system for locale-aware pages.
- `lib/` contains both application utilities and service clients used by app actions and API routes.
