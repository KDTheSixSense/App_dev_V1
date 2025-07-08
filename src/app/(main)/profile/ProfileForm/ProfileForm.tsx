'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * ユーザー情報を表すインターフェース
 */
interface User {
  username?: string | null;
  birth?: string | null;
  icon?: string | null; // ユーザーアイコンのURL
}

/**
 * ProfileFormコンポーネントのプロパティ
 */
interface ProfileFormProps {
  user: User | null;
}

/**
 * プロフィール編集フォームコンポーネント
 * ユーザーのニックネーム、生年月日、アイコンの表示と編集機能を提供します。
 */
export default function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter();
  // 編集モードかどうかの状態を管理
  const [isEditing, setIsEditing] = useState(false);
  // フォームの入力データを管理
  const [formData, setFormData] = useState<User>({
    username: user?.username || '',
    birth: user?.birth ? new Date(user.birth).toISOString().split('T')[0] : '',
    icon: user?.icon || null,
  });
  // フォームの初期データを保持し、キャンセル時に戻せるようにする
  const [initialData, setInitialData] = useState(formData);

  // userプロップが変更されたときにフォームデータを更新
  useEffect(() => {
    const initial = {
      username: user?.username || '',
      birth: user?.birth ? new Date(user.birth).toISOString().split('T')[0] : '',
      icon: user?.icon || null,
    };
    setFormData(initial);
    setInitialData(initial);
  }, [user]);

  /**
   * 編集ボタンクリック時のハンドラ
   * フォームを編集モードに切り替えます。
   */
  const handleEdit = () => {
    setIsEditing(true);
  };

  /**
   * キャンセルボタンクリック時のハンドラ
   * フォームを閲覧モードに戻し、データを初期状態に戻します。
   */
  const handleCancel = () => {
    setIsEditing(false);
    setFormData(initialData);
  };

  /**
   * 入力フィールドの変更ハンドラ
   * フォームデータを更新します。
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /**
   * アイコン変更時のハンドラ
   * 新しいアイコン画像をサーバーにアップロードし、成功したらフォームデータを更新します。
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
        router.refresh(); // ページをリフレッシュして最新のアイコンを表示
      } else {
        console.error('Failed to upload icon');
      }
    } catch (error) {
      console.error('An error occurred during icon upload:', error);
    }
  };

  /**
   * フォーム送信時のハンドラ
   * ユーザーのプロフィール情報をサーバーに送信し、更新します。
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditing) return; // 編集モードでない場合は何もしない

    try {
      const response = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsEditing(false);
        router.refresh(); // ページをリフレッシュして更新されたデータを表示
      } else {
        console.error('Failed to update profile');
        // エラーメッセージをユーザーに表示することも検討
      }
    } catch (error) {
      console.error('An error occurred:', error);
    }
  };

  return (
    <div className="flex flex-col bg-gray-100 p-6 rounded-lg shadow-lg border-white-200">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800">基本情報</h2>
      <form className="space-y-6" onSubmit={handleSubmit}>
        {/* アイコン表示と変更ボタン */}
        <div className="flex flex-col items-center mb-4">
          {formData.icon ? (
            <img src={formData.icon} alt="User Icon" className="w-24 h-24 rounded-full object-cover mb-2" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-4xl mb-2">
              ?
            </div>
          )}
          {isEditing && (
            <label className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white text-sm py-1 px-3 rounded-full">
              アイコンを変更
              <input type="file" className="hidden" onChange={handleIconChange} accept="image/*" />
            </label>
          )}
        </div>
        {/* ニックネーム入力フィールド */}
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">ニックネーム</label>
          <input
            type="text"
            id="username"
            name="username"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={formData.username || ''}
            onChange={handleChange}
            readOnly={!isEditing}
            placeholder="テキスト"
          />
        </div>
        {/* 生年月日入力フィールド */}
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
            placeholder="テキスト"
          />
        </div>
        {/* 編集/更新/キャンセルボタン */}
        <div className="flex justify-center mt-8">
          {isEditing ? (
            <div className="flex gap-4">
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-8 rounded-full transition duration-300"
              >
                更新
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-8 rounded-full transition duration-300"
              >
                キャンセル
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleEdit}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-8 rounded-full transition duration-300"
            >
              編集
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
