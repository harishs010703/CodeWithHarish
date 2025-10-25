// src/components/FileExplorer.tsx
import React, { useEffect, useState } from 'react';
import * as Y from 'yjs';

export interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  parentId?: string;
  children?: FileItem[];
}

interface Props {
  ydoc: Y.Doc | null;
  onFileSelect: (file: FileItem) => void;
  selectedFileId: string | null;
  currentLanguage: string;
}

const FileExplorer: React.FC<Props> = ({ ydoc, onFileSelect, selectedFileId }) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root']));
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    itemId: string | null;
  } | null>(null);
  const [isCreating, setIsCreating] = useState<{
    type: 'file' | 'folder';
    parentId?: string;
  } | null>(null);
  const [newItemName, setNewItemName] = useState('');

  // Initialize empty file structure
  useEffect(() => {
    if (!ydoc) return;

    const filesMap = ydoc.getMap('files');
    
    // Initialize with empty structure if not exists
    if (!filesMap.has('structure')) {
      ydoc.transact(() => {
        filesMap.set('structure', []);
      });
      setFiles([]);
    } else {
      // Load existing structure
      const structure = filesMap.get('structure') as FileItem[];
      if (structure) {
        setFiles(structure);
      }
    }

    // Listen for changes
    const observer = () => {
      const structure = filesMap.get('structure') as FileItem[];
      if (structure) {
        setFiles(structure);
      }
    };

    filesMap.observe(observer);

    return () => {
      filesMap.unobserve(observer);
    };
  }, [ydoc]);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu(null);
    };

    if (contextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu]);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const startCreating = (type: 'file' | 'folder', parentId?: string) => {
    setIsCreating({ type, parentId });
    setNewItemName('');
    setContextMenu(null);
  };

  const finishCreating = () => {
    if (!ydoc || !isCreating || !newItemName.trim()) {
      cancelCreating();
      return;
    }

    const fileName = newItemName.trim();
    
    // Check if file already exists
    const fileExists = findFileByName(files, fileName);
    if (fileExists) {
      alert('A file with this name already exists!');
      return;
    }

    const newItem: FileItem = {
      id: `${isCreating.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: fileName,
      type: isCreating.type,
      parentId: isCreating.parentId,
      ...(isCreating.type === 'folder' && { children: [] })
    };

    const filesMap = ydoc.getMap('files');
    ydoc.transact(() => {
      const currentStructure = filesMap.get('structure') as FileItem[] || [];
      const updatedStructure = [...currentStructure, newItem];
      filesMap.set('structure', updatedStructure);
    });

    setIsCreating(null);
    setNewItemName('');
  };

  const cancelCreating = () => {
    setIsCreating(null);
    setNewItemName('');
  };

  const findFileByName = (structure: FileItem[], name: string): FileItem | null => {
    for (const item of structure) {
      if (item.name === name) {
        return item;
      }
      if (item.children) {
        const found = findFileByName(item.children, name);
        if (found) return found;
      }
    }
    return null;
  };

  const deleteItem = (itemId: string) => {
    if (!ydoc) return;
    if (!confirm('Are you sure you want to delete this item?')) return;

    const filesMap = ydoc.getMap('files');
    ydoc.transact(() => {
      const currentStructure = filesMap.get('structure') as FileItem[] || [];
      const updatedStructure = removeItemFromStructure(currentStructure, itemId);
      filesMap.set('structure', updatedStructure);
    });
    
    setContextMenu(null);
  };

  const removeItemFromStructure = (structure: FileItem[], itemId: string): FileItem[] => {
    return structure
      .filter(item => item.id !== itemId)
      .map(item => ({
        ...item,
        children: item.children ? removeItemFromStructure(item.children, itemId) : undefined
      }));
  };

  const getFileIcon = (fileName: string, type: 'file' | 'folder') => {
    if (type === 'folder') return 'folder';
    
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'html':
        return 'html';
      case 'css':
        return 'css';
      case 'json':
        return 'json';
      case 'md':
        return 'markdown';
      case 'py':
        return 'python';
      case 'java':
        return 'java';
      case 'cpp':
      case 'c':
        return 'c';
      case 'xml':
        return 'xml';
      case 'sql':
        return 'database';
      default:
        return 'file';
    }
  };

  const handleRightClick = (e: React.MouseEvent, itemId: string | null = null) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      itemId
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      finishCreating();
    } else if (e.key === 'Escape') {
      cancelCreating();
    }
  };

  const renderIcon = (iconType: string, isOpen: boolean = false) => {
    const iconMap = {
      folder: isOpen ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z" fill="#dcb67a"/>
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z" fill="#dcb67a"/>
        </svg>
      ),
      javascript: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <rect width="24" height="24" fill="#f7df1e"/>
          <path d="M7.5 15.2c.3.4.8.6 1.3.6.7 0 1.2-.3 1.2-1.2v-6.6h-1.5v6.5c0 .3-.1.4-.3.4s-.3-.1-.4-.3l-1.3.6zm4.6-.1c.4.6 1 1 1.9 1 .8 0 1.4-.4 1.4-1 0-.6-.4-.9-1.2-1.2l-.4-.2c-1.2-.5-2-1.1-2-2.4 0-1.2.9-2.1 2.3-2.1.7 0 1.2.2 1.6.8l-1 .6c-.2-.4-.5-.5-.8-.5-.4 0-.6.2-.6.5 0 .4.2.5 1 .9l.4.2c1.4.6 2.2 1.2 2.2 2.5 0 1.4-1.1 2.2-2.6 2.2-1.5 0-2.4-.7-2.9-1.6l1.1-.7z" fill="#323330"/>
        </svg>
      ),
      typescript: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <rect width="24" height="24" fill="#3178c6"/>
          <path d="M13.5 12v8h-1.5v-8h-3v-1.5h7.5v1.5h-3zm4.5-1.5h1.5v1.2c.3-.4.7-.7 1.2-.9.5-.2 1-.3 1.5-.3.8 0 1.4.2 1.9.6.5.4.7 1 .7 1.8v6.1h-1.5v-5.7c0-.5-.1-.9-.4-1.1-.3-.2-.7-.3-1.2-.3-.6 0-1.1.2-1.4.6-.3.4-.5.9-.5 1.5v5h-1.5v-7.5z" fill="white"/>
        </svg>
      ),
      html: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M2 2v20l10 2 10-2V2H2zm17.5 18.5L12 21.2l-7.5-1.2V3.5h15v15z" fill="#e34f26"/>
          <path d="M6 6h12v1.5H7.5V9H17v1.5H7.5V12H18v1.5H6V6z" fill="white"/>
        </svg>
      ),
      css: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M2 2v20l10 2 10-2V2H2zm17.5 18.5L12 21.2l-7.5-1.2V3.5h15v15z" fill="#1572b6"/>
          <path d="M6 8h12v2H8v2h8v2H8v2h10v2H6V8z" fill="white"/>
        </svg>
      ),
      json: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <rect width="24" height="24" fill="#292929"/>
          <path d="M5 3v18l2-1V4h10v16l2 1V3H5z" fill="#f1c40f"/>
          <text x="12" y="14" textAnchor="middle" fontSize="8" fill="white">{ }</text>
        </svg>
      ),
      python: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2c-2.2 0-4 1.8-4 4v2h4v1H6c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h2v-2c0-1.1.9-2 2-2h8c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-6zm-2 3c.6 0 1-.4 1-1s-.4-1-1-1-1 .4-1 1 .4 1 1 1z" fill="#3776ab"/>
          <path d="M12 22c2.2 0 4-1.8 4-4v-2h-4v-1h6c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2h-2v2c0 1.1-.9 2-2 2H6c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h6zm2-3c-.6 0-1 .4-1 1s.4 1 1 1 1-.4 1-1-.4-1-1-1z" fill="#ffde57"/>
        </svg>
      ),
      file: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" fill="#90a4ae"/>
        </svg>
      ),
      markdown: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <rect width="24" height="24" fill="#083fa1"/>
          <path d="M3 7h3l2 4 2-4h3v10h-2V9l-2 3-2-3v8H3V7zm15 0h2v4h2l-3 3-3-3h2V7z" fill="white"/>
        </svg>
      ),
      java: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <rect width="24" height="24" fill="#ed8b00"/>
          <path d="M8 2c-1 0-2 .5-2 1.5S7 5 8 5s2-.5 2-1.5S9 2 8 2zm8 0c-1 0-2 .5-2 1.5S15 5 16 5s2-.5 2-1.5S17 2 16 2zm-8 6c-2 0-4 1-4 3v6c0 2 2 3 4 3h8c2 0 4-1 4-3v-6c0-2-2-3-4-3H8z" fill="white"/>
        </svg>
      ),
      c: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <rect width="24" height="24" fill="#659ad2"/>
          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15c-2.8 0-5-2.2-5-5s2.2-5 5-5c1.5 0 2.8.7 3.7 1.7l-1.4 1.4c-.6-.6-1.4-1-2.3-1-1.7 0-3 1.3-3 3s1.3 3 3 3c.9 0 1.7-.4 2.3-1l1.4 1.4C12.8 16.3 11.5 17 10 17z" fill="white"/>
        </svg>
      ),
      xml: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <rect width="24" height="24" fill="#ff6600"/>
          <path d="M5 2v4l3 6-3 6v4h2l3-5 3 5h2v-4l-3-6 3-6V2h-2l-3 5L7 2H5z" fill="white"/>
        </svg>
      ),
      database: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <ellipse cx="12" cy="5" rx="8" ry="3" fill="#336791"/>
          <path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5" fill="#336791"/>
          <path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" fill="#336791"/>
        </svg>
      )
    };

    return iconMap[iconType as keyof typeof iconMap] || iconMap.file;
  };

  const renderFileTree = (items: FileItem[], level: number = 0) => {
    return items.map((item) => (
      <div key={item.id} className="file-tree-item">
        <div
          className={`file-row ${selectedFileId === item.id ? 'selected' : ''}`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => {
            if (item.type === 'folder') {
              toggleFolder(item.id);
            } else {
              onFileSelect(item);
            }
          }}
          onContextMenu={(e) => handleRightClick(e, item.id)}
        >
          <div className="file-content">
            {item.type === 'folder' && (
              <div 
                className={`folder-chevron ${expandedFolders.has(item.id) ? 'expanded' : ''}`}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z"/>
                </svg>
              </div>
            )}
            <div className="file-icon">
              {renderIcon(getFileIcon(item.name, item.type), item.type === 'folder' && expandedFolders.has(item.id))}
            </div>
            <span className="file-name">{item.name}</span>
          </div>
        </div>
        
        {item.type === 'folder' && 
         expandedFolders.has(item.id) && 
         item.children && 
         item.children.length > 0 && (
          <div className="folder-contents">
            {renderFileTree(item.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  const renderContextMenu = () => {
    if (!contextMenu) return null;

    return (
      <div 
        className="context-menu"
        style={{ 
          position: 'fixed',
          left: contextMenu.x,
          top: contextMenu.y,
          zIndex: 1000
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="context-menu-item" onClick={() => startCreating('file')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
          </svg>
          New File
        </div>
        <div className="context-menu-item" onClick={() => startCreating('folder')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V8C22,6.89 21.1,6 20,6H12L10,4Z"/>
          </svg>
          New Folder
        </div>
        {contextMenu.itemId && (
          <>
            <div className="context-menu-separator"></div>
            <div 
              className="context-menu-item danger" 
              onClick={() => contextMenu.itemId && deleteItem(contextMenu.itemId)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9,3V4H4V6H5V19A2,2 0 0,0 7,21H17A2,2 0 0,0 19,19V6H20V4H15V3H9M7,6H17V19H7V6M9,8V17H11V8H9M13,8V17H15V8H13Z"/>
              </svg>
              Delete
            </div>
          </>
        )}
      </div>
    );
  };

  const renderNewItemInput = () => {
    if (!isCreating) return null;

    return (
      <div className="new-item-container" style={{ paddingLeft: '24px' }}>
        <div className="new-item-row">
          <div className="file-icon">
            {renderIcon(isCreating.type === 'folder' ? 'folder' : 'file')}
          </div>
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={finishCreating}
            placeholder={`${isCreating.type === 'folder' ? 'Folder' : 'File'} name${isCreating.type === 'file' ? ' (with extension)' : ''}`}
            className="new-item-input"
            autoFocus
          />
        </div>
      </div>
    );
  };

  return (
    <div className="file-explorer">
      <div className="file-explorer-header">
        <div className="header-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V8C22,6.89 21.1,6 20,6H12L10,4Z"/>
          </svg>
          <span>Explorer</span>
        </div>
        <div className="header-actions">
          <button 
            className="header-btn" 
            onClick={() => startCreating('file')}
            title="New File"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
              <path d="M11,15H13V12H16V10H13V7H11V10H8V12H11V15Z" fill="#007ACC"/>
            </svg>
          </button>
          <button 
            className="header-btn" 
            onClick={() => startCreating('folder')}
            title="New Folder"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V8C22,6.89 21.1,6 20,6H12L10,4Z"/>
              <path d="M11,15H13V12H16V10H13V7H11V10H8V12H11V15Z" fill="#007ACC"/>
            </svg>
          </button>
        </div>
      </div>
      
      <div 
        className="file-tree-container"
        onContextMenu={(e) => handleRightClick(e)}
      >
        {files.length === 0 && !isCreating ? (
          <div className="empty-explorer">
            <div className="empty-content">
              <div className="empty-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V8C22,6.89 21.1,6 20,6H12L10,4Z"/>
                </svg>
              </div>
              <h4>No files yet</h4>
              <p>Create your first file or folder to get started with collaborative coding</p>
              <div className="empty-actions">
                <button 
                  className="empty-btn primary" 
                  onClick={() => startCreating('file')}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                  </svg>
                  New File
                </button>
                <button 
                  className="empty-btn secondary" 
                  onClick={() => startCreating('folder')}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M10,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V8C22,6.89 21.1,6 20,6H12L10,4Z"/>
                  </svg>
                  New Folder
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="file-tree">
            {renderFileTree(files)}
            {renderNewItemInput()}
          </div>
        )}
      </div>

      {renderContextMenu()}

      <style>{`
        .file-explorer {
          width: 280px;
          height: 100%;
          background: #252526;
          border-right: 1px solid #3e3e42;
          display: flex;
          flex-direction: column;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          user-select: none;
        }

        .file-explorer-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: #2d2d30;
          border-bottom: 1px solid #3e3e42;
          min-height: 35px;
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #cccccc;
        }

        .header-actions {
          display: flex;
          gap: 2px;
        }

        .header-btn {
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
          transition: background-color 0.2s ease;
        }

        .header-btn:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .file-tree-container {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
        }

        .file-tree {
          padding: 4px 0;
        }

        .file-tree-item {
          position: relative;
        }

        .file-row {
          display: flex;
          align-items: center;
          min-height: 22px;
          cursor: pointer;
          color: #cccccc;
          transition: background-color 0.2s ease;
          border-radius: 0;
        }

        .file-row:hover {
          background: #2a2d2e;
        }

        .file-row.selected {
          background: #094771;
          color: #ffffff;
        }

        .file-content {
          display: flex;
          align-items: center;
          gap: 4px;
          flex: 1;
          min-width: 0;
        }

        .folder-chevron {
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #cccccc;
          transition: transform 0.15s ease;
          flex-shrink: 0;
        }

        .folder-chevron.expanded {
          transform: rotate(90deg);
        }

        .file-icon {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 16px;
          height: 16px;
        }

        .file-name {
          font-size: 13px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex: 1;
        }

        .folder-contents {
          position: relative;
        }

        .folder-contents::before {
          content: '';
          position: absolute;
          left: 12px;
          top: 0;
          bottom: 0;
          width: 1px;
          background: #3e3e42;
        }

        /* Empty Explorer */
        .empty-explorer {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }

        .empty-content {
          text-align: center;
          color: #969696;
          max-width: 240px;
        }

        .empty-icon {
          margin-bottom: 16px;
          opacity: 0.6;
          color: #dcb67a;
        }

        .empty-content h4 {
          margin: 0 0 8px 0;
          font-size: 16px;
          font-weight: 600;
          color: #cccccc;
        }

        .empty-content p {
          margin: 0 0 20px 0;
          font-size: 13px;
          line-height: 1.4;
          color: #969696;
        }

        .empty-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .empty-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 12px;
          border: none;
          border-radius: 3px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .empty-btn.primary {
          background: #0078d4;
          color: white;
        }

        .empty-btn.primary:hover {
          background: #106ebe;
        }

        .empty-btn.secondary {
          background: transparent;
          color: #cccccc;
          border: 1px solid #3e3e42;
        }

        .empty-btn.secondary:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: #007acc;
        }

        /* New Item Input */
        .new-item-container {
          padding: 2px 0;
        }

        .new-item-row {
          display: flex;
          align-items: center;
          gap: 4px;
          min-height: 22px;
          background: #2a2d2e;
        }

        .new-item-input {
          flex: 1;
          background: #3c3c3c;
          border: 1px solid #007acc;
          color: #cccccc;
          font-size: 13px;
          padding: 2px 6px;
          border-radius: 2px;
          outline: none;
          font-family: inherit;
        }

        .new-item-input::placeholder {
          color: #969696;
          font-style: italic;
        }

        /* Context Menu */
        .context-menu {
          background: #3c3c3c;
          border: 1px solid #5a5a5a;
          border-radius: 3px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
          min-width: 160px;
          padding: 4px 0;
          font-size: 13px;
        }

        .context-menu-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          color: #cccccc;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .context-menu-item:hover {
          background: #094771;
        }

        .context-menu-item.danger {
          color: #f48771;
        }

        .context-menu-item.danger:hover {
          background: rgba(244, 135, 113, 0.2);
        }

        .context-menu-separator {
          height: 1px;
          background: #5a5a5a;
          margin: 4px 0;
        }

        /* Scrollbar */
        .file-tree-container::-webkit-scrollbar {
          width: 8px;
        }

        .file-tree-container::-webkit-scrollbar-track {
          background: #252526;
        }

        .file-tree-container::-webkit-scrollbar-thumb {
          background: #424242;
          border-radius: 4px;
        }

        .file-tree-container::-webkit-scrollbar-thumb:hover {
          background: #4f4f4f;
        }

        /* Responsive Design */
        @media (max-width: 900px) {
          .file-explorer {
            width: 240px;
          }
          
          .empty-content {
            max-width: 200px;
          }
        }

        @media (max-width: 768px) {
          .file-explorer {
            width: 200px;
          }
          
          .file-name {
            font-size: 12px;
          }
          
          .header-title span {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default FileExplorer;