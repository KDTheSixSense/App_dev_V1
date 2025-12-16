import { getUserHistory } from './actions';
import HistoryClient from './components/HistoryClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: '問題解答履歴 | My App',
    description: '過去に解いた問題の履歴と成績を確認できます。',
};

export default async function HistoryPage() {
    // Initial fetch with no filters (or default range if preferred)
    // Fetching all for client-side filtering or initial state
    const initialData = await getUserHistory();

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">問題解答履歴</h1>
            <HistoryClient initialData={initialData} />
        </div>
    );
}
