// server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const WebSocket = require("ws");
const { setupWSConnection } = require("y-websocket/bin/utils");
const { exec, spawn } = require("child_process");
const fs = require("fs").promises;
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const app = express();
const server = http.createServer(app);

// Enable JSON parsing for POST requests
app.use(express.json({ limit: '10mb' }));

// Enable CORS for Express
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  next();
});

// Create temp directory for code execution
const TEMP_DIR = path.join(__dirname, 'temp');
const ensureTempDir = async () => {
  try {
    await fs.access(TEMP_DIR);
  } catch {
    await fs.mkdir(TEMP_DIR, { recursive: true });
  }
};

// Initialize temp directory
ensureTempDir().then(() => {
  console.log('📁 Temp directory initialized at:', TEMP_DIR);
}).catch(console.error);

// 🔌 Socket.IO setup (optional, for chat/video signaling etc.)
const io = new Server(server, {
  cors: {
    origin: "*", // Replace with your frontend URL in production
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("🟢 Socket.IO client connected:", socket.id);
  
  socket.on("disconnect", () => {
    console.log("🔴 Socket.IO client disconnected:", socket.id);
  });
});

// 🔁 Yjs WebSocket setup (for real-time code collaboration)
const wss = new WebSocket.Server({ 
  noServer: true,
  perMessageDeflate: false
});

// Track active connections for debugging
let connectionCount = 0;
const activeConnections = new Map();

wss.on('connection', (ws, req) => {
  connectionCount++;
  const connId = connectionCount;
  activeConnections.set(connId, ws);
  
  console.log(`🔗 Yjs WebSocket connection ${connId} established`);
  console.log(`📊 Active connections: ${activeConnections.size}`);
  
  ws.on('close', () => {
    activeConnections.delete(connId);
    console.log(`🔗 Yjs WebSocket connection ${connId} closed`);
    console.log(`📊 Active connections: ${activeConnections.size}`);
  });
  
  ws.on('error', (error) => {
    console.error(`❌ WebSocket error on connection ${connId}:`, error);
  });
});

server.on("upgrade", (request, socket, head) => {
  const pathname = request.url;
  console.log(`🔄 WebSocket upgrade request: ${pathname}`);
  
  // Forward all /yjs connections to Y-WebSocket
  if (pathname.startsWith("/yjs")) {
    wss.handleUpgrade(request, socket, head, (ws) => {
      console.log(`✅ Handling Yjs connection for: ${pathname}`);
      
      // Extract document name from URL (everything after /yjs/)
      const docName = pathname.slice(5); // Remove "/yjs/"
      console.log(`📄 Document name: "${docName}"`);
      
      // Setup the Y-WebSocket connection
      try {
        setupWSConnection(ws, request, { 
          docName: docName || 'default-doc',
          // Add additional configuration if needed
          gc: true // Enable garbage collection
        });
        console.log(`🎯 Y-WebSocket setup complete for doc: ${docName}`);
      } catch (error) {
        console.error('❌ Error setting up Y-WebSocket:', error);
        ws.close();
      }
    });
  } else {
    console.log(`❌ Invalid WebSocket path: ${pathname}`);
    socket.destroy();
  }
});

// 💾 Code execution utility functions
const cleanupFile = async (filePath) => {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.error('Error cleaning up file:', error);
  }
};

const executeWithTimeout = (command, options = {}) => {
  return new Promise((resolve, reject) => {
    const timeout = options.timeout || 10000; // 10 seconds default
    let isResolved = false;
    
    const child = exec(command, { 
      cwd: options.cwd || TEMP_DIR,
      timeout,
      maxBuffer: 1024 * 1024 // 1MB buffer
    }, (error, stdout, stderr) => {
      if (isResolved) return;
      isResolved = true;
      
      if (error) {
        if (error.code === 'ETIMEDOUT') {
          reject(new Error('Code execution timed out (10 seconds limit)'));
        } else {
          reject(error);
        }
      } else {
        resolve({ stdout, stderr });
      }
    });

    // Force kill after timeout
    setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        child.kill('SIGKILL');
        reject(new Error('Code execution timed out'));
      }
    }, timeout + 1000);
  });
};

// 🚀 Code execution endpoints
app.post('/api/execute/javascript', async (req, res) => {
  const { code, sessionId } = req.body;
  
  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
  }

  const filename = `${sessionId || uuidv4()}.js`;
  const filePath = path.join(TEMP_DIR, filename);

  try {
    // Write code to temporary file
    await fs.writeFile(filePath, code);
    
    // Execute JavaScript with Node.js
    const { stdout, stderr } = await executeWithTimeout(`node "${filename}"`);
    
    res.json({
      success: true,
      output: stdout,
      error: stderr,
      language: 'javascript'
    });

  } catch (error) {
    res.json({
      success: false,
      output: '',
      error: error.message,
      language: 'javascript'
    });
  } finally {
    // Cleanup
    setTimeout(() => cleanupFile(filePath), 1000);
  }
});

app.post('/api/execute/python', async (req, res) => {
  const { code, sessionId } = req.body;
  
  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
  }

  const filename = `${sessionId || uuidv4()}.py`;
  const filePath = path.join(TEMP_DIR, filename);

  try {
    // Write code to temporary file
    await fs.writeFile(filePath, code);
    
    // Execute Python
    const { stdout, stderr } = await executeWithTimeout(`python3 "${filename}"`);
    
    res.json({
      success: true,
      output: stdout,
      error: stderr,
      language: 'python'
    });

  } catch (error) {
    res.json({
      success: false,
      output: '',
      error: error.message,
      language: 'python'
    });
  } finally {
    // Cleanup
    setTimeout(() => cleanupFile(filePath), 1000);
  }
});

