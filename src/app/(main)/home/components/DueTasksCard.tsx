import React from 'react';
import { UnsubmittedAssignment } from '@/lib/data'; // Import type
import Link from 'next/link';

interface DueTasksCardProps {
    count: number;
    nextAssignment?: UnsubmittedAssignment | null; // Add prop
}

export default function DueTasksCard({ count, nextAssignment }: DueTasksCardProps) {
    // Generate link based on assignment type
    let linkPath = '/issue_list'; // Default fallback
    if (nextAssignment) {
        if (nextAssignment.programmingProblemId) {
            linkPath = `/group/coding-page/${nextAssignment.programmingProblemId}?assignmentId=${nextAssignment.id}&hashedId=${nextAssignment.groupHashedId}`;
        } else if (nextAssignment.selectProblemId) {
            linkPath = `/group/select-page/${nextAssignment.selectProblemId}?assignmentId=${nextAssignment.id}&hashedId=${nextAssignment.groupHashedId}`;
        } else if (nextAssignment.groupHashedId) {
            // Problem not attached -> Go to Group Member Page
            linkPath = `/group/${nextAssignment.groupHashedId}/member`;
        }
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm p-6 w-full mb-6">
            <h3 className="text-xl font-bold text-slate-800 mb-4">提出期限が近い課題</h3>

            {count > 0 ? (
                <div className="flex items-center justify-between bg-slate-50 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-200 rounded-lg text-slate-600">
                            {/* Icon placeholder */}
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="16" y1="13" x2="8" y2="13" />
                                <line x1="16" y1="17" x2="8" y2="17" />
                                <line x1="10" y1="9" x2="8" y2="9" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-bold text-slate-700">{nextAssignment?.title || '未提出の課題'}</p>
                            <p className="text-xs text-slate-500">残り {count} 件</p>
                        </div>
                    </div>

                    <Link href={linkPath} className="bg-[#009bf2] hover:bg-[#0089d6] text-white px-5 py-2.5 rounded-full font-bold flex items-center gap-2 transition-colors shadow-md">
                        <span>課題を解く</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="transform rotate-0">
                            <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                    </Link>
                </div>
            ) : (
                <div className="text-center text-slate-500 py-4">
                    現在、提出期限が近い課題はありません
                </div>
            )}
        </div>
    );
}
