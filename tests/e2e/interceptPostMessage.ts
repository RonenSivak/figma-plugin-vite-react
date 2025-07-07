export interface MockResponseConfig {
  [eventName: string]: (payload: unknown[]) => string | null
}

export interface InterceptPostMessageOptions {
  mockResponses: MockResponseConfig
  delay?: number
  enableLogging?: boolean
}

/**
 * Creates a postMessage interceptor script that can be injected into the page
 * to mock Figma plugin communication with configurable responses
 */
export const createPostMessageInterceptor = (options: InterceptPostMessageOptions): string => {
  const { mockResponses, delay = 100, enableLogging = true } = options
  
  // Convert function definitions to strings that can be injected
  const mockResponseFunctions = Object.entries(mockResponses)
    .map(([eventName, func]) => `'${eventName}': ${func.toString()}`)
    .join(',\n    ')
  
  return `
    // Store original console.log for debugging
    const originalLog = console.log;
    
    // Mock parent.postMessage to intercept UI -> Plugin messages
    window.parent.postMessage = (message) => {
      if (${enableLogging}) {
        originalLog('Intercepted postMessage:', message);
      }
      
      // Check if this is a plugin message
      if (message?.pluginMessage) {
        const pluginMessage = message.pluginMessage;
        if (${enableLogging}) {
          originalLog('Plugin message:', pluginMessage);
        }
        
        // Simulate plugin response after a delay
        setTimeout(() => {
          const mockResponse = generateMockResponse(pluginMessage);
          if (mockResponse) {
            if (${enableLogging}) {
              originalLog('Sending mock response:', mockResponse);
            }
            
            // Simulate plugin response by dispatching MessageEvent
            window.dispatchEvent(new MessageEvent('message', {
              data: {
                pluginId: 'mock-plugin',
                pluginMessage: mockResponse
              }
            }));
          }
        }, ${delay});
      }
      
      // Don't call original postMessage to avoid errors
    };
    
    // Function to generate mock responses based on the configuration
    function generateMockResponse(pluginMessage) {
      const { eventName, payload, messageId } = pluginMessage;
      
      if (${enableLogging}) {
        originalLog(\`Generating mock response for eventName: \${eventName}, payload:\`, payload);
      }
      
      // Define mock response functions
      const mockResponses = {
        ${mockResponseFunctions}
      };
      
      // Check if we have a mock response for this event
      if (mockResponses[eventName]) {
        try {
          // Call the mock response function with the payload
          const responseText = mockResponses[eventName](payload || []);
          
          if (responseText) {
            if (${enableLogging}) {
              originalLog(\`Generated \${eventName} response: \${responseText}\`);
            }
            
            return {
              messageId,
              fromSide: 'Plugin-side',
              eventName: '__INTERNAL_SUCCESS_RESPONSE_EVENT',
              payload: [responseText]
            };
          }
        } catch (error) {
          if (${enableLogging}) {
            originalLog(\`Error generating mock response for \${eventName}:\`, error);
          }
        }
      }
      
      if (${enableLogging}) {
        originalLog(\`No mock response configured for eventName: \${eventName}\`);
      }
      return null;
    }
    
    if (${enableLogging}) {
      originalLog('postMessage interceptor installed with mock response handlers for:', Object.keys({${mockResponseFunctions}}));
    }
  `;
}

// Default mock responses for common plugin operations
export const defaultMockResponses: MockResponseConfig = {
  ping: (payload) => {
    const count = payload[0] || 1
    return `Pong received! Count: ${count}`
  },
  
  message: (payload) => {
    const message = payload[0] || ''
    return `Message received: "${message}"`
  },
  
  createText: (payload) => {
    const text = payload[0] || ''
    return `Text node created: "${text}"`
  }
} 