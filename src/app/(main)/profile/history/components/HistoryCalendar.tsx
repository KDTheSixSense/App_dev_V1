'use client';

import { format } from 'date-fns';

type Props = {
    startDate: Date | null;
    endDate: Date | null;
    onChange: (start: Date | null, end: Date | null) => void;
};

export default function HistoryCalendar({ startDate, endDate, onChange }: Props) {
    const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const valStr = e.target.value;
        if (!valStr) {
            onChange(null, endDate);
            return;
        }
        // Construct local date (00:00:00)
        const val = new Date(valStr + 'T00:00:00');
        onChange(val, endDate);
    };

    const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const valStr = e.target.value;
        if (!valStr) {
            onChange(startDate, null);
            return;
        }
        // Construct local date (00:00:00) - HistoryClient will handle end-of-day logic
        const val = new Date(valStr + 'T00:00:00');
        onChange(startDate, val);
    };

    // Helper to format date for input value (YYYY-MM-DD)
    const formatDateVal = (d: Date | null) => {
        if (!d) return '';
        return format(d, 'yyyy-MM-dd');
    };

    return (
        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
            <span className="text-sm text-gray-500">期間指定:</span>
            <input
                type="date"
                className="bg-white border border-gray-300 text-gray-700 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block p-1"
                value={formatDateVal(startDate)}
                onChange={handleStartChange}
            />
            <span className="text-gray-400">~</span>
            <input
                type="date"
                className="bg-white border border-gray-300 text-gray-700 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block p-1"
                value={formatDateVal(endDate)}
                onChange={handleEndChange}
            />
        </div>
    );
}
