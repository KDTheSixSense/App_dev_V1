'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

type Props = {
    date: Date | string;
    formatString?: string;
};

export default function FormattedDate({ date, formatString = 'yyyy/MM/dd HH:mm:ss' }: Props) {
    const [formatted, setFormatted] = useState<string>('');

    useEffect(() => {
        // This runs only on the client, ensuring the browser's timezone is used.
        const d = new Date(date);
        setFormatted(format(d, formatString, { locale: ja }));
    }, [date, formatString]);

    // Render a placeholder (or simplified server date) during SSR to match structure, 
    // but simpler to render nothing or a skeleton until hydration to ensure accuracy.
    if (!formatted) {
        return <span className="text-gray-300 animate-pulse">--:--:--</span>;
    }

    return <span>{formatted}</span>;
}
