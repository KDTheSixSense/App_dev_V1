'use client';

import { HistoryItem } from '../actions';
import FormattedDate from './FormattedDate';

type Props = {
    items: HistoryItem[];
};

export default function HistoryTable({ items }: Props) {
    if (items.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-gray-500">履歴データがありません。</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 bg-white">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            ID
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            日時
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            カテゴリ
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            問題タイトル
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            結果
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            タイムスタンプ
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {items.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {item.dbId}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <FormattedDate date={item.answeredAt} formatString="yyyy/MM/dd" />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                  ${item.type === 'basic_a' ? 'bg-blue-100 text-blue-800' :
                                        item.type === 'basic_b' ? 'bg-purple-100 text-purple-800' :
                                            item.type === 'programming' ? 'bg-green-100 text-green-800' :
                                                item.type === 'applied_am' ? 'bg-orange-100 text-orange-800' :
                                                    'bg-gray-100 text-gray-800'
                                    }`}>
                                    {item.category}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate" title={item.title}>
                                {item.title}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {item.isCorrect ? (
                                    <span className="text-green-600 font-semibold flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                        正解
                                    </span>
                                ) : (
                                    <span className="text-red-500 font-semibold flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        不正解
                                    </span>
                                )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                <FormattedDate date={item.answeredAt} formatString="HH:mm:ss" />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
