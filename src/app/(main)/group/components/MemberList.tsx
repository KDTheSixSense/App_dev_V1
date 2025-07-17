'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

// APIから受け取るメンバーの型を定義
interface Member {
  user: {
    id: number;
    username: string | null;
    icon: string | null;
  };
  admin_flg: boolean;
}

// 親コンポーネントから渡されるプロパティの型
interface MemberListProps {
  members: Member[];
  memberCount: number;
  inviteCode: string;
}

// メンバーを一人表示するための再利用可能なコンポーネント
const MemberItem: React.FC<{ member: Member }> = ({ member }) => (
  <div className="flex items-center p-2 hover:bg-slate-100 rounded-md">
    {/* <Link href={`/users/${member.user.id}`} className="flex items-center w-full"> */}
      <Image
        src={member.user.icon || '/images/test_icon.webp'}
        alt={`${member.user.username}のアイコン`}
        width={32}
        height={32}
        className="w-8 h-8 rounded-full object-cover"
      />
      <span className="ml-3 text-sm font-medium text-slate-700">
        {member.user.username || '名無しさん'}
      </span>
    {/* </Link> */}
  </div>
);


// メインのメンバー一覧表示コンポーネント
const MemberList: React.FC<MemberListProps> = ({ members, memberCount, inviteCode}) => {
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [copied, setCopied] = useState(false);
  // メンバーリストを管理者と一般メンバーに振り分ける
  const admins = members.filter(member => member.admin_flg);
  const regularMembers = members.filter(member => !member.admin_flg);

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteCode).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); // 2秒後に表示を元に戻す
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800">
          メンバー一覧 ({memberCount})
        </h3>
        <button 
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-indigo-600 border border-indigo-300 rounded-full hover:bg-indigo-50 transition-colors"
          aria-label="メンバーを招待"
        >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>
          招待
        </button>
      </div>
      {/* 管理者セクション */}
      <div>
        <h4 className="text-base font-bold text-slate-60 border-b-2 border-slate-200 pb-2 mb-2">
          管理者
        </h4>
        <div className="space-y-1">
          {admins.length > 0 ? (
            admins.map(member => <MemberItem key={member.user.id} member={member} />)
          ) : (
            <p className="text-sm text-slate-500 p-2">管理者はいません。</p>
          )}
        </div>
      </div>

      {/* メンバーセクション */}
      <div className="mt-6">
        <h4 className="text-base font-bold text-slate-600 border-b-2 border-slate-200 pb-2 mb-2">
          メンバー
        </h4>
        <div className="space-y-1">
          {regularMembers.length > 0 ? (
            regularMembers.map(member => <MemberItem key={member.user.id} member={member} />)
          ) : (
            <p className="text-sm text-slate-500 p-2">メンバーはいません。</p>
          )}
        </div>
      </div>
      {showInviteModal && (
      <div className="fixed inset-0 bg-black/25 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowInviteModal(false)}>
          <div className="bg-white p-6 rounded-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
              <h4 className="text-lg font-bold mb-4">メンバーを招待</h4>
              <p className="text-sm text-gray-600 mb-2">この招待コードを共有して、メンバーをグループに招待します。</p>
              <div className="flex items-center gap-2 p-2 border rounded-md bg-slate-100">
                  <input 
                      type="text"
                      value={inviteCode}
                      readOnly
                      className="flex-grow bg-transparent outline-none font-mono text-lg"
                  />
                  <button onClick={handleCopy} className="px-3 py-1 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600">
                      {copied ? 'コピー完了!' : 'コピー'}
                  </button>
              </div>
              <button onClick={() => setShowInviteModal(false)} className="mt-4 w-full text-center py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md">
                  閉じる
              </button>
          </div>
      </div>
    )}
    </div>
  );
};

export default MemberList;