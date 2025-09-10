// Type definitions for Group Admin functionality

import { BackgroundConfig, TextColorMode } from '../utils/colorContrast';

// Existing types (from original codebase)
export type TabType = 'お知らせ' | '課題' | 'メンバー';
export type AssignmentViewMode = 'list' | 'detail';
export type FormatState = {
    bold: boolean;
    italic: boolean;
    underline: boolean;
    strikethrough: boolean;
};
export type Assignment = {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  status: 'active' | 'completed' | 'overdue';
  createdAt: Date;
  updatedAt: Date;
};

export type ProgrammingProblem = {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  sampleCases: Array<{
    input: string;
    output: string;
  }>;
};

// Background-related types
export type BackgroundType = 'color' | 'image';

export interface BackgroundSelectorModalProps {
  isOpen: boolean;
  currentConfig: BackgroundConfig;
  onClose: () => void;
  onSelectColor: (color: string) => void;
  onSelectImage: (file: File) => Promise<{ success: boolean; error?: string }>;
  onTextModeChange: (mode: TextColorMode) => void;
  onReset: () => void;
  isProcessing?: boolean;
}

// Extended types for future enhancements
export interface BackgroundPreset {
  id: string;
  name: string;
  config: BackgroundConfig;
  createdAt: number;
}

export interface BackgroundSettings {
  presets: BackgroundPreset[];
  defaultConfig: BackgroundConfig;
  allowCustomImages: boolean;
  maxImageSize: number;
}

// Group-related types
export interface GroupDetail {
  id: number;
  hashedId: string;
  name: string;
  description: string;
  memberCount: number;
  invite_code: string;
}

export interface Member {
  id: number;
  name: string;
  email: string;
  avatar: string;
  isAdmin: boolean;
  onlineStatus: string;
  level: number;
  xp: number;
  posts: number;
  assignments: number;
  attendance: number;
}

export interface MemberStats {
  totalMembers: number;
  onlineMembers: number;
  adminCount: number;
  studentCount: number;
}

// Post-related types
export interface Post {
  id: number;
  content: string;
  author: string;
  date: string;
  showMenu: boolean;
  comments: Comment[];
  showComments: boolean;
  isEditing: boolean;
}

export interface Comment {
  id: number;
  content: string;
  author: string;
  date: string;
  avatar: string;
}

// Modal state types
export interface ModalState {
  isProblemSelectOpen: boolean;
  isProblemTypeSelectOpen: boolean;
  isBackgroundSelectorOpen: boolean;
  selectedProblem: ProgrammingProblem | null;
}

// Form state types
export interface AssignmentFormData {
  title: string;
  description: string;
  dueDate: Date;
  problems: ProgrammingProblem[];
}

export interface PostFormData {
  title: string;
  content: string;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Error types
export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: ValidationError[];
}

// Loading states
export interface LoadingStates {
  group: boolean;
  members: boolean;
  posts: boolean;
  assignments: boolean;
  problems: boolean;
}

// Filter and search types
export interface MemberFilters {
  role?: 'admin' | 'member';
  search?: string;
  sortBy?: 'name' | 'joinedAt' | 'lastActive';
  sortOrder?: 'asc' | 'desc';
}

export interface AssignmentFilters {
  status?: 'active' | 'completed' | 'overdue';
  search?: string;
  dueDateRange?: {
    start: Date;
    end: Date;
  };
}

// Notification types
export interface NotificationItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}
