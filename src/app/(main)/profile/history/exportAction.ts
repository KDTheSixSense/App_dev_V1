'use server';

import { getUserHistory, HistoryItem } from './actions';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

const PROBLEM_TYPE_LABELS: Record<string, string> = {
    'basic_a': '基本情報A',
    'basic_b': '基本情報B',
    'applied_am': '応用情報午前',
    'programming': 'プログラミング',
    'select': '選択問題',
};

// Reuse params 
type FetchHistoryParams = {
    startDate?: Date;
    endDate?: Date;
};

export async function generateHistoryExcel(params: FetchHistoryParams = {}) {
    try {
        // Reuse the existing secure data fetching logic
        const data = await getUserHistory(params);
        const removeLineBreaks = (text: string | null | undefined) => {
            if (!text) return '';
            return text.replace(/[\r\n]+/g, ' ').trim();
        };

        // Convert to Excel format
        // We use the same mapping as before
        const excelData = data.items.map((item: HistoryItem) => ({
            '回答日時': format(new Date(item.answeredAt), 'yyyy/MM/dd HH:mm:ss'),
            '種類': PROBLEM_TYPE_LABELS[item.type] || item.type,
            'カテゴリ': item.category,
            '問題ID': item.problemId,
            '問題名': item.title,
            '結果': item.isCorrect ? '正解' : '不正解',
            // Sanitize answer to prevent CSV injection or weird formatting if it contains newlines
            '回答': removeLineBreaks(item.category)
        }));

        // Create workbook
        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, '履歴レポート');

        // Write to buffer
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' });

        return { success: true, data: excelBuffer };

    } catch (error) {
        console.error('Export failed:', error);
        return { success: false, error: 'Excel生成に失敗しました。' };
    }
}
