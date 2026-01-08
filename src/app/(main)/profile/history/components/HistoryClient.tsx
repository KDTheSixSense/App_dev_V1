'use client';

import { useState, useMemo } from 'react';
import { HistoryItem, HistoryStatistics, getUserHistory } from '../actions';
import HistoryTable from './HistoryTable';
import StatisticsCards from './StatisticsCards';
import HistoryCalendar from './HistoryCalendar'; // To be implemented
import { format, subWeeks, subMonths, subYears, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { generateHistoryExcel } from '../exportAction';
import { saveAs } from 'file-saver';
import toast from 'react-hot-toast';

import Link from 'next/link';

type Props = {
    initialData: {
        items: HistoryItem[];
        statistics: HistoryStatistics;
    };
    showTable?: boolean; // New prop to control table visibility
};

type TimeRange = 'all' | '1week' | '1month' | '1year' | 'custom';
type CategoryTab = 'all' | 'basic_a' | 'basic_b' | 'applied_am' | 'programming' | 'select';

const TABS: { id: CategoryTab; label: string }[] = [
    { id: 'all', label: 'すべて' },
    { id: 'basic_a', label: '基本情報A' },
    { id: 'basic_b', label: '基本情報B' },
    { id: 'applied_am', label: '応用情報午前' },
    { id: 'programming', label: 'プログラミング' },
    { id: 'select', label: '選択問題' },
];

export default function HistoryClient({ initialData, showTable = true }: Props) {
    const [items, setItems] = useState<HistoryItem[]>(initialData.items);
    // Re-calculate stats based on current items could be done here, 
    // but initialData.statistics is for the fetch result.
    // We'll compute display stats on the fly from filtered items.

    const [timeRange, setTimeRange] = useState<TimeRange>('all');
    const [activeTab, setActiveTab] = useState<CategoryTab>('all');
    const [customDateRange, setCustomDateRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });

    const handleRangeChange = async (range: TimeRange) => {
        setTimeRange(range);
        // If we wanted to re-fetch from server:
        // const endDate = new Date();
        // let startDate; ...
        // const data = await getUserHistory({ startDate, endDate });
        // setItems(data.items);

        // For now, let's filter client-side if the initial load was "all". 
        // If initial load was huge, server-side filtering is better.
        // Given the prompt implies "search", server-side is safer for scale.
        // BUT to keep UI snappy and simple for this iteration, let's try client filtering first 
        // OR call server action.
        // Let's call server action to ensure correct "search" behavior as requested.

        let start: Date | undefined;
        const end = new Date();

        if (range === '1week') start = subWeeks(end, 1);
        else if (range === '1month') start = subMonths(end, 1);
        else if (range === '1year') start = subYears(end, 1);
        else if (range === 'all') start = undefined;

        if (range !== 'custom') {
            setCustomDateRange({ start: start || null, end: end });
            const data = await getUserHistory({ startDate: start, endDate: end });
            setItems(data.items);
        }
    };

    const handleCustomDateChange = async (start: Date | null, end: Date | null) => {
        // Ensure end date includes the full day (23:59:59.999)
        const effectiveEnd = end ? endOfDay(end) : null;
        setCustomDateRange({ start, end }); // Keep UI state as selected (midnight)

        if (start && effectiveEnd) {
            const data = await getUserHistory({ startDate: start, endDate: effectiveEnd });
            setItems(data.items);
        }
    };

    const filteredItems = useMemo(() => {
        return items.filter(item => {
            if (activeTab === 'all') return true;
            return item.type === activeTab;
        });
    }, [items, activeTab]);

    const currentStats = useMemo(() => {
        const total = filteredItems.length;
        const correct = filteredItems.filter(i => i.isCorrect).length;
        const accuracy = total > 0 ? (correct / total) * 100 : 0;

        // Dynamic Total Available Questions based on activeTab
        let totalAvailable = 0;
        const counts = initialData.statistics.availableCounts;

        if (counts) { // Check if availableCounts exists (it should with new backend)
            if (activeTab === 'all') totalAvailable = counts.all;
            else if (activeTab === 'programming') totalAvailable = counts.programming;
            else if (activeTab === 'basic_a') totalAvailable = counts.basic_a;
            else if (activeTab === 'basic_b') totalAvailable = counts.basic_b;
            else if (activeTab === 'applied_am') totalAvailable = counts.applied_am;
            else if (activeTab === 'select') totalAvailable = counts.select;
        } else {
            // Fallback for old data structure if needed
            totalAvailable = initialData.statistics.totalAvailableQuestions;
        }

        return { total, correct, accuracy, totalAvailableQuestions: totalAvailable };
    }, [filteredItems, initialData.statistics, activeTab]);

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                    <div className="flex gap-2">
                        {(['all', '1week', '1month', '1year'] as const).map((r) => (
                            <button
                                key={r}
                                onClick={() => handleRangeChange(r)}
                                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${timeRange === r
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {r === 'all' ? '全期間' : r === '1week' ? '1週間' : r === '1month' ? '1ヶ月' : '1年'}
                            </button>
                        ))}
                        <button
                            onClick={async () => {
                                const loadingToast = toast.loading('Excelを作成中...');
                                try {
                                    // Determine current filter dates
                                    let start: Date | undefined = customDateRange.start || undefined;
                                    const end: Date | undefined = customDateRange.end || undefined;

                                    // If using preset ranges, calculate start date again to be sure
                                    // (Logic duplicated from handleRangeChange, ideally state should hold the actual dates used)
                                    if (timeRange === '1week') start = subWeeks(new Date(), 1);
                                    else if (timeRange === '1month') start = subMonths(new Date(), 1);
                                    else if (timeRange === '1year') start = subYears(new Date(), 1);

                                    const result = await generateHistoryExcel({ startDate: start, endDate: end });

                                    if (result.success && result.data) {
                                        // Convert base64 to Blob
                                        const byteCharacters = atob(result.data);
                                        const byteNumbers = new Array(byteCharacters.length);
                                        for (let i = 0; i < byteCharacters.length; i++) {
                                            byteNumbers[i] = byteCharacters.charCodeAt(i);
                                        }
                                        const byteArray = new Uint8Array(byteNumbers);
                                        const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

                                        saveAs(blob, `history_export_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`);
                                        toast.success('Excelを出力しました', { id: loadingToast });
                                    } else {
                                        toast.error('Excel出力に失敗しました', { id: loadingToast });
                                    }
                                } catch (e) {
                                    console.error(e);
                                    toast.error('エラーが発生しました', { id: loadingToast });
                                }
                            }}
                            className="px-4 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center gap-2"
                            title="Excel出力"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M7.5 12 12 16.5m0 0 4.5-4.5M12 16.5v-9" />
                            </svg>
                            Excel出力
                        </button>
                    </div>

                    {/* Custom Date Picker Trigger logic could go here or inside HistoryCalendar */}
                    <HistoryCalendar
                        startDate={customDateRange.start}
                        endDate={customDateRange.end}
                        onChange={handleCustomDateChange}
                    />
                </div>
            </div>

            {/* Statistics */}
            <StatisticsCards stats={currentStats} />

            {/* Tabs */}
            <div className="border-b border-gray-200 overflow-x-auto">
                <div className="flex gap-4 min-w-max px-2">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`pb-3 px-2 text-sm font-medium transition-colors border-b-2 ${activeTab === tab.id
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>
            {/* Table or View More Link */}
            {showTable ? (
                <HistoryTable items={filteredItems} />
            ) : (
                <Link href="/profile/history" className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium"></Link>
            )}
        </div>
    );
}
