import express from "express";
import http from "http";
import path from "path";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";

// Types for Room, Files and Server State
interface FileHistoryItem {
  version: number;
  content: string;
  updatedAt: number;
  updatedBy: string;
}

interface FileItem {
  id: string; // relative path/name
  name: string;
  path: string;
  content: string;
  language: string;
  updatedAt: number;
  updatedBy: string;
  version: number;
  history: FileHistoryItem[];
  lockedBy?: string | null;  // active editor lock
  lockedByName?: string | null;
}

interface Activity {
  id: string;
  timestamp: number;
  userId: string;
  userName: string;
  type: "join" | "leave" | "edit" | "file_create" | "file_delete" | "file_upload" | "rollback";
  fileName?: string;
  details: string;
}

interface User {
  id: string;
  name: string;
  socket: WebSocket;
  isOnline: boolean;
}

interface Room {
  id: string;
  password?: string;
  users: Record<string, User>; // key: userId
  files: Record<string, FileItem>; // key: filePath
  activityLog: Activity[];
}

// In-Memory state
const rooms: Record<string, Room> = {};

// Port configuration
const PORT = 3000;

// Helper to generate dynamic simple room IDs (e.g. 5 character code)
function generateRoomId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Avoid ambiguous chars
  let roomCode = "";
  for (let i = 0; i < 5; i++) {
    roomCode += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return roomCode;
}

