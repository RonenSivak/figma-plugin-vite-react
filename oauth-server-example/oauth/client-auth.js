// OAuth Client-side Authentication Script
// This script handles the OAuth flow within the iframe

const OAUTH_SERVER_URL = window.location.origin;
let readKey = null;
let pollInterval = null;

async function startAuth() {
  try {
    document.getElementById('status').innerHTML = '<div class="loading">Initializing authentication...</div>';
    
    // Step 1: Get read/write key pair from server
    const response = await fetch(OAUTH_SERVER_URL + '/oauth/authorize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codeChallenge: window.CODE_CHALLENGE })
    });
    
    if (!response.ok) {
      throw new Error('Failed to initialize OAuth flow');
    }
    
    const data = await response.json();
    readKey = data.readKey;
    
    // Step 2: Open OAuth window
    window.open(data.authorizationUrl, '_blank', 'width=500,height=600');
    
    
    // Step 3: Start polling for results
    startPolling();
    
  } catch (error) {
    console.error('OAuth flow error:', error);
    document.getElementById('status').innerHTML = 
      '<div class="error">Error: ' + error.message + '</div><button onclick="startAuth()">Try Again</button>';
  }
}

function startPolling() {
  document.getElementById('status').innerHTML = '<div class="loading">Waiting for authentication...</div>';
  
  pollInterval = setInterval(async () => {
    try {
      const response = await fetch(OAUTH_SERVER_URL + '/oauth/poll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ readKey })
      });
      
      if (response.status === 200) {
        const data = await response.json();
        clearInterval(pollInterval);
        
        // Send tokens to plugin
        parent.postMessage({
          pluginMessage: {
            type: 'oauth-success',
            tokens: data.tokens
          }
        }, '*');
        
        document.getElementById('status').innerHTML = 
          '<div style="background: #e8f5e8; color: #2e7d32; padding: 10px; border-radius: 4px;">✅ Authentication successful!</div>';
        
      } else if (response.status === 202) {
        // Still waiting for user to authorize
        console.log('Waiting for user authorization...');
      } else if (response.status === 410) {
        clearInterval(pollInterval);
        throw new Error('Authentication expired. Please try again.');
      } else {
        // Other error
        const errorData = await response.json();
        throw new Error(errorData.error || 'Authentication failed');
      }
      
    } catch (error) {
      console.error('Polling error:', error);
      clearInterval(pollInterval);
      
      // Send error to plugin
      parent.postMessage({
        pluginMessage: {
          type: 'oauth-error',
          error: error.message
        }
      }, '*');
      
      document.getElementById('status').innerHTML = 
        '<div class="error">Error: ' + error.message + '</div><button onclick="startAuth()">Try Again</button>';
    }
  }, 2500); // Poll every 2.5 seconds
}

// Handle cancellation
function cancelAuth() {
  if (pollInterval) {
    clearInterval(pollInterval);
  }
  
  parent.postMessage({
    pluginMessage: {
      type: 'oauth-error',
      error: 'Authentication cancelled'
    }
  }, '*');
}

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  if (pollInterval) {
    clearInterval(pollInterval);
  }
});