import React, { useState, useEffect, useRef, useMemo, FormEvent, DragEvent, ChangeEvent, SVGProps } from "react";
import { 
  FileCode, Folder, Search, Share2, Users, History, Sliders, Lock, Unlock, 
  Wifi, WifiOff, Terminal, Plus, Trash2, Upload, Download, RefreshCw, Play, 
  Check, AlertTriangle, Menu, X, FileCode2, Clipboard, Globe, FileText, 
  Layers, ChevronRight, Eye, Edit2, Info, Moon, Laptop, EyeOff, QrCode, Sparkles,
  FolderDown, Keyboard, Volume2, VolumeX, GitCompare
} from "lucide-react";
import { encryptPayload, decryptPayload } from "./utils/crypto";
import { prettifyCode } from "./utils/formatter";
import { FileItem, Activity, RoomUser, ConflictDetails } from "./types";
import QRCode from "qrcode";
import JSZip from "jszip";

interface ThemeConfig {
  name: string;
  icon: string;
  outerBg: string;
  accentText: string;
  textMain: string;
  textMuted: string;
  borderDivider: string;
  headerBg: string;
  headerBorder: string;
  headerText: string;
  railBg: string;
  railBorder: string;
  railActiveTab: string;
  railInactiveTab: string;
  asideBg: string;
  asideBorder: string;
  asideHeaderBorder: string;
  asideText: string;
  asideActiveItem: string;
  asideInactiveItem: string;
  tabsBarBg: string;
  tabsBarBorder: string;
  tabActiveBg: string;
  tabActiveText: string;
  tabInactiveBg: string;
  tabInactiveText: string;
  editorBg: string;
  editorText: string;
  editorLineNumBg: string;
  editorLineNumText: string;
  editorLineNumBorder: string;
  editorCaret: string;
  footerBg: string;
  footerBorder: string;
  footerText: string;
  buttonSecondary: string;
  badgeE2E: string;
}

const themeStyles: Record<"cyber" | "dracula" | "solarized" | "light", ThemeConfig> = {
  cyber: {
    name: "Cyber Slate",
    icon: "🌌",
    outerBg: "bg-[#0F172A]",
    accentText: "text-indigo-400",
    textMain: "text-slate-300",
    textMuted: "text-slate-500",
    borderDivider: "border-slate-800",
    headerBg: "bg-[#1E293B]",
    headerBorder: "border-slate-800",
    headerText: "text-slate-200",
    railBg: "bg-slate-900",
    railBorder: "border-slate-800",
    railActiveTab: "bg-indigo-500/10 text-indigo-400 border-l-2 border-indigo-500 rounded-none w-full flex justify-center",
    railInactiveTab: "text-slate-500 hover:text-slate-300",
    asideBg: "bg-[#1E293B]/80",
    asideBorder: "border-[#1e293b]/90 border-slate-800",
    asideHeaderBorder: "border-slate-800/60",
    asideText: "text-slate-300",
    asideActiveItem: "bg-indigo-500/10 text-indigo-350 border-l-2 border-indigo-500 pl-2 rounded-none",
    asideInactiveItem: "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40",
    tabsBarBg: "bg-[#0f172a]",
    tabsBarBorder: "border-slate-800",
    tabActiveBg: "bg-[#07090e]",
    tabActiveText: "text-indigo-350 border-t-2 border-t-indigo-500",
    tabInactiveBg: "bg-[#1e293b]/50",
    tabInactiveText: "text-slate-500 hover:text-slate-300 hover:bg-[#1e293b]/80",
    editorBg: "bg-[#07090e]",
    editorText: "text-[#f8fafc]",
    editorLineNumBg: "bg-[#050811]",
    editorLineNumText: "text-slate-600",
    editorLineNumBorder: "border-slate-900/60",
    editorCaret: "caret-indigo-550",
    footerBg: "bg-[#0b0f19]",
    footerBorder: "border-slate-800",
    footerText: "text-slate-500",
    buttonSecondary: "bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-750",
    badgeE2E: "bg-emerald-555/10 border-emerald-500/20 text-emerald-400"
  },
  dracula: {
    name: "Dracula",
    icon: "🧛",
    outerBg: "bg-[#282a36]",
    accentText: "text-[#bd93f9]",
    textMain: "text-[#f8f8f2]",
    textMuted: "text-[#6272a4]",
    borderDivider: "border-[#44475a]",
    headerBg: "bg-[#191a21]",
    headerBorder: "border-[#44475a]",
    headerText: "text-[#f8f8f2]",
    railBg: "bg-[#191a21]",
    railBorder: "border-[#44475a]",
    railActiveTab: "bg-[#bd93f9]/10 text-[#ff79c6] border-l-2 border-[#bd93f9] rounded-none w-full flex justify-center",
    railInactiveTab: "text-[#6272a4] hover:text-[#f8f8f2]",
    asideBg: "bg-[#282a36]/90",
    asideBorder: "border-[#44475a]",
    asideHeaderBorder: "border-[#44475a]/60",
    asideText: "text-[#f8f8f2]",
    asideActiveItem: "bg-[#bd93f9]/10 text-[#ff79c6] border-l-2 border-[#ff79c6] pl-2 rounded-none",
    asideInactiveItem: "text-[#6272a4] hover:text-[#f8f8f2] hover:bg-[#44475a]/25",
    tabsBarBg: "bg-[#191a21]",
    tabsBarBorder: "border-[#44475a]",
    tabActiveBg: "bg-[#282a36]",
    tabActiveText: "text-[#ff79c6] border-t-2 border-t-[#ff79c6]",
    tabInactiveBg: "bg-[#21222c]",
    tabInactiveText: "text-[#6272a4] hover:text-[#f8f8f2] hover:bg-[#282a36]",
    editorBg: "bg-[#282a36]",
    editorText: "text-[#f8f8f2]",
    editorLineNumBg: "bg-[#1e1f29]",
    editorLineNumText: "text-[#6272a4]",
    editorLineNumBorder: "border-[#44475a]/30",
    editorCaret: "caret-[#ff79c6]",
    footerBg: "bg-[#191a21]",
    footerBorder: "border-[#44475a]",
    footerText: "text-[#6272a4]",
    buttonSecondary: "bg-[#1e1f29] hover:bg-[#282a36] text-[#f8f8f2] border-[#44475a]",
    badgeE2E: "bg-[#50fa7b]/10 border-[#50fa7b]/30 text-[#50fa7b]"
  },
  solarized: {
    name: "Solarized Dark",
    icon: "☀️",
    outerBg: "bg-[#002b36]",
    accentText: "text-[#2aa198]",
    textMain: "text-[#93a1a1]",
    textMuted: "text-[#586e75]",
    borderDivider: "border-[#073642]",
    headerBg: "bg-[#002b36]",
    headerBorder: "border-[#073642]",
    headerText: "text-[#93a1a1]",
    railBg: "bg-[#001e26]",
    railBorder: "border-[#073642]",
    railActiveTab: "bg-[#2aa198]/15 text-[#2aa198] border-l-2 border-[#2aa198] rounded-none w-full flex justify-center",
    railInactiveTab: "text-[#586e75] hover:text-[#93a1a1]",
    asideBg: "bg-[#073642]/90",
    asideBorder: "border-[#073642]",
    asideHeaderBorder: "border-[#002b36]/60",
    asideText: "text-[#93a1a1]",
    asideActiveItem: "bg-[#2aa198]/10 text-[#2aa198] border-l-2 border-[#2aa198] pl-2 rounded-none",
    asideInactiveItem: "text-[#586e75] hover:text-[#93a1a1] hover:bg-[#002b36]/40",
    tabsBarBg: "bg-[#002b36]",
    tabsBarBorder: "border-[#073642]",
    tabActiveBg: "bg-[#002b36]",
    tabActiveText: "text-[#2aa198] border-t-2 border-t-[#2aa198]",
    tabInactiveBg: "bg-[#073642]",
    tabInactiveText: "text-[#586e75] hover:text-[#93a1a1] hover:bg-[#002b36]/60",
    editorBg: "bg-[#002b36]",
    editorText: "text-[#93a1a1]",
    editorLineNumBg: "bg-[#002130]",
    editorLineNumText: "text-[#586e75]",
    editorLineNumBorder: "border-[#073642]/45",
    editorCaret: "caret-[#268bd2]",
    footerBg: "bg-[#00212b]",
    footerBorder: "border-[#073642]",
    footerText: "text-[#586e75]",
    buttonSecondary: "bg-[#002b36]/80 hover:bg-[#073642] text-[#93a1a1] border-[#073642]",
    badgeE2E: "bg-[#2aa198]/15 border-[#2aa198]/30 text-[#2aa198]"
  },
  light: {
    name: "Light Mode",
    icon: "💡",
    outerBg: "bg-[#f8fafc]",
    accentText: "text-indigo-600",
    textMain: "text-slate-800",
    textMuted: "text-slate-400",
    borderDivider: "border-slate-200",
    headerBg: "bg-white",
    headerBorder: "border-slate-200 shadow-xs",
    headerText: "text-slate-800",
    railBg: "bg-slate-50",
    railBorder: "border-slate-200",
    railActiveTab: "bg-indigo-50 text-indigo-600 border-l-2 border-indigo-600 rounded-none w-full flex justify-center",
    railInactiveTab: "text-slate-400 hover:text-slate-800",
    asideBg: "bg-white",
    asideBorder: "border-slate-200",
    asideHeaderBorder: "border-slate-200",
    asideText: "text-slate-800",
    asideActiveItem: "bg-indigo-50/70 text-indigo-600 border-l-2 border-indigo-600 pl-2 rounded-none",
    asideInactiveItem: "text-slate-500 hover:text-slate-800 hover:bg-slate-100/60",
    tabsBarBg: "bg-[#f8fafc]",
    tabsBarBorder: "border-slate-200",
    tabActiveBg: "bg-white",
    tabActiveText: "text-indigo-600 border-t-2 border-t-indigo-600",
    tabInactiveBg: "bg-slate-100",
    tabInactiveText: "text-slate-400 hover:text-slate-800 hover:bg-slate-50",
    editorBg: "bg-white",
    editorText: "text-slate-800",
    editorLineNumBg: "bg-slate-50",
    editorLineNumText: "text-slate-400",
    editorLineNumBorder: "border-slate-200",
    editorCaret: "caret-indigo-600",
    footerBg: "bg-slate-50",
    footerBorder: "border-slate-200",
    footerText: "text-slate-500",
    buttonSecondary: "bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200 shadow-xs",
    badgeE2E: "bg-emerald-50 border-emerald-200 text-emerald-600"
  }
};

