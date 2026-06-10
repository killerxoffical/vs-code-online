import React, { useState, useEffect, useRef, useMemo, FormEvent, DragEvent, ChangeEvent, SVGProps } from "react";
import { 
  FileCode, Folder, Search, Share2, Users, History, Sliders, Lock, Unlock, 
  Wifi, WifiOff, Terminal, Plus, Trash2, Upload, Download, RefreshCw, Play, 
  Check, AlertTriangle, Menu, X, FileCode2, Clipboard, Globe, FileText, 
  Layers, ChevronRight, Eye, Edit2, Info, Moon, Laptop, EyeOff
} from "lucide-react";
import { encryptPayload, decryptPayload } from "./utils/crypto";
import { FileItem, Activity, RoomUser, ConflictDetails } from "./types";

export default function App() {
  // Connection and Room States
  const [inRoom, setInRoom] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [joinRoomId, setJoinRoomId] = useState("");
  const [roomPassword, setRoomPassword] = useState("");
  const [userName, setUserName] = useState("");
  const [userId] = useState(() => "user_" + Math.random().toString(36).substring(2, 9));
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [creatingRoom, setCreatingRoom] = useState(false);

  // WebSocket and Network States
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false); // simulated offline state
  const [offlineChanges, setOfflineChanges] = useState<Record<string, { content: string; time: number }>>({});

  // Active Workspace States
  const [files, setFiles] = useState<Record<string, FileItem>>({});
  const [activeTab, setActiveTab] = useState<string>("index.html");
  const [openTabs, setOpenTabs] = useState<string[]>(["index.html"]);
  const [usersList, setUsersList] = useState<RoomUser[]>([]);
  const [activityLog, setActivityLog] = useState<Activity[]>([]);
  
  // Local active editor contents
  const [editorContent, setEditorContent] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Finder & Sidebar States
  const [sidebarTab, setSidebarTab] = useState<"explorer" | "search" | "users" | "activity" | "simulator">("explorer");
  const [newFileName, setNewFileName] = useState("");
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [replaceQuery, setReplaceQuery] = useState("");
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Drag & drop / upload states
  const [dragActive, setDragActive] = useState(false);
  const [pcBridgePath, setPcBridgePath] = useState("");
  
  // Custom context menu state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; path: string } | null>(null);

  // Conflict Resolution States
  const [conflict, setConflict] = useState<ConflictDetails | null>(null);

  // Simulated opponents (for single-user demoing)
  const [isSimulatedOpponentJoined, setIsSimulatedOpponentJoined] = useState(false);
  const [opponentLatency, setOpponentLatency] = useState(150);

  // Logs / Toasts Notifications
  const [toasts, setToasts] = useState<Array<{ id: string; text: string; type: "success" | "info" | "warning" }>>([]);

  // Refs for tracking editing states
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const wsUrl = useRef("");

  // Toast adder helper
  const addToast = (text: string, type: "success" | "info" | "warning" = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Sync state with editor when file changes
  useEffect(() => {
    if (files[activeTab]) {
      setEditorContent(files[activeTab].content);
      setHasUnsavedChanges(false);
    }
  }, [activeTab, files]);

  // Derive WebSocket Host path dynamically
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    wsUrl.current = `${protocol}//${host}/ws`;
    
    // Auto-generate random screen name
    const adjectives = ["Pixel", "Code", "Binary", "Quantum", "Shadow", "Logic", "Cyber", "Syntax", "Git"];
    const nouns = ["Hacker", "Opponent", "Dev", "Coder", "Architect", "Engine", "Comp", "Ninja", "Wizard"];
    const randomName = `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]}`;
    setUserName(randomName);
  }, []);

  // Web Socket Connection Initiator
  const connectToSocket = (roomCode: string, pword: string, userNameInput: string) => {
    if (isOfflineMode) return;

    const ws = new WebSocket(wsUrl.current);
    
    ws.onopen = () => {
      setIsConnected(true);
      // Join Room payload
      const payload = {
        type: "join",
        roomId: roomCode,
        password: pword,
        userId,
        userName: userNameInput
      };
      ws.send(JSON.stringify(payload));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case "room_snapshot": {
            // Decrypt contents of files if required
            const decryptedFiles: Record<string, FileItem> = {};
            Object.entries(data.files).forEach(([path, file]: [string, any]) => {
              decryptedFiles[path] = {
                ...file,
                content: decryptPayload(file.content, pword),
                history: file.history.map((h: any) => ({
                  ...h,
                  content: decryptPayload(h.content, pword)
                }))
              };
            });

            setFiles(decryptedFiles);
            setUsersList(data.users);
            setActivityLog(data.activityLog);
            setRoomId(data.roomId);
            setInRoom(true);
            
            // Set active index tab if available
            const paths = Object.keys(decryptedFiles);
            if (paths.length > 0) {
              setOpenTabs(paths.slice(0, 4));
              if (paths.includes("index.html")) {
                setActiveTab("index.html");
              } else {
                setActiveTab(paths[0]);
              }
            }
            addToast(`Successfully entered collaborative sandbox Room ${data.roomId}`, "success");
            break;
          }

          case "user_joined": {
            setUsersList(data.users);
            setActivityLog(prev => [...prev, data.activity]);
            addToast(`${data.userName} entered the room`, "info");
            break;
          }

          case "user_left": {
            setUsersList(data.users);
            addToast(`${data.users.find((u: any) => u.id === data.userId)?.name || "Opponent"} has disconnected`, "warning");
            break;
          }

          case "file_update": {
            const updatedFile: FileItem = {
              ...data.file,
              content: decryptPayload(data.file.content, pword),
              history: data.file.history.map((h: any) => ({
                ...h,
                content: decryptPayload(h.content, pword)
              }))
            };

            setFiles(prev => ({
              ...prev,
              [updatedFile.path]: updatedFile
            }));

            // If active tab is the updated file and they weren't editing, update editorContent
            if (activeTab === updatedFile.path) {
              setEditorContent(updatedFile.content);
              setHasUnsavedChanges(false);
            }

            if (data.activity) {
              setActivityLog(prev => [...prev, data.activity]);
            }
            addToast(`File ${updatedFile.name} was updated by ${updatedFile.updatedBy}`, "success");
            break;
          }

          case "lock_status": {
            setFiles(prev => {
              if (!prev[data.path]) return prev;
              return {
                ...prev,
                [data.path]: {
                  ...prev[data.path],
                  lockedBy: data.lockedBy,
                  lockedByName: data.lockedByName
                }
              };
            });
            break;
          }

          case "conflict_detected": {
            const conflictInfo: ConflictDetails = {
              path: data.path,
              serverVersion: data.serverVersion,
              serverContent: decryptPayload(data.serverContent, pword),
              serverUpdatedBy: data.serverUpdatedBy,
              clientContent: data.clientContent // already in plaintext
            };
            setConflict(conflictInfo);
            addToast(`Collision alert: Opponent saved changes to ${data.path} simultaneously.`, "warning");
            break;
          }

          case "file_create": {
            const newFile: FileItem = {
              ...data.file,
              content: decryptPayload(data.file.content, pword),
              history: data.file.history.map((h: any) => ({
                ...h,
                content: decryptPayload(h.content, pword)
              }))
            };
            setFiles(prev => ({
              ...prev,
              [newFile.path]: newFile
            }));
            if (data.activity) {
              setActivityLog(prev => [...prev, data.activity]);
            }
            addToast(`New file created: ${newFile.name}`, "success");
            break;
          }

          case "file_delete": {
            setFiles(prev => {
              const current = { ...prev };
              delete current[data.path];
              return current;
            });
            setOpenTabs(prev => prev.filter(t => t !== data.path));
            if (activeTab === data.path) {
              setActiveTab(openTabs.find(t => t !== data.path) || "");
            }
            if (data.activity) {
              setActivityLog(prev => [...prev, data.activity]);
            }
            addToast(`File was deleted: ${data.path}`, "warning");
            break;
          }

          case "error": {
            addToast(data.message, "warning");
            break;
          }
        }
      } catch (err) {
        console.error("Failed to parse WebSocket incoming message", err);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      setSocket(null);
    };

    ws.onerror = (err) => {
      console.error("WebSocket connection failure", err);
      setIsConnected(false);
    };

    setSocket(ws);
  };

  // Close connection helper
  const disconnectSocket = () => {
    if (socket) {
      socket.close();
      setSocket(null);
    }
    setIsConnected(false);
  };

  // Room Creator handler
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingRoom(true);

    try {
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: roomPassword || undefined })
      });
      const data = await response.json();
      
      setRoomId(data.roomId);
      connectToSocket(data.roomId, roomPassword, userName);
    } catch (err) {
      addToast("Network Error: Could not generate a room instance", "warning");
    } finally {
      setCreatingRoom(false);
    }
  };

  // Join existing room handler
  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinRoomId) {
      addToast("Please specify a target Room ID first", "warning");
      return;
    }

    try {
      const response = await fetch("/api/rooms/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: joinRoomId.trim().toUpperCase(), password: roomPassword || undefined })
      });
      const data = await response.json();

      if (data.success) {
        connectToSocket(data.roomId, roomPassword, userName);
      } else {
        addToast(data.message || "Could not join. Please audit credentials.", "warning");
      }
    } catch (err) {
      addToast("Error communicating with server", "warning");
    }
  };

  // Triggers real-time typing / locking indicator back to opponents
  const handleEditorInput = (val: string) => {
    setEditorContent(val);
    setHasUnsavedChanges(true);

    // Track state offline if applicable
    if (isOfflineMode) {
      setOfflineChanges(prev => ({
        ...prev,
        [activeTab]: { content: val, time: Date.now() }
      }));
      return;
    }

    // Send typing lock signal to socket once in a while
    if (socket && isConnected && files[activeTab]) {
      if (!files[activeTab].lockedBy) {
        socket.send(JSON.stringify({
          type: "lock_file",
          path: activeTab,
          isLocked: true,
          userName
        }));
      }
    }
  };

  // Save & Upload (Commits to room state)
  const saveAndUploadFile = (filePath: string, customContent?: string) => {
    const finalContent = customContent !== undefined ? customContent : editorContent;
    const file = files[filePath];
    if (!file) return;

    if (isOfflineMode) {
      setOfflineChanges(prev => ({
        ...prev,
        [filePath]: { content: finalContent, time: Date.now() }
      }));
      setFiles(prev => ({
        ...prev,
        [filePath]: {
          ...prev[filePath],
          content: finalContent,
          updatedBy: `${userName} (Offline)`,
          updatedAt: Date.now()
        }
      }));
      setHasUnsavedChanges(false);
      addToast(`Changes saved locally (Offline mode). Will synchronize once online.`, "info");
      return;
    }

    if (socket && isConnected) {
      // Encrypt code content if password is set
      const encryptedCodeContent = encryptPayload(finalContent, roomPassword);
      
      socket.send(JSON.stringify({
        type: "update_file",
        path: filePath,
        content: encryptedCodeContent,
        version: file.version,
        userName
      }));
      
      setHasUnsavedChanges(false);
      addToast(`Save & Upload initiated for ${file.name}. Synchronized successfully.`, "success");
    } else {
      addToast("Network connection missing, saving to offline cache.", "warning");
      setOfflineChanges(prev => ({
        ...prev,
        [filePath]: { content: finalContent, time: Date.now() }
      }));
    }
  };

  // Right-click Save and Upload trigger wrapper
  const handleSaveAndUpload = (filePath: string) => {
    const backupContent = filePath === activeTab ? editorContent : files[filePath]?.content;
    saveAndUploadFile(filePath, backupContent);
    setContextMenu(null);
  };

  // Force Save / Overwrites immediately (Conflict override resolution option)
  const forceSaveAndUploadFile = (filePath: string, forcedContent: string) => {
    if (socket && isConnected) {
      const encryptedContent = encryptPayload(forcedContent, roomPassword);
      socket.send(JSON.stringify({
        type: "force_update_file",
        path: filePath,
        content: encryptedContent,
        userName
      }));
      setConflict(null);
      addToast("Successfully resolved conflict. File overwritten with your changes.", "success");
    }
  };

  // Create new blank file
  const handleCreateNewFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    const path = newFileName.trim();
    if (files[path]) {
      addToast("File name collision: a file with this name already exists.", "warning");
      return;
    }

    if (isOfflineMode) {
      // Offline file creation support
      const mockFile: FileItem = {
        id: path,
        name: path,
        path: path,
        content: "",
        language: path.split(".").pop() || "plaintext",
        updatedAt: Date.now(),
        updatedBy: userName,
        version: 1,
        history: [{ version: 1, content: "", updatedAt: Date.now(), updatedBy: userName }]
      };
      setFiles(prev => ({ ...prev, [path]: mockFile }));
      setOpenTabs(prev => [...prev, path]);
      setActiveTab(path);
      setShowNewFileModal(false);
      setNewFileName("");
      addToast("New file cached locally (Offline mode).", "info");
      return;
    }

    if (socket && isConnected) {
      socket.send(JSON.stringify({
        type: "create_file",
        path,
        name: path,
        content: encryptPayload("", roomPassword),
        userName
      }));

      setOpenTabs(prev => {
        if (prev.includes(path)) return prev;
        return [...prev, path];
      });
      setActiveTab(path);
      setShowNewFileModal(false);
      setNewFileName("");
    }
  };

  // Delete file trigger
  const handleDeleteFile = (filePath: string) => {
    if (isOfflineMode) {
      setFiles(prev => {
        const c = { ...prev };
        delete c[filePath];
        return c;
      });
      setOpenTabs(p => p.filter(t => t !== filePath));
      if (activeTab === filePath) setActiveTab("");
      addToast("Deleted file inside local cache", "warning");
      setContextMenu(null);
      return;
    }

    if (socket && isConnected) {
      socket.send(JSON.stringify({
        type: "delete_file",
        path: filePath,
        userName
      }));
      setContextMenu(null);
    }
  };

  // Rollback file to previous version revision
  const handleRollback = (filePath: string, versionNum: number) => {
    if (isOfflineMode) {
      addToast("Offline Mode Error: Cannot fetch historical version records from server during outage.", "warning");
      return;
    }

    if (socket && isConnected) {
      socket.send(JSON.stringify({
        type: "rollback_file",
        path: filePath,
        version: versionNum,
        userName
      }));
      addToast(`Rolled back ${filePath} to version ${versionNum}`, "success");
    }
  };

  // PC File Path Bridge (Fetches mock / browser simulated file path in real time)
  const handleFetchPcBridgeFile = () => {
    if (!pcBridgePath.trim()) {
      addToast("Specify an absolute local path e.g. /projects/sandbox/app.js", "warning");
      return;
    }

    // Extract file name
    const fileName = pcBridgePath.split(/[/\\]/).pop() || "bridge_file.txt";
    
    // Simulate reading real file contents dynamically based on user context
    const simulatedPathContents = `/**\n * Real-Time Bridge Synchronized file\n * Source Path: ${pcBridgePath}\n * Sync time: ${new Date().toLocaleTimeString()}\n */\n\nexport function runSyncCode() {\n  console.log("Collaborative synchronization active.");\n}\n`;

    // Create file inside workspace
    if (files[fileName]) {
      // Prompt user or simply merge it
      setEditorContent(simulatedPathContents);
      setHasUnsavedChanges(true);
      addToast(`Bridged path content loaded into active editor. Click Save & Upload to sync.`, "success");
    } else {
      // Create new file with that path
      if (isOfflineMode) {
        const mockF: FileItem = {
          id: fileName,
          name: fileName,
          path: fileName,
          content: simulatedPathContents,
          language: fileName.split(".").pop() || "plaintext",
          updatedAt: Date.now(),
          updatedBy: `${userName} (Bridged)`,
          version: 1,
          history: [{ version: 1, content: simulatedPathContents, updatedAt: Date.now(), updatedBy: userName }]
        };
        setFiles(prev => ({ ...prev, [fileName]: mockF }));
        setOpenTabs(p => [...p, fileName]);
        setActiveTab(fileName);
      } else if (socket && isConnected) {
        socket.send(JSON.stringify({
          type: "create_file",
          path: fileName,
          name: fileName,
          content: encryptPayload(simulatedPathContents, roomPassword),
          userName: `${userName} (Bridged)`
        }));
        setOpenTabs(p => [...p, fileName]);
        setActiveTab(fileName);
      }
      addToast(`Bridged path '${fileName}' imported into system.`, "success");
    }
  };

  // Drag and drop handler
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Drop real system files directly into finder
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFiles = Array.from(e.dataTransfer.files) as File[];
      for (const file of droppedFiles) {
        const text = await file.text();
        const pathName = file.name;

        // Either overwrite or create new file
        if (files[pathName]) {
          setEditorContent(text);
          setHasUnsavedChanges(true);
          setActiveTab(pathName);
          addToast(`Imported ${file.name} content into active tab.`, "info");
        } else {
          // Create file over WS
          if (socket && isConnected) {
            socket.send(JSON.stringify({
              type: "create_file",
              path: pathName,
              name: file.name,
              content: encryptPayload(text, roomPassword),
              userName: `${userName} (Uploaded)`
            }));
          } else {
            // Local file setup
            const mockF: FileItem = {
              id: pathName,
              name: file.name,
              path: pathName,
              content: text,
              language: file.name.split(".").pop() || "plaintext",
              updatedAt: Date.now(),
              updatedBy: `${userName} (Uploaded)`,
              version: 1,
              history: [{ version: 1, content: text, updatedAt: Date.now(), updatedBy: userName }]
            };
            setFiles(prev => ({ ...prev, [pathName]: mockF }));
          }
          setOpenTabs(p => [...p, pathName]);
          setActiveTab(pathName);
          addToast(`Dropped & added file: ${file.name}`, "success");
        }
      }
    }
  };

  // Handles manual file element select input
  const handleFileSelectElement = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0] as File;
      const text = await file.text();
      const pathName = file.name;

      if (files[pathName]) {
        setEditorContent(text);
        setHasUnsavedChanges(true);
        setActiveTab(pathName);
        addToast(`Imported ${file.name} to editor.`, "info");
      } else {
        if (socket && isConnected) {
          socket.send(JSON.stringify({
            type: "create_file",
            path: pathName,
            name: file.name,
            content: encryptPayload(text, roomPassword),
            userName: `${userName} (Uploaded)`
          }));
        } else {
          const mockF: FileItem = {
            id: pathName,
            name: file.name,
            path: pathName,
            content: text,
            language: file.name.split(".").pop() || "plaintext",
            updatedAt: Date.now(),
            updatedBy: userName,
            version: 1,
            history: [{ version: 1, content: text, updatedAt: Date.now(), updatedBy: userName }]
          };
          setFiles(prev => ({ ...prev, [pathName]: mockF }));
        }
        setOpenTabs(p => [...p, pathName]);
        setActiveTab(pathName);
        addToast(`Uploaded file: ${file.name}`, "success");
      }
    }
  };

  // Simulated latency timing simulation handler
  const toggleOfflineMode = () => {
    if (!isOfflineMode) {
      // Toggle offline: drop connection
      disconnectSocket();
      setIsOfflineMode(true);
      addToast("Network simulator: disconnected! Operating in offline local storage mode.", "warning");
    } else {
      // Toggle back to online: attempt to reconnect and merge cached items
      setIsOfflineMode(false);
      addToast("Network simulator: online restored! Reconnecting...", "success");
      connectToSocket(roomId, roomPassword, userName);
    }
  };

  // Perform full-text Search across files
  const searchMatches = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const results: Array<{ path: string; lineNum: number; text: string }> = [];

    (Object.entries(files) as Array<[string, FileItem]>).forEach(([path, file]) => {
      const lines = file.content.split("\n");
      lines.forEach((lineText, idx) => {
        if (lineText.toLowerCase().includes(searchQuery.toLowerCase())) {
          results.push({
            path,
            lineNum: idx + 1,
            text: lineText.trim()
          });
        }
      });
    });

    return results;
  }, [searchQuery, files]);

  // Execute Replace action in active file or all files
  const handleReplace = (allFiles: boolean = false) => {
    if (!searchQuery) return;

    if (allFiles) {
      const updatedFiles = { ...files };
      let replaceCount = 0;

      Object.keys(updatedFiles).forEach(path => {
        const originalContent = updatedFiles[path].content;
        // Search regex pattern
        const regex = new RegExp(searchQuery.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi');
        const count = (originalContent.match(regex) || []).length;
        if (count > 0) {
          const newContent = originalContent.replace(regex, replaceQuery);
          replaceCount += count;
          updatedFiles[path].content = newContent;
          saveAndUploadFile(path, newContent);
        }
      });

      setFiles(updatedFiles);
      if (files[activeTab]) {
        setEditorContent(files[activeTab].content);
      }
      addToast(`Replaced ${replaceCount} matches across workspace files`, "success");
    } else {
      // Only active file replacement
      const currentContent = editorContent;
      const regex = new RegExp(searchQuery.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi');
      const count = (currentContent.match(regex) || []).length;
      if (count > 0) {
        const newContent = currentContent.replace(regex, replaceQuery);
        setEditorContent(newContent);
        setHasUnsavedChanges(true);
        addToast(`Replaced ${count} matches inside ${activeTab}`, "success");
      } else {
        addToast("No matching text pattern found to replace", "warning");
      }
    }
  };

  // Context Menu listener helper custom setup
  const showContextMenu = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      path
    });
  };

  // Hide context dropdown on generic document click
  useEffect(() => {
    const hide = () => setContextMenu(null);
    document.addEventListener("click", hide);
    return () => document.removeEventListener("click", hide);
  }, []);

  // Conflict Resolution Action Picks
  const resolveConflictWithLocal = () => {
    if (conflict) {
      forceSaveAndUploadFile(conflict.path, conflict.clientContent);
    }
  };

  const resolveConflictWithServer = () => {
    if (conflict) {
      setEditorContent(conflict.serverContent);
      setHasUnsavedChanges(false);
      setConflict(null);
      addToast("Discarded your local edits and kept the Server's Opponent version.", "info");
    }
  };

  const resolveWithSmartMerge = () => {
    if (!conflict) return;
    
    // Simple Smart line-by-line Diff merge algorithm
    const serverLines = conflict.serverContent.split("\n");
    const localLines = conflict.clientContent.split("\n");
    const mergedLines: string[] = [];

    const maxLines = Math.max(serverLines.length, localLines.length);
    for (let i = 0; i < maxLines; i++) {
      const serverLine = serverLines[i];
      const localLine = localLines[i];

      if (serverLine === localLine) {
        if (serverLine !== undefined) mergedLines.push(serverLine);
      } else {
        // Simple conflict marker resolution block
        if (serverLine !== undefined && localLine !== undefined) {
          mergedLines.push(`<<<<<<< CLIENT SAVE`);
          mergedLines.push(localLine);
          mergedLines.push(`=======`);
          mergedLines.push(serverLine);
          mergedLines.push(`>>>>>>> OPPONENT SERVER SAVE`);
        } else if (localLine !== undefined) {
          mergedLines.push(localLine);
        } else if (serverLine !== undefined) {
          mergedLines.push(serverLine);
        }
      }
    }

    const mergedContent = mergedLines.join("\n");
    setEditorContent(mergedContent);
    setHasUnsavedChanges(true);
    setConflict(null);
    addToast("Merged changes line-by-line. Review code for conflict markers.", "info");
  };

  // Simulated Opponent (Automates edits to test real-time collaboration features singly)
  const toggleOpponentSimulator = () => {
    if (isSimulatedOpponentJoined) {
      setIsSimulatedOpponentJoined(false);
      setUsersList(prev => prev.filter(u => u.id !== "opp_sim_99"));
      addToast("Virtual opponent disconnected.", "info");
    } else {
      setIsSimulatedOpponentJoined(true);
      const mockOppUser: RoomUser = {
        id: "opp_sim_99",
        name: "MockOpponent Bot-X",
        isOnline: true
      };
      setUsersList(prev => [...prev, mockOppUser]);
      addToast("Virtual opponent Bot-X joined. Look inside Settings tab to simulate edits!", "success");
    }
  };

  const triggerMockOpponentEdit = () => {
    if (!isSimulatedOpponentJoined) {
      addToast("Please connect the simulated opponent bot first!", "warning");
      return;
    }

    const targetFile = activeTab;
    const file = files[targetFile];
    if (!file) return;

    // Simulate an edit on currently active edit tab
    setTimeout(() => {
      // Modify file mock content values directly to simulate a real collision
      const mockIncomingContent = file.content + `\n\n// Simulated Opponent Bot modification code at ${new Date().toLocaleTimeString()}`;
      
      const nextVersion = file.version + 1;
      const updatedMockHistory = [
        ...file.history,
        { version: nextVersion, content: mockIncomingContent, updatedAt: Date.now(), updatedBy: "MockOpponent Bot-X" }
      ];

      const simulatedUpdatedFile: FileItem = {
        ...file,
        content: mockIncomingContent,
        version: nextVersion,
        history: updatedMockHistory,
        updatedBy: "MockOpponent Bot-X",
        updatedAt: Date.now()
      };

      // Set state locally as if socket packet arrived
      setFiles(prev => ({
        ...prev,
        [targetFile]: simulatedUpdatedFile
      }));

      // Fire activity log
      const logItem: Activity = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: Date.now(),
        userId: "opp_sim_99",
        userName: "MockOpponent Bot-X",
        type: "edit",
        fileName: file.name,
        details: `Simulated bot modification on ${file.name} to v${nextVersion}`
      };
      setActivityLog(prev => [...prev, logItem]);
      addToast(`Real-Time Update: Simulated opposing Dev has committed edits to '${file.name}'`, "warning");

    }, opponentLatency);
  };

  // Trigger manual collision (Conflict)
  const triggerMockCollision = () => {
    if (!isSimulatedOpponentJoined) {
      addToast("Please connect the simulated opponent bot first!", "warning");
      return;
    }
    const targetFile = activeTab;
    const file = files[targetFile];
    if (!file) return;

    // Simulate opponent making a different save on direct version mismatch
    const conflictInfo: ConflictDetails = {
      path: targetFile,
      serverVersion: file.version + 1,
      serverContent: file.content + "\n// Opponent code line edit while you were typing...",
      serverUpdatedBy: "MockOpponent Bot-X",
      clientContent: editorContent + "\n// Your custom unsaved line edits done here..."
    };
    setConflict(conflictInfo);
    addToast("Mock Conflict triggered: Side-by-side resolution screen visual activated.", "warning");
  };

  // Helper to copy Room Link
  const copyRoomLink = () => {
    const shareUrl = `${window.location.origin}/?join=${roomId}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
    addToast("Collaborative room link copied to dashboard clipboard!", "success");
  };

  // Automatically parse invite link from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inviteRoom = params.get("join");
    if (inviteRoom) {
      setJoinRoomId(inviteRoom);
      addToast(`Found invitation to join Room: ${inviteRoom}`, "info");
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-300 font-sans flex flex-col antialiased select-none selection:bg-slate-700">
      
      {/* Toast Notification Stream Overlay */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map(toast => (
          <div 
            key={toast.id}
            className={`px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 backdrop-blur-md animate-fade-in pointer-events-auto border transition-all ${
              toast.type === "success" 
                ? "bg-emerald-950/90 border-emerald-500/30 text-emerald-300"
                : toast.type === "warning"
                ? "bg-amber-950/90 border-amber-500/30 text-amber-300"
                : "bg-slate-900/95 border-sky-500/30 text-sky-300"
            }`}
          >
            {toast.type === "success" && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toast.type === "warning" && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
            {toast.type === "info" && <Info className="w-4 h-4 text-sky-400 shrink-0" />}
            <span className="text-sm font-medium">{toast.text}</span>
          </div>
        ))}
      </div>

      {/* 1. ROOM LOGON / WELCOME OVERLAY SCREEN */}
      {!inRoom ? (
        <div className="flex-1 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden bg-[#0F172A]">
          
          {/* Geometric decorative elements instead of loud gradient globs */}
          <div className="absolute top-10 left-10 w-40 h-40 border border-slate-800/40 rotate-12 pointer-events-none"></div>
          <div className="absolute bottom-20 right-20 w-60 h-60 border border-slate-800/30 -rotate-45 pointer-events-none rounded-full"></div>
          <div className="absolute top-1/3 right-10 w-20 h-20 border border-slate-800/20 rotate-45 pointer-events-none"></div>

          <div className="w-full max-w-lg">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded text-xs text-indigo-400 font-mono mb-4">
                <Globe className="w-3.5 h-3.5" />
                Live Peer-To-Peer Code Workspace
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-white font-sans">
                SYNCHRONI
              </h1>
              <p className="text-slate-400 mt-2 text-sm max-w-sm mx-auto">
                Real-time synchronized editor environment with side-by-side conflict merging and client encryption.
              </p>
            </div>

            <div className="bg-[#1E293B] border border-slate-800 rounded shadow-2xl p-6 md:p-8 relative">
              <div className="flex border-b border-slate-800 pb-4 mb-6">
                <button 
                  onClick={() => setCreatingRoom(false)}
                  className={`flex-1 pb-2 text-center text-sm font-bold uppercase tracking-wider transition-colors border-b-2 font-mono ${!creatingRoom ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                >
                  Join Room
                </button>
                <button 
                  onClick={() => setCreatingRoom(true)}
                  className={`flex-1 pb-2 text-center text-sm font-bold uppercase tracking-wider transition-colors border-b-2 font-mono ${creatingRoom ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                >
                  Create Room
                </button>
              </div>

              {creatingRoom ? (
                // CREATE ROOM SCREEN FORM
                <form onSubmit={handleCreateRoom} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 font-mono">
                      Your Pseudonym Nickname
                    </label>
                    <input 
                      type="text"
                      required
                      value={userName}
                      onChange={e => setUserName(e.target.value)}
                      placeholder="e.g. PixelHacker"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-4 py-3 text-white text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all font-mono"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono">
                        Security Password <span className="text-slate-500">(Optional)</span>
                      </label>
                      <span className="text-[10px] text-indigo-400 font-mono flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> E2E Crypto Active
                      </span>
                    </div>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"}
                        value={roomPassword}
                        onChange={e => setRoomPassword(e.target.value)}
                        placeholder="Leave blank for public unencrypted access"
                        className="w-full bg-slate-900 border border-slate-700 rounded px-4 py-3 text-white text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all pr-12 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      If provided, room code content packets will be dynamically encrypted client-side before transmission.
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-3 px-4 rounded transition-all flex items-center justify-center gap-2 mt-6 cursor-pointer uppercase tracking-wider font-mono border border-indigo-500/20 shadow-md shadow-indigo-950/20"
                  >
                    <Plus className="w-4 h-4" /> Create Collaborative Room
                  </button>
                </form>
              ) : (
                // JOIN ROOM SCREEN FORM
                <form onSubmit={handleJoinRoom} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 font-mono">
                      Your Pseudonym Nickname
                    </label>
                    <input 
                      type="text"
                      required
                      value={userName}
                      onChange={e => setUserName(e.target.value)}
                      placeholder="e.g. CodeOpponent"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-4 py-3 text-white text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-1">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 font-mono">
                        Room ID
                      </label>
                      <input 
                        type="text"
                        required
                        maxLength={5}
                        value={joinRoomId}
                        onChange={e => setJoinRoomId(e.target.value.toUpperCase())}
                        placeholder="ABCDE"
                        className="w-full bg-slate-900 border border-slate-700 rounded px-4 py-3 text-center text-white text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 font-mono tracking-wider transition-all"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 font-mono">
                        Password <span className="text-slate-500">(If set)</span>
                      </label>
                      <div className="relative">
                        <input 
                          type={showPassword ? "text" : "password"}
                          value={roomPassword}
                          onChange={e => setRoomPassword(e.target.value)}
                          placeholder="Room key access code"
                          className="w-full bg-slate-900 border border-slate-700 rounded px-4 py-3 text-white text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all pr-10 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-3 px-4 rounded transition-all flex items-center justify-center gap-2 mt-6 cursor-pointer uppercase tracking-wider font-mono border border-indigo-500/20 shadow-md shadow-indigo-950/20"
                  >
                    <Globe className="w-4 h-4 text-white" /> Enter Room Realtime
                  </button>
                </form>
              )}
            </div>

            <div className="mt-8 flex justify-center items-center gap-6 text-slate-500 text-xs font-mono">
              <span className="flex items-center gap-1.5"><Wifi className="w-3.5 h-3.5 text-emerald-500" /> WebSockets</span>
              <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-indigo-400" /> E2E Encryption</span>
              <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-indigo-400" /> Realtime Sync</span>
            </div>
          </div>
        </div>
      ) : (
        
        // 2. ACTIVE COLLABORATIVE WORKSPACE INTERFACE
        <div className="flex-1 flex flex-col min-h-0 relative">
          
          {/* HEADER BAR */}
          <header className="h-12 border-b border-slate-800 bg-[#1E293B] flex items-center justify-between px-4 z-10 shrink-0 select-none">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-indigo-500 rounded flex items-center justify-center shrink-0">
                  <div className="w-3 h-3 bg-white rotate-45"></div>
                </div>
                <span className="font-bold text-white tracking-tight text-sm">SYNCHRONI</span>
              </div>
              <div className="hidden md:flex items-center gap-1 px-3 py-1 bg-slate-900/50 rounded-md border border-slate-700/50">
                <span className="text-[10px] uppercase font-bold text-slate-500">Room</span>
                <span className="font-mono text-indigo-400 font-bold ml-2">{roomId}</span>
                <button 
                  onClick={copyRoomLink} 
                  title="Copy permanent room invites"
                  className="hover:text-white ml-1.5 transition-colors cursor-pointer"
                >
                  <Share2 className="w-3 h-3 text-slate-400 hover:text-indigo-400 transition-colors" />
                </button>
              </div>

              {roomPassword ? (
                <div className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-550/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold font-mono rounded-full uppercase tracking-wider">
                  <Lock className="w-2.5 h-2.5 text-emerald-400" /> E2E Crypto
                </div>
              ) : (
                <div className="inline-flex items-center gap-1 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold font-mono rounded-full uppercase tracking-wider">
                  <Unlock className="w-2.5 h-2.5" /> No Lock E2E
                </div>
              )}
            </div>

            {/* Connection and latency status lights */}
            <div className="flex items-center gap-4">
              {/* PC Bridge sync file quick indicator */}
              <div className="hidden lg:flex items-center gap-2 border-r border-slate-800 pr-3 mr-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold font-mono">PC File Bridge:</span>
                <div className="relative">
                  <input 
                    type="text"
                    value={pcBridgePath}
                    onChange={e => setPcBridgePath(e.target.value)}
                    placeholder="/local/filepath.txt"
                    className="bg-slate-900 border border-slate-700 text-slate-300 text-[11px] rounded px-2.5 py-1 w-44 outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 font-mono"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleFetchPcBridgeFile}
                  title="Simulate importing local system file index path"
                  className="bg-slate-800 hover:bg-slate-750 border border-slate-700 text-[11px] rounded px-2.5 py-1 text-slate-300 font-mono font-semibold uppercase tracking-wider cursor-pointer transition-colors"
                >
                  Fetch
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={toggleOfflineMode}
                  className={`px-3 py-1 rounded-full text-xs font-mono font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all text-white border cursor-pointer ${
                    isOfflineMode 
                      ? "bg-amber-500/10 hover:bg-amber-600/20 border-amber-550/20 text-amber-400" 
                      : "bg-emerald-500/10 hover:bg-emerald-600/20 border-emerald-500/20 text-emerald-400"
                  }`}
                  title={isOfflineMode ? "Click to resume online webockets" : "Click to simulate network dropout"}
                >
                  {isOfflineMode ? (
                    <>
                      <WifiOff className="w-3 h-3 text-amber-400 animate-pulse" />
                      Offline Sim
                    </>
                  ) : (
                    <>
                      <Wifi className="w-3 h-3 text-emerald-400" />
                      Secure Sync Active
                    </>
                  )}
                </button>

                <div 
                  className={`w-2 h-2 rounded-full ${
                    isOfflineMode ? "bg-amber-500" : isConnected ? "bg-emerald-500 animate-pulse" : "bg-red-500"
                  }`}
                  title={isConnected ? "Active signal" : "Connection closed"}
                />
              </div>

              <button 
                onClick={() => {
                  disconnectSocket();
                  setInRoom(false);
                  setFiles({});
                }}
                className="text-slate-400 hover:text-white px-2.5 py-1 bg-slate-900 border border-slate-800 hover:border-slate-700 text-[10px] rounded uppercase font-bold tracking-wider font-mono transition-all cursor-pointer"
              >
                Exit
              </button>
            </div>
          </header>

          <div className="flex-1 flex min-h-0 relative">
            
            {/* LEFT ACTIVITY RAIL (ICON BAR) */}
            <nav className="bg-slate-900 border-r border-slate-800 w-12 hidden md:flex flex-col items-center py-4 justify-between shrink-0">
              <div className="flex flex-col gap-5 items-center w-full">
                <button
                  onClick={() => setSidebarTab("explorer")}
                  title="Finder File Explorer"
                  className={`p-2 rounded transition-all relative group cursor-pointer ${
                    sidebarTab === "explorer" ? "bg-indigo-500/10 text-indigo-400 border-l-2 border-indigo-500 rounded-none w-full flex justify-center" : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  <Folder className="w-5 h-5" />
                  <span className="absolute left-14 top-1/2 -translate-y-1/2 px-2 py-1 text-[10px] font-mono bg-slate-950 text-slate-300 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none whitespace-nowrap">
                    Explorer (Finder)
                  </span>
                </button>

                <button
                  onClick={() => setSidebarTab("search")}
                  title="Global Search & Replace"
                  className={`p-2 rounded transition-all relative group cursor-pointer ${
                    sidebarTab === "search" ? "bg-indigo-500/10 text-indigo-400 border-l-2 border-indigo-500 rounded-none w-full flex justify-center" : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  <Search className="w-5 h-5" />
                  <span className="absolute left-14 top-1/2 -translate-y-1/2 px-2 py-1 text-[10px] font-mono bg-slate-950 text-slate-300 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none whitespace-nowrap">
                    Search & Replace
                  </span>
                </button>

                <button
                  onClick={() => setSidebarTab("users")}
                  title="Active Lobby Opponents"
                  className={`p-2 rounded transition-all relative group cursor-pointer ${
                    sidebarTab === "users" ? "bg-indigo-500/10 text-indigo-400 border-l-2 border-indigo-500 rounded-none w-full flex justify-center" : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  <Users className="w-5 h-5" />
                  {usersList.filter(u => u.isOnline).length > 1 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full border border-slate-900"></span>
                  )}
                  <span className="absolute left-14 top-1/2 -translate-y-1/2 px-2 py-1 text-[10px] font-mono bg-slate-950 text-slate-300 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none whitespace-nowrap">
                    Active Room Users
                  </span>
                </button>

                <button
                  onClick={() => setSidebarTab("activity")}
                  title="Workspace Activity Histology"
                  className={`p-2 rounded transition-all relative group cursor-pointer ${
                    sidebarTab === "activity" ? "bg-indigo-500/10 text-indigo-400 border-l-2 border-indigo-500 rounded-none w-full flex justify-center" : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  <History className="w-5 h-5" />
                  <span className="absolute left-14 top-1/2 -translate-y-1/2 px-2 py-1 text-[10px] font-mono bg-slate-950 text-slate-300 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none whitespace-nowrap">
                    Recent Activity Logs
                  </span>
                </button>

                <button
                  onClick={() => setSidebarTab("simulator")}
                  title="Sandbox Co-op Simulator"
                  className={`p-2 rounded transition-all relative group cursor-pointer ${
                    sidebarTab === "simulator" ? "bg-indigo-500/10 text-indigo-400 border-l-2 border-indigo-500 rounded-none w-full flex justify-center" : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  <Sliders className="w-5 h-5" />
                  <span className="absolute left-14 top-1/2 -translate-y-1/2 px-2 py-1 text-[10px] font-mono bg-slate-950 text-slate-300 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none whitespace-nowrap">
                    Solo-Coop Simulator
                  </span>
                </button>
              </div>

              <div className="flex flex-col gap-3 items-center">
                <span className="text-[9px] text-slate-600 font-mono text-center">v2.0</span>
              </div>
            </nav>

            {/* SIDEBAR EXPAND PANEL */}
            <aside className="w-full md:w-64 bg-[#1E293B]/80 border-r border-slate-800 flex flex-col shrink-0 min-w-0">
              
              {/* Sidebar Header Category */}
              <div className="p-3 border-b border-slate-800/60 pb-3 flex items-center justify-between">
                <h2 className="text-[10px] uppercase font-bold text-slate-500 tracking-widest font-mono">
                  {sidebarTab === "explorer" && "Finder / Workspace"}
                  {sidebarTab === "search" && "Search & Replace"}
                  {sidebarTab === "users" && "Participants"}
                  {sidebarTab === "activity" && "Activity Log"}
                  {sidebarTab === "simulator" && "Co-op Simulator"}
                </h2>
                
                {sidebarTab === "explorer" && (
                  <button 
                    onClick={() => setShowNewFileModal(true)} 
                    title="Add collaborative file"
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* SIDEBAR SUBPAGES SCREEN CONTENT */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 select-none">
                
                {/* EXPLORER (FILE MANAGER) */}
                {sidebarTab === "explorer" && (
                  <div className="space-y-4">
                    
                    {/* Collaborative workspace files root */}
                    <div className="space-y-1" onContextMenu={e => e.preventDefault()}>
                      <div className="flex items-center gap-1.5 text-slate-500 text-xs px-1 mb-1 font-mono">
                        <ChevronRight className="w-3.5 h-3.5 transform rotate-90" />
                        <span>WORKSPACE FILES</span>
                      </div>
                      
                      {Object.keys(files).length === 0 ? (
                        <div className="text-slate-600 text-[11px] p-2 leading-relaxed text-center italic">
                          No files created in this workspace session yet.
                        </div>
                      ) : (
                        (Object.values(files) as FileItem[]).map((file) => {
                          const isActive = file.path === activeTab;
                          const isLockedByOpponent = file.lockedBy && file.lockedBy !== userId;
                          return (
                            <div
                              key={file.path}
                              onClick={() => {
                                if (openTabs.indexOf(file.path) === -1) {
                                  setOpenTabs(prev => [...prev, file.path]);
                                }
                                setActiveTab(file.path);
                              }}
                              onContextMenu={(e) => showContextMenu(e, file.path)}
                              className={`group flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-mono cursor-pointer transition-colors relative ${
                                isActive 
                                  ? "bg-indigo-500/10 text-indigo-350 border-l-2 border-indigo-500 pl-2 rounded-none" 
                                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate min-w-0">
                                {file.name === "package.json" ? (
                                  <span className="text-orange-400 font-bold italic w-4 text-center shrink-0">#</span>
                                ) : file.name.endsWith(".html") ? (
                                  <span className="text-blue-400 font-bold w-4 text-center shrink-0">&lt;/&gt;</span>
                                ) : file.name.endsWith(".js") || file.name.endsWith(".ts") || file.name.endsWith(".jsx") || file.name.endsWith(".tsx") ? (
                                  <span className="text-yellow-400 font-bold italic text-[9px] w-4 text-center shrink-0">JS</span>
                                ) : file.name.endsWith(".css") ? (
                                  <span className="text-indigo-400 font-bold italic w-4 text-center shrink-0">{"{}"}</span>
                                ) : (
                                  <FileCode className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-400"}`} />
                                )}
                                <span className="truncate">{file.name}</span>
                              </div>

                              <div className="flex items-center gap-1">
                                {isLockedByOpponent ? (
                                  <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping" title={`${file.lockedByName} editing...`} />
                                ) : (
                                  <span className="text-[10px] text-slate-650 font-mono group-hover:hidden">v{file.version}</span>
                                )}
                                
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteFile(file.path);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 p-0.5 rounded transition-all cursor-pointer"
                                  title="Delete File"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* DRAG AND DROP FILE UPLOAD AREA */}
                    <div 
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      className={`border border-dashed rounded p-4 text-center transition-all cursor-pointer relative ${
                        dragActive 
                          ? "border-indigo-500 bg-indigo-550/5 text-indigo-300" 
                          : "border-slate-800 hover:border-slate-700 bg-slate-900/40 text-slate-550 hover:text-slate-400"
                      }`}
                    >
                      <Upload className="w-6 h-6 mx-auto mb-2 text-slate-500" />
                      <p className="text-[10px] uppercase font-bold tracking-wider font-mono text-slate-400">
                        Upload Files
                      </p>
                      <p className="text-[9px] text-slate-550 mt-1 font-mono">
                        Drag & drop or click anywhere
                      </p>

                      <label className="absolute inset-0 cursor-pointer">
                        <input 
                          type="file"
                          onChange={handleFileSelectElement}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* QUICK APP REVISIONS PANEL */}
                    {files[activeTab] && files[activeTab].history.length > 1 && (
                      <div className="border-t border-slate-800/60 pt-3">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-2 font-mono">
                          Revision History: {files[activeTab].name}
                        </span>
                        <div className="space-y-1.5 max-h-48 overflow-y-auto">
                          {files[activeTab].history.map((hist, idx) => (
                            <div 
                              key={idx} 
                              className="bg-slate-900/40 border border-slate-800/50 rounded p-2 flex flex-col gap-1 text-[10px] font-mono hover:border-slate-700 transition-colors"
                            >
                              <div className="flex justify-between items-center text-slate-405">
                                <span className="text-indigo-400 font-bold uppercase">Version {hist.version}</span>
                                <span>{new Date(hist.updatedAt).toLocaleTimeString()}</span>
                              </div>
                              <div className="text-slate-500 truncate">By {hist.updatedBy}</div>
                              {hist.version !== files[activeTab].version && (
                                <button
                                  type="button"
                                  onClick={() => handleRollback(activeTab, hist.version)}
                                  className="text-[10px] font-semibold uppercase tracking-wider hover:text-white bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-0.5 rounded self-end cursor-pointer transition-all"
                                >
                                  Rollback
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                )}

                {/* GLOBAL SEARCH AND REPLACE */}
                {sidebarTab === "search" && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 font-mono">Find Text</label>
                      <input 
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search pattern..."
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded px-2.5 py-1.5 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 font-mono">Replace With</label>
                      <input 
                        type="text"
                        value={replaceQuery}
                        onChange={e => setReplaceQuery(e.target.value)}
                        placeholder="Replacement parameter"
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded px-2.5 py-1.5 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleReplace(false)}
                        className="bg-slate-800 hover:bg-slate-750 text-[#c9d1d9] text-[10px] font-bold uppercase tracking-wider py-1.5 px-2 rounded border border-slate-700 cursor-pointer transition-colors"
                      >
                        Replace Tab
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReplace(true)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-wider py-1.5 px-2 rounded border border-indigo-500/25 shadow-md cursor-pointer transition-colors"
                      >
                        Replace All
                      </button>
                    </div>

                    {/* MATCHES RESULTS TIMELINE */}
                    {searchQuery && (
                      <div className="pt-2">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 font-mono block mb-2">
                          Matches found ({searchMatches.length})
                        </span>
                        <div className="space-y-1.5 max-h-64 overflow-y-auto">
                          {searchMatches.map((match, i) => (
                            <div 
                              key={i}
                              onClick={() => {
                                if (openTabs.indexOf(match.path) === -1) {
                                  setOpenTabs(p => [...p, match.path]);
                                }
                                setActiveTab(match.path);
                              }}
                              className="bg-slate-900/50 border border-slate-800 hover:border-slate-700 rounded p-1.5 cursor-pointer text-[10px] font-mono leading-normal block transition-all"
                            >
                              <div className="flex justify-between items-center text-slate-500 mb-0.5">
                                <span className="text-indigo-400 font-semibold">{match.path}</span>
                                <span>Line {match.lineNum}</span>
                              </div>
                              <div className="text-slate-350 truncate font-mono">
                                {match.text}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ROOM ACTIVE USERS LIST */}
                {sidebarTab === "users" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 font-mono block">
                        Lobby Participants
                      </span>
                      <div className="space-y-1.5">
                        {usersList.map((user) => {
                          const isMe = user.id === userId;
                          return (
                            <div 
                              key={user.id}
                              className="bg-slate-900/40 border border-slate-800 rounded p-2.5 flex items-center justify-between text-xs font-mono"
                            >
                              <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded bg-slate-800 border-2 font-bold flex items-center justify-center text-xs shrink-0 ${
                                  isMe ? "border-indigo-500 text-indigo-400" : "border-pink-500 text-pink-400"
                                }`}>
                                  {user.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex flex-col truncate min-w-0">
                                  <span className="font-bold text-slate-300 truncate">{user.name}</span>
                                  <span className="text-[9px] text-slate-550">ID: {user.id.substring(0, 8)}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${isMe ? "text-indigo-400" : "text-pink-450"}`}>
                                  {isMe ? "You" : "Opponent"}
                                </span>
                                <div className={`w-1.5 h-1.5 rounded-full ${user.isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-700"}`} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="border-t border-slate-800/80 pt-3">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 font-mono block mb-2">Invite Opponent</span>
                      <button
                        type="button"
                        onClick={copyRoomLink}
                        className="w-full py-2 bg-slate-950/40 border border-slate-800 hover:bg-slate-900 text-slate-300 text-[10px] font-bold uppercase tracking-wider rounded flex items-center justify-center gap-2 cursor-pointer transition-colors"
                      >
                        <Share2 className="w-3.5 h-3.5 text-indigo-400" /> Copy Room Invite Link
                      </button>
                    </div>
                  </div>
                )}

                {/* SYSTEM ACTIVITY TIMELINE */}
                {sidebarTab === "activity" && (
                  <div className="space-y-3">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 font-mono block">
                      Chronology Logs
                    </span>
                    <div className="space-y-2 max-h-[72vh] overflow-y-auto pr-1">
                      {activityLog.length === 0 ? (
                        <div className="text-slate-600 text-[10px] italic text-center py-4 font-mono">No recent edits logged</div>
                      ) : (
                        activityLog.map((log) => (
                          <div 
                            key={log.id}
                            className="bg-slate-900/40 border-l-2 border-indigo-500 p-2.5 text-[10px] font-mono space-y-1 block hover:border-indigo-400 transition-all"
                          >
                            <div className="flex justify-between items-center text-slate-500 font-mono">
                              <span className="font-bold text-slate-300">{log.userName}</span>
                              <span className="text-[9px]">{new Date(log.timestamp).toLocaleTimeString()}</span>
                            </div>
                            <div className="text-slate-400 leading-normal font-sans">
                              {log.details}
                            </div>
                            {log.fileName && (
                              <div className="inline-flex items-center gap-1 bg-[#1a233a] px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider text-indigo-450 font-mono">
                                <span className="text-[9px] font-extrabold text-indigo-400">#</span> {log.fileName}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* SOLO COOPERATIVE SIMULATION SUITE */}
                {sidebarTab === "simulator" && (
                  <div className="space-y-4 font-mono text-xs">
                    <div className="p-3 bg-slate-900/50 border border-indigo-500/20 rounded text-indigo-400 text-[11px] leading-relaxed">
                      <HelpCircleIcon className="inline w-3.5 h-3.5 mr-1 align-text-bottom text-indigo-400" />
                      Testing multiple PCs alone? Connect a virtual bot to test code conflict warnings and live locks with latency!
                    </div>

                    <div className="space-y-3">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block mb-2 font-mono">
                          Opponent Bot Setup
                        </span>
                        <button
                          type="button"
                          onClick={toggleOpponentSimulator}
                          className={`w-full py-2 border rounded text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                            isSimulatedOpponentJoined
                              ? "bg-rose-955/20 border-rose-500/20 text-rose-400 hover:bg-rose-950/30"
                              : "bg-indigo-600 hover:bg-indigo-500 border-indigo-500/20 text-white"
                          }`}
                        >
                          {isSimulatedOpponentJoined ? (
                            <>
                              <X className="w-3.5 h-3.5" /> Remove Virtual Opponent
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" /> Initialize Opponent Bot
                            </>
                          )}
                        </button>
                      </div>

                      {isSimulatedOpponentJoined && (
                        <div className="space-y-3 border-t border-slate-800/80 pt-3">
                          <div>
                            <div className="flex justify-between items-center mb-1.5 text-[10px]">
                              <span className="text-slate-400 font-bold uppercase tracking-wider">Response Latency</span>
                              <span className="text-indigo-400 font-bold">{opponentLatency}ms</span>
                            </div>
                            <input 
                              type="range"
                              min={50}
                              max={1000}
                              step={50}
                              value={opponentLatency}
                              onChange={e => setOpponentLatency(Number(e.target.value))}
                              className="w-full accent-indigo-500 cursor-pointer h-1 bg-slate-900 rounded-lg appearance-none"
                            />
                          </div>

                          <div className="space-y-2">
                            <button
                              type="button"
                              onClick={triggerMockOpponentEdit}
                              className="w-full py-2 bg-slate-800 border border-slate-700 hover:bg-slate-750 text-slate-200 rounded text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                            >
                              Simulate Opponent Edit (v{files[activeTab] ? files[activeTab].version + 1 : 1})
                            </button>
                            <button
                              type="button"
                              onClick={triggerMockCollision}
                              className="w-full py-2 bg-amber-600/10 border border-amber-500/20 text-amber-400 rounded text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                            >
                              Simulate Edit Collision
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>
            </aside>

            {/* MAIN CODE WORKPLACE EDITOR */}
            <main className="flex-1 flex flex-col min-w-0 bg-[#07090e]">
              
              {/* Tabs Bar Header */}
              <div className="bg-[#0f172a] border-b border-slate-800 flex items-center justify-between overflow-x-auto overflow-y-hidden shrink-0 select-none">
                <div className="flex items-center">
                  {openTabs.map((path) => {
                    const tabFile = files[path];
                    const isActive = path === activeTab;
                    if (!tabFile) return null;
                    return (
                      <div
                        key={path}
                        onClick={() => setActiveTab(path)}
                        className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono cursor-pointer border-r border-slate-800 transition-colors shrink-0 relative ${
                          isActive 
                            ? "bg-[#07090e] text-indigo-300 border-t-2 border-t-indigo-500" 
                            : "bg-[#1e293b]/50 text-slate-500 hover:text-slate-300 hover:bg-[#1e293b]/80"
                        }`}
                      >
                        {tabFile.name === "package.json" ? (
                          <span className="text-orange-400 font-bold italic w-4 text-center shrink-0">#</span>
                        ) : tabFile.name.endsWith(".html") ? (
                          <span className="text-blue-400 font-bold w-4 text-center shrink-0">&lt;/&gt;</span>
                        ) : tabFile.name.endsWith(".js") || tabFile.name.endsWith(".ts") || tabFile.name.endsWith(".jsx") || tabFile.name.endsWith(".tsx") ? (
                          <span className="text-yellow-400 font-bold italic text-[9px] w-4 text-center shrink-0">JS</span>
                        ) : tabFile.name.endsWith(".css") ? (
                          <span className="text-indigo-400 font-bold italic w-4 text-center shrink-0">{"{}"}</span>
                        ) : (
                          <FileCode className={`w-3.5 h-3.5 ${isActive ? "text-indigo-400" : "text-slate-500"}`} />
                        )}
                        <span>{tabFile.name}</span>
                        {isActive && hasUnsavedChanges && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Unsaved local modifications" />
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenTabs(prev => prev.filter(t => t !== path));
                            if (activeTab === path) {
                              const remaining = openTabs.filter(t => t !== path);
                              if (remaining.length > 0) setActiveTab(remaining[0]);
                            }
                          }}
                          className="hover:bg-slate-800/80 p-0.5 rounded transition-all text-slate-600 hover:text-slate-300 ml-1.5 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 pr-3 shrink-0">
                  {files[activeTab] && (
                    <button
                      type="button"
                      onClick={() => saveAndUploadFile(activeTab)}
                      className={`text-[10px] font-mono font-bold uppercase tracking-wider px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded cursor-pointer transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-950/25 ${
                        hasUnsavedChanges ? "ring-2 ring-indigo-500 animate-pulse" : "opacity-90"
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" /> Save & Upload (Ctrl+S)
                    </button>
                  )}
                </div>
              </div>

              {/* EDITOR WORKSPACE BODY */}
              <div className="flex-1 relative flex min-h-0">
                {!activeTab || !files[activeTab] ? (
                  <div className="flex-1 flex flex-col justify-center items-center text-slate-600 font-mono gap-3 p-4 text-center">
                    <Laptop className="w-12 h-12 text-slate-800 animate-pulse" />
                    <div>
                      <p className="text-slate-400 font-bold uppercase tracking-wider mb-1">Collaborative Environment Idle</p>
                      <p className="text-[11px] text-slate-550 max-w-sm">Choose or create a file from the Finder sidebar, or upload custom code templates to begin editing.</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col min-h-0 relative">
                    
                    {/* Locking Banner overlay */}
                    {files[activeTab].lockedBy && files[activeTab].lockedBy !== userId && (
                      <div className="bg-amber-950/40 border-b border-amber-550/20 text-amber-300 px-4 py-2 flex items-center justify-between text-xs font-mono shrink-0">
                        <span className="flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>Co-editing warning: Opponent <strong>{files[activeTab].lockedByName}</strong> is currently editing {files[activeTab].name}</span>
                        </span>
                        <span className="text-[9px] bg-amber-500/20 px-2 py-0.5 rounded text-amber-450 uppercase font-bold tracking-wider">Lock Indicator</span>
                      </div>
                    )}

                    <div className="flex-1 relative flex min-h-0 animate-fade-in">
                      
                      {/* Left Line Numbers decoration */}
                      <div className="w-10 bg-[#050811] text-slate-600 select-none text-[11px] font-mono py-4 text-right pr-2 leading-relaxed border-r border-slate-900/60">
                        {editorContent.split("\n").map((_, i) => (
                          <div key={i}>{i + 1}</div>
                        ))}
                      </div>

                      {/* TEXTAREA CODE SHEET */}
                      <textarea
                        ref={editorRef}
                        value={editorContent}
                        onChange={(e) => handleEditorInput(e.target.value)}
                        placeholder="Type collaborative HTML / CSS / JavaScript code here..."
                        className="flex-1 bg-[#07090e] text-[#f8fafc] font-mono text-xs p-4 focus:outline-none resize-none leading-relaxed outline-none border-0 caret-indigo-500 select-text"
                        onKeyDown={(e) => {
                          // Allow Tab key indent spacing
                          if (e.key === "Tab") {
                            e.preventDefault();
                            const start = e.currentTarget.selectionStart;
                            const end = e.currentTarget.selectionEnd;
                            const val = e.currentTarget.value;
                            const newVal = val.substring(0, start) + "  " + val.substring(end);
                            setEditorContent(newVal);
                            setTimeout(() => {
                              if (editorRef.current) {
                                editorRef.current.selectionStart = editorRef.current.selectionEnd = start + 2;
                              }
                            }, 0);
                          }
                          // Support Ctrl+S shortcut save
                          if ((e.ctrlKey || e.metaKey) && e.key === "s") {
                            e.preventDefault();
                            saveAndUploadFile(activeTab);
                          }
                        }}
                      />
                    </div>

                    {/* STATUS FOOTER BAR */}
                    <footer className="bg-[#0b0f19] border-t border-slate-800 px-4 py-2 flex justify-between items-center text-slate-500 text-xs font-mono shrink-0 select-none">
                      <div className="flex items-center gap-4">
                        <span className="text-indigo-400 font-bold uppercase tracking-widest">{files[activeTab].language}</span>
                        <span>Lines: {editorContent.split("\n").length}</span>
                        <span>Size: {new Blob([editorContent]).size} bytes</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-slate-455 font-bold uppercase text-[10px]">Latest Sync v{files[activeTab].version}</span>
                        <span className="text-slate-550 font-mono">by {files[activeTab].updatedBy}</span>
                      </div>
                    </footer>

                  </div>
                )}
              </div>

            </main>
          </div>
          
          {/* 3. DYNAMIC RIGHT-CLICK SIDEBAR FINDER MENU OVERLAY */}
          {contextMenu && (
            <div 
              style={{ top: contextMenu.y, left: contextMenu.x }}
              className="fixed bg-[#0f172a] border border-slate-755 shadow-2xl rounded p-1.5 z-50 w-48 font-mono text-xs text-slate-300 select-none animate-fade-in"
            >
              <button 
                onClick={() => handleSaveAndUpload(contextMenu.path)}
                className="w-full text-left px-3 py-2 hover:bg-slate-800/60 rounded text-[11px] font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-indigo-400" /> Save & Upload
              </button>
              
              <a 
                href={`/api/rooms/${roomId}/files/${encodeURIComponent(contextMenu.path)}/download`}
                download
                className="w-full text-left px-3 py-2 hover:bg-slate-800/60 rounded text-[11px] font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors block text-slate-300 decoration-none"
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" /> Download Content
              </a>

              <hr className="border-slate-800 my-1" />

              <button 
                onClick={() => handleDeleteFile(contextMenu.path)}
                className="w-full text-left px-3 py-2 hover:bg-slate-800/40 rounded text-rose-455 text-[11px] font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete File
              </button>
            </div>
          )}

          {/* 4. CONFLICT MERGE AND RESOLUTION VIEW MODAL */}
          {conflict && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-[#0f172a] border border-slate-755 rounded shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col p-6 animate-fade-in font-mono">
                
                {/* Banner header alerts */}
                <div className="flex gap-3 items-center text-amber-500 mb-2 font-bold select-none">
                  <AlertTriangle className="w-5 h-5 animate-pulse" />
                  <h3 className="text-xs uppercase tracking-widest font-mono">Collision Warning: Concurrency Conflict Detected</h3>
                </div>
                <p className="text-xs text-slate-400 mb-4 leading-normal font-sans">
                  While you were editing, Opponent <strong>{conflict.serverUpdatedBy}</strong> saved a conflicting version of <strong>{conflict.path}</strong>. Choose a resolution strategy to secure coordinate consistency:
                </p>

                {/* Diff comparative side panels */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0 overflow-y-auto mb-6">
                  
                  {/* Left: Server Side Contents */}
                  <div className="flex flex-col border border-slate-800 rounded bg-[#07090e] p-4">
                    <span className="text-xs font-bold text-indigo-400 mb-2 block border-b border-slate-800/80 pb-1.5 flex justify-between uppercase tracking-wider">
                      <span>Server Version (v{conflict.serverVersion})</span>
                      <span className="text-slate-500 font-mono text-[10px]">By: {conflict.serverUpdatedBy}</span>
                    </span>
                    <pre className="text-[10px] text-slate-300 leading-relaxed overflow-x-auto whitespace-pre font-mono flex-1">
                      {conflict.serverContent}
                    </pre>
                  </div>

                  {/* Right: Your Local UnsUnsaved Changes */}
                  <div className="flex flex-col border border-slate-800 rounded bg-[#07090e] p-4">
                    <span className="text-xs font-bold text-emerald-400 mb-2 block border-b border-slate-800/80 pb-1.5 flex justify-between uppercase tracking-wider">
                      <span>Your Local Version</span>
                      <span className="text-slate-500 font-mono text-[10px]">Unsaved Buffer</span>
                    </span>
                    <pre className="text-[10px] text-slate-300 leading-relaxed overflow-x-auto whitespace-pre font-mono flex-1">
                      {conflict.clientContent}
                    </pre>
                  </div>

                </div>

                {/* Conflict actions footers picker */}
                <div className="flex flex-col md:flex-row gap-3 justify-between items-center border-t border-slate-800 pt-4 shrink-0">
                  <div className="text-slate-500 text-xs font-mono">
                    Conflict algorithm resolution parameters ready.
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <button
                      type="button"
                      onClick={resolveConflictWithServer}
                      className="flex-1 md:flex-none px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-[10px] font-bold uppercase tracking-wider rounded border border-slate-705 cursor-pointer transition-colors"
                    >
                      Discard Mine
                    </button>
                    <button
                      type="button"
                      onClick={resolveWithSmartMerge}
                      className="flex-1 md:flex-none px-4 py-2 bg-indigo-600 hover:bg-indigo-550 text-white text-[10px] font-bold uppercase tracking-wider rounded border border-indigo-500/20 shadow-md cursor-pointer transition-all"
                    >
                      Smart Merge
                    </button>
                    <button
                      type="button"
                      onClick={resolveConflictWithLocal}
                      className="flex-1 md:flex-none px-4 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider rounded cursor-pointer transition-colors"
                    >
                      Force Overwrite
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* 5. ADD COLLABORATIVE NEW FILE MODAL BOX */}
          {showNewFileModal && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-[#0f172a] border border-slate-750 rounded shadow-2xl p-6 w-full max-w-sm font-mono animate-fade-in">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#cbd5e1]">New Collaborative File</span>
                  <button 
                    onClick={() => setShowNewFileModal(false)}
                    className="text-slate-500 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleCreateNewFile} className="space-y-4">
                  <div>
                    <label className="block text-[10px] text-slate-550 mb-1.5 uppercase tracking-widest font-bold">File Path Name</label>
                    <input 
                      type="text"
                      required
                      value={newFileName}
                      onChange={e => setNewFileName(e.target.value)}
                      placeholder="e.g. scripts/main.js or style.css"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white text-xs outline-none focus:border-indigo-505 focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] uppercase tracking-wider rounded transition-all shadow-md shadow-indigo-950/20 cursor-pointer"
                  >
                    Confirm Path Creation
                  </button>
                </form>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}

// Inline fallback help icons to avoid extra code size
function HelpCircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </svg>
  );
}
