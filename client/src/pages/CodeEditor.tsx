// src/components/CodeEditor.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';
import Editor, { useMonaco } from '@monaco-editor/react';
import FileExplorer, {type FileItem } from './FileExplorer';

type Props = {
  sessionId: string;
  userName?: string;
};

type Language = {
  id: string;
  name: string;
  monacoId: string;
  defaultCode: string;
  fileExtension: string;
};

const SUPPORTED_LANGUAGES: Language[] = [
  {
    id: 'javascript',
    name: 'JavaScript',
    monacoId: 'javascript',
    fileExtension: 'js',
    defaultCode: `// JavaScript Example
console.log("Hello, World!");

// Variables and functions
const greeting = "Welcome to JavaScript!";
console.log(greeting);

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log("Fibonacci of 10:", fibonacci(10));
`
  },
  {
    id: 'python',
    name: 'Python',
    monacoId: 'python',
    fileExtension: 'py',
    defaultCode: `# Python Example
print("Hello, World!")

def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

print(f"Fibonacci of 10: {fibonacci(10)}")
`
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    monacoId: 'typescript',
    fileExtension: 'ts',
    defaultCode: `// TypeScript Example
interface User {
  id: number;
  name: string;
}

const user: User = { id: 1, name: "Alice" };
console.log(user);
`
  }
];

