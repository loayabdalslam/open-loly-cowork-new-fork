<p align="center">
  <h1 align="center">Open Loly Cowork 🍭</h1>
</p>

<p align="center">
  <img src="renderer/assets/loly_icon.png" width="120" alt="Loly Logo">
</p>

<p align="center">
  <b>A premium, sweetness-infused desktop AI agent interface.</b>
  <br>
  <i>This repository is a newer, enhanced version of <a href="https://github.com/ComposioHQ/open-claude-cowork">ComposioHQ/open-claude-cowork</a>.</i>
</p>

---

## 🌟 Overview

**Open Loly Cowork** is an advanced desktop chat application designed for seamless interaction with AI agents. Built on top of the Claude Agent SDK and integrated with Composio's Tool Router, it allows you to automate complex workflows across 100+ tools directly from a beautiful, responsive interface.

This fork ("Loly Version") introduces significant UI/UX improvements, multi-provider support, and a more robust desktop integration inspired by modern, premium design aesthetics.

## ✨ Key Features

### 🍭 Premium UI/UX
- **Loly Aesthetics**: High-contrast, vibrant themes including the signature "Cream Coral" look.
- **Glassmorphism & Animations**: Subtle micro-animations and smooth transitions for a high-end feel.
- **Collapsible Reasoning**: "Thinking" sections are collapsed by default to keep the focus on the conversation.
- **Collapsible Tool Calls**: Detailed JSON input/output for tools are hidden in beautiful, interactive panels.

### 🤖 Multi-Provider & Model Support
- **Claude (Anthropic)**: Full support for Opus, Sonnet, and Haiku models via the Claude Agent SDK.
- **Opencode**: Integration with Opencode.ai, providing access to:
    - Big Pickle (Reasoning model)
    - GPT-5 Nano
    - Grok Code Fast
    - GLM-4.7 & MiniMax
    - Any Anthropic model via Opencode routing.

### 🛠️ Advanced Integration
- **Dynamic Composio Settings**: Manage your Composio API key directly within the app settings. No more hardcoding keys in `.env`.
- **Keyless Server Startup**: The backend server initializes on-demand, allowing you to start the app even before configuring your API keys.
- **Composio Tool Router**: Access 100+ native integrations (Gmail, Slack, GitHub, Browser, etc.) with real-time status visualization.

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) (v10 or higher)

### Installation
1. Clone the repository:
   ```bash
   git clone [your-repo-url]
   cd open-claude-cowork
   ```

2. Install dependencies for all processes:
   ```bash
   # Root directory (Electron app)
   npm install

   # Server directory (Backend)
   CD server && npm install
   ```

### Running the App
Start both the backend server and the Electron application:

**Terminal 1 (Backend Server):**
```bash
cd server
npm start
```

**Terminal 2 (Desktop App):**
```bash
# From the root directory
npm start
```

## ⚙️ Configuration

You can configure your API keys directly in the app settings:
1. Click the **Settings** (gear) icon in the bottom-left corner.
2. Go to the **Providers** tab to enter your Anthropic or Opencode keys.
3. Go to the **Composio** tab to manage your tool integration key.

*Note: Environment variables in a `.env` file are still supported for global defaults.*

## 🏗️ Technical Architecture

| Component | Technology | Role |
|-----------|------------|------|
| **Frontend** | Vanilla JS + HTML5 + CSS3 | Premium UI rendering & streaming logic |
| **Main Process** | Electron.js | Desktop window management & system IPC |
| **Backend** | Node.js + Express | Provider abstraction & long-running agent logic |
| **AI SDKs** | Claude Agent SDK + Opencode | Agentic reasoning & tool orchestration |
| **Tooling** | Composio Tool Router + MCP | 100+ app integrations & browser control |

## 📁 Project Structure
- `main.js`: Electron main process & IPC handlers.
- `preload.js`: Secure bridge between Electron and the Renderer.
- `renderer/`: Frontend assets, CSS themes, and chat logic.
- `server/`: Backend implementation.
    - `providers/`: Abstraction layer for different AI backends.
    - `server.js`: Express SSE server for streaming responses.
- `.claude/skills/`: Custom agent skills to extend capabilities.

## 🤝 Relationship to Original Repo
This project is an evolved successor to the original `open-claude-cowork` implementation. It maintains backward compatibility with the original concepts while introducing:
- A completely overhauled "Loly" design system.
- Support for the Opencode ecosystem.
- Enhanced reliability for Windows environments.
- Streamlined settings management for easier onboarding.

---

<p align="center">
  Built with ❤️ by the Open Loly Team.
</p>
