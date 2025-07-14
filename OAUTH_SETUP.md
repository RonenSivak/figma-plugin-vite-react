# OAuth Setup Guide for Figma Plugin

This guide explains how to set up OAuth authentication for your Figma plugin following **Figma's official OAuth documentation**.

## 🔐 Overview

The OAuth implementation follows [Figma's official OAuth guidelines](https://www.figma.com/plugin-docs/oauth-with-plugins/) and includes:
- **Iframe redirection** to server-hosted OAuth page (Figma requirement)
- **Secure PKCE flow** with custom SHA-256 implementation
- **Read/write key pair system** for safe token exchange
- **Client storage** using `figma.clientStorage` for persistent authentication
- **Authentication state management** with real-time updates
- **Graceful error handling** and token expiration

## 📋 Prerequisites

1. **OAuth Provider Account**: Set up your app with your OAuth provider (Google, GitHub, Wix, etc.)
2. **HTTPS Server**: You need a publicly accessible HTTPS server
3. **Domain Registration**: Register your redirect URI with your OAuth provider

## 🚀 Setup Steps

### Step 1: Configure OAuth Provider

1. **Register your application** with your OAuth provider
2. **Set the redirect URI** to your server (e.g., `https://yourdomain.com/oauth/callback`)
3. **Note your Client ID and Client Secret**
4. **Enable PKCE** if supported by your provider

### Step 2: Deploy OAuth Server

We've provided a sample OAuth server in the `oauth-server-example/` directory:

```bash
cd oauth-server-example
npm install
```

**Note:** The server automatically uses environment variables for OAuth configuration. If no `.env` file is present, it will use the default Google OAuth configuration as fallback values.

Create a `.env` file with your OAuth provider details:

```env
# Server Configuration
PORT=3001

# OAuth Provider Configuration
OAUTH_CLIENT_ID=your-client-id
OAUTH_CLIENT_SECRET=your-client-secret

# OAuth Provider Endpoints
OAUTH_PROVIDER_BASE_URL=https://accounts.google.com/o/oauth2/v2/auth
OAUTH_TOKEN_URL=https://oauth2.googleapis.com/token
OAUTH_REDIRECT_URI=http://localhost:3001/oauth/callback
OAUTH_SCOPE=openid

# Example for Google OAuth:
# OAUTH_CLIENT_ID=xxx.apps.googleusercontent.com
# OAUTH_CLIENT_SECRET=xxx_7mmFYaGLLcYjZVYhDQ
# OAUTH_PROVIDER_BASE_URL=https://accounts.google.com/o/oauth2/v2/auth
# OAUTH_TOKEN_URL=https://oauth2.googleapis.com/token
# OAUTH_REDIRECT_URI=http://localhost:3001/oauth/callback
# OAUTH_SCOPE=openid

# Example for Wix OAuth:
# OAUTH_PROVIDER_BASE_URL=https://users.wix.com/v1/oauth/authorize
# OAUTH_TOKEN_URL=https://users.wix.com/v1/oauth/token
```

Start the server:

```bash
npm start
```

The server will display the OAuth configuration on startup, showing which environment variables are being used:

```
OAuth server running on port 3001
Health check: http://localhost:3001/health
OAuth Configuration:
  - Client ID: your-client-id
  - Redirect URI: http://localhost:3001/oauth/callback
  - Scope: openid
  - Provider: https://accounts.google.com/o/oauth2/v2/auth
  - Token URL: https://oauth2.googleapis.com/token
```

### Step 3: Configure Plugin Environment

Create a `.env` file in your plugin root:

```env
REACT_APP_OAUTH_CLIENT_ID=your-client-id
REACT_APP_OAUTH_SERVER_URL=http://localhost:3001
REACT_APP_OAUTH_AUTH_URL=https://your-oauth-provider.com/oauth/authorize
REACT_APP_OAUTH_REDIRECT_URI=http://localhost:3001/oauth/callback
```

### Step 4: Build and Test

```bash
npm run build
```

Import the plugin in Figma and test the OAuth flow.

## 🔄 OAuth Flow Architecture (Following Figma's Documentation)

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Figma Plugin  │    │   Your Server   │    │ OAuth Provider  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │ 1. Redirect iframe    │                       │
         │──────────────────────▶│                       │
         │   to /oauth/init      │                       │
         │                       │                       │
         │ 2. Serve OAuth page   │                       │
         │◀──────────────────────│                       │
         │                       │                       │
         │ 3. User clicks auth   │                       │
         │──────────────────────▶│                       │
         │                       │                       │
         │ 4. Generate keys      │                       │
         │◀──────────────────────│                       │
         │                       │                       │
         │ 5. Open auth popup    │                       │
         │──────────────────────▶│                       │
         │                       │                       │
         │                       │ 6. User authorizes    │
         │                       │◀──────────────────────│
         │                       │                       │
         │                       │ 7. Callback with code │
         │                       │◀──────────────────────│
         │                       │                       │
         │                       │ 8. Exchange for token │
         │                       │──────────────────────▶│
         │                       │                       │
         │ 9. Poll for token     │                       │
         │──────────────────────▶│                       │
         │                       │                       │
         │ 10. Return token      │                       │
         │◀──────────────────────│                       │
         │                       │                       │
         │ 11. postMessage       │                       │
         │    to plugin          │                       │
         │                       │                       │
```

## 🔧 Key Implementation Details

### **Iframe Redirection (Figma Requirement)**
Following [Figma's official documentation](https://www.figma.com/plugin-docs/oauth-with-plugins/), the plugin must:

1. **Redirect iframe** to your server (`/oauth/init`)
2. **Non-null origin** enables secure identity checking
3. **Server-hosted OAuth page** handles the authentication flow
4. **postMessage communication** back to plugin

### **Why Direct Fetch Doesn't Work**
- OAuth providers block direct requests due to CORS
- Figma's sandbox environment has limited API access
- `crypto.subtle` is not available in Figma environment

### **Custom SHA-256 Implementation**
Since `crypto.subtle` is not available in Figma:
- Pure JavaScript SHA-256 implementation
- Used for PKCE code challenge generation
- No external dependencies required

## 🔒 Security Features

### PKCE (Proof Key for Code Exchange)
- Generates a code verifier and challenge using custom SHA-256
- Prevents authorization code interception attacks
- Required for secure OAuth in Figma environment

### Read/Write Key Pair
- Unique keys for each OAuth flow
- Read key for polling, write key for storing results
- Prevents cross-request contamination

### Token Storage
- Uses `figma.clientStorage` for secure local storage
- Scoped to plugin and user
- Automatic cleanup on expiration

### Origin Validation
- Validates message origins (`https://www.figma.com`)
- Prevents unauthorized access
- Secure postMessage communication

## 📚 Common OAuth Providers

### Wix OAuth
```env
OAUTH_PROVIDER_URL=https://users.wix.com/v1/oauth/authorize
OAUTH_PROVIDER_TOKEN_URL=https://users.wix.com/v1/oauth/token
```

### Google OAuth
```env
OAUTH_PROVIDER_URL=https://accounts.google.com/o/oauth2/v2/auth
OAUTH_PROVIDER_TOKEN_URL=https://oauth2.googleapis.com/token
```

### GitHub OAuth
```env
OAUTH_PROVIDER_URL=https://github.com/login/oauth/authorize
OAUTH_PROVIDER_TOKEN_URL=https://github.com/login/oauth/access_token
```

## 🛠️ Troubleshooting

### **Common Issues:**

1. **CORS Error**: 
   - Ensure server CORS settings include `https://www.figma.com`
   - Check OAuth provider allows your redirect URI

2. **Popup Blocked**: 
   - User needs to allow popups in browser
   - Test in both Figma desktop app and web

3. **Token Not Persisting**: 
   - Verify `figma.clientStorage` usage
   - Check token expiration handling

4. **SHA-256 Errors**: 
   - Pure JavaScript implementation works in Figma
   - No need for crypto.subtle API

### **Debug Mode:**
Enable console logging in both plugin and server to trace the OAuth flow.

## 🚀 Production Deployment

### **1. Deploy Server**
- Deploy to Heroku, Railway, or preferred platform
- Update environment variables with production values
- Ensure HTTPS is enabled

### **2. Update Plugin Configuration**
```env
REACT_APP_OAUTH_SERVER_URL=https://your-production-server.com
REACT_APP_OAUTH_REDIRECT_URI=https://your-production-server.com/oauth/callback
```

### **3. Update OAuth Provider Settings**
- Update redirect URI to production URL
- Update allowed origins in OAuth provider settings

This implementation provides a secure, production-ready OAuth flow that follows Figma's official guidelines and works in both desktop and browser environments. 