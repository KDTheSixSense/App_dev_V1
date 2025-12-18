import { HelpStep } from "../../types/help";

/**
 * 管理者監査ログのヘルプステップ
 */
export const adminAuditHelpSteps: HelpStep[] = [
    {
        id: "admin_audit_overview",
        title: "監査ログの概要",
        description: "管理者監査ログ画面です。システム内の重要なアクション（ログイン、データ変更など）の履歴を確認できます。",
        imagePath: "/images/help/admin_audit_overview.png", // 仮の画像パス
        targetSelector: "body",
        order: 1,
        page: "admin-audit",
    },
    {
        id: "admin_audit_filter",
        title: "ログの検索",
        description: "フィルター機能を使用して、特定のユーザーやアクションタイプでログを絞り込むことができます。",
        imagePath: "/images/help/admin_audit_filter.png", // 仮の画像パス
        targetSelector: ".audit-filter", // 仮のセレクタ
        order: 2,
        page: "admin-audit",
    },
];