app.post('/api/execute/java', async (req, res) => {
  const { code, sessionId } = req.body;
  
  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
  }

  // Extract class name from code
  const classMatch = code.match(/public\s+class\s+(\w+)/);
  const className = classMatch ? classMatch[1] : 'Main';
  
  const filename = `${className}.java`;
  const filePath = path.join(TEMP_DIR, filename);

  try {
    // Write code to temporary file
    await fs.writeFile(filePath, code);
    
    // Compile Java
    await executeWithTimeout(`javac "${filename}"`);
    
    // Execute Java
    const { stdout, stderr } = await executeWithTimeout(`java ${className}`);
    
    res.json({
      success: true,
      output: stdout,
      error: stderr,
      language: 'java'
    });

  } catch (error) {
    res.json({
      success: false,
      output: '',
      error: error.message,
      language: 'java'
    });
  } finally {
    // Cleanup both .java and .class files
    setTimeout(async () => {
      await cleanupFile(filePath);
      await cleanupFile(path.join(TEMP_DIR, `${className}.class`));
    }, 1000);
  }
});

app.post('/api/execute/cpp', async (req, res) => {
  const { code, sessionId } = req.body;
  
  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
  }

  const sessionUuid = sessionId || uuidv4();
  const filename = `${sessionUuid}.cpp`;
  const outputName = `${sessionUuid}.out`;
  const filePath = path.join(TEMP_DIR, filename);
  const outputPath = path.join(TEMP_DIR, outputName);

  try {
    // Write code to temporary file
    await fs.writeFile(filePath, code);
    
    // Compile C++
    await executeWithTimeout(`g++ -o "${outputName}" "${filename}"`);
    
    // Execute compiled binary
    const { stdout, stderr } = await executeWithTimeout(`./${outputName}`);
    
    res.json({
      success: true,
      output: stdout,
      error: stderr,
      language: 'cpp'
    });

  } catch (error) {
    res.json({
      success: false,
      output: '',
      error: error.message,
      language: 'cpp'
    });
  } finally {
    // Cleanup source and binary files
    setTimeout(async () => {
      await cleanupFile(filePath);
      await cleanupFile(outputPath);
    }, 1000);
  }
});

// HTML execution endpoint (returns the HTML for iframe rendering)
app.post('/api/execute/html', async (req, res) => {
  const { code } = req.body;
  
  if (!code) {
    return res.status(400).json({ error: 'HTML code is required' });
  }

  try {
    res.json({
      success: true,
      output: code,
      error: '',
      language: 'html',
      type: 'html'
    });
  } catch (error) {
    res.json({
      success: false,
      output: '',
      error: error.message,
      language: 'html'
    });
  }
});

// Generic execution endpoint that routes to specific language handlers
app.post('/api/execute', async (req, res) => {
  const { language } = req.body;
  
  const languageMap = {
    'javascript': '/api/execute/javascript',
    'python': '/api/execute/python',
    'java': '/api/execute/java',
    'cpp': '/api/execute/cpp',
    'html': '/api/execute/html'
  };

  if (!languageMap[language]) {
    return res.status(400).json({ 
      error: `Language '${language}' is not supported. Supported languages: ${Object.keys(languageMap).join(', ')}` 
    });
  }

  // Forward to specific language handler
  req.url = languageMap[language];
  app._router.handle(req, res);
});

// Get system information (useful for debugging execution environment)
app.get('/api/system-info', async (req, res) => {
  try {
    const nodeVersion = await executeWithTimeout('node --version');
    const pythonVersion = await executeWithTimeout('python3 --version').catch(() => ({ stdout: 'Not installed', stderr: '' }));
    const javaVersion = await executeWithTimeout('java -version').catch(() => ({ stdout: 'Not installed', stderr: '' }));
    const gccVersion = await executeWithTimeout('g++ --version').catch(() => ({ stdout: 'Not installed', stderr: '' }));

    res.json({
      system: {
        node: nodeVersion.stdout.trim(),
        python: pythonVersion.stdout.trim() || pythonVersion.stderr.trim(),
        java: javaVersion.stderr.trim() || 'Not installed', // Java prints version to stderr
        cpp: gccVersion.stdout.split('\n')[0] || 'Not installed'
      },
      tempDir: TEMP_DIR,
      supportedLanguages: ['javascript', 'python', 'java', 'cpp', 'html']
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get system information' });
  }
});

// 🛠️ Your existing Express API routes
app.get("/", (req, res) => {
  res.json({
    message: "Enhanced server with multi-language code execution",
    activeConnections: activeConnections.size,
    supportedLanguages: ['javascript', 'python', 'java', 'cpp', 'html'],
    endpoints: {
      execution: '/api/execute',
      systemInfo: '/api/system-info',
      health: '/health'
    },
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    yjs_connections: activeConnections.size,
    socketio_connections: io.engine.clientsCount,
    execution_ready: true
  });
});

// 🚀 Start server
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`✅ Enhanced server running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket endpoint: ws://localhost:${PORT}/yjs`);
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
  console.log(`🚀 Code execution: http://localhost:${PORT}/api/execute`);
  console.log(`📊 System info: http://localhost:${PORT}/api/system-info`);
});

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('🛑 Shutting down gracefully');
  
  // Clean up temp directory
  try {
    const files = await fs.readdir(TEMP_DIR);
    await Promise.all(files.map(file => 
      fs.unlink(path.join(TEMP_DIR, file)).catch(console.error)
    ));
    console.log('🧹 Temp files cleaned up');
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
  
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);