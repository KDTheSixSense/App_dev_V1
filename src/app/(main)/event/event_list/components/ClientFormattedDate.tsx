'use client';

import { useState, useEffect } from 'react';

/**
 * 日付を 'YYYY年M月D日' 形式の文字列に整形します。
 * @param date - Dateオブジェクト、文字列、またはnull
 * @returns 整形された日付文字列、または '開始日未定'
 */
const formatDate = (date: Date | string | null | undefined): string => {
  if (!date) {
    return '開始日未定';
  }
  try {
    return new Date(date).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (e) {
    return '無効な日付';
  }
};

export default function ClientFormattedDate({ date }: { date: Date | string | null | undefined }) {
  // このコンポーネントは isClient ガードの内側でのみ使用されるため、
  // クライアントサイドでの実行が保証されています。
  return <span>{formatDate(date)}</span>;
}