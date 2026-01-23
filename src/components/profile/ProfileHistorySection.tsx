import { Suspense } from 'react';
import { getUserHistory } from '@/app/(main)/profile/history/actions';
import HistoryClient from '@/app/(main)/profile/history/components/HistoryClient';
import Link from 'next/link';

/**
 * プロフィール履歴セクション (Server Component)
 * 
 * ユーザーの過去の問題解答履歴を取得し、直近の履歴を表示します。
 */
export default async function ProfileHistorySection() {
    const historyData = await getUserHistory();

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-6">
                <Link
                    href="/profile/history"
                    className="text-2xl font-semibold text-gray-800 hover:text-blue-600 hover:underline flex items-center gap-2"
                >
                    問題解答履歴
                </Link>
            </div>
            <HistoryClient initialData={historyData} showTable={false} />
        </div>
    );
}
