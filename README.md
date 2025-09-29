# SharePoint URL Builder for Teams Channels

[![Version](https://img.shields.io/badge/version-1.3.0-blue.svg)](https://github.com/rameshsubramania/teams-sharepoint-url-builder)
[![Teams](https://img.shields.io/badge/Microsoft%20Teams-Compatible-purple.svg)](https://docs.microsoft.com/en-us/microsoftteams/platform/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

> A Microsoft Teams tab application that generates correct SharePoint document library URLs for both standard and private channels, integrated with AI-powered chat assistance for enhanced document management.

## 🚀 Features

### Core Functionality
- **🔗 Automatic SharePoint URL Generation**: Constructs proper SharePoint URLs based on Teams context
- **🤖 AI Agent Integration**: Creates channel-specific AI chatbots for document assistance
- **🔒 Channel Type Support**: Handles both standard and private Teams channels
- **💬 Interactive Chat Interface**: Real-time AI-powered document management assistance
- **🔄 Persistent Context**: Maintains chat history and context per Teams channel

### Technical Features
- **⚡ Teams SDK Integration**: Built with Microsoft Teams JavaScript SDK v2.0.0
- **🌐 Azure Backend**: Powered by Azure Logic Apps for scalable processing
- **📱 Responsive Design**: Modern, Teams-compatible user interface
- **🛡️ Error Handling**: Comprehensive error handling with retry mechanisms
- **🔍 Debug Support**: Built-in debugging and status monitoring

## 📋 Prerequisites

- Microsoft Teams environment
- SharePoint Online access
- Azure subscription (for backend services)
- Teams app development permissions

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Teams Client  │────│  SharePoint URL  │────│  Azure Logic    │
│                 │    │     Builder      │    │     Apps        │
│  - Teams SDK    │    │                  │    │                 │
│  - Context API  │    │  - URL Generator │    │  - Bot Manager  │
│  - Chat UI      │    │  - AI Interface  │    │  - Status API   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🔧 Installation

### 1. Deploy to Teams

1. **Download the app package**:
   ```bash
   git clone https://github.com/rameshsubramania/teams-sharepoint-url-builder.git
   cd teams-sharepoint-url-builder
   ```

2. **Create Teams app package**:
   - Zip the contents of the `manifest` folder
   - Ensure `manifest.json`, `color.png`, and `outline.png` are included

3. **Upload to Teams**:
   - Go to Teams Admin Center
   - Navigate to Teams apps > Manage apps
   - Upload the zip file
   - Approve the app for your organization

### 2. Add to Teams Channel

1. Open the desired Teams channel
2. Click the "+" tab button
3. Search for "SharePoint URL Builder"
4. Click "Add" and configure the tab

## 🎯 Usage

### Initial Setup

1. **App Initialization**:
   - The app automatically detects your Teams context
   - Extracts team, channel, and SharePoint site information
   - Generates appropriate SharePoint URLs

2. **URL Generation Logic**:
   - **Standard Channels**: `{teamSiteUrl}/Shared%20Documents/{channelName}`
   - **Private Channels**: `{teamSiteUrl}/Shared%20Documents`

### Creating an AI Agent

1. **Agent Configuration**:
   ```
   Agent Name: [Enter descriptive name]
   AI Model: [Select from GPT-4, GPT-3.5 Turbo]
   ```

2. **Creation Process**:
   - Click "Create My Agent"
   - Wait for Azure backend processing
   - Agent becomes available for chat

### Chat Interaction

1. **Contextual Assistance**:
   - AI agent has access to SharePoint URL context
   - Provides document management guidance
   - Maintains conversation history per channel

2. **Available Commands**:
   - Document search and navigation
   - SharePoint URL generation
   - File organization assistance

## 🔧 Configuration

### Teams Manifest

```json
{
  "manifestVersion": "1.16",
  "version": "1.3.0",
  "id": "E5565093-0FD5-4347-84F8-6DB5C24FCFA8",
  "packageName": "com.axleinfo.sharepoint.urlbuilder",
  "name": {
    "short": "SharePoint URL Builder",
    "full": "SharePoint URL Builder for Teams Channels"
  }
}
```

### Required Permissions

- `Sites.ReadWrite.All` (Application)
- `Team.ReadBasic.All` (Application)
- `User.Read` (Delegated)

### Valid Domains

- `rameshsubramania.github.io`
- `*.sharepoint.com`
- `*.login.microsoftonline.com`
- `*.apps.powerapps.com`
- `*.powerplatform.com`

## 🛠️ Development

### Project Structure

```
teams-sharepoint-url-builder/
├── docs/
│   ├── index.html          # Main application interface
│   ├── config.html         # Teams tab configuration
│   └── app.js             # Core application logic
├── manifest/
│   ├── manifest.json      # Teams app manifest
│   ├── color.png         # App icon (color)
│   └── outline.png       # App icon (outline)
└── README.md             # This file
```

### Key Components

#### 1. URL Builder Logic
```javascript
// SharePoint URL generation
if (channelType === 'Private') {
  sharepointUrlBuild = `${context.sharePointSite.teamSiteUrl}/Shared%20Documents`;
} else {
  const encodedChannelName = encodeURIComponent(channelName);
  sharepointUrlBuild = `${context.sharePointSite.teamSiteUrl}/Shared%20Documents/${encodedChannelName}`;
}
```

#### 2. Teams Context Integration
```javascript
// Initialize Teams SDK and get context
microsoftTeams.app.initialize().then(() => {
  return microsoftTeams.app.getContext();
}).then(context => {
  // Process team, channel, and SharePoint information
});
```

#### 3. AI Agent Management
```javascript
// Check if agent exists for current channel
const response = await fetch(LOGIC_APP_ENDPOINT, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    botName: agentName,
    url: sharepointUrlBuild,
    cname: channelName,
    cid: channelId
  })
});
```

### Local Development

1. **Setup**:
   ```bash
   # Serve files locally
   python -m http.server 8000
   # or
   npx serve .
   ```

2. **Testing**:
   - Use Teams Developer Portal
   - Test in Teams web client
   - Validate SharePoint URL generation

## 🔍 Troubleshooting

### Common Issues

1. **SharePoint URL Not Generated**:
   - Verify Teams context is properly loaded
   - Check SharePoint site permissions
   - Ensure channel has associated SharePoint site

2. **AI Agent Creation Fails**:
   - Check Azure Logic Apps connectivity
   - Verify API endpoints are accessible
   - Review debug panel for error details

3. **Teams Integration Issues**:
   - Confirm app is properly installed
   - Check manifest configuration
   - Verify required permissions are granted

### Debug Information

The app includes a built-in debug panel that shows:
- Teams context information
- SharePoint URL generation status
- API call results
- Error messages and stack traces

## 📚 API Reference

### Azure Logic Apps Endpoints

#### Bot Existence Check
```http
POST /workflows/.../triggers/manual/paths/invoke
Content-Type: application/json

{
  "botName": "string",
  "botModel": "string",
  "url": "string",
  "cname": "string",
  "cid": "string",
  "timestamp": "string"
}
```

#### Agent Creation
```http
POST /workflows/.../triggers/manual/paths/invoke
Content-Type: application/json

{
  "agentName": "string",
  "model": "string",
  "url": "string",
  "channelName": "string",
  "channelId": "string"
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏢 About Axle Info

Developed by [Axle Info](https://axleinfo.com) - Empowering organizations with innovative technology solutions.

- **Website**: [https://axleinfo.com](https://axleinfo.com)
- **Privacy Policy**: [https://axleinfo.com/privacy](https://axleinfo.com/privacy)
- **Terms of Use**: [https://axleinfo.com/terms](https://axleinfo.com/terms)

## 📞 Support

For support and questions:
- Create an issue in this repository
- Contact Axle Info support team
- Review the troubleshooting section above

---

**Version**: 1.3.0  
**Last Updated**: January 2025  
**Teams SDK**: v2.0.0  
**Compatibility**: Microsoft Teams, SharePoint Online