'use client';
import React, { useState, useRef, useEffect } from 'react';

// アイコンを少し小さく調整
const CreateIcon = () => <img src="/images/add_circle.png" width="24" height="24"/>;
const JoinIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>;
const PlusIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>;

interface FABProps {
  onCreateClick: () => void;
  onJoinClick: () => void;
}

const FloatingActionButton: React.FC<FABProps> = ({ onCreateClick, onJoinClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const fabRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={fabRef} style={{ position: 'fixed', right: '40px', bottom: '40px', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
      
      {/* サブボタン (テキストラベル付き) */}
      <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          marginBottom: '16px',
          // isOpenがfalseの時は非表示にする
          visibility: isOpen ? 'visible' : 'hidden',
          opacity: isOpen ? 1 : 0,
          transition: 'all 0.2s ease-out',
          transform: isOpen ? 'translateY(0)' : 'translateY(10px)',
      }}>
          <div onClick={onCreateClick} style={subActionStyle}>
              <span style={labelStyle}>クラスを作成</span>
              <div style={subButtonStyle}><CreateIcon /></div>
          </div>
          <div onClick={onJoinClick} style={{...subActionStyle, marginTop: '12px'}}>
              <span style={labelStyle}>クラスに参加</span>
              <div style={subButtonStyle}><JoinIcon /></div>
          </div>
      </div>

      {/* メインのプラスボタン */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="アクションメニューを開く"
        style={{
          ...mainButtonStyle,
          transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
        }}
      >
        <PlusIcon />
      </button>
    </div>
  );
};

// スタイルの定義
const mainButtonStyle: React.CSSProperties = {
  width: '56px',
  height: '56px',
  borderRadius: '50%',
  backgroundColor: '#1976d2',
  color: '#fff',
  border: 'none',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'transform 0.3s ease',
};

// 新しいスタイル定義
const subActionStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
};

const labelStyle: React.CSSProperties = {
    backgroundColor: '#fff',
    color: '#3c4043',
    padding: '6px 12px',
    borderRadius: '4px',
    marginRight: '16px',
    fontSize: '14px',
    fontWeight: 500,
    boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
    whiteSpace: 'nowrap', // 改行を防ぐ
};

const subButtonStyle: React.CSSProperties = {
  width: '48px',
  height: '48px',
  borderRadius: '50%',
  backgroundColor: '#f1f3f4',
  color: '#3c4043',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
};

export default FloatingActionButton;