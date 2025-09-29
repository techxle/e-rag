// Declare globals at the very top of the script so they exist everywhere
let sharepointUrlBuild = '';
let channelName = '';
let channelId = '';
let currentBotName = '';
let currentBotModel = '';

// Chat context variables
let currentAgentName = '';
let currentModel = '';
let currentSharepointUrl = '';
let currentChannelName = '';
let currentChannelId = '';

// Function to check bot existence and route accordingly
async function checkBotExistence() {
  try {
    // Prepare the request body with all required parameters
    const requestBody = {
      botName: currentAgentName,
      botModel: currentModel,
      url: sharepointUrlBuild,
      cname: channelName,
      cid: channelId,
      timestamp: new Date().toISOString()
    };

    console.log('Sending bot existence check with:', requestBody);
    
    // Make API call to check if bot exists for this channel
    const response = await fetch('https://prod-143.westus.logic.azure.com:443/workflows/c10edf5d105a4506b13cd787bb50b1b4/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=s4eBbE9niGQBJq_QK_rmyk-ASgEE3Q-8RF3fVUtXfnk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    if (!response.ok) {
      throw new Error(`API call failed with status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Bot existence check response:', data);
    showDebugMessage(`Power Automate response: ${JSON.stringify(data)}`);
    
    if (data.bot === 'Exist') {
      showDebugMessage('Bot exists, preparing to show chat screen with:', false);
      
      // Hide loading screen and show chat
      document.getElementById('loadingScreen').style.display = 'none';
      
      // Extract bot info from response
      const botName = data.botName || currentAgentName;
      const botModel = data.botModel || currentModel;
      
      // Show chat screen with SharePoint URL
      await showChatScreen(
        botName,
        botModel,
        sharepointUrlBuild,
        channelName,
        channelId
      );
      
      return true;
      
    } else if (data.bot === 'Not Exist') {
      showDebugMessage('Bot does not exist, showing creation screen');
      return false;
      
    } else {
      throw new Error(`Unexpected bot status: ${data.bot}`);
    }
    
  } catch (error) {
    let errorMessage = error.message;
    
    if (error.name === 'AbortError') {
      errorMessage = 'Bot existence check timed out after 30 seconds';
    } else if (!navigator.onLine) {
      errorMessage = 'No internet connection available';
    }
    
    showDebugMessage(`Error checking bot existence: ${errorMessage}`, true);
    showNotification('Error checking bot status. Please check debug panel for details.', true);
    
    // If there's an error, show creation screen as a fallback
    return false;
  }
}

// Function to show the chat screen
function showChatScreen(botName, botModel, sharepointUrl, channelName, channelId) {
  const effectiveSharePointUrl = sharepointUrl || sharepointUrlBuild;
  console.log('showChatScreen called with:', { botName, botModel, sharepointUrl: effectiveSharePointUrl, channelName, channelId });
  showDebugMessage(`Using SharePoint URL: ${effectiveSharePointUrl}`);

  try {
    // Update global context
    currentAgentName = botName;
    currentModel = botModel;
    currentSharepointUrl = effectiveSharePointUrl;
    currentChannelName = channelName || '';
    currentChannelId = channelId || '';

    // Hide all other screens
    const screens = ['loadingScreen', 'firstScreen', 'secondScreen', 'thirdScreen', 'fourthScreen'];
    screens.forEach(screenId => {
      const screen = document.getElementById(screenId);
      if (screen) screen.style.display = 'none';
    });
    const containers = document.querySelectorAll('.container');
    containers.forEach(container => container.style.display = 'none');

    // Show chat screen
    const chatScreen = document.getElementById('chatScreen');
    if (!chatScreen) throw new Error('Chat screen element not found');
    chatScreen.style.display = 'flex';

    // Clear any previous chat messages
    const chatMessages = document.getElementById('chatMessages');
    if(chatMessages) chatMessages.innerHTML = '';

    // Set up the initial greeting message
    const initialGreeting = document.getElementById('initialGreeting');
    const greetingAgentName = document.getElementById('greetingAgentName');
    if (initialGreeting && greetingAgentName) {
      greetingAgentName.textContent = botName || 'your AI Assistant';
      initialGreeting.style.display = 'flex';
    }

    // Initialize chat functionality
    initializeChatFunctionality(botName, botModel, effectiveSharePointUrl, channelName, channelId);

    // Add event listeners for new header buttons
    const savedPromptsBtn = document.getElementById('savedPromptsBtn');
    if (savedPromptsBtn) {
      savedPromptsBtn.addEventListener('click', () => {
        showNotification('"Saved Prompts" functionality is not yet implemented.');
      });
    }

    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        showNotification('"Settings" functionality is not yet implemented.');
      });
    }

    console.log('Chat screen should now be visible');
  } catch (error) {
    console.error('Error in showChatScreen:', error);
    showNotification('Error initializing chat. Please refresh the page.', true);
    showCreationScreen();
  }
}

// Function to initialize chat functionality
function initializeChatFunctionality(agentName, model, sharepointUrl, channelName, channelId) {
  const userInput = document.getElementById('userMessageInput');
  const sendButton = document.getElementById('sendMessageBtn');
  
  if (userInput && sendButton) {
    // Remove existing event listeners
    sendButton.replaceWith(sendButton.cloneNode(true));
    const newSendButton = document.getElementById('sendMessageBtn');
    
    // Add click event listener
    newSendButton.addEventListener('click', () => {
      sendChatMessage(agentName, model, sharepointUrl, channelName, channelId);
    });
    
    // Add enter key event listener
    userInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendChatMessage(agentName, model, sharepointUrl, channelName, channelId);
      }
    });
  }
}

// Function to send chat message
function sendChatMessage(agentName, model, sharepointUrl, channelName, channelId) {
  const userInput = document.getElementById('userMessageInput');
  const message = userInput.value.trim();

  if (message === '') return;

  // Hide initial greeting on first message
  const initialGreeting = document.getElementById('initialGreeting');
  if (initialGreeting && initialGreeting.style.display !== 'none') {
    initialGreeting.style.display = 'none';
  }

  // Add user message to chat
  addChatMessage(message, 'user');

  // Clear input
  userInput.value = '';

  // Show typing indicator
  addTypingIndicator();

  // Send message to bot using the enhanced chat functionality
  handleBotResponse(message);
}

// Enhanced bot response handling
async function handleBotResponse(message) {
  async function tryRequest(attempt = 1, maxAttempts = 5) {
    const url = "https://prod-72.westus.logic.azure.com:443/workflows/726b9d82ac464db1b723c2be1bed19f9/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=OYyyRREMa-xCZa0Dut4kRZNoYPZglb1rNXSUx-yMH_U";
    
    try {
      const requestBody = {
        botName: currentAgentName,
        botModel: currentModel,
        url: currentSharepointUrl,
        cname: currentChannelName,
        cid: currentChannelId,
        userMessage: message,
        timestamp: new Date().toISOString(),
      };

      showDebugMessage(`Attempt ${attempt}/${maxAttempts}: Connecting to RAG agent...`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        if (response.status === 502) {
          throw new Error(`Server temporarily unavailable (502). The RAG agent may be processing or restarting.`);
        } else if (response.status === 504) {
          throw new Error(`Request timeout (504). The RAG agent is taking too long to respond.`);
        } else if (response.status >= 500) {
          throw new Error(`Server error (${response.status}). The RAG agent service is experiencing issues.`);
        } else {
          throw new Error(`API request failed with status ${response.status}: ${errorText}`);
        }
      }

      const data = await response.json();
      showDebugMessage(`✅ RAG agent responded successfully on attempt ${attempt}`);
      return data.botresponse || "I'm sorry, I couldn't process your request at the moment.";
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out after 30 seconds. The RAG agent may be overloaded.');
      }
      
      if (attempt < maxAttempts) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000); // Exponential backoff, max 10s
        showDebugMessage(`❌ Attempt ${attempt} failed: ${error.message}. Retrying in ${delay/1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return tryRequest(attempt + 1, maxAttempts);
      }
      throw error;
    }
  }

  try {
    const botResponse = await tryRequest();
    
    // Remove typing indicator
    removeTypingIndicator();
    
    // Add bot response
    addChatMessage(botResponse, 'bot');
    
  } catch (error) {
    console.error('Error getting bot response:', error);
    showDebugMessage(`❌ RAG agent failed: ${error.message}`, true);
    
    // Remove typing indicator
    removeTypingIndicator();
    
    // Show user-friendly error message based on error type
    let userMessage = "I'm having trouble connecting to the RAG agent. ";
    if (error.message.includes('502')) {
      userMessage += "The service appears to be temporarily unavailable. Please try again in a few minutes.";
    } else if (error.message.includes('504') || error.message.includes('timeout')) {
      userMessage += "The request is taking too long. The agent may be processing large documents. Please try a simpler question or wait a moment.";
    } else if (error.message.includes('500')) {
      userMessage += "There's a server issue. Please contact your administrator if this persists.";
    } else {
      userMessage += "Please check your connection and try again.";
    }
    
    addChatMessage(userMessage, 'bot');
    
    // Show notification for critical errors
    if (error.message.includes('502') || error.message.includes('500')) {
      showNotification('RAG Agent service unavailable. Please try again later.', true);
    }
  }
}

// Function to add message to chat
function addChatMessage(message, sender) {
  const chatMessages = document.getElementById('chatMessages');
  if (!chatMessages) return;
  
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${sender}-message`;
  messageDiv.textContent = message;
  
  chatMessages.appendChild(messageDiv);
  
  // Scroll to bottom
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Function to add typing indicator
function addTypingIndicator() {
  const chatMessages = document.getElementById('chatMessages');
  if (!chatMessages) return;
  
  const typingDiv = document.createElement('div');
  typingDiv.className = 'message bot-message typing-indicator';
  typingDiv.id = 'typingIndicator';
  typingDiv.textContent = 'AI is typing...';
  
  chatMessages.appendChild(typingDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Function to remove typing indicator
function removeTypingIndicator() {
  const typingIndicator = document.getElementById('typingIndicator');
  if (typingIndicator) {
    typingIndicator.remove();
  }
}

// Function to show the creation screen (first screen)
function showCreationScreen() {
  document.getElementById('loadingScreen').style.display = 'none';
  const container = document.querySelector('.container');
  if (container) {
    container.style.display = 'flex';
    // Hide all other screens
    hideAllScreens();
    // Show first screen (container is the first screen)
    container.style.display = 'flex';
  }
  const chatScreen = document.getElementById('chatScreen');
  if (chatScreen) chatScreen.style.display = 'none';
}

// Helper function to hide all screens
function hideAllScreens() {
  const screens = ['secondScreen', 'thirdScreen', 'fourthScreen', 'chatScreen'];
  screens.forEach(screenId => {
    const screen = document.getElementById(screenId);
    if (screen) {
      screen.style.display = 'none';
      screen.classList.remove('active');
    }
  });
}

// Initialize the application
async function initializeApp() {
  try {
    console.log('🚀 Starting Teams app initialization...');
    showDebugMessage('🚀 Starting Teams app initialization...');
    
    // Check if Teams SDK is available
    if (typeof microsoftTeams === 'undefined') {
      throw new Error('Microsoft Teams SDK is not available. This app must run within Microsoft Teams.');
    }
    
    console.log('📱 Microsoft Teams SDK available, initializing...');
    showDebugMessage('📱 Microsoft Teams SDK available, initializing...');
    
    // Initialize Microsoft Teams SDK
    await microsoftTeams.app.initialize();
    console.log('✅ Teams SDK initialized successfully');
    showDebugMessage('✅ Teams SDK initialized successfully');
    
    // Show loading screen
    document.getElementById('loadingScreen').style.display = 'flex';
    document.querySelector('.container').style.display = 'none';
    
    console.log('🔍 Getting Teams context...');
    showDebugMessage('🔍 Getting Teams context...');
    
    // Get Teams context
    const context = await microsoftTeams.app.getContext();
    console.log('📋 Teams context received:', context);
    showDebugMessage(`📋 Teams context received: ${JSON.stringify(context, null, 2)}`);
    
    // Store channel info from Teams context
    channelName = context.channel?.displayName || '';
    channelId = context.channel?.id || '';
    sharepointUrlBuild = context.sharePointSite?.teamSiteUrl || '';
    
    // Validate required Teams context
    if (!channelName || !channelId) {
      throw new Error('Unable to get Teams channel information. Please ensure the app is running in a Teams channel.');
    }
    
    // Set default agent info for bot existence check
    currentAgentName = 'Chat Assistant'; // Default name
    currentModel = 'gpt-4'; // Default model
    
    console.log('🔍 Checking if bot exists for this channel...');
    console.log('📊 Bot check parameters:', { currentAgentName, currentModel, sharepointUrlBuild, channelName, channelId });
    showDebugMessage('🔍 Checking bot existence via Power Automate workflow...');
    showDebugMessage(`📊 Bot check parameters: ${JSON.stringify({ currentAgentName, currentModel, sharepointUrlBuild, channelName, channelId })}`);
    
    // Check if bot exists for this channel using Power Automate workflow
    const botExists = await checkBotExistence();
    
    console.log('🎯 Bot existence check result:', botExists);
    showDebugMessage(`🎯 Bot existence check result: ${botExists}`);
    
    // If bot doesn't exist, we'll show the creation screen
    if (!botExists) {
      console.log('🆕 No bot found, initializing bot creation flow...');
      showDebugMessage('🆕 No bot found, initializing bot creation flow...');
      // Initialize the rest of the app for bot creation
      initializeBotCreation(context);
    }
  } catch (error) {
    console.error('❌ Error initializing app:', error);
    showDebugMessage(`❌ Error initializing app: ${error.message}`, true);
    
    // Show error message to user
    showNotification(`App initialization failed: ${error.message}`, true);
    
    // Hide loading screen and show error state
    document.getElementById('loadingScreen').style.display = 'none';
    showCreationScreen();
  }
}

// Function to initialize bot creation flow
function initializeBotCreation(context) {
  try {
    // Show the initial screen for bot creation
    showCreationScreen();
    
    // Initialize SharePoint URL builder if needed
    if (context) {
      console.log('Teams Context:', JSON.stringify(context, null, 2));

      const teamName = context.team?.displayName || 'Not available';
      channelId = context.channel?.id || 'Not available';
      channelName = context.channel?.displayName || 'Not available';
      const channelType = context.channel?.membershipType || 'Unknown';

      // Build SharePoint URL
      if (
        teamName !== 'Not available' &&
        channelName !== 'Not available' &&
        context.sharePointSite?.teamSiteUrl
      ) {
        if (channelType === 'Private') {
          sharepointUrlBuild = `${context.sharePointSite.teamSiteUrl}/Shared%20Documents`;
        } else {
          const encodedChannelName = encodeURIComponent(channelName);
          sharepointUrlBuild = `${context.sharePointSite.teamSiteUrl}/Shared%20Documents/${encodedChannelName}`;
        }
      } else {
        sharepointUrlBuild = '';
        console.warn('Cannot generate URL - missing team or channel name.');
      }

      console.log('Initialized SharePoint URL:', sharepointUrlBuild);
      showNotification('✅ App initialized successfully!');
    }
  } catch (error) {
    console.error('Error initializing bot creation:', error);
    showNotification('Error initializing application. Please refresh and try again.', true);
  }
}

// Function to show the "waiting" screen - Updated for new UI
function showWaitingScreen(agentName, model) {
  // Hide all other screens
  hideAllScreens();
  const container = document.querySelector('.container');
  if (container) container.style.display = 'none';
  
  // Show fourth screen (processing screen)
  const fourthScreen = document.getElementById('fourthScreen');
  if (fourthScreen) {
    fourthScreen.style.display = 'flex';
    fourthScreen.classList.add('active');
    
    // Start the processing animation
    setTimeout(() => {
      if (typeof animateProcessingSteps === 'function') {
        animateProcessingSteps();
      }
    }, 500);
  }
}

// Function to show the final success message - now directly shows chat screen
function showSuccessScreen(agentName, model, sharepointUrl, channelName, channelId) {
  console.log('Agent creation completed, showing chat screen');
  
  // Directly show chat screen instead of success screen
  showChatScreen(agentName, model, sharepointUrl, channelName, channelId);
}

// Function to create agent
async function createAgent() {
  const agentName = document.getElementById('agentName').value.trim();
  const model = document.getElementById('modelSelect').value;

  if (!agentName) {
    showNotification('Please enter a name for your agent', true);
    return;
  }

  if (!sharepointUrlBuild) {
    showNotification('Cannot create agent: SharePoint URL is not available', true);
    return;
  }

  try {
    // Show waiting screen immediately
    showWaitingScreen(agentName, model);

    // First API call to create the agent
    const createUrl = 'https://prod-59.westus.logic.azure.com:443/workflows/09613ec521cb4a438cb7e7df3a1fb99b/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=phnNABFUUeaM5S1hEjhPyMcJaRGR5H8EHPbB11DP_P0';
    
    const requestBody = {
      botName: agentName,
      botModel: model,
      url: sharepointUrlBuild,
      cname: channelName,
      cid: channelId,
      timestamp: new Date().toISOString(),
    };

    console.log('Sending create agent request:', requestBody);
    
    const response = await fetch(createUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Failed to create agent: ${response.status} ${response.statusText}`);
    }

    const responseData = await response.json();
    console.log('Agent creation response:', responseData);
    
    // Start polling for status after successful creation
    pollStatusUntilSuccess(agentName, model, sharepointUrlBuild, channelName, channelId);
    
  } catch (error) {
    console.error('Error in createAgent:', error);
    showNotification(`❌ Error: ${error.message}`, true);
    // Show the form again on error
    showCreationScreen();
  }
}

