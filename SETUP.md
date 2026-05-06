# AutoLoop - Complete Instagram Business Suite Setup Guide

## Overview
This guide covers the complete setup of Instagram Graph API integration for AutoLoop, including all permissions, webhooks, and advanced features.

## Prerequisites
- Facebook Developer Account
- Instagram Business or Creator Account
- Business Facebook Page connected to Instagram
- Public website with privacy policy and terms of service

## Step 1: Facebook Developer App Setup

### 1.1 Create a Facebook App
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "My Apps" → "Create App"
3. Select "Business" app type
4. Fill in app name (e.g., "AutoLoop")
5. Complete the security check

### 1.2 Add Instagram Graph API Product
1. In App Dashboard, click "Add Product"
2. Find "Instagram Graph API" and click "Set Up"
3. Add "Messenger" product for messaging features

## Step 2: Required Permissions

### Basic Permissions (All Apps Need These)
| Permission | Purpose | Required For |
|------------|---------|--------------|
| `instagram_basic` | Read basic profile info | All features |
| `instagram_content_publish` | Publish posts | Content scheduling |
| `instagram_manage_insights` | Access analytics | Insights dashboard |
| `instagram_manage_comments` | Read/reply to comments | Comment automation |
| `pages_messaging` | Send/receive DMs | Messaging system |
| `business_management` | Access business accounts | Multi-account support |

### Advanced Permissions (Request After Basic App Review)
| Permission | Purpose | Use Case |
|------------|---------|----------|
| `instagram_shopping_tag_product` | Tag products in posts | E-commerce |
| `instagram_manage_messages` | Full message management | CRM integration |
| `pages_read_engagement` | Read page engagement | Analytics |
| `instagram_content_schedule` | Schedule future posts | Content calendar |

## Step 3: Webhook Configuration

### 3.1 Configure Webhooks in App Dashboard
1. Go to "Instagram Graph API" → "Webhooks"
2. Add webhook URL: `https://your-domain.com/api/webhook/instagram`
3. Verify token: Use your generated webhook token from AutoLoop settings

### 3.2 Subscribe to Webhook Events
Subscribe to these events in the dashboard:

#### Required Events
- `messages` - Receive incoming DMs
- `messaging_postbacks` - Button interactions
- `messaging_optins` - User opt-ins
- `feed` - Post comments and mentions
- `mentions` - Account mentions in comments
- `story_insights` - Story performance data

#### Optional Events
- `live_comments` - Live stream comments
- `shopping_product_taggings` - Product tag events

## Step 4: Instagram Account Setup

### 4.1 Convert to Business/Creator Account
1. Open Instagram app
2. Go to Settings → Account → Switch to Professional Account
3. Choose Business or Creator
4. Connect to Facebook Page

### 4.2 Enable API Access
1. In Instagram Settings → Security → Apps and Websites
2. Allow "Business Login for Instagram"
3. Enable "Instagram Graph API Access"

### 4.3 Required Settings
- Profile must be public
- Two-factor authentication enabled
- Valid email and phone number

## Step 5: App Review Process

### 5.1 Prepare for Review
Required documents:
- Privacy Policy URL (must be live)
- Terms of Service URL (must be live)
- App icon (1024x1024)
- Screenshots of main features
- Video screencast of user flow

### 5.2 Review Submission Steps
1. App Dashboard → "App Review" → "Permissions and Features"
2. Request each permission individually
3. Provide detailed use case descriptions
4. Record screencast showing user consent flow
5. Submit and wait for review (typically 5-7 business days)

### 5.3 Use Case Descriptions
**instagram_basic:**
"We use this permission to display the user's Instagram profile information within our dashboard, including profile picture, bio, follower count, and recent media for content management purposes."

**instagram_content_publish:**
"This permission allows users to schedule and publish content to their Instagram feed directly from our content calendar. Users can upload images, write captions, and set publication times."

**instagram_manage_insights:**
"We fetch engagement metrics (reach, impressions, profile views) to provide users with analytics dashboards showing their account performance over time."

**instagram_manage_comments:**
"This enables our automation feature where users can set up auto-replies to comments containing specific keywords, saving time on customer engagement."

