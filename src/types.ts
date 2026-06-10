export interface FileHistoryItem {
  version: number;
  content: string;
  updatedAt: number;
  updatedBy: string;
}

export interface FileItem {
  id: string;
  name: string;
  path: string;
  content: string;
  language: string;
  updatedAt: number;
  updatedBy: string;
  version: number;
  history: FileHistoryItem[];
  lockedBy?: string | null;
  lockedByName?: string | null;
}

export interface Activity {
  id: string;
  timestamp: number;
  userId: string;
  userName: string;
  type: "join" | "leave" | "edit" | "file_create" | "file_delete" | "file_upload" | "rollback";
  fileName?: string;
  details: string;
}

export interface RoomUser {
  id: string;
  name: string;
  isOnline: boolean;
}

export interface ConflictDetails {
  path: string;
  serverVersion: number;
  serverContent: string;
  serverUpdatedBy: string;
  clientContent: string;
}
