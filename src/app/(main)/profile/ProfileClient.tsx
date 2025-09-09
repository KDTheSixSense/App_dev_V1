'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Title, User, UserUnlockedTitle, Status_Kohaku } from '@prisma/client';
import Chart from './Chart/Chart';
import PetStatusView from '../home/Pet/PetStatusView';
import Advice from './Advice/Advice';
import { updateUserProfileAction } from './actions';

// --- 型定義 ---
type SerializedUserUnlockedTitle = Omit<UserUnlockedTitle, 'unlockedAt'> & {
  unlockedAt: string;
  title: Title;
};

type SerializedUser = Omit<User, 'birth' | 'lastlogin' | 'unlockedTitles'> & {
  birth: string | null;
  lastlogin: string | null;
  unlockedTitles: SerializedUserUnlockedTitle[];
  selectedTitle: Title | null;
  Status_Kohaku: Status_Kohaku | null;
};

type UserStats = {
  loginDays: number;
  progress: {
    basicA: number;
    basicB: number;
    appliedMorning: number;
    appliedAfternoon: number;
    programming: number;
  };
};

interface ProfileClientProps {
  initialUser: SerializedUser;
  initialStats: UserStats;
  aiAdvice: string;
}

const presetIcons = {
  male: [ '/images/DefaultIcons/male1.jpg', '/images/DefaultIcons/male2.jpg', '/images/DefaultIcons/male3.jpg' ],
  female: [ '/images/DefaultIcons/female1.jpg', '/images/DefaultIcons/female2.jpg', '/images/DefaultIcons/female3.jpg' ],
};

