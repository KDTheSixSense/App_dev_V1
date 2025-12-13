'use client';

import { useState } from 'react';

type BanType = 'IP' | 'COOKIE_ID';

interface BanButtonProps {
    type: BanType;
    value: string;
    isUnban?: boolean;
    onAction: () => Promise<void>;
}

export function BanButton({ type, value, isUnban = false, onAction }: BanButtonProps) {
    const [loading, setLoading] = useState(false);

    const handleClick = async () => {
        setLoading(true);
        try {
            await onAction();
        } finally {
            setLoading(false);
        }
    };

    const label = isUnban
        ? (type === 'IP' ? 'IP 解除' : '端末 解除')
        : (type === 'IP' ? 'IP BAN' : '端末 BAN');

    const baseClasses = "text-[10px] px-1.5 py-0.5 rounded border transition-colors ml-1";
    const banClasses = type === 'IP'
        ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
        : 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100';

    const unbanClasses = "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100";

    return (
        <button
            onClick={handleClick}
            disabled={loading}
            className={`${baseClasses} ${isUnban ? unbanClasses : banClasses}`}
        >
            {loading ? '処理中...' : label}
        </button>
    );
}
