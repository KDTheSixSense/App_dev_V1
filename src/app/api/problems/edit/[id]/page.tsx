// このファイルは app/(main)/problems/edit/[id]/page.tsx のような
// ページ用のディレクトリに配置されることを想定しています。
// app/api/ ディレクトリ内ではページとして機能しません。
'use client';

// エラーを解消するために必要なReactとNext.jsの機能をインポートします
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation'; // App Routerでは useSearchParams や useParams を使います

export default function EditProgrammingQuestionPage() {
  // App Routerでは、useRouterは `next/navigation` からインポートします
  const router = useRouter();
  // URLの動的な部分（[id]）を取得するには、useParamsを使います
  const params = useParams(); 
  const [problemId, setProblemId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [isEditMode, setIsEditMode] = useState(true); // このページは常に編集モードです

  useEffect(() => {
    // params.id が文字列または文字列の配列になる可能性があるため、型をチェックします
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    if (id) {
        const parsedId = parseInt(id, 10);
        if (!isNaN(parsedId)) {
            setProblemId(parsedId);
        }
    }
  }, [params.id]); // params.id の変更を監視します

  useEffect(() => {
    console.log('=== DEBUG INFO ===');
    console.log('problemId:', problemId);
    console.log('isEditMode:', isEditMode);
    console.log('window.location:', window.location.href);
    console.log('==================');
  }, [problemId, isEditMode]);

  // このコンポーネントは本来、CreateProgrammingQuestionPageコンポーネントと
  // 多くのUIやロジックを共有するはずです。
  // ここではエラー解消のための最小限の修正のみを行っています。
  return (
    <div>
        <h1>問題編集ページ (ID: {problemId})</h1>
        <p>（ここに問題編集フォームが表示されます）</p>
    </div>
  );
}
