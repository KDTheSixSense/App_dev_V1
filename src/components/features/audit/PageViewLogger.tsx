'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { logPageViewAction } from '@/lib/actions/auditActions';

/**
 * ページビューログ記録コンポーネント
 * 
 * クライアントサイドでのルート遷移を検知し、サーバーアクションを呼び出して
 * ページビュー履歴を監査ログとして記録します。
 */
export function PageViewLogger() {
    const pathname = usePathname();

    useEffect(() => {
        // クライアントサイドでのページ遷移時にサーバーへログを送信
        if (pathname) {
            logPageViewAction(pathname);
        }
    }, [pathname]);

    return null; // UIには何も表示しない
}