// Function to poll until success - Updated for new UI
async function pollStatusUntilSuccess(agentName, model, sharepointUrl, channelName, channelId) {
  const url = "https://prod-59.westus.logic.azure.com:443/workflows/09613ec521cb4a438cb7e7df3a1fb99b/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=phnNABFUUeaM5S1hEjhPyMcJaRGR5H8EHPbB11DP_P0";
  const maxAttempts = 2000;
  let attempt = 1;
  let isSuccess = false;

  const requestBody = {
    botName: agentName,
    botModel: model,
    url: sharepointUrl,
    cname: channelName,
    cid: channelId,
    timestamp: new Date().toISOString(),
  };

  const statusElement = document.getElementById('fourthScreen')?.querySelector('.progress-steps');
  
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  while (attempt <= maxAttempts && !isSuccess) {
    try {
      console.log(`⏳ Attempt ${attempt}/${maxAttempts}: Checking agent status...`);
      if (statusElement) {
        statusElement.textContent = `Checking agent status (${attempt}/${maxAttempts})...`;
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ Attempt ${attempt}:`, data);

      if (data.Status === "Success" || data.status === "Success") {
        console.log("🎉 Agent is ready!");
        if (statusElement) statusElement.textContent = 'Agent is ready to use!';
        
        // Wait a moment to show completion, then show chat screen
        setTimeout(() => {
          showSuccessScreen(agentName, model, sharepointUrl, channelName, channelId);
        }, 2000);
        
        isSuccess = true;
        return;
      } else {
        console.log(`Attempt ${attempt}: Agent not ready yet`);
        if (statusElement) {
          statusElement.textContent = `Agent is being set up... (${attempt}/${maxAttempts} attempts)`;
        }
      }
    } catch (error) {
      console.error(`❌ Attempt ${attempt} failed:`, error.message);
      if (statusElement) {
        statusElement.textContent = `Connection issue, retrying... (${attempt}/${maxAttempts} attempts)`;
      }
    }

    if (attempt < maxAttempts) {
      await delay(15000);
    }
    attempt++;
  }

  if (!isSuccess) {
    console.error("❌ Max attempts reached without success");
    if (statusElement) {
      statusElement.textContent = 'Agent setup is taking longer than expected. Please check back later.';
    }
  }
}

// Function to show notifications with improved visibility
function showNotification(message, isError = false) {
  console.log(`Showing notification: ${message} (isError: ${isError})`);
  
  let notification = document.getElementById('notification');
  if (!notification) {
    notification = document.createElement('div');
    notification.id = 'notification';
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.padding = '15px 20px';
    notification.style.borderRadius = '4px';
    notification.style.color = 'white';
    notification.style.zIndex = '10000';
    notification.style.maxWidth = '80%';
    notification.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
    document.body.appendChild(notification);
  }

  notification.textContent = message;
  notification.style.backgroundColor = isError ? '#f44336' : '#4CAF50';
  notification.style.display = 'block';
  notification.style.transform = 'translateX(0)';

  setTimeout(() => {
    notification.style.transform = 'translateX(120%)';
  }, 5000);
}

// Function to show debug messages in console and UI if debug panel exists
function showDebugMessage(message, error = false) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    
    // Always log to console
    if (error) {
        console.error(logMessage);
    } else {
        console.log(logMessage);
    }

    // Always show critical errors in notification
    if (error) {
        showNotification(`Error: ${message}`, true);
    }

    // Create or get status element for visible logging
    let statusLog = document.getElementById('statusLog');
    if (!statusLog) {
        statusLog = document.createElement('div');
        statusLog.id = 'statusLog';
        statusLog.style.position = 'fixed';
        statusLog.style.left = '10px';
        statusLog.style.top = '10px';
        statusLog.style.padding = '8px';
        statusLog.style.background = 'rgba(0,0,0,0.85)';
        statusLog.style.color = 'white';
        statusLog.style.fontFamily = 'monospace';
        statusLog.style.fontSize = '10px';
        statusLog.style.maxHeight = '120px';
        statusLog.style.overflowY = 'auto';
        statusLog.style.maxWidth = '300px';
        statusLog.style.minWidth = '250px';
        statusLog.style.zIndex = '10000';
        statusLog.style.borderRadius = '4px';
        statusLog.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
        document.body.appendChild(statusLog);
    }

    const logEntry = document.createElement('div');
    logEntry.style.borderBottom = '1px solid rgba(255,255,255,0.1)';
    logEntry.style.padding = '4px 0';
    if (error) {
        logEntry.style.color = '#ff4444';
    }
    logEntry.textContent = logMessage;
    statusLog.appendChild(logEntry);
    statusLog.scrollTop = statusLog.scrollHeight;
}

// Initialize the app when DOM is ready
function init() {
    showDebugMessage('Starting application initialization...');
    
    const requiredElements = ['loadingScreen'];
    const missingElements = requiredElements.filter(id => !document.getElementById(id));
    
    if (missingElements.length > 0) {
        const error = `Missing required elements: ${missingElements.join(', ')}`;
        showDebugMessage(error, true);
        return;
    }
    
    document.getElementById('loadingScreen').style.display = 'flex';
    
    // Initialize sliders
    initializeSliders();
    
    initializeApp().catch(error => {
        showDebugMessage(`Application initialization failed: ${error.message}`, true);
        showNotification('Failed to initialize application. Please refresh and try again.', true);
        showCreationScreen();
    });
}

// Check if the DOM is already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  // DOM is already loaded, run immediately
  setTimeout(init, 0);
}
async function saveSettings() {
  try {
      // Show loading state
      const saveButton = document.querySelector('.settings-button.primary');
      const originalButtonText = saveButton.textContent;
      saveButton.disabled = true;
      saveButton.innerHTML = '<div class="loading-spinner" style="width: 16px; height: 16px; border-width: 2px; margin: 0 auto;"></div>';

      // Get all settings values
      const settings = {
          AgentName: currentBotName || '',
          ModelName: document.getElementById('agentModel').value,
          QueryType: document.querySelector('input[name="searchType"]:checked').value,
          InScope: document.getElementById('connectedDataOnly').checked,
          strictness: document.getElementById('strictness').value,
          top_n_documents: document.getElementById('documents').value,
          max_tokens: document.getElementById('maxTokens').value,
          SystemPrompt: document.getElementById('systemPrompt').value,
          Timestamp: new Date().toISOString(),
          ChannelId: currentChannelId || '',
          ChannelName: currentChannelName || ''
      };

      console.log('Current channel values:', { currentChannelId, currentChannelName });
      console.log('Saving settings:', settings);
      
      // Log the final URL to see what's being sent
      const queryParams = new URLSearchParams();
      Object.entries(settings).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
              queryParams.append(key, value.toString());
          }
      });
      const finalUrl = `https://98eeb9e84846efe1a8f46d098c0db3.0e.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/74bc89ba300742f38f1792c3f5b33719/triggers/manual/paths/invoke?${queryParams.toString()}&api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=y3a9KvtSH_NR5TEqMKPBoQOowmbWCe1PFV6h1D0x6iA`;
      console.log('Final API URL:', finalUrl);
      
      // Convert settings object to URL-encoded query parameters
      const queryParams2 = new URLSearchParams();
      Object.entries(settings).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
              queryParams2.append(key, value);
          }
      });
      
      // Call the Logic App with POST method and request body
      const baseUrl = 'https://98eeb9e84846efe1a8f46d098c0db3.0e.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/74bc89ba300742f38f1792c3f5b33719/triggers/manual/paths/invoke';
      const url = `${baseUrl}?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=y3a9KvtSH_NR5TEqMKPBoQOowmbWCe1PFV6h1D0x6iA`;
      
      const response = await fetch(url, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify(settings)
      });
      
      if (!response.ok) {
          // Try to get the error details from the response
          let errorDetails = response.statusText;
          try {
              const errorResponse = await response.text();
              console.error('Error response:', errorResponse);
              // Try to parse as JSON if possible
              try {
                  const jsonError = JSON.parse(errorResponse);
                  errorDetails = JSON.stringify(jsonError, null, 2);
              } catch (e) {
                  errorDetails = errorResponse || response.statusText;
              }
          } catch (e) {
              console.error('Error reading error response:', e);
          }
          throw new Error(`Failed to save settings (Status: ${response.status}): ${errorDetails}`);
      }
      
      let result;
      try {
          const responseText = await response.text();
          console.log('Raw response:', responseText);
          result = responseText ? JSON.parse(responseText) : {};
          console.log('Settings saved successfully:', result);
      } catch (e) {
          console.error('Error parsing response:', e);
          throw new Error('Failed to parse server response');
      }
      
      // Show success message
      if (typeof showNotification === 'function') {
          showNotification('Settings saved successfully!');
      } else {
          alert('Settings saved successfully!');
      }
      
      // Close the modal
      closeSettings();
      
  } catch (error) {
      console.error('Error saving settings 1:', error);
      
      // Show error message
      if (typeof showNotification === 'function') {
          showNotification(`Error saving settings3: ${error.message}`, true);
      } else {
          alert(`Error saving settings2: ${error.message}`);
      }
      
  } finally {
      // Reset button state
      const saveButton = document.querySelector('.settings-button.primary');
      if (saveButton) {
          saveButton.disabled = false;
          saveButton.textContent = 'Save';
      }
  }
}

