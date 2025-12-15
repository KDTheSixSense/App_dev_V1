'use client'

import React from 'react'
import { useProblemForm } from './hooks/useProblemForm';
import ProblemSidebar from './components/ProblemSidebar';
import ProgrammingForm from './components/ProgrammingForm';
import SelectProblemForm from './components/SelectProblemForm';

// プログラミング問題作成ページのメインコンポーネント
export default function CreateProgrammingQuestionPage() {
  const {
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
  } = useProblemForm();

  // FOUC対策: マウントされていない間はローディング（または空）を表示
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%)' }}>
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-teal-500"></div>
      </div>
    );
  }

  // プログラミング用のタブ（ファイルタブを削除）
  const programmingTabs = [
    { id: 'basic', label: '基本情報' },
    { id: 'description', label: '問題文' },
    { id: 'sample-cases', label: 'サンプルケース' },
    { id: 'test-cases', label: 'テストケース' },
  ];
  // 選択問題用のタブ（設定タブは非表示に）
  const selectProblemTabs = [
    { id: 'basic', label: '基本情報' },
  ];
  const tabsToRender = selectedCategory === 'itpassport' ? selectProblemTabs : programmingTabs;

  return (
    <div>
      <style jsx>{`
        /* リセットとベーススタイル */
        /* Note: Removing global reset to prevent affecting other components */
        /* * { margin: 0; padding: 0; box-sizing: border-box; } */
        
        /* Body style only applies when this component is mounted (scoped) */
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif; line-height: 1.6; color: #2d3748; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; }
        
        .main-layout { display: flex; min-height: 100vh; background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); }
        .main-content { flex: 1; padding: 2rem; max-width: calc(100% - 320px); }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { margin-bottom: 2rem; text-align: center; }
        .header-title { font-size: 2.5rem; font-weight: 800; background: linear-gradient(135deg, #0ac5b2 0%, #667eea 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-bottom: 0.5rem; }
        .header-description { color: #718096; font-size: 1.1rem; font-weight: 500; }
        
        .tabs { display: flex; background: #f7fafc; border-radius: 15px; padding: 0.5rem; margin-bottom: 2rem; box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.05); }
        .tab { flex: 1; padding: 1rem 1.5rem; text-align: center; background: transparent; border: none; border-radius: 10px; font-weight: 600; font-size: 0.875rem; color: #718096; cursor: pointer; transition: all 0.3s ease; position: relative; }
        .tab:hover { color: #4fd1c7; background: rgba(79, 209, 199, 0.1); }
        .tab.active { background: linear-gradient(135deg, #4fd1c7 0%, #38b2ac 100%); color: white; box-shadow: 0 4px 15px rgba(79, 209, 199, 0.3); transform: translateY(-2px); }
        
        @media (max-width: 768px) {
          .main-layout { flex-direction: column; }
          .main-content { max-width: 100%; padding: 1rem; }
          .header-title { font-size: 2rem; }
          .tabs { flex-direction: column; }
        }
        
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 4px; }
        ::-webkit-scrollbar-thumb { background: linear-gradient(135deg, #4fd1c7 0%, #38b2ac 100%); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: linear-gradient(135deg, #38b2ac 0%, #319795 100%); }
      `}</style>

      <div className="main-layout">
        {/* サイドバー */}
        <ProblemSidebar
          categories={categories}
          selectedCategory={selectedCategory}
          handleCategorySelect={handleCategorySelect}
          isEditMode={isEditMode}
        />

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
                <SelectProblemForm
                  formData={formData}
                  setFormData={setFormData}
                  answerOptions={answerOptions}
                  correctAnswer={correctAnswer}
                  setCorrectAnswer={setCorrectAnswer}
                  handleOptionChange={handleOptionChange}
                  explanation={explanation}
                  setExplanation={setExplanation}
                  isSubmitting={isSubmitting}
                  isEditMode={isEditMode}
                  handleUpdateProblem={handleUpdateProblem}
                  handlePublishProblem={handlePublishProblem}
                  resetForm={resetForm}
                  activeTab={activeTab}
                />
              ) : (
                // コーディング問題作成フォーム
                <ProgrammingForm
                  formData={formData}
                  setFormData={setFormData}
                  activeTab={activeTab}
                  topics={topics}
                  tagInput={tagInput}
                  setTagInput={setTagInput}
                  addTag={addTag}
                  removeTag={removeTag}
                  sampleCases={sampleCases}
                  addSampleCase={addSampleCase}
                  removeSampleCase={removeSampleCase}
                  setSampleCases={setSampleCases}
                  testCases={testCases}
                  addTestCase={addTestCase}
                  removeTestCase={removeTestCase}
                  setTestCases={setTestCases}
                  isSubmitting={isSubmitting}
                  isEditMode={isEditMode}
                  handleUpdateProblem={handleUpdateProblem}
                  handlePublishProblem={handlePublishProblem}
                  resetForm={resetForm}
                />
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