export default function ProfileClient({ initialUser, initialStats, aiAdvice }: ProfileClientProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  
  const [formData, setFormData] = useState({
    username: initialUser.username || '',
    birth: initialUser.birth ? new Date(initialUser.birth).toISOString().split('T')[0] : '',
    icon: initialUser.icon || null,
    selectedTitleId: initialUser.selectedTitleId || null,
  });
  
  const [initialData, setInitialData] = useState(formData);
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [isTitleModalOpen, setIsTitleModalOpen] = useState(false);
  const [isIconModalOpen, setIsIconModalOpen] = useState(false);

  useEffect(() => {
    const initial = {
      username: initialUser.username || '',
      birth: initialUser.birth ? new Date(initialUser.birth).toISOString().split('T')[0] : '',
      icon: initialUser.icon || null,
      selectedTitleId: initialUser.selectedTitleId || null,
    };
    setFormData(initial);
    setInitialData(initial);
  }, [initialUser]);

  const handleEdit = () => setIsEditing(true);

  const handleCancel = () => {
    setIsEditing(false);
    setShowPasswordChange(false);
    setFormData(initialData);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleIconChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    const data = new FormData();
    data.append('icon', file);
    // (ここにアイコンアップロードのAPI通信処理を実装)
    console.log("Icon upload logic goes here.");
    setIsIconModalOpen(false);
  };
  
  const handlePresetIconSelect = (iconPath: string) => {
    setFormData((prev) => ({ ...prev, icon: iconPath }));
    setIsIconModalOpen(false);
  };
  
  const handleTitleSelect = (titleId: number | null) => {
    setFormData((prev) => ({ ...prev, selectedTitleId: titleId }));
    setIsTitleModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditing) return;

    setIsLoading(true);
    const result = await updateUserProfileAction(formData);
    setIsLoading(false);

    if (result.error) {
      alert(result.error);
    } else {
      setIsEditing(false);
      setShowPasswordChange(false);
      router.refresh();
    }
  };

  const displayedTitleName = isEditing
    ? initialUser.unlockedTitles.find(ut => ut.title.id === formData.selectedTitleId)?.title.name || '称号なし'
    : initialUser.selectedTitle?.name || '称号なし';

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto p-4 md:p-8">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">マイプロフィール</h1>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左カラム：プロフィール編集フォーム */}
          <div className="lg:col-span-2">
            <div className={`p-6 rounded-lg shadow-lg transition-all duration-300 ease-in-out ${isEditing ? 'bg-white border-blue-500 border-2' : 'bg-white'}`}>
              <h2 className="text-2xl font-semibold mb-6 text-gray-800">プロフィール情報</h2>
              <form className="space-y-6" onSubmit={handleSubmit}>
                {/* アイコンと称号 */}
                <div className="flex items-center mb-4">
                  <div className="w-24 h-24 mr-6 relative">
                    <img src={formData.icon || '/images/DefaultIcons/default.png'} alt="User Icon" className="w-full h-full rounded-full object-cover" />
                    {isEditing && (
                      <button type="button" onClick={() => setIsIconModalOpen(true)} className="absolute bottom-0 right-0 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-1 text-xs" title="アイコンを変更">変更</button>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-xl font-semibold text-gray-800 ${isEditing ? 'opacity-50' : ''}`}>{displayedTitleName}</span>
                    {isEditing && (
                      <button type="button" onClick={() => setIsTitleModalOpen(true)} className="mt-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm py-1 px-3 rounded-full">称号を切り替え</button>
                    )}
                  </div>
                </div>

                {/* ニックネーム */}
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">ニックネーム</label>
                  <input type="text" id="username" name="username" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm read-only:bg-gray-100" value={formData.username || ''} onChange={handleChange} readOnly={!isEditing} />
                </div>

                {/* 生年月日 */}
                <div>
                  <label htmlFor="birth" className="block text-sm font-medium text-gray-700 mb-1">生年月日</label>
                  <input type="date" id="birth" name="birth" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm read-only:bg-gray-100" value={formData.birth || ''} onChange={handleChange} readOnly={!isEditing} />
                </div>

                {/* パスワード変更 */}
                {isEditing && (
                  <div>
                    {!showPasswordChange ? (
                      <button type="button" onClick={() => setShowPasswordChange(true)} className="text-blue-500 hover:underline">パスワードを変更する</button>
                    ) : (
                      <div className="space-y-4 p-4 border-t border-gray-200">
                        {/* パスワード入力フィールド群 */}
                        <h3 className="font-semibold">パスワード変更</h3>
                        <div>
                          <label htmlFor="currentPassword">現在のパスワード</label>
                          <input type="password" id="currentPassword" name="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                        </div>
                        <div>
                          <label htmlFor="newPassword">新しいパスワード</label>
                          <input type="password" id="newPassword" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                        </div>
                        <div>
                          <label htmlFor="confirmPassword">新しいパスワード（確認）</label>
                          <input type="password" id="confirmPassword" name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ボタン */}
                <div className="flex justify-center mt-8">
                  {isEditing ? (
                    <div className="flex gap-4">
                      <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-8 rounded-full" disabled={isLoading}>{isLoading ? '更新中...' : '更新'}</button>
                      <button type="button" onClick={handleCancel} className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-8 rounded-full">キャンセル</button>
                    </div>
                  ) : (
                    <button type="button" onClick={handleEdit} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-8 rounded-full">編集</button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* 右カラム：ペット、チャート、アドバイス */}
          <div className="lg:col-span-1 space-y-8">
            <PetStatusView initialHunger={initialUser.Status_Kohaku?.hungerlevel ?? 200} maxHunger={200} />
            <Chart stats={initialStats} />
            <Advice advice={aiAdvice} />
          </div>
        </div>
      </div>

      {/* モーダル (称号・アイコン) はここに配置 */}
      {isTitleModalOpen && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl">
                <h3 className="text-lg font-semibold mb-4">称号を選択</h3>
                <ul className="space-y-2">
                    <li><button onClick={() => handleTitleSelect(null)} className="w-full text-left p-2 hover:bg-gray-100 rounded">称号なし</button></li>
                    {initialUser.unlockedTitles.map((ut) => (
                        <li key={ut.title.id}><button onClick={() => handleTitleSelect(ut.title.id)} className="w-full text-left p-2 hover:bg-gray-100 rounded">{ut.title.name}</button></li>
                    ))}
                </ul>
                <button onClick={() => setIsTitleModalOpen(false)} className="mt-4 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded">閉じる</button>
            </div>
         </div>
      )}
      {isIconModalOpen && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-11/12 max-w-md">
                <h3 className="text-lg font-semibold mb-4">アイコンを選択</h3>
                {/* プリセットアイコンの表示 */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                    {presetIcons.male.map(icon => <img key={icon} src={icon} alt="icon" className="w-20 h-20 rounded-full object-cover cursor-pointer hover:ring-2" onClick={() => handlePresetIconSelect(icon)}/>)}
                    {presetIcons.female.map(icon => <img key={icon} src={icon} alt="icon" className="w-20 h-20 rounded-full object-cover cursor-pointer hover:ring-2" onClick={() => handlePresetIconSelect(icon)}/>)}
                </div>
                {/* ファイルアップロード */}
                <label className="cursor-pointer bg-green-500 text-white text-sm py-2 px-4 rounded-full block text-center"><input type="file" className="hidden" onChange={handleIconChange} accept="image/*" />ファイルを選択</label>
                <button onClick={() => setIsIconModalOpen(false)} className="mt-6 bg-gray-200 text-gray-700 py-2 px-4 rounded w-full">閉じる</button>
            </div>
         </div>
      )}
    </div>
  );
}