const CodeEditor: React.FC<Props> = ({ sessionId, userName }) => {
  const editorRef = useRef<any>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const ydocRef = useRef<Y.Doc | null>(null);
  const connectionTimeoutRef = useRef<number | null>(null);
  const monaco = useMonaco();
  
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('disconnected');
  const [output, setOutput] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(SUPPORTED_LANGUAGES[0]);
  const [currentFile, setCurrentFile] = useState<FileItem | null>(null);
  const [openTabs, setOpenTabs] = useState<FileItem[]>([]);
  const [connectedUsers, setConnectedUsers] = useState<string[]>([]);
  const [outputPanelVisible, setOutputPanelVisible] = useState(true);

  // Initialize Yjs document and provider
  useEffect(() => {
    if (!monaco || !sessionId) return;

    console.log('🔧 Initializing Yjs for session:', sessionId);
    
    // Create Yjs document
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    // WebSocket providers with better error handling
    const wsUrls = [
      'wss://ftdblp7b-8000.inc1.devtunnels.ms/yjs', // Your original
      'wss://demos.yjs.dev', // Public demo server
      `ws://localhost:8000/yjs`, // Local development
    ];

    let provider: WebsocketProvider | null = null;
    let currentUrlIndex = 0;
    let isDestroyed = false; // Track if component is being destroyed

    const tryConnection = () => {
      if (isDestroyed || currentUrlIndex >= wsUrls.length) {
        if (currentUrlIndex >= wsUrls.length) {
          console.error('❌ All WebSocket URLs failed');
          setConnectionStatus('failed');
        }
        return;
      }

      // Clear any existing timeout
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }

      const wsUrl = wsUrls[currentUrlIndex];
      console.log(`🔌 Trying WebSocket connection to: ${wsUrl} (attempt ${currentUrlIndex + 1}/${wsUrls.length})`);
      setConnectionStatus('connecting');

      try {
        // Clean up existing provider
        if (provider) {
          provider.disconnect();
          provider = null;
        }

        const newProvider = new WebsocketProvider(wsUrl, sessionId, ydoc, {
          connect: true,
          // Add connection params if needed
          params: {}
        });
        
        provider = newProvider;
        providerRef.current = newProvider;

        // Set user awareness info
        if (userName) {
          newProvider.awareness.setLocalStateField('user', {
            name: userName,
            color: '#' + Math.floor(Math.random() * 16777215).toString(16),
            cursor: null
          });
        }

        // Connection status handling with improved logic
        newProvider.on('status', (event: any) => {
          if (isDestroyed) return;
          
          console.log(`📡 WebSocket status (${wsUrl}):`, event.status);
          setConnectionStatus(event.status);
          
          if (event.status === 'connected') {
            setIsConnected(true);
            // Clear timeout on successful connection
            if (connectionTimeoutRef.current) {
              clearTimeout(connectionTimeoutRef.current);
              connectionTimeoutRef.current = null;
            }
          } else if (event.status === 'disconnected') {
            setIsConnected(false);
            
            // Only try next URL if we haven't successfully connected before
            // or if this is an initial connection failure
            if (currentUrlIndex < wsUrls.length - 1 && !isDestroyed) {
              console.log(`🔄 Connection lost, trying next URL in 2 seconds...`);
              setTimeout(() => {
                if (!isDestroyed) {
                  currentUrlIndex++;
                  tryConnection();
                }
              }, 2000);
            }
          }
        });

        // Document sync events
        newProvider.on('sync', (synced: boolean) => {
          if (isDestroyed) return;
          console.log('🔄 Document synced:', synced);
          
          // If we lost sync, try to reconnect
          if (!synced && isConnected) {
            console.log('⚠️ Document sync lost, but connection is active');
          }
        });

        // Awareness events (other users)
        newProvider.awareness.on('change', () => {
          if (isDestroyed) return;
          const users = Array.from(newProvider.awareness.getStates().values())
            .map((state: any) => state.user?.name)
            .filter(name => name && name !== userName);
          setConnectedUsers([...new Set(users)]);
        });

        // Connection timeout - only for initial connection
        connectionTimeoutRef.current = window.setTimeout(() => {
          if (isDestroyed) return;
          
          if (connectionStatus !== 'connected') {
            console.log(`⏰ Connection timeout for ${wsUrl}`);
            newProvider.disconnect();
            
            if (currentUrlIndex < wsUrls.length - 1) {
              currentUrlIndex++;
              tryConnection();
            } else {
              setConnectionStatus('failed');
            }
          }
        }, 8000); // Increased timeout to 8 seconds

      } catch (error) {
        console.error(`❌ Failed to connect to ${wsUrl}:`, error);
        if (currentUrlIndex < wsUrls.length - 1 && !isDestroyed) {
          currentUrlIndex++;
          setTimeout(tryConnection, 1000);
        } else {
          setConnectionStatus('failed');
        }
      }
    };

    tryConnection();

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up Yjs connection');
      isDestroyed = true;
      
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
      
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }
      if (providerRef.current) {
        providerRef.current.disconnect();
        providerRef.current = null;
      }
      if (ydocRef.current) {
        ydocRef.current.destroy();
        ydocRef.current = null;
      }
      setIsConnected(false);
      setConnectionStatus('disconnected');
    };
  }, [monaco, sessionId, userName]);

  // Improved binding creation with better error handling
  const createBinding = useCallback(() => {
    if (!isConnected || !editorRef.current || !ydocRef.current || !providerRef.current || !currentFile) {
      console.log('🚫 Cannot create binding:', { 
        isConnected, 
        hasEditor: !!editorRef.current, 
        hasYdoc: !!ydocRef.current, 
        hasProvider: !!providerRef.current, 
        hasCurrentFile: !!currentFile 
      });
      return;
    }

    // Destroy existing binding
    if (bindingRef.current) {
      console.log('🗑️ Destroying existing binding');
      bindingRef.current.destroy();
      bindingRef.current = null;
    }

    try {
      console.log('🔗 Creating Monaco binding for file:', currentFile.name);

      // Create a unique key for this file that's consistent across clients
      const fileKey = `file-${currentFile.name}-${currentFile.id}`;
      const yText = ydocRef.current.getText(fileKey);
      const model = editorRef.current.getModel();

      if (!model) {
        console.error('❌ No Monaco model available');
        return;
      }

      // Set the language
      const language = getLanguageFromFile(currentFile);
      monaco?.editor.setModelLanguage(model, language.monacoId);
      setSelectedLanguage(language);

      // Initialize with default content only if empty AND not synced yet
      if (yText.length === 0) {
        const defaultContent = getDefaultContentForFile(currentFile);
        console.log('📝 Initializing file with default content');
        
        // Use a transaction to ensure atomicity
        ydocRef.current.transact(() => {
          yText.insert(0, defaultContent);
        });
      }

      // Create new binding
      bindingRef.current = new MonacoBinding(
        yText,
        model,
        new Set([editorRef.current]),
        providerRef.current.awareness
      );

      console.log('✅ Monaco binding created successfully for', currentFile.name);

    } catch (error) {
      console.error('❌ Failed to create binding:', error);
    }
  }, [isConnected, currentFile, monaco]);

  // Create binding when ready
  useEffect(() => {
    if (isConnected && currentFile) {
      // Small delay to ensure everything is ready
      const timer = setTimeout(createBinding, 100);
      return () => clearTimeout(timer);
    }
  }, [isConnected, currentFile, createBinding]);

  // Handle file selection
  const handleFileSelect = (file: FileItem) => {
    if (file.type === 'file') {
      console.log('📂 Selecting file:', file.name);
      setCurrentFile(file);
      
      // Add to open tabs if not already open
      if (!openTabs.find(tab => tab.id === file.id)) {
        setOpenTabs(prev => [...prev, file]);
      }
    }
  };

  // Close tab
  const closeTab = (fileId: string) => {
    setOpenTabs(prev => prev.filter(tab => tab.id !== fileId));
    
    // If closing current file, switch to another tab or clear current file
    if (currentFile?.id === fileId) {
      const remainingTabs = openTabs.filter(tab => tab.id !== fileId);
      setCurrentFile(remainingTabs.length > 0 ? remainingTabs[remainingTabs.length - 1] : null);
    }
  };

  // Language detection
  const getLanguageFromFile = (file: FileItem): Language => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    const language = SUPPORTED_LANGUAGES.find(lang => lang.fileExtension === extension);
    return language || SUPPORTED_LANGUAGES[0];
  };

  // Default content
  const getDefaultContentForFile = (file: FileItem): string => {
    const language = getLanguageFromFile(file);
    return `// ${file.name}
// Collaborative editing session: ${sessionId}
${language.defaultCode}`;
  };

  const handleEditorDidMount = (editor: any) => {
    console.log('📝 Editor mounted');
    editorRef.current = editor;
    
    // Add editor event listeners for debugging
    editor.onDidChangeModelContent(() => {
      // This will fire for both user changes and Y.js changes
      // console.log('📄 Editor content changed');
    });
  };

  // Execute code
  const executeCode = async () => {
    if (!editorRef.current || !currentFile) return;

    setIsExecuting(true);
    setOutput('');

    const code = editorRef.current.getValue();
    const language = getLanguageFromFile(currentFile);

    try {
      if (language.id === 'javascript') {
        const originalLog = console.log;
        const logs: string[] = [];
        
        console.log = (...args) => {
          logs.push(args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' '));
        };

        const result = eval(code);
        console.log = originalLog;
        
        let output = '';
        if (logs.length > 0) {
          output += 'Console Output:\n' + logs.join('\n') + '\n\n';
        }
        
        if (result !== undefined) {
          output += 'Return Value:\n' + (typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result));
        }
        
        setOutput(output || 'JavaScript executed successfully (no output)');
      } else {
        setOutput(`✨ ${language.name} code is ready!\n\n📝 Code length: ${code.length} characters\n\n⚡ Server-side execution would be needed for ${language.name}`);
      }
      
    } catch (error) {
      setOutput(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsExecuting(false);
    }
  };

  // Test synchronization
  const testSync = () => {
    if (!ydocRef.current || !currentFile) return;
    
    const testText = `\n// Sync test at ${new Date().toLocaleTimeString()}\n`;
    const fileKey = `file-${currentFile.name}-${currentFile.id}`;
    const yText = ydocRef.current.getText(fileKey);
    
    ydocRef.current.transact(() => {
      yText.insert(yText.length, testText);
    });
  };

  // Reconnect function
  const reconnect = () => {
    console.log('🔄 Manual reconnection requested');
    if (providerRef.current) {
      providerRef.current.disconnect();
    }
    setConnectionStatus('connecting');
    
    // Trigger reconnection by updating a dependency
    setTimeout(() => {
      if (ydocRef.current) {
        // This will trigger the useEffect to reinitialize
        const currentYdoc = ydocRef.current;
        ydocRef.current = null;
        setTimeout(() => {
          ydocRef.current = currentYdoc;
        }, 100);
      }
    }, 500);
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js':
      case 'jsx':
        return '🟨';
      case 'ts':
      case 'tsx':
        return '🔷';
      case 'html':
        return '🌐';
      case 'css':
        return '🎨';
      case 'json':
        return '⚙️';
      case 'md':
        return '📝';
      case 'py':
        return '🐍';
      case 'java':
        return '☕';
      case 'cpp':
      case 'c':
        return '⚡';
      default:
        return '📄';
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return '#28a745';
      case 'connecting': return '#ffc107';
      case 'failed': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'failed': return 'Connection Failed';
      default: return 'Disconnected';
    }
  };

  return (
    <div className="code-editor-container">
      {/* File Explorer */}
      <FileExplorer
        ydoc={ydocRef.current}
        onFileSelect={handleFileSelect}
        selectedFileId={currentFile?.id || null} 
        currentLanguage={''}      
      />

      {/* Editor Panel */}
      <div className="editor-panel">
        {/* Tab Bar */}
        <div className="tab-bar">
          <div className="tabs-container">
            {openTabs.map(tab => (
              <div
                key={tab.id}
                className={`tab ${currentFile?.id === tab.id ? 'active' : ''}`}
                onClick={() => setCurrentFile(tab)}
              >
                <span className="tab-icon">{getFileIcon(tab.name)}</span>
                <span className="tab-name">{tab.name}</span>
                <button
                  className="tab-close"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12">
                    <path d="M9 3L3 9M3 3l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Status Bar */}
        <div className="status-bar">
          <div className="status-left">
            <div className="status-item connection-status">
              <div 
                className="connection-indicator"
                style={{ backgroundColor: getConnectionStatusColor() }}
              ></div>
              <span className="status-text">{getConnectionStatusText()}</span>
            </div>
            
            {sessionId && (
              <div className="status-item">
                <span className="status-label">Session:</span>
                <span className="status-value">{sessionId}</span>
              </div>
            )}

            {userName && (
              <div className="status-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="10"/>
                  <circle cx="12" cy="8" r="3" fill="#2d3142"/>
                  <path d="M20.5 20.5c-2.5-3.5-6.5-5.5-8.5-5.5s-6 2-8.5 5.5" fill="#2d3142"/>
                </svg>
                <span className="status-value">{userName}</span>
              </div>
            )}

            {connectedUsers.length > 0 && (
              <div className="status-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.996 1.996 0 0 0 18 7h-2c-.8 0-1.52.48-1.83 1.21L12 14v6h8z"/>
                  <path d="M12.5 11.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5S11 9.17 11 10s.67 1.5 1.5 1.5z"/>
                  <path d="M5.5 6c1.11 0 2-.89 2-2s-.89-2-2-2-2 .89-2 2 .89 2 2 2zm1.5 2h-2C4.57 8 4 8.57 4 9.25V23h8v-6l-2.12-5.07c-.4-.95-1.33-1.65-2.38-1.65z"/>
                </svg>
                <span className="status-value">{connectedUsers.length} online</span>
              </div>
            )}
          </div>
          
          <div className="status-right">
            {currentFile && (
              <div className="status-item">
                <span className="status-value">{getLanguageFromFile(currentFile).name}</span>
              </div>
            )}

            {!isConnected && connectionStatus === 'failed' && (
              <button className="reconnect-btn" onClick={reconnect}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8c-.45-.83-.7-1.79-.7-2.8 0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.44.84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z"/>
                </svg>
                Reconnect
              </button>
            )}
          </div>
        </div>

        {/* Editor */}
        {currentFile ? (
          <div className="editor-container">
            <Editor
              height="100%"
              theme="vs-dark"
              language={getLanguageFromFile(currentFile).monacoId}
              onMount={handleEditorDidMount}
              options={{
                minimap: { enabled: true },
                fontSize: 14,
                lineNumbers: 'on',
                wordWrap: 'on',
                automaticLayout: true,
                suggestOnTriggerCharacters: true,
                quickSuggestions: true,
                snippetSuggestions: 'inline',
                renderWhitespace: 'selection',
                rulers: [80, 120],
                folding: true,
                foldingHighlight: true,
                showFoldingControls: 'mouseover',
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                cursorBlinking: 'smooth',
                renderLineHighlight: 'all',
                bracketPairColorization: { enabled: true },
                guides: {
                  bracketPairs: true,
                  indentation: true
                }
              }}
            />
          </div>
        ) : (
          <div className="empty-editor">
            <div className="empty-content">
              <div className="empty-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                </svg>
              </div>
              <h3>Welcome to CodeCollab</h3>
              <p>Select a file from the explorer to start collaborative coding</p>
              <div className="connection-info">
                <div className="info-item">
                  <span className="info-label">Status:</span>
                  <span className={`info-value ${connectionStatus}`}>{getConnectionStatusText()}</span>
                </div>
                {sessionId && (
                  <div className="info-item">
                    <span className="info-label">Session:</span>
                    <span className="info-value">{sessionId}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Output Panel */}
      {outputPanelVisible && (
        <div className="output-panel">
          <div className="output-header">
            <div className="output-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0L19.2 12l-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
              </svg>
              <span>Output</span>
              {currentFile && (
                <span className="output-lang">{getLanguageFromFile(currentFile).name}</span>
              )}
            </div>
            <div className="output-actions">
              {currentFile && isConnected && (
                <button className="output-btn test-sync" onClick={testSync} title="Test Sync">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
                  </svg>
                </button>
              )}
              
              {currentFile && (
                <button 
                  className={`output-btn run-btn ${selectedLanguage.id === 'javascript' ? 'javascript' : 'other'}`}
                  onClick={executeCode}
                  disabled={isExecuting}
                >
                  {isExecuting ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="spinner">
                      <path d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,19a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z" opacity=".25"/>
                      <path d="M12,4a8,8,0,0,1,7.89,6.7A1.53,1.53,0,0,0,21.38,12h0a1.5,1.5,0,0,0,1.48-1.75,11,11,0,0,0-21.72,0A1.5,1.5,0,0,0,2.62,12h0a1.53,1.53,0,0,0,1.49-1.3A8,8,0,0,1,12,4Z"/>
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8,5.14V19.14L19,12.14L8,5.14Z"/>
                    </svg>
                  )}
                  {isExecuting ? 'Running...' : selectedLanguage.id === 'javascript' ? 'Run' : 'Preview'}
                </button>
              )}

              <button className="output-btn clear-btn" onClick={() => setOutput('')} title="Clear">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
                </svg>
              </button>

              <button 
                className="output-btn close-btn" 
                onClick={() => setOutputPanelVisible(false)}
                title="Close Panel"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
                </svg>
              </button>
            </div>
          </div>
          
          <div className="output-content">
            {output ? (
              <pre className="output-text">{output}</pre>
            ) : (
              <div className="output-placeholder">
                <div className="placeholder-content">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0L19.2 12l-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
                  </svg>
                  <p>
                    {currentFile ? 
                      `Select ${getLanguageFromFile(currentFile).name} code and click "Run" to see output...` :
                      'Select a file to see output options...'
                    }
                  </p>
                  <div className="sync-info">
                    <div className="sync-item">
                      <span>Connection:</span>
                      <span className={`sync-status ${connectionStatus}`}>{getConnectionStatusText()}</span>
                    </div>
                    {connectedUsers.length > 0 && (
                      <div className="sync-item">
                        <span>Users:</span>
                        <span>{connectedUsers.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Show/Hide Output Panel Button */}
      {!outputPanelVisible && (
        <button 
          className="toggle-output-btn"
          onClick={() => setOutputPanelVisible(true)}
          title="Show Output Panel"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0L19.2 12l-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
          </svg>
          Output
        </button>
      )}

      <style>{`
        .code-editor-container {
          display: flex;
          height: 100vh;
          background: #1e1e1e;
          color: #cccccc;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          overflow: hidden;
        }

        .editor-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        /* Tab Bar */
        .tab-bar {
          background: #2d2d30;
          border-bottom: 1px solid #3e3e42;
          display: flex;
          align-items: center;
          min-height: 35px;
        }

        .tabs-container {
          display: flex;
          flex: 1;
          overflow-x: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .tabs-container::-webkit-scrollbar {
          display: none;
        }

        .tab {
          display: flex;
          align-items: center;
          padding: 8px 12px;
          background: #2d2d30;
          color: #969696;
          border-right: 1px solid #3e3e42;
          cursor: pointer;
          font-size: 13px;
          transition: all 0.2s ease;
          min-width: 120px;
          max-width: 200px;
          position: relative;
        }

        .tab:hover {
          background: #37373d;
          color: #cccccc;
        }

        .tab.active {
          background: #1e1e1e;
          color: #ffffff;
          border-top: 2px solid #0078d4;
        }

        .tab-icon {
          margin-right: 6px;
          font-size: 12px;
        }

        .tab-name {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .tab-close {
          background: none;
          border: none;
          color: inherit;
          cursor: pointer;
          padding: 2px;
          margin-left: 6px;
          border-radius: 2px;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .tab:hover .tab-close {
          opacity: 1;
        }

        .tab-close:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        /* Status Bar */
        .status-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 4px 12px;
          background: #007acc;
          color: white;
          font-size: 12px;
          min-height: 22px;
        }

        .status-left, .status-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .status-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .connection-status {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .connection-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }

        .status-label {
          opacity: 0.8;
          font-weight: 500;
        }

        .status-value {
          font-weight: 600;
        }

        .reconnect-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          padding: 4px 8px;
          border-radius: 3px;
          cursor: pointer;
          font-size: 11px;
          transition: background-color 0.2s ease;
        }

        .reconnect-btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        /* Editor Container */
        .editor-container {
          flex: 1;
          background: #1e1e1e;
        }

        /* Empty Editor */
        .empty-editor {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #1e1e1e;
        }

        .empty-content {
          text-align: center;
          color: #969696;
          max-width: 400px;
        }

        .empty-icon {
          margin-bottom: 24px;
          opacity: 0.6;
        }

        .empty-content h3 {
          margin: 0 0 12px 0;
          font-size: 24px;
          font-weight: 600;
          color: #cccccc;
        }

        .empty-content p {
          margin: 0 0 24px 0;
          font-size: 16px;
          line-height: 1.5;
        }

        .connection-info {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 6px;
          border: 1px solid #3e3e42;
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
        }

        .info-label {
          opacity: 0.7;
        }

        .info-value {
          font-weight: 500;
        }

        .info-value.connected {
          color: #28a745;
        }

        .info-value.connecting {
          color: #ffc107;
        }

        .info-value.failed {
          color: #dc3545;
        }

        .info-value.disconnected {
          color: #6c757d;
        }

        /* Output Panel */
        .output-panel {
          width: 400px;
          background: #1e1e1e;
          display: flex;
          flex-direction: column;
          border-left: 1px solid #3e3e42;
        }

        .output-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: #2d2d30;
          border-bottom: 1px solid #3e3e42;
        }

        .output-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .output-lang {
          background: rgba(255, 255, 255, 0.1);
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 10px;
          font-weight: 500;
          margin-left: 8px;
        }

        .output-actions {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .output-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          background: transparent;
          border: none;
          color: #cccccc;
          cursor: pointer;
          border-radius: 3px;
          transition: all 0.2s ease;
        }

        .output-btn:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .run-btn {
          width: auto;
          padding: 0 8px;
          gap: 4px;
          font-size: 11px;
          font-weight: 500;
        }

        .run-btn.javascript {
          background: #28a745;
          color: white;
        }

        .run-btn.javascript:hover {
          background: #218838;
        }

        .run-btn.other {
          background: #ff9800;
          color: white;
        }

        .run-btn.other:hover {
          background: #f57c00;
        }

        .run-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .test-sync {
          color: #17a2b8;
        }

        .test-sync:hover {
          background: rgba(23, 162, 184, 0.2);
        }

        .clear-btn {
          color: #dc3545;
        }

        .clear-btn:hover {
          background: rgba(220, 53, 69, 0.2);
        }

        .close-btn:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .output-content {
          flex: 1;
          overflow: auto;
          background: #1e1e1e;
        }

        .output-text {
          margin: 0;
          padding: 16px;
          font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
          font-size: 12px;
          line-height: 1.5;
          white-space: pre-wrap;
          color: #d4d4d4;
        }

        .output-placeholder {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }

        .placeholder-content {
          text-align: center;
          color: #969696;
          max-width: 300px;
        }

        .placeholder-content svg {
          margin-bottom: 16px;
          opacity: 0.6;
        }

        .placeholder-content p {
          margin: 0 0 20px 0;
          font-size: 14px;
          line-height: 1.5;
        }

        .sync-info {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 4px;
          border: 1px solid #3e3e42;
        }

        .sync-item {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
        }

        .sync-status.connected {
          color: #28a745;
        }

        .sync-status.connecting {
          color: #ffc107;
        }

        .sync-status.failed {
          color: #dc3545;
        }

        .sync-status.disconnected {
          color: #6c757d;
        }

        /* Toggle Output Button */
        .toggle-output-btn {
          position: fixed;
          bottom: 20px;
          right: 20px;
          display: flex;
          align-items: center;
          gap: 6px;
          background: #007acc;
          color: white;
          border: none;
          padding: 8px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          transition: all 0.2s ease;
          z-index: 1000;
        }

        .toggle-output-btn:hover {
          background: #106ebe;
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
        }

        /* Responsive Design */
        @media (max-width: 1200px) {
          .output-panel {
            width: 350px;
          }
        }

        @media (max-width: 900px) {
          .output-panel {
            width: 300px;
          }
          
          .status-left, .status-right {
            gap: 8px;
          }
          
          .status-item {
            font-size: 11px;
          }
        }

        @media (max-width: 768px) {
          .code-editor-container {
            flex-direction: column;
          }
          
          .output-panel {
            width: 100%;
            height: 200px;
            border-left: none;
            border-top: 1px solid #3e3e42;
          }
          
          .toggle-output-btn {
            bottom: 10px;
            right: 10px;
          }
        }

        /* Scrollbar Styling */
        .output-content::-webkit-scrollbar,
        .tabs-container::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        .output-content::-webkit-scrollbar-track,
        .tabs-container::-webkit-scrollbar-track {
          background: #2d2d30;
        }

        .output-content::-webkit-scrollbar-thumb,
        .tabs-container::-webkit-scrollbar-thumb {
          background: #424242;
          border-radius: 4px;
        }

        .output-content::-webkit-scrollbar-thumb:hover,
        .tabs-container::-webkit-scrollbar-thumb:hover {
          background: #4f4f4f;
        }
      `}</style>
    </div>
  );
};

export default CodeEditor;