// Detect language from file extension
function detectLanguage(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "html":
    case "htm":
    case "svg":
    case "xml":
      return "html";
    case "css":
    case "scss":
    case "sass":
    case "less":
      return "css";
    case "js":
    case "jsx":
    case "mjs":
    case "cjs":
      return "javascript";
    case "ts":
    case "tsx":
    case "mts":
    case "cts":
      return "typescript";
    case "json":
    case "babelrc":
    case "eslintrc":
      return "json";
    case "md":
    case "markdown":
    case "mdx":
      return "markdown";
    case "py":
    case "ipynb":
    case "pyw":
      return "python";
    case "java":
    case "jar":
      return "java";
    case "cpp":
    case "cxx":
    case "cc":
    case "hpp":
    case "h":
    case "c":
      return "cpp";
    case "rs":
      return "rust";
    case "go":
      return "go";
    case "sh":
    case "bash":
    case "zsh":
      return "bash";
    case "sql":
      return "sql";
    case "yaml":
    case "yml":
      return "yaml";
    case "rb":
      return "ruby";
    case "php":
      return "php";
    case "swift":
      return "swift";
    case "kt":
    case "kts":
      return "kotlin";
    case "cs":
      return "csharp";
    default:
      return "plaintext";
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "50mb" })); // support large file uploads as base64

  // Create standard HTTP server
  const server = http.createServer(app);

  // REST APIs
  
  // Create a room
  app.post("/api/rooms", (req, res) => {
    const { password } = req.body;
    let roomId = generateRoomId();
    // Guarantee room ID is unique
    while (rooms[roomId]) {
      roomId = generateRoomId();
    }

    // Initialize room with default files to play with
    const defaultFiles: Record<string, FileItem> = {
      "index.html": {
        id: "index.html",
        name: "index.html",
        path: "index.html",
        content: `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Collaborative Code Sandbox</title>\n  <style>\n    body {\n      background: #0f172a;\n      color: #f8fafc;\n      font-family: system-ui, sans-serif;\n      display: flex;\n      align-items: center;\n      justify-content: center;\n      height: 100vh;\n      margin: 0;\n    }\n    h1 {\n      color: #38bdf8;\n      text-shadow: 0 0 10px rgba(56, 189, 248, 0.3);\n      animation: pulse 2s infinite;\n    }\n    @keyframes pulse {\n      0%, 100% { opacity: 1; }\n      50% { opacity: 0.7; }\n    }\n  </style>\n</head>\n<body>\n  <div>\n    <h1>Hello from Collaborative Code Room!</h1>\n    <p>Let's edit this code together in real-time.</p>\n  </div>\n</body>\n</html>`,
        language: "html",
        updatedAt: Date.now(),
        updatedBy: "System",
        version: 1,
        history: [
          {
            version: 1,
            content: `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Collaborative Code Sandbox</title>\n  <style>\n    body {\n      background: #0f172a;\n      color: #f8fafc;\n      font-family: system-ui, sans-serif;\n      display: flex;\n      align-items: center;\n      justify-content: center;\n      height: 100vh;\n      margin: 0;\n    }\n    h1 {\n      color: #38bdf8;\n      text-shadow: 0 0 10px rgba(56, 189, 248, 0.3);\n      animation: pulse 2s infinite;\n    }\n    @keyframes pulse {\n      0%, 100% { opacity: 1; }\n      50% { opacity: 0.7; }\n    }\n  </style>\n</head>\n<body>\n  <div>\n    <h1>Hello from Collaborative Code Room!</h1>\n    <p>Let's edit this code together in real-time.</p>\n  </div>\n</body>\n</html>`,
            updatedAt: Date.now(),
            updatedBy: "System"
          }
        ]
      },
      "style.css": {
        id: "style.css",
        name: "style.css",
        path: "style.css",
        content: `/* Styling for collaborative page */\n@keyframes swing {\n  0%, 100% { transform: rotate(-3deg); }\n  50% { transform: rotate(3deg); }\n}\n\n.card {\n  background: rgba(30, 41, 59, 0.8);\n  border: 1px solid rgba(255, 255, 255, 0.1);\n  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);\n  border-radius: 12px;\n}`,
        language: "css",
        updatedAt: Date.now(),
        updatedBy: "System",
        version: 1,
        history: [{ version: 1, content: "/* Styling for collaborative page */", updatedAt: Date.now(), updatedBy: "System" }]
      }
    };

    rooms[roomId] = {
      id: roomId,
      password: password || undefined,
      users: {},
      files: defaultFiles,
      activityLog: [
        {
          id: Math.random().toString(36).substring(2, 9),
          timestamp: Date.now(),
          userId: "system",
          userName: "System",
          type: "file_create",
          details: "Room created and initialized with default coding playground files."
        }
      ]
    };

    res.json({
      roomId,
      passwordRequired: !!password
    });
  });

  // Verify room exists and matches password
  app.post("/api/rooms/verify", (req, res) => {
    const { roomId, password } = req.body;
    const room = rooms[roomId ? roomId.toUpperCase() : ""];

    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    if (room.password && room.password !== password) {
      return res.status(401).json({ success: false, message: "Invalid password for this room" });
    }

    res.json({
      success: true,
      roomId: room.id,
      passwordRequired: !!room.password
    });
  });

  // Download a single file contents
  app.get("/api/rooms/:roomId/files/:fileId/download", (req, res) => {
    const { roomId, fileId } = req.params;
    const room = rooms[roomId ? roomId.toUpperCase() : ""];
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Find the file by id or name
    const decodedFileId = decodeURIComponent(fileId);
    const file = room.files[decodedFileId];
    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    res.setHeader("Content-Disposition", `attachment; filename="${file.name}"`);
    res.setHeader("Content-Type", "text/plain");
    res.send(file.content);
  });

  // Upload or overwrite a file explicitly
  app.post("/api/rooms/:roomId/upload", (req, res) => {
    const { roomId } = req.params;
    const { name, path: filePath, content, userId, userName } = req.body;

    const room = rooms[roomId ? roomId.toUpperCase() : ""];
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const cleanPath = filePath || name;
    const isNew = !room.files[cleanPath];
    const prevFile = room.files[cleanPath];

    const newVersion = prevFile ? prevFile.version + 1 : 1;
    const fileItem: FileItem = {
      id: cleanPath,
      name,
      path: cleanPath,
      content,
      language: detectLanguage(name),
      updatedAt: Date.now(),
      updatedBy: userName || "Opponent",
      version: newVersion,
      history: [
        ...(prevFile?.history || []),
        {
          version: newVersion,
          content,
          updatedAt: Date.now(),
          updatedBy: userName || "Opponent"
        }
      ]
    };

    room.files[cleanPath] = fileItem;

    const activity: Activity = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
      userId: userId || "unknown",
      userName: userName || "Opponent",
      type: isNew ? "file_create" : "file_upload",
      fileName: name,
      details: isNew ? `Created file ${name} through upload.` : `Uploaded new version of ${name}.`
    };

    room.activityLog.push(activity);

    // Broadcast update to other users in the room
    broadcastToRoom(room.id, {
      type: "file_update",
      file: fileItem,
      activity
    }, userId);

    res.json({ success: true, file: fileItem });
  });

  // Setup WebSocket Server
  const wss = new WebSocketServer({ noServer: true });

  // Handle upgraded connection
  server.on("upgrade", (request, socket, head) => {
    const pathname = new URL(request.url || "", `http://${request.headers.host}`).pathname;
    if (pathname === "/ws") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  // Helper broadcast function
  function broadcastToRoom(roomId: string, message: any, excludeUserId?: string) {
    const room = rooms[roomId];
    if (!room) return;

    const payload = JSON.stringify(message);

    Object.values(room.users).forEach((user) => {
      if (user.isOnline && user.socket.readyState === WebSocket.OPEN) {
        if (!excludeUserId || user.id !== excludeUserId) {
          user.socket.send(payload);
        }
      }
    });
  }

  // WebSocket lifecycle
  wss.on("connection", (ws: WebSocket) => {
    let currentRoomId: string | null = null;
    let currentUserId: string | null = null;

    ws.on("message", (message: string) => {
      try {
        const data = JSON.parse(message);

        switch (data.type) {
          case "join": {
            const { roomId, password, userId, userName } = data;
            const upperRoomId = roomId ? roomId.toUpperCase() : "";
            const room = rooms[upperRoomId];

            if (!room) {
              ws.send(JSON.stringify({ type: "error", message: "Room not found" }));
              return;
            }

            if (room.password && room.password !== password) {
              ws.send(JSON.stringify({ type: "error", message: "Invalid room password" }));
              return;
            }

            currentRoomId = upperRoomId;
            currentUserId = userId;

            // Register/Update User
            room.users[userId] = {
              id: userId,
              name: userName,
              socket: ws,
              isOnline: true
            };

            const activity: Activity = {
              id: Math.random().toString(36).substring(2, 9),
              timestamp: Date.now(),
              userId,
              userName,
              type: "join",
              details: `${userName} joined the room.`
            };
            room.activityLog.push(activity);

            // Send initial room snapshot
            ws.send(JSON.stringify({
              type: "room_snapshot",
              roomId: room.id,
              files: room.files,
              users: Object.values(room.users).map(u => ({ id: u.id, name: u.name, isOnline: u.isOnline })),
              activityLog: room.activityLog
            }));

            // Broadcast join to others
            broadcastToRoom(upperRoomId, {
              type: "user_joined",
              userId,
              userName,
              users: Object.values(room.users).map(u => ({ id: u.id, name: u.name, isOnline: u.isOnline })),
              activity
            }, userId);
            break;
          }

          case "update_file": {
            if (!currentRoomId || !currentUserId) return;
            const { path: filePath, content, version, userName } = data;
            const room = rooms[currentRoomId];
            if (!room) return;

            const file = room.files[filePath];
            if (!file) return;

            // Conflict resolution:
            // Check if client version matches server version. If not, there could be a collision!
            if (version !== file.version) {
              // Server-side Conflict Handling:
              // Generate automated merge or notify client of conflict
              // Let's check if contents actually differ. If same, skip conflict.
              if (file.content === content) {
                // Ignore identical updates
                return;
              }

              // Let's send a conflict warning to the client with both versions
              ws.send(JSON.stringify({
                type: "conflict_detected",
                path: filePath,
                serverVersion: file.version,
                serverContent: file.content,
                serverUpdatedBy: file.updatedBy,
                clientContent: content
              }));
              return;
            }

            // Normal update: append history, bump version
            const nextVersion = file.version + 1;
            file.content = content;
            file.version = nextVersion;
            file.updatedAt = Date.now();
            file.updatedBy = userName;
            file.history.push({
              version: nextVersion,
              content,
              updatedAt: file.updatedAt,
              updatedBy: userName
            });

            // Keep lock state alive or release it if the update explicitly wants to
            if (file.lockedBy === currentUserId) {
              file.lockedBy = null;
              file.lockedByName = null;
            }

            const activity: Activity = {
              id: Math.random().toString(36).substring(2, 9),
              timestamp: Date.now(),
              userId: currentUserId,
              userName,
              type: "edit",
              fileName: file.name,
              details: `Edited file ${file.name} to version ${nextVersion}.`
            };
            room.activityLog.push(activity);

            // Broadcast the file change to all clients (including the sender to update their local version number metadata)
            broadcastToRoom(currentRoomId, {
              type: "file_update",
              file,
              activity
            });
            break;
          }

          case "force_update_file": {
            // Overwrites server contents explicitly (force save/conflict resolved)
            if (!currentRoomId || !currentUserId) return;
            const { path: filePath, content, userName } = data;
            const room = rooms[currentRoomId];
            if (!room) return;

            const file = room.files[filePath];
            if (!file) return;

            const nextVersion = file.version + 1;
            file.content = content;
            file.version = nextVersion;
            file.updatedAt = Date.now();
            file.updatedBy = userName;
            file.history.push({
              version: nextVersion,
              content,
              updatedAt: file.updatedAt,
              updatedBy: userName
            });

            const activity: Activity = {
              id: Math.random().toString(36).substring(2, 9),
              timestamp: Date.now(),
              userId: currentUserId,
              userName,
              type: "edit",
              fileName: file.name,
              details: `Resolved conflict in ${file.name} (bumped to v${nextVersion}).`
            };
            room.activityLog.push(activity);

            broadcastToRoom(currentRoomId, {
              type: "file_update",
              file,
              activity
            });
            break;
          }

          case "lock_file": {
            if (!currentRoomId || !currentUserId) return;
            const { path: filePath, isLocked, userName } = data;
            const room = rooms[currentRoomId];
            if (!room) return;

            const file = room.files[filePath];
            if (!file) return;

            if (isLocked) {
              // Lock file to current user
              if (!file.lockedBy || file.lockedBy === currentUserId) {
                file.lockedBy = currentUserId;
                file.lockedByName = userName;
              }
            } else {
              // Release lock
              if (file.lockedBy === currentUserId) {
                file.lockedBy = null;
                file.lockedByName = null;
              }
            }

            broadcastToRoom(currentRoomId, {
              type: "lock_status",
              path: filePath,
              lockedBy: file.lockedBy,
              lockedByName: file.lockedByName
            }, currentUserId);
            break;
          }

          case "create_file": {
            if (!currentRoomId || !currentUserId) return;
            const { path: filePath, name, content, userName } = data;
            const room = rooms[currentRoomId];
            if (!room) return;

            if (room.files[filePath]) {
              ws.send(JSON.stringify({ type: "error", message: `A file at path '${filePath}' already exists.` }));
              return;
            }

            const cleanContent = content || "";
            const newFile: FileItem = {
              id: filePath,
              name,
              path: filePath,
              content: cleanContent,
              language: detectLanguage(name),
              updatedAt: Date.now(),
              updatedBy: userName,
              version: 1,
              history: [
                {
                  version: 1,
                  content: cleanContent,
                  updatedAt: Date.now(),
                  updatedBy: userName
                }
              ]
            };

            room.files[filePath] = newFile;

            const activity: Activity = {
              id: Math.random().toString(36).substring(2, 9),
              timestamp: Date.now(),
              userId: currentUserId,
              userName,
              type: "file_create",
              fileName: name,
              details: `Created new file '${filePath}'.`
            };
            room.activityLog.push(activity);

            broadcastToRoom(currentRoomId, {
              type: "file_create",
              file: newFile,
              activity
            });
            break;
          }

          case "delete_file": {
            if (!currentRoomId || !currentUserId) return;
            const { path: filePath, userName } = data;
            const room = rooms[currentRoomId];
            if (!room) return;

            const file = room.files[filePath];
            if (!file) return;

            delete room.files[filePath];

            const activity: Activity = {
              id: Math.random().toString(36).substring(2, 9),
              timestamp: Date.now(),
              userId: currentUserId,
              userName,
              type: "file_delete",
              fileName: file.name,
              details: `Deleted file '${filePath}'.`
            };
            room.activityLog.push(activity);

            broadcastToRoom(currentRoomId, {
              type: "file_delete",
              path: filePath,
              activity
            });
            break;
          }

          case "rename_file": {
            if (!currentRoomId || !currentUserId) return;
            const { oldPath, newPath, userName, activeContent } = data;
            const room = rooms[currentRoomId];
            if (!room) return;

            const file = room.files[oldPath];
            if (!file) {
              ws.send(JSON.stringify({ type: "error", message: `Source file '${oldPath}' not found.` }));
              return;
            }

            if (room.files[newPath]) {
              ws.send(JSON.stringify({ type: "error", message: `A file at destination path '${newPath}' already exists.` }));
              return;
            }

            // Resolve potential unsaved local edits
            const resolvedContent = activeContent !== undefined ? activeContent : file.content;
            const oldName = file.name;
            const newName = newPath.split(/[/\\]/).pop() || newPath;

            // Multi-file safety check: safely update all references to oldPath / oldName in the workspace
            Object.entries(room.files).forEach(([pathKey, fItem]) => {
              if (pathKey !== oldPath) {
                let updatedContent = fItem.content;
                let madeChange = false;

                if (updatedContent.includes(oldPath)) {
                  updatedContent = updatedContent.split(oldPath).join(newPath);
                  madeChange = true;
                }
                if (updatedContent.includes(oldName)) {
                  updatedContent = updatedContent.split(oldName).join(newName);
                  madeChange = true;
                }

                if (madeChange) {
                  fItem.content = updatedContent;
                  fItem.version += 1;
                  fItem.updatedAt = Date.now();
                  fItem.updatedBy = userName;
                  fItem.history.push({
                    version: fItem.version,
                    content: updatedContent,
                    updatedAt: fItem.updatedAt,
                    updatedBy: userName
                  });
                  
                  broadcastToRoom(currentRoomId!, {
                    type: "file_update",
                    file: fItem
                  });
                }
              }
            });

            const nextVersion = file.version + 1;
            const renamedFile: FileItem = {
              ...file,
              id: newPath,
              path: newPath,
              name: newName,
              content: resolvedContent,
              language: detectLanguage(newName),
              version: nextVersion,
              updatedAt: Date.now(),
              updatedBy: userName,
              history: [
                ...file.history,
                {
                  version: nextVersion,
                  content: resolvedContent,
                  updatedAt: Date.now(),
                  updatedBy: userName
                }
              ]
            };

            delete room.files[oldPath];
            room.files[newPath] = renamedFile;

            const activity: Activity = {
              id: Math.random().toString(36).substring(2, 9),
              timestamp: Date.now(),
              userId: currentUserId,
              userName,
              type: "edit",
              fileName: newName,
              details: `Renamed file from '${oldPath}' to '${newPath}' and updated workspace references.`
            };
            room.activityLog.push(activity);

            broadcastToRoom(currentRoomId, {
              type: "file_rename",
              oldPath,
              newPath,
              file: renamedFile,
              activity
            });
            break;
          }

          case "rollback_file": {
            if (!currentRoomId || !currentUserId) return;
            const { path: filePath, version, userName } = data;
            const room = rooms[currentRoomId];
            if (!room) return;

            const file = room.files[filePath];
            if (!file) return;

            const historyVer = file.history.find(h => h.version === version);
            if (!historyVer) {
              ws.send(JSON.stringify({ type: "error", message: "History version not found for rollback." }));
              return;
            }

            const nextVersion = file.version + 1;
            file.content = historyVer.content;
            file.version = nextVersion;
            file.updatedAt = Date.now();
            file.updatedBy = userName;
            file.history.push({
              version: nextVersion,
              content: historyVer.content,
              updatedAt: file.updatedAt,
              updatedBy: userName
            });

            const activity: Activity = {
              id: Math.random().toString(36).substring(2, 9),
              timestamp: Date.now(),
              userId: currentUserId,
              userName,
              type: "rollback",
              fileName: file.name,
              details: `Rolled back ${file.name} to version ${version} as v${nextVersion}.`
            };
            room.activityLog.push(activity);

            broadcastToRoom(currentRoomId, {
              type: "file_update",
              file,
              activity
            });
            break;
          }
        }
      } catch (err) {
        console.error("Error processing WS message:", err);
      }
    });

    ws.on("close", () => {
      if (currentRoomId && currentUserId) {
        const room = rooms[currentRoomId];
        if (room) {
          const user = room.users[currentUserId];
          if (user) {
            user.isOnline = false;

            const activity: Activity = {
              id: Math.random().toString(36).substring(2, 9),
              timestamp: Date.now(),
              userId: currentUserId,
              userName: user.name,
              type: "leave",
              details: `${user.name} went offline.`
            };
            room.activityLog.push(activity);

            // Automatically release any locks held by the disconnected user
            Object.values(room.files).forEach(file => {
              if (file.lockedBy === currentUserId) {
                file.lockedBy = null;
                file.lockedByName = null;
                broadcastToRoom(currentRoomId!, {
                  type: "lock_status",
                  path: file.path,
                  lockedBy: null,
                  lockedByName: null
                });
              }
            });

            broadcastToRoom(currentRoomId, {
              type: "user_left",
              userId: currentUserId,
              users: Object.values(room.users).map(u => ({ id: u.id, name: u.name, isOnline: u.isOnline })),
              activity
            });
          }
        }
      }
    });
  });

  // Serve Vite Client Application
  if (process.env.NODE_ENV !== "production") {
    // Development Mode: Use Vite Middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production Mode: Serve Compiled Files
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Listen on PORT 3000 and bind to 0.0.0.0
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server starting on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Fatal error starting server:", err);
});
