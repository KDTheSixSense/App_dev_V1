'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { logPageViewAction } from '@/lib/actions/auditActions';

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
