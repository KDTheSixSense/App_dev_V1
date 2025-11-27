// src/types/help.ts

/**
 * ヘルプコンテンツのステップを定義する型
 */
export type HelpStep = {
  /** ステップを一意に識別するID */
  id: string;
  /** ヘルプのタイトル */
  title: string;
  /** 詳細な説明テキスト */
  description: string;
  /** 説明用の画像ファイルへのパス (publicフォルダからの相対パスを想定) */
  imagePath?: string;
  /** 画面上の対象要素を特定するためのCSSセレクタ */
  targetSelector: string;
  /** ステップの順序 */
  order: number;
  /** このステップが関連するページ名 */
  page?: string;
  /** このステップが関連するユーザーロール (admin/member/creator/participant) */
  role?: 'admin' | 'member' | 'creator' | 'participant';
};

/**
 * APIレスポンスの型
 */
export type HelpApiResponse = {
  steps: HelpStep[];
};
