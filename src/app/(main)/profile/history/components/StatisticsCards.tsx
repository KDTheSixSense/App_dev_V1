'use client';

type Props = {
    stats: {
        total: number;
        totalAvailableQuestions: number;
        correct: number;
        accuracy: number;
    };
};

export default function StatisticsCards({ stats }: Props) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl shadow-sm border border-blue-200">
                <h3 className="text-sm font-semibold text-blue-700 mb-1">総解答数</h3>
                <p className="text-3xl font-bold text-gray-800">{stats.total}<span className="text-base font-normal text-gray-500 ml-1">問 / {stats.totalAvailableQuestions}問</span></p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl shadow-sm border border-green-200">
                <h3 className="text-sm font-semibold text-green-700 mb-1">正解数</h3>
                <p className="text-3xl font-bold text-gray-800">{stats.correct}<span className="text-base font-normal text-gray-500 ml-1">問 / {stats.totalAvailableQuestions}問</span></p>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-xl shadow-sm border border-indigo-200">
                <h3 className="text-sm font-semibold text-indigo-700 mb-1">正答率</h3>
                <div className="flex items-end">
                    <p className="text-3xl font-bold text-gray-800">{stats.accuracy.toFixed(1)}</p>
                    <span className="text-base font-normal text-gray-500 ml-1 mb-1">%</span>
                </div>
            </div>
        </div>
    );
}
