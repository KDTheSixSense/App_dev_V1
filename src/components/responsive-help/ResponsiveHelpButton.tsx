// src/components/responsive-help/ResponsiveHelpButton.tsx
"use client";

import React, { useState, useCallback, useEffect } from "react";
import { usePathname } from "next/navigation";
import ResponsiveHelpTour from "./ResponsiveHelpTour";
import { HelpStep } from "@/types/help";

const ResponsiveHelpButton: React.FC = () => {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [is404, setIs404] = useState(false);
  let page = pathname.split('/').slice(1, 4).join('/') || 'home'; // 例: /issue_list/basic_info_b_problem/1 -> issue_list/basic_info_b_problem/1, /group -> group, / -> home

  // Special handling for event pages
  if (pathname.startsWith('/event/event_detail') && pathname.includes('/problem/')) {
    page = 'event_detail_problem';
  } else if (pathname.startsWith('/event/event_detail')) {
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
  if (pathname.startsWith('/group') && pathname.includes('/admin')) {
    page = 'group/admin';
  } else if (pathname.startsWith('/group') && pathname.includes('/member')) {
    page = 'group/member';
  }

  // Special handling for group assignments create programming page
  if (pathname.includes('/group/') && pathname.includes('/assignments/create-programming')) {
    page = 'group_assignments_create_programming';
  }

  // Special handling for group select-page problem detail pages
  if (pathname.startsWith('/group/select-page/')) {
    page = 'group/select-page';
  }

  const [isTourOpen, setIsTourOpen] = useState(false);
  const [helpSteps, setHelpSteps] = useState<HelpStep[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // 404判定ロジックの強化
  useEffect(() => {
    const check404 = () => {
      const title = document.title;
      // Next.jsのデフォルト404画面に含まれる特定のテキストを取得
      const bodyText = document.body.innerText;

      // 判定条件:
      // 1. タイトルに "404" や "Page Not Found" が含まれる
      // 2. 画面内に "This page could not be found" (Next.jsデフォルト404の文言) が含まれる
      const isTitle404 = title.includes("404") || title.includes("Page Not Found");
      const isBody404 = bodyText.includes("This page could not be found") && bodyText.includes("404");

      if (isTitle404 || isBody404) {
        setIs404(true);
      } else {
        setIs404(false);
      }
    };

    // 即時チェック
    check404();

    // 描画遅延に対応するため、少しの間監視する (MutationObserverを使う手もありますが、インターバルで十分対応可能です)
    const intervalId = setInterval(check404, 500);

    // 3秒後には監視を止める（パフォーマンス考慮）
    const timeoutId = setTimeout(() => {
      clearInterval(intervalId);
    }, 3000);

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [pathname]); // pathnameが変わるたびに再チェック

  // Check if modal is open
  useEffect(() => {
    const checkModal = () => {
      const modal = document.querySelector('.modal, .overlay, [role="dialog"], div.fixed.inset-0.bg-black\\/30, div.fixed.inset-0.bg-gray-600');
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
      if (page === 'event_detail' || page === 'event_detail_problem') {
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

  // 1: 表示除外条件に '/terms' と '/privacypolicy' を追加
  if (
    !isClient ||
    pathname === '/auth/login' ||
    pathname === '/auth/register' ||
    pathname === '/auth/google/confirm' ||
    pathname === '/' ||
    pathname === '/terms' ||
    pathname === '/privacypolicy' ||
    is404 ||
    (isModalOpen && page !== 'group_assignments_create_programming')
  ) {
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
      {/* 画面右上に固定表示されるヘルプボタン（ヘッダーの下） - Responsive size */}
      {!isTourOpen && (
        <div className="help-button-container fixed top-24 right-4 z-[40]">
          <button
            onClick={handleStartTour}
            disabled={isLoading}
            className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 xl:w-16 xl:h-16 bg-[#b2ebf2] hover:bg-[#D3F7FF] text-black font-bold rounded-full shadow-lg flex items-center justify-center transition duration-300 ease-in-out transform hover:scale-105"
            aria-label="ヘルプツアーを開始"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 border-b-2 border-black"></div>
            ) : (
              <span className="text-lg sm:text-xl md:text-2xl font-bold">?</span>
            )}
          </button>
        </div>
      )}

      {/* ヘルプツアーの表示 */}
      {isTourOpen && helpSteps.length > 0 && (
        <ResponsiveHelpTour steps={helpSteps} onClose={handleCloseTour} />
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

export default ResponsiveHelpButton;
