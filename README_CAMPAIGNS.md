# Email Campaigns System

## Overview

Snap My Date now includes a powerful email campaign system for admin users to send bulk marketing emails to users based on subscription tiers. The system uses **Resend** for reliable email delivery.

## Features

- ✉️ **Bulk Email Composer**: Rich email composer with subject, body, and optional call-to-action button
- 🎯 **Audience Targeting**: Filter recipients by subscription plan (Free Trial, Monthly, Yearly, Lifetime)
- 📊 **Campaign History**: Track all sent campaigns with delivery stats
- ⚡ **Batch Processing**: Automatically handles rate limiting with 100-email batches
- 🎨 **Branded Templates**: Uses existing Snap My Date email template with logo
- 👤 **Personalization**: Supports `{{greeting}}` placeholder for "Hi [FirstName]" or "Hello"

## Admin Access

Navigate to **Admin Dashboard** → **Email Campaigns** or visit:

```
http://localhost:3000/admin/campaigns
```

## How to Use

### 1. Create a Campaign

1. Click **✉️ New Campaign** button
2. Fill in campaign details:
   - **Subject**: Email subject line
   - **Email Body**: HTML-supported body text
     - Use `{{greeting}}` for personalized greetings
   - **Button Text** (optional): CTA button text
   - **Button URL** (optional): CTA button link
   - **Audience**: Select one or more subscription tiers

### 2. Send Campaign

- Click **🚀 Send Campaign**
- The system will:
  - Query matching users from database
  - Send emails in batches of 100
  - Track success/failure stats
  - Update campaign status in real-time

### 3. Monitor Results

- View campaign history below the composer
- Each campaign shows:
  - Subject line
  - Creator
  - Status badge (SENT, SENDING, FAILED)
  - Recipient count
  - Sent count (green)
  - Failed count (red)
  - Timestamp

## Technical Details

### Database

**Table**: `email_campaigns`

- Stores campaign metadata, audience filters, and delivery stats
- Migration: `prisma/manual_sql/create_email_campaigns.sql`

**Columns**:

- `subject`, `body_html`, `from_email`
- `audience_filter` (JSONB): targeting criteria
- `recipient_count`, `sent_count`, `failed_count`
- `status`: draft, queued, sending, sent, failed, cancelled
- `created_by_user_id`, `sent_at`, `created_at`, `updated_at`

### API Endpoints

**POST `/api/admin/campaigns/send`**

- Creates and sends a campaign
- Requires admin authentication
- Returns delivery stats

**GET `/api/admin/campaigns`**

- Lists campaign history
- Supports filtering by status
- Pagination with limit/offset

### Resend Integration

**Library**: `/src/lib/resend.ts`

- `sendBulkEmail()`: Sends to multiple recipients with batching
- `sendTestEmail()`: Verifies Resend configuration
- Respects rate limits (100 emails per batch)
- Includes personalization and template wrapping

### Environment Variables

```env
RESEND_API_KEY=re_xxxxx               # Required
SES_FROM_EMAIL_NO_REPLY=no-reply@...  # Default sender
DATABASE_URL=postgresql://...          # Required
```

## Examples

### Example 1: Welcome Email to Free Users

**Subject**: Welcome to Snap My Date!

**Body**:

```
{{greeting}},

Thank you for joining Snap My Date! 🎉

We're excited to help you capture and organize all your important dates. As a free user, you have 3 scans to get started.

Ready to unlock unlimited scans? Upgrade to our premium plan today!
```

**Button**: Upgrade Now → `https://envitefy.com/subscription`

**Audience**: ☑️ Free Trial

---

### Example 2: Feature Announcement to Paid Users

**Subject**: New Feature: Shared Events! 🔗

**Body**:

```
{{greeting}},

Exciting news! You can now share events with friends and family.

Just open any event and click "Share" to invite others. They'll see the event in their calendar automatically.

Try it out today!
```

**Button**: Learn More → `https://envitefy.com/about`

**Audience**: ☑️ Monthly Plan, ☑️ Yearly Plan

---

## Troubleshooting

### Emails not sending?

1. Verify `RESEND_API_KEY` is set correctly
2. Check Resend dashboard for delivery status
3. Review campaign errors in the history view

### Recipients not matching?

- Ensure users have the selected subscription plans
- Check that email addresses are valid in the database
- Verify audience filter is correctly configured

### Rate limiting errors?

- Default batch size is 100 emails
- System automatically adds delays between batches
- Resend free tier: 3,000 emails/month, 100 emails/day

## Future Enhancements

- 📅 Schedule campaigns for future delivery
- 📈 Open/click tracking analytics
- 🔄 Recurring campaigns (weekly newsletters)
- 📧 Email template library
- 🎯 Advanced segmentation (last active date, scan count)
- ✉️ A/B testing

---

## Support

For issues or questions about the campaign system, contact the development team or review the implementation in:

- `/src/app/admin/campaigns/page.tsx` (UI)
- `/src/app/api/admin/campaigns/` (API)
- `/src/lib/resend.ts` (Email sending)

