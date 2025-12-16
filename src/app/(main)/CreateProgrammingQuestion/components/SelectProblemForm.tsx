'use client';

import React from 'react';
import { FormData, AnswerOption } from '../types';

interface SelectProblemFormProps {
    formData: FormData;
    setFormData: React.Dispatch<React.SetStateAction<FormData>>;
    answerOptions: AnswerOption[];
    correctAnswer: string;
    setCorrectAnswer: (value: string) => void;
    handleOptionChange: (id: string, text: string) => void;
    explanation: string;
    setExplanation: (value: string) => void;
    isSubmitting: boolean;
    isEditMode: boolean;
    handleUpdateProblem: (e: React.FormEvent<HTMLFormElement>) => void;
    handlePublishProblem: (e: React.FormEvent<HTMLFormElement>) => void;
    resetForm: () => void;
    activeTab: string;
}

const SelectProblemForm: React.FC<SelectProblemFormProps> = ({
    formData,
    setFormData,
    answerOptions,
    correctAnswer,
    setCorrectAnswer,
    handleOptionChange,
    explanation,
    setExplanation,
    isSubmitting,
    isEditMode,
    handleUpdateProblem,
    handlePublishProblem,
    resetForm,
    activeTab
}) => {
    return (
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

            <style jsx>{`
                .card { background: white; border-radius: 20px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1); overflow: hidden; margin-bottom: 2rem; border: 1px solid rgba(255, 255, 255, 0.2); backdrop-filter: blur(10px); }
                .card-header { background: linear-gradient(135deg, #4fd1c7 0%, #38b2ac 100%); color: white; padding: 1.5rem 2rem; font-weight: 600; font-size: 1.125rem; border-bottom: 1px solid rgba(255, 255, 255, 0.1); }
                .card-body { padding: 2rem; }
                .form-group { margin-bottom: 1.5rem; }
                .form-label { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; font-weight: 600; color: #2d3748; font-size: 0.875rem; }
                .required-badge { background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%); color: white; padding: 0.25rem 0.5rem; border-radius: 12px; font-size: 0.625rem; font-weight: 600; letter-spacing: 0.025em; }
                .form-input, .form-select, .form-textarea { width: 100%; padding: 0.875rem 1rem; border: 2px solid #e2e8f0; border-radius: 10px; font-size: 0.875rem; transition: all 0.3s ease; background: white; color: #2d3748; }
                .form-input:focus, .form-select:focus, .form-textarea:focus { outline: none; border-color: #4fd1c7; box-shadow: 0 0 0 3px rgba(79, 209, 199, 0.1); transform: translateY(-1px); }
                .form-select { appearance: none; background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e"); background-position: right 0.5rem center; background-repeat: no-repeat; background-size: 1.5em 1.5em; padding-right: 2.5rem; max-height: 200px; overflow-y: auto; }
                .form-select option { padding: 0.5rem; background: white; color: #2d3748; }
                .form-select option:hover { background: #f7fafc; }
                .form-textarea { min-height: 120px; resize: vertical; font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; line-height: 1.5; }
                .btn { padding: 0.875rem 1.5rem; border: none; border-radius: 10px; font-weight: 600; font-size: 0.875rem; cursor: pointer; transition: all 0.3s ease; display: inline-flex; align-items: center; gap: 0.5rem; text-decoration: none; text-align: center; justify-content: center; min-width: 120px; }
                .btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none !important; }
                .btn-primary { background: linear-gradient(135deg, #4fd1c7 0%, #38b2ac 100%); color: white; box-shadow: 0 4px 15px rgba(79, 209, 199, 0.3); }
                .btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(79, 209, 199, 0.4); }
                .btn-secondary { background: linear-gradient(135deg, #718096 0%, #4a5568 100%); color: white; box-shadow: 0 4px 15px rgba(113, 128, 150, 0.3); }
                .btn-secondary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(113, 128, 150, 0.4); }
                .btn-success { background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); color: white; box-shadow: 0 4px 15px rgba(72, 187, 120, 0.3); }
                .btn-success:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(72, 187, 120, 0.4); }
                .action-buttons { display: flex; gap: 1rem; justify-content: center; margin-top: 2rem; padding-top: 2rem; border-top: 1px solid #e2e8f0; flex-wrap: wrap; }
                @media (max-width: 768px) {
                  .action-buttons { flex-direction: column; }
                }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                .card { animation: fadeIn 0.6s ease-out; }
                .form-input:focus, .form-select:focus, .form-textarea:focus { outline: none; border-color: #4fd1c7; box-shadow: 0 0 0 3px rgba(79, 209, 199, 0.1); }
                .btn:disabled::after { content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 16px; height: 16px; border: 2px solid rgba(255, 255, 255, 0.3); border-top: 2px solid white; border-radius: 50%; animation: spin 1s linear infinite; }
                @keyframes spin { 0% { transform: translate(-50%, -50%) rotate(0deg); } 100% { transform: translate(-50%, -50%) rotate(360deg); } }
            `}</style>
        </>
    );
};

export default SelectProblemForm;
