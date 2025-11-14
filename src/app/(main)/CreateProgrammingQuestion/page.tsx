'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation';

interface Case {
  id: number | null;
  input: string;
  expectedOutput: string;
  description: string;
}

interface TestCase extends Case {
  name: string;
}

interface FormData {
  title: string;
  problemType: string;
  difficulty: number;
  timeLimit: number;
  category: string;
  topic: string;
  tags: string[]; // never[] ではなく string[]
  description: string;
  codeTemplate: string;
  isPublic: boolean;
  allowTestCaseView: boolean;
}

interface UploadedFile {
  file: File;
  name: string;
  size: number;
  type: string;
  url: string;
}

interface EventDifficulty {
  id: number;
  difficultyName: string;
  expectedTimeMinutes: number;
}

// プログラミング問題作成ページのメインコンポーネント（改良版）
export default function CreateProgrammingQuestionPage() {
  // フォームの状態管理
  const searchParams = useSearchParams();
  const [problemId, setProblemId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('basic') // アクティブなタブ
  const [selectedCategory, setSelectedCategory] = useState('programming') // 選択されたカテゴリ
  const [isEditMode, setIsEditMode] = useState(false) // 編集モードかどうか
  const [formData, setFormData] = useState<FormData>({
    title: '',
    problemType: 'コーディング問題',
    difficulty: 4,
    timeLimit: 10,
    category: 'プログラミング基礎',
    topic: '標準入力',
    tags: [],
    description: '',
    codeTemplate: '',
    isPublic: false,
    allowTestCaseView: false
  })
  
  const [sampleCases, setSampleCases] = useState<Case[]>([
    { id: null, input: '', expectedOutput: '', description: '' } 
  ])

  
  const [testCases, setTestCases] = useState<TestCase[]>([
    { id: null, name: 'ケース1', input: '', expectedOutput: '', description: '' } 
  ])
  
  const [tagInput, setTagInput] = useState('')
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [showPreview, setShowPreview] = useState(false)
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [eventDifficulties, setEventDifficulties] = useState<EventDifficulty[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<EventDifficulty | null>(null);

  // トピックリスト（重要な項目のみ）
  const topics = [
    '標準入力',
    '配列操作',
    '文字列処理',
    'ループ処理',
    '条件分岐',
    '関数・メソッド',
    'データ構造',
    'アルゴリズム'
  ]

  useEffect(() => {
    const fetchDifficulties = async () => {
      try {
        const response = await fetch('/api/event-difficulties');
        if (!response.ok) {
          throw new Error('Failed to fetch event difficulties');
        }
        const data: EventDifficulty[] = await response.json();
        setEventDifficulties(data);
        const initialDifficulty = data.find(d => d.id === formData.difficulty);
        if (initialDifficulty) {
          setSelectedDifficulty(initialDifficulty);
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchDifficulties();
  }, [formData.difficulty]);

  useEffect(() => {
  console.log('=== DEBUG INFO ===');
  console.log('problemId:', problemId);
  console.log('isEditMode:', isEditMode);
  console.log('searchParams.get("id"):', searchParams.get('id'));
  console.log('window.location:', window.location.href);
  console.log('==================');
}, [problemId, isEditMode, searchParams]);


  useEffect(() => {
  const idFromQuery = searchParams.get('id');
  console.log('idFromQuery:', idFromQuery);

  if (idFromQuery) {
    const parsedId = parseInt(idFromQuery);
    console.log('parsedId:', parsedId);

    if (!isNaN(parsedId) && parsedId > 0) {
      setProblemId(parsedId);
      setIsEditMode(true);
      console.log('Edit mode activated for ID:', parsedId);
    } else {
      console.error("Error: Invalid problemId. Raw value:", idFromQuery);
      alert('エラー: 無効な問題IDです');
      setProblemId(null);
      setIsEditMode(false);
    }
  } else {
    setProblemId(null);
    setIsEditMode(false);
    console.log('Create mode activated');
  }
}, [searchParams]);


  // タブ切り替え処理
  useEffect(() => {
    if (problemId && isEditMode) {
      console.log('Fetching data for problem ID:', problemId);

      const fetchProblemData = async () => {
        try {
          const response = await fetch(`/api/problems/${problemId}`); 
          console.log('Fetch response status:', response.status);

          if (!response.ok) {
            if (response.status === 404) {
            throw new Error(`問題ID ${problemId} が見つかりません`);
          }
           throw new Error('問題データの読み込みに失敗しました');
        }
          const data = await response.json();
          console.log('Fetched data:', data);

          setFormData({
          title: data.title || '',
          problemType: data.problemType || 'コーディング問題',
          difficulty: data.difficulty || 4,
          timeLimit: data.timeLimit || 10,
          category: data.category || 'プログラミング基礎',
          topic: data.topic || '標準入力',
          tags: JSON.parse(data.tags || '[]'), 
          description: data.description || '',
          codeTemplate: data.codeTemplate || '',
          isPublic: data.isPublic || false,
          allowTestCaseView: data.allowTestCaseView || false,
        });

          setSampleCases(data.sampleCases && data.sampleCases.length > 0 ? data.sampleCases : [{ id: null, input: '', expectedOutput: '', description: '' }]);
          setTestCases(data.testCases && data.testCases.length > 0 ? data.testCases : [{ id: null, name: 'ケース1', input: '', expectedOutput: '', description: '' }]);

          console.log('Data loaded successfully');
          
        } catch (error: any) {
          console.error('Error loading problem for edit:', error);
          alert(`問題データの読み込みに失敗しました: ${error.message}`);
          setIsEditMode(false);
          setProblemId(null); 
        }
      };
      fetchProblemData();
    }
  }, [problemId, isEditMode]); 

  // マークダウンツールバー用の関数
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertMarkdown = (before: string, after: string = '', placeholder: string = '') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = formData.description.substring(start, end)
    const textToInsert = selectedText || placeholder

    const newText = formData.description.substring(0, start) + 
                   before + textToInsert + after + 
                   formData.description.substring(end)

    setFormData(prev => ({ ...prev, description: newText }))

    // カーソル位置を調整
    setTimeout(() => {
      textarea.focus()
      if (selectedText) {
        textarea.setSelectionRange(start, start + before.length + textToInsert.length + after.length)
      } else {
        textarea.setSelectionRange(start + before.length, start + before.length + textToInsert.length)
      }
    }, 0)
  }

  const handleBold = () => insertMarkdown('**', '**', '太字テキスト')
  const handleItalic = () => insertMarkdown('*', '*', '斜体テキスト')
  const handleUnderline = () => insertMarkdown('<u>', '</u>', '下線テキスト')
  const handleStrikethrough = () => insertMarkdown('~~', '~~', '打ち消しテキスト')
  const handleCode = () => insertMarkdown('`', '`', 'コード')
  const handleLink = () => {
    const url = prompt('リンクURLを入力してください:', 'https://')
    if (url) {
      insertMarkdown('[', `](${url})`, 'リンクテキスト')
    }
  }

  // カテゴリリスト
  const categories = [
    { id: 'programming', name: 'プログラミング', subItems: [] },
    // { id: 'itpassport', name: 'ITパスポート', subItems: [] },
    // { id: 'basic-a', name: '基本情報 A', subItems: [] },
    // { id: 'basic-b', name: '基本情報 B', subItems: [] },
    // { id: 'applied-morning', name: '応用情報 午前', subItems: [] },
    // { id: 'applied-afternoon', name: '応用情報 午後', subItems: [] },
    // { id: 'information', name: '情報検定', subItems: [] },
  ]

  // カテゴリ選択処理
  const handleCategorySelect = (categoryId: string, categoryName: string) => {
    setSelectedCategory(categoryId)
    setFormData(prev => ({
      ...prev,
      category: categoryName
    }))
  }

  // タグ追加処理
  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }))
      setTagInput('')
    }
  }

  // タグ削除処理
  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  // サンプルケース追加処理
  const addSampleCase = () => {
    const newId = Math.max(...sampleCases.map(c => c.id ?? 0)) + 1;
    setSampleCases(prev => [...prev, { id: newId, name: `ケース${testCases.length + 1}`, input: '', expectedOutput: '', description: '' }]);
  }

  // サンプルケース削除処理
  const removeSampleCase = (id: number | null) => {
    setSampleCases(prev => prev.filter(c => c.id !== id))
  }

  // テストケース追加処理
  const addTestCase = () => {
    const newId = Math.max(...testCases.map(c => c.id ?? 0)) + 1;
    setTestCases(prev => [...prev, { id: newId, name: `ケース${testCases.length + 1}`, input: '', expectedOutput: '', description: '' }]);
  }

  // テストケース削除処理
  const removeTestCase = (id: number | null) => {
    setTestCases(prev => prev.filter(c => c.id !== id))
  }

  // ファイルアップロード処理（改良版）
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return; // filesがnullの場合のガード
    const uploadedFiles = Array.from(event.target.files)
    const filesWithPreview = uploadedFiles.map(file => ({
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file)
    }))
    setFiles(prev => [...prev, ...filesWithPreview])
  }

  // ファイルプレビュー処理
  const handlePreviewFile = (file: UploadedFile) => {
    setPreviewFile(file)
    setShowPreview(true)
  }

  // プレビューを閉じる処理
  const closePreview = () => {
    setShowPreview(false)
    setPreviewFile(null)
  }

  // 問題更新処理 (Update Problem)
  const handleUpdateProblem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!problemId || problemId <= 0) { 
    alert('エラー: 更新する問題IDが見つかりません。ページを再読み込みしてください。');
    setIsSubmitting(false);
    return;
  }
    console.log('Updating problem with ID:', problemId);

    try {
      const response = await fetch(`/api/problems/${problemId}`, { 
        method: 'PUT', 
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          sampleCases: sampleCases.filter(sc => sc.input || sc.expectedOutput),
          testCases: testCases.filter(tc => tc.input || tc.expectedOutput),
        }),
      });

      console.log('Update response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Update error:', errorData);
        const errorMessage = errorData.message || '不明なエラーが発生しました';
        throw new Error(`問題の更新に失敗しました: ${errorMessage}`);
      }

    const result = await response.json();
    console.log('Update successful:', result);
    alert('問題が正常に更新されました！');

    } catch (error: any) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error updating problem:', error);
      alert(`エラーが発生しました: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }; 


  // ファイル削除処理（改良版）
  const removeFile = (index: number) => {
    const fileToRemove = files[index]
    if (fileToRemove.url) {
      URL.revokeObjectURL(fileToRemove.url)
    }
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  // ファイルタイプの判定
  const isImageFile = (file: UploadedFile) => {
    return file.type && file.type.startsWith('image/')
  }

  const isTextFile = (file: UploadedFile) => {
    const textTypes = ['text/', 'application/json', 'application/xml']
    return textTypes.some(type => file.type && file.type.startsWith(type))
  }

  // 下書き保存処理
  const handleSaveDraft = async () => {
    // e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/problems/draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          sampleCases: sampleCases.filter(sc => sc.input || sc.expectedOutput),
          testCases: testCases.filter(tc => tc.input || tc.expectedOutput),
          isDraft: true
        }),
      })
      
      if (!response.ok) {

       const errorData = await response.json(); 
        const errorMessage = errorData.message || '不明なエラーが発生しました'; 
        throw new Error(`下書きの保存に失敗しました: ${errorMessage}`); 
      }
      
      alert('下書きが保存されました！')
      
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error:', error);
      alert(`エラーが発生しました: ${message}`);
    } finally {
      setIsSubmitting(false)
    }
  }

  // 問題投稿処理
  const handlePublishProblem = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault()
  setIsSubmitting(true)
  
  try {
    // ★ 修正: 送信するデータに sampleCases と testCases を含める
    const problemData = {
      ...formData,
      tags: JSON.stringify(formData.tags), // tagsはJSON文字列に変換
      sampleCases: sampleCases.filter(sc => sc.input || sc.expectedOutput),
      testCases: testCases.filter(tc => tc.input || tc.expectedOutput),
    };

    // ★ 修正: 呼び出すAPIのエンドポイントを /api/problems に変更
    const problemResponse = await fetch('/api/problems', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(problemData),
    });

    if (!problemResponse.ok) {
      const errorData = await problemResponse.json();
      const errorMessage = errorData.error || '不明なエラーが発生しました';
      throw new Error(`問題の投稿に失敗しました: ${errorMessage}`);
    }

    const problemResult = await problemResponse.json();
    alert('問題が正常に投稿されました！');

    // フォームリセット処理
    resetForm();

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error:', error);
    alert(message); // エラーメッセージを直接表示
  } finally {
    setIsSubmitting(false);
  }
}

  // 編集モード切り替え
  const handleEditMode = () => {
    setIsEditMode(!isEditMode)
    if (!isEditMode) {
      alert('編集モードに切り替えました。問題を修正できます。')
    } else {
      alert('編集モードを終了しました。')
    }
  }

  // フォームリセット処理
  const resetForm = () => {
    setFormData({
      title: '',
      problemType: 'コーディング問題',
      difficulty: 4,
      timeLimit: 10,
      category: 'プログラミング基礎',
      topic: '標準入力',
      tags: [],
      description: '',
      codeTemplate: '',
      isPublic: false,
      allowTestCaseView: false
    })
    setSampleCases([{ id: 1, input: '', expectedOutput: '', description: '' }])
    setTestCases([{ id: 1, name: 'ケース1', input: '', expectedOutput: '', description: '' }])
    setFiles([])
    setActiveTab('basic')
    setIsEditMode(false)
  } 

  // レンダリング
    return (
      <>
        <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50">
              {/* サイドバー */}
              <div className="w-full lg:w-72 bg-gradient-to-b from-teal-400 to-teal-600 text-white py-8 shadow-lg lg:rounded-r-2xl mb-4 lg:mb-0 lg:mr-8">
                <div className="px-8 pb-8 text-center">
                  <div className="bg-white bg-opacity-20 px-6 py-3 rounded-full text-sm font-semibold text-white mb-6 backdrop-blur-sm border border-white border-opacity-30">
                    問題作成カテゴリ
                  </div>
                  {isEditMode && (
                    <div className="bg-gradient-to-r from-teal-400 to-blue-800 text-white px-4 py-2 rounded-full text-xs font-semibold mb-4 inline-block ml-4">
                      編集モード
                    </div>
                  )}
                </div>
        
                <div className="mb-6">
                  <ul className="list-none">
                    {categories.map((category) => (
                      <li key={category.id} className="mb-1">
                        <button
                          className={`flex items-center px-8 py-4 text-white text-opacity-90 text-sm font-medium transition-all duration-300 border-l-4 border-transparent relative cursor-pointer hover:bg-white hover:bg-opacity-10 hover:text-white hover:border-l-white hover:translate-x-1 ${selectedCategory === category.id ? 'bg-white bg-opacity-20 text-white border-l-white font-semibold shadow-inner' : ''}`}
                          onClick={() => handleCategorySelect(category.id, category.name)}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="flex-1">{category.name}</span>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>  
        {/* メインコンテンツ */}
        <div className="main-content">
          <div className="container">
            {/* ヘッダー */}
            <div className="mb-8 text-center">
              <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-cyan-500 to-indigo-600 text-transparent bg-clip-text mb-2">
                {isEditMode ? '問題編集' : 'プログラミング問題作成'}
              </h1>
              <p className="text-gray-600 text-base sm:text-lg font-medium">
                {isEditMode ? '既存の問題を編集・更新できます' : '新しいプログラミング問題を作成しましょう'}
              </p>
            </div>
  
            {/* タブ */}
            <div className="flex flex-col sm:flex-row bg-gray-100 rounded-xl p-2 mb-8 shadow-inner">
              <button
                className={`flex-1 px-4 py-3 text-center bg-transparent border-none rounded-lg font-semibold text-sm text-gray-700 cursor-pointer transition-all duration-300 relative hover:text-teal-500 hover:bg-gray-200 ${activeTab === 'basic' ? 'bg-gradient-to-r from-teal-400 to-teal-600 text-white shadow-md transform -translate-y-0.5' : ''}`}
                onClick={() => setActiveTab('basic')}
              >
                基本情報
              </button>
              <button
                className={`flex-1 px-4 py-3 text-center bg-transparent border-none rounded-lg font-semibold text-sm text-gray-700 cursor-pointer transition-all duration-300 relative hover:text-teal-500 hover:bg-gray-200 ${activeTab === 'description' ? 'bg-gradient-to-r from-teal-400 to-teal-600 text-white shadow-md transform -translate-y-0.5' : ''}`}
                onClick={() => setActiveTab('description')}
              >
                問題文
              </button>
              <button
                className={`flex-1 px-4 py-3 text-center bg-transparent border-none rounded-lg font-semibold text-sm text-gray-700 cursor-pointer transition-all duration-300 relative hover:text-teal-500 hover:bg-gray-200 ${activeTab === 'sample-cases' ? 'bg-gradient-to-r from-teal-400 to-teal-600 text-white shadow-md transform -translate-y-0.5' : ''}`}
                onClick={() => setActiveTab('sample-cases')}
              >
                サンプルケース
              </button>
              <button
                className={`flex-1 px-4 py-3 text-center bg-transparent border-none rounded-lg font-semibold text-sm text-gray-700 cursor-pointer transition-all duration-300 relative hover:text-teal-500 hover:bg-gray-200 ${activeTab === 'test-cases' ? 'bg-gradient-to-r from-teal-400 to-teal-600 text-white shadow-md transform -translate-y-0.5' : ''}`}
                onClick={() => setActiveTab('test-cases')}
              >
                テストケース
              </button>
              <button
                className={`flex-1 px-4 py-3 text-center bg-transparent border-none rounded-lg font-semibold text-sm text-gray-700 cursor-pointer transition-all duration-300 relative hover:text-teal-500 hover:bg-gray-200 ${activeTab === 'files' ? 'bg-gradient-to-r from-teal-400 to-teal-600 text-white shadow-md transform -translate-y-0.5' : ''}`}
                onClick={() => setActiveTab('files')}
              >
                ファイル
              </button>
              <button
                className={`flex-1 px-4 py-3 text-center bg-transparent border-none rounded-lg font-semibold text-sm text-gray-700 cursor-pointer transition-all duration-300 relative hover:text-teal-500 hover:bg-gray-200 ${activeTab === 'settings' ? 'bg-gradient-to-r from-teal-400 to-teal-600 text-white shadow-md transform -translate-y-0.5' : ''}`}
                onClick={() => setActiveTab('settings')}
              >
                設定
              </button>
            </div>
  
            {/* フォーム */}
            <form onSubmit={isEditMode ? handleUpdateProblem : handlePublishProblem}>
              {/* 基本情報タブ */}
                            {activeTab === 'basic' && (
                              <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8 border border-gray-200 backdrop-blur-sm">
                                <div className="bg-gradient-to-r from-teal-400 to-teal-600 text-white px-8 py-4 font-semibold text-lg border-b border-teal-700">
                                  基本情報
                                </div>
                                <div className="p-8">
                                  <div className="mb-6">
                                    <label className="flex items-center gap-2 mb-2 font-semibold text-gray-700 text-sm">
                                      <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold tracking-wide">必須</span>
                                      問題タイトル
                                    </label>
                                    <input
                                      type="text"
                                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-sm transition-all duration-300 bg-white text-gray-800 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transform focus:-translate-y-0.5"
                                      value={formData.title}
                                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                      placeholder="例: 配列の最大値を求める"
                                      required
                                    />
                                  </div>
              
                                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                    <div className="flex-1">
                                      <label className="flex items-center gap-2 mb-2 font-semibold text-gray-700 text-sm">問題タイプ</label>
                                      <select
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-sm transition-all duration-300 bg-white text-gray-800 appearance-none bg-[url('data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e')] bg-no-repeat bg-right-center pr-10 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transform focus:-translate-y-0.5"
                                        value={formData.problemType}
                                        onChange={(e) => setFormData(prev => ({ ...prev, problemType: e.target.value }))}
                                      >
                                        <option value="コーディング問題">コーディング問題</option>
                                        <option value="アルゴリズム問題">アルゴリズム問題</option>
                                        <option value="データ構造問題">データ構造問題</option>
                                          <option value="数学問題">数学問題</option>
                                        </select>
                                      </div>
                                      <div className="flex-1">
                                        <label className="flex items-center gap-2 mb-2 font-semibold text-gray-700 text-sm">制限時間（分）</label>
                                        <input
                                          type="number"
                                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-sm transition-all duration-300 bg-white text-gray-800 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transform focus:-translate-y-0.5"
                                          value={formData.timeLimit}
                                          onChange={(e) => setFormData(prev => ({ ...prev, timeLimit: parseInt(e.target.value) }))}
                                          min="1"
                                          max="180"
                                        />
                                      </div>
                                    </div>
              
                                    <div className="mb-6">
                                      <label className="flex items-center gap-2 mb-2 font-semibold text-gray-700 text-sm">難易度</label>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <select
                                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-sm transition-all duration-300 bg-white text-gray-800 appearance-none bg-[url(\'data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'m6 8 4 4 4-4\'/%3e%3c/svg%3e\')] bg-no-repeat bg-right-center pr-10 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transform focus:-translate-y-0.5"
                                          value={formData.difficulty}
                                          onChange={(e) => {
                                            const newDifficulty = parseInt(e.target.value);
                                            setFormData(prev => ({ ...prev, difficulty: newDifficulty }));
                                            const newSelectedDifficulty = eventDifficulties.find(d => d.id === newDifficulty);
                                            if (newSelectedDifficulty) {
                                              setSelectedDifficulty(newSelectedDifficulty);
                                            }
                                          }}
                                        >
                                          {eventDifficulties.map(d => (
                                            <option key={d.id} value={d.id}>{d.id}</option>
                                          ))}
                                        </select>
                                        {selectedDifficulty && (
                                          <div style={{ background: '#f0f0f0', padding: '0.5rem 1rem', borderRadius: '8px' }}>
                                            <span><strong>{selectedDifficulty.difficultyName}</strong></span>
                                            <span style={{ marginLeft: '1rem' }}>想定解答時間: {selectedDifficulty.expectedTimeMinutes}分</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
              
                                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                                                          <div className="flex-1">
                                                                            <label className="flex items-center gap-2 mb-2 font-semibold text-gray-700 text-sm">トピック</label>
                                                                                                                  <select
                                                                                                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-sm transition-all duration-300 bg-white text-gray-800 appearance-none bg-[url(\'data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'m6 8 4 4 4-4\'/%3e%3c/svg%3e\')] bg-no-repeat bg-right-center pr-10 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transform focus:-translate-y-0.5"
                                                                                                                    value={formData.topic}
                                                                                                                    onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
                                                                                                                  >
                                                                                                                    {topics.map((topic) => (
                                                                                                                      <option key={topic} value={topic}>
                                                                                                                        {topic}
                                                                                                                      </option>
                                                                                                                    ))}
                                                                                                                  </select>                                                                          </div>                                    </div>
              
                                    <div className="mb-6">
                                      <label className="flex items-center gap-2 mb-2 font-semibold text-gray-700 text-sm">タグ</label>
                                      <div className="tags-container">
                                        {formData.tags.map((tag, index) => (
                                          <div key={index} className="tag">
                                            {tag}
                                            <button
                                              type="button"
                                              className="tag-remove"
                                              onClick={() => removeTag(tag)}
                                            >
                                              ×
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                      <div className="tag-input-container">
                                        <input
                                          type="text"
                                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-sm transition-all duration-300 bg-white text-gray-800 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transform focus:-translate-y-0.5"
                                          value={tagInput}
                                          onChange={(e) => setTagInput(e.target.value)}
                                          placeholder="タグを入力してEnterキーで追加"
                                          onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                              e.preventDefault()
                                              addTag()
                                            }
                                          }}
                                        />
                                        <button
                                          type="button"
                                          className="btn btn-primary btn-small"
                                          onClick={addTag}
                                        >
                                          追加
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
              
                              {/* 問題文タブ */}
                              {activeTab === 'description' && (
                                <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8 border border-gray-200 backdrop-blur-sm">
                                  <div className="bg-gradient-to-r from-teal-400 to-teal-600 text-white px-8 py-4 font-semibold text-lg border-b border-teal-700">
                                    問題文作成
                                  </div>
                                  <div className="p-8">
                                    <div className="mb-6">
                                      <label className="form-label">
                                        <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold tracking-wide">必須</span>
                                        問題文
                                      </label>
                                      <div className="markdown-toolbar">
                                        <button type="button" className="toolbar-btn" onClick={handleBold}>
                                          <strong>B</strong> 太字
                                        </button>
                                        <button type="button" className="toolbar-btn" onClick={handleItalic}>
                                          <em>I</em> 斜体
                                        </button>
                                        <button type="button" className="toolbar-btn" onClick={handleUnderline}>
                                          <u>U</u> 下線
                                        </button>
                                        <button type="button" className="toolbar-btn" onClick={handleStrikethrough}>
                                          <s>S</s> 打消
                                        </button>
                                        <button type="button" className="toolbar-btn" onClick={handleCode}>
                                          {'<>'} コード
                                        </button>
                                        <button type="button" className="toolbar-btn" onClick={handleLink}>
                                          🔗 リンク
                                        </button>
                                      </div>
                                      <textarea
                                        ref={textareaRef}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-sm transition-all duration-300 bg-white text-gray-800 min-h-[120px] resize-y font-mono leading-relaxed focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transform focus:-translate-y-0.5"
                                        value={formData.description}
                                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="問題文をMarkdown形式で記述してください..."
                                        rows={15}
                                        required
                                      />
                                    </div>
              
                                    <div className="mb-6">
                                      <label className="form-label">コードテンプレート</label>
                                      <textarea
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-sm transition-all duration-300 bg-white text-gray-800 min-h-[120px] resize-y font-mono leading-relaxed focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transform focus:-translate-y-0.5"
                                        value={formData.codeTemplate}
                                        onChange={(e) => setFormData(prev => ({ ...prev, codeTemplate: e.target.value }))}
                                        placeholder="初期コードテンプレートを記述してください..."
                                        rows={10}
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}
              
                              {/* サンプルケースタブ */}
                              {activeTab === 'sample-cases' && (
                                <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8 border border-gray-200 backdrop-blur-sm">
                                  <div className="bg-gradient-to-r from-teal-400 to-teal-600 text-white px-8 py-4 font-semibold text-lg border-b border-teal-700">
                                    サンプルケース管理
                                  </div>
                                  <div className="p-8">
                                    <div className="mb-6">
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <label className="form-label">サンプルケース</label>
                                        <button
                                          type="button"
                                          className="btn btn-primary btn-small"
                                          onClick={addSampleCase}
                                        >
                                          + サンプル追加
                                        </button>
                                      </div>
                                      
                                      {sampleCases.map((sampleCase, index) => (
                                        <div key={sampleCase.id ?? `new-sample-${index}`} className="case-item">
                                          <div className="case-header">
                                            <div className="case-title">サンプル {sampleCase.id}</div>
                                            {sampleCases.length > 1 && (
                                              <button
                                                type="button"
                                                className="btn btn-secondary btn-small"
                                                onClick={() => removeSampleCase(sampleCase.id)}
                                              >
                                                削除
                                              </button>
                                            )}
                                          </div>
                                          <div className="case-fields">
                                            <div>
                                              <label className="form-label">入力</label>
                                              <textarea
                                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-sm transition-all duration-300 bg-white text-gray-800 min-h-[120px] resize-y font-mono leading-relaxed focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transform focus:-translate-y-0.5"
                                                value={sampleCase.input}
                                                onChange={(e) => {
                                                  setSampleCases(prev => prev.map(c => 
                                                    c.id === sampleCase.id ? { ...c, input: e.target.value } : c
                                                  ))
                                                }}
                                                placeholder="入力例を記述..."
                                                rows={4}
                                              />
                                            </div>
                                            <div>
                                              <label className="form-label">期待出力</label>
                                              <textarea
                                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-sm transition-all duration-300 bg-white text-gray-800 min-h-[120px] resize-y font-mono leading-relaxed focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transform focus:-translate-y-0.5"
                                                value={sampleCase.expectedOutput}
                                                onChange={(e) => {
                                                  setSampleCases(prev => prev.map(c => 
                                                    c.id === sampleCase.id ? { ...c, expectedOutput: e.target.value } : c
                                                  ))
                                                }}
                                                placeholder="期待される出力を記述..."
                                                rows={4}
                                              />
                                            </div>
                                            <div className="case-description">
                                              <label className="form-label">説明</label>
                                              <input
                                                type="text"
                                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-sm transition-all duration-300 bg-white text-gray-800 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transform focus:-translate-y-0.5"
                                                value={sampleCase.description}
                                                onChange={(e) => {
                                                  setSampleCases(prev => prev.map(c => 
                                                    c.id === sampleCase.id ? { ...c, description: e.target.value } : c
                                                  ))
                                                }}
                                                placeholder="このケースの説明..."
                                              />
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}
              
                              {/* テストケースタブ */}
                              {activeTab === 'test-cases' && (
                                <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8 border border-gray-200 backdrop-blur-sm">
                                  <div className="bg-gradient-to-r from-teal-400 to-teal-600 text-white px-8 py-4 font-semibold text-lg border-b border-teal-700">
                                    テストケース管理
                                  </div>
                                  <div className="p-8">
                                    <div className="mb-6">
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <label className="form-label">テストケース</label>
                                        <button
                                          type="button"
                                          className="btn btn-primary btn-small"
                                          onClick={addTestCase}
                                        >
                                          + テスト追加
                                        </button>
                                      </div>
                                      
                                      {testCases.map((testCase, index) => (
                                        <div key={testCase.id ?? `new-test-${index}`} className="case-item">
                                          <div className="case-header">
                                            <div className="case-title">{testCase.name}</div>
                                            {testCases.length > 1 && (
                                              <button
                                                type="button"
                                                className="btn btn-secondary btn-small"
                                                onClick={() => removeTestCase(testCase.id)}
                                              >
                                                削除
                                              </button>
                                            )}
                                          </div>
                                          <div className="case-fields">
                                            <div>
                                              <label className="form-label">ケース名</label>
                                              <input
                                                type="text"
                                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-sm transition-all duration-300 bg-white text-gray-800 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transform focus:-translate-y-0.5"
                                                value={testCase.name}
                                                onChange={(e) => {
                                                  setTestCases(prev => prev.map(c => 
                                                    c.id === testCase.id ? { ...c, name: e.target.value } : c
                                                  ))
                                                }}
                                                placeholder="ケース名..."
                                              />
                                            </div>
                                            <div>
                                              <label className="form-label">説明</label>
                                              <input
                                                type="text"
                                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-sm transition-all duration-300 bg-white text-gray-800 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transform focus:-translate-y-0.5"
                                                value={testCase.description}
                                                onChange={(e) => {
                                                  setTestCases(prev => prev.map(c => 
                                                    c.id === testCase.id ? { ...c, description: e.target.value } : c
                                                  ))
                                                }}
                                                placeholder="このケースの説明..."
                                              />
                                            </div>
                                            <div>
                                              <label className="form-label">入力</label>
                                              <textarea
                                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-sm transition-all duration-300 bg-white text-gray-800 min-h-[120px] resize-y font-mono leading-relaxed focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transform focus:-translate-y-0.5"
                                                value={testCase.input}
                                                onChange={(e) => {
                                                  setTestCases(prev => prev.map(c => 
                                                    c.id === testCase.id ? { ...c, input: e.target.value } : c
                                                  ))
                                                }}
                                                placeholder="入力データを記述..."
                                                rows={4}
                                              />
                                            </div>
                                            <div>
                                              <label className="form-label">期待出力</label>
                                              <textarea
                                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-sm transition-all duration-300 bg-white text-gray-800 min-h-[120px] resize-y font-mono leading-relaxed focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transform focus:-translate-y-0.5"
                                                value={testCase.expectedOutput}
                                                onChange={(e) => {
                                                  setTestCases(prev => prev.map(c => 
                                                    c.id === testCase.id ? { ...c, expectedOutput: e.target.value } : c
                                                  ))
                                                }}
                                                placeholder="期待される出力を記述..."
                                                rows={4}
                                              />
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}
              
                              {/* ファイルタブ */}
                              {activeTab === 'files' && (
                                <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8 border border-gray-200 backdrop-blur-sm">
                                  <div className="bg-gradient-to-r from-teal-400 to-teal-600 text-white px-8 py-4 font-semibold text-lg border-b border-teal-700">
                                    ファイル管理
                                  </div>
                                  <div className="p-8">
                                    <div className="mb-6">
                                      <label className="form-label">添付ファイル</label>
                                      <div className="file-upload-area" onClick={() => document.getElementById('file-input')?.click()} >
                                        <div className="upload-icon">📁</div>
                                        <div className="upload-text">ファイルをドラッグ&ドロップまたはクリックして選択</div>
                                        <div className="upload-hint">画像、テキスト、PDFなど様々な形式に対応</div>
                                        <input
                                          id="file-input"
                                          type="file"
                                          multiple
                                          onChange={handleFileUpload}
                                          style={{ display: 'none' }}
                                        />
                                      </div>
              
                                      {files.length > 0 && (
                                        <div className="file-list">
                                          {files.map((file, index) => (
                                            <div key={index} className="file-item">
                                              <div className="file-info">
                                                <div className="file-icon">
                                                  {file.type.startsWith('image/') ? '🖼️' : 
                                                   file.type.includes('text') ? '📄' : 
                                                   file.type.includes('pdf') ? '📕' : '📎'}
                                                </div>
                                                <div className="file-details">
                                                  <div className="file-name">{file.name}</div>
                                                  <div className="file-size">
                                                    {(file.size / 1024).toFixed(1)} KB
                                                  </div>
                                                </div>
                                              </div>
                                              <div className="file-actions">
                                                <button
                                                  type="button"
                                                  className="btn btn-primary btn-small"
                                                  onClick={() => handlePreviewFile(file)}
                                                >
                                                  プレビュー
                                                </button>
                                                <button
                                                  type="button"
                                                  className="btn btn-secondary btn-small"
                                                  onClick={(e) => {
                                                    e.stopPropagation()
                                                    removeFile(index)
                                                  }}
                                                >
                                                  削除
                                                </button>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
              
                              {/* 設定タブ */}
                              {activeTab === 'settings' && (
                                <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8 border border-gray-200 backdrop-blur-sm">
                                  <div className="bg-gradient-to-r from-teal-400 to-teal-600 text-white px-8 py-4 font-semibold text-lg border-b border-teal-700">
                                    公開設定
                                  </div>
                                  <div className="p-8">
                                    <div className="checkbox-group">
                                      <label className="checkbox">
                                        <input
                                          type="checkbox"
                                          checked={formData.isPublic}
                                          onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                                        />
                                        <span className="checkbox-custom"></span>
                                      </label>
                                      <label className="checkbox-label">
                                        問題を公開する
                                      </label>
                                    </div>
              
                                    <div className="checkbox-group">
                                      <label className="checkbox">
                                        <input
                                          type="checkbox"
                                          checked={formData.allowTestCaseView}
                                          onChange={(e) => setFormData(prev => ({ ...prev, allowTestCaseView: e.target.checked }))}
                                        />
                                        <span className="checkbox-custom"></span>
                                      </label>
                                      <label className="checkbox-label">
                                        テストケースの閲覧を許可する
                                      </label>
                                    </div>
              
                                    <div className="mb-6 mt-8">
                                      <button
                                        type="button"
                                        className="btn btn-warning"
                                        onClick={handleEditMode}
                                      >
                                        {isEditMode ? '編集モード終了' : '編集モード開始'}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
              
                              {/* アクションボタン */}
                              <div className="action-buttons">
                                <button
                                  type="button"
                                  className="btn btn-secondary"
                                  onClick={handleSaveDraft}
                                  disabled={isSubmitting}
                                >
                                  下書き保存
                                </button>
                                
                                {isEditMode ? (
                                  <button
                                    type="submit"
                                    className="btn btn-success"
                                    disabled={isSubmitting}
                                  >
                                    問題を更新
                                  </button>
                                ) : (
                                  <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={isSubmitting}
                                  >
                                    問題を投稿
                                  </button>
                                )}
                                
                                <button
                                  type="button"
                                  className="btn btn-secondary"
                                  onClick={resetForm}
                                  disabled={isSubmitting}
                                >
                                  リセット
                                </button>
                              </div>
                            </form>
                          </div>
                        </div>
                      </div>
              
                      {/* プレビューモーダル */}
                      {showPreview && previewFile && (
                        <div className="preview-modal" onClick={closePreview}>
                          <div className="preview-content" onClick={(e) => e.stopPropagation()}>
                            <div className="preview-header">
                              <div className="preview-title">{previewFile.name}</div>
                              <button className="preview-close" onClick={closePreview}>
                                ×
                              </button>
                            </div>
                            
                            {isImageFile(previewFile) ? (
                              <img 
                                src={previewFile.url} 
                                alt={previewFile.name}
                                className="preview-image"
                              />
                            ) : isTextFile(previewFile) ? (
                              <div className="preview-text">
                                {/* テキストファイルの内容をここに表示 */}
                                テキストファイルのプレビューは実装中です
                              </div>
                            ) : (
                              <div className="preview-text">
                                このファイル形式はプレビューできません
                              </div>
                            )}
                          </div>
                        </div>
                      )}
        </>
    );
}
              
