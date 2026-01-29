// Database Indexes for Performance Optimization
// Add these to your schema for better query performance

// index helper omitted; this file is documentation-only

/*
Recommended indexes to add to your schema:

1. Businesses table:
   - index('businesses_user_idx').on(businesses.userId)
   - index('businesses_email_idx').on(businesses.email)
   - index('businesses_email_status_idx').on(businesses.emailStatus)
   - index('businesses_created_at_idx').on(businesses.createdAt)

2. Email Logs table:
   - index('email_logs_business_idx').on(emailLogs.businessId)
   - index('email_logs_status_idx').on(emailLogs.status)
   - index('email_logs_sent_at_idx').on(emailLogs.sentAt)

3. Email Templates table:
   - index('email_templates_user_idx').on(emailTemplates.userId)
   - index('email_templates_default_idx').on(emailTemplates.isDefault)

4. Workflows table:
   - index('workflows_user_idx').on(workflows.userId)
   - index('workflows_active_idx').on(workflows.isActive)

5. Campaigns table (if created):
   - index('campaigns_user_idx').on(campaigns.userId)
   - index('campaigns_status_idx').on(campaigns.status)
   - index('campaigns_created_at_idx').on(campaigns.createdAt)

6. Composite indexes for common queries:
   - index('businesses_user_status_idx').on(businesses.userId, businesses.emailStatus)
   - index('email_logs_business_status_idx').on(emailLogs.businessId, emailLogs.status)

Apply these indexes by adding them to your schema definitions.
*/

export const performanceIndexes = {
  businesses: [
    'CREATE INDEX IF NOT EXISTS businesses_user_idx ON businesses(user_id);',
    'CREATE INDEX IF NOT EXISTS businesses_email_idx ON businesses(email);',
    'CREATE INDEX IF NOT EXISTS businesses_email_status_idx ON businesses(email_status);',
    'CREATE INDEX IF NOT EXISTS businesses_created_at_idx ON businesses(created_at);',
    'CREATE INDEX IF NOT EXISTS businesses_user_status_idx ON businesses(user_id, email_status);',
  ],
  emailLogs: [
    'CREATE INDEX IF NOT EXISTS email_logs_business_idx ON email_logs(business_id);',
    'CREATE INDEX IF NOT EXISTS email_logs_status_idx ON email_logs(status);',
    'CREATE INDEX IF NOT EXISTS email_logs_sent_at_idx ON email_logs(sent_at);',
    'CREATE INDEX IF NOT EXISTS email_logs_business_status_idx ON email_logs(business_id, status);',
  ],
  emailTemplates: [
    'CREATE INDEX IF NOT EXISTS email_templates_user_idx ON email_templates(user_id);',
    'CREATE INDEX IF NOT EXISTS email_templates_default_idx ON email_templates(is_default);',
  ],
  workflows: [
    'CREATE INDEX IF NOT EXISTS workflows_user_idx ON workflows(user_id);',
    'CREATE INDEX IF NOT EXISTS workflows_active_idx ON workflows(is_active);',
  ],
};

// Script to apply all indexes
export function generateIndexSQL(): string[] {
  return Object.values(performanceIndexes).flat();
}
