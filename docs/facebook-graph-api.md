# Facebook Graph API Implementation Guide

## 1. OAuth Flow (Authorization Code)

To get a long-lived token for automation, we need to go through the OAuth flow.

### Step A: Generate Authorization URL

We redirect the user to:
```
https://www.facebook.com/v19.0/dialog/oauth?
  client_id={app-id}
  &redirect_uri={redirect-uri}
  &state={state-param}
  &scope=pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish
```

**Scopes Needed:**
- `pages_show_list`: To list the user's pages.
- `pages_read_engagement`: To read comments/messages.
- `pages_manage_posts`: To publish posts.
- `instagram_basic`: To read IG profile info.
- `instagram_content_publish`: To publish to IG.

### Step B: Exchange Code for Access Token (Server-Side)

When the user returns to `/api/social/callback/facebook?code={...}`, we exchange the code:

GET `https://graph.facebook.com/v19.0/oauth/access_token`
Params:
- `client_id`
- `redirect_uri`
- `client_secret`
- `code`

**Response:** `{ "access_token": "SHORT_LIVED_TOKEN", ... }`

### Step C: Exchange for Long-Lived Token

The short-lived token expires in 1-2 hours. We need to exchange it for a long-lived one (60 days).

GET `https://graph.facebook.com/v19.0/oauth/access_token`
Params:
- `grant_type=fb_exchange_token`
- `client_id`
- `client_secret`
- `fb_exchange_token={SHORT_LIVED_TOKEN}`

**Response:** `{ "access_token": "LONG_LIVED_TOKEN", "expires_in": 5184000 }`

## 2. Fetching Connected Components

Once we have the user's Long-Lived Token, we fetch their Pages and Instagram Business Accounts.

GET `https://graph.facebook.com/v19.0/me/accounts?access_token={LONG_LIVED_TOKEN}`

**Response:**
```json
{
  "data": [
    {
      "access_token": "PAGE_ACCESS_TOKEN", // Important! Use this for page actions
      "category": "Software",
      "name": "AutoLoop App",
      "id": "123456789"
    }
  ]
}
```

**Note:** The token we get in Step C is a **User Token**. The token in Step 2 response is a **Page Token**.
- **User Token**: Good for listing pages.
- **Page Token**: Good for publishing *as* that page. Does not expire (usually) or has very long life.

For this implementation, we will store the **User Token** in `connected_accounts` initially, but fetching and storing specific **Page Tokens** might be better for granular control in the future. For now, storing the User Token allows us to dynamicially fetch pages. 

Actually, for stability, we should iterate through the pages and store a `connected_account` entry for EACH page the user wants to connect? 
**Simpler Approach for V1**: Store the User Long-Lived Token. When the user wants to Post, we fetch the pages list live (or cache it) and use the page tokens from that response.

## 3. Instagram Connection

To find the Instagram account linked to a Page:

GET `https://graph.facebook.com/v19.0/{page-id}?fields=instagram_business_account&access_token={PAGE_TOKEN}`

**Response:**
```json
{
  "instagram_business_account": {
    "id": "17841..."
  },
  "id": "PAGE_ID"
}
```

We can then use `instagram_business_account.id` to publish to IG.
