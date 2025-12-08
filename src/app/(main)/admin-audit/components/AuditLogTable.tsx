'use client';

import { useState } from 'react';

// 型定義（AuditLogの完全な型はPrismaからインポートするのがベストですが、クライアント用に簡易定義）
type AuditLogEntry = {
    id: number;
    userId: string | null;
    action: string;
    details: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    path: string | null;
    method: string | null;
    duration: number | null;
    createdAt: Date;
    user?: {
        username: string | null;
        email: string;
    } | null;
};

import { useRouter } from 'next/navigation';

export function AuditLogTable({ initialLogs, currentLimit }: { initialLogs: any[], currentLimit: number }) {
    const router = useRouter();
    const [logs, setLogs] = useState<AuditLogEntry[]>(initialLogs.map(l => ({ ...l, createdAt: new Date(l.createdAt) })));
    const [filterAction, setFilterAction] = useState('');
    const [filterUser, setFilterUser] = useState('');
    const [customLimit, setCustomLimit] = useState('');

    const handleLimitChange = (newLimit: number) => {
        router.push(`/admin-audit?limit=${newLimit}`);
    };

    const handleCustomLimitSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const limit = parseInt(customLimit, 10);
        if (!isNaN(limit) && limit > 0) {
            handleLimitChange(limit);
        }
    };

    // クライアントサイドフィルタリング (本来はサーバーサイドでやるべきだが、MVPとして)
    const filteredLogs = logs.filter(log => {
        const matchAction = filterAction ? log.action.includes(filterAction) : true;
        const matchUser = filterUser ? (log.userId?.includes(filterUser) || log.user?.email.includes(filterUser)) : true;
        return matchAction && matchUser;
    });

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex flex-col gap-4 mb-4">
                <div className="flex justify-between items-center bg-gray-50 p-3 rounded-md">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-700">Display Limit:</span>
                        <button
                            onClick={() => handleLimitChange(100)}
                            className={`px-3 py-1 text-sm rounded transition-colors ${currentLimit === 100 ? 'bg-blue-600 text-white' : 'bg-white border text-gray-700 hover:bg-gray-100'}`}
                        >
                            100
                        </button>
                        <button
                            onClick={() => handleLimitChange(1000)}
                            className={`px-3 py-1 text-sm rounded transition-colors ${currentLimit === 1000 ? 'bg-blue-600 text-white' : 'bg-white border text-gray-700 hover:bg-gray-100'}`}
                        >
                            1000
                        </button>
                        <button
                            onClick={() => handleLimitChange(10000)}
                            className={`px-3 py-1 text-sm rounded transition-colors ${currentLimit === 10000 ? 'bg-blue-600 text-white' : 'bg-white border text-gray-700 hover:bg-gray-100'}`}
                        >
                            10000
                        </button>
                        <form onSubmit={handleCustomLimitSubmit} className="flex items-center gap-1 ml-2">
                            <input
                                type="number"
                                placeholder="Custom"
                                className="border p-1 rounded w-20 text-sm"
                                value={customLimit}
                                onChange={e => setCustomLimit(e.target.value)}
                            />
                            <button type="submit" className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded text-sm">Go</button>
                        </form>
                    </div>
                    <div className="text-sm text-gray-500">
                        Current: <span className="font-semibold text-gray-900">{initialLogs.length}</span> logs (Limit: {currentLimit})
                    </div>
                </div>

                <div className="flex gap-4">
                    <input
                        type="text"
                        placeholder="Filter by Action (LOGIN, PAGE_VIEW...)"
                        className="border p-2 rounded w-1/3"
                        value={filterAction}
                        onChange={e => setFilterAction(e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="Filter by User (ID or Email)"
                        className="border p-2 rounded w-1/3"
                        value={filterUser}
                        onChange={e => setFilterUser(e.target.value)}
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th className="px-6 py-3">Time</th>
                            <th className="px-6 py-3">User</th>
                            <th className="px-6 py-3">Action</th>
                            <th className="px-6 py-3">Path / Method</th>
                            <th className="px-6 py-3">IP / UA</th>
                            <th className="px-6 py-3">Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLogs.map(log => (
                            <tr key={log.id} className="bg-white border-b hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap" suppressHydrationWarning>
                                    {log.createdAt.toLocaleString()}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-medium text-gray-900">{log.user?.username || 'Guest'}</div>
                                    <div className="text-xs">{log.user?.email || log.userId || '-'}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${log.action === 'LOGIN' ? 'bg-green-100 text-green-800' :
                                        log.action === 'PAGE_VIEW' ? 'bg-blue-100 text-blue-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                        {log.action}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {log.path && (
                                        <div className="flex items-center gap-1">
                                            <span className="font-mono text-xs bg-gray-200 px-1 rounded">{log.method || 'GET'}</span>
                                            <span className="truncate max-w-[150px]" title={log.path}>{log.path}</span>
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <div>{log.ipAddress}</div>
                                    <div className="text-xs truncate max-w-[150px]" title={log.userAgent || ''}>
                                        {log.userAgent ? log.userAgent.split(') ')[0] + ')' : '-'}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="max-w-[200px] max-h-[60px] overflow-y-auto text-xs font-mono bg-gray-50 p-1 rounded">
                                        {log.details || '-'}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="mt-4 text-xs text-gray-400 text-right">
                Showing {filteredLogs.length} logs
            </div>
        </div>
    );
}
