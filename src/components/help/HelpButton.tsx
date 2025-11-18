// src/components/help/HelpButton.tsx
"use client";

import React, { useState, useCallback, useEffect } from "react";
import { usePathname } from "next/navigation";
import HelpTour from "./HelpTour";
import { HelpStep } from "@/types/help";

const HelpButton: React.FC = () => {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  let page = pathname.split('/').slice(1, 4).join('/') || 'home'; // 例: /issue_list/basic_info_b_problem/1 -> issue_list/basic_info_b_problem/1, /group -> group, / -> home

  // Special handling for event pages
  if (pathname.startsWith('/event/event_detail')) {
    page = 'event_detail';
  } else if (pathname === '/event/event_list') {
    page = 'event';
  } else if (pathname === '/event/admin/create_event') {
    page = 'create_event';
  }

  // Special handling for basic info A problem detail pages
  if (pathname.startsWith('/issue_list/basic_info_a_problem/')) {
    page = 'issue_list/basic_info_a_problem';
  }

  // Special handling for basic info B problem detail pages
  if (pathname.startsWith('/issue_list/basic_info_b_problem/')) {
    page = 'issue_list/basic_info_b_problem';
  }
  // Special handling for basic info B problem detail pages
  if (pathname.startsWith('/issue_list/applied_info_morning_problem/')) {
    page = 'issue_list/applied_info_morning_problem';
  }
  // Special handling for basic info B problem detail pages
  if (pathname.startsWith('/issue_list/programming_problem/')) {
    page = 'issue_list/programming_problem';
  }
  // Special handling for basic info B problem detail pages
  if (pathname.startsWith('/issue_list/selects_problems/')) {
    page = 'issue_list/selects_problems';
  }
  // Special handling for basic info B problem detail pages
  if (pathname.startsWith('/issue_list/mine_issue_list/')) {
    page = 'issue_list/mine_issue_list';
  }

  // Special handling for group admin and member pages (only if not event pages)
  if (!pathname.startsWith('/event') && pathname.includes('/admin')) {
    page = 'group/admin';
  } else if (!pathname.startsWith('/event') && pathname.includes('/member')) {
    page = 'group/member';
  }

  // Special handling for group assignments create programming page
  if (pathname.includes('/group/') && pathname.includes('/assignments/create-programming')) {
    page = 'group_assignments_create_programming';
  }

  // Special handling for group coding page
  if (pathname.startsWith('/group/coding-page/')) {
    page = 'group/coding-page';
  }

  const [isTourOpen, setIsTourOpen] = useState(false);
  const [helpSteps, setHelpSteps] = useState<HelpStep[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Check if modal is open
  useEffect(() => {
    const checkModal = () => {
      const modal = document.querySelector('.modal, .overlay, [role="dialog"]');
      setIsModalOpen(!!modal);
    };

    checkModal();
    const interval = setInterval(checkModal, 100); // Check every 100ms

    return () => clearInterval(interval);
  }, []);

  // ヘルプコンテンツをAPIから取得する関数
  const fetchHelpSteps = useCallback(async (): Promise<HelpStep[] | null> => {
    setIsLoading(true);
    setError(null);
    try {
      // Next.js APIルートからデータを取得
      let url = page ? `/api/help?page=${encodeURIComponent(page)}` : "/api/help";
      if (page === 'event_detail') {
        const eventId = pathname.split('/')[3]; // Extract event ID from /event/event_detail/{id}
        if (eventId) {
          url += `&eventId=${encodeURIComponent(eventId)}`;
        }
      }
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("APIからのデータ取得に失敗しました。");
      }
      const data = await response.json();
      return data.steps;
    } catch (err) {
      console.error("Fetch error:", err);
      setError("ヘルプコンテンツの読み込み中にエラーが発生しました。");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [page, pathname]);

  // Hide help button on login page or when modal is open, except for group assignments create programming page
  if (!isClient || pathname === '/auth/login' || (isModalOpen && page !== 'group_assignments_create_programming')) {
    return null;
  }

  // ボタンクリックでツアーを開始
  const handleStartTour = async () => {
    // 常に最新のデータをロード
    const steps = await fetchHelpSteps();

    // データがロードされていればツアーを開始
    if (steps && steps.length > 0) {
      setHelpSteps(steps);
      setIsTourOpen(true);
    }
  };

  const handleCloseTour = () => {
    setIsTourOpen(false);
  };

  return (
    <>
      {/* 画面右上に固定表示されるヘルプボタン（ヘッダーの下） */}
      {!isTourOpen && (
        <div className="help-button-container fixed top-24 right-4 z-[10000]">
          <button
            onClick={handleStartTour}
            disabled={isLoading}
            className="w-14 h-14 bg-[#b2ebf2] hover:bg-[#D3F7FF] text-black font-bold rounded-full shadow-lg flex items-center justify-center transition duration-300 ease-in-out transform hover:scale-105"
            aria-label="ヘルプツアーを開始"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black"></div>
            ) : (
              <span className="text-2xl font-bold">?</span>
            )}
          </button>
        </div>
      )}

      {/* ヘルプツアーの表示 */}
      {isTourOpen && helpSteps.length > 0 && (
        <HelpTour steps={helpSteps} onClose={handleCloseTour} />
      )}

      {/* エラーメッセージの表示 */}
      {error && (
        <div className="fixed bottom-16 right-4 p-3 bg-red-500 text-white rounded shadow-lg z-[9999]">
          {error}
        </div>
      )}
    </>
  );
};

export default HelpButton;
