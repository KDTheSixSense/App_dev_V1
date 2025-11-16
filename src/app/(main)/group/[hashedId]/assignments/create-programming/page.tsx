'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams, useParams } from 'next/navigation';

// --- 型定義 ---
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
  tags: string[];
  description: string;
  codeTemplate: string;
  isPublic: boolean;
  allowTestCaseView: boolean;
}

interface AnswerOption {
  id: string;
  text: string;
}

// プログラミング問題作成ページ（グループ用・機能削減修正版）
export default function CreateProgrammingQuestionPage() {
  // フォームの状態管理
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const hashedId = params.hashedId as string;

  // FOUC対策
  const [mounted, setMounted] = useState(false);
  
  const [problemId, setProblemId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('basic') // アクティブなタブ
  const [selectedCategory, setSelectedCategory] = useState('programming') // 選択されたカテゴリ
  const [isEditMode, setIsEditMode] = useState(false) // 編集モードかどうか
  const [formData, setFormData] = useState<FormData>({
    title: '',
    problemType: 'コーディング問題',
    difficulty: 4,
    timeLimit: 10, // UIからは削除するが、内部データとして保持
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

  // 選択問題用の状態 ---
  const [answerOptions, setAnswerOptions] = useState<AnswerOption[]>([
    { id: 'a', text: '' },
    { id: 'b', text: '' },
    { id: 'c', text: '' },
    { id: 'd', text: '' },
  ]);
  const [correctAnswer, setCorrectAnswer] = useState<string>('a');
  const [explanation, setExplanation] = useState<string>('');
  
  const [tagInput, setTagInput] = useState('')
  // ファイル関連のStateは削除しました
  const [isSubmitting, setIsSubmitting] = useState(false)

  // トピックリスト
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
    // FOUC対策: マウント完了フラグ
    setMounted(true);

    const idFromQuery = searchParams.get('id');
    const typeFromQuery = searchParams.get('type');
    // typeに応じて初期カテゴリを設定
    if (typeFromQuery === 'select') {
      setSelectedCategory('itpassport');
      setFormData(prev => ({ ...prev, problemType: '選択問題', category: '4択問題' }));
    } else {
      setSelectedCategory('programming');
      setFormData(prev => ({ ...prev, problemType: 'コーディング問題', category: 'プログラミング基礎' }));
    }

    // IDに応じて編集モードを設定
    if (idFromQuery) {
      const parsedId = parseInt(idFromQuery);
      if (!isNaN(parsedId) && parsedId > 0) {
        setProblemId(parsedId);
        setIsEditMode(true);
      } else {
        alert('エラー: 無効な問題IDです');
        setIsEditMode(false);
        setProblemId(null);
      }
    } else {
      setIsEditMode(false);
      setProblemId(null);
    }
  }, [searchParams]);


  // 編集モード時に、カテゴリに応じたデータを取得するuseEffect
  useEffect(() => {
    if (problemId && isEditMode) {
      const fetchProblemData = async () => {
        const isSelectProblem = selectedCategory === 'itpassport';
        const apiUrl = isSelectProblem ? `/api/select-problems/${problemId}` : `/api/problems/${problemId}`;
        
        try {
          const response = await fetch(apiUrl);
          if (!response.ok) throw new Error(`問題データの読み込みに失敗しました (Status: ${response.status})`);
          const data = await response.json();

          if (isSelectProblem) {
            setFormData({
              ...formData,
              title: data.title || '',
              description: data.description || '',
              difficulty: data.difficultyId || 1,
              problemType: '選択問題',
              category: '4択問題',
            });
            setExplanation(data.explanation || '');
            if (Array.isArray(data.answerOptions)) {
              const optionsWithId = (data.answerOptions as string[]).map((text, index) => ({
                id: String.fromCharCode(97 + index), // a, b, c, d
                text: text,
              }));
              setAnswerOptions(optionsWithId);
            }
            const correctIndex = data.answerOptions.indexOf(data.correctAnswer);
            if (correctIndex !== -1) {
              setCorrectAnswer(String.fromCharCode(97 + correctIndex));
            }
          } else {
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
            setSampleCases(data.sampleCases?.length > 0 ? data.sampleCases : [{ id: null, input: '', expectedOutput: '', description: '' }]);
            setTestCases(data.testCases?.length > 0 ? data.testCases : [{ id: null, name: 'ケース1', input: '', expectedOutput: '', description: '' }]);
          }
        } catch (error: any) {
          alert(`データ読み込みエラー: ${error.message}`);
          router.push('/issue_list/mine_issue_list/problems');
        }
      };
      fetchProblemData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problemId, isEditMode, selectedCategory, router]);

  // カテゴリリスト
  const categories = [
    { id: 'programming', name: 'プログラミング問題', subItems: [] },
    { id: 'itpassport', name: '4択問題', subItems: [] },
  ]

  // カテゴリ選択処理
  const handleCategorySelect = (categoryId: string) => {
    if (isEditMode) {
      alert("編集モード中は問題のカテゴリを変更できません。");
      return;
    }

    setSelectedCategory(categoryId);
    resetForm(categoryId);

    if (categoryId === 'itpassport') {
      setFormData(prev => ({
        ...prev,
        category: '4択問題',
        problemType: '選択問題',
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        category: 'プログラミング基礎',
        problemType: 'コーディング問題',
      }));
    }
  };

  const handleOptionChange = (id: string, text: string) => {
    setAnswerOptions(options => 
      options.map(opt => (opt.id === id ? { ...opt, text } : opt))
    );
  };

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

  const addSampleCase = () => {
    const newId = Math.max(...sampleCases.map(c => c.id ?? 0)) + 1;
    setSampleCases(prev => [...prev, { id: Date.now(), input: '', expectedOutput: '', description: '' }]);
  }

  const removeSampleCase = (id: number | null) => {
    setSampleCases(prev => prev.filter(c => c.id !== id))
  }

  const addTestCase = () => {
    const newId = Math.max(...testCases.map(c => c.id ?? 0)) + 1;
    setTestCases(prev => [...prev, { id: newId, name: `ケース${testCases.length + 1}`, input: '', expectedOutput: '', description: '' }]);
  }

  const removeTestCase = (id: number | null) => {
    setTestCases(prev => prev.filter(c => c.id !== id))
  }

  // 問題更新処理 (Update Problem)
  const handleUpdateProblem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    if (!problemId) {
      alert('エラー: 更新する問題IDが見つかりません。');
      setIsSubmitting(false);
      return;
    }
    try {
      let response;
      if (selectedCategory === 'itpassport') {
        const requestBody = {
          title: formData.title,
          description: formData.description,
          explanation: explanation,
          answerOptions: answerOptions.map(opt => opt.text),
          correctAnswer: answerOptions.find(opt => opt.id === correctAnswer)?.text || '',
          difficultyId: formData.difficulty,
        };
        response = await fetch(`/api/select-problems/${problemId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });
      } else {
        response = await fetch(`/api/problems/${problemId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            sampleCases: sampleCases.filter(sc => sc.input || sc.expectedOutput),
            testCases: testCases.filter(tc => tc.input || tc.expectedOutput),
          }),
        });
      }
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '問題の更新に失敗しました');
      }
      alert('問題が正常に更新されました！');
      router.push('/issue_list/mine_issue_list/problems');
    } catch (error: any) {
      alert(`エラー: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 下書き保存機能は削除されました

  // 問題投稿処理 (Publish Problem)
  const handlePublishProblem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let problemResult: any = null;
      
      if (selectedCategory === 'itpassport') {
        const requestBody = {
          title: formData.title,
          description: formData.description,
          explanation: explanation,
          answerOptions: answerOptions.map(opt => opt.text),
          correctAnswer: answerOptions.find(opt => opt.id === correctAnswer)?.text || '',
          subjectId: 4, 
          difficultyId: formData.difficulty,
        };
          const response = await fetch('/api/selects_problems', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });
        if (!response.ok) throw new Error((await response.json()).message || '選択問題の作成に失敗しました。');
        problemResult = await response.json();
        alert('選択問題が正常に投稿されました！');
      } else {
        const problemData = {
          ...formData,
          tags: JSON.stringify(formData.tags),
          sampleCases: sampleCases.filter(sc => sc.input || sc.expectedOutput),
          testCases: testCases.filter(tc => tc.input || tc.expectedOutput),
        };
        const response = await fetch('/api/problems', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(problemData),
        });
        if (!response.ok) throw new Error((await response.json()).error || 'コーディング問題の投稿に失敗しました');
        problemResult = await response.json();
        alert('コーディング問題が正常に投稿されました！');
      }
      
      // ★グループ機能特有: 問題作成後にグループ管理画面（課題作成タブ）へ遷移して、作成した問題を紐付ける
      if (hashedId && problemResult) {
        // 作成された問題の情報をURLパラメータとして渡す
        const problemInfo = encodeURIComponent(JSON.stringify({
          id: problemResult.id,
          title: problemResult.title || formData.title,
          type: selectedCategory === 'itpassport' ? 'select' : 'programming'
        }));
        router.push(`/group/${hashedId}/admin?tab=課題&expand=true&problem=${problemInfo}`);
      } else {
        // hashedIdが取得できない場合は、フォームをリセットのみ
        resetForm(selectedCategory);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '不明なエラーが発生しました。';
      console.error('Error:', error);
      alert(`エラー: ${message}`); 
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditMode = () => {
    setIsEditMode(!isEditMode)
    if (!isEditMode) {
      alert('編集モードに切り替えました。問題を修正できます。')
    } else {
      alert('編集モードを終了しました。')
    }
  }

  const resetForm = (category = selectedCategory) => {
    setFormData({
      title: '',
      problemType: category === 'itpassport' ? '選択問題' : 'コーディング問題',
      difficulty: 4,
      timeLimit: 10,
      category: category === 'itpassport' ? '4択問題' : 'プログラミング基礎',
      topic: '標準入力',
      tags: [],
      description: '',
      codeTemplate: '',
      isPublic: false,
      allowTestCaseView: false
    });

    setAnswerOptions([
      { id: 'a', text: '' }, { id: 'b', text: '' }, { id: 'c', text: '' }, { id: 'd', text: '' }
    ]);
    setCorrectAnswer('a');
    setExplanation('');

    setSampleCases([{ id: 1, input: '', expectedOutput: '', description: '' }])
    setTestCases([{ id: 1, name: 'ケース1', input: '', expectedOutput: '', description: '' }])
    setActiveTab('basic')
    setIsEditMode(false)
  } 

  // プログラミング用のタブ（ファイルを削除）
  const programmingTabs = [
    { id: 'basic', label: '基本情報' },
    { id: 'description', label: '問題文' },
    { id: 'sample-cases', label: 'サンプルケース' },
    { id: 'test-cases', label: 'テストケース' },
    { id: 'settings', label: '設定' },
  ];
  // 選択問題用のタブ
  const selectProblemTabs = [
    { id: 'basic', label: '基本情報' },
  ];
  const tabsToRender = selectedCategory === 'itpassport' ? selectProblemTabs : programmingTabs;

  // ★★★ FOUC対策: マウントされていない間はローディング（または空）を表示 ★★★
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%)' }}>
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div>
      <style jsx>{`
        /* リセットとベーススタイル */
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif; line-height: 1.6; color: #2d3748; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; }
        .main-layout { display: flex; min-height: 100vh; background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); }
        .sidebar { width: 280px; background: linear-gradient(180deg, #4fd1c7 0%, #38b2ac 100%); color: white; padding: 2rem 0; box-shadow: 4px 0 20px rgba(0, 0, 0, 0.1); border-radius: 0 20px 20px 0; margin-right: 2rem; }
        .sidebar-header { padding: 0 2rem 2rem; text-align: center; }
        .sidebar-title { background: rgba(255, 255, 255, 0.2); padding: 0.75rem 1.5rem; border-radius: 25px; font-size: 0.875rem; font-weight: 600; color: white; margin-bottom: 1.5rem; backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.3); }
        .category-section { margin-bottom: 1.5rem; }
        .sidebar-menu { list-style: none; }
        .sidebar-item { margin-bottom: 0.25rem; }
        .sidebar-link { display: flex; align-items: center; padding: 1rem 2rem; color: rgba(255, 255, 255, 0.9); text-decoration: none; font-size: 0.875rem; font-weight: 500; transition: all 0.3s ease; border-left: 4px solid transparent; position: relative; cursor: pointer; border: none; background: none; width: 100%; text-align: left; }
        .sidebar-link:hover { background: rgba(255, 255, 255, 0.1); color: white; border-left-color: rgba(255, 255, 255, 0.5); transform: translateX(4px); }
        .sidebar-link.active { background: rgba(255, 255, 255, 0.2); color: white; border-left-color: white; font-weight: 600; box-shadow: inset 0 0 20px rgba(255, 255, 255, 0.1); }
        .sidebar-link-content { display: flex; align-items: center; justify-content: space-between; width: 100%; }
        .sidebar-link-text { flex: 1; }
        .main-content { flex: 1; padding: 2rem; max-width: calc(100% - 320px); }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { margin-bottom: 2rem; text-align: center; }
        .header-title { font-size: 2.5rem; font-weight: 800; background: linear-gradient(135deg, #0ac5b2 0%, #667eea 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-bottom: 0.5rem; }
        .header-description { color: #718096; font-size: 1.1rem; font-weight: 500; }
        .edit-mode-indicator { background: linear-gradient(135deg, #4fd1c7 0%, #19547b 100%); color: white; padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.875rem; font-weight: 600; margin-bottom: 1rem; display: inline-block; margin-left: 1rem; }
        .card { background: white; border-radius: 20px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1); overflow: hidden; margin-bottom: 2rem; border: 1px solid rgba(255, 255, 255, 0.2); backdrop-filter: blur(10px); }
        .card-header { background: linear-gradient(135deg, #4fd1c7 0%, #38b2ac 100%); color: white; padding: 1.5rem 2rem; font-weight: 600; font-size: 1.125rem; border-bottom: 1px solid rgba(255, 255, 255, 0.1); }
        .card-body { padding: 2rem; }
        .tabs { display: flex; background: #f7fafc; border-radius: 15px; padding: 0.5rem; margin-bottom: 2rem; box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.05); }
        .tab { flex: 1; padding: 1rem 1.5rem; text-align: center; background: transparent; border: none; border-radius: 10px; font-weight: 600; font-size: 0.875rem; color: #718096; cursor: pointer; transition: all 0.3s ease; position: relative; }
        .tab:hover { color: #4fd1c7; background: rgba(79, 209, 199, 0.1); }
        .tab.active { background: linear-gradient(135deg, #4fd1c7 0%, #38b2ac 100%); color: white; box-shadow: 0 4px 15px rgba(79, 209, 199, 0.3); transform: translateY(-2px); }
        .form-group { margin-bottom: 1.5rem; }
        .form-row { display: flex; gap: 1rem; margin-bottom: 1.5rem; }
        .form-col { flex: 1; }
        .form-label { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; font-weight: 600; color: #2d3748; font-size: 0.875rem; }
        .required-badge { background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%); color: white; padding: 0.25rem 0.5rem; border-radius: 12px; font-size: 0.625rem; font-weight: 600; letter-spacing: 0.025em; }
        .form-input, .form-select, .form-textarea { width: 100%; padding: 0.875rem 1rem; border: 2px solid #e2e8f0; border-radius: 10px; font-size: 0.875rem; transition: all 0.3s ease; background: white; color: #2d3748; }
        .form-input:focus, .form-select:focus, .form-textarea:focus { outline: none; border-color: #4fd1c7; box-shadow: 0 0 0 3px rgba(79, 209, 199, 0.1); transform: translateY(-1px); }
        .form-select { appearance: none; background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e"); background-position: right 0.5rem center; background-repeat: no-repeat; background-size: 1.5em 1.5em; padding-right: 2.5rem; max-height: 200px; overflow-y: auto; }
        .form-select option { padding: 0.5rem; background: white; color: #2d3748; }
        .form-select option:hover { background: #f7fafc; }
        .form-textarea { min-height: 120px; resize: vertical; font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; line-height: 1.5; }
        .markdown-toolbar { display: flex; gap: 0.5rem; margin-bottom: 0.5rem; padding: 0.75rem; background: #f7fafc; border-radius: 10px; border: 2px solid #e2e8f0; flex-wrap: wrap; }
        .toolbar-btn { padding: 0.5rem 0.75rem; background: white; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.75rem; font-weight: 600; color: #4a5568; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; gap: 0.25rem; }
        .toolbar-btn:hover { background: #4fd1c7; color: white; border-color: #4fd1c7; transform: translateY(-1px); }
        .tags-container { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; }
        .tag { background: linear-gradient(135deg, #4fd1c7 0%, #38b2ac 100%); color: white; padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; box-shadow: 0 2px 10px rgba(79, 209, 199, 0.2); }
        .tag-remove { background: rgba(255, 255, 255, 0.2); border: none; color: white; border-radius: 50%; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 0.75rem; transition: all 0.2s ease; }
        .tag-remove:hover { background: rgba(255, 255, 255, 0.3); transform: scale(1.1); }
        .tag-input-container { display: flex; gap: 0.5rem; }
        .tag-input { flex: 1; padding: 0.5rem 1rem; border: 2px solid #e2e8f0; border-radius: 20px; font-size: 0.875rem; transition: all 0.3s ease; }
        .tag-input:focus { outline: none; border-color: #4fd1c7; box-shadow: 0 0 0 3px rgba(79, 209, 199, 0.1); }
        .btn { padding: 0.875rem 1.5rem; border: none; border-radius: 10px; font-weight: 600; font-size: 0.875rem; cursor: pointer; transition: all 0.3s ease; display: inline-flex; align-items: center; gap: 0.5rem; text-decoration: none; text-align: center; justify-content: center; min-width: 120px; }
        .btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none !important; }
        .btn-primary { background: linear-gradient(135deg, #4fd1c7 0%, #38b2ac 100%); color: white; box-shadow: 0 4px 15px rgba(79, 209, 199, 0.3); }
        .btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(79, 209, 199, 0.4); }
        .btn-secondary { background: linear-gradient(135deg, #718096 0%, #4a5568 100%); color: white; box-shadow: 0 4px 15px rgba(113, 128, 150, 0.3); }
        .btn-secondary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(113, 128, 150, 0.4); }
        .btn-success { background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); color: white; box-shadow: 0 4px 15px rgba(72, 187, 120, 0.3); }
        .btn-success:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(72, 187, 120, 0.4); }
        .btn-warning { background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%); color: white; box-shadow: 0 4px 15px rgba(237, 137, 54, 0.3); }
        .btn-warning:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(237, 137, 54, 0.4); }
        .btn-small { padding: 0.5rem 1rem; font-size: 0.75rem; min-width: auto; }
        .case-item { background: #f7fafc; border: 2px solid #e2e8f0; border-radius: 15px; padding: 1.5rem; margin-bottom: 1rem; transition: all 0.3s ease; }
        .case-item:hover { border-color: #4fd1c7; box-shadow: 0 4px 15px rgba(79, 209, 199, 0.1); }
        .case-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        .case-title { font-weight: 600; color: #2d3748; font-size: 0.875rem; }
        .case-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
        .case-description { grid-column: 1 / -1; }
        .file-upload-area { border: 2px dashed #cbd5e0; border-radius: 15px; padding: 2rem; text-align: center; background: #f7fafc; transition: all 0.3s ease; cursor: pointer; }
        .file-upload-area:hover { border-color: #4fd1c7; background: rgba(79, 209, 199, 0.05); }
        .upload-icon { font-size: 3rem; color: #cbd5e0; margin-bottom: 1rem; }
        .upload-text { color: #718096; font-size: 0.875rem; margin-bottom: 0.5rem; }
        .upload-hint { color: #a0aec0; font-size: 0.75rem; }
        .file-list { margin-top: 1.5rem; }
        .file-item { display: flex; align-items: center; justify-content: space-between; padding: 1rem; background: white; border: 1px solid #e2e8f0; border-radius: 10px; margin-bottom: 0.5rem; transition: all 0.3s ease; }
        .file-item:hover { border-color: #4fd1c7; box-shadow: 0 2px 10px rgba(79, 209, 199, 0.1); }
        .file-info { display: flex; align-items: center; gap: 1rem; flex: 1; }
        .file-icon { width: 40px; height: 40px; background: linear-gradient(135deg, #4fd1c7 0%, #38b2ac 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 0.75rem; }
        .file-details { flex: 1; }
        .file-name { font-weight: 600; color: #2d3748; font-size: 0.875rem; margin-bottom: 0.25rem; }
        .file-size { color: #718096; font-size: 0.75rem; }
        .file-actions { display: flex; gap: 0.5rem; }
        .preview-modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.8); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(5px); }
        .preview-content { background: white; border-radius: 20px; padding: 2rem; max-width: 90%; max-height: 90%; overflow: auto; position: relative; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3); }
        .preview-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid #e2e8f0; }
        .preview-title { font-weight: 600; color: #2d3748; font-size: 1.125rem; }
        .preview-close { background: #e53e3e; color: white; border: none; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 1rem; transition: all 0.2s ease; }
        .preview-close:hover { background: #c53030; transform: scale(1.1); }
        .preview-image { max-width: 100%; max-height: 70vh; object-fit: contain; border-radius: 10px; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1); }
        .preview-text { background: #f7fafc; padding: 1rem; border-radius: 10px; font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; font-size: 0.875rem; line-height: 1.5; color: #2d3748; white-space: pre-wrap; max-height: 60vh; overflow-y: auto; }
        .checkbox-group { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; }
        .checkbox { position: relative; display: inline-block; }
        .checkbox input { opacity: 0; position: absolute; width: 0; height: 0; }
        .checkbox-custom { width: 20px; height: 20px; background: white; border: 2px solid #e2e8f0; border-radius: 4px; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease; cursor: pointer; }
        .checkbox input:checked + .checkbox-custom { background: linear-gradient(135deg, #4fd1c7 0%, #38b2ac 100%); border-color: #4fd1c7; }
        .checkbox input:checked + .checkbox-custom::after { content: '✓'; color: white; font-size: 0.75rem; font-weight: 600; }
        .checkbox-label { font-size: 0.875rem; color: #2d3748; cursor: pointer; user-select: none; }
        .action-buttons { display: flex; gap: 1rem; justify-content: center; margin-top: 2rem; padding-top: 2rem; border-top: 1px solid #e2e8f0; flex-wrap: wrap; }
        @media (max-width: 768px) {
          .main-layout { flex-direction: column; }
          .sidebar { width: 100%; border-radius: 0; margin-right: 0; margin-bottom: 1rem; }
          .main-content { max-width: 100%; padding: 1rem; }
          .header-title { font-size: 2rem; }
          .form-row { flex-direction: column; }
          .case-fields { grid-template-columns: 1fr; }
          .action-buttons { flex-direction: column; }
          .tabs { flex-direction: column; }
          .markdown-toolbar { justify-content: center; }
          .preview-content { margin: 1rem; max-width: calc(100% - 2rem); max-height: calc(100% - 2rem); }
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        .card { animation: fadeIn 0.6s ease-out; }
        .sidebar { animation: slideIn 0.4s ease-out; }
        .preview-modal { animation: fadeIn 0.3s ease-out; }
        .form-input:focus, .form-select:focus, .form-textarea:focus, .tag-input:focus { outline: none; border-color: #4fd1c7; box-shadow: 0 0 0 3px rgba(79, 209, 199, 0.1); }
        .btn:disabled::after { content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 16px; height: 16px; border: 2px solid rgba(255, 255, 255, 0.3); border-top: 2px solid white; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: translate(-50%, -50%) rotate(0deg); } 100% { transform: translate(-50%, -50%) rotate(360deg); } }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 4px; }
        ::-webkit-scrollbar-thumb { background: linear-gradient(135deg, #4fd1c7 0%, #38b2ac 100%); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: linear-gradient(135deg, #38b2ac 0%, #319795 100%); }
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
                    onClick={() => handleCategorySelect(category.id)}
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
                {isEditMode 
                  ? '問題編集' 
                  : selectedCategory === 'itpassport' 
                    ? '選択問題作成' 
                    : 'プログラミング問題作成'
                }
              </h1>
              <p className="header-description">
                {isEditMode ? '既存の問題を編集・更新できます' : '新しいプログラミング問題を作成しましょう'}
              </p>
            </div>

            {/* タブ */}
            <div className="tabs">
              {tabsToRender.map((tab) => (
                <button
                  key={tab.id}
                  className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <form onSubmit={isEditMode ? handleUpdateProblem : handlePublishProblem}>
              {selectedCategory === 'itpassport' ? (
                // 4択問題作成フォーム
                <>
                  {activeTab === 'basic' && (
                      <div className="card">
                          <div className="card-header">基本情報</div>
                          <div className="card-body">
                              {/* 全ての基本項目をここに集約 */}
                              <div className="form-group">
                                  <label className="form-label"><span className="required-badge">必須</span>問題タイトル</label>
                                  <input type="text" className="form-input" value={formData.title} onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))} placeholder="例: Pythonの変数宣言について" required />
                              </div>
                              <div className="form-group">
                                  <label className="form-label"><span className="required-badge">必須</span>問題文</label>
                                  <textarea className="form-textarea" value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder="問題文を記述してください..." rows={8} required />
                              </div>
                              <div className="form-group">
                                  <label className="form-label"><span className="required-badge">必須</span>選択肢と正解</label>
                                  {answerOptions.map((option, index) => (
                                      <div key={option.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '0.75rem' }}>
                                          <input type="radio" name="correctAnswer" value={option.id} checked={correctAnswer === option.id} onChange={(e) => setCorrectAnswer(e.target.value)} style={{ marginRight: '1rem', transform: 'scale(1.2)' }} />
                                          <input type="text" className="form-input" value={option.text} onChange={(e) => handleOptionChange(option.id, e.target.value)} placeholder={`選択肢 ${index + 1}`} required />
                                      </div>
                                  ))}
                              </div>
                              <div className="form-group">
                                  <label className="form-label">解説</label>
                                  <textarea className="form-textarea" value={explanation} onChange={(e) => setExplanation(e.target.value)} placeholder="正解の解説を記述してください..." rows={6} />
                              </div>
                              <div className="form-group">
                                  <label className="form-label">難易度</label>
                                  <select className="form-select" value={formData.difficulty} onChange={(e) => setFormData(prev => ({ ...prev, difficulty: parseInt(e.target.value) }))}>
                                      <option value={1}>1 (やさしい)</option>
                                      <option value={2}>2 (かんたん)</option>
                                      <option value={3}>3 (ふつう)</option>
                                      <option value={4}>4 (むずかしい)</option>
                                      <option value={5}>5 (鬼むず)</option>
                                  </select>
                              </div>
                          </div>
                      </div>
                  )}
              
                  {/* アクションボタン */}
              <div className="action-buttons">
                
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
                
                <button type="button" className="btn btn-secondary" onClick={() => resetForm()} disabled={isSubmitting}>リセット</button>
              </div>
              </>
          ) : (
                // コーディング問題作成フォーム
                <>
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
                      {/* 制限時間の入力欄は削除済み */}
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
                      {/* Markdownツールバーは削除済み */}
                      <textarea
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
                            <div className="case-title">サンプル {index + 1}</div>
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
                  </div>
                </div>
              )}

              {/* アクションボタン */}
              <div className="action-buttons">
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
                
                <button type="button" className="btn btn-secondary" onClick={() => resetForm()} disabled={isSubmitting}>リセット</button>
              </div>
              </>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}