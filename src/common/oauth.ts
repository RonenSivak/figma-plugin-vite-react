import CryptoJS from 'crypto-js';
// OAuth Configuration and Types
export interface OAuthConfig {
  clientId: string
  authServerUrl: string
  redirectUri: string
  scopes: string[]
  usesPKCE: boolean
}

export interface OAuthTokens {
  accessToken: string
  refreshToken?: string
  expiresAt?: number
  tokenType?: string
}

export interface PKCEPair {
  codeVerifier: string
  codeChallenge: string
}

export interface ReadWriteKeyPair {
  readKey: string
  writeKey: string
}

// PKCE Utility Functions

function generateCodeChallenge(verifier: string) {
    const hash = CryptoJS.SHA256(verifier);
    const base64 = CryptoJS.enc.Base64.stringify(hash);
    return base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }
function generateCodeVerifier() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let result = '';
    for (let i = 0; i < 128; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

export const generatePKCEPair = (): PKCEPair => {
  const codeVerifier = generateCodeVerifier()
  const codeChallenge = generateCodeChallenge(codeVerifier)
  return { codeVerifier, codeChallenge }
}

// OAuth URL Generation
export const buildAuthorizationUrl = (
  config: OAuthConfig,
  codeChallenge: string,
  state: string
): string => {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scopes.join(' '),
    state: state,
    ...(config.usesPKCE && {
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    }),
  })

  return `${config.authServerUrl}?${params.toString()}`
}

// Token validation
export const isTokenValid = (tokens: OAuthTokens): boolean => {
  if (!tokens.accessToken) return false
  if (!tokens.expiresAt) return true // Assume valid if no expiration
  return Date.now() < tokens.expiresAt
}