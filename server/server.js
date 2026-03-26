import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
import { Composio } from '@composio/core';
import { ClaudeAgentSDKProvider } from '@composio/claude-agent-sdk';
import { createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk';
import { getProvider, getAvailableProviders, initializeProviders } from './providers/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize global Composio - wrap in try/catch to prevent crash if key is missing
let composio = null;
if (process.env.COMPOSIO_API_KEY) {
  try {
    composio = new Composio({
      apiKey: process.env.COMPOSIO_API_KEY,
      provider: new ClaudeAgentSDKProvider(),
    });
    console.log('[COMPOSIO] Global instance initialized with environment key');
  } catch (err) {
    console.warn('[COMPOSIO] Failed to initialize global instance:', err.message);
  }
} else {
  console.log('[COMPOSIO] No API key in .env, will use dynamic key if provided via chat');
}

const composioSessions = new Map();
let defaultComposioSession = null;

async function initializeComposioSession() {
  if (!composio) {
    console.log('[COMPOSIO] Skipping pre-initialization (no key in .env)');
    return;
  }
  const defaultUserId = 'default-user';
  console.log('[COMPOSIO] Pre-initializing session for:', defaultUserId);
  try {
    defaultComposioSession = await composio.create(defaultUserId);
    composioSessions.set(defaultUserId, defaultComposioSession);
    console.log('[COMPOSIO] Session ready');

    if (defaultComposioSession.mcp) {
      updateOpencodeConfig(defaultComposioSession.mcp.url, defaultComposioSession.mcp.headers);
      console.log('[OPENCODE] Updated opencode.json with MCP config');
    }
  } catch (error) {
    console.error('[COMPOSIO] Failed to pre-initialize session:', error.message);
  }
}

// Write MCP config to opencode.json
function updateOpencodeConfig(mcpUrl, mcpHeaders) {
  const opencodeConfigPath = path.join(__dirname, 'opencode.json');
  const config = {
    mcp: {
      composio: {
        type: 'remote',
        url: mcpUrl,
        headers: mcpHeaders
      }
    }
  };
  fs.writeFileSync(opencodeConfigPath, JSON.stringify(config, null, 2));
}

// Middleware
app.use(cors());
app.use(express.json());

// Chat endpoint with robust streaming and provider abstraction
app.post('/api/chat', async (req, res) => {
  const {
    message,
    chatId,
    userId = 'default-user',
    provider: providerName = 'claude',
    model = null,
    composioApiKey = null
  } = req.body;

  console.log('[CHAT] Request received:', message);
  console.log('[CHAT] Chat ID:', chatId);
  console.log('[CHAT] Provider:', providerName);
  console.log('[CHAT] Model:', model || '(default)');
  if (composioApiKey) console.log('[CHAT] Using custom Composio API key');

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // Validate provider
  const availableProviders = getAvailableProviders();
  if (!availableProviders.includes(providerName.toLowerCase())) {
    return res.status(400).json({
      error: `Invalid provider: ${providerName}. Available: ${availableProviders.join(', ')}`
    });
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // Send connection confirmation
  res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Starting chat...' })}\n\n`);

  // Heartbeat to keep connection alive
  const heartbeatInterval = setInterval(() => {
    if (!res.writableEnded) {
      res.write(': heartbeat\n\n');
    }
  }, 15000);

  res.on('close', () => {
    clearInterval(heartbeatInterval);
  });

  try {
    // Determine which Composio instance to use
    let activeComposio = composio;
    
    // If we have a request-level key, always use it
    if (composioApiKey) {
      console.log('[COMPOSIO] Using dynamic API key from request');
      try {
        activeComposio = new Composio({
          apiKey: composioApiKey,
          provider: new ClaudeAgentSDKProvider(),
        });
      } catch (keyError) {
        console.error('[COMPOSIO] Invalid dynamic key provided:', keyError.message);
        throw new Error('Invalid Composio API key provided in request');
      }
    }

    if (!activeComposio) {
      throw new Error('Composio API key is required. Please provide it in settings or .env file.');
    }

    // Get or create Composio session for this user
    let composioSession;
    if (activeComposio !== composio || composioApiKey) {
      console.log('[COMPOSIO] Creating temporary session with custom key');
      composioSession = await activeComposio.create(userId);
    } else {
      composioSession = composioSessions.get(userId);
      if (!composioSession) {
        console.log('[COMPOSIO] Creating new session for user:', userId);
        res.write(`data: ${JSON.stringify({ type: 'status', message: 'Initializing session...' })}\n\n`);
        composioSession = await activeComposio.create(userId);
        composioSessions.set(userId, composioSession);
        console.log('[COMPOSIO] Session created');

        // Update opencode.json with the MCP config if available
        if (composioSession.mcp) {
          updateOpencodeConfig(composioSession.mcp.url, composioSession.mcp.headers);
          console.log('[OPENCODE] Updated opencode.json with MCP config');
        }
      }
    }

    // Get tools and create MCP server for Composio
    const tools = await composioSession.tools();
    const composioServer = createSdkMcpServer({
      name: "composio",
      version: "1.0.0",
      tools: tools,
    });

    // Get the provider instance
    const provider = getProvider(providerName);
    const mcpServers = { composio: composioServer };

    console.log('[CHAT] Using provider:', provider.name);

    // Stream responses from the provider
    try {
      for await (const chunk of provider.query({
        prompt: message,
        chatId,
        userId,
        mcpServers,
        model,
        allowedTools: ['Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep', 'WebSearch', 'WebFetch', 'TodoWrite', 'Skill'],
        maxTurns: 100
      })) {
        // Log important events
        if (chunk.type === 'tool_use') console.log('[SSE] Tool use:', chunk.name);
        if (chunk.type === 'text' && !chunk.isReasoning) console.log('[SSE] Text chunk, length:', chunk.content?.length);

        // Send chunk as SSE
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }
    } catch (streamError) {
      console.error('[CHAT] Stream error during iteration:', streamError);
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify({ type: 'error', message: streamError.message })}\n\n`);
      }
    }

    clearInterval(heartbeatInterval);
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ type: 'done', message: 'Complete' })}\n\n`);
      res.end();
    }
    console.log('[CHAT] Stream completed');

  } catch (error) {
    clearInterval(heartbeatInterval);
    console.error('[CHAT] Error:', error.message);
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
      res.end();
    }
  }
});

// Abort endpoint
app.post('/api/abort', (req, res) => {
  const { chatId, provider: providerName = 'claude' } = req.body;
  if (!chatId) return res.status(400).json({ error: 'chatId is required' });

  try {
    const provider = getProvider(providerName);
    const aborted = provider.abort(chatId);
    if (aborted) {
      res.json({ success: true, message: 'Query aborted' });
    } else {
      res.json({ success: false, message: 'No active query to abort' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get available providers
app.get('/api/providers', (_req, res) => {
  res.json({
    providers: getAvailableProviders(),
    default: 'claude'
  });
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    providers: getAvailableProviders()
  });
});

// Initialize and start server
const startServer = async () => {
  await initializeProviders();
  await initializeComposioSession();

  const server = app.listen(PORT, () => {
    console.log(`\n✓ Backend server running on http://localhost:${PORT}`);
  });

  server.on('error', (err) => {
    console.error('Server error:', err);
  });

  process.on('SIGINT', () => {
    server.close(() => process.exit(0));
  });
};

startServer();
