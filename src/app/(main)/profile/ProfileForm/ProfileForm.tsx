'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * ユーザー情報を表すインターフェース
 */
interface User {
  username?: string;
  birth?: string | null;
  icon?: string | null; // ユーザーアイコンのURL
  title?: string | null; // 称号
}

/**
 * ProfileFormコンポーネントのプロパティ
 */
interface ProfileFormProps {
  user: User | null;
}

// プリセットアイコンの定義
const presetIcons = {
  male: [
    '/images/DefaultIcons/male1.jpg',
    '/images/DefaultIcons/male2.jpg',
    '/images/DefaultIcons/male3.jpg',
  ],
  female: [
    '/images/DefaultIcons/female1.jpg',
    '/images/DefaultIcons/female2.jpg',
    '/images/DefaultIcons/female3.jpg',
  ],
};

/**
 * プロフィール編集フォームコンポーネント
 * ユーザーのニックネーム、生年月日、アイコン、称号、パスワードの表示と編集機能を提供します。
 */
export default function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter();
  // 編集モードかどうかの状態を管理
  const [isEditing, setIsEditing] = useState(false);
  // パスワード変更フォームの表示状態
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  // フォームの入力データを管理
  const [formData, setFormData] = useState<User>({
    username: user?.username || '',
    birth: user?.birth ? new Date(user.birth).toISOString().split('T')[0] : '',
    icon: user?.icon || null,
    title: user?.title || '称号なし',
  });
  // フォームの初期データを保持し、キャンセル時に戻せるようにする
  const [initialData, setInitialData] = useState(formData);
  // パスワード関連のstate
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // 称号モーダルの表示状態
  const [isTitleModalOpen, setIsTitleModalOpen] = useState(false);
  // アイコン選択モーダルの表示状態
  const [isIconModalOpen, setIsIconModalOpen] = useState(false);

  // 仮の称号リスト
  const titles = ['称号なし', '駆け出しエンジニア', 'ベテランエンジニア', 'コードマスター'];

  // userプロップが変更されたときにフォームデータを更新
  useEffect(() => {
    const initial = {
      username: user?.username || '',
      birth: user?.birth ? new Date(user.birth).toISOString().split('T')[0] : '',
      icon: user?.icon || null,
      title: user?.title || '称号なし',
    };
    setFormData(initial);
    setInitialData(initial);
  }, [user]);

  /**
   * 編集ボタンクリック時のハンドラ
   */
  const handleEdit = () => {
    setIsEditing(true);
  };

  /**
   * キャンセルボタンクリック時のハンドラ
   */
  const handleCancel = () => {
    setIsEditing(false);
    setShowPasswordChange(false);
    setFormData(initialData);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  /**
   * 入力フィールドの変更ハンドラ
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /**
   * パスワード入力フィールドの変更ハンドラ
   */
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  /**
   * アイコン変更時のハンドラ (ファイルアップロード)
   */
  const handleIconChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }

    const file = e.target.files[0];
    const data = new FormData();
    data.append('icon', file);

    try {
      const response = await fetch('/api/user/icon', {
        method: 'POST',
        body: data,
      });

      if (response.ok) {
        const result = await response.json();
        setFormData((prev) => ({ ...prev, icon: result.iconPath }));
        router.refresh();
      } else {
        console.error('Failed to upload icon');
      }
    } catch (error) {
      console.error('An error occurred during icon upload:', error);
    }
    setIsIconModalOpen(false); // アップロード後モーダルを閉じる
  };

  /**
   * プリセットアイコン選択時のハンドラ
   */
  const handlePresetIconSelect = (iconPath: string) => {
    setFormData((prev) => ({ ...prev, icon: iconPath }));
    setIsIconModalOpen(false);
  };

  /**
   * フォーム送信時のハンドラ
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditing) return;

    try {
      // プロフィール情報の更新
      const profileResponse = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!profileResponse.ok) {
        console.error('Failed to update profile');
        return;
      }

      // パスワードの更新（必要な場合）
      if (showPasswordChange && passwordData.newPassword) {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
          alert('新しいパスワードが一致しません。');
          return;
        }
        const passwordResponse = await fetch('/api/auth/password-change', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword,
          }),
        });

        if (!passwordResponse.ok) {
          console.error('Failed to update password');
          // エラーメッセージをユーザーに表示
          const errorData = await passwordResponse.json();
          alert(errorData.message || 'パスワードの更新に失敗しました。');
          return;
        }
      }

      setIsEditing(false);
      setShowPasswordChange(false);
      router.refresh();
    } catch (error) {
      console.error('An error occurred:', error);
    }
  };

  /**
   * 称号選択ハンドラ
   */
  const handleTitleSelect = (title: string) => {
    setFormData((prev) => ({ ...prev, title }));
    setIsTitleModalOpen(false);
  };

  return (
    <div className={`flex flex-col p-6 rounded-lg shadow-lg ${isEditing ? 'bg-white border-blue-500 border-2' : 'bg-gray-100 border-white-200'}`}>
      <h2 className="text-2xl font-semibold mb-6 text-gray-800">プロフィール</h2>
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="flex items-center mb-4">
          {/* アイコン表示 */}
          <div className="w-24 h-24 mr-6 relative">
            {formData.icon ? (
              <img src={formData.icon} alt="User Icon" className="w-full h-full rounded-full object-cover" />
            ) : (
              <div className="w-full h-full rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-4xl">
                ?
              </div>
            )}
            {isEditing && (
              <button
                type="button"
                onClick={() => setIsIconModalOpen(true)}
                className="absolute bottom-0 right-0 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-1 text-xs"
                title="アイコンを変更"
              >
                変更
              </button>
            )}
          </div>
          {/* 称号表示とアイコン変更ボタン */}
          <div className="flex flex-col">
            <div className="flex items-center">
              <span className={`text-xl font-semibold text-gray-800 ${isEditing ? 'opacity-50' : ''}`}>{formData.title}</span>
              {isEditing && (
                <button
                  type="button"
                  onClick={() => setIsTitleModalOpen(true)}
                  className="ml-4 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm py-1 px-3 rounded-full"
                >
                  称号を切り替え
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ニックネーム入力 */}
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">ニックネーム</label>
          <input
            type="text"
            id="username"
            name="username"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={formData.username}
            onChange={handleChange}
            readOnly={!isEditing}
          />
        </div>

        {/* 生年月日入力 */}
        <div>
          <label htmlFor="birth" className="block text-sm font-medium text-gray-700 mb-1">生年月日</label>
          <input
            type="date"
            id="birth"
            name="birth"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={formData.birth || ''}
            onChange={handleChange}
            readOnly={!isEditing}
          />
        </div>

        {/* パスワード変更セクション */}
        {isEditing && (
          <div>
            {!showPasswordChange ? (
              <button
                type="button"
                onClick={() => setShowPasswordChange(true)}
                className="text-blue-500 hover:underline"
              >
                パスワードを変更する
              </button>
            ) : (
              <div className="space-y-4 p-4 border-t border-gray-200">
                <h3 className="font-semibold">パスワード変更</h3>
                <div>
                  <label htmlFor="currentPassword">現在のパスワード</label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                  />
                </div>
                <div>
                  <label htmlFor="newPassword">新しいパスワード</label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                  />
                </div>
                <div>
                  <label htmlFor="confirmPassword">新しいパスワード（確認）</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ボタン */}
        <div className="flex justify-center mt-8">
          {isEditing ? (
            <div className="flex gap-4">
              <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-8 rounded-full">
                更新
              </button>
              <button type="button" onClick={handleCancel} className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-8 rounded-full">
                キャンセル
              </button>
            </div>
          ) : (
            <button type="button" onClick={handleEdit} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-8 rounded-full">
              編集
            </button>
          )}
        </div>
      </form>

      {/* 称号選択モーダル */}
      {isTitleModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <h3 className="text-lg font-semibold mb-4">称号を選択</h3>
            <ul className="space-y-2">
              {titles.map((title) => (
                <li key={title}>
                  <button
                    onClick={() => handleTitleSelect(title)}
                    className="w-full text-left p-2 hover:bg-gray-100 rounded"
                  >
                    {title}
                  </button>
                </li>
              ))}
            </ul>
            <button
              onClick={() => setIsTitleModalOpen(false)}
              className="mt-4 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded"
            >
              閉じる
            </button>
          </div>
        </div>
      )}

      {/* アイコン選択モーダル */}
      {isIconModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-11/12 max-w-md">
            <h3 className="text-lg font-semibold mb-4">アイコンを選択</h3>
            <div className="mb-4">
              <h4 className="font-medium mb-2">プリセットアイコン (男性)</h4>
              <div className="grid grid-cols-3 gap-4 mb-4">
                {presetIcons.male.map((iconPath) => (
                  <img
                    key={iconPath}
                    src={iconPath}
                    alt="Preset Male Icon"
                    className="w-20 h-20 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-blue-500"
                    onClick={() => handlePresetIconSelect(iconPath)}
                  />
                ))}
              </div>
              <h4 className="font-medium mb-2">プリセットアイコン (女性)</h4>
              <div className="grid grid-cols-3 gap-4">
                {presetIcons.female.map((iconPath) => (
                  <img
                    key={iconPath}
                    src={iconPath}
                    alt="Preset Female Icon"
                    className="w-20 h-20 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-blue-500"
                    onClick={() => handlePresetIconSelect(iconPath)}
                  />
                ))}
              </div>
            </div>
            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium mb-2">画像をアップロード</h4>
              <label className="cursor-pointer bg-green-500 hover:bg-green-600 text-white text-sm py-2 px-4 rounded-full block text-center">
                ファイルを選択
                <input type="file" className="hidden" onChange={handleIconChange} accept="image/*" />
              </label>
            </div>
            <button
              onClick={() => setIsIconModalOpen(false)}
              className="mt-6 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