// Side-by-side line diff helper using dynamic programming (Longest Common Subsequence)
interface DiffLine {
  originalNum?: number;
  modifiedNum?: number;
  type: "added" | "removed" | "unchanged";
  text: string;
}

function computeLineDiff(original: string, modified: string) {
  const origLines = original.split("\n");
  const modLines = modified.split("\n");

  const dp: number[][] = Array.from({ length: origLines.length + 1 }, () =>
    new Array(modLines.length + 1).fill(0)
  );

  for (let i = 1; i <= origLines.length; i++) {
    for (let j = 1; j <= modLines.length; j++) {
      if (origLines[i - 1] === modLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const left: DiffLine[] = [];
  const right: DiffLine[] = [];

  let i = origLines.length;
  let j = modLines.length;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && origLines[i - 1] === modLines[j - 1]) {
      const lineText = origLines[i - 1];
      left.unshift({ originalNum: i, type: "unchanged", text: lineText });
      right.unshift({ modifiedNum: j, type: "unchanged", text: lineText });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      const lineText = modLines[j - 1];
      left.unshift({ type: "unchanged", text: "" });
      right.unshift({ modifiedNum: j, type: "added", text: lineText });
      j--;
    } else {
      const lineText = origLines[i - 1];
      left.unshift({ originalNum: i, type: "removed", text: lineText });
      right.unshift({ type: "unchanged", text: "" });
      i--;
    }
  }

  return { left, right };
}

// Automatically detect syntax highlighter language dynamically based on filename/path extension
export function detectLanguage(fileName: string): string {
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
  const [workspaceTheme, setWorkspaceTheme] = useState<"cyber" | "dracula" | "solarized" | "light">(() => {
    const saved = localStorage.getItem("workspace_theme");
    return (saved === "cyber" || saved === "dracula" || saved === "solarized" || saved === "light") ? saved : "cyber";
  });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem("workspace_sound_enabled");
    return saved !== "false";
  });
  const [diffMode, setDiffMode] = useState(false);

  // Synthesize non-intrusive elegant audio signals using pure Web Audio API
  const playSoundCue = (type: "join" | "conflict" | "save") => {
    // Only play if sound cues are enabled globally by user
    const isMuted = localStorage.getItem("workspace_sound_enabled") === "false";
    if (isMuted) return;
    
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const playTone = (freq: number, duration: number, oscType: OscillatorType, delay = 0, gainVal = 0.08) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.type = oscType;
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        
        gainNode.gain.setValueAtTime(gainVal, ctx.currentTime + delay);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + duration);
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + duration);
      };

      if (type === "join") {
        // High, pleasant chime sequence (rising triad)
        playTone(523.25, 0.35, "sine", 0, 0.08); // C5
        playTone(659.25, 0.35, "sine", 0.08, 0.08); // E5
        playTone(783.99, 0.45, "sine", 0.16, 0.08); // G5
      } else if (type === "conflict") {
        // Cautionary double pulse (dissonant semitone)
        playTone(293.66, 0.25, "triangle", 0, 0.12); // D4
        playTone(311.13, 0.25, "triangle", 0.08, 0.12); // D#4 (dissonant tension)
      } else if (type === "save") {
        // Soft digital confirmation click
        playTone(880, 0.05, "sine", 0, 0.06); // A5
        playTone(1318.51, 0.12, "sine", 0.04, 0.05); // E6
      }
    } catch (err) {
      console.warn("Could not play sound cue:", err);
    }
  };

  // Finder & Sidebar States
  const [sidebarTab, setSidebarTab] = useState<"explorer" | "search" | "users" | "activity" | "simulator">("explorer");
  const [newFileName, setNewFileName] = useState("");
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameOldPath, setRenameOldPath] = useState("");
  const [renameNewPath, setRenameNewPath] = useState("");
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

  // Autosave and Draft states
  const [lastAutosavedStatus, setLastAutosavedStatus] = useState("Sync clean");
  const [autosaveContent, setAutosaveContent] = useState<string | null>(null);
  const [autosaveDraftTimestamp, setAutosaveDraftTimestamp] = useState<number | null>(null);
  const [showAutosaveBanner, setShowAutosaveBanner] = useState(false);

  // QR Code Join Modal State
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  const t = themeStyles[workspaceTheme];

  useEffect(() => {
    if (showQrModal && roomId) {
      const inviteUrl = roomPassword
        ? `${window.location.origin}/?join=${roomId}&pwd=${encodeURIComponent(roomPassword)}`
        : `${window.location.origin}/?join=${roomId}`;

      QRCode.toDataURL(inviteUrl, {
        width: 300,
        margin: 1,
        color: {
          dark: "#0F172A",
          light: "#FFFFFF"
        }
      })
      .then(url => {
        setQrDataUrl(url);
      })
      .catch(err => {
        console.error("Failed to generate real QR Code", err);
      });
    }
  }, [showQrModal, roomId, roomPassword]);

  // Simulated opponents (for single-user demoing)
  const [isSimulatedOpponentJoined, setIsSimulatedOpponentJoined] = useState(false);
  const [opponentLatency, setOpponentLatency] = useState(150);

  // Logs / Toasts Notifications
  const [toasts, setToasts] = useState<Array<{ id: string; text: string; type: "success" | "info" | "warning" }>>([]);

  // Refs to prevent stale closure issues in persistent WebSocket listeners
  const activeTabRef = useRef(activeTab);
  const hasUnsavedChangesRef = useRef(hasUnsavedChanges);
  const editorContentRef = useRef(editorContent);
  const userNameRef = useRef(userName);
  const roomPasswordRef = useRef(roomPassword);

  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);
  useEffect(() => { hasUnsavedChangesRef.current = hasUnsavedChanges; }, [hasUnsavedChanges]);
  useEffect(() => { editorContentRef.current = editorContent; }, [editorContent]);
  useEffect(() => { userNameRef.current = userName; }, [userName]);
  useEffect(() => { roomPasswordRef.current = roomPassword; }, [roomPassword]);

  // Global Keyboard Shortcuts Event Listener
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.ctrlKey || e.metaKey;

      // Esc to close modals
      if (e.key === "Escape") {
        setShowShortcutsModal(false);
        setShowNewFileModal(false);
        setShowQrModal(false);
        return;
      }

      // 1. Save Active File: Ctrl+S / Cmd+S
      if (isCmdOrCtrl && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (activeTab) {
          saveAndUploadFile(activeTab);
        } else {
          addToast("No active file to save.", "warning");
        }
        return;
      }

      // 2. Format Active Code: Ctrl+E / Cmd+E
      if (isCmdOrCtrl && e.key.toLowerCase() === "e") {
        e.preventDefault();
        formatActiveCode();
        return;
      }

      // 3. Focus/Toggle Search Tab: Ctrl+F / Cmd+F
      if (isCmdOrCtrl && e.key.toLowerCase() === "f") {
        e.preventDefault();
        setSidebarTab("search");
        setTimeout(() => {
          const inputEl = document.getElementById("global-search-query-field") as HTMLInputElement;
          if (inputEl) {
            inputEl.focus();
            inputEl.select();
          }
        }, 50);
        return;
      }

      // 4. Toggle Keyboard Shortcuts Modal: Ctrl+/ or Cmd+/ or Ctrl+Shift+K
      if ((isCmdOrCtrl && e.key === "/") || (isCmdOrCtrl && e.shiftKey && e.key.toLowerCase() === "k")) {
        e.preventDefault();
        setShowShortcutsModal(prev => !prev);
        return;
      }

      // 5. Open New Collaborative File Modal: Ctrl+Shift+N (with Ctrl+Alt+N fallback)
      if (isCmdOrCtrl && (e.shiftKey || e.altKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        setShowNewFileModal(true);
        return;
      }

      // 6. Download All Files as structured ZIP: Ctrl+Shift+D (with Ctrl+Alt+D fallback)
      if (isCmdOrCtrl && (e.shiftKey || e.altKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        downloadAllFilesAsZip();
        return;
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [activeTab, sidebarTab, editorContent, files]);

  // Refs for tracking editing states
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const wsUrl = useRef("");
  const reconnectTimerRef = useRef<any>(null);
  const isManuallyDisconnectedRef = useRef(false);

  // Toast adder helper
  const addToast = (text: string, type: "success" | "info" | "warning" = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Memoized editor line calculations (Low lag performance optimization)
  const lineCount = useMemo(() => {
    return editorContent.split("\n").length;
  }, [editorContent]);

  // Memoized side-by-side diff calculations for active file modifications review
  const { left: diffLeft, right: diffRight } = useMemo(() => {
    if (!activeTab || !files[activeTab]) return { left: [], right: [] };
    const originalContent = files[activeTab].content || "";
    return computeLineDiff(originalContent, editorContent);
  }, [activeTab, files, editorContent]);

  // Sync state with editor when file changes
  useEffect(() => {
    if (files[activeTab]) {
      setEditorContent(files[activeTab].content);
      setHasUnsavedChanges(false);
      setDiffMode(false);
    }
  }, [activeTab, files]);

  // Check for autosaved draft when active tab, files, or roomId changes
  useEffect(() => {
    if (activeTab && files[activeTab]) {
      const key = `autosave_draft_${roomId || "lobby"}_${activeTab}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed.content === "string" && parsed.content !== files[activeTab].content) {
            setAutosaveContent(parsed.content);
            setAutosaveDraftTimestamp(parsed.timestamp || Date.now());
            setShowAutosaveBanner(true);
            return;
          }
        } catch (e) {
          console.error("Failed to parse autosave draft", e);
        }
      }
    }
    // If no draft exists or it is identical to saved file content, hide the banner
    setShowAutosaveBanner(false);
    setAutosaveContent(null);
    setAutosaveDraftTimestamp(null);
  }, [activeTab, files[activeTab]?.content, roomId]);

  // Periodic/debounced autosave to localStorage & Real-time Server Sync
  useEffect(() => {
    if (!activeTab || !files[activeTab]) return;

    // Only set autosave if there are actual unsaved differences
    const fileSavedContent = files[activeTab].content;
    if (editorContent === fileSavedContent) {
      // If content is clean, we can clear the draft to save space
      const key = `autosave_draft_${roomId || "lobby"}_${activeTab}`;
      localStorage.removeItem(key);
      if (lastAutosavedStatus !== "Sync clean") {
        setLastAutosavedStatus("Sync clean");
      }
      return;
    }

    if (lastAutosavedStatus !== "Unsaved changes...") {
      setLastAutosavedStatus("Unsaved changes...");
    }

    const timer = setTimeout(() => {
      // 1. Save local backup to localStorage
      const key = `autosave_draft_${roomId || "lobby"}_${activeTab}`;
      const payload = {
        content: editorContent,
        timestamp: Date.now()
      };
      localStorage.setItem(key, JSON.stringify(payload));
      
      // 2. Automatically sync to rooms in real-time if connected online
      if (socket && isConnected && !isOfflineMode) {
        const encryptedCodeContent = encryptPayload(editorContent, roomPassword);
        socket.send(JSON.stringify({
          type: "update_file",
          path: activeTab,
          content: encryptedCodeContent,
          version: files[activeTab].version,
          userName
        }));
        
        setHasUnsavedChanges(false);
        const timeStr = new Date().toLocaleTimeString();
        setLastAutosavedStatus(`Auto-synced at ${timeStr}`);
      } else {
        const timeStr = new Date().toLocaleTimeString();
        setLastAutosavedStatus(`Draft backup saved locally at ${timeStr}`);
      }
    }, 1500); // Trigger auto-sync 1.5 seconds after typing stops

    return () => clearTimeout(timer);
  }, [editorContent, activeTab, files[activeTab]?.content, roomId, socket, isConnected, isOfflineMode, roomPassword, userName]);

  // Restore detected autosave draft
  const restoreAutosaveDraft = () => {
    if (autosaveContent !== null) {
      setEditorContent(autosaveContent);
      setHasUnsavedChanges(true);
      setShowAutosaveBanner(false);
      addToast("Successfully restored autosaved draft buffer.", "success");
    }
  };

  // Discard/Dismiss the detected autosave draft
  const discardAutosaveDraft = () => {
    if (activeTab) {
      const key = `autosave_draft_${roomId || "lobby"}_${activeTab}`;
      localStorage.removeItem(key);
      setShowAutosaveBanner(false);
      setAutosaveContent(null);
      setAutosaveDraftTimestamp(null);
      addToast("Autosaved draft buffer discarded.", "info");
    }
  };

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

    isManuallyDisconnectedRef.current = false;
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

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
            playSoundCue("join");
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

            // If active tab is the updated file, decide if we can safely update the editor content
            if (activeTabRef.current === updatedFile.path) {
              if (updatedFile.updatedBy === userNameRef.current) {
                // The update was submitted by us!
                // Only reset hasUnsavedChanges if current editorContent matches the updated file content
                if (editorContentRef.current === updatedFile.content) {
                  setHasUnsavedChanges(false);
                }
              } else {
                // The update was submitted by someone else!
                // Only overwrite if we don't have active local unsaved changes or if content is identical
                if (!hasUnsavedChangesRef.current || editorContentRef.current === updatedFile.content) {
                  setEditorContent(updatedFile.content);
                  setHasUnsavedChanges(false);
                } else {
                  // Opponent updated while we have unsaved local changes!
                  addToast(`Conflict warning: ${updatedFile.updatedBy} updated ${updatedFile.name} while you had edits.`, "warning");
                  playSoundCue("conflict");
                }
              }
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
            playSoundCue("conflict");
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
            setOpenTabs(prev => {
              const filtered = prev.filter(t => t !== data.path);
              if (activeTabRef.current === data.path) {
                setActiveTab(filtered.length > 0 ? filtered[0] : "");
              }
              return filtered;
            });
            if (data.activity) {
              setActivityLog(prev => [...prev, data.activity]);
            }
            addToast(`File was deleted: ${data.path}`, "warning");
            break;
          }

          case "file_rename": {
            const { oldPath, newPath, file, activity } = data;
            const decryptedFile: FileItem = {
              ...file,
              content: decryptPayload(file.content, pword),
              history: file.history.map((h: any) => ({
                ...h,
                content: decryptPayload(h.content, pword)
              }))
            };

            setFiles(prev => {
              const current = { ...prev };
              delete current[oldPath];
              current[newPath] = decryptedFile;
              return current;
            });

            setOpenTabs(prev => prev.map(t => t === oldPath ? newPath : t));
            
            if (activeTabRef.current === oldPath) {
              setActiveTab(newPath);
              setEditorContent(decryptedFile.content);
              setHasUnsavedChanges(false);
            }

            if (activity) {
              setActivityLog(prev => [...prev, activity]);
            }
            addToast(`File renamed: ${oldPath} -> ${newPath}`, "success");
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

      // Auto-reconnect if not disconnected manually
      if (!isManuallyDisconnectedRef.current && roomCode) {
        if (!reconnectTimerRef.current) {
          addToast("Lost connection context. Retrying low-lag fast reconnect in 3s...", "warning");
          reconnectTimerRef.current = setTimeout(() => {
            reconnectTimerRef.current = null;
            addToast("Attempting room reconnection...", "info");
            connectToSocket(roomCode, pword, userNameInput);
          }, 3000);
        }
      }
    };

    ws.onerror = (err) => {
      console.error("WebSocket connection failure", err);
      setIsConnected(false);
    };

    setSocket(ws);
  };

  // Close connection helper
  const disconnectSocket = () => {
    isManuallyDisconnectedRef.current = true;
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
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

  // Automated premium code beautifier function
  const formatActiveCode = () => {
    if (!activeTab || !files[activeTab]) {
      addToast("No active file open to format.", "warning");
      return;
    }
    const currentLang = files[activeTab].language || "javascript";
    try {
      const formatted = prettifyCode(editorContent, currentLang);
      if (formatted === editorContent) {
        addToast("Code is already clean and complies with premium formatting rules.", "info");
      } else {
        setEditorContent(formatted);
        setHasUnsavedChanges(true);
        addToast(`Successfully prettified active code (${currentLang}) using automated rules.`, "success");
      }
    } catch (err) {
      addToast("Failed to format code: " + (err instanceof Error ? err.message : String(err)), "warning");
    }
  };

  // Save & Upload (Commits to room state)
  const saveAndUploadFile = (filePath: string, customContent?: string) => {
    const finalContent = customContent !== undefined ? customContent : editorContent;
    const file = files[filePath];
    if (!file) return;

    // Clear autosave draft on manual save trigger
    const draftKey = `autosave_draft_${roomId || "lobby"}_${filePath}`;
    localStorage.removeItem(draftKey);
    setLastAutosavedStatus("Sync clean");
    setAutosaveContent(null);
    setAutosaveDraftTimestamp(null);
    setShowAutosaveBanner(false);

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
      playSoundCue("save");
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
      playSoundCue("save");
    } else {
      addToast("Network connection missing, saving to offline cache.", "warning");
      setOfflineChanges(prev => ({
        ...prev,
        [filePath]: { content: finalContent, time: Date.now() }
      }));
      playSoundCue("save");
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
        language: detectLanguage(path),
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

  // Safe file rename action handler (supporting references scan and update)
  const handleRenameFile = (oldPath: string, newPath: string) => {
    if (!newPath || !newPath.trim()) {
      addToast("File name cannot be empty.", "warning");
      return;
    }
    const trimmedNewPath = newPath.trim();
    if (trimmedNewPath === oldPath) {
      setShowRenameModal(false);
      return;
    }

    // Prevent unsafe naming styles
    if (trimmedNewPath.includes(" ") || trimmedNewPath.includes("..") || trimmedNewPath.startsWith("/") || trimmedNewPath.endsWith("/")) {
      addToast("Invalid file name format. Spacings and trailing slashes are prohibited.", "warning");
      return;
    }

    if (isOfflineMode) {
      if (files[trimmedNewPath]) {
        addToast(`A file at path '${trimmedNewPath}' already exists.`, "warning");
        return;
      }
      const file = files[oldPath];
      if (!file) return;

      const isEditingTarget = oldPath === activeTab;
      const resolvedContent = isEditingTarget ? editorContent : file.content;
      const oldName = file.name;
      const newName = trimmedNewPath.split(/[/\\]/).pop() || trimmedNewPath;

      const nextVersion = file.version + 1;
      const renamedFile: FileItem = {
        ...file,
        id: trimmedNewPath,
        path: trimmedNewPath,
        name: newName,
        content: resolvedContent,
        language: detectLanguage(newName),
        version: nextVersion,
        updatedAt: Date.now(),
        updatedBy: userName,
        history: [
          ...file.history,
          { version: nextVersion, content: resolvedContent, updatedAt: Date.now(), updatedBy: userName }
        ]
      };

      setFiles(prev => {
        const next = { ...prev };
        delete next[oldPath];
        next[trimmedNewPath] = renamedFile;

        // Perform safe global search and replace of all references in the workspace offline
        Object.keys(next).forEach(pathKey => {
          if (pathKey !== trimmedNewPath) {
            const f = next[pathKey];
            let updatedContent = f.content;
            let changed = false;
            if (updatedContent.includes(oldPath)) {
              updatedContent = updatedContent.split(oldPath).join(trimmedNewPath);
              changed = true;
            }
            if (updatedContent.includes(oldName)) {
              updatedContent = updatedContent.split(oldName).join(newName);
              changed = true;
            }
            if (changed) {
              const fNextVersion = f.version + 1;
              next[pathKey] = {
                ...f,
                content: updatedContent,
                version: fNextVersion,
                updatedAt: Date.now(),
                updatedBy: userName,
                history: [
                  ...f.history,
                  { version: fNextVersion, content: updatedContent, updatedAt: Date.now(), updatedBy: userName }
                ]
              };
            }
          }
        });

        return next;
      });

      setOpenTabs(prev => prev.map(t => t === oldPath ? trimmedNewPath : t));
      if (activeTab === oldPath) {
        setActiveTab(trimmedNewPath);
        setEditorContent(resolvedContent);
        setHasUnsavedChanges(false);
      }
      setShowRenameModal(false);
      addToast(`Successfully renamed file and updated references inside offline cache!`, "success");
      return;
    }

    if (socket && isConnected) {
      const isEditingTarget = oldPath === activeTab;
      const activeContentToSend = isEditingTarget ? editorContent : undefined;

      socket.send(JSON.stringify({
        type: "rename_file",
        oldPath,
        newPath: trimmedNewPath,
        userName,
        activeContent: activeContentToSend
      }));
      setShowRenameModal(false);
    } else {
      addToast("Failed to rename. No WebSocket network connection available.", "warning");
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
          language: detectLanguage(fileName),
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
              language: detectLanguage(file.name),
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
            language: detectLanguage(file.name),
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
      playSoundCue("join");
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
    playSoundCue("conflict");
  };

  // Helper to copy Room Link
  const copyRoomLink = () => {
    const shareUrl = roomPassword
      ? `${window.location.origin}/?join=${roomId}&pwd=${encodeURIComponent(roomPassword)}`
      : `${window.location.origin}/?join=${roomId}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
    addToast("Collaborative room link copied to dashboard clipboard!", "success");
  };

  // Helper to directly download active file contents client-side with full offline and sandbox support
  const downloadFileDirectly = () => {
    if (!activeTab || !files[activeTab]) return;
    try {
      const file = files[activeTab];
      const blob = new Blob([editorContent], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      addToast(`Direct premium download of ${file.name} started successfully.`, "success");
    } catch (err) {
      addToast("Failed to generate direct download stream.", "warning");
    }
  };

  // Archive and download all workspace files as a single structured ZIP file
  const downloadAllFilesAsZip = async () => {
    const fileKeys = Object.keys(files);
    if (fileKeys.length === 0) {
      addToast("No files exist in the current room to package.", "warning");
      return;
    }

    try {
      const zip = new JSZip();

      fileKeys.forEach((pathKey) => {
        const file = files[pathKey];
        // If the path matches the active editor tab, capture the live editor content
        const finalContent = pathKey === activeTab ? editorContent : file.content;
        
        // Add file into ZIP under its relative path structure (like 'src/App.tsx')
        zip.file(file.path, finalContent);
      });

      // Generate structured zip blob client-side
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = url;
      // Name ZIP file cleanly based on Room ID or fallback
      const cleanRoomName = roomId ? roomId.trim().toLowerCase() : "collaborative";
      link.download = `project-${cleanRoomName}.zip`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      addToast(`Successfully generated and downloaded project-${cleanRoomName}.zip archive!`, "success");
    } catch (err) {
      console.error("ZIP Generation error:", err);
      addToast("Failed to compile workspace ZIP archive.", "warning");
    }
  };

  // Automatically parse invite link from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inviteRoom = params.get("join");
    const invitePwd = params.get("pwd");
    if (inviteRoom) {
      setJoinRoomId(inviteRoom);
      addToast(`Found invitation to join Room: ${inviteRoom}`, "info");
      if (invitePwd) {
        setRoomPassword(invitePwd);
        addToast("Autofilled invitation room password.", "info");
      }
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
        <div className={`flex-1 flex flex-col min-h-0 relative ${t.outerBg} ${t.textMain}`}>
          
          {/* HEADER BAR */}
          <header className={`h-12 border-b ${t.headerBorder} ${t.headerBg} ${t.headerText} flex items-center justify-between px-4 z-10 shrink-0 select-none`}>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-indigo-500 rounded flex items-center justify-center shrink-0">
                  <div className="w-3 h-3 bg-white rotate-45"></div>
                </div>
                <span className="font-bold text-white tracking-tight text-sm">SYNCHRONI</span>
              </div>
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-slate-900/50 rounded-md border border-slate-700/50">
                <span className="text-[10px] uppercase font-bold text-slate-500">Room</span>
                <span className="font-mono text-indigo-400 font-bold ml-2">{roomId}</span>
                <button 
                  onClick={copyRoomLink} 
                  title="Copy permanent room invites"
                  className="hover:text-white ml-2 transition-colors cursor-pointer"
                >
                  <Share2 className="w-3 h-3 text-slate-400 hover:text-indigo-400 transition-colors" />
                </button>
                <button 
                  onClick={() => setShowQrModal(true)} 
                  title="Show Room QR Code for instant scanning / access via mobile or second screen"
                  className="hover:text-white ml-1.5 transition-colors cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5 text-slate-400 hover:text-emerald-400 transition-colors" />
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
              {/* Dynamic Theme Picker */}
              <div className="flex items-center gap-2 border-r border-slate-800 pr-3 mr-1">
                <span className="text-[10px] uppercase font-bold font-mono text-slate-500 hidden sm:inline">Theme:</span>
                <select
                  value={workspaceTheme}
                  onChange={e => {
                    const sel = e.target.value as any;
                    setWorkspaceTheme(sel);
                    localStorage.setItem("workspace_theme", sel);
                    addToast(`Theme switched to: ${themeStyles[sel].name}`, "success");
                  }}
                  className="bg-slate-900 border border-slate-700 text-slate-200 text-[11px] font-mono rounded px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 cursor-pointer hover:border-slate-600 transition-colors"
                >
                  <option value="cyber" className="bg-[#0f172a] text-slate-250">🌌 Cyber Slate</option>
                  <option value="dracula" className="bg-[#1e1f29] text-[#f8f8f2]">🧛 Dracula</option>
                  <option value="solarized" className="bg-[#002b36] text-[#93a1a1]">☀️ Solarized</option>
                  <option value="light" className="bg-white text-slate-800">💡 Light Mode</option>
                </select>
              </div>

              {/* Sound Cues Mute/Unmute Toggle */}
              <div className="flex items-center gap-1.5 border-r border-slate-800 pr-3 mr-1">
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !soundEnabled;
                    setSoundEnabled(nextVal);
                    localStorage.setItem("workspace_sound_enabled", String(nextVal));
                    addToast(nextVal ? "Sound notifications enabled" : "Sound notifications muted", "info");
                    // Play a quick test sound cue if unmuting
                    if (nextVal) {
                      setTimeout(() => {
                        playSoundCue("save");
                      }, 50);
                    }
                  }}
                  title={soundEnabled ? "Mute sound cues notification" : "Unmute sound cues notification"}
                  className="flex items-center gap-1.5 text-[11px] font-mono px-2 py-1 select-none transition-colors border border-slate-700 hover:border-indigo-500 rounded bg-slate-900 cursor-pointer text-slate-200"
                >
                  {soundEnabled ? (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider hidden md:inline">Sounds On</span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider hidden md:inline">Muted</span>
                    </>
                  )}
                </button>
              </div>

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
            <nav className={`${t.railBg} border-r ${t.railBorder} w-12 hidden md:flex flex-col items-center py-4 justify-between shrink-0`}>
              <div className="flex flex-col gap-5 items-center w-full">
                <button
                  onClick={() => setSidebarTab("explorer")}
                  title="Finder File Explorer"
                  className={`p-2 rounded transition-all relative group cursor-pointer ${
                    sidebarTab === "explorer" ? t.railActiveTab : t.railInactiveTab
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
                    sidebarTab === "search" ? t.railActiveTab : t.railInactiveTab
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
                    sidebarTab === "users" ? t.railActiveTab : t.railInactiveTab
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
                    sidebarTab === "activity" ? t.railActiveTab : t.railInactiveTab
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
                    sidebarTab === "simulator" ? t.railActiveTab : t.railInactiveTab
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
            <aside className={`w-full md:w-64 ${t.asideBg} border-r ${t.asideBorder} flex flex-col shrink-0 min-w-0 ${t.asideText}`}>
              
              {/* Sidebar Header Category */}
              <div className={`p-3 border-b ${t.asideHeaderBorder} pb-3 flex items-center justify-between`}>
                <h2 className="text-[10px] uppercase font-bold text-slate-500 tracking-widest font-mono">
                  {sidebarTab === "explorer" && "Finder / Workspace"}
                  {sidebarTab === "search" && "Search & Replace"}
                  {sidebarTab === "users" && "Participants"}
                  {sidebarTab === "activity" && "Activity Log"}
                  {sidebarTab === "simulator" && "Co-op Simulator"}
                </h2>
                
                {sidebarTab === "explorer" && (
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={downloadAllFilesAsZip}
                      title="Download whole project as structured ZIP"
                      className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                    >
                      <FolderDown className="w-4 h-4 text-emerald-500" />
                    </button>
                    <button 
                      onClick={() => setShowNewFileModal(true)} 
                      title="Add collaborative file"
                      className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
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
                                isActive ? t.asideActiveItem : t.asideInactiveItem
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
                        id="global-search-query-field"
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search pattern... (Ctrl+F)"
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

                    <div className="border-t border-slate-800/80 pt-3 space-y-2">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 font-mono block">Invite Opponent</span>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={copyRoomLink}
                          className="py-2 bg-slate-950/40 border border-slate-800 hover:bg-slate-900 text-slate-300 text-[10px] font-bold uppercase tracking-wider rounded flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <Share2 className="w-3.5 h-3.5 text-indigo-400" /> Copy Link
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowQrModal(true)}
                          className="py-2 bg-slate-950/40 border border-slate-800 hover:bg-slate-900 text-slate-300 text-[10px] font-bold uppercase tracking-wider rounded flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <QrCode className="w-3.5 h-3.5 text-emerald-400" /> Show QR
                        </button>
                      </div>
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
            <main className={`flex-1 flex flex-col min-w-0 ${t.editorBg}`}>
              
              {/* Tabs Bar Header */}
              <div className={`${t.tabsBarBg} border-b ${t.tabsBarBorder} flex items-center justify-between overflow-x-auto overflow-y-hidden shrink-0 select-none`}>
                <div className="flex items-center">
                  {openTabs.map((path) => {
                    const tabFile = files[path];
                    const isActive = path === activeTab;
                    if (!tabFile) return null;
                    return (
                      <div
                        key={path}
                        onClick={() => setActiveTab(path)}
                        className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono cursor-pointer border-r ${t.tabsBarBorder} transition-colors shrink-0 relative ${
                          isActive ? t.tabActiveBg + " " + t.tabActiveText : t.tabInactiveBg + " " + t.tabInactiveText
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
                  <button
                    type="button"
                    onClick={() => setShowShortcutsModal(true)}
                    title="Keyboard Shortcuts panel (Ctrl+/)"
                    className="text-[10px] font-mono font-bold uppercase tracking-wider px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded cursor-pointer transition-all flex items-center gap-1.5 shadow-lg border border-slate-750"
                  >
                    <Keyboard className="w-3.5 h-3.5 text-indigo-400" /> Shortcuts (Ctrl+/)
                  </button>

                  {files[activeTab] && (
                    <>
                      <button
                        type="button"
                        onClick={() => setDiffMode(prev => !prev)}
                        title="Toggle side-by-side comparison with server version"
                        className={`text-[10px] font-mono font-bold uppercase tracking-wider px-3 py-1.5 rounded cursor-pointer transition-all flex items-center gap-1.5 shadow-lg border ${
                          diffMode 
                            ? "bg-indigo-600/35 text-indigo-300 border-indigo-500 ring-1 ring-indigo-505/50" 
                            : "bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700/50"
                        }`}
                      >
                        <GitCompare className="w-3.5 h-3.5 text-indigo-400" />
                        {diffMode ? "Exit Diff" : "Diff View"}
                      </button>

                      <button
                        type="button"
                        onClick={formatActiveCode}
                        title="Format active code using programmatical rules (Premium)"
                        className="text-[10px] font-mono font-bold uppercase tracking-wider px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-indigo-200 rounded cursor-pointer transition-all flex items-center gap-1.5 shadow-lg border border-indigo-500/20 hover:border-indigo-500/45"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Format Code
                      </button>

                      <button
                        type="button"
                        onClick={downloadFileDirectly}
                        title="Direct raw download of this active file (Premium)"
                        className="text-[10px] font-mono font-bold uppercase tracking-wider px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded cursor-pointer transition-all flex items-center gap-1.5 shadow-lg border border-slate-700/50"
                      >
                        <Download className="w-3.5 h-3.5 text-indigo-400" /> Direct Download
                      </button>

                      <button
                        type="button"
                        onClick={() => saveAndUploadFile(activeTab)}
                        className={`text-[10px] font-mono font-bold uppercase tracking-wider px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded cursor-pointer transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-950/25 ${
                          hasUnsavedChanges ? "ring-2 ring-indigo-500 animate-pulse" : "opacity-90"
                        }`}
                      >
                        <Upload className="w-3.5 h-3.5" /> Save & Upload (Ctrl+S)
                      </button>
                    </>
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

                    {/* Autosave Draft Banner */}
                    {showAutosaveBanner && autosaveContent && (
                      <div className="bg-indigo-950/60 border-b border-indigo-500/20 text-indigo-200 px-4 py-2.5 flex items-center justify-between text-xs font-mono shrink-0 animate-fade-in select-none">
                        <span className="flex items-center gap-2 truncate">
                          <History className="w-4 h-4 text-indigo-400 shrink-0 animate-pulse" />
                          <span className="truncate">
                            Autosaved draft detected ({autosaveDraftTimestamp ? new Date(autosaveDraftTimestamp).toLocaleTimeString() : ""}) with unsaved changes.
                          </span>
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={restoreAutosaveDraft}
                            className="bg-indigo-600 hover:bg-indigo-550 text-white font-bold uppercase text-[9px] tracking-wider px-2 py-1 rounded cursor-pointer transition-colors"
                          >
                            Restore Draft
                          </button>
                          <button
                            type="button"
                            onClick={discardAutosaveDraft}
                            className="bg-slate-800 hover:bg-slate-705 text-slate-300 font-bold uppercase text-[9px] tracking-wider px-2 py-1 rounded cursor-pointer transition-colors border border-slate-700/50"
                          >
                            Discard
                          </button>
                        </div>
                      </div>
                    )}

                    {diffMode ? (
                      <div className="flex-1 flex flex-col min-h-0 animate-fade-in">
                        {/* Sub-header diff statistics banner */}
                        <div className={`px-4 py-2 border-b ${t.footerBorder} bg-slate-900/40 flex flex-col sm:flex-row gap-2 sm:items-center justify-between text-xs font-mono shrink-0 select-none`}>
                          <span className="flex items-center gap-2">
                            <GitCompare className="w-4 h-4 text-indigo-400" />
                            <span>Comparing <strong>your local unsaved draft</strong> with the <strong>last server-synced copy</strong> ({files[activeTab].name})</span>
                          </span>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 items-center">
                            {diffLeft.filter(l => l.type === "removed").length === 0 && diffRight.filter(l => l.type === "added").length === 0 ? (
                              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                                <Check className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> Sync Clean (No edits)
                              </span>
                            ) : (
                              <>
                                <span className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded bg-rose-500" />
                                  <span className="text-rose-400">{diffLeft.filter(l => l.type === "removed").length} deleted/modified lines</span>
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded bg-emerald-500" />
                                  <span className="text-emerald-400">{diffRight.filter(l => l.type === "added").length} added/modified lines</span>
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Side-by-side comparison tables */}
                        <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
                          {/* Left Panel: Server Copy */}
                          <div className="flex-1 flex flex-col min-h-0">
                            <div className="bg-slate-900/60 px-4 py-1.5 border-b border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400 select-none">
                              <span className="flex items-center gap-1.5 font-semibold">
                                <Laptop className="w-3.5 h-3.5 text-slate-400" />
                                SERVER VERSION (v{files[activeTab].version})
                              </span>
                              <span className="text-[10px] text-slate-500">Read-Only</span>
                            </div>

                            <div className="flex-1 overflow-auto font-mono text-xs leading-5 select-text p-4 bg-slate-950/20 relative">
                              <div className="flex min-w-max">
                                {/* Line numbers */}
                                <div className={`w-8 select-none text-right pr-3 border-r ${t.editorLineNumBorder} ${t.editorLineNumText} text-[10px]`}>
                                  {diffLeft.map((line, idx) => (
                                    <div key={idx} className="h-5">
                                      {line.originalNum !== undefined ? line.originalNum : "\u00A0"}
                                    </div>
                                  ))}
                                </div>
                                {/* Code line */}
                                <div className="pl-3 flex-1">
                                  {diffLeft.map((line, idx) => (
                                    <div
                                      key={idx}
                                      className={`h-5 px-1.5 rounded-xs whitespace-pre ${
                                        line.type === "removed"
                                          ? (workspaceTheme === "light" 
                                              ? "bg-rose-100 text-rose-800 border-l-2 border-rose-500 font-bold" 
                                              : "bg-rose-500/15 text-rose-300 border-l-2 border-rose-500")
                                          : ""
                                      }`}
                                    >
                                      {line.text || "\u00A0"}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Right Panel: Local Draft Buffer */}
                          <div className="flex-1 flex flex-col min-h-0">
                            <div className="bg-slate-900/60 px-4 py-1.5 border-b border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400 select-none">
                              <span className="flex items-center gap-1.5 font-semibold">
                                <FileCode2 className="w-3.5 h-3.5 text-indigo-400" />
                                YOUR LOCAL DRAFT (PENDING SAVING)
                              </span>
                              <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Unsaved Buffer</span>
                            </div>

                            <div className="flex-1 overflow-auto font-mono text-xs leading-5 select-text p-4 bg-slate-950/20 relative">
                              <div className="flex min-w-max">
                                {/* Line numbers */}
                                <div className={`w-8 select-none text-right pr-3 border-r ${t.editorLineNumBorder} ${t.editorLineNumText} text-[10px]`}>
                                  {diffRight.map((line, idx) => (
                                    <div key={idx} className="h-5">
                                      {line.modifiedNum !== undefined ? line.modifiedNum : "\u00A0"}
                                    </div>
                                  ))}
                                </div>
                                {/* Code line */}
                                <div className="pl-3 flex-1">
                                  {diffRight.map((line, idx) => (
                                    <div
                                      key={idx}
                                      className={`h-5 px-1.5 rounded-xs whitespace-pre ${
                                        line.type === "added"
                                          ? (workspaceTheme === "light" 
                                              ? "bg-emerald-100 text-emerald-800 border-l-2 border-emerald-505 font-bold" 
                                              : "bg-emerald-500/15 text-emerald-300 border-l-2 border-emerald-500")
                                          : ""
                                      }`}
                                    >
                                      {line.text || "\u00A0"}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 relative flex min-h-0 animate-fade-in">
                        
                        {/* Left Line Numbers decoration */}
                        <div className={`w-10 ${t.editorLineNumBg} ${t.editorLineNumText} select-none text-[11px] font-mono py-4 text-right pr-2 leading-relaxed border-r ${t.editorLineNumBorder}`}>
                          {Array.from({ length: lineCount }).map((_, i) => (
                            <div key={i}>{i + 1}</div>
                          ))}
                        </div>

                        {/* TEXTAREA CODE SHEET */}
                        <textarea
                          ref={editorRef}
                          value={editorContent}
                          onChange={(e) => handleEditorInput(e.target.value)}
                          placeholder="Type collaborative HTML / CSS / JavaScript code here..."
                          className={`flex-1 ${t.editorBg} ${t.editorText} ${t.editorCaret} font-mono text-xs p-4 focus:outline-none resize-none leading-relaxed outline-none border-0 select-text`}
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
                    )}

                    {/* STATUS FOOTER BAR */}
                    <footer className={`${t.footerBg} border-t ${t.footerBorder} px-4 py-2 flex justify-between items-center ${t.footerText} text-xs font-mono shrink-0 select-none`}>
                      <div className="flex items-center gap-4">
                        <span className="text-indigo-400 font-bold uppercase tracking-widest">{files[activeTab].language}</span>
                        <span>Lines: {lineCount}</span>
                        <span>Size: {new Blob([editorContent]).size} bytes</span>
                        <span className="text-[10px] text-slate-600 border-l border-slate-800/80 pl-4 flex items-center gap-1.5 select-none">
                          <span className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${lastAutosavedStatus.startsWith("Draft saved") ? "bg-indigo-400 animate-pulse animate-duration-1000" : "bg-emerald-500"}`} />
                          {lastAutosavedStatus || "Sync clean"}
                        </span>
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

              <button 
                onClick={() => {
                  setRenameOldPath(contextMenu.path);
                  setRenameNewPath(contextMenu.path);
                  setShowRenameModal(true);
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-800/60 rounded text-[11px] font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors text-slate-350 hover:text-white"
              >
                <Edit2 className="w-3.5 h-3.5 text-indigo-400" /> Rename File
              </button>

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

          {/* RENAME FILE MODAL BOX */}
          {showRenameModal && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-[#0f172a] border border-slate-750 rounded shadow-2xl p-6 w-full max-w-sm font-mono animate-fade-in relative overflow-hidden animate-zoom-in">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
                
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#cbd5e1] flex items-center gap-1.5">
                    <Edit2 className="w-3.5 h-3.5 text-indigo-400" /> Rename Workspace File
                  </span>
                  <button 
                    onClick={() => setShowRenameModal(false)}
                    className="text-slate-500 hover:text-white transition-colors cursor-pointer p-1 hover:bg-slate-800 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  handleRenameFile(renameOldPath, renameNewPath);
                }} className="space-y-4">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-widest font-bold">Current Path</label>
                    <div className="text-xs text-slate-400 px-3 py-2 bg-slate-900/60 border border-slate-800/80 rounded select-all break-all select-all">
                      {renameOldPath}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-550 mb-1.5 uppercase tracking-widest font-bold">New Path / Name</label>
                    <input 
                      type="text"
                      required
                      value={renameNewPath}
                      onChange={e => setRenameNewPath(e.target.value)}
                      placeholder="e.g. style-v2.css or src/App.tsx"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white text-xs outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <p className="text-[10px] text-slate-500 leading-normal font-sans">
                    Warning: Renaming will automatically search and update all references to the file name and path in all other workspace source files instantly.
                  </p>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowRenameModal(false)}
                      className="flex-1 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-[10px] uppercase tracking-wider rounded transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] uppercase tracking-wider rounded transition-all shadow-md shadow-indigo-950/20 cursor-pointer"
                    >
                      Apply Rename
                    </button>
                  </div>
                </form>
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
                      className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white text-xs outline-none focus:border-indigo-505 focus:border-indigo-505 focus:border-indigo-500 font-mono"
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

          {/* 5.5 KEYBOARD SHORTCUTS GUIDE MODAL BOX */}
          {showShortcutsModal && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-[#0f172a] border border-slate-800 rounded shadow-2xl p-6 w-full max-w-lg font-sans relative overflow-hidden">
                {/* Accent ambient glows */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

                <div className="flex justify-between items-center mb-5 border-b border-slate-800 pb-3 relative z-10">
                  <div className="flex items-center gap-1.5 text-left">
                    <Keyboard className="w-4 h-4 text-indigo-400" />
                    <span className="text-[11px] font-bold uppercase tracking-widest text-slate-200">Keyboard Shortcuts Guide</span>
                  </div>
                  <button 
                    onClick={() => setShowShortcutsModal(false)}
                    className="text-slate-500 hover:text-white transition-colors cursor-pointer p-1 hover:bg-slate-800 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-5 relative z-10 text-xs text-slate-300 leading-relaxed mb-6">
                  <p className="text-slate-400">
                    Boost your development speed using built-in keyboard hotkeys. Commands are designed to run instantly across all collaborative files in the active room.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    {/* Column 1: Editor Actions */}
                    <div className="space-y-4">
                      <div className="border-b border-slate-800/80 pb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 font-mono">Editor & Workspace</span>
                      </div>
                      
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-300">Save Active File</span>
                          <span className="flex gap-1">
                            <kbd className="px-1.5 py-0.5 bg-slate-900 border-b border-r border-slate-950 text-slate-400 font-mono text-[9px] rounded font-bold uppercase">Ctrl</kbd>
                            <span className="text-slate-500 font-mono text-[9px]">+</span>
                            <kbd className="px-1.5 py-0.5 bg-slate-900 border-b border-r border-slate-950 text-slate-400 font-mono text-[9px] rounded font-bold uppercase">S</kbd>
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-slate-300">Auto-Format Code</span>
                          <span className="flex gap-1">
                            <kbd className="px-1.5 py-0.5 bg-slate-900 border-b border-r border-slate-950 text-slate-400 font-mono text-[9px] rounded font-bold uppercase">Ctrl</kbd>
                            <span className="text-slate-500 font-mono text-[9px]">+</span>
                            <kbd className="px-1.5 py-0.5 bg-slate-900 border-b border-r border-slate-950 text-slate-400 font-mono text-[9px] rounded font-bold uppercase">E</kbd>
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-slate-300">Indent spacing</span>
                          <kbd className="px-1.5 py-0.5 bg-slate-900 border-b border-r border-slate-950 text-slate-400 font-mono text-[9px] rounded font-bold uppercase">Tab</kbd>
                        </div>
                      </div>
                    </div>

                    {/* Column 2: Navigation & Modals */}
                    <div className="space-y-4">
                      <div className="border-b border-slate-800/80 pb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 font-mono">Tools & Views</span>
                      </div>
                      
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-300">Search & Replace</span>
                          <span className="flex gap-1">
                            <kbd className="px-1.5 py-0.5 bg-slate-900 border-b border-r border-slate-950 text-slate-400 font-mono text-[9px] rounded font-bold uppercase">Ctrl</kbd>
                            <span className="text-slate-500 font-mono text-[9px]">+</span>
                            <kbd className="px-1.5 py-0.5 bg-slate-900 border-b border-r border-slate-950 text-slate-400 font-mono text-[9px] rounded font-bold uppercase">F</kbd>
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-slate-300">Create New File</span>
                          <span className="flex gap-1">
                            <kbd className="px-1.5 py-0.5 bg-slate-900 border-b border-r border-slate-950 text-slate-400 font-mono text-[9px] rounded font-bold uppercase">Ctrl</kbd>
                            <span className="text-slate-505 font-mono text-[9px] text-slate-500 font-sans">+</span>
                            <kbd className="px-1.5 py-0.5 bg-slate-900 border-b border-r border-slate-950 text-slate-400 font-mono text-[9px] rounded font-bold uppercase">Alt</kbd>
                            <span className="text-slate-505 font-mono text-[9px] text-slate-500 font-sans">+</span>
                            <kbd className="px-1.5 py-0.5 bg-slate-900 border-b border-r border-slate-950 text-slate-400 font-mono text-[9px] rounded font-bold uppercase">N</kbd>
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-slate-300">Download ZIP</span>
                          <span className="flex gap-1">
                            <kbd className="px-1.5 py-0.5 bg-slate-900 border-b border-r border-slate-950 text-slate-400 font-mono text-[9px] rounded font-bold uppercase">Ctrl</kbd>
                            <span className="text-slate-505 font-mono text-[9px] text-slate-500 font-sans">+</span>
                            <kbd className="px-1.5 py-0.5 bg-slate-900 border-b border-r border-slate-950 text-slate-400 font-mono text-[9px] rounded font-bold uppercase">Alt</kbd>
                            <span className="text-slate-505 font-mono text-[9px] text-slate-500 font-sans">+</span>
                            <kbd className="px-1.5 py-0.5 bg-slate-900 border-b border-r border-slate-950 text-slate-400 font-mono text-[9px] rounded font-bold uppercase">D</kbd>
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-slate-300">Toggle This Guide</span>
                          <span className="flex gap-1">
                            <kbd className="px-1.5 py-0.5 bg-slate-900 border-b border-r border-slate-950 text-slate-400 font-mono text-[9px] rounded font-bold uppercase">Ctrl</kbd>
                            <span className="text-slate-505 font-mono text-[9px] text-slate-500 font-sans">+</span>
                            <kbd className="px-1.5 py-0.5 bg-slate-900 border-b border-r border-slate-950 text-slate-400 font-mono text-[9px] rounded font-bold uppercase">/</kbd>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-slate-800/80 pt-4 text-[10px] text-slate-500 font-mono relative z-10">
                  <span>Press <kbd className="px-1 py-0.5 bg-slate-900 text-slate-400 border border-slate-850 rounded">Esc</kbd> anytime to close dashboards</span>
                  <button
                    type="button"
                    onClick={() => setShowShortcutsModal(false)}
                    className="px-4 py-1.5 bg-slate-805 bg-slate-800 hover:bg-slate-755 hover:bg-slate-750 border border-slate-700/50 text-slate-350 hover:text-white rounded text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Got It
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 6. INSTANT MOBILE JOIN SENSORY QR CODE MODAL BOX */}
          {showQrModal && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-[#0f172a] border border-slate-700/85 rounded shadow-2xl p-6 w-full max-w-sm font-sans animate-fade-in text-center relative overflow-hidden">
                {/* Visual geometric accent background */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

                <div className="flex justify-between items-center mb-5 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-1.5 text-left">
                    <QrCode className="w-4 h-4 text-emerald-400" />
                    <span className="text-[11px] font-bold uppercase tracking-widest text-slate-200">Instant QR Access</span>
                  </div>
                  <button 
                    onClick={() => setShowQrModal(false)}
                    className="text-slate-500 hover:text-white transition-colors cursor-pointer p-1 hover:bg-slate-800 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="mb-4">
                  <p className="text-xs text-slate-300 font-medium mb-1">Collaborative Room: <span className="font-mono text-indigo-400 font-bold">{roomId}</span></p>
                  <p className="text-[10px] text-slate-500 leading-relaxed max-w-[280px] mx-auto">
                    Scan this matrix with your mobile camera or second PC device to enter this live coding session instantly. No application installs required!
                  </p>
                </div>

                {/* DYNAMIC, REAL, AUTHENTIC QR CODE GENERATOR USING qrcode NPM PACKAGE */}
                <div className="bg-white p-4 rounded-xl inline-block shadow-xl border border-slate-700/20 mb-5 relative">
                  {qrDataUrl ? (
                    <img 
                      src={qrDataUrl} 
                      alt="Real collaborative room entry QR Code" 
                      className="w-44 h-44 object-contain"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-44 h-44 flex items-center justify-center text-slate-400 text-xs font-mono bg-slate-100 rounded">
                      Generating QR...
                    </div>
                  )}
                </div>

                <div className="space-y-2.5">
                  <div className="p-2 border border-slate-850 rounded bg-slate-900/60 flex items-center justify-between">
                    <span className="font-mono text-[9px] text-slate-400 truncate select-all pr-2 max-w-[210px] text-left">
                      {roomPassword 
                        ? `${window.location.origin}/?join=${roomId}&pwd=${encodeURIComponent(roomPassword)}`
                        : `${window.location.origin}/?join=${roomId}`}
                    </span>
                    <button
                      type="button"
                      onClick={copyRoomLink}
                      className="text-[9px] font-bold text-indigo-400 hover:text-indigo-300 font-mono flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <Clipboard className="w-3 h-3" /> COPY
                    </button>
                  </div>

                  {roomPassword && (
                    <div className="p-2 bg-emerald-500/5 rounded border border-emerald-500/10 text-emerald-450 text-[10px] font-mono leading-tight text-left">
                      ℹ️ This room has a password set. Ensure your colleague has the correct password to complete automatic decryption on entry!
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowQrModal(false)}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono uppercase tracking-widest font-bold rounded transition-all cursor-pointer"
                  >
                    Close / Dismiss
                  </button>
                </div>
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
