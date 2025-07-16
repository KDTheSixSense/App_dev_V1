'use client';

import React from 'react';
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
}

// メンバーを一人表示するための再利用可能なコンポーネント
const MemberItem: React.FC<{ member: Member }> = ({ member }) => (
  <div className="flex items-center p-2 hover:bg-slate-100 rounded-md">
    <Link href={`/users/${member.user.id}`} className="flex items-center w-full">
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
    </Link>
  </div>
);


// メインのメンバー一覧表示コンポーネント
const MemberList: React.FC<MemberListProps> = ({ members, memberCount }) => {
  // メンバーリストを管理者と一般メンバーに振り分ける
  const admins = members.filter(member => member.admin_flg);
  const regularMembers = members.filter(member => !member.admin_flg);

  return (
    <div>
      <h3 className="text-lg font-semibold text-slate-800 mb-4">
        メンバー一覧 ({memberCount})
      </h3>

      {/* 管理者セクション */}
      <div>
        <h4 className="text-base font-bold text-indigo-600 border-b-2 border-indigo-200 pb-2 mb-2">
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
    </div>
  );
};

export default MemberList;