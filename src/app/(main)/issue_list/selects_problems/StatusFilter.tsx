'use client';

import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const statuses = [
  { id: 'all', name: 'すべての状態' },
  { id: 'today', name: '解答済み' },
  { id: 'past', name: '過去に解答済み' },
];

export default function StatusFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get('status') || 'all';

  useEffect(() => {
    const savedStatus = localStorage.getItem('select_problems_filter_status');

    const params = new URLSearchParams(searchParams.toString());
    let shouldUpdate = false;

    if (!searchParams.has('status') && savedStatus && savedStatus !== 'all') {
      params.set('status', savedStatus);
      shouldUpdate = true;
    }

    if (shouldUpdate) {
      router.replace(`?${params.toString()}`);
    }
  }, [searchParams, router]);

  const updateParams = (key: string, value: string) => {
    localStorage.setItem(`select_problems_filter_${key}`, value);
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="mb-6 flex justify-end max-w-6xl mx-auto">
      <div className="relative">
        <select
          value={currentStatus}
          onChange={(e) => updateParams('status', e.target.value)}
          className="appearance-none bg-white border border-gray-300 text-gray-700 py-2 pl-4 pr-10 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer font-medium"
        >
          {statuses.map((status) => (
            <option key={status.id} value={status.id}>
              {status.name}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
          </svg>
        </div>
      </div>
    </div>
  );
}