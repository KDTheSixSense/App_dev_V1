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

// プログラミング問題作成ページのメインコンポーネント（改良版）
export default function CreateProgrammingQuestionPage() {
  // フォームの状態管理
  const router = useRouter();
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
    { id: 'itpassport', name: 'ITパスポート', subItems: [] },
    { id: 'basic-a', name: '基本情報 A', subItems: [] },
    { id: 'basic-b', name: '基本情報 B', subItems: [] },
    { id: 'applied-morning', name: '応用情報 午前', subItems: [] },
    { id: 'applied-afternoon', name: '応用情報 午後', subItems: [] },
    { id: 'information', name: '情報検定', subItems: [] },
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
    <div>
      <style jsx>{`
        /* リセットとベーススタイル */
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
          line-height: 1.6;
          color: #2d3748;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
        }

        /* メインレイアウト */
        .main-layout {
          display: flex;
          min-height: 100vh;
          background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
        }

        /* サイドバー */
        .sidebar {
          width: 280px;
          background: linear-gradient(180deg, #4fd1c7 0%, #38b2ac 100%);
          color: white;
          padding: 2rem 0;
          box-shadow: 4px 0 20px rgba(0, 0, 0, 0.1);
          border-radius: 0 20px 20px 0;
          margin-right: 2rem;
        }

        .sidebar-header {
          padding: 0 2rem 2rem;
          text-align: center;
        }

        .sidebar-title {
          background: rgba(255, 255, 255, 0.2);
          padding: 0.75rem 1.5rem;
          border-radius: 25px;
          font-size: 0.875rem;
          font-weight: 600;
          color: white;
          margin-bottom: 1.5rem;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .category-section {
          margin-bottom: 1.5rem;
        }

        .sidebar-menu {
          list-style: none;
        }

        .sidebar-item {
          margin-bottom: 0.25rem;
        }

        .sidebar-link {
          display: flex;
          align-items: center;
          padding: 1rem 2rem;
          color: rgba(255, 255, 255, 0.9);
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.3s ease;
          border-left: 4px solid transparent;
          position: relative;
          cursor: pointer;
          border: none;
          background: none;
          width: 100%;
          text-align: left;
        }

        .sidebar-link:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border-left-color: rgba(255, 255, 255, 0.5);
          transform: translateX(4px);
        }

        .sidebar-link.active {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border-left-color: white;
          font-weight: 600;
          box-shadow: inset 0 0 20px rgba(255, 255, 255, 0.1);
        }

        .sidebar-link-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
        }

        .sidebar-link-text {
          flex: 1;
        }

        /* メインコンテンツ */
        .main-content {
          flex: 1;
          padding: 2rem;
          max-width: calc(100% - 320px);
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
        }

        /* ヘッダー */
        .header {
          margin-bottom: 2rem;
          text-align: center;
        }

        .header-title {
          font-size: 2.5rem;
          font-weight: 800;
          background: linear-gradient(135deg, #0ac5b2 0%, #667eea 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 0.5rem;
        }

        .header-description {
          color: #718096;
          font-size: 1.1rem;
          font-weight: 500;
        }

        /* 編集モード表示 */
        .edit-mode-indicator {
          background: linear-gradient(135deg, #4fd1c7 0%, #19547b 100%);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 1rem;
          display: inline-block;
          margin-left: 1rem;
        }

        /* カード */
        .card {
          background: white;
          border-radius: 20px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          margin-bottom: 2rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
        }

        .card-header {
          background: linear-gradient(135deg, #4fd1c7 0%, #38b2ac 100%);
          color: white;
          padding: 1.5rem 2rem;
          font-weight: 600;
          font-size: 1.125rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .card-body {
          padding: 2rem;
        }

        /* タブ */
        .tabs {
          display: flex;
          background: #f7fafc;
          border-radius: 15px;
          padding: 0.5rem;
          margin-bottom: 2rem;
          box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.05);
        }

        .tab {
          flex: 1;
          padding: 1rem 1.5rem;
          text-align: center;
          background: transparent;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          font-size: 0.875rem;
          color: #718096;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
        }

        .tab:hover {
          color: #4fd1c7;
          background: rgba(79, 209, 199, 0.1);
        }

        .tab.active {
          background: linear-gradient(135deg, #4fd1c7 0%, #38b2ac 100%);
          color: white;
          box-shadow: 0 4px 15px rgba(79, 209, 199, 0.3);
          transform: translateY(-2px);
        }

        /* フォーム */
        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-row {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .form-col {
          flex: 1;
        }

        .form-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #2d3748;
          font-size: 0.875rem;
        }

        .required-badge {
          background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%);
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.625rem;
          font-weight: 600;
          letter-spacing: 0.025em;
        }

        .form-input,
        .form-select,
        .form-textarea {
          width: 100%;
          padding: 0.875rem 1rem;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          font-size: 0.875rem;
          transition: all 0.3s ease;
          background: white;
          color: #2d3748;
        }

        .form-input:focus,
        .form-select:focus,
        .form-textarea:focus {
          outline: none;
          border-color: #4fd1c7;
          box-shadow: 0 0 0 3px rgba(79, 209, 199, 0.1);
          transform: translateY(-1px);
        }

        /* プルダウンの改善 */
        .form-select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
          background-position: right 0.5rem center;
          background-repeat: no-repeat;
          background-size: 1.5em 1.5em;
          padding-right: 2.5rem;
          max-height: 200px;
          overflow-y: auto;
        }

        .form-select option {
          padding: 0.5rem;
          background: white;
          color: #2d3748;
        }

        .form-select option:hover {
          background: #f7fafc;
        }

        .form-textarea {
          min-height: 120px;
          resize: vertical;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          line-height: 1.5;
        }

        /* マークダウンツールバー */
        .markdown-toolbar {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
          padding: 0.75rem;
          background: #f7fafc;
          border-radius: 10px;
          border: 2px solid #e2e8f0;
          flex-wrap: wrap;
        }

        .toolbar-btn {
          padding: 0.5rem 0.75rem;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          color: #4a5568;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .toolbar-btn:hover {
          background: #4fd1c7;
          color: white;
          border-color: #4fd1c7;
          transform: translateY(-1px);
        }

        /* タグ */
        .tags-container {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .tag {
          background: linear-gradient(135deg, #4fd1c7 0%, #38b2ac 100%);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          box-shadow: 0 2px 10px rgba(79, 209, 199, 0.2);
        }

        .tag-remove {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          border-radius: 50%;
          width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 0.75rem;
          transition: all 0.2s ease;
        }

        .tag-remove:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: scale(1.1);
        }

        .tag-input-container {
          display: flex;
          gap: 0.5rem;
        }

        .tag-input {
          flex: 1;
          padding: 0.5rem 1rem;
          border: 2px solid #e2e8f0;
          border-radius: 20px;
          font-size: 0.875rem;
          transition: all 0.3s ease;
        }

        .tag-input:focus {
          outline: none;
          border-color: #4fd1c7;
          box-shadow: 0 0 0 3px rgba(79, 209, 199, 0.1);
        }

        /* ボタン */
        .btn {
          padding: 0.875rem 1.5rem;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          text-decoration: none;
          text-align: center;
          justify-content: center;
          min-width: 120px;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none !important;
        }

        .btn-primary {
          background: linear-gradient(135deg, #4fd1c7 0%, #38b2ac 100%);
          color: white;
          box-shadow: 0 4px 15px rgba(79, 209, 199, 0.3);
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(79, 209, 199, 0.4);
        }

        .btn-secondary {
          background: linear-gradient(135deg, #718096 0%, #4a5568 100%);
          color: white;
          box-shadow: 0 4px 15px rgba(113, 128, 150, 0.3);
        }

        .btn-secondary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(113, 128, 150, 0.4);
        }

        .btn-success {
          background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
          color: white;
          box-shadow: 0 4px 15px rgba(72, 187, 120, 0.3);
        }

        .btn-success:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(72, 187, 120, 0.4);
        }

        .btn-warning {
          background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%);
          color: white;
          box-shadow: 0 4px 15px rgba(237, 137, 54, 0.3);
        }

        .btn-warning:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(237, 137, 54, 0.4);
        }

        .btn-small {
          padding: 0.5rem 1rem;
          font-size: 0.75rem;
          min-width: auto;
        }

        .btn-icon {
          padding: 0.5rem;
          min-width: auto;
          border-radius: 8px;
        }

        /* ケース管理 */
        .case-item {
          background: #f7fafc;
          border: 2px solid #e2e8f0;
          border-radius: 15px;
          padding: 1.5rem;
          margin-bottom: 1rem;
          transition: all 0.3s ease;
        }

        .case-item:hover {
          border-color: #4fd1c7;
          box-shadow: 0 4px 15px rgba(79, 209, 199, 0.1);
        }

        .case-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .case-title {
          font-weight: 600;
          color: #2d3748;
          font-size: 0.875rem;
        }

        .case-fields {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .case-description {
          grid-column: 1 / -1;
        }

        /* ファイル管理 */
        .file-upload-area {
          border: 2px dashed #cbd5e0;
          border-radius: 15px;
          padding: 2rem;
          text-align: center;
          background: #f7fafc;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .file-upload-area:hover {
          border-color: #4fd1c7;
          background: rgba(79, 209, 199, 0.05);
        }

        .file-upload-area.dragover {
          border-color: #4fd1c7;
          background: rgba(79, 209, 199, 0.1);
          transform: scale(1.02);
        }

        .upload-icon {
          font-size: 3rem;
          color: #cbd5e0;
          margin-bottom: 1rem;
        }

        .upload-text {
          color: #718096;
          font-size: 0.875rem;
          margin-bottom: 0.5rem;
        }

        .upload-hint {
          color: #a0aec0;
          font-size: 0.75rem;
        }

        .file-list {
          margin-top: 1.5rem;
        }

        .file-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          margin-bottom: 0.5rem;
          transition: all 0.3s ease;
        }

        .file-item:hover {
          border-color: #4fd1c7;
          box-shadow: 0 2px 10px rgba(79, 209, 199, 0.1);
        }

        .file-info {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex: 1;
        }

        .file-icon {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #4fd1c7 0%, #38b2ac 100%);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: 0.75rem;
        }

        .file-details {
          flex: 1;
        }

        .file-name {
          font-weight: 600;
          color: #2d3748;
          font-size: 0.875rem;
          margin-bottom: 0.25rem;
        }

        .file-size {
          color: #718096;
          font-size: 0.75rem;
        }

        .file-actions {
          display: flex;
          gap: 0.5rem;
        }

        /* プレビューモーダル */
        .preview-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(5px);
        }

        .preview-content {
          background: white;
          border-radius: 20px;
          padding: 2rem;
          max-width: 90%;
          max-height: 90%;
          overflow: auto;
          position: relative;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #e2e8f0;
        }

        .preview-title {
          font-weight: 600;
          color: #2d3748;
          font-size: 1.125rem;
        }

        .preview-close {
          background: #e53e3e;
          color: white;
          border: none;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.2s ease;
        }

        .preview-close:hover {
          background: #c53030;
          transform: scale(1.1);
        }

        .preview-image {
          max-width: 100%;
          max-height: 70vh;
          object-fit: contain;
          border-radius: 10px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        .preview-text {
          background: #f7fafc;
          padding: 1rem;
          border-radius: 10px;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 0.875rem;
          line-height: 1.5;
          color: #2d3748;
          white-space: pre-wrap;
          max-height: 60vh;
          overflow-y: auto;
        }

        /* チェックボックス */
        .checkbox-group {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .checkbox {
          position: relative;
          display: inline-block;
        }

        .checkbox input {
          opacity: 0;
          position: absolute;
          width: 0;
          height: 0;
        }

        .checkbox-custom {
          width: 20px;
          height: 20px;
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .checkbox input:checked + .checkbox-custom {
          background: linear-gradient(135deg, #4fd1c7 0%, #38b2ac 100%);
          border-color: #4fd1c7;
        }

        .checkbox input:checked + .checkbox-custom::after {
          content: '✓';
          color: white;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .checkbox-label {
          font-size: 0.875rem;
          color: #2d3748;
          cursor: pointer;
          user-select: none;
        }

        /* アクションボタン群 */
        .action-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid #e2e8f0;
          flex-wrap: wrap;
        }

        /* レスポンシブ */
        @media (max-width: 768px) {
          .main-layout {
            flex-direction: column;
          }

          .sidebar {
            width: 100%;
            border-radius: 0;
            margin-right: 0;
            margin-bottom: 1rem;
          }

          .main-content {
            max-width: 100%;
            padding: 1rem;
          }

          .header-title {
            font-size: 2rem;
          }

          .form-row {
            flex-direction: column;
          }

          .case-fields {
            grid-template-columns: 1fr;
          }

          .action-buttons {
            flex-direction: column;
          }

          .tabs {
            flex-direction: column;
          }

          .markdown-toolbar {
            justify-content: center;
          }

          .preview-content {
            margin: 1rem;
            max-width: calc(100% - 2rem);
            max-height: calc(100% - 2rem);
          }
        }

        /* アニメーション */
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideIn {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }

        .card {
          animation: fadeIn 0.6s ease-out;
        }

        .sidebar {
          animation: slideIn 0.4s ease-out;
        }

        .preview-modal {
          animation: fadeIn 0.3s ease-out;
        }

        /* フォーカス状態の改善 */
        .form-input:focus,
        .form-select:focus,
        .form-textarea:focus,
        .tag-input:focus {
          outline: none;
          border-color: #4fd1c7;
          box-shadow: 0 0 0 3px rgba(79, 209, 199, 0.1);
        }

        /* ローディング状態 */
        .btn:disabled {
          position: relative;
          color: transparent;
        }

        .btn:disabled::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }

        /* スクロールバーのスタイリング */
        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #4fd1c7 0%, #38b2ac 100%);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #38b2ac 0%, #319795 100%);
        }
      `}</style>

      <div className="main-layout">
        {/* サイドバー */}
        <div className="sidebar">
          <div className="sidebar-header">
            <div className="sidebar-title">
              問題作成カテゴリ
            </div>
            {isEditMode && (
              <div className="edit-mode-indicator">
                編集モード
              </div>
            )}
          </div>

          <div className="category-section">
            <ul className="sidebar-menu">
              {categories.map((category) => (
                <li key={category.id} className="sidebar-item">
                  <button
                    className={`sidebar-link ${selectedCategory === category.id ? 'active' : ''}`}
                    onClick={() => handleCategorySelect(category.id, category.name)}
                  >
                    <div className="sidebar-link-content">
                      <span className="sidebar-link-text">{category.name}</span>
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
            <div className="header">
              <h1 className="header-title">
                {isEditMode ? '問題編集' : 'プログラミング問題作成'}
              </h1>
              <p className="header-description">
                {isEditMode ? '既存の問題を編集・更新できます' : '新しいプログラミング問題を作成しましょう'}
              </p>
            </div>

            {/* タブ */}
            <div className="tabs">
              <button
                className={`tab ${activeTab === 'basic' ? 'active' : ''}`}
                onClick={() => setActiveTab('basic')}
              >
                基本情報
              </button>
              <button
                className={`tab ${activeTab === 'description' ? 'active' : ''}`}
                onClick={() => setActiveTab('description')}
              >
                問題文
              </button>
              <button
                className={`tab ${activeTab === 'sample-cases' ? 'active' : ''}`}
                onClick={() => setActiveTab('sample-cases')}
              >
                サンプルケース
              </button>
              <button
                className={`tab ${activeTab === 'test-cases' ? 'active' : ''}`}
                onClick={() => setActiveTab('test-cases')}
              >
                テストケース
              </button>
              <button
                className={`tab ${activeTab === 'files' ? 'active' : ''}`}
                onClick={() => setActiveTab('files')}
              >
                ファイル
              </button>
              <button
                className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => setActiveTab('settings')}
              >
                設定
              </button>
            </div>

            {/* フォーム */}
            <form onSubmit={isEditMode ? handleUpdateProblem : handlePublishProblem}>
              {/* 基本情報タブ */}
              {activeTab === 'basic' && (
                <div className="card">
                  <div className="card-header">
                    基本情報
                  </div>
                  <div className="card-body">
                    <div className="form-group">
                      <label className="form-label">
                        <span className="required-badge">必須</span>
                        問題タイトル
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="例: 配列の最大値を求める"
                        required
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-col">
                        <label className="form-label">問題タイプ</label>
                        <select
                          className="form-select"
                          value={formData.problemType}
                          onChange={(e) => setFormData(prev => ({ ...prev, problemType: e.target.value }))}
                        >
                          <option value="コーディング問題">コーディング問題</option>
                          <option value="アルゴリズム問題">アルゴリズム問題</option>
                          <option value="データ構造問題">データ構造問題</option>
                          <option value="数学問題">数学問題</option>
                        </select>
                      </div>
                      <div className="form-col">
                        <label className="form-label">制限時間（分）</label>
                        <input
                          type="number"
                          className="form-input"
                          value={formData.timeLimit}
                          onChange={(e) => setFormData(prev => ({ ...prev, timeLimit: parseInt(e.target.value) }))}
                          min="1"
                          max="180"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">難易度</label>
                      <select
                        className="form-select"
                        value={formData.difficulty}
                        onChange={(e) => setFormData(prev => ({ ...prev, difficulty: parseInt(e.target.value) }))}
                      >
                        <option value={1}>1</option>
                        <option value={2}>2</option>
                        <option value={3}>3</option>
                        <option value={4}>4</option>
                        <option value={5}>5</option>
                      </select>
                    </div>

                    <div className="form-row">
                      <div className="form-col">
                        <label className="form-label">トピック</label>
                        <select
                          className="form-select"
                          value={formData.topic}
                          onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
                        >
                          {topics.map((topic) => (
                            <option key={topic} value={topic}>
                              {topic}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">タグ</label>
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
                          className="tag-input"
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
                <div className="card">
                  <div className="card-header">
                    問題文作成
                  </div>
                  <div className="card-body">
                    <div className="form-group">
                      <label className="form-label">
                        <span className="required-badge">必須</span>
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
                        className="form-textarea"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="問題文をMarkdown形式で記述してください..."
                        rows={15}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">コードテンプレート</label>
                      <textarea
                        className="form-textarea"
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
                <div className="card">
                  <div className="card-header">
                    サンプルケース管理
                  </div>
                  <div className="card-body">
                    <div className="form-group">
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
                                className="form-textarea"
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
                                className="form-textarea"
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
                                className="form-input"
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
                <div className="card">
                  <div className="card-header">
                    テストケース管理
                  </div>
                  <div className="card-body">
                    <div className="form-group">
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
                                className="form-input"
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
                                className="form-input"
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
                                className="form-textarea"
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
                                className="form-textarea"
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
                <div className="card">
                  <div className="card-header">
                    ファイル管理
                  </div>
                  <div className="card-body">
                    <div className="form-group">
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
                <div className="card">
                  <div className="card-header">
                    公開設定
                  </div>
                  <div className="card-body">
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

                    <div className="form-group" style={{ marginTop: '2rem' }}>
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
    </div>
  )
}

