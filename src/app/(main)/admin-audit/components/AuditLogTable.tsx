'use client';

import { useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';

// 型定義（AuditLogの完全な型はPrismaからインポートするのがベストですが、クライアント用に簡易定義）
type AuditLogEntry = {
    id: number;
    userId: string | null;
    action: string;
    details: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    deviceId: string | null;
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

import { banUser, unbanUser, updateBanReason, getLatestAuditLogs, kickUser } from '../actions';
import { useEffect } from 'react';
import { BanButton } from './BanButton';

export function AuditLogTable({ initialLogs, currentLimit, initialBannedUsers }: { initialLogs: any[], currentLimit: number, initialBannedUsers: { targetType: string, value: string }[] }) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'LOGS' | 'KICKED' | 'BANNED'>('LOGS');
    const [logs, setLogs] = useState<AuditLogEntry[]>(initialLogs.map(l => ({ ...l, createdAt: new Date(l.createdAt) })));
    const [filterAction, setFilterAction] = useState('');
    const [filterUser, setFilterUser] = useState('');
    const [customLimit, setCustomLimit] = useState('');
    const [editingBanId, setEditingBanId] = useState<string | number | null>(null);

    const [editReasonValue, setEditReasonValue] = useState('');
    const [isAutoRefresh, setIsAutoRefresh] = useState(false);

    // Kick Modal State
    const [kickModalOpen, setKickModalOpen] = useState(false);
    const [kickTarget, setKickTarget] = useState<{ type: 'COOKIE_ID', value: string, userId?: string } | null>(null);
    const [kickDuration, setKickDuration] = useState(60);
    const [kickUnit, setKickUnit] = useState<'seconds' | 'minutes' | 'hours' | 'days'>('minutes');
    const [kickReason, setKickReason] = useState('管理者の手動Kick');

    // Ban Modal State
    const [banModalOpen, setBanModalOpen] = useState(false);
    const [banTarget, setBanTarget] = useState<{ type: 'IP' | 'COOKIE_ID', value: string, userId?: string } | null>(null);
    const [banReason, setBanReason] = useState('管理者による手動BAN');

    useEffect(() => {
        let intervalId: NodeJS.Timeout;
        if (isAutoRefresh && (activeTab === 'LOGS' || activeTab === 'KICKED')) {
            intervalId = setInterval(async () => {
                const result = await getLatestAuditLogs(currentLimit);
                if (result.success && result.logs) {
                    setLogs(result.logs.map((l: any) => ({ ...l, createdAt: new Date(l.createdAt) })));
                }
            }, 5000); // 5 seconds
        }
        return () => clearInterval(intervalId);
    }, [isAutoRefresh, currentLimit, activeTab]);

    const handleStartEdit = (id: string | number, currentReason: string) => {
        setEditingBanId(id);
        setEditReasonValue(currentReason || '');
    };

    const handleSaveReason = async (targetType: 'IP' | 'COOKIE_ID', value: string) => {
        // Optimistic UI updates could be done here, but simple await is safer
        const result = await updateBanReason(targetType, value, editReasonValue);
        if (result.success) {
            setEditingBanId(null);
            setEditReasonValue('');
            toast.success('理由を更新しました');
            // サーバーコンポーネントのrefreshが走るのでローカルステート更新は最小限でOK
        } else {
            toast.error(result.error || '更新に失敗しました');
        }
    };

    // Setで高速検索 (IPとCookieIDをそれぞれ管理)
    const bannedIps = new Set(initialBannedUsers.filter(u => u.targetType === 'IP').map(u => u.value));
    const bannedDevices = new Set(initialBannedUsers.filter(u => u.targetType === 'COOKIE_ID').map(u => u.value));

    const handleLimitChange = (newLimit: number) => {
        router.push(`/admin-audit?limit=${newLimit}`);
    };

    // ... (unchanged handlers)

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

        if (activeTab === 'KICKED') {
            return matchAction && matchUser && log.action === 'RATE_LIMIT_KICK';
        }
        return matchAction && matchUser;
    });

    // Kick Handler
    const handleKickClick = (value: string, userId?: string) => {
        setKickTarget({ type: 'COOKIE_ID', value, userId });
        setKickReason('管理者の手動Kick');
        setKickModalOpen(true);
    };

    const executeKick = async () => {
        if (!kickTarget) return;
        const result = await kickUser(kickTarget.type, kickTarget.value, kickReason, kickDuration, kickUnit, kickTarget.userId);
        if (result.success) {
            setKickModalOpen(false);
            setKickReason('管理者の手動Kick');
            toast.success(`Kickを実行しました (ID: ${kickTarget.value})`);
            // Refresh logic handled by revalidatePath
        } else {
            toast.error(result.error || 'Kickに失敗しました');
        }
    };

    // Ban Handler
    const handleBanClick = (type: 'IP' | 'COOKIE_ID', value: string, userId?: string) => {
        setBanTarget({ type, value, userId });
        setBanReason('管理者による手動BAN');
        setBanModalOpen(true);
    };

    const executeBan = async () => {
        if (!banTarget) return;
        const result = await banUser(banTarget.type, banTarget.value, banReason, banTarget.userId);
        if (result.success) {
            setBanModalOpen(false);
            setBanReason('管理者による手動BAN');
            toast.success(`BANを実行しました (対象: ${banTarget.value})`);
        } else {
            toast.error(result.error || 'BANに失敗しました');
        }
    };

    const handleUnbanClick = async (type: 'IP' | 'COOKIE_ID', value: string) => {
        if (!confirm(`本当によろしいですか？\n対象: ${value}\nBANを解除します。`)) return; // Simple confirm is fine for unban, or use modal? User said "IP ban and cookie ban" modals.

        const result = await unbanUser(type, value);
        if (result.success) {
            toast.success(`BANを解除しました (対象: ${value})`);
        } else {
            toast.error(result.error || 'BAN解除に失敗しました');
        }
    };

    // CSVダウンロード機能 (Excel互換: BOM付きUTF-8)
    const downloadCSV = () => {
        let headers: string[] = [];
        let csvData: (string | number)[][] = [];

        if (activeTab === 'BANNED') {
            headers = ["BAN日時", "ユーザー", "タイプ", "値 (IP/CookieID)", "理由", "作成者"];
            // @ts-ignore - initialBannedUsers has more fields than the minimal type definition
            csvData = initialBannedUsers.map((user: any) => [
                new Date(user.createdAt).toLocaleString(),
                user.targetUser?.username || user.targetUserId || '-',
                user.targetType,
                user.value,
                `"${(user.reason || '').replace(/"/g, '""')}"`,
                user.createdBy || '-'
            ]);
        } else {
            headers = ["ID", "日時", "ユーザー名", "Email/UserID", "アクション", "パス", "メソッド", "IPアドレス", "デバイスID", "UserAgent", "所要時間", "詳細"];

            csvData = filteredLogs.map(log => [
                log.id,
                log.createdAt.toLocaleString(),
                log.user?.username || 'Guest',
                log.user?.email || log.userId || '-',
                log.action,
                log.path || '-',
                log.method || '-',
                log.ipAddress || '-',
                log.deviceId || '-',
                log.userAgent || '-',
                log.duration ? `${log.duration}ms` : '-',
                `"${(log.details || '').replace(/"/g, '""')}"`
            ]);
        }

        // CSV文字列生成
        const csvContent = [
            headers.join(','),
            ...csvData.map(row => row.join(','))
        ].join('\n');

        // BOMを付与してUTF-8としてExcelで文字化けしないようにする
        const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
        const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });

        // ダウンロードリンク作成
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `audit_log_${new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg relative">
            <Toaster position="top-right" />

            {/* Kick Modal */}
            {kickModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-96 animate-scale-in">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <span className="p-1 bg-orange-100 text-orange-600 rounded">⚠️</span>
                            Kick (一時的BAN)
                        </h3>
                        <p className="mb-4 text-sm text-gray-600 break-all p-2 bg-gray-50 rounded">
                            <span className="font-bold block text-gray-400 text-xs mb-1">対象 (Cookie ID)</span>
                            {kickTarget?.value}
                        </p>
                        <div className="flex gap-2 mb-4">
                            <div className="flex-1">
                                <label className="block text-xs font-bold mb-1 text-gray-500">期間</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        min="1"
                                        value={kickDuration}
                                        onChange={e => setKickDuration(parseInt(e.target.value) || 1)}
                                        className="border p-2 rounded w-20 text-center"
                                    />
                                    <select
                                        value={kickUnit}
                                        onChange={e => setKickUnit(e.target.value as any)}
                                        className="border p-2 rounded flex-1 bg-white"
                                    >
                                        <option value="seconds">秒</option>
                                        <option value="minutes">分</option>
                                        <option value="hours">時間</option>
                                        <option value="days">日</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="mb-6">
                            <label className="block text-xs font-bold mb-1 text-gray-500">理由</label>
                            <input
                                type="text"
                                value={kickReason}
                                onChange={e => setKickReason(e.target.value)}
                                className="border p-2 rounded w-full text-sm focus:ring-2 focus:ring-orange-200 outline-none"
                                placeholder="Kickの理由を入力"
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setKickModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded transition-colors text-sm font-bold">キャンセル</button>
                            <button onClick={executeKick} className="px-6 py-2 bg-orange-600 text-white hover:bg-orange-700 rounded transition-colors font-bold text-sm shadow-md">実行</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Ban Modal */}
            {banModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-96 animate-scale-in border-t-4 border-red-600">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-red-700">
                            <span className="p-1 bg-red-100 text-red-600 rounded">🚫</span>
                            {banTarget?.type === 'IP' ? 'IP BAN' : 'Device BAN'}
                        </h3>
                        <div className="mb-4 text-sm text-gray-600 break-all p-3 bg-red-50 rounded border border-red-100">
                            <span className="font-bold block text-red-400 text-xs mb-1">対象 ({banTarget?.type === 'IP' ? 'IP Address' : 'Cookie ID'})</span>
                            <span className="font-mono text-red-900 font-bold">{banTarget?.value}</span>
                        </div>

                        <p className="text-xs text-gray-500 mb-4">
                            ※ この操作を行うと、対象のユーザーは恒久的にアクセスできなくなります。解除は管理画面からのみ可能です。
                        </p>

                        <div className="mb-6">
                            <label className="block text-xs font-bold mb-1 text-gray-500">BANの理由</label>
                            <input
                                type="text"
                                value={banReason}
                                onChange={e => setBanReason(e.target.value)}
                                className="border p-2 rounded w-full text-sm focus:ring-2 focus:ring-red-200 outline-none border-gray-300"
                                placeholder="BANの理由を入力"
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setBanModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded transition-colors text-sm font-bold">キャンセル</button>
                            <button onClick={executeBan} className="px-6 py-2 bg-red-600 text-white hover:bg-red-700 rounded transition-colors font-bold text-sm shadow-md">
                                BAN実行
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <h2 className="text-xl font-bold mb-4 text-gray-800">セキュリティ監査ログ / BANリスト</h2>

            {/* Tabs */}
            <div className="flex border-b mb-4">
                <button
                    className={`px-4 py-2 font-semibold ${activeTab === 'LOGS' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('LOGS')}
                >
                    アクセスログ
                </button>
                <button
                    className={`px-4 py-2 font-semibold ${activeTab === 'KICKED' ? 'border-b-2 border-orange-500 text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('KICKED')}
                >
                    Kick ユーザー
                </button>
                <button
                    className={`px-4 py-2 font-semibold ${activeTab === 'BANNED' ? 'border-b-2 border-red-500 text-red-600' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('BANNED')}
                >
                    BAN ユーザー
                </button>
            </div>

            {/* Shared Controls & Search */}
            <div className="flex flex-col gap-4 mb-4">
                <div className="flex justify-between items-center bg-gray-50 p-3 rounded-md">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-700">表示件数:</span>
                        <button onClick={() => handleLimitChange(100)} className={`px-3 py-1 text-sm rounded transition-colors ${currentLimit === 100 ? 'bg-blue-600 text-white' : 'bg-white border text-gray-700 hover:bg-gray-100'}`}>100</button>
                        <button onClick={() => handleLimitChange(1000)} className={`px-3 py-1 text-sm rounded transition-colors ${currentLimit === 1000 ? 'bg-blue-600 text-white' : 'bg-white border text-gray-700 hover:bg-gray-100'}`}>1000</button>
                        <button onClick={() => handleLimitChange(10000)} className={`px-3 py-1 text-sm rounded transition-colors ${currentLimit === 10000 ? 'bg-blue-600 text-white' : 'bg-white border text-gray-700 hover:bg-gray-100'}`}>10000</button>
                        <form onSubmit={handleCustomLimitSubmit} className="flex items-center gap-1 ml-2">
                            <input type="number" placeholder="件数指定" className="border p-1 rounded w-20 text-sm" value={customLimit} onChange={e => setCustomLimit(e.target.value)} />
                            <button type="submit" className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded text-sm">適用</button>
                        </form>
                        <div className="flex items-center gap-2 ml-4 border-l pl-4">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        className="sr-only"
                                        checked={isAutoRefresh}
                                        onChange={e => setIsAutoRefresh(e.target.checked)}
                                    />
                                    <div className={`block w-10 h-6 rounded-full transition-colors ${isAutoRefresh ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isAutoRefresh ? 'transform translate-x-4' : ''}`}></div>
                                </div>
                                <span className={`text-sm font-bold ${isAutoRefresh ? 'text-green-600' : 'text-gray-500'}`}>
                                    自動更新
                                </span>
                            </label>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={downloadCSV} className="flex items-center gap-1 bg-green-600 text-white px-3 py-1 text-sm rounded hover:bg-green-700 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Excel出力
                        </button>
                        <div className="text-sm text-gray-500">
                            現在: <span className="font-semibold text-gray-900">
                                {activeTab === 'BANNED' ? initialBannedUsers.length : initialLogs.length}
                            </span> 件 (上限: {currentLimit})
                        </div>
                    </div>
                </div>

                {(activeTab === 'LOGS' || activeTab === 'KICKED') && (
                    <div className="flex gap-4">
                        <input type="text" placeholder="アクションで検索 (LOGIN, PAGE_VIEW...)" className="border p-2 rounded w-1/3" value={filterAction} onChange={e => setFilterAction(e.target.value)} />
                        <input type="text" placeholder="ユーザーで検索 (ID or Email)" className="border p-2 rounded w-1/3" value={filterUser} onChange={e => setFilterUser(e.target.value)} />
                    </div>
                )}
            </div>

            {activeTab === 'BANNED' && (
                <div className="overflow-x-auto">
                    <p className="mb-2 text-sm text-gray-600">現在永久BANされているIPアドレスおよび端末の一覧です。</p>
                    <table className="min-w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th className="px-6 py-3">BAN日時</th>
                                <th className="px-6 py-3">ユーザー</th>
                                <th className="px-6 py-3">タイプ</th>
                                <th className="px-6 py-3">値 (IP/CookieID)</th>
                                <th className="px-6 py-3">理由</th>
                                <th className="px-6 py-3">操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {initialBannedUsers.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-4 text-center">BANされたユーザーはいません</td>
                                </tr>
                            )}
                            {initialBannedUsers.slice(0, currentLimit).map((user: any) => (
                                <tr key={user.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4">{new Date(user.createdAt).toLocaleString()}</td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold">{user.targetUser?.username || '-'}</div>
                                        <div className="text-xs text-gray-500">{user.targetUser?.email || user.targetUserId || ''}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${user.targetType === 'IP' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'}`}>
                                            {user.targetType}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-mono">
                                        {user.value}
                                        {user.expiresAt && <div className="text-xs text-orange-600 mt-1">期限: {new Date(user.expiresAt).toLocaleString()}</div>}
                                    </td>
                                    <td className="px-6 py-4">
                                        {editingBanId === user.id ? (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={editReasonValue}
                                                    onChange={(e) => setEditReasonValue(e.target.value)}
                                                    className="border rounded px-2 py-1 text-xs w-full"
                                                />
                                                <button
                                                    onClick={() => handleSaveReason(user.targetType, user.value)}
                                                    className="text-green-600 hover:text-green-800"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => setEditingBanId(null)}
                                                    className="text-gray-500 hover:text-gray-700"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between group">
                                                <span className="truncate max-w-[150px]" title={user.reason}>{user.reason || '-'}</span>
                                                <button
                                                    onClick={() => handleStartEdit(user.id, user.reason)}
                                                    className="opacity-0 group-hover:opacity-100 text-blue-500 hover:text-blue-700 transition-opacity"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <BanButton
                                            type={user.targetType}
                                            value={user.value}
                                            isUnban={true}
                                            onAction={() => handleUnbanClick(user.targetType, user.value)}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {(activeTab === 'LOGS' || activeTab === 'KICKED') && (
                <>

                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3">日時</th>
                                    <th className="px-6 py-3">ユーザー</th>
                                    <th className="px-6 py-3">アクション</th>
                                    <th className="px-6 py-3">パス / メソッド</th>
                                    <th className="px-6 py-3">IP / デバイス (Cookie)</th>
                                    <th className="px-6 py-3">詳細</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLogs.map(log => {
                                    const isIpBanned = log.ipAddress && bannedIps.has(log.ipAddress);
                                    const isDeviceBanned = log.deviceId && bannedDevices.has(log.deviceId);

                                    return (
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
                                                <div className="flex flex-col gap-2">
                                                    {/* IP Address */}
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span title="IP Address" className={isIpBanned ? "text-red-600 font-bold" : ""}>
                                                            {log.ipAddress}
                                                            {isIpBanned && <span className="ml-1 text-[10px] bg-red-100 text-red-600 px-1 rounded border border-red-200">BAN済み</span>}
                                                        </span>
                                                        {log.ipAddress && (
                                                            <div className="flex gap-1">
                                                                {!isIpBanned && <BanButton
                                                                    type="IP"
                                                                    value={log.ipAddress}
                                                                    onAction={async () => handleBanClick('IP', log.ipAddress!)}
                                                                />}
                                                                {isIpBanned && <BanButton
                                                                    type="IP"
                                                                    value={log.ipAddress}
                                                                    isUnban={true}
                                                                    onAction={() => handleUnbanClick('IP', log.ipAddress!)}
                                                                />}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Device/Cookie ID */}
                                                    {log.deviceId && (
                                                        <div className="flex items-center justify-between gap-2 text-orange-600">
                                                            <span title="Cookie Device ID" className={`font-mono text-[10px] truncate max-w-[100px] ${isDeviceBanned ? "text-red-600 font-bold" : ""}`}>
                                                                {log.deviceId}
                                                                {isDeviceBanned && <span className="ml-1 text-[10px] bg-red-100 text-red-600 px-1 rounded border border-red-200">BAN済み</span>}
                                                            </span>
                                                            <div className="flex gap-1">
                                                                {!isDeviceBanned && (
                                                                    <>
                                                                        <button
                                                                            onClick={() => handleKickClick(log.deviceId!, log.userId || undefined)}
                                                                            className="text-[10px] px-1.5 py-0.5 rounded border transition-colors ml-1 bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100"
                                                                        >
                                                                            Kick
                                                                        </button>
                                                                        <BanButton
                                                                            type="COOKIE_ID"
                                                                            value={log.deviceId}
                                                                            onAction={async () => handleBanClick('COOKIE_ID', log.deviceId!, log.userId || undefined)}
                                                                        />
                                                                    </>
                                                                )}
                                                                {isDeviceBanned && <BanButton
                                                                    type="COOKIE_ID"
                                                                    value={log.deviceId}
                                                                    isUnban={true}
                                                                    onAction={() => handleUnbanClick('COOKIE_ID', log.deviceId!)}
                                                                />}
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="flex items-center justify-between gap-2 text-xs text-gray-500">
                                                        <span className="truncate max-w-[120px]" title={log.userAgent || ''}>
                                                            {log.userAgent ? log.userAgent.split(') ')[0] + ')' : '-'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="max-w-[200px] max-h-[60px] overflow-y-auto text-xs font-mono bg-gray-50 p-1 rounded">
                                                    {log.details || '-'}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {/* ... */}
                    <div className="mt-4 text-xs text-gray-400 text-right">
                        {filteredLogs.length} 件表示中
                    </div>
                </>
            )}
        </div>
    );
}
