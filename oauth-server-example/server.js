// OAuth Server Example for Figma Plugin
// This is a sample implementation demonstrating the OAuth flow
// You'll need to adapt this to your actual OAuth provider

require('dotenv').config();

const express = require('express')
const cors = require('cors')
const crypto = require('crypto')
const app = express();
const {OAuth2Client} = require('google-auth-library');
const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));

// OR if your JS is in a different folder
app.use('/oauth', express.static(path.join(__dirname, 'oauth')));

// OAuth Configuration from environment variables
const OAUTH_CONFIG = {
  clientId: process.env.OAUTH_CLIENT_ID,
  clientSecret: process.env.OAUTH_CLIENT_SECRET,
  redirectUri: process.env.OAUTH_REDIRECT_URI,
  scope: process.env.OAUTH_SCOPE,
  providerBaseUrl: process.env.OAUTH_PROVIDER_BASE_URL,
  tokenUrl: process.env.OAUTH_TOKEN_URL
};


// In-memory storage for demo purposes
// In production, use Redis or a database
const keyStore = new Map();
const codeVerifierStore = new Map();

// CORS configuration
app.use(cors({
  origin: ['https://www.figma.com', 'http://localhost:3000'],
  credentials: true
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Generate unique key pair
const generateKeyPair = () => {
  const readKey = crypto.randomBytes(32).toString('hex')
  const writeKey = crypto.randomBytes(32).toString('hex')
  return { readKey, writeKey }
}

// OAuth initialization page - serves the iframe content
app.get('/oauth/init', (req, res) => {
  const { codeChallenge, codeVerifier } = req.query
  codeVerifierStore.set('code_verifier', codeVerifier);
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>OAuth Authentication</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
        .container { max-width: 400px; margin: 0 auto; }
        button { background: #18a0fb; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 16px; }
        button:hover { background: #0d8ce8; }
        .status { margin: 20px 0; padding: 10px; border-radius: 4px; }
        .loading { background: #f0f0f0; color: #666; }
        .error { background: #ffebee; color: #c62828; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>🔐 OAuth Authentication</h2>
        <div id="status" class="status">
          <button onclick="startAuth()">Sign In with OAuth</button>
        </div>
      </div>

      <script>
        window.CODE_CHALLENGE = '${codeChallenge || ''}';
      </script>
      <script src="/oauth/client-auth.js"></script>

    </body>
    </html>
  `;
  
  res.send(html);
});

// Step 1: Generate authorization URL and key pair
app.post('/oauth/authorize', (req, res) => {
  try {
    const { readKey, writeKey } = generateKeyPair()
   
    // Store the key pair with expiration (5 minutes)
    keyStore.set(readKey, {
      writeKey,
      data: null,
      expires: Date.now() + 5 * 60 * 1000 // 5 minutes
    })
    
    // Build authorization URL for your OAuth provider
    const authParams = new URLSearchParams({
        response_type: 'code',
        client_id: OAUTH_CONFIG.clientId,
        redirect_uri: OAUTH_CONFIG.redirectUri,
        scope: OAUTH_CONFIG.scope,
        state: writeKey, // Pass writeKey as state for security
        code_challenge: req.body.codeChallenge || '',
        code_challenge_method: 'S256'
      })

    const authorizationUrl = `${OAUTH_CONFIG.providerBaseUrl}?${authParams}`

    res.json({
      readKey,
      writeKey,
      authorizationUrl,
      expires: Date.now() + 5 * 60 * 1000
    })
  } catch (error) {
    console.error('Error generating authorization:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Step 2: OAuth callback handler
app.get('/oauth/callback', async (req, res) => {
  try {
    const { code, state } = req.query
    const writeKey = state;

    if (!code || !writeKey) {
      return res.status(400).send('Missing authorization code or state')
    }
    //Exchange authorization code for access token
    const bodyParams =  new URLSearchParams({
        client_id: OAUTH_CONFIG.clientId,
        client_secret: OAUTH_CONFIG.clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: OAUTH_CONFIG.redirectUri,
        code_verifier: codeVerifierStore.get('code_verifier') || ''
      });

     const tokenResponse = await fetch(OAUTH_CONFIG.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: bodyParams
      });
      
    const tokens = await tokenResponse.json();

    if (!tokens.access_token) {
      throw new Error('Failed to get access token')
    }

    // Find and update the key pair
    let foundEntry = null
    for (const [readKey, entry] of keyStore.entries()) {
      if (entry.writeKey === writeKey) {
        foundEntry = { readKey, entry }
        break
      }
    }

    if (!foundEntry) {
      return res.status(400).send('Invalid write key')
    }

    // Store the tokens
    foundEntry.entry.data = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: tokens.expires_in ? Date.now() + (tokens.expires_in * 1000) : null,
      tokenType: tokens.token_type || 'Bearer'
    }

    // Success page
    res.send(`
      <html>
        <head>
          <title>Authentication Successful</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
            .success { color: green; font-size: 24px; margin-bottom: 20px; }
            .instruction { color: #666; font-size: 16px; }
          </style>
        </head>
        <body>
          <div class="success">✅ Authentication Successful!</div>
          <div class="instruction">
            You can now return to the Figma plugin.<br>
            This window can be closed.
          </div>
        </body>
      </html>
    `)
  } catch (error) {
    console.error('OAuth callback error:', error)
    res.status(500).send('Authentication failed')
  }
})

// Step 3: Polling endpoint for plugin
let pollCount = 0;
app.post('/oauth/poll', (req, res) => {
    pollCount++;
    console.log('poll count', pollCount);
  try {
    const { readKey } = req.body

    if (!readKey) {
      return res.status(400).json({ error: 'Missing read key' })
    }

    const entry = keyStore.get(readKey)
    
    if (!entry) {
      return res.status(404).json({ error: 'Key not found' })
    }

    if (Date.now() > entry.expires) {
      keyStore.delete(readKey)
      return res.status(410).json({ error: 'Key expired' })
    }

    if (!entry.data) {
      return res.status(202).json({ message: 'Pending authorization' })
    }

    // Return tokens and clean up
    const tokens = entry.data
    keyStore.delete(readKey)
    console.log('poll response - tokens', tokens);
    res.json({ tokens })
  } catch (error) {
    console.error('Polling error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Clean up expired keys every minute
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of keyStore.entries()) {
    if (now > entry.expires) {
      keyStore.delete(key)
    }
  }
}, 60000)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`OAuth server running on port ${PORT}`)
  console.log(`Health check: http://localhost:${PORT}/health`)
  console.log(`OAuth Configuration:`)
  console.log(`  - Client ID: ${OAUTH_CONFIG.clientId}`)
  console.log(`  - Redirect URI: ${OAUTH_CONFIG.redirectUri}`)
  console.log(`  - Scope: ${OAUTH_CONFIG.scope}`)
  console.log(`  - Provider: ${OAUTH_CONFIG.providerBaseUrl}`)
  console.log(`  - Token URL: ${OAUTH_CONFIG.tokenUrl}`)
})

module.exports = app 