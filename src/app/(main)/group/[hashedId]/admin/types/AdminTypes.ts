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
    avatar?: string;
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
    author: string;
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
    showComments?: boolean;
    comments?: Comment[];
    completed?: boolean;
}

// プログラミング問題の型
export interface ProgrammingProblem {
    id: number;
    title: string;
    difficulty: number;
}

// フォーマット状態の型
export interface FormatState {
    bold: boolean;
    italic: boolean;
    underline: boolean;
    strikethrough: boolean;
}

// タブの型
export type TabType = 'お知らせ' | '課題' | 'メンバー';

// 課題表示モードの型
export type AssignmentViewMode = 'list' | 'expanded' | 'detail';
