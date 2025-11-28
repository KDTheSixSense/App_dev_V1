// === 管理者ページで使用する型定義 ===

// グループ詳細の型
export interface GroupDetail {
    id: number;
    hashedId: string;
    name: string;
    description: string;
    memberCount: number;
    teacher: string;
    invite_code: string;
}

// メンバーの型
export interface Member {
    id: number;
    name: string;
    email: string;
    icon: string | null;
    isAdmin: boolean;
    onlineStatus: 'online' | 'away' | 'offline';
    level?: number;
    xp?: number;
    posts?: number;
    assignments?: number;
    attendance?: number;
}

// メンバー統計の型
export interface MemberStats {
    totalMembers: number;
    onlineMembers: number;
    adminCount: number;
    studentCount: number;
}

// 投稿の型
export interface Post {
    id: number;
    content: string;
    author: {
        username: string;
        icon: string | null;
    };
    date: string;
    showMenu: boolean;
    comments?: Comment[];
    showComments?: boolean;
    isEditing?: boolean;
}

// コメントの型
export interface Comment {
    id: number;
    content: string;
    author: string;
    date: string;
    avatar?: string;
    showMenu?: boolean;
    isEditing?: boolean;
}

// 課題の型
export interface Assignment {
    id: number;
    title: string;
    description: string;
    due_date: string;
    created_at: string;
    programmingProblemId?: number;
    selectProblemId?: number;
    programmingProblem?: ProgrammingProblem; // 追加
    selectProblem?: ProgrammingProblem;      // 追加
    showComments?: boolean;
    comments?: AssignmentComment[];
    completed?: boolean;
    author?: {
        username?: string | null;
        icon?: string | null;
    };
}

// プログラミング問題の型
export interface ProgrammingProblem {
    id: number;
    title: string;
    difficulty: number;
    type: 'programming' | 'select';
}

// 課題コメントの型
export interface AssignmentComment {
    id: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  assignmentId: number;
  authorId: number;
  author: User;
}

// ユーザーの基本的な型
export interface User {
    id: number;
    username: string | null;
    icon: string | null;
}
// フォーマット状態の型
export interface FormatState {
    bold: boolean;
    italic: boolean;
    underline: boolean;
    strikethrough: boolean;
}

// タブの型
export type TabType = 'お知らせ' | '課題' | 'メンバー' | '提出状況一覧';

// 課題表示モードの型
export type AssignmentViewMode = 'list' | 'expanded' | 'detail';
