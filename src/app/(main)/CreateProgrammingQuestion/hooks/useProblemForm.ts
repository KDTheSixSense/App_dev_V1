'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { FormData, Case, TestCase, AnswerOption, UploadedFile } from '../types';

export const useProblemForm = () => {
    const router = useRouter();
    const searchParams = useSearchParams();

    // FOUC対策: マウント状態を管理するステートを追加
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
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [showPreview, setShowPreview] = useState(false)
    const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false)

    // トピックリスト (定数化してもよいが、一旦そのまま)
    const topics = [
        '標準入力', '配列操作', '文字列処理', 'ループ処理',
        '条件分岐', '関数・メソッド', 'データ構造', 'アルゴリズム'
    ];

    // カテゴリリスト
    const categories = [
        { id: 'programming', name: 'プログラミング問題', subItems: [] },
        { id: 'itpassport', name: '4択問題', subItems: [] },
    ]

    // 初期化処理
    useEffect(() => {
        setMounted(true);
        const idFromQuery = searchParams.get('id');
        const typeFromQuery = searchParams.get('type');

        if (typeFromQuery === 'select') {
            setSelectedCategory('itpassport');
            setFormData(prev => ({ ...prev, problemType: '選択問題', category: '4択問題' }));
        } else {
            setSelectedCategory('programming');
            setFormData(prev => ({ ...prev, problemType: 'コーディング問題', category: 'プログラミング基礎' }));
        }

        if (idFromQuery) {
            const parsedId = parseInt(idFromQuery);
            if (!isNaN(parsedId) && parsedId > 0) {
                setProblemId(parsedId);
                setIsEditMode(true);
            } else {
                toast.error('エラー: 無効な問題IDです');
                setIsEditMode(false);
                setProblemId(null);
            }
        } else {
            setIsEditMode(false);
            setProblemId(null);
        }
    }, [searchParams]);

    // データを取得
    useEffect(() => {
        if (problemId && isEditMode) {
            const fetchProblemData = async () => {
                const isSelectProblem = selectedCategory === 'itpassport';
                const apiUrl = isSelectProblem ? `/api/select-problems/${problemId}` : `/api/problems/${problemId}`;

                try {
                    const response = await fetch(apiUrl);
                    if (!response.ok) throw new Error(`問題データの読み込みに失敗しました (Status: ${response.status})`);
                    const data = await response.json();
                    console.log('Fetched Problem Data:', data); // データ構造確認用ログ

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
                                id: String.fromCharCode(97 + index),
                                text: text,
                            }));
                            setAnswerOptions(optionsWithId);
                        }
                        const correctIndex = data.answerOptions.indexOf(data.correctAnswer);
                        if (correctIndex !== -1) {
                            setCorrectAnswer(String.fromCharCode(97 + correctIndex));
                        }
                        // isPublicの読み込みを追加
                        setFormData(prev => ({ ...prev, isPublic: data.isPublic || false }));
                    } else {

                        let parsedTags: string[] = [];
                        try {
                            const parsed = JSON.parse(data.tags || '[]');
                            parsedTags = Array.isArray(parsed) ? parsed : [];
                        } catch (e) {
                            console.error("Failed to parse tags", e);
                            parsedTags = [];
                        }
                        if (parsedTags.length === 0 && data.topic) {
                            parsedTags.push(data.topic);
                        }

                        setFormData({
                            title: data.title || '',
                            problemType: data.problemType || 'コーディング問題',
                            difficulty: data.difficulty || 4,
                            timeLimit: data.timeLimit || 10,
                            category: data.category || 'プログラミング基礎',
                            topic: data.topic || '標準入力',
                            tags: parsedTags,
                            description: data.description || '',
                            codeTemplate: data.codeTemplate || '',
                            isPublic: data.isPublic || false,
                            allowTestCaseView: data.allowTestCaseView || false,
                        });
                        setSampleCases(data.sampleCases?.length > 0 ? data.sampleCases.map((sc: any) => ({
                            id: sc.id,
                            input: sc.input,
                            expectedOutput: sc.expectedOutput || sc.output || '',
                            description: sc.description
                        })) : [{ id: null, input: '', expectedOutput: '', description: '' }]);

                        const rawTestCases = data.testCases || data.TestCases || [];
                        setTestCases(rawTestCases.length > 0 ? rawTestCases.map((tc: any) => {
                            const testCase = tc.testCase || tc.TestCase || tc;
                            return {
                                id: testCase.id,
                                name: testCase.name || 'ケース',
                                input: testCase.input || testCase.Input || '',
                                expectedOutput: testCase.expectedOutput || testCase.ExpectedOutput || testCase.output || testCase.Output || '',
                                description: testCase.description || testCase.Description || ''
                            };
                        }) : [{ id: null, name: 'ケース1', input: '', expectedOutput: '', description: '' }]);
                    }
                } catch (error: any) {
                    toast.error(`データ読み込みエラー: ${error.message}`);
                    router.push('/issue_list/mine_issue_list/problems');
                }
            };
            fetchProblemData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [problemId, isEditMode, selectedCategory, router]);

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

    const handleCategorySelect = (categoryId: string) => {
        if (isEditMode) {
            toast.error("編集モード中は問題のカテゴリを変更できません。");
            return;
        }
        setSelectedCategory(categoryId);
        resetForm(categoryId);

        if (categoryId === 'itpassport') {
            setFormData(prev => ({ ...prev, category: '4択問題', problemType: '選択問題' }));
        } else {
            setFormData(prev => ({ ...prev, category: 'プログラミング基礎', problemType: 'コーディング問題' }));
        }
    };

    const handleOptionChange = (id: string, text: string) => {
        setAnswerOptions(options =>
            options.map(opt => (opt.id === id ? { ...opt, text } : opt))
        );
    };

    const addTag = () => {
        if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, tagInput.trim()]
            }))
            setTagInput('')
        }
    }

    const removeTag = (tagToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }))
    }

    const addSampleCase = () => {
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

    const handleUpdateProblem = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        if (!problemId) {
            toast.error('エラー: 更新する問題IDが見つかりません。');
            setIsSubmitting(false);
            return;
        }
        try {
            const validTestCases = testCases.filter(tc => tc.input.trim() !== '' && tc.expectedOutput.trim() !== '');
            if (validTestCases.length === 0) {
                toast.error('テストケースは最低1つ必須です（入力と出力を記入してください）');
                setIsSubmitting(false);
                return;
            }

            let response;
            if (selectedCategory === 'itpassport') {
                const requestBody = {
                    title: formData.title,
                    description: formData.description,
                    explanation: explanation,
                    answerOptions: answerOptions.map(opt => opt.text),
                    correctAnswer: answerOptions.find(opt => opt.id === correctAnswer)?.text || '',
                    difficultyId: formData.difficulty,
                    isPublic: formData.isPublic,
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
            toast.success('問題が正常に更新されました！');
            router.push('/issue_list/mine_issue_list/problems');
        } catch (error: any) {
            toast.error(`エラー: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePublishProblem = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (selectedCategory !== 'itpassport') {
                const validTestCases = testCases.filter(tc => tc.input.trim() !== '' && tc.expectedOutput.trim() !== '');
                if (validTestCases.length === 0) {
                    toast.error('テストケースは最低1つ必須です（入力と出力を記入してください）');
                    setIsSubmitting(false);
                    return;
                }
            }

            if (selectedCategory === 'itpassport') {
                const requestBody = {
                    title: formData.title,
                    description: formData.description,
                    explanation: explanation,
                    answerOptions: answerOptions.map(opt => opt.text),
                    correctAnswer: answerOptions.find(opt => opt.id === correctAnswer)?.text || '',
                    subjectId: 4,
                    difficultyId: formData.difficulty,
                    isPublic: formData.isPublic,
                };
                const response = await fetch('/api/selects_problems', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody),
                });
                if (!response.ok) throw new Error((await response.json()).message || '選択問題の作成に失敗しました。');
                await response.json();
                toast.success('選択問題が正常に投稿されました！');
            } else {
                const problemData = {
                    ...formData,
                    sampleCases: sampleCases.filter(sc => sc.input || sc.expectedOutput),
                    testCases: testCases.filter(tc => tc.input || tc.expectedOutput),
                };
                const response = await fetch('/api/problems', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(problemData),
                });
                if (!response.ok) throw new Error((await response.json()).error || 'コーディング問題の投稿に失敗しました');
                await response.json();
                toast.success('コーディング問題が正常に投稿されました！');
            }
            router.push('/issue_list/mine_issue_list/problems');
        } catch (error) {
            const message = error instanceof Error ? error.message : '不明なエラーが発生しました。';
            console.error('Error:', error);
            toast.error(`エラー: ${message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        mounted,
        activeTab,
        setActiveTab,
        selectedCategory,
        isEditMode,
        formData,
        setFormData,
        sampleCases,
        setSampleCases,
        testCases,
        setTestCases,
        answerOptions,
        correctAnswer,
        setCorrectAnswer,
        explanation,
        setExplanation,
        tagInput,
        setTagInput,
        isSubmitting,
        topics,
        categories,
        handleCategorySelect,
        handleOptionChange,
        addTag,
        removeTag,
        addSampleCase,
        removeSampleCase,
        addTestCase,
        removeTestCase,
        handleUpdateProblem,
        handlePublishProblem,
        resetForm
    };
};
