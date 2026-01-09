'use client';

import React from 'react';
import { FormData, Case, TestCase } from '../types';

interface ProgrammingFormProps {
    formData: FormData;
    setFormData: React.Dispatch<React.SetStateAction<FormData>>;
    activeTab: string;
    topics: string[];
    tagInput: string;
    setTagInput: (value: string) => void;
    addTag: () => void;
    removeTag: (tag: string) => void;
    sampleCases: Case[];
    addSampleCase: () => void;
    removeSampleCase: (id: number | null) => void;
    setSampleCases: React.Dispatch<React.SetStateAction<Case[]>>;
    testCases: TestCase[];
    addTestCase: () => void;
    removeTestCase: (id: number | null) => void;
    setTestCases: React.Dispatch<React.SetStateAction<TestCase[]>>;
    isSubmitting: boolean;
    isEditMode: boolean;
    handleUpdateProblem: (e: React.FormEvent<HTMLFormElement>) => void;
    handlePublishProblem: (e: React.FormEvent<HTMLFormElement>) => void;
    resetForm: () => void;
}

const ProgrammingForm: React.FC<ProgrammingFormProps> = ({
    formData,
    setFormData,
    activeTab,
    topics,
    tagInput,
    setTagInput,
    addTag,
    removeTag,
    sampleCases,
    addSampleCase,
    removeSampleCase,
    setSampleCases,
    testCases,
    addTestCase,
    removeTestCase,
    setTestCases,
    isSubmitting,
    isEditMode,
    handleUpdateProblem,
    handlePublishProblem,
    resetForm
}) => {
    return (
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
                                {(Array.isArray(formData.tags) ? formData.tags : []).map((tag, index) => (
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
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">コードテンプレート (任意)</label>
                            <textarea
                                className="form-textarea"
                                value={formData.codeTemplate}
                                onChange={(e) => setFormData(prev => ({ ...prev, codeTemplate: e.target.value }))}
                                placeholder="初期状態でエディタに表示されるコード"
                                style={{ fontFamily: 'monospace' }}
                            />
                        </div>

                        <div className="checkbox-group">
                            <label className="checkbox">
                                <input
                                    type="checkbox"
                                    checked={formData.allowTestCaseView}
                                    onChange={(e) => setFormData(prev => ({ ...prev, allowTestCaseView: e.target.checked }))}
                                />
                                <div className="checkbox-custom"></div>
                            </label>
                            <span className="checkbox-label" onClick={() => setFormData(prev => ({ ...prev, allowTestCaseView: !prev.allowTestCaseView }))}>
                                ユーザーにテストケースの閲覧を許可する
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* 問題文タブ */}
            {activeTab === 'description' && (
                <div className="card">
                    <div className="card-header">
                        問題文
                    </div>
                    <div className="card-body">
                        <div className="form-group">
                            <label className="form-label">
                                <span className="required-badge">必須</span>
                                問題文
                            </label>
                            <div className="markdown-toolbar">
                                <button type="button" className="toolbar-btn">B</button>
                                <button type="button" className="toolbar-btn">I</button>
                                <button type="button" className="toolbar-btn">Link</button>
                                <button type="button" className="toolbar-btn">Code</button>
                                <button type="button" className="toolbar-btn">List</button>
                            </div>
                            <textarea
                                className="form-textarea"
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="マークダウン形式で問題文を記述してください..."
                                rows={15}
                                required
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* サンプルケースタブ */}
            {activeTab === 'sample-cases' && (
                <div className="card">
                    <div className="card-header">
                        サンプルケース
                    </div>
                    <div className="card-body">
                        <div style={{ marginBottom: '1.5rem' }}>
                            <p style={{ color: '#718096', fontSize: '0.9rem', marginBottom: '1rem' }}>
                                問題文に表示される入出力例です。ユーザーが問題の意味を理解するのを助けます。
                            </p>
                        </div>

                        {sampleCases.map((caseItem, index) => (
                            <div key={caseItem.id || index} className="case-item">
                                <div className="case-header">
                                    <div className="case-title">サンプルケース {index + 1}</div>
                                    <button
                                        type="button"
                                        onClick={() => removeSampleCase(caseItem.id)}
                                        style={{ color: '#e53e3e', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem' }}
                                    >
                                        削除
                                    </button>
                                </div>
                                <div className="case-fields">
                                    <div className="form-group">
                                        <label className="form-label">入力</label>
                                        <textarea
                                            className="form-textarea"
                                            value={caseItem.input}
                                            onChange={(e) => {
                                                const newCases = [...sampleCases];
                                                newCases[index].input = e.target.value;
                                                setSampleCases(newCases);
                                            }}
                                            placeholder="入力例..."
                                            rows={3}
                                            style={{ minHeight: '80px' }}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">出力</label>
                                        <textarea
                                            className="form-textarea"
                                            value={caseItem.expectedOutput}
                                            onChange={(e) => {
                                                const newCases = [...sampleCases];
                                                newCases[index].expectedOutput = e.target.value;
                                                setSampleCases(newCases);
                                            }}
                                            placeholder="出力例..."
                                            rows={3}
                                            style={{ minHeight: '80px' }}
                                        />
                                    </div>
                                    <div className="case-description">
                                        <label className="form-label">説明 (任意)</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={caseItem.description}
                                            onChange={(e) => {
                                                const newCases = [...sampleCases];
                                                newCases[index].description = e.target.value;
                                                setSampleCases(newCases);
                                            }}
                                            placeholder="このケースの補足説明"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}

                        <button
                            type="button"
                            className="btn btn-secondary btn-small"
                            onClick={addSampleCase}
                            style={{ width: '100%' }}
                        >
                            + サンプルケースを追加
                        </button>
                    </div>
                </div>
            )}

            {/* テストケースタブ */}
            {activeTab === 'test-cases' && (
                <div className="card">
                    <div className="card-header">
                        テストケース
                    </div>
                    <div className="card-body">
                        <div style={{ marginBottom: '1.5rem' }}>
                            <p style={{ color: '#718096', fontSize: '0.9rem', marginBottom: '1rem' }}>
                                提出されたコードの正誤判定に使用されるテストケースです。非公開テストケースとして扱われます。
                            </p>
                        </div>

                        {testCases.map((caseItem, index) => (
                            <div key={caseItem.id || index} className="case-item">
                                <div className="case-header">
                                    <div className="case-title">{caseItem.name || `テストケース ${index + 1}`}</div>
                                    <button
                                        type="button"
                                        onClick={() => removeTestCase(caseItem.id)}
                                        style={{ color: '#e53e3e', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem' }}
                                    >
                                        削除
                                    </button>
                                </div>
                                <div className="case-fields">
                                    <div className="form-group">
                                        <label className="form-label">
                                            <span className="required-badge">必須</span>
                                            入力
                                        </label>
                                        <textarea
                                            className="form-textarea"
                                            value={caseItem.input}
                                            onChange={(e) => {
                                                const newCases = [...testCases];
                                                newCases[index].input = e.target.value;
                                                setTestCases(newCases);
                                            }}
                                            placeholder="テスト入力..."
                                            rows={3}
                                            style={{ minHeight: '80px' }}
                                            required // 必須
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">
                                            <span className="required-badge">必須</span>
                                            期待される出力
                                        </label>
                                        <textarea
                                            className="form-textarea"
                                            value={caseItem.expectedOutput}
                                            onChange={(e) => {
                                                const newCases = [...testCases];
                                                newCases[index].expectedOutput = e.target.value;
                                                setTestCases(newCases);
                                            }}
                                            placeholder="期待される出力..."
                                            rows={3}
                                            style={{ minHeight: '80px' }}
                                            required // 必須
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}

                        <button
                            type="button"
                            className="btn btn-secondary btn-small"
                            onClick={addTestCase}
                            style={{ width: '100%' }}
                        >
                            + テストケースを追加
                        </button>
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

            <style jsx>{`
                .card { background: white; border-radius: 20px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1); overflow: hidden; margin-bottom: 2rem; border: 1px solid rgba(255, 255, 255, 0.2); backdrop-filter: blur(10px); }
                .card-header { background: linear-gradient(135deg, #4fd1c7 0%, #38b2ac 100%); color: white; padding: 1.5rem 2rem; font-weight: 600; font-size: 1.125rem; border-bottom: 1px solid rgba(255, 255, 255, 0.1); }
                .card-body { padding: 2rem; }
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
                  .form-row { flex-direction: column; }
                  .case-fields { grid-template-columns: 1fr; }
                  .action-buttons { flex-direction: column; }
                  .markdown-toolbar { justify-content: center; }
                  .preview-content { margin: 1rem; max-width: calc(100% - 2rem); max-height: calc(100% - 2rem); }
                }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                .card { animation: fadeIn 0.6s ease-out; }
                .preview-modal { animation: fadeIn 0.3s ease-out; }
                .form-input:focus, .form-select:focus, .form-textarea:focus, .tag-input:focus { outline: none; border-color: #4fd1c7; box-shadow: 0 0 0 3px rgba(79, 209, 199, 0.1); }
                .btn:disabled::after { content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 16px; height: 16px; border: 2px solid rgba(255, 255, 255, 0.3); border-top: 2px solid white; border-radius: 50%; animation: spin 1s linear infinite; }
                @keyframes spin { 0% { transform: translate(-50%, -50%) rotate(0deg); } 100% { transform: translate(-50%, -50%) rotate(360deg); } }
            `}</style>
        </>
    );
};

export default ProgrammingForm;