**pages_messaging:**
"We use this to send and receive direct messages on behalf of users, enabling our unified inbox feature where they can manage all Instagram conversations."

## Step 6: Environment Variables

Create a `.dev.vars` file for local development or set these in Cloudflare:

```
# Meta API Configuration
META_APP_ID=your_app_id
META_APP_SECRET=your_app_secret
META_GRAPH_VERSION=v19.0

# Webhook Configuration
WEBHOOK_VERIFY_TOKEN=your_verify_token

# Database
DATABASE_URL=your_turso_database_url
DATABASE_AUTH_TOKEN=your_turso_auth_token

# NextAuth
AUTH_SECRET=your_auth_secret
AUTH_TRUST_HOST=true

# Optional: For advanced features
OPENAI_API_KEY=optional_for_ai_features
CLOUDFLARE_R2_BUCKET=optional_for_media_storage
CLOUDFLARE_R2_TOKEN=optional
```

## Step 7: Testing Before Review

### 7.1 Test Users Setup
1. App Dashboard → Roles → Test Users
2. Add Facebook test users
3. Connect Instagram Business accounts to test users
4. Use test access tokens for development

### 7.2 Testing Checklist
- [ ] OAuth flow works correctly
- [ ] User can connect Instagram account
- [ ] Webhook verification succeeds
- [ ] Can fetch user profile and media
- [ ] Can publish test posts
- [ ] Can send/receive test messages
- [ ] Comment automation triggers correctly
- [ ] Insights data displays accurately

## Step 8: Rate Limits & Best Practices

### 8.1 Instagram Graph API Limits
- **User-level**: 200 calls/hour per user
- **App-level**: Varies by use case
- **Business Use Case**: Higher limits for approved apps

### 8.2 Optimization Tips
1. Use field filtering to request only needed data
2. Implement caching for profile/media data
3. Batch requests when possible
4. Use webhooks instead of polling
5. Handle rate limit errors with exponential backoff

## Step 9: Advanced Features Setup

### 9.1 Instagram Messaging API (for DMs)
1. In Messenger product settings, enable Instagram messaging
2. Configure webhook for messaging events
3. Set up message templates for quick replies

### 9.2 Business Discovery
1. Ensure your app has Business Verification
2. Request `business_management` permission
3. Configure Business Manager account

### 9.3 Content Publishing
1. Test with sandbox mode first
2. Verify media container creation workflow
3. Ensure proper error handling for publishing failures

## Troubleshooting Common Issues

### "Permission Denied" Error
- Check if permission has been approved in App Review
- Verify token has the required scope
- Ensure user has granted permission during OAuth

### Webhook Not Receiving Events
- Verify webhook URL is publicly accessible
- Check webhook subscription status in dashboard
- Ensure HTTPS with valid SSL certificate
- Verify webhook verify token matches

### Rate Limit Errors
- Implement request queuing
- Add caching layer
- Use exponential backoff for retries
- Monitor rate limit headers

### Publishing Failures
- Check media meets Instagram requirements (aspect ratio, file size)
- Ensure caption doesn't violate community guidelines
- Verify account has posting permissions
- Check if account has been restricted

## Security Best Practices

1. **Never expose App Secret** in client-side code
2. **Use short-lived tokens** and refresh regularly
3. **Validate webhook signatures** to verify Meta origin
4. **Implement user consent flows** before API calls
5. **Store tokens encrypted** in database
6. **Log and monitor** all API usage

## Support & Resources

- [Instagram Graph API Documentation](https://developers.facebook.com/docs/instagram-api)
- [Messenger Platform Documentation](https://developers.facebook.com/docs/messenger-platform)
- [Facebook Developer Community](https://developers.facebook.com/community/)
- [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
- [Webhook Testing Tool](https://developers.facebook.com/tools/echo/)

## Next Steps After Setup

1. Connect your Instagram account in AutoLoop Settings
2. Create your first automation workflow
3. Test publishing content
4. Set up webhook event handling
5. Configure notification preferences
6. Invite team members (if applicable)
