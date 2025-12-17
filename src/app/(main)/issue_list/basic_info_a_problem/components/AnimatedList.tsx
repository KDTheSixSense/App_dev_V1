"use client";

import React, { useRef, useState, useEffect } from "react";
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import styles from "./AnimatedList.module.css";

// 定義されたアイテムの型
// アイテムには title (タイトル), href (リンク先), solvedStatus (解答状況) が含まれます
export interface AnimatedListItem {
  id: number;
  title: string;
  href: string;
  solvedStatus?: "today" | "past" | "none";
}

interface AnimatedListProps {
  items: AnimatedListItem[];
  className?: string;
  showGradients?: boolean;
  enableArrowNavigation?: boolean; // キーボードナビゲーション用（今回はLink主体なので装飾的）
  displayScrollbar?: boolean;
}

const AnimatedList: React.FC<AnimatedListProps> = ({
  items,
  className = "",
  showGradients = true,
  displayScrollbar = true,
}) => {
  const listRef = useRef<HTMLDivElement>(null);
  const [showTopGradient, setShowTopGradient] = useState(false);
  const [showBottomGradient, setShowBottomGradient] = useState(true);

  // グラデーションの表示制御を行う関数
  const handleScroll = () => {
    if (!listRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;

    // 上部のグラデーション: スクロール位置が0より大きければ表示
    setShowTopGradient(scrollTop > 0);

    // 下部のグラデーション: 最後までスクロールしていなければ表示
    // 余裕を持たせるために -1 しています
    setShowBottomGradient(scrollTop < scrollHeight - clientHeight - 1);
  };

  useEffect(() => {
    const listEl = listRef.current;
    if (listEl) {
      listEl.addEventListener("scroll", handleScroll);
      // 初期チェック
      handleScroll();

      return () => {
        listEl.removeEventListener("scroll", handleScroll);
      };
    }
  }, [items]);

  return (
    <div className={`${styles.scrollListContainer} ${className}`}>
      {/* 上部グラデーション */}
      {showGradients && (
        <div
          className={styles.topGradient}
          style={{ opacity: showTopGradient ? 1 : 0 }}
        />
      )}

      {/* リスト本体 */}
      <div
        ref={listRef}
        className={`${styles.scrollList} ${!displayScrollbar ? styles.noScrollbar : ''}`}
      >
        {items.map((item) => (
          <a key={item.id} href={item.href} className={styles.item}>
            <span className={styles.itemText}>{item.title}</span>
            
            {/* 解答状況の表示 */}
            <div className="flex items-center gap-2">
              {item.solvedStatus === 'today' && (
                <span className={styles.statusToday}>
                  解答済み
                </span>
              )}
              {item.solvedStatus === 'past' && (
                <CheckCircleIcon className={styles.statusPast} />
              )}
            </div>
          </a>
        ))}
        {items.length === 0 && (
          <div className="text-gray-400 text-center py-8">
             問題が見つかりませんでした。
          </div>
        )}
      </div>

      {/* 下部グラデーション */}
      {showGradients && (
        <div
          className={styles.bottomGradient}
          style={{ opacity: showBottomGradient ? 1 : 0 }}
        />
      )}
    </div>
  );
};

export default AnimatedList;