// Function to initialize sliders
function initializeSliders() {
  const strictnessSlider = document.getElementById('strictness');
  const strictnessValue = document.getElementById('strictnessValue');
  const documentsSlider = document.getElementById('documents');
  const documentsValue = document.getElementById('documentsValue');
  const maxTokensSlider = document.getElementById('maxTokens');
  const maxTokensValue = document.getElementById('maxTokensValue');

  if (strictnessSlider && strictnessValue) {
    // Set initial value
    strictnessValue.textContent = strictnessSlider.value;
    
    // Update value while sliding
    strictnessSlider.addEventListener('input', function() {
      strictnessValue.textContent = this.value;
    });

    // Also update on change
    strictnessSlider.addEventListener('change', function() {
      strictnessValue.textContent = this.value;
    });
  }

  if (documentsSlider && documentsValue) {
    documentsValue.textContent = documentsSlider.value;
    documentsSlider.addEventListener('input', function() {
      documentsValue.textContent = this.value;
    });
  }

  if (maxTokensSlider && maxTokensValue) {
    maxTokensValue.textContent = maxTokensSlider.value;
    maxTokensSlider.addEventListener('input', function() {
      maxTokensValue.textContent = this.value;
    });
  }
}

// Save prompt button click handler
document.getElementById('savePrompt').addEventListener('click', function() {
  const promptText = document.getElementById('systemPrompt').value.trim();
  if (promptText) {
      const savedPrompts = document.getElementById('savedPromptsList');
      const newPrompt = document.createElement('div');
      newPrompt.className = 'saved-prompt';
      newPrompt.textContent = promptText.substring(0, 30) + (promptText.length > 30 ? '...' : '');
      savedPrompts.prepend(newPrompt);
      
      // Here you would typically save this to your backend
      console.log('Prompt saved:', promptText);
  }
});

// Click handler for saved prompts
document.getElementById('savedPromptsList').addEventListener('click', function(e) {
  if (e.target.classList.contains('saved-prompt')) {
      // Here you would load the full prompt text
      // For now, we'll just log it
      console.log('Loading prompt:', e.target.textContent);
  }
